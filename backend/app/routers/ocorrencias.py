import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from sqlalchemy.orm import Session

from app.config import PASTA_UPLOADS, TAMANHO_MAXIMO_MB
from app.database import obter_sessao
from app.dependencias import apenas_admin, usuario_logado
from app.models import HistoricoStatus, Ocorrencia, Usuario
from app.schemas import (
    Categoria,
    HistoricoResposta,
    OcorrenciaDetalhe,
    OcorrenciaResposta,
    StatusAlterar,
)

router = APIRouter(prefix="/ocorrencias", tags=["Ocorrências"])

NOMES_CATEGORIA = {
    "buraco": "Buraco na via",
    "iluminacao": "Iluminação pública",
    "lixo": "Lixo acumulado",
    "vazamento": "Vazamento",
    "outros": "Outros",
}


def detectar_tipo_imagem(inicio: bytes) -> str | None:
    """Descobre o tipo real da imagem pelos primeiros bytes do arquivo.
    Não confiamos no nome nem no tipo informado pelo usuário, que podem mentir."""
    if inicio.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if inicio.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if inicio[:4] == b"RIFF" and inicio[8:12] == b"WEBP":
        return ".webp"
    return None


def salvar_foto(foto: UploadFile) -> str:
    """Valida e guarda a foto. Devolve o nome do arquivo salvo."""
    limite = TAMANHO_MAXIMO_MB * 1024 * 1024
    conteudo = foto.file.read(limite + 1)  # lê um byte a mais só para detectar excesso

    if len(conteudo) > limite:
        raise HTTPException(status_code=413, detail=f"A foto deve ter no máximo {TAMANHO_MAXIMO_MB} MB.")

    extensao = detectar_tipo_imagem(conteudo[:12])
    if extensao is None:
        raise HTTPException(status_code=422, detail="O arquivo enviado não é uma imagem JPG, PNG ou WEBP.")

    # Nome aleatório: ignora o nome original, que poderia conter caminhos ou códigos.
    nome = f"{uuid.uuid4().hex}{extensao}"
    (PASTA_UPLOADS / nome).write_bytes(conteudo)
    return nome


def montar_detalhe(ocorrencia: Ocorrencia, para_admin: bool) -> OcorrenciaDetalhe:
    historico = [
        HistoricoResposta(
            status_anterior=h.status_anterior,
            status_novo=h.status_novo,
            alterado_em=h.alterado_em,
            admin_nome=h.admin.nome if para_admin else None,
        )
        for h in sorted(ocorrencia.historico, key=lambda h: h.alterado_em)
    ]
    base = OcorrenciaResposta.model_validate(ocorrencia).model_dump()
    return OcorrenciaDetalhe(
        **base,
        autor_nome=ocorrencia.usuario.nome if para_admin else None,
        historico=historico,
    )


@router.post("", response_model=OcorrenciaResposta, status_code=201)
def criar_ocorrencia(
    categoria: Categoria = Form(),
    descricao: str | None = Form(default=None, max_length=2000),
    regiao: str | None = Form(default=None, max_length=100),
    latitude: float | None = Form(default=None, ge=-90, le=90),
    longitude: float | None = Form(default=None, ge=-180, le=180),
    foto: UploadFile | None = File(default=None),
    sessao: Session = Depends(obter_sessao),
    usuario: Usuario = Depends(usuario_logado),
):
    regiao = regiao.strip() if regiao else None
    descricao = descricao.strip() if descricao else None

    # Latitude e longitude andam juntas.
    if (latitude is None) != (longitude is None):
        raise HTTPException(status_code=422, detail="Informe latitude e longitude juntas.")

    # É preciso saber onde fica o problema.
    if not regiao and latitude is None:
        raise HTTPException(status_code=422, detail="Informe a localização do problema.")

    nome_foto = salvar_foto(foto) if foto and foto.filename else None

    ocorrencia = Ocorrencia(
        titulo=NOMES_CATEGORIA[categoria],
        descricao=descricao,
        categoria=categoria,
        foto=nome_foto,
        latitude=latitude,
        longitude=longitude,
        regiao=regiao,
        usuario_id=usuario.id,  # vem do login, nunca do formulário
        status="aberto",
    )
    try:
        sessao.add(ocorrencia)
        sessao.commit()
    except Exception:
        # Se o banco falhar, não deixa uma foto órfã no disco.
        sessao.rollback()
        if nome_foto:
            (PASTA_UPLOADS / nome_foto).unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail="Não foi possível salvar a ocorrência.")

    sessao.refresh(ocorrencia)
    return ocorrencia


# Usuário comum vê só as suas; administrador vê todas.
@router.get("", response_model=list[OcorrenciaResposta])
def listar_ocorrencias(
    sessao: Session = Depends(obter_sessao),
    usuario: Usuario = Depends(usuario_logado),
):
    consulta = sessao.query(Ocorrencia)
    if usuario.tipo != "admin":
        consulta = consulta.filter(Ocorrencia.usuario_id == usuario.id)
    return consulta.order_by(Ocorrencia.criado_em.desc()).all()


@router.get("/{ocorrencia_id}", response_model=OcorrenciaDetalhe)
def buscar_ocorrencia(
    ocorrencia_id: int,
    sessao: Session = Depends(obter_sessao),
    usuario: Usuario = Depends(usuario_logado),
):
    ocorrencia = sessao.get(Ocorrencia, ocorrencia_id)
    if not ocorrencia or (usuario.tipo != "admin" and ocorrencia.usuario_id != usuario.id):
        raise HTTPException(status_code=404, detail="Ocorrência não encontrada.")
    return montar_detalhe(ocorrencia, para_admin=usuario.tipo == "admin")


# Alterar status: SÓ administrador. Registra o histórico da mudança.
@router.patch("/{ocorrencia_id}/status", response_model=OcorrenciaDetalhe)
def alterar_status(
    ocorrencia_id: int,
    dados: StatusAlterar,
    sessao: Session = Depends(obter_sessao),
    admin: Usuario = Depends(apenas_admin),
):
    ocorrencia = sessao.get(Ocorrencia, ocorrencia_id)
    if not ocorrencia:
        raise HTTPException(status_code=404, detail="Ocorrência não encontrada.")

    if ocorrencia.status != dados.status:
        sessao.add(
            HistoricoStatus(
                ocorrencia_id=ocorrencia.id,
                status_anterior=ocorrencia.status,
                status_novo=dados.status,
                admin_id=admin.id,
            )
        )
        ocorrencia.status = dados.status
        sessao.commit()
        sessao.refresh(ocorrencia)
    return montar_detalhe(ocorrencia, para_admin=True)


def buscar_do_dono(sessao: Session, ocorrencia_id: int, usuario: Usuario) -> Ocorrencia:
    """Devolve a ocorrência só se for do usuário logado e ainda estiver aberta.
    Quem não é dono recebe 404 (não revelamos que a ocorrência existe)."""
    ocorrencia = sessao.get(Ocorrencia, ocorrencia_id)
    if not ocorrencia or ocorrencia.usuario_id != usuario.id:
        raise HTTPException(status_code=404, detail="Ocorrência não encontrada.")
    if ocorrencia.status != "aberto":
        raise HTTPException(
            status_code=409,
            detail="Só é possível alterar ou excluir ocorrências que ainda estão abertas.",
        )
    return ocorrencia


# Editar: só o dono, e só enquanto estiver "aberto".
@router.put("/{ocorrencia_id}", response_model=OcorrenciaDetalhe)
def editar_ocorrencia(
    ocorrencia_id: int,
    categoria: Categoria = Form(),
    descricao: str | None = Form(default=None, max_length=2000),
    regiao: str | None = Form(default=None, max_length=100),
    latitude: float | None = Form(default=None, ge=-90, le=90),
    longitude: float | None = Form(default=None, ge=-180, le=180),
    remover_foto: bool = Form(default=False),
    foto: UploadFile | None = File(default=None),
    sessao: Session = Depends(obter_sessao),
    usuario: Usuario = Depends(usuario_logado),
):
    ocorrencia = buscar_do_dono(sessao, ocorrencia_id, usuario)

    regiao = regiao.strip() if regiao else None
    descricao = descricao.strip() if descricao else None
    if (latitude is None) != (longitude is None):
        raise HTTPException(status_code=422, detail="Informe latitude e longitude juntas.")
    if not regiao and latitude is None:
        raise HTTPException(status_code=422, detail="Informe a localização do problema.")

    foto_antiga = ocorrencia.foto
    nova_foto = salvar_foto(foto) if foto and foto.filename else None

    ocorrencia.titulo = NOMES_CATEGORIA[categoria]
    ocorrencia.categoria = categoria
    ocorrencia.descricao = descricao
    ocorrencia.regiao = regiao
    ocorrencia.latitude = latitude
    ocorrencia.longitude = longitude
    if nova_foto:
        ocorrencia.foto = nova_foto
    elif remover_foto:
        ocorrencia.foto = None

    try:
        sessao.commit()
    except Exception:
        sessao.rollback()
        if nova_foto:
            (PASTA_UPLOADS / nova_foto).unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail="Não foi possível salvar as alterações.")

    # Só apaga a foto antiga depois que o banco confirmou a alteração.
    if foto_antiga and foto_antiga != ocorrencia.foto:
        (PASTA_UPLOADS / foto_antiga).unlink(missing_ok=True)

    sessao.refresh(ocorrencia)
    return montar_detalhe(ocorrencia, para_admin=False)


# Excluir: só o dono, e só enquanto estiver "aberto".
@router.delete("/{ocorrencia_id}", status_code=204)
def excluir_ocorrencia(
    ocorrencia_id: int,
    sessao: Session = Depends(obter_sessao),
    usuario: Usuario = Depends(usuario_logado),
):
    ocorrencia = buscar_do_dono(sessao, ocorrencia_id, usuario)
    foto = ocorrencia.foto
    try:
        for h in list(ocorrencia.historico):
            sessao.delete(h)
        sessao.delete(ocorrencia)
        sessao.commit()
    except Exception:
        sessao.rollback()
        raise HTTPException(status_code=500, detail="Não foi possível excluir a ocorrência.")
    if foto:
        (PASTA_UPLOADS / foto).unlink(missing_ok=True)
    return Response(status_code=204)
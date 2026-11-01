from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import obter_sessao
from app.dependencias import apenas_admin, usuario_logado
from app.models import HistoricoStatus, Ocorrencia, Usuario
from app.schemas import OcorrenciaCriar, OcorrenciaResposta, StatusAlterar

router = APIRouter(prefix="/ocorrencias", tags=["Ocorrências"])


@router.post("", response_model=OcorrenciaResposta, status_code=201)
def criar_ocorrencia(
    dados: OcorrenciaCriar,
    sessao: Session = Depends(obter_sessao),
    usuario: Usuario = Depends(usuario_logado),
):
    ocorrencia = Ocorrencia(
        titulo=dados.titulo.strip(),
        descricao=dados.descricao,
        categoria=dados.categoria,
        latitude=dados.latitude,
        longitude=dados.longitude,
        regiao=dados.regiao,
        usuario_id=usuario.id,  # vem do login, nunca do formulário
        status="aberto",
    )
    sessao.add(ocorrencia)
    sessao.commit()
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


@router.get("/{ocorrencia_id}", response_model=OcorrenciaResposta)
def buscar_ocorrencia(
    ocorrencia_id: int,
    sessao: Session = Depends(obter_sessao),
    usuario: Usuario = Depends(usuario_logado),
):
    ocorrencia = sessao.get(Ocorrencia, ocorrencia_id)
    # Se não for dono (e não for admin), responde "não encontrada":
    # assim ninguém descobre quais ids existem.
    if not ocorrencia or (usuario.tipo != "admin" and ocorrencia.usuario_id != usuario.id):
        raise HTTPException(status_code=404, detail="Ocorrência não encontrada.")
    return ocorrencia


# Alterar status: SÓ administrador. Registra o histórico da mudança.
@router.patch("/{ocorrencia_id}/status", response_model=OcorrenciaResposta)
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
    return ocorrencia
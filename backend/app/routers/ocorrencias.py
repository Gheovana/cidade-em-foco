from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import obter_sessao
from app.models import Ocorrencia, Usuario
from app.schemas import OcorrenciaCriar, OcorrenciaResposta

router = APIRouter(prefix="/ocorrencias", tags=["Ocorrências"])


@router.post("", response_model=OcorrenciaResposta, status_code=201)
def criar_ocorrencia(dados: OcorrenciaCriar, sessao: Session = Depends(obter_sessao)):
    # Verifica se o usuário informado existe antes de salvar.
    if not sessao.get(Usuario, dados.usuario_id):
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    ocorrencia = Ocorrencia(
        titulo=dados.titulo.strip(),
        descricao=dados.descricao,
        categoria=dados.categoria,
        latitude=dados.latitude,
        longitude=dados.longitude,
        regiao=dados.regiao,
        usuario_id=dados.usuario_id,
        status="aberto",  # toda ocorrência nasce aberta
    )
    sessao.add(ocorrencia)
    sessao.commit()
    sessao.refresh(ocorrencia)
    return ocorrencia


@router.get("", response_model=list[OcorrenciaResposta])
def listar_ocorrencias(sessao: Session = Depends(obter_sessao)):
    # As mais recentes primeiro.
    return sessao.query(Ocorrencia).order_by(Ocorrencia.criado_em.desc()).all()


@router.get("/{ocorrencia_id}", response_model=OcorrenciaResposta)
def buscar_ocorrencia(ocorrencia_id: int, sessao: Session = Depends(obter_sessao)):
    ocorrencia = sessao.get(Ocorrencia, ocorrencia_id)
    if not ocorrencia:
        raise HTTPException(status_code=404, detail="Ocorrência não encontrada.")
    return ocorrencia
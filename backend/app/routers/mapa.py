from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.database import obter_sessao
from app.dependencias import usuario_logado
from app.models import Ocorrencia, Usuario

router = APIRouter(prefix="/mapa", tags=["Mapa"])


class PontoMapa(BaseModel):
    """Só o necessário para desenhar o marcador. Sem foto, descrição ou autor."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    categoria: str
    status: str
    regiao: Optional[str]
    latitude: float
    longitude: float


# Qualquer usuário logado vê os pontos de toda a cidade (dados mínimos).
@router.get("", response_model=list[PontoMapa])
def listar_pontos(
    sessao: Session = Depends(obter_sessao),
    _usuario: Usuario = Depends(usuario_logado),
):
    return (
        sessao.query(Ocorrencia)
        .filter(Ocorrencia.latitude.isnot(None), Ocorrencia.longitude.isnot(None))
        .all()
    )
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

# Valores permitidos. Qualquer outro será recusado automaticamente.
Categoria = Literal["buraco", "iluminacao", "lixo", "vazamento", "outros"]
StatusOcorrencia = Literal["aberto", "em_andamento", "resolvido"]


# ---------- Usuários ----------
class UsuarioCriar(BaseModel):
    """Dados que o Angular envia para cadastrar um usuário."""
    nome: str = Field(min_length=2, max_length=100)
    email: str = Field(max_length=150, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    senha: str = Field(min_length=6, max_length=100)
    # Repare: não existe campo "tipo". Ninguém se cadastra como admin.


class UsuarioResposta(BaseModel):
    """Dados que a API devolve. Não inclui senha nem hash."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    email: str
    tipo: str


# ---------- Ocorrências ----------
class OcorrenciaCriar(BaseModel):
    """Dados que o Angular envia para registrar uma ocorrência."""
    titulo: str = Field(min_length=3, max_length=150)
    descricao: Optional[str] = Field(default=None, max_length=2000)
    categoria: Categoria
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    regiao: Optional[str] = Field(default=None, max_length=100)
    # TEMPORÁRIO: na Etapa 10 o usuário virá do login, não do formulário.
    usuario_id: int


class OcorrenciaResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    titulo: str
    descricao: Optional[str]
    categoria: str
    foto: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    regiao: Optional[str]
    status: str
    criado_em: datetime
    usuario_id: int
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import obter_sessao
from app.models import Usuario
from app.seguranca import ler_token

# Lê o cabeçalho "Authorization: Bearer <token>" de cada requisição.
esquema = HTTPBearer(auto_error=False)


def usuario_logado(
    credenciais: HTTPAuthorizationCredentials | None = Depends(esquema),
    sessao: Session = Depends(obter_sessao),
) -> Usuario:
    """Guarda 1: exige login. Devolve o usuário dono do token."""
    erro = HTTPException(status_code=401, detail="Faça login para continuar.")
    if credenciais is None:
        raise erro
    usuario_id = ler_token(credenciais.credentials)
    if usuario_id is None:
        raise erro
    usuario = sessao.get(Usuario, usuario_id)
    if usuario is None:
        raise erro
    return usuario


def apenas_admin(usuario: Usuario = Depends(usuario_logado)) -> Usuario:
    """Guarda 2: exige login E que o usuário seja administrador."""
    if usuario.tipo != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores.")
    return usuario
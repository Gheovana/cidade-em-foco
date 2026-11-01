from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import obter_sessao
from app.dependencias import usuario_logado
from app.models import Usuario
from app.schemas import UsuarioResposta
from app.seguranca import criar_token, gerar_hash, verificar_senha

router = APIRouter(prefix="/auth", tags=["Autenticação"])

# Hash de uma senha qualquer, usado para gastar o mesmo tempo quando o
# e-mail não existe. Assim ninguém descobre quais e-mails estão cadastrados
# medindo o tempo de resposta.
HASH_FALSO = gerar_hash("senha-falsa-para-igualar-o-tempo")


class LoginDados(BaseModel):
    email: str
    senha: str


class LoginResposta(BaseModel):
    token: str
    usuario: UsuarioResposta


@router.post("/login", response_model=LoginResposta)
def login(dados: LoginDados, sessao: Session = Depends(obter_sessao)):
    email = dados.email.strip().lower()
    usuario = sessao.query(Usuario).filter(Usuario.email == email).first()

    # Mesma mensagem para e-mail inexistente e senha errada.
    hash_conferido = usuario.senha_hash if usuario else HASH_FALSO
    senha_ok = verificar_senha(dados.senha, hash_conferido)
    if usuario is None or not senha_ok:
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.")

    return {"token": criar_token(usuario.id), "usuario": usuario}


@router.get("/eu", response_model=UsuarioResposta)
def quem_sou_eu(usuario: Usuario = Depends(usuario_logado)):
    return usuario
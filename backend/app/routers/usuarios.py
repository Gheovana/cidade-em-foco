from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import obter_sessao
from app.dependencias import apenas_admin
from app.models import Usuario
from app.schemas import UsuarioCriar, UsuarioResposta
from app.seguranca import gerar_hash

router = APIRouter(prefix="/usuarios", tags=["Usuários"])


# Cadastro é aberto: qualquer pessoa pode criar a sua conta.
@router.post("", response_model=UsuarioResposta, status_code=201)
def criar_usuario(dados: UsuarioCriar, sessao: Session = Depends(obter_sessao)):
    email = dados.email.strip().lower()

    if sessao.query(Usuario).filter(Usuario.email == email).first():
        raise HTTPException(status_code=409, detail="Este e-mail já está cadastrado.")

    usuario = Usuario(
        nome=dados.nome.strip(),
        email=email,
        senha_hash=gerar_hash(dados.senha),
        tipo="comum",  # sempre comum; o admin é criado por script
    )
    sessao.add(usuario)
    sessao.commit()
    sessao.refresh(usuario)
    return usuario


# Listar todos os usuários: SÓ administrador.
@router.get("", response_model=list[UsuarioResposta])
def listar_usuarios(
    sessao: Session = Depends(obter_sessao),
    _admin: Usuario = Depends(apenas_admin),
):
    return sessao.query(Usuario).all()
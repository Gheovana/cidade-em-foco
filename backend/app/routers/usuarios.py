from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import obter_sessao
from app.models import Usuario
from app.schemas import UsuarioCriar, UsuarioResposta
from app.seguranca import gerar_hash

router = APIRouter(prefix="/usuarios", tags=["Usuários"])


@router.post("", response_model=UsuarioResposta, status_code=201)
def criar_usuario(dados: UsuarioCriar, sessao: Session = Depends(obter_sessao)):
    email = dados.email.strip().lower()

    # Não permite dois cadastros com o mesmo e-mail.
    if sessao.query(Usuario).filter(Usuario.email == email).first():
        raise HTTPException(status_code=409, detail="Este e-mail já está cadastrado.")

    usuario = Usuario(
        nome=dados.nome.strip(),
        email=email,
        senha_hash=gerar_hash(dados.senha),
        tipo="comum",  # sempre comum; o admin será criado de outra forma
    )
    sessao.add(usuario)
    sessao.commit()
    sessao.refresh(usuario)  # recarrega para obter o id gerado pelo banco
    return usuario


# TEMPORÁRIO: na Etapa 10 esta rota será restrita a administradores.
@router.get("", response_model=list[UsuarioResposta])
def listar_usuarios(sessao: Session = Depends(obter_sessao)):
    return sessao.query(Usuario).all()
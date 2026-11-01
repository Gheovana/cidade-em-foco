"""Cria (ou promove) um administrador.

Uso, na pasta backend, com o venv ativo:
    python criar_admin.py
"""
import getpass

from app.database import Base, SessionLocal, engine
from app.models import Usuario
from app.seguranca import gerar_hash

Base.metadata.create_all(bind=engine)

nome = input("Nome do administrador: ").strip()
email = input("E-mail: ").strip().lower()
senha = getpass.getpass("Senha (não aparece enquanto você digita): ")

if len(nome) < 2 or "@" not in email or len(senha) < 6:
    raise SystemExit("Dados inválidos. A senha precisa ter ao menos 6 caracteres.")

sessao = SessionLocal()
usuario = sessao.query(Usuario).filter(Usuario.email == email).first()

if usuario:
    usuario.tipo = "admin"
    print("Usuário já existia: agora é administrador.")
else:
    sessao.add(Usuario(nome=nome, email=email, senha_hash=gerar_hash(senha), tipo="admin"))
    print("Administrador criado.")

sessao.commit()
sessao.close()
"""Troca o administrador do sistema.

Uso, na pasta backend, com o venv ativo:
    python trocar_admin.py
"""
import getpass

from app.database import Base, SessionLocal, engine
from app.models import HistoricoStatus, Ocorrencia, Usuario
from app.seguranca import gerar_hash

Base.metadata.create_all(bind=engine)
sessao = SessionLocal()

admins = sessao.query(Usuario).filter(Usuario.tipo == "admin").all()
print("\nAdministradores atuais:")
if admins:
    for a in admins:
        print(f"  - {a.nome} <{a.email}>")
else:
    print("  (nenhum)")

print("\nDados do NOVO administrador:")
nome = input("Nome: ").strip()
email = input("E-mail: ").strip().lower()
senha = getpass.getpass("Senha (não aparece enquanto você digita): ")
confirmar = getpass.getpass("Repita a senha: ")

if len(nome) < 2 or "@" not in email or len(senha) < 6:
    raise SystemExit("Dados inválidos. A senha precisa ter ao menos 6 caracteres.")
if senha != confirmar:
    raise SystemExit("As senhas não são iguais. Nada foi alterado.")

antigos = [a for a in admins if a.email != email]
if antigos:
    print("\nEstes administradores perderão o acesso de admin:")
    for a in antigos:
        print(f"  - {a.nome} <{a.email}>")
if input("\nContinuar? (s/n): ").strip().lower() != "s":
    raise SystemExit("Cancelado. Nada foi alterado.")

# Cria o novo admin ou atualiza a conta que já existe com esse e-mail.
novo = sessao.query(Usuario).filter(Usuario.email == email).first()
if novo:
    novo.nome = nome
    novo.tipo = "admin"
    novo.senha_hash = gerar_hash(senha)
    print("\nConta existente atualizada: agora é administrador, com a nova senha.")
else:
    sessao.add(Usuario(nome=nome, email=email, senha_hash=gerar_hash(senha), tipo="admin"))
    print("\nNovo administrador criado.")

# Retira o acesso dos administradores antigos.
for a in antigos:
    tem_dados = (
        sessao.query(Ocorrencia).filter(Ocorrencia.usuario_id == a.id).first()
        or sessao.query(HistoricoStatus).filter(HistoricoStatus.admin_id == a.id).first()
    )
    if tem_dados:
        a.tipo = "comum"
        print(f"{a.email}: virou usuário comum (tem histórico no sistema).")
    else:
        sessao.delete(a)
        print(f"{a.email}: conta removida.")

sessao.commit()
sessao.close()
print("\nPronto!")
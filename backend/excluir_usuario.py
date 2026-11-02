"""Exclui uma conta e tudo que está ligado a ela.

Uso, na pasta backend, com o venv ativo:
    python excluir_usuario.py
"""
from app.config import PASTA_UPLOADS
from app.database import Base, SessionLocal, engine
from app.models import HistoricoStatus, Ocorrencia, Usuario

Base.metadata.create_all(bind=engine)
sessao = SessionLocal()

email = input("E-mail da conta que será EXCLUÍDA: ").strip().lower()
usuario = sessao.query(Usuario).filter(Usuario.email == email).first()
if usuario is None:
    raise SystemExit("Nenhuma conta com esse e-mail. Nada foi alterado.")

# Nunca deixa o sistema sem administrador.
if usuario.tipo == "admin":
    total_admins = sessao.query(Usuario).filter(Usuario.tipo == "admin").count()
    if total_admins == 1:
        raise SystemExit(
            "Esta é a única conta de administrador. "
            "Crie outro admin antes (python trocar_admin.py)."
        )

ocorrencias = sessao.query(Ocorrencia).filter(Ocorrencia.usuario_id == usuario.id).all()
alteracoes = sessao.query(HistoricoStatus).filter(HistoricoStatus.admin_id == usuario.id).count()

print(f"\nConta: {usuario.nome} <{usuario.email}> ({usuario.tipo})")
print(f"  Ocorrências registradas por ela: {len(ocorrencias)}")
print(f"  Alterações de status feitas por ela: {alteracoes}")
print("\nTUDO isso será apagado e não dá para desfazer.")

if input("Para confirmar, digite o e-mail novamente: ").strip().lower() != email:
    raise SystemExit("E-mail diferente. Cancelado, nada foi alterado.")

fotos = [o.foto for o in ocorrencias if o.foto]

# 1) Histórico das ocorrências dela e as próprias ocorrências.
for o in ocorrencias:
    sessao.query(HistoricoStatus).filter(HistoricoStatus.ocorrencia_id == o.id).delete()
    sessao.delete(o)
sessao.flush()

# 2) Alterações de status que ela fez (se era admin).
sessao.query(HistoricoStatus).filter(HistoricoStatus.admin_id == usuario.id).delete()

# 3) A conta.
sessao.expire(usuario)
sessao.delete(usuario)
sessao.commit()
sessao.close()

# 4) Fotos no disco (só depois que o banco confirmou).
for nome in fotos:
    (PASTA_UPLOADS / nome).unlink(missing_ok=True)

print("\nConta excluída.")

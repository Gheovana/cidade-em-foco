from fastapi import FastAPI

from app import models
from app.database import engine

# Cria no banco todas as tabelas definidas em models.py (se ainda não existirem).
models.Base.metadata.create_all(bind=engine)

# Cria a aplicação. Este objeto "app" é a nossa API.
app = FastAPI(
    title="Cidade em Foco - API",
    description="API para registro e acompanhamento de problemas urbanos.",
    version="0.1.0",
)


# Rota raiz: responde quando alguém acessa o endereço principal da API.
@app.get("/")
def raiz():
    return {"mensagem": "Bem-vindo à API do Cidade em Foco!"}


# Rota de saúde: serve para verificar se a API está funcionando.
@app.get("/saude")
def saude():
    return {"status": "ok"}
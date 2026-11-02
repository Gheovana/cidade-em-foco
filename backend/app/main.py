from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app import models
from app.config import PASTA_UPLOADS
from app.database import engine
from app.routers import auth, mapa, ocorrencias, relatorios, usuarios

# Cria no banco todas as tabelas definidas em models.py (se ainda não existirem).
models.Base.metadata.create_all(bind=engine)

# Cria a aplicação. Este objeto "app" é a nossa API.
app = FastAPI(
    title="Cidade em Foco - API",
    description="API para registro e acompanhamento de problemas urbanos.",
    version="0.1.0",
)

# CORS: só aceita pedidos vindos do site Angular local.
# Em produção, trocaríamos pelo endereço real do site.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://127.0.0.1:4200"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Conecta as rotas de cada arquivo à aplicação.
app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(ocorrencias.router)
app.include_router(mapa.router)
app.include_router(relatorios.router)

# Disponibiliza as fotos em /uploads/<nome-do-arquivo>.
app.mount("/uploads", StaticFiles(directory=PASTA_UPLOADS), name="uploads")


# Rota raiz: responde quando alguém acessa o endereço principal da API.
@app.get("/")
def raiz():
    return {"mensagem": "Bem-vindo à API do Cidade em Foco!"}


# Rota de saúde: serve para verificar se a API está funcionando.
@app.get("/saude")
def saude():
    return {"status": "ok"}
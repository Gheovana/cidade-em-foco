import logging
import time

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from app import models
from app.config import ORIGENS_PERMITIDAS, PASTA_UPLOADS
from app.database import engine
from app.routers import auth, mapa, ocorrencias, relatorios, usuarios

# Registros (logs) no console: uma linha por requisição e o detalhe de qualquer erro inesperado.
# Nunca registramos senhas, tokens nem o corpo das requisições.
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("cidade_em_foco")

# Cria no banco todas as tabelas definidas em models.py (se ainda não existirem).
models.Base.metadata.create_all(bind=engine)

DESCRICAO = """
API do **Cidade em Foco**: registro e acompanhamento de problemas urbanos.

**Como testar aqui no Swagger**
1. Faça `POST /auth/login` e copie o valor de `token` da resposta.
2. Clique em **Authorize** (cadeado, no topo) e cole o token.
3. Agora as rotas protegidas funcionam.

**Perfis**
- **comum:** vê, edita e exclui só as próprias ocorrências (enquanto abertas).
- **admin:** vê todas as ocorrências, altera o status e lista os usuários.

**Erros:** a API responde `400` (dados inválidos), `401` (sem login), `403` (sem permissão),
`404` (não encontrado), `409` (conflito), `413` (arquivo grande), `429` (muitas tentativas)
e `500` (erro inesperado), sempre com um campo `detail` em texto.
"""

TAGS = [
    {"name": "Sistema", "description": "Verificação de funcionamento da API."},
    {"name": "Autenticação", "description": "Login e identificação do usuário logado."},
    {"name": "Usuários", "description": "Cadastro (público) e listagem (somente admin)."},
    {"name": "Ocorrências", "description": "Registro, consulta, edição, exclusão e status das ocorrências."},
    {"name": "Mapa", "description": "Pontos das ocorrências, com dados mínimos."},
    {"name": "Relatórios", "description": "Totais por status, tipo e região."},
]

# Cria a aplicação. Este objeto "app" é a nossa API.
app = FastAPI(
    title="Cidade em Foco - API",
    description=DESCRICAO,
    version="1.0.0",
    openapi_tags=TAGS,
)

# CORS: só aceita pedidos vindos dos sites autorizados (variável ORIGENS_PERMITIDAS).
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGENS_PERMITIDAS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def registrar_requisicoes(requisicao: Request, proxima):
    inicio = time.perf_counter()
    resposta = await proxima(requisicao)
    duracao_ms = (time.perf_counter() - inicio) * 1000
    log.info("%s %s -> %s (%.0f ms)", requisicao.method, requisicao.url.path, resposta.status_code, duracao_ms)
    return resposta


# Validação precoce: dados inválidos viram 400 (e não o 422 padrão), com a lista dos campos.
@app.exception_handler(RequestValidationError)
async def erro_de_validacao(requisicao: Request, erro: RequestValidationError):
    campos = []
    for e in erro.errors():
        nome = ".".join(str(p) for p in e["loc"] if p not in ("body", "query", "path", "form")) or "requisição"
        campos.append({"campo": nome, "erro": e["msg"]})
    nomes = ", ".join(dict.fromkeys(c["campo"] for c in campos))
    return JSONResponse(
        status_code=400,
        content={"detail": f"Dados inválidos. Confira os campos: {nomes}.", "campos": campos},
    )


# Tratamento centralizado: qualquer erro inesperado vira 500, é registrado no log
# e a API continua no ar. O usuário não vê detalhes internos.
@app.exception_handler(Exception)
async def erro_inesperado(requisicao: Request, erro: Exception):
    log.exception("Erro inesperado em %s %s", requisicao.method, requisicao.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno do servidor. Tente novamente mais tarde."},
    )


# Conecta as rotas de cada arquivo à aplicação.
app.include_router(usuarios.router)
app.include_router(ocorrencias.router)
app.include_router(mapa.router)
app.include_router(relatorios.router)
app.include_router(auth.router)

# Disponibiliza as fotos em /uploads/<nome-do-arquivo>.
app.mount("/uploads", StaticFiles(directory=PASTA_UPLOADS), name="uploads")


# Rota raiz: responde quando alguém acessa o endereço principal da API.
@app.get("/", tags=["Sistema"], summary="Mensagem de boas-vindas")
def raiz():
    return {"mensagem": "Bem-vindo à API do Cidade em Foco!"}


# Rota de saúde (healthcheck): serve para verificar se a API está funcionando.
@app.get("/saude", tags=["Sistema"], summary="Verificar se a API está no ar")
def saude():
    return {"status": "ok"}


# Atalho: /api-docs leva para o Swagger interativo, que o FastAPI publica em /docs.
@app.get("/api-docs", include_in_schema=False)
def atalho_documentacao():
    return RedirectResponse(url="/docs")
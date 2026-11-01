from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Endereço do banco. "sqlite:///./cidade_em_foco.db" significa:
# use SQLite e guarde tudo no arquivo cidade_em_foco.db, na pasta backend.
URL_BANCO = "sqlite:///./cidade_em_foco.db"

# O "engine" é a conexão em si com o banco.
# check_same_thread=False é necessário no SQLite quando usado com FastAPI.
engine = create_engine(URL_BANCO, connect_args={"check_same_thread": False})

# Cada requisição à API abrirá uma "sessão": uma conversa com o banco.
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# Base é a classe-mãe de todas as nossas tabelas (models).
Base = declarative_base()


# Função que entrega uma sessão para as rotas e a fecha no final.
# Vamos usá-la nas rotas da Etapa 6.
def obter_sessao():
    sessao = SessionLocal()
    try:
        yield sessao
    finally:
        sessao.close()
import os
from pathlib import Path

# Pasta "backend" (a que contém a pasta app).
PASTA_BACKEND = Path(__file__).resolve().parent.parent


def _carregar_env() -> None:
    """Lê o arquivo backend/.env (se existir) e coloca os valores nas variáveis de ambiente.
    Se a variável já existir no sistema (como acontece numa hospedagem), ela é mantida."""
    arquivo = PASTA_BACKEND / ".env"
    if not arquivo.exists():
        return
    for linha in arquivo.read_text(encoding="utf-8").splitlines():
        linha = linha.strip()
        if not linha or linha.startswith("#") or "=" not in linha:
            continue
        nome, valor = linha.split("=", 1)
        os.environ.setdefault(nome.strip(), valor.strip().strip('"').strip("'"))


_carregar_env()

# Pasta onde as fotos enviadas ficam guardadas (backend/uploads).
# Ela está no .gitignore: fotos são dados, não código.
PASTA_UPLOADS = PASTA_BACKEND / "uploads"
PASTA_UPLOADS.mkdir(exist_ok=True)

TAMANHO_MAXIMO_MB = 5

# Chave secreta dos tokens de login. Se a variável CHAVE_SECRETA não existir,
# o sistema usa o arquivo chave_secreta.txt (veja seguranca.py).
CHAVE_SECRETA_AMBIENTE = os.getenv("CHAVE_SECRETA")

# Endereços de sites autorizados a chamar a API (CORS), separados por vírgula.
ORIGENS_PERMITIDAS = [
    origem.strip()
    for origem in os.getenv(
        "ORIGENS_PERMITIDAS", "http://localhost:4200,http://127.0.0.1:4200"
    ).split(",")
    if origem.strip()
]
from pathlib import Path

# Pasta onde as fotos enviadas ficam guardadas (backend/uploads).
# Ela está no .gitignore: fotos são dados, não código.
PASTA_UPLOADS = Path(__file__).resolve().parent.parent / "uploads"
PASTA_UPLOADS.mkdir(exist_ok=True)

TAMANHO_MAXIMO_MB = 5
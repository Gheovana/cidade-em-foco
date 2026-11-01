import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt

# Quantas vezes o algoritmo repete o cálculo do hash da senha.
ITERACOES = 600_000

# O token vale por 8 horas. Depois disso, o usuário precisa entrar de novo.
HORAS_VALIDADE = 8
ALGORITMO = "HS256"

# A chave secreta fica num arquivo local (chave_secreta.txt), criado
# automaticamente na primeira execução. Ele está no .gitignore e NUNCA
# deve ser publicado: quem tem a chave consegue forjar tokens.
ARQUIVO_CHAVE = Path(__file__).resolve().parent.parent / "chave_secreta.txt"


def _obter_chave() -> str:
    if ARQUIVO_CHAVE.exists():
        return ARQUIVO_CHAVE.read_text().strip()
    chave = secrets.token_hex(32)
    ARQUIVO_CHAVE.write_text(chave)
    return chave


CHAVE_SECRETA = _obter_chave()


def gerar_hash(senha: str) -> str:
    """Transforma a senha em um texto irreversível para guardar no banco."""
    sal = os.urandom(16)
    resultado = hashlib.pbkdf2_hmac("sha256", senha.encode(), sal, ITERACOES)
    return f"{ITERACOES}${sal.hex()}${resultado.hex()}"


def verificar_senha(senha: str, senha_hash: str) -> bool:
    """Confere se a senha digitada corresponde ao hash guardado."""
    iteracoes, sal_hex, hash_hex = senha_hash.split("$")
    resultado = hashlib.pbkdf2_hmac(
        "sha256", senha.encode(), bytes.fromhex(sal_hex), int(iteracoes)
    )
    return hmac.compare_digest(resultado.hex(), hash_hex)


def criar_token(usuario_id: int) -> str:
    """Cria um token assinado que identifica o usuário."""
    validade = datetime.now(timezone.utc) + timedelta(hours=HORAS_VALIDADE)
    dados = {"sub": str(usuario_id), "exp": validade}
    return jwt.encode(dados, CHAVE_SECRETA, algorithm=ALGORITMO)


def ler_token(token: str) -> int | None:
    """Devolve o id do usuário se o token for válido; senão, None."""
    try:
        dados = jwt.decode(token, CHAVE_SECRETA, algorithms=[ALGORITMO])
        return int(dados["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None
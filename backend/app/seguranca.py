import hashlib
import hmac
import os

# Quantas vezes o algoritmo repete o cálculo. Mais repetições = mais lento
# para quem tenta adivinhar senhas por força bruta.
ITERACOES = 600_000


def gerar_hash(senha: str) -> str:
    """Transforma a senha em um texto irreversível para guardar no banco."""
    sal = os.urandom(16)  # valor aleatório, diferente para cada usuário
    resultado = hashlib.pbkdf2_hmac("sha256", senha.encode(), sal, ITERACOES)
    return f"{ITERACOES}${sal.hex()}${resultado.hex()}"


def verificar_senha(senha: str, senha_hash: str) -> bool:
    """Confere se a senha digitada corresponde ao hash guardado."""
    iteracoes, sal_hex, hash_hex = senha_hash.split("$")
    resultado = hashlib.pbkdf2_hmac(
        "sha256", senha.encode(), bytes.fromhex(sal_hex), int(iteracoes)
    )
    return hmac.compare_digest(resultado.hex(), hash_hex)
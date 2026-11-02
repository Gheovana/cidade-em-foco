from collections import Counter
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import obter_sessao
from app.dependencias import usuario_logado
from app.models import Ocorrencia, Usuario

router = APIRouter(prefix="/relatorios", tags=["Relatórios"])

NOMES_CATEGORIA = {
    "buraco": "Buraco na via",
    "iluminacao": "Iluminação pública",
    "lixo": "Lixo acumulado",
    "vazamento": "Vazamento",
    "outros": "Outros",
}

SEM_REGIAO = "Não informada"
LIMITE_REGIOES = 10
LIMITE_PRIORITARIAS = 3


class Contagem(BaseModel):
    nome: str
    total: int


class Relatorio(BaseModel):
    # "geral" = todas as ocorrências (admin); "pessoal" = só as do usuário.
    escopo: Literal["geral", "pessoal"]
    total: int
    abertas: int
    em_andamento: int
    resolvidas: int
    por_tipo: list[Contagem]
    por_regiao: list[Contagem]
    regioes_prioritarias: list[Contagem]


@router.get("", response_model=Relatorio)
def gerar_relatorio(
    sessao: Session = Depends(obter_sessao),
    usuario: Usuario = Depends(usuario_logado),
):
    consulta = sessao.query(Ocorrencia)
    ehadmin = usuario.tipo == "admin"
    if not ehadmin:
        consulta = consulta.filter(Ocorrencia.usuario_id == usuario.id)

    linhas = consulta.with_entities(
        Ocorrencia.categoria, Ocorrencia.status, Ocorrencia.regiao
    ).all()

    por_status = Counter()
    por_tipo = Counter()
    # chave normalizada -> [nome para exibir, total, pendentes]
    regioes: dict[str, list] = {}

    for categoria, status, regiao in linhas:
        por_status[status] += 1
        por_tipo[NOMES_CATEGORIA.get(categoria, categoria)] += 1

        nome = (regiao or "").strip() or SEM_REGIAO
        chave = nome.casefold()
        if chave not in regioes:
            regioes[chave] = [nome, 0, 0]
        regioes[chave][1] += 1
        if status != "resolvido":
            regioes[chave][2] += 1

    por_regiao = sorted(regioes.values(), key=lambda r: r[1], reverse=True)

    prioritarias = sorted(
        (r for chave, r in regioes.items() if chave != SEM_REGIAO.casefold() and r[2] > 0),
        key=lambda r: r[2],
        reverse=True,
    )

    return Relatorio(
        escopo="geral" if ehadmin else "pessoal",
        total=len(linhas),
        abertas=por_status["aberto"],
        em_andamento=por_status["em_andamento"],
        resolvidas=por_status["resolvido"],
        por_tipo=[Contagem(nome=n, total=t) for n, t in por_tipo.most_common()],
        por_regiao=[Contagem(nome=r[0], total=r[1]) for r in por_regiao[:LIMITE_REGIOES]],
        regioes_prioritarias=[
            Contagem(nome=r[0], total=r[2]) for r in prioritarias[:LIMITE_PRIORITARIAS]
        ],
    )
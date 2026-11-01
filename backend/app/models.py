from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    senha_hash = Column(String(255), nullable=False)  # nunca a senha em texto puro
    tipo = Column(String(20), nullable=False, default="comum")  # "comum" ou "admin"

    # Um usuário pode ter várias ocorrências.
    ocorrencias = relationship("Ocorrencia", back_populates="usuario")


class Ocorrencia(Base):
    __tablename__ = "ocorrencias"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(150), nullable=False)
    descricao = Column(Text, nullable=True)
    categoria = Column(String(50), nullable=False)  # buraco, iluminacao, lixo, vazamento, outros
    foto = Column(String(255), nullable=True)  # nome do arquivo da foto
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    regiao = Column(String(100), nullable=True)  # bairro ou endereço
    status = Column(String(20), nullable=False, default="aberto")  # aberto, em_andamento, resolvido
    criado_em = Column(DateTime, default=datetime.now, nullable=False)

    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)

    usuario = relationship("Usuario", back_populates="ocorrencias")
    historico = relationship("HistoricoStatus", back_populates="ocorrencia")


class HistoricoStatus(Base):
    __tablename__ = "historico_status"

    id = Column(Integer, primary_key=True, index=True)
    status_anterior = Column(String(20), nullable=False)
    status_novo = Column(String(20), nullable=False)
    alterado_em = Column(DateTime, default=datetime.now, nullable=False)

    ocorrencia_id = Column(Integer, ForeignKey("ocorrencias.id"), nullable=False)
    admin_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)

    ocorrencia = relationship("Ocorrencia", back_populates="historico")
    admin = relationship("Usuario")
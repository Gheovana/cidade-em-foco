# Cidade em Foco

Denúncias de problemas urbanos por uma cidade melhor!

Portal web em que moradores registram problemas da cidade (buracos, iluminação, lixo, vazamentos e outros), anexam foto, informam a localização e acompanham o andamento. Administradores veem todas as ocorrências, alteram o status e consultam relatórios.

> Protótipo desenvolvido para apresentação.

## Funcionalidades

**Cidadão**
- Cadastro e login
- Registrar ocorrência com categoria, descrição, foto e localização (endereço, localização atual ou clique no mapa)
- Acompanhar as próprias solicitações, com filtros e histórico de status
- Mapa com as ocorrências da cidade, coloridas por status
- Relatório pessoal

**Administrador**
- Ver todas as ocorrências e alterar o status (aberta, em andamento, resolvida), com histórico
- Lista de usuários
- Relatório geral, com as regiões prioritárias

## Tecnologias

- Backend: Python, FastAPI, SQLAlchemy, Pydantic, SQLite
- Frontend: Angular, TypeScript, HTML e CSS
- Mapa: Leaflet e OpenStreetMap

## Segurança

- Senhas guardadas com hash (PBKDF2-SHA256 com salt), nunca em texto puro
- Login com token JWT e limite de tentativas (5 erros em 5 minutos)
- Permissões conferidas no backend (usuário comum x administrador)
- Cadastro público sempre cria usuário comum; administrador só é criado por script
- Upload de foto validado pelo conteúdo real do arquivo (JPG, PNG ou WEBP, até 5 MB)
- Dados validados pelo backend; o mapa público não expõe descrição, foto nem autor

## Como executar no Windows

Requisitos: Python 3, Node.js e Angular CLI.

**Primeira vez**

Backend (PowerShell):

```
cd CidadeEmFoco\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python criar_admin.py
```

Frontend (outro PowerShell):

```
cd CidadeEmFoco\frontend
npm install
```

**Dia a dia: dois terminais abertos ao mesmo tempo**

Terminal 1, backend:

```
cd CidadeEmFoco\backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

Terminal 2, frontend:

```
cd CidadeEmFoco\frontend
ng serve
```

Abra http://localhost:4200. A documentação da API fica em http://127.0.0.1:8000/docs.

## Scripts de administração (pasta `backend`, com o venv ativo)

| Script | Para que serve |
|---|---|
| `python criar_admin.py` | Cria um administrador (ou promove um usuário existente) |
| `python trocar_admin.py` | Troca o administrador: cria o novo e remove ou rebaixa os antigos |
| `python excluir_usuario.py` | Exclui um usuário e os dados dele (pede para digitar o e-mail para confirmar) |

## Limitações do protótipo e próximos passos

- Banco SQLite local, sem implantação em servidor
- Sem recuperação de senha por e-mail
- Usuário ainda não edita nem exclui as próprias ocorrências
- Ideias futuras: notificações, confirmação de problemas por outros moradores, aviso de ocorrências parecidas, protocolo, mapa de calor e exportação de relatórios
<p align="center">
  <img src="frontend/public/logo.svg" alt="Logotipo do Cidade em Foco" width="88" />
</p>

# Cidade em Foco

Denúncias de problemas urbanos por uma cidade melhor!

Portal web em que moradores registram problemas da cidade (buracos, iluminação, lixo, vazamentos e outros), anexam foto, informam a localização e acompanham o andamento. Administradores veem todas as ocorrências, alteram o status e consultam relatórios.

> Protótipo desenvolvido para apresentação.

## Funcionalidades

**Cidadão**
- Cadastro e login
- Registrar ocorrência com categoria, descrição, foto e localização (endereço ou localização atual)
- Acompanhar as próprias solicitações, com filtros e histórico de status
- **Editar e excluir** as próprias ocorrências, enquanto estiverem abertas
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
- Editar e excluir ocorrência: só o dono, e só enquanto ela estiver aberta. Depois que o administrador começa a tratar, o cidadão não pode mais alterar, e o backend recusa (erro 409)
- Quem não é dono não consegue nem saber que a ocorrência existe (erro 404)
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
| `python apagar_ocorrencia.py` | Lista as ocorrências e apaga uma pelo número, com o histórico e a foto (pede para digitar SIM) |

## Limitações do protótipo e próximos passos

- Banco SQLite local, sem implantação em servidor
- Sem recuperação de senha por e-mail
- A localização só pode ser informada por texto ou pela localização atual do navegador (ainda não dá para clicar no mapa)
- O administrador não edita nem exclui ocorrências de moradores pela tela (só altera o status; para apagar, usa o script)
- Ideias futuras: protocolo por ocorrência, notificações, confirmação de problemas por outros moradores, aviso de ocorrências parecidas, mapa de calor e exportação de relatórios
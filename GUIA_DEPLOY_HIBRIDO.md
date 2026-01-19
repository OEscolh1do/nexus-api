# Guia de Deploy Híbrido: Render (API) + Hostinger (Banco & Front)

Este guia resolve o problema da falta de suporte a Node.js no plano da Hostinger, usando o **Render.com** (Gratuito/Hobby) para rodar a API, mantendo o banco e o site na Hostinger.

---

## 🏗️ 1. Preparar o Backend (GitHub)

O Render precisa ler seu código do GitHub.

### Passo 1.1: Criar Repositório

1.  Vá em [github.com/new](https://github.com/new).
2.  Crie um repositório chamado `nexus-api` (Público ou Privado).
3.  No seu computador, abra o terminal na pasta principal do projeto (`Neonorte`):

```powershell
# Iniciar git se não existir
git init

# Criar arquivo .gitignore para não subir lixo
Set-Content .gitignore "node_modules`n.env`ndist"

# Commit
git add .
git commit -m "Deploy inicial Nexus"

# Subir para o GitHub (troque SEU_USUARIO pelo seu user do GitHub)
git remote add origin https://github.com/SEU_USUARIO/nexus-api.git
git branch -M main
git push -u origin main
```

---

## 🐬 2. Configurar Banco de Dados (Hostinger)

Precisamos liberar o acesso externo ao MySQL.

1.  Acesse o **hPanel** > **Bancos de Dados MySQL**.
2.  Clique no banco `u713519169_nexus`.
3.  Procure por **"Remote MySQL"** (MySQL Remoto).
4.  Em **IP (Host)**, coloque: `%` (Isso libera para qualquer IP, necessário pois o Render muda de IP).
5.  Clique em **Criar** ou **Adicionar**.
    - _Nota: A Hostinger pode pedir para você redefinir a senha do banco para aplicar a permissão remota._

---

## ☁️ 3. Criar Web Service no Render

1.  Crie conta em [render.com](https://render.com).
2.  Clique em **New +** > **Web Service**.
3.  Conecte seu GitHub e escolha o repositório `nexus-api`.
4.  Configure:

    - **Name**: `nexus-api`
    - **Region**: Ohio ou Frankfurt (não muda muito para este caso).
    - **Branch**: `main`
    - **Root Directory**: `backend` (IMPORTANTE: A API está na subpasta).
    - **Runtime**: Node
    - **Build Command**: `npm install && npm run build`
    - **Start Command**: `npm start`
    - **Plan**: Free (Gratuito) ou Starter ($7/mês - Recomendado para não "dormir").

5.  **Environment Variables** (Variáveis de Ambiente):
    Adicione as seguintes chaves:

    - `DATABASE_URL`: `mysql://u713519169_user:SENHA_DO_BANCO@IP_DA_HOSTINGER:3306/u713519169_nexus`
      - _Dica: Pegue o IP numérico da Hostinger no menu "Contas SSH" ou "Detalhes"._
    - `JWT_SECRET`: `sua_chave_secreta_super_segura`
    - `CORS_ORIGIN`: `https://www.neonorte.tech`
    - `NODE_ENV`: `production`

6.  Clique em **Create Web Service**.
7.  Aguarde o deploy. O Render vai te dar uma URL (Sua URL atual: `https://nexus-api-ehnb.onrender.com`).

---

## 🎨 4. Finalizar Frontend (Hostinger)

Agora que temos a URL da API, vamos gerar o site.

### Passo 4.1: Re-Build do Frontend (JÁ REALIZADO)

Você já executou este passo com a URL correta: `https://nexus-api-ehnb.onrender.com`.

### Passo 4.2: Upload

1.  Vá no **Gerenciador de Arquivos** da Hostinger.
2.  Entre em `public_html`.
3.  Crie a pasta `nexus`.
4.  Abra a pasta `frontend/dist` no seu computador.
5.  Selecione **TUDO** que está dentro dela (`index.html`, pasta `assets`, etc.).
6.  Arraste/Suba esses arquivos para dentro de `public_html/nexus` na Hostinger.
    - **NÃO** suba a pasta `frontend` nem a pasta `dist`.
    - O resultado final deve ser: `public_html/nexus/index.html`.
7.  Crie o arquivo `.htaccess` dentro de `public_html/nexus/` com este conteúdo:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /nexus/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /nexus/index.html [L]
</IfModule>
```

---

## ✅ Resumo do Fluxo

1.  **Código Backend** -> GitHub.
2.  **Render** -> Puxa do GitHub, roda o Node.js.
3.  **Frontend** -> Fica na Hostinger, chama a API do Render (`https://nexus-api-ehnb.onrender.com`).
4.  **Banco** -> Fica na Hostinger, aceita conexão do Render.

**Pronto!** A estrutura está profissional, escalável e dentro do seu orçamento.

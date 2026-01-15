# Guia de Implantação: Hostinger Shared Hosting (MySQL)

> **Última Atualização:** 2026-01-15
> **Arquiteto:** Tecnologia Neonorte
> **Versão:** 1.1.0

Este guia cobre a implantação do **Neonorte Nexus** em um ambiente de **Hospedagem Compartilhada (Hostinger)**, utilizando **MySQL** como banco de dados.

> [!IMPORTANT] > **Compatibilidade**: Este projeto foi migrado para **MySQL** para funcionar sem Docker em hospedagens padrão.
> **Base Path**: O sistema roda em `/nexus`.

---

## 🏗️ 1. Preparar os Arquivos (Build)

### Passo 1: Gerar Build do Frontend

No seu computador local (Windows):

```powershell
cd frontend
npm install

# CRÍTICO: Crie um arquivo .env.production antes do build
echo "VITE_API_URL=https://www.neonorte.tech/nexus-api" > .env.production

npm run build
```

Isso cria a pasta `frontend/dist` configurada para rodar em `https://www.neonorte.tech/nexus/`.

### Passo 2: Preparar o Backend

O backend deve ser compilado de TypeScript para JavaScript.

```powershell
cd backend
npm install
npm run build
```

Isso cria a pasta `backend/dist`.

---

## 🐬 2. Banco de Dados (MySQL na Hostinger)

1.  Acesse o **hPanel** (Painel da Hostinger).
2.  Vá em **Bancos de Dados MySQL**.
3.  Crie um novo banco:
    - **Nome**: `u713519169_nexus` (O prefixo é automático)
    - **Usuário**: `u713519169_user`
    - **Senha**: Crie uma senha forte.
4.  Anote esses dados.

---

## 🚀 3. Upload e Configuração (Backend)

Usaremos a ferramenta **"Setup Node.js App"** do hPanel.

1.  No hPanel, procure por **Setup Node.js App**.
2.  Clique em **Create Application**:
    - **Version**: Node.js 18 ou 20.
    - **Application Mode**: Production.
    - **Application Root**: `nexus-api` (Uma pasta fora do public_html é mais segura).
    - **Application URL**: `nexus-api` (Isso criará `seu-dominio.com/nexus-api`).
    - **Startup File**: `dist/server.js` (IMPORTANTE).
3.  Clique em **Create**.

### Upload dos Arquivos

Vá para o **Gerenciador de Arquivos** e entre na pasta `nexus-api` recém-criada.
Faça upload dos seguintes itens do seu `backend` local:

- Pasta `dist/` (com os arquivos .js compilados).
- Pasta `prisma/` (contendo schema.prisma).
- Arquivo `package.json`.
- Arquivo `.env`.

**NÃO envie a pasta `node_modules` nem `src`**.

### Instalar Dependências

1.  Volte na tela do Node.js App.
2.  Clique no botão **"Run NPM Install"**. Aguarde finalizar.

### Configurar Variáveis (.env)

Edite o arquivo `.env` no Gerenciador de Arquivos com os dados da Hostinger:

```env
DATABASE_URL="mysql://u713519169_user:SENHA@localhost:3306/u713519169_nexus"
JWT_SECRET="sua_chave_secreta_forte"
PORT=3000 (O Node App gerencia isso automaticamente, mas defina)
NODE_ENV=production
CORS_ORIGIN=https://www.neonorte.tech
```

### Rodar Migrations (Criar Tabelas)

No painel do Node.js, tem um botão para "Run Command" ou "Terminal".
Se não tiver, você pode rodar via SSH:

```bash
cd nexus-api
npx prisma migrate deploy
npx prisma db seed (Opcional, para criar admin inicial)
```

---

## 🎨 4. Upload do Frontend (Site)

1.  Vá para o **Gerenciador de Arquivos**.
2.  Entre em `public_html`.
3.  Crie uma pasta chamada `nexus`.
4.  Faça upload de **todo o conteúdo** da pasta `frontend/dist` local para dentro de `public_html/nexus`.
    - Você deve ver `index.html`, `assets/`, etc. lá dentro.

### Regra de Roteamento (.htaccess)

O React precisa que todas as rotas sejam redirecionadas para o `index.html`.
Crie um arquivo `.htaccess` dentro de `public_html/nexus/` com este conteúdo:

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

## ✅ Resumo da Arquitetura Final

- **Frontend**: `https://www.neonorte.tech/nexus` (Arquivos estáticos Apache).
- **Backend**: `https://www.neonorte.tech/nexus-api` (App Node.js rodando via Passenger/Nginx).

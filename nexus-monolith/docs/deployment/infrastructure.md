# Guia de Deploy e Infraestrutura

Este documento descreve os requisitos para colocar o Neonorte | Nexus Monolith em produção.

## 1. Variáveis de Ambiente (`.env`)

Estas variáveis devem ser configuradas no servidor de CI/CD e no ambiente de produção. **NUNCA comite o .env!**

### Core

```ini
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://user:pass@host:5432/nexus_db?schema=public"
JWT_SECRET="<gerar-hash-seguro-sha256>"
```

### Módulos Externos (Opcional)

```ini
# Se usar IA local
OLLAMA_HOST="http://localhost:11434"

# Se usar Storage Externo (S3/R2)
STORAGE_BUCKET=""
STORAGE_KEY=""
```

## 2. Scripts de Build

O projeto é um Monorepo Híbrido (Frontend e Backend compartilham a mesma raiz para simplicidade neste estágio).

### Backend (Node.js)

O backend não requer transpilação (CommonJS), mas requer geração do Prisma Client.

```bash
npm install
npx prisma generate
```

### Frontend (Vite -> Static)

O frontend deve ser buildado e servido estaticamente (ou via Nginx).

```bash
cd frontend
npm install
npm run build
# Output: frontend/dist
```

## 3. Processo de Startup (PM2)

Recomendamos usar PM2 para gerenciar o processo Node no servidor.

```bash
# Iniciar Backend
pm2 start server.js --name "nexus-api"

# (Opcional) Servir Frontend via Backend
# Se o backend estiver configurado para servir arquivos estáticos de 'frontend/dist'
```

## 4. Migrations de Banco

Execute as migrações no deploy para atualizar o schema.

```bash
npx prisma migrate deploy
```

> **Nota de Segurança:** Certifique-se de que a porta do banco de dados (5432) NÃO está exposta para a internet pública. Apenas o servidor da API deve ter acesso.

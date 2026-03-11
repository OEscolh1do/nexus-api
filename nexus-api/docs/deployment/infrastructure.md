# Infraestrutura de Produção — Neonorte | Nexus

> **Atualizado:** 2026-03-10

## 1. Topologia de Deploy

| Camada | Provedor | Região | URL de Produção |
| :--- | :--- | :--- | :--- |
| **Frontend SPA** | Cloudflare Pages | Edge Global | `https://neonorte-nexus-frontend.pages.dev` |
| **Backend API** | Fly.io (Docker) | GRU (São Paulo) | `https://neonorte-nexus-api.fly.dev` |
| **Database** | Supabase PostgreSQL | São Paulo | Via `DATABASE_URL` (conexão pooled) |
| **ORM** | Prisma Client v5.10.2 | — | — |

## 2. Variáveis de Ambiente (`.env`)

**NUNCA comite o `.env`!** Configure no painel do provedor (Fly.io Secrets / Cloudflare Env Vars).

### Backend (Fly.io)

```ini
NODE_ENV=production
PORT=3001
DATABASE_URL="postgresql://...@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="<hash-sha256-seguro>"
```

> ⚠️ **JWT_SECRET:** O servidor recusa inicializar se `JWT_SECRET` for o valor padrão em `NODE_ENV=production` (fail-fast de segurança).

### Frontend (Cloudflare Pages)

```ini
VITE_API_URL="https://neonorte-nexus-api.fly.dev"
```

## 3. Processo de Deploy

### Backend → Fly.io

```bash
# Deploy via CLI (a partir da raiz do backend)
fly deploy

# Schema do banco (aplicar mudanças)
npx prisma db push
```

O `Dockerfile` na raiz do backend gera a imagem de produção. Fly.io executa o container com `npm start` → `node src/server.js`.

### Frontend → Cloudflare Pages

Deploy automático via integração GitHub:
1. Push para branch `main`
2. Cloudflare Pages detecta, executa `npm run build` no diretório `frontend/`
3. Output `frontend/dist` é servido globalmente no Edge

## 4. Migrations de Banco

```bash
# Aplicar schema via push (sem migration files)
npx prisma db push

# Gerar Prisma Client (necessário após mudanças no schema)
npx prisma generate
```

> **Nota:** O projeto usa `db push` (não `migrate deploy`) por ser a fase atual de iteração rápida. Para produção enterprise com multiple environments, migrar para `prisma migrate`.

## 5. Segurança de Rede

- Database (porta 5432/6543) acessível APENAS via connection string autenticada. Sem IP público exposto.
- Backend protegido por Fly.io proxy (TLS automático).
- Frontend servido via Cloudflare (DDoS protection nativa, TLS automático).
- Rate-limiting em `/api/v2/iam/login` (10 req / 15 min por IP).
- API Gateway (`/api/v2/gateway/`) autenticado via `TenantApiKey` com quota enforcement.

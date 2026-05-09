---
name: vps-deploy
description: Deploy e atualização do ecossistema Ywara em produção (VPS Locaweb). Cobre git pull, rebuild de frontend/backend via Docker Compose, atualização do Nginx e rollback de emergência. Ativado quando o usuário pede para "subir o código", "fazer deploy", "atualizar produção" ou quando menciona "VPS", "production", "neonorte-ywara.tech".
---

# Skill: VPS Deploy — Ywara em Produção

## Identidade do Servidor

| Atributo | Valor |
|:---|:---|
| **SSH** | `ssh neonorte@vps66668.publiccloud.com.br` |
| **IP** | `191.252.38.139` |
| **Raiz do Projeto** | `/srv/ywara` |
| **Compose File** | `docker-compose.production.yml` |

> Root SSH está **bloqueado**. Usar sempre `neonorte` + `sudo` para comandos administrativos.
> Em emergência sem SSH, usar o **Console Web da Locaweb** (`vps66668`).

---

## Playbook 1 — Atualização Padrão (código sem mudança de infra)

```bash
ssh neonorte@vps66668.publiccloud.com.br

cd /srv/ywara
git pull origin main
```

Verificar se arquivos críticos mudaram:
- `infra/nginx/vps.conf` → executar **Playbook Nginx** abaixo
- `docker-compose.production.yml` → executar `docker compose ... up -d`
- `kurupira/backend/` → executar **Playbook Kurupira Backend**
- `kurupira/frontend/src/` → executar **Playbook Kurupira Frontend**
- `sumauma/backend/` → executar **Playbook Sumaúma Backend**
- `sumauma/frontend/src/` → executar **Playbook Sumaúma Frontend**

---

## Playbook 2 — Rebuild Kurupira (Frontend + Backend)

```bash
# Frontend — sempre sem o /api no final (o código concatena /api/v1 internamente)
cd /srv/ywara/kurupira/frontend
VITE_API_URL=https://kurupira.neonorte-ywara.tech npm run build

# Backend — rebuild e restart via Docker Compose
cd /srv/ywara
docker compose -f docker-compose.production.yml up -d --build kurupira-backend

# Verificar que subiu corretamente
docker logs neonorte_kurupira --tail 30
```

---

## Playbook 3 — Rebuild Sumaúma (Frontend + Backend)

```bash
# Frontend
cd /srv/ywara/sumauma/frontend
npm run build

# Backend — rebuild e restart via Docker Compose
cd /srv/ywara
docker compose -f docker-compose.production.yml up -d --build sumauma-backend

# Verificar que subiu corretamente
docker logs neonorte_admin --tail 30
```

---

## Playbook 4 — Atualização do Nginx

> ⚠️ **CRÍTICO**: O Certbot adiciona blocos SSL (`listen 443 ssl`) no arquivo do servidor. Copiar `vps.conf` diretamente **destrói esses blocos** e derruba o HTTPS para todos os usuários. **Sempre execute o certbot após o cp.**

```bash
# 1. Copiar config base (fonte da verdade está em /srv/ywara/infra/nginx/vps.conf)
sudo cp /srv/ywara/infra/nginx/vps.conf /etc/nginx/sites-available/ywara

# 2. OBRIGATÓRIO: Restaurar blocos SSL que o Certbot gerencia
sudo certbot --nginx -d kurupira.neonorte-ywara.tech -d admin.neonorte-ywara.tech

# 3. Validar configuração final (com SSL incluso)
sudo nginx -t

# 4. Aplicar mudanças
sudo systemctl reload nginx

# 5. Confirmar que HTTPS responde
curl -I https://kurupira.neonorte-ywara.tech
curl -I https://admin.neonorte-ywara.tech
```

**Saída esperada do certbot:**
```
Successfully deployed certificate for kurupira.neonorte-ywara.tech
Successfully deployed certificate for admin.neonorte-ywara.tech
```

---

## Playbook 5 — Deploy Completo (todos os serviços)

> ⚠️ **CRÍTICO**: Confirme que o `git pull` foi bem-sucedido ANTES de rodar o build. Um pull abortado gera um bundle com o mesmo hash da versão anterior — o Workbox Service Worker não detectará a mudança e o usuário continuará vendo a versão antiga.

```bash
cd /srv/ywara

# 1. OBRIGATÓRIO: Limpar artefatos de build antes do pull
git checkout sumauma/frontend/tsconfig.tsbuildinfo 2>/dev/null || true
git checkout kurupira/frontend/tsconfig.tsbuildinfo 2>/dev/null || true

# 2. Pull — confirme que imprimiu "Fast-forward" ou "Already up to date"
git pull origin main

# 3. Rebuild frontends (Importante: VITE_API_URL sem /api no final)
cd kurupira/frontend && VITE_API_URL=https://kurupira.neonorte-ywara.tech npm run build
cd /srv/ywara/sumauma/frontend && npm run build

# 4. Rebuild e restart todos os backends
cd /srv/ywara
docker compose -f docker-compose.production.yml up -d --build

# 5. Atualizar Nginx se necessário (lembre: rodar certbot após o cp!)
sudo cp infra/nginx/vps.conf /etc/nginx/sites-available/ywara
sudo certbot --nginx -d kurupira.neonorte-ywara.tech -d admin.neonorte-ywara.tech
sudo nginx -t && sudo systemctl reload nginx

# 6. Health check final
docker compose -f docker-compose.production.yml ps
curl -I https://kurupira.neonorte-ywara.tech
```

---

## Playbook 6 — Rollback de Emergência

```bash
cd /srv/ywara

# Ver commits recentes para identificar o commit estável
git log --oneline -10

# Reverter para um commit específico
git checkout <commit-hash>

# Ou reverter para o commit anterior
git reset --hard HEAD~1

# Rebuild após rollback
docker compose -f docker-compose.production.yml up -d --build
```

---

## Variáveis de Ambiente

O arquivo `.env` fica em `/srv/ywara/.env` e **NUNCA** é versionado no Git.
Referência: `infra/.env.production.example`.

```bash
# Ver variáveis atuais (sem expor valores)
cat /srv/ywara/.env | cut -d= -f1

# Gerar novo JWT_SECRET se necessário
openssl rand -base64 64
```

---

## Checklist Pós-Deploy

- [ ] `docker compose ps` — todos os containers `Up`
- [ ] `curl -I https://kurupira.neonorte-ywara.tech` — responde 200
- [ ] `curl -I https://admin.neonorte-ywara.tech` — responde 200
- [ ] `docker logs neonorte_kurupira --tail 20` — sem erros críticos
- [ ] `docker logs neonorte_admin --tail 20` — sem erros críticos
- [ ] Testar fluxo de login no Kurupira no browser
- [ ] **Schema mudou?** → Executar Playbook 7 abaixo
- [ ] Verificar se Logto Console tem as Redirect URIs registradas
- [ ] Validar que ALLOWED_ORIGINS no .env inclui o novo domínio

---

## Playbook 7 — Sincronização de Schema do Banco (Prisma)

> ⚠️ **Executar SEMPRE que `kurupira/backend/prisma/schema.prisma` mudar.**

O backend roda dentro de Docker. O `node_modules` existe apenas **dentro do container**, não no host do VPS. Por isso, **nunca use `npx prisma`** no host — o npx pode baixar uma versão incompatível (ex: v7.x vs v5.x do projeto).

### Comando Correto

```bash
# Sincroniza o schema direto no banco usando o Prisma do container
docker exec neonorte_kurupira ./node_modules/.bin/prisma db push
```

**Saída esperada (sucesso — schema sincronizado):**
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": MySQL database "db_kurupira" at "nexus-db:3306"
🚀  Your database is now in sync with your Prisma schema.
✔ Generated Prisma Client (v5.x.x) to ./node_modules/@prisma/client
```

**Saída esperada (já sincronizado — também OK):**
```
The database is already in sync with the Prisma schema.
```

### Quando usar `migrate deploy` vs `db push`

| Situação | Comando |
|---|---|
| Existe arquivo de migração em `prisma/migrations/` | `docker exec neonorte_kurupira ./node_modules/.bin/prisma migrate deploy` |
| Sem arquivo de migração (schema editado diretamente) | `docker exec neonorte_kurupira ./node_modules/.bin/prisma db push` |
| Dúvida se migração existe | Verificar pasta `prisma/migrations/` no repo |

---

## ⚠️ Armadilhas Conhecidas (Lessons Learned)

### 1. `npx prisma` no host baixa versão incompatível
**Problema**: O VPS tem cache do npx com Prisma 7.x. O projeto usa Prisma 5.x. A v7 removeu suporte a `url` e `shadowDatabaseUrl` no `schema.prisma`, causando erro `P1012`.

**Nunca fazer:**
```bash
npx prisma migrate deploy  # ❌ Pode usar versão errada do Prisma
```

**Sempre fazer:**
```bash
docker exec neonorte_kurupira ./node_modules/.bin/prisma db push  # ✅
```

### 2. `node_modules` não existe no host
O backend roda em Docker. O diretório `/srv/ywara/kurupira/backend/node_modules/` **não existe no host**. Comandos como `./node_modules/.bin/prisma` no terminal SSH vão retornar `No such file or directory`.

### 3. PowerShell não suporta `&&` no meio de comandos
No terminal **local (Windows PowerShell)**, use `;` em vez de `&&`:
```powershell
# ❌ Falha no PowerShell
git add . && git commit -m "msg"

# ✅ Funciona no PowerShell
git add .; git commit -m "msg"
```
O `&&` funciona normalmente dentro da sessão SSH (Linux bash).

### 4. `tsconfig.tsbuildinfo` bloqueia `git pull` e torna o deploy invisível
**Problema**: O TypeScript gera `tsconfig.tsbuildinfo` em cada build. Se este arquivo está versionado no Git, o VPS acumula uma versão "suja" após cada build, e o próximo `git pull` aborta silenciosamente. O build ainda executa — mas com o **código antigo** → mesmo hash de bundle → Workbox SW não detecta mudança → **usuário vê a versão antiga**.

**Sintoma**: `error: Your local changes to the following files would be overwritten by merge: tsconfig.tsbuildinfo`

**Correção imediata:**
```bash
git checkout sumauma/frontend/tsconfig.tsbuildinfo
git pull origin main
# Agora sim, fazer o build
```

**Correção definitiva** (já aplicada no projeto):
```bash
# Adicionar ao .gitignore raiz:
*.tsbuildinfo
```

**Regra**: Sempre limpe os `.tsbuildinfo` ANTES do `git pull` no Playbook 5.

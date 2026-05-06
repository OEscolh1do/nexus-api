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
# Frontend — sempre com a URL correta de produção
cd /srv/ywara/kurupira/frontend
VITE_API_URL=https://kurupira.neonorte-ywara.tech/api npm run build

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

```bash
# Copiar config atualizada (fonte da verdade está em /srv/ywara/infra/nginx/vps.conf)
sudo cp /srv/ywara/infra/nginx/vps.conf /etc/nginx/sites-available/ywara

# Validar ANTES de reiniciar — nunca reiniciar sem testar
sudo nginx -t

# Aplicar mudanças
sudo systemctl restart nginx

# Confirmar status
sudo systemctl status nginx
```

---

## Playbook 5 — Deploy Completo (todos os serviços)

```bash
cd /srv/ywara
git pull origin main

# Rebuild frontends
cd kurupira/frontend && VITE_API_URL=https://kurupira.neonorte-ywara.tech/api npm run build
cd /srv/ywara/sumauma/frontend && npm run build

# Rebuild e restart todos os backends
cd /srv/ywara
docker compose -f docker-compose.production.yml up -d --build

# Atualizar Nginx se necessário
sudo cp infra/nginx/vps.conf /etc/nginx/sites-available/ywara
sudo nginx -t && sudo systemctl restart nginx

# Health check final
docker compose -f docker-compose.production.yml ps
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

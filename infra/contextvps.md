# CONTEXT-VPS.md — Servidor de Produção Neonorte Ywara

> **Última Atualização:** 2026-05-05
> **Status:** ✅ PRODUÇÃO — Ativo e Saudável
> **Mantido por:** Equipe Neonorte / Antigravity AI

---

## 🖥️ IDENTIDADE DO SERVIDOR

| Atributo | Valor |
|:---|:---|
| **Provedor** | Locaweb (VPS Cloud) |
| **Hostname** | `neonorte-vps` |
| **IP Público** | `191.252.38.139` |
| **Sistema Operacional** | Debian GNU/Linux 13 (Trixie) |
| **Kernel** | `6.12.85+deb13-amd64` |
| **RAM** | 2 GB |
| **Identificador Locaweb** | `vps66668` |
| **Host SSH** | `vps66668.publiccloud.com.br` |

---

## 🔐 ACESSO ADMINISTRATIVO

```bash
# Acesso via SSH (usuário criado no hardening — root BLOQUEADO)
ssh neonorte@vps66668.publiccloud.com.br
```

> **CRÍTICO:** O login como `root` via SSH está bloqueado por segurança (`PermitRootLogin no`).
> Em caso de recuperação de emergência, use o **Console Web da Locaweb** para acessar a máquina diretamente.

### Permissões sudo do usuário `neonorte`
O usuário `neonorte` possui acesso `sudo` completo. Todos os comandos administrativos devem ser prefixados com `sudo`.

---

## 📁 ESTRUTURA DE DIRETÓRIOS NA VPS

```
/srv/ywara/                          ← Raiz do projeto (git clone)
├── docker-compose.production.yml    ← Orquestração dos containers
├── infra/
│   ├── nginx/
│   │   └── vps.conf                 ← Configuração do Nginx (fonte da verdade)
│   ├── mysql/
│   │   └── init.sql                 ← Script de criação dos schemas e usuários
│   └── .env.production              ← Variáveis de ambiente (NÃO versionar)
├── kurupira/
│   ├── backend/                     ← API Kurupira (container neonorte_kurupira)
│   └── frontend/
│       └── dist/                    ← Build estático servido pelo Nginx
└── sumauma/
    ├── backend/                     ← API Sumaúma (container neonorte_admin)
    └── frontend/
        └── dist/                    ← Build estático servido pelo Nginx

/etc/nginx/
├── sites-available/ywara            ← Link para /srv/ywara/infra/nginx/vps.conf
└── sites-enabled/ywara              ← Symlink ativo (nginx -t para validar)

/etc/letsencrypt/live/neonorte-ywara.tech/
├── fullchain.pem                    ← Certificado SSL (válido até 2026-08-03)
└── privkey.pem                      ← Chave privada SSL
```

---

## 🌐 DOMÍNIOS E DNS

Todos os registros DNS estão configurados no painel da **Locaweb**.

| Subdomínio | Tipo DNS | IP | Destino |
|:---|:---|:---|:---|
| `neonorte-ywara.tech` | A | `191.252.38.139` | Redireciona → `kurupira.neonorte-ywara.tech` |
| `kurupira.neonorte-ywara.tech` | A | `191.252.38.139` | Plataforma de Engenharia |
| `admin.neonorte-ywara.tech` | A | `191.252.38.139` | Backoffice Sumaúma |

### URLs Públicas Oficiais

| App | URL |
|:---|:---|
| **Kurupira (Engenharia)** | `https://kurupira.neonorte-ywara.tech` |
| **Sumaúma (Admin)** | `https://admin.neonorte-ywara.tech` |
| **Kurupira API** | `https://kurupira.neonorte-ywara.tech/api` |
| **Sumaúma API (BFF)** | `https://admin.neonorte-ywara.tech/admin` |

---

## 🐳 CONTAINERS DOCKER

Todos os containers são gerenciados pelo arquivo `docker-compose.production.yml`.

| Container | Imagem | Porta Host | Memória Máxima |
|:---|:---|:---|:---|
| `neonorte_db` | `mysql:8.0` | Somente rede interna | 512 MB |
| `neonorte_kurupira` | Build local (`kurupira/backend`) | `127.0.0.1:3002` | 512 MB |
| `neonorte_admin` | Build local (`sumauma/backend`) | `127.0.0.1:3003` | 384 MB |

> **Segurança:** As portas dos backends são vinculadas a `127.0.0.1`, tornando-as acessíveis APENAS pelo Nginx local. Nunca ficam expostas à internet.

### Rede Docker
- **Nome:** `neonorte_net` (Bridge)
- Todos os containers compartilham esta rede para comunicação interna.

### Volume Persistente
- **Nome:** `nexus_mysql_data`
- **Conteúdo:** Dados do MySQL (schemas `db_kurupira`, `db_sumauma`)
- **Localização física:** Gerenciado pelo Docker em `/var/lib/docker/volumes/`

---

## ⚙️ NGINX — ARQUITETURA DO PROXY REVERSO

O Nginx é instalado **no host** (fora do Docker) e gerencia todo o tráfego de entrada.

```
Internet (HTTPS :443)
    │
    ▼
Nginx (Host)
    ├── kurupira.neonorte-ywara.tech
    │       ├── /           → /srv/ywara/kurupira/frontend/dist   (Estático)
    │       └── /api        → http://127.0.0.1:3002               (Proxy)
    │
    └── admin.neonorte-ywara.tech
            ├── /           → /srv/ywara/sumauma/frontend/dist    (Estático)
            └── /admin      → http://127.0.0.1:3003               (Proxy)
```

### Comandos de Manutenção do Nginx
```bash
# Validar a configuração sem reiniciar
sudo nginx -t

# Reiniciar o Nginx (aplica mudanças)
sudo systemctl restart nginx

# Ver status do Nginx
sudo systemctl status nginx

# Atualizar a config após git pull
sudo cp /srv/ywara/infra/nginx/vps.conf /etc/nginx/sites-available/ywara
sudo nginx -t && sudo systemctl restart nginx
```

---

## 🔒 SSL — CERTIFICADOS LET'S ENCRYPT

| Atributo | Valor |
|:---|:---|
| **Autoridade Certificadora** | Let's Encrypt |
| **Ferramenta** | Certbot |
| **Cobertura** | `neonorte-ywara.tech`, `kurupira.*`, `admin.*` |
| **Validade** | Até **2026-08-03** |
| **Renovação** | Automática via Crontab do Certbot |

```bash
# Renovar manualmente (se necessário)
sudo certbot renew

# Reinstalar certificado após mudança no Nginx
sudo certbot install --cert-name neonorte-ywara.tech
```

---

## 📦 VARIÁVEIS DE AMBIENTE (`.env`)

O arquivo `.env` fica em `/srv/ywara/.env` e **nunca deve ser versionado no Git**.
O `docker-compose.production.yml` lê este arquivo automaticamente.

> Referência: `infra/.env.production.example` no repositório.

| Variável | Obrigatória | Descrição |
|:---|:---:|:---|
| `MYSQL_ROOT_PASSWORD` | ✅ | Senha root do MySQL |
| `DB_KURUPIRA_USER` / `_PASSWORD` | ✅ | Credenciais do schema `db_kurupira` |
| `DB_SUMAUMA_USER` / `_PASSWORD` | ✅ | Credenciais do schema `db_sumauma` |
| `DB_ADMIN_USER` / `_PASSWORD` | ✅ | Usuário read-only cross-database |
| `JWT_SECRET` | ✅ | Segredo HS256 (gerar com `openssl rand -base64 64`) |
| `M2M_SERVICE_TOKEN` | ✅ | Token M2M inter-serviços (legado, em migração) |
| `LOGTO_ENDPOINT` | ✅ | URL base do tenant Logto |
| `LOGTO_JWKS_URI` | ✅ | Endpoint JWKS do Logto |
| `LOGTO_M2M_CLIENT_ID` | ✅ | App ID da aplicação M2M no Logto |
| `LOGTO_M2M_CLIENT_SECRET` | ✅ | Client Secret M2M do Logto |
| `LOGTO_M2M_RESOURCE` | ✅ | URI do API Resource no Logto |

---

## 🛠️ PLAYBOOKS OPERACIONAIS

### 1. Atualizar o sistema após um novo commit no GitHub
```bash
cd /srv/ywara
git pull origin main

# Se o Nginx foi alterado:
sudo cp /srv/ywara/infra/nginx/vps.conf /etc/nginx/sites-available/ywara
sudo nginx -t && sudo systemctl restart nginx
```

### 2. Rebuild completo do Kurupira (Frontend + Backend)
```bash
# Frontend (com a URL correta de produção)
cd /srv/ywara/kurupira/frontend
VITE_API_URL=https://kurupira.neonorte-ywara.tech/api npm run build

# Backend (via Docker Compose)
cd /srv/ywara
docker compose -f docker-compose.production.yml up -d --build kurupira-backend
```

### 3. Rebuild completo do Sumaúma (Frontend + Backend)
```bash
# Frontend
cd /srv/ywara/sumauma/frontend
npm run build

# Backend (via Docker Compose)
cd /srv/ywara
docker compose -f docker-compose.production.yml up -d --build sumauma-backend
```

### 4. Verificar saúde dos containers
```bash
docker ps
docker compose -f /srv/ywara/docker-compose.production.yml ps
```

### 5. Ver logs em tempo real de um serviço
```bash
# Logs do Kurupira Backend
docker logs neonorte_kurupira -f --tail 50

# Logs do Sumaúma Backend
docker logs neonorte_admin -f --tail 50

# Logs do MySQL
docker logs neonorte_db -f --tail 20
```

### 6. Acessar o MySQL interativamente
```bash
docker exec -it neonorte_db mysql -u root -p
# (Senha definida em MYSQL_ROOT_PASSWORD no .env)
```

### 7. Reiniciar todos os serviços
```bash
cd /srv/ywara
docker compose -f docker-compose.production.yml restart
```

---

## 🔒 SEGURANÇA (HARDENING APLICADO)

| Medida | Status |
|:---|:---|
| Login root via SSH | ❌ **Bloqueado** (`PermitRootLogin no`) |
| Autenticação por senha SSH | ✅ Ativo (migração para chave pública recomendada) |
| Firewall UFW | ✅ Ativo — Apenas portas 22, 80, 443 abertas |
| Portas dos backends | ✅ Vinculadas ao `127.0.0.1` (inacessíveis externamente) |
| Certificado HTTPS | ✅ Let's Encrypt ativo |
| Renovação automática de SSL | ✅ Certbot Crontab configurado |

---

## ⏳ PENDÊNCIAS DE MANUTENÇÃO

| Item | Prioridade | Descrição |
|:---|:---:|:---|
| **Chave SSH Pública** | Alta | Migrar autenticação de senha para par de chaves RSA/Ed25519 |
| **Secrets Manager** | Média | Mover `LOGTO_M2M_CLIENT_SECRET` e senhas de DB para um vault (ex: Doppler) |
| **Backup do Volume MySQL** | Alta | Configurar backup automático do volume `nexus_mysql_data` para storage externo |
| **Monitoramento** | Média | Instalar `htop` ou integrar com Grafana/UptimeRobot para alertas de saúde |
| **Remover `M2M_SERVICE_TOKEN`** | Média | Após confirmar Bearer Logto ativo nos logs de ambos os backends |

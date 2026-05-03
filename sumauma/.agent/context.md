# CONTEXT.md — Sumaúma (Backoffice do Operador)

> **Última Atualização:** 2026-05-03
> **Arquiteto:** Antigravity AI
> **Versão do Sistema:** 1.2.0 (Era Ywara — Sprint de Hardening)

---

## 📋 VISÃO GERAL

**Sumaúma** é o pilar central do ecossistema Ywara. Atua como o painel de gestão, controle e supervisão exclusivo dos operadores da Neonorte. Opera como **GOD-MODE** — a base estrutural que sustenta e conecta os demais serviços (Iaçã e Kurupira).

Este módulo é **separado** dos sistemas de produto (Iaçã e Kurupira) e se comunica com eles via:
- **Leitura direta** (Prisma read-only) para consultas, relatórios e auditoria.
- **M2M HTTP** (Axios + OAuth2 Bearer) para mutações que requerem business logic.

| Aspecto | Detalhe |
|---------|--------|
| **Papel** | Sumaúma: O pilar central / Backoffice (GOD-MODE) |
| **Usuários** | Equipe interna Neonorte (role: `PLATFORM_ADMIN`) |
| **Porta Backend** | 3003 |
| **Porta Frontend** | 5175 (dev) |
| **IAM (Auth)** | Logto Cloud (SaaS) |

---

## 🏗️ STACK

### Frontend
- **Framework**: Vite + React 19 + TypeScript
- **Estilo**: Tailwind CSS v4 (dark-mode-only)
- **Componentes**: Radix UI (Dialog, Select, Separator, Tooltip)
- **Ícones**: Lucide React
- **Roteamento**: React Router DOM v7
- **Formulários**: react-hook-form + Zod
- **State**: Zustand
- **HTTP**: Axios
- **Auth SDK**: @logto/react

### Backend (BFF)
- **Runtime**: Node.js (CommonJS)
- **Framework**: Express 5
- **ORM**: Prisma 5.10 (dois clientes read-only: db_iaca + db_kurupira)
- **M2M Client**: Axios com interceptors (OAuth2 Bearer via Logto Client Credentials)
- **Auth**: Logto SSO (ID Token JWT + JWKS Validation)
- **Logger**: `lib/logger.js` — JSON em produção, console em dev (`SERVICE_NAME=sumauma`)
- **Validação de Env**: `lib/validateEnv.js` — falha rápida no startup se variável crítica ausente

---

## 🧩 MÓDULOS

| Módulo | Localização | Responsabilidade |
|--------|------------|-----------------|
| Dashboard | `frontend/src/pages/Dashboard.tsx` | KPIs de saúde da plataforma |
| Tenants | `frontend/src/pages/Tenants.tsx` | Gestão de organizações e assinaturas |
| Usuários | `frontend/src/pages/Users.tsx` | Gestão cross-tenant de usuários |
| Catálogo | `frontend/src/pages/Catalog.tsx` | ModuleCatalog + InverterCatalog |
| Auditoria | `frontend/src/pages/AuditLogs.tsx` | Timeline de AuditLogs |
| Sistema | `frontend/src/pages/System.tsx` | Healthcheck, cron jobs, sessões |

---

## 📡 VARIÁVEIS DE AMBIENTE

Referência completa em `.env.example`. Variáveis **obrigatórias** validadas no startup:

| Variável | Descrição |
|----------|-----------|
| `JWT_SECRET` | Chave HS256 para tokens locais (dev sem Logto) |
| `LOGTO_ENDPOINT` | URL base do tenant Logto (ex: `https://214fzz.logto.app`) |
| `LOGTO_JWKS_URI` | Endpoint JWKS do Logto para validação de tokens |
| `LOGTO_M2M_CLIENT_ID` | App ID da aplicação M2M no Logto Console |
| `LOGTO_M2M_CLIENT_SECRET` | Client Secret da aplicação M2M (**usar secrets manager em produção**) |
| `LOGTO_M2M_RESOURCE` | URI do API Resource no Logto (`https://api.ywara.com.br`) |
| `LOGTO_M2M_SCOPE` | Scopes M2M (`kurupira:catalog:read kurupira:catalog:write kurupira:catalog:delete`) |
| `KURUPIRA_INTERNAL_URL` | URL interna do Kurupira (ex: `http://kurupira-backend:3005`) |
| `DATABASE_URL` | Conexão principal `db_sumauma` (escrita) |
| `DATABASE_URL_IACA_RO` | Conexão read-only para `db_iaca` |
| `DATABASE_URL_KURUPIRA_RO` | Conexão read-only para `db_kurupira` |

> `M2M_SERVICE_TOKEN` é legado (deprecado). Ainda aceito durante janela de migração. **Remover após confirmar que Logto M2M OAuth2 está ativo** (smoke test: Bearer visível nos logs).

---

## 🔐 AUTENTICAÇÃO (LOGTO)

### Fluxo do Operador (Frontend → Backend)
1. O operador clica em "Entrar" → redirecionado para Logto Cloud.
2. Após login, o frontend recebe um **ID Token (JWT RS256)** assinado pelo Logto.
3. O frontend armazena este JWT e o envia via `Authorization: Bearer <JWT>`.
4. `platformAuth.js` valida a assinatura via JWKS; verifica `role: PLATFORM_ADMIN`.
5. O frontend verifica a expiração do token **antes** de enviar cada requisição (margem 60s em `src/lib/api.ts`). Se expirado → logout proativo sem esperar 401.

### Fluxo M2M (BFF → Kurupira)
1. `lib/m2mClient.js` obtém Bearer token via **OAuth2 Client Credentials** (Logto).
2. Token cacheado em memória com renovação automática 60s antes do vencimento.
3. Fallback legado: `X-Service-Token` (apenas durante migração — **remover em breve**).
4. Todos os requests M2M incluem `X-Correlation-ID` para rastreabilidade cross-service.

---

## 📐 CONVENÇÕES

### Código
- **Backend**: CommonJS (`require`/`module.exports`), mesmo padrão do Kurupira e Iaçã.
- **Frontend**: ESM (`import`/`export`), TypeScript strict.
- **Naming**: camelCase para variáveis/funções, PascalCase para componentes React, kebab-case para arquivos CSS.
- **Logger**: sempre usar `logger` de `../lib/logger` (nunca `console.*` diretamente em runtime).
  ```js
  const logger = require('../lib/logger');
  logger.info('mensagem', { campo: valor });   // info
  logger.warn('aviso', { err: error.message }); // warn
  logger.error('erro', { err: error.message }); // error
  ```

### Audit Log
- **Toda mutação administrativa** chama `auditLog()` de `lib/auditLogger.js`.
- **Prefixo obrigatório**: `ADMIN_*` (ex: `ADMIN_CREATE_USER`, `ADMIN_BLOCK_TENANT`).
- **Campos obrigatórios**: `operator`, `action`, `entity`, `resourceId`, `ipAddress`, `userAgent`.
- Helper `ctx(req)` padronizado em cada arquivo de rota:
  ```js
  const ctx = (req) => ({
    operator: req.operator,
    ipAddress: req.ip || req.headers['x-forwarded-for'],
    userAgent: req.headers['user-agent'],
  });
  ```

### Design (Dark-Mode-Only)
- `rounded-sm` (4px) — NUNCA maior.
- `font-mono tabular-nums` em todos os valores numéricos.
- Datas em `dd/MM/yyyy HH:mm` (PT-BR).
- Labels e textos visíveis ao operador em PT-BR.
- Sem animações de entrada. Dados aparecem instantaneamente.

### Arquitetura de Dados
- **Ler** → Prisma read-only (acesso direto ao banco).
- **Escrever** → M2M HTTP para o serviço dono do dado (Kurupira ou Iaçã).
- **Nunca** executar INSERT/UPDATE/DELETE diretamente nos bancos irmãos.

---

## 🔑 PADRÕES INEGOCIÁVEIS

1. **Dark mode é o ÚNICO modo**. Sem toggle light/dark.
2. **Toda mutação via M2M**. O BFF nunca escreve diretamente em `db_iaca` ou `db_kurupira`.
3. **Toda rota protegida**. Middleware `platformAuth` obrigatório em todas as rotas `/admin/*`.
4. **Sem self-registration**. Logins são restritos e gerenciados via Convite/Painel.
5. **Auth via Logto SSO**. O Sumaúma não gerencia senhas, apenas identidades.
6. **Auditoria obrigatória**. Toda ação administrativa gera log com `action: ADMIN_*`.
7. **PT-BR**. Todo texto visível ao operador.
8. **PLATFORM_ADMIN é imutável via API**. Poka-yoke em criação e promoção de usuários — apenas via CLI no servidor.
9. **Logger estruturado obrigatório**. Nenhum `console.*` em arquivos de runtime. Usar `lib/logger.js`.
10. **Env validada no startup**. `validateEnv()` é chamado antes de qualquer import de rota — processo termina com mensagem clara se variável crítica ausente.

---

## 🐛 BUGS CORRIGIDOS (v1.2.0)

| Arquivo | Bug | Fix |
|---------|-----|-----|
| `server.js` (dashboard) | `logsLast24h`: `where` duplo-aninhado — sempre retornava 0 | Removido `{ where: {...} }` wrapper; passado objeto diretamente |
| `lib/m2mClient.js` | `LOGTO_M2M_RESOURCE` ausente → OAuth2 path nunca ativava; sempre usava X-Service-Token legado | Adicionado `LOGTO_M2M_RESOURCE` ao `.env` e ao `validateEnv` |
| `lib/m2mClient.js` | `scope: 'all'` inválido para API Resources customizados no Logto | Substituído por `LOGTO_M2M_SCOPE` env configurável |
| `routes/tenants.js` | `iacaClient.put(...)` referenciado sem import | Adicionado `const { iacaClient } = require('../lib/m2mClient')` |

---

## ⏳ PENDÊNCIAS CONHECIDAS

| Item | Prioridade | Notas |
|------|-----------|-------|
| Remover `M2M_SERVICE_TOKEN` | Alta | Após smoke test confirmar Bearer nos logs de ambos os serviços |
| Whitelist de campos no `PATCH /admin/tenants/:id` | Alta | `data: req.body` sem filtro — risco de mass assignment (ex: `type: 'MASTER'`) |
| Testes unitários `catalogService.js` | Média | Parser PAN/OND tem maior complexidade ciclomática do projeto |
| Secrets manager em produção | Alta | `LOGTO_M2M_CLIENT_SECRET`, `JWT_SECRET` e senhas de DB devem sair do `.env` plano |

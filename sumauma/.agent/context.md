# CONTEXT.md — Sumaúma (Backoffice do Operador)

> **Última Atualização:** 2026-05-04
> **Arquiteto:** Antigravity AI
> **Versão do Sistema:** 1.6.0 (Era Ywara — Produção & Governança Refinada)

---

## 📋 VISÃO GERAL

**Sumaúma** é o pilar central do ecossistema Ywara. Atua como o painel de gestão, controle e supervisão exclusivo dos operadores da Neonorte. Opera como **GOD-MODE** — a base estrutural que sustenta e conecta os demais serviços (Iaçã e Kurupira). **O Sumaúma é um sistema exclusivo para gestão do Ywara. Demais usuários do ecossistema Ywara não devem ter acesso ao Sumaúma.**

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
 11. **Governança de Assentos (Seats)**. Nenhum usuário pode ser criado acima do limite do plano; nenhum plano pode ser rebaixado se a contagem atual de usuários exceder o novo limite.
 12. **DRY nas Constantes de Tenant**. Usar obrigatoriamente `src/lib/tenantUtils.ts` no frontend para labels e limites.
 13. **Exclusão Definitiva (Hard Delete)**. A exclusão de tenants e usuários no Sumaúma deve ser síncrona com o Logto e gerar registros `ADMIN_DELETE_*` na auditoria. Operações críticas de tenant exigem confirmação via digitação do nome.

---

## 🏛️ DECISÕES ARQUITETURAIS

### Tenant Account Type — Migração do campo `type` (SPEC-005)

**Data**: 2026-05-03 | **Status**: ✅ Concluído e Implementado

#### Contexto
O campo `type` do modelo `Tenant` suportava apenas `MASTER` e `SUB_TENANT`. Isso impedia diferenciação visual entre freelancers (solo) e empresas integradores no painel Sumaúma, e não havia nenhum limite de seats por plano.

#### Decisão (Opção B — Migração direta)
Migrar o campo `type` existente para três valores semânticos:

| Valor | Semântica | Antes |
|-------|-----------|-------|
| `MASTER` | Admin plane da Neonorte (Sumaúma) | Mantido |
| `CORPORATE` | Empresa integradora (multi-usuário) | Era `SUB_TENANT` |
| `INDIVIDUAL` | Engenheiro solo / freelancer (1 usuário) | Novo |

#### Por que não um campo separado `accountType` (Opção A)?
- A Opção A (campo adicional) é mais segura porém gera redundância semântica — dois campos descrevendo "o que é este tenant".
- A Opção B (migração direta) é conceitualmente correta: `MASTER` é só mais um `type`, não uma dimensão diferente.
- Risco mitigado via: busca global por `'SUB_TENANT'` antes do início + checkpoint git pré-migration.

#### Regras Poka-Yoke Derivadas
1. **Seat Limit no Backend**: `PLAN_SEATS = { FREE:1, STARTER:5, PRO:20, ENTERPRISE:9999 }`. `POST /admin/users` retorna HTTP 409 (`SEAT_LIMIT_EXCEEDED`) se limite atingido.
2. **Whitelist no PATCH**: `PATCH /admin/tenants/:id` valida campos permitidos e rejeita `type: 'MASTER'` explicitamente com HTTP 403.
3. **Guard imutável**: `assertNotMaster()` permanece intacto — verifica `type === 'MASTER'`.
4. **Criação segura**: `POST /admin/tenants` aceita apenas `INDIVIDUAL` ou `CORPORATE` — nunca `MASTER` via request body.

#### Ranking de Boas Práticas de Mercado (referência desta decisão)
1. 🥇 **Tenant-per-Billing-Entity** — toda conta tem Tenant, sem exceção (Vercel, Stripe, Clerk) ✅ Ywara já implementa
2. 🥈 **Account Type como etiqueta, não estrutura** — sem bifurcação de codepath por tipo (Notion, Slack, GitHub) ✅ Esta spec implementa
3. 🥉 **Seat-based Limits com enforcement em backend** — limite de usuários é propriedade do plano (GitHub, Figma, Linear) ✅ Esta spec implementa
4. **Admin Plane separado do Data Plane** — Sumaúma vs Iaçã/Kurupira são domínios distintos (AWS, Azure, WorkOS) ✅ Ywara já implementa
5. **CLI Bootstrap para God-Mode** — PLATFORM_ADMIN nunca criado via UI (Logto, Auth0, Vault) ✅ Ywara já implementa

#### Spec de Referência
`sumauma/.agent/specs/SPEC-005-tenant-account-type.md`

---

### Infraestrutura de Governança (Seats & Quotas)

**Data**: 2026-05-03 | **Status**: ✅ Concluído

#### Visão Técnica
Implementação do motor de limites híbrido (Assentos + Uso de Simulação) para garantir a saúde financeira e operacional do ecossistema.

| Recurso | Controle | Enforcement |
|:---|:---|:---|
| **Vagas de Usuários (Seats)** | Propriedade do Plano e Tipo | Bloqueio no `POST /admin/users` e no `PATCH tenant.apiPlan` (Poka-yoke de downgrade). |
| **Capacidade de Simulação (Quota)** | Uso variável (`apiMonthlyQuota`) | Monitoramento via `apiCurrentUsage` e injeção de pacotes extras via Painel. |

#### Componentes de UI Refatorados
 - **TenantsPage**: Progress bars (Gauges) de ocupação de usuários e uso de quota na listagem principal.
 - **TenantDrawer**: Nova aba "Limites e Quotas" com gestão granular e Painel de Injeção de Quota.
 - **CreateUserForm / CreateTenantForm**: Linguagem humanizada (Simulações, Acessos) e validação de ocupação em tempo real.

#### Centralização de Constantes
 - `src/lib/tenantUtils.ts`: Fonte única da verdade para `PLAN_SEATS`, `ACCOUNT_TYPE_LABEL` e Badges.

---

### Exclusão Definitiva e Sincronização de Identidade

**Data**: 2026-05-03 | **Status**: ✅ Concluído e Implementado

#### Contexto
A exclusão de tenants e usuários era apenas lógica (soft delete) ou inexistente. Isso gerava inconsistência com o Logto Cloud (usuários fantasmas).

#### Implementação
- **Cascade local**: `DELETE /admin/tenants/:id` limpa AuditLogs, Users e API Keys via transação Prisma.
- **Logto Sync**: Uso da Management API para remover `logtoOrgId` e `authProviderId` (usuário) em tempo real.
- **Segurança Crítica**: O componente `ConfirmTenantDeleteModal` exige a digitação do nome da organização para evitar cliques acidentais.
- **Poka-yoke**: Mantida a proteção contra exclusão do tenant `MASTER`.

---

### Auditoria de Sessão e Login

**Data**: 2026-05-03 | **Status**: ✅ Concluído

#### Implementação
- **ADMIN_LOGIN**: Registrado tanto no login local quanto no callback de SSO (Logto).
- **ADMIN_LOGOUT**: Registrado no backend via sinalização do frontend antes do redirecionamento.
- **UI de Auditoria**: Timeline com timestamp relativo e absoluto, com cores semânticas para identificação rápida de logins (emerald) e logouts (amber).

---

---

## 🚀 INFRAESTRUTURA DE PRODUÇÃO (VPS)

| Componente | Detalhe |
|:---|:---|
| **OS** | Debian 13 (Trixie) - VPS Locaweb |
| **Domínio Principal** | `neonorte-ywara.tech` |
| **URL Admin** | `https://admin.neonorte-ywara.tech` |
| **Orquestração** | Docker Compose (Backends) + Nginx Host (Proxy/SSL) |
| **SSL** | Certbot (Let's Encrypt) |

---

## 🔄 CHANGELOG

### v1.6.0 (2026-05-04) — Produção: VPS + UX de Governança

- ✅ **Contextual Member Addition**: Implementado botão "Adicionar Membro" no `TenantDrawer`, permitindo criação de usuários já vinculados à organização com Poka-Yoke de assentos (seats).
- ✅ **Role Selection UX**: Refatorado o formulário de criação de usuário para incluir seletor explícito de Role (`ADMIN` vs `ENGINEER`) com badges semânticas.
- ✅ **Listagem Refinada**: Adicionada visibilidade de Role e Status (Ativo/Bloqueado) na `UsersTab`. Usuários bloqueados agora aparecem com estilo riscado.
- ✅ **Nginx Host Proxy**: Configuração do Proxy Reverso no host para suportar os domínios `admin.neonorte-ywara.tech` e SSL nativo.

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
| **Monitoramento de Churn** | Média | Implementar alertas de quota > 95% e auditoria de usuários inativos (Last Login). |
| Remover `M2M_SERVICE_TOKEN` | Alta | Após smoke test confirmar Bearer nos logs de ambos os serviços |
| Testes unitários `catalogService.js` | Média | Parser PAN/OND tem maior complexidade ciclomática do projeto |
| Secrets manager em produção | Alta | `LOGTO_M2M_CLIENT_SECRET`, `JWT_SECRET` e senhas de DB devem sair do `.env` plano |

> **Nota**: A pendência de whitelist no `PATCH /admin/tenants/:id` foi absorvida pela SPEC-005 (T5 do task checklist).

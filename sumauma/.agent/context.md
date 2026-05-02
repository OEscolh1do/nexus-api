# CONTEXT.md — Sumaúma (Backoffice do Operador)

> **Última Atualização:** 2026-05-01
> **Arquiteto:** Antigravity AI
> **Versão do Sistema:** 1.1.0 (Era Ywara)

---

## 📋 VISÃO GERAL

**Sumaúma** é o pilar central do ecossistema Ywara. Atua como o painel de gestão, controle e supervisão exclusivo dos operadores da Neonorte. Opera como **GOD-MODE** — a base estrutural que sustenta e conecta os demais serviços (Iaçã e Kurupira).

Este módulo é **separado** dos sistemas de produto (Iaçã e Kurupira) e se comunica com eles via:
- **Leitura direta** (Prisma read-only) para consultas, relatórios e auditoria.
- **M2M HTTP** (Axios + Service Token) para mutações que requerem business logic.

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
- **M2M Client**: Axios (comunicação com Iaçã e Kurupira APIs)
- **Auth**: Logto SSO (ID Token JWT + JWKS Validation)
- **Validação**: Zod

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

## 📡 ENDPOINTS CRÍTICOS

| Variável | Valor (Dev) |
|----------|------------|
| `LOGTO_ENDPOINT` | `https://214fzz.logto.app` |
| `LOGTO_JWKS_URI` | `https://214fzz.logto.app/oidc/jwks` |
| `DATABASE_URL_IACA_RO` | `mysql://user_admin:admin_S3cur3_2026!@localhost:3306/db_iaca` |
| `DATABASE_URL_KURUPIRA_RO` | `mysql://user_admin:admin_S3cur3_2026!@localhost:3306/db_kurupira` |
| `M2M_SERVICE_TOKEN` | `m2m_guardioes_secret_2026!` |
| `JWT_SECRET` | (Opcional - Logto usa RSA/JWKS) |

---

## 🔐 AUTENTICAÇÃO (LOGTO)

1. O operador clica em "Entrar" e é redirecionado para o Logto Cloud (`214fzz.logto.app`).
2. Após o login, o frontend recebe um **ID Token (JWT)** assinado pelo Logto.
3. O frontend armazena este JWT e o envia em todas as requisições via header `Authorization: Bearer <JWT>`.
4. O Backend (`platformAuth.js`) valida a assinatura do JWT usando as chaves públicas (JWKS) do Logto.
5. A permissão é verificada via claim customizada `role: PLATFORM_ADMIN`.
6. Para ações administrativas no Logto, o BFF usa o **M2M Client** com Client Credentials.

---

## 📐 CONVENÇÕES

### Código
- **Backend**: CommonJS (`require`/`module.exports`), mesmo padrão do Kurupira e Iaçã.
- **Frontend**: ESM (`import`/`export`), TypeScript strict.
- **Naming**: camelCase para variáveis/funções, PascalCase para componentes React, kebab-case para arquivos CSS.

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

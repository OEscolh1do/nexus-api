# CONTEXT.md — Neonorte Admin (Backoffice do Operador)

> **Última Atualização:** 2026-04-30
> **Arquiteto:** Antigravity AI
> **Versão do Sistema:** 1.0.0 (Bootstrap)

---

## 📋 VISÃO GERAL

**Neonorte Admin** é o painel de gestão, controle e supervisão exclusivo dos operadores da plataforma Neonorte. Opera como **GOD-MODE** — a empresa dona gerencia acessos, assinaturas, catálogos de equipamentos, auditoria e saúde do sistema.

Este módulo é **separado** dos sistemas de produto (Iaçã e Kurupira) e se comunica com eles via:
- **Leitura direta** (Prisma read-only) para consultas, relatórios e auditoria.
- **M2M HTTP** (Axios + Service Token) para mutações que requerem business logic.

| Aspecto | Detalhe |
|---------|--------|
| **Papel** | Backoffice do operador (GOD-MODE) |
| **Usuários** | Equipe interna Neonorte (role: `PLATFORM_ADMIN`) |
| **Porta Backend** | 3003 |
| **Porta Frontend** | 5175 (dev) |

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

### Backend (BFF)
- **Runtime**: Node.js (CommonJS)
- **Framework**: Express 5
- **ORM**: Prisma 5.10 (dois clientes read-only: db_iaca + db_kurupira)
- **M2M Client**: Axios (comunicação com Iaçã e Kurupira APIs)
- **Auth**: JWT (role = PLATFORM_ADMIN)
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
| `PORT` | 3003 |
| `IACA_INTERNAL_URL` | `http://localhost:3001` |
| `KURUPIRA_INTERNAL_URL` | `http://localhost:3002` |
| `DATABASE_URL_IACA_RO` | `mysql://user_admin:admin_S3cur3_2026!@localhost:3306/db_iaca` |
| `DATABASE_URL_KURUPIRA_RO` | `mysql://user_admin:admin_S3cur3_2026!@localhost:3306/db_kurupira` |
| `M2M_SERVICE_TOKEN` | `m2m_guardioes_secret_2026!` |
| `JWT_SECRET` | `nexus_dev_secret_2026` |

---

## 🔐 AUTENTICAÇÃO

1. O operador faz login com username + password no Admin Frontend.
2. O Admin BFF valida e emite um JWT com `role: PLATFORM_ADMIN`.
3. Todas as rotas `/admin/*` exigem esse JWT via middleware `platformAuth`.
4. Para chamar Iaçã/Kurupira, o BFF usa o header `X-Service-Token` (M2M).

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
- **Escrever** → M2M HTTP para o serviço dono do dado.
- **Nunca** executar INSERT/UPDATE/DELETE diretamente nos bancos irmãos.

---

## 🔑 PADRÕES INEGOCIÁVEIS

1. **Dark mode é o ÚNICO modo**. Sem toggle light/dark.
2. **Toda mutação via M2M**. O BFF nunca escreve diretamente em `db_iaca` ou `db_kurupira`.
3. **Toda rota protegida**. Middleware `platformAuth` obrigatório em todas as rotas `/admin/*`.
4. **Sem self-registration**. Operadores são criados manualmente ou via seed.
5. **Auditoria obrigatória**. Toda ação administrativa gera log com `action: ADMIN_*`.
6. **PT-BR**. Todo texto visível ao operador.

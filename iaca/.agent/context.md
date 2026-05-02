# CONTEXT.md — Iaçã ERP

> **Última Atualização:** 2026-05-01
> **Status:** Bootstrap — Módulo em fase inicial de desenvolvimento.

---

## 📋 VISÃO GERAL

O **Iaçã** é o ERP do ecossistema Neonorte. Gerencia o lado comercial e operacional do negócio solar — Leads, Pipeline de Vendas, CRM, Contratos, Finanças e Faturamento.

| Aspecto | Detalhe |
|---------|---------|
| **Papel** | ERP — gestão de clientes, vendas e operações |
| **Usuários** | Equipe interna e gestores da empresa integradora |
| **Porta Backend** | 3001 |
| **Porta Frontend** | 5174 (dev) |

---

## 🏗️ STACK

- **Backend**: Node.js (CommonJS) + Express + Prisma (`db_iaca`)
- **Frontend**: Vite + React + TypeScript + Tailwind CSS (dark-mode)
- **Auth**: JWT integrado ao ecossistema Neonorte

---

## 📡 COMUNICAÇÃO

- Recebe chamadas M2M do `Sumaúma` (Admin) via header `X-Service-Token`.
- Compartilha autenticação com o Kurupira via SSO (Zitadel — futuro).
- Provê dados de Leads e Clientes ao Kurupira para vincular projetos.

---

## 🧩 MÓDULOS (Previstos)

| Módulo | Status |
|--------|--------|
| Pipeline de Leads | 🚧 Em desenvolvimento |
| CRM / Clientes | 🚧 Em desenvolvimento |
| Propostas Comerciais | 🔗 Integração com Kurupira |
| Finanças / Faturamento | ⏳ Previsto |

---

## 🔑 SKILLS DISPONÍVEIS

Nenhuma skill específica do Iaçã foi criada ainda.
Skills transversais disponíveis em `/.agent/skills/` (raiz global).

> Quando skills de domínio forem criadas (ex: `crm-pipeline`, `analista-fiscal`), devem ser adicionadas em `iaca/.agent/skills/`.

# Neonorte | Nexus Monolith — Agent Context (Session Bootstrap)

> **Propósito:** Este documento é injetado automaticamente no início de cada sessão de um agente IA para dar contexto completo sobre a arquitetura, domínio, segurança e estado do sistema. Sem este contexto, o agente opera às cegas.
>
> **Última Atualização:** 2026-03-10

---

## 1. Arquitetura: Monólito Modular (ADR-001)

**Status:** Aceito

O código está organizado em **Módulos de Domínio** auto-contidos dentro de `src/modules/`:

```
src/modules/{domain}/
├── controllers/       # Lógica de recebimento HTTP
├── services/          # Regras de Negócio (Prisma)
├── schemas/           # Validação Zod
├── middleware/        # Auth específico do módulo
└── ui/                # (Frontend) Views exclusivas
```

**Regra de Ouro:** Qualquer nova funcionalidade DEVE nascer dentro de `src/modules/`. Pastas globais (`src/lib`) são apenas para infraestrutura genérica.

---

## 2. Multi-Tenancy e RLS (ADR-003)

**Status:** Implementado universalmente (7 ciclos de auditoria SEC-OPS)

Isolamento de dados por **Row-Level Security**:

- Toda tabela principal tem coluna `tenantId` (String)
- **Proibido:** `prisma.lead.findMany({})` — retorna dados de todos os tenants
- **Obrigatório:** Usar `withTenant(tenantId, async (tx) => { ... })` que injeta `tenantId` automaticamente via `asyncLocalStorage`
- O `auth.middleware.js` propaga `tenantId` + `userId` no contexto assíncrono
- CRONs devem extrair `tenantId` dos registros que processam (não existe contexto HTTP)
- Locking distribuído via `cron-lock.js` com `lockSignature` para release idempotente

---

## 3. RBAC — Controle de Acesso por Papel

| Role | Escopo |
|---|---|
| **ADMIN** | Acesso irrestrito |
| **C_LEVEL** | Visão executiva de alto nível (BI, Finanças, Estratégia) |
| **DIRECTOR** | Diretor de área com acesso a BI e portfólios cruzados |
| **MANAGER** | Acesso total ao seu módulo, leitura em correlatos |
| **COORDENACAO** | Read/Write todos projetos, sem Delete |
| **VENDEDOR** | Read/Write apenas projetos próprios |
| **B2B_CLIENT** | Extranet: vê apenas projetos onde `clientId === user.id` |
| **B2P_VENDOR** | Extranet: vê apenas tasks vinculadas ao seu `vendorId` |
| **TECH** | Apenas suas tarefas designadas |
| **USER** | Operacional básico, dashboards de leitura |

Middleware de proteção: `requireRole(['ROLE1', 'ROLE2'])` em `auth.middleware.js`.

---

## 4. Glossário de Domínio (DDD — Linguagem Ubíqua)

Use estes termos exatos em Classes, Tabelas e Variáveis:

| Domínio | Termo | Definição |
|---|---|---|
| Commercial | **Lead** | Potencial cliente sem proposta |
| Commercial | **Deal/Opportunity** | Lead em negociação com valor monetário |
| Commercial | **TechnicalProposal** | Documento técnico gerado pelo Solar Engine, antes chamado de SolarProposal |
| Commercial | **Pipeline / Stage** | Estruturas de funil de conversão para Leads e Opportunities |
| Ops | **Project (Obra)** | Execução vendida. Nasce quando Deal é "Closed Won" |
| Ops | **Program** | Agrupamento macro de Projetos para gestão de portfólio executivo |
| Ops | **OperationalTask** | Menor unidade de trabalho (Milestone ou Standard) |
| Ops | **DailyReport** | Relatório Diário de Obra submetido por técnicos ou Vendors (Implementado) |
| Strategy | **Objective** | O que queremos alcançar |
| Strategy | **KeyResult** | Quantificação do objetivo |
| Strategy | **KeyResultCheckIn** | Registro periódico de progresso de um KeyResult com valor anterior/novo e comentário |
| Finance | **Ledger** | Registro imutável de transações (PostgreSQL) |
| Finance | **LedgerEntry** | Entrada única no Ledger. |
| Ops | **HRLeave** | Solicitação e aprovação de ausências (férias, atestado, licenças) |
| Ops | **Event** | Evento global de calendário na plataforma |

---

## 5. Módulos Ativos e Rotas

```
Frontend SPA (React + Vite + Tailwind)
  └── /                          → AppSwitcher (Portal de Entrada)
  └── /executive/overview        → ExecutiveDashboard
  └── /executive/strategy        → StrategyManagerView
  └── /executive/portfolio       → PortfolioView
  └── /executive/people          → PeopleView
  └── /executive/financial       → FinancialDashboard
  └── /executive/audit           → AuditTrailView
  └── /executive/analytics       → BIView
  └── /commercial/pipeline       → CommercialPipeline
  └── /commercial/missions       → MissionControl
  └── /commercial/performance    → CommercialPerformance
  └── /commercial/clients        → ClientsView
  └── /commercial/contracts      → ContractsView
  └── /ops/cockpit               → ProjectCockpit
  └── /ops/portfolio             → ProjectBoard
  └── /ops/kanban                → KanbanView
  └── /ops/gantt                 → GanttMatrixView
  └── /ops/workload              → WorkloadView
  └── /ops/strategy              → StrategyReviewView
  └── /ops/approvals             → ApprovalCenterView
  └── /ops/issues                → (Em breve)
  └── /ops/map                   → (Em breve)

### Ecossistema Externo & Apps
1. **Portal do Cliente (B2B)** (`/extranet/client/dashboard`): Dashboard de transparência para clientes acompanharem obras e contratos.
2. **Terminal Extranet (B2P)** (`/extranet/vendor/tasks`): RDOs, ocorrências e faturamento para fornecedores e parceiros.
3. **Portal Academy** (`/academy`): Plataforma de treinamento, capacitação e comunidade.
4. **Lumi (App Externo)**: Ferramenta independente para dimensionamento fotovoltaico, integrada visualmente ao portal hub.
5. **RDOCreator** (`/extranet/vendor/rdo`): Criação de Relatórios Diários de Obra.

  └── /admin/tenant              → TenantSettings (SSO + API Quotas)
  └── /admin/navigation          → NavigationSettings
  └── /academy                   → Placeholder

Backend Monolith (Node.js + Express)
  └── /api/v2/iam/*              → Auth, Login, SSO Callback
  └── /api/v2/ops/*              → Projects, Tasks, CRUD
  └── /api/v2/commercial/*       → Leads, Pipeline, Interactions
  └── /api/v2/extranet/*         → B2B/B2P Isolated APIs
  └── /api/v2/gateway/*          → API Monetization (API Key auth)
  └── /api/v2/fin/*              → Financial, Ledger, Invoices
  └── /api/v2/bi/*               → Analytics, DWH, AI Predictions
  └── /api/v2/strategy/*         → OKRs, Pillars, Check-ins
  └── /api/v2/audit/*            → Event Sourcing, Trails
  └── /api/v2/core/*             → Core & Shared Services
  └── /api/v2/:resource          → Universal CRUD (GET only, RLS-wrapped)
```

---

## 7. Infraestrutura de Deploy

## 6. Stack Tecnológica

| Camada | Tecnologia | Versão Principal |
|---|---|---|
| Runtime | Node.js | v24+ |
| Backend | Express + Prisma | Prisma v5.10.x |
| Frontend | React + Vite + TypeScript | React 19, Vite 7, TS 5.9 |
| Estilização | TailwindCSS | v4.1.x |

---

## 7. Infraestrutura de Deploy

| Camada | Provedor | Região |
|---|---|---|
| Frontend | Cloudflare Pages | Edge Global |
| Backend API | Fly.io | GRU (São Paulo) |
| Database | Supabase PostgreSQL | São Paulo |

**Variáveis críticas:** `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `NODE_ENV`

---

## 8. Enterprise Roadmap — Estado Atual

| Fase | Status |
|---|---|
| **Fase 1:** Fundação Corporativa (RLS, Audit, DDoS, Ledger) | ✅ Concluído |
| **Fase 2:** Extranets B2B/B2P (Client Portal, Vendor Terminal) | ✅ Concluído |
| **Fase 3:** API Monetization + Enterprise SSO (SAML/OIDC) | ✅ Concluído |

**Pendente (futuro):** Migração de Auth para Supabase IdaaS, certificados SAML reais de clientes.

---

## 9. Convenção para Novo Módulo

Ao criar qualquer novo módulo:

1. Criar pasta em `src/modules/{nome}/` com a estrutura padrão
2. Definir Schema Zod ANTES de escrever o Controller
3. **Toda query Prisma** deve filtrar por `tenantId` (usar `withTenant`)
4. Emitir eventos relevantes para outros módulos (`events.emit`)
5. Registrar rotas em `server.js` com `authenticateToken`

**Checklist obrigatório:**
- [ ] Queries Prisma filtram por `tenantId`?
- [ ] Schema Zod valida inputs?
- [ ] Permissões RBAC aplicadas?
- [ ] Eventos emitidos para mudanças de estado?

---

## 📍 Documentação Complementar (Carregar sob demanda)

Para apontar intervenções em módulos específicos, consulte:
- `docs/map_nexus_monolith/` — Mapas de Interface por módulo (rotas, componentes, fluxos)
- `docs/progress_tracking/` — Changelog, TRL, Migration Plan
- `docs/enterprise_roadmap/` — PHASE_1/2/3 detalhados
- `docs/adr/` — Decisões arquiteturais específicas (004–008)

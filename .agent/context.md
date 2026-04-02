# CONTEXT.md — Sistema NEONORTE

> **Última Atualização:** 2026-04-02
> **Arquiteto:** Antigravity AI
> **Versão do Sistema:** 3.3.0 (Catalog Consolidation + Premium Dark UI)

---

## 📋 VISÃO GERAL

**Neonorte** é um ecossistema **multi-serviço** para o setor de energia solar. O antigo monólito "Nexus" foi cisado em dois domínios autônomos, cada um com frontend + backend + schema MySQL dedicado, orquestrados por Docker Compose.

| Domínio | Codinome | Responsabilidade |
|---------|----------|-----------------|
| **Gestão & CRM** | **Iaçã** | ERP, Leads, Pipeline, Finanças, Strategy, Operations, IAM |
| **Engenharia Solar** | **Kurupira** | Dimensionamento, Elétrico, Documentação, Proposta, Simulação |

### Comunicação entre Domínios

- **Iaçã → Kurupira:** Deep links com query params (`?leadId=X&name=...`)
- **Kurupira → Iaçã:** API M2M com `M2M_SERVICE_TOKEN` (busca contexto do Lead)
- **Sem duplicação de dados comerciais** — Kurupira guarda apenas `iacaLeadId` como FK virtual

---

## 🏗️ ARQUITETURA (v3.0)

### Stack Tecnológico

| Camada | Iaçã | Kurupira |
|--------|------|----------|
| **Frontend** | React 19.2, Vite, TailwindCSS, Axios | React 19.2, Vite, TailwindCSS CDN, Zustand |
| **Backend** | Express.js, Prisma, MySQL | Express.js, Prisma, MySQL |
| **Porta (dev)** | `3000` (frontend), `3001` (backend) | `5173` (frontend), `3002` (backend) |
| **Docker Image** | `node:20-slim` | `node:20-slim` |

### Infraestrutura Docker (4 Contentores)

| Contentor | Hostname | Memória |
|-----------|----------|---------|
| `neonorte_gateway` | API Gateway (Nginx) | — |
| `neonorte_iaca` | Iaçã Backend (Express) | 1 GB |
| `neonorte_kurupira` | Kurupira Backend (Express) | 4 GB |
| `neonorte_db` | MySQL 8.0 (schemas `db_iaca` + `db_kurupira`) | 1 GB |

---

## 🧩 MÓDULOS POR DOMÍNIO

### Iaçã (Gestão & CRM) — `iaca-erp/`

| Módulo | Localização | Status |
|--------|------------|--------|
| Commercial (CRM, Leads, Pipeline) | `frontend/src/views/commercial/` | ✅ Operacional |
| Operations (Projetos, Tarefas, Gantt) | `frontend/src/modules/ops/` | ✅ Operacional |
| Strategy (OKRs, PPAs) | `frontend/src/modules/strategy/` | ✅ Operacional |
| IAM (Users, Roles, Hierarchy) | `backend/src/modules/iam/` | ✅ Operacional |
| Academy (Treinamento) | `frontend/src/views/academy/` | 🚧 Planejado |

### Kurupira (Engenharia Solar) — `kurupira/`

| Módulo | Localização | Status |
|--------|------------|--------|
| Dimensionamento (PV Array, Inversores) | `frontend/src/modules/engineering/` | ✅ Operacional |
| Elétrico & BOS (Cabos, Proteções) | `frontend/src/modules/electrical/` | ✅ Operacional |
| Documentação (Memorial, ART) | `frontend/src/modules/documentation/` | ✅ Operacional |
| Proposta (Pricing, PDF) | `frontend/src/modules/proposal/` | ✅ Operacional |
| Premissas (Settings Globais) | `frontend/src/modules/settings/` | ✅ Operacional |

---

## 🗄️ SCHEMAS DE BANCO DE DADOS (PRISMA)

### db_iaca (Iaçã — ~40 models)

Entidades principais: `User`, `Strategy`, `KeyResult`, `Project`, `OperationalTask`, `Lead`, `Mission`, `Opportunity`, `TechnicalProposal`, `Vendor`, `Contract`, `Budget`, `Invoice`, `PurchaseOrder`, `Material`, `ApprovalGate`, `Tenant`, `AuditLog`, `Pipeline`, `Stage`.

### db_kurupira (Kurupira — 6 models)

| Model | Descrição |
|-------|-----------|
| `TechnicalDesign` | Projeto técnico (FK virtual `iacaLeadId` → Lead do Iaçã) |
| `RoofSection` | Polígono GeoJSON de seção de telhado |
| `PVArray` | Configuração de strings + módulos + inversores |
| `Simulation` | Resultados de cálculos (geração, perdas, payback) |
| `ModuleCatalog` | Catálogo de módulos fotovoltaicos |
| `InverterCatalog` | Catálogo de inversores |

---

## 🛣️ ROTAS DA API

### Iaçã Backend (`:3001`)

- `POST /auth/login` — Autenticação JWT
- `[CRUD] /api/:resource` — Universal CRUD Controller
- `GET/POST /api/commercial/missions` — Missões
- `PATCH /api/commercial/leads/:id/score` — Scoring
- `PATCH /api/commercial/opportunities/:id/stage` — Pipeline

### Kurupira Backend (`:3002`)

- `GET /health` — Health check
- `[CRUD] /api/v1/designs` — Projetos técnicos
- `[CRUD] /api/v1/catalog/modules` — Catálogo de módulos
- `[CRUD] /api/v1/catalog/inverters` — Catálogo de inversores

---

## 🔐 SEGURANÇA

- **JWT compartilhado** entre Iaçã e Kurupira (`JWT_SECRET` comum)
- **M2M Service Token** para comunicação inter-serviço
- **Validação Zod** na fronteira de dados
- **RBAC** com roles: `ADMIN`, `COORDENACAO`, `VENDEDOR`, `ENGINEER`
- **Multi-Tenancy** via `tenantId` (Iaçã e Kurupira)
- **Auth Bypass (Dev)** — Em `NODE_ENV !== production`, o backend do Kurupira injeta um usuário mock para fluxo local sem JWT

---

## 📂 ESTRUTURA DO WORKSPACE

```
neonorte/
├── iaca-erp/
│   ├── frontend/     (React 19, Vite, Axios → iaca-backend:3001)
│   │   └── Deep links: LeadDrawer + Pipeline → Kurupira
│   └── backend/      (Express → db_iaca MySQL, M2M internos)
├── kurupira/
│   ├── frontend/     (React 19, Vite, Workspace dark, Zustand)
│   └── backend/      (Express → db_kurupira MySQL, M2M client)
├── packages/shared-core/  (vazio — futuro)
├── infra/
│   ├── mysql/init.sql     (GRANTs isolados por schema)
│   └── nginx/nginx.conf   (API Gateway routing)
├── .agent/
│   ├── context.md         (este ficheiro)
│   ├── aguardando/        (specs aguardando implementação)
│   ├── em-andamento/      (épico ativo — máximo 1 por vez)
│   ├── concluido/         (relatórios de execução finalizados)
│   ├── skills/            (skills do agente)
│   └── workflows/         (workflows de automação)
├── docker-compose.yml     (4 contentores)
└── CONTEXT.md             (este ficheiro, espelhado)
```

---

## 🚨 DÍVIDA TÉCNICA CONHECIDA

| Item | Status | Nota |
|------|--------|------|
| Kurupira `AuthProvider` | ✅ JWT Real | Lê token de `sessionStorage`/`localStorage`; mock DEV com `tenantId` |
| `ProjectService` | ✅ Integrado | `createStandaloneProject()` + save/load/delete conectados à API real |
| `SettingsService` | ✅ Integrado | `GET/PUT /api/v1/settings` via sentinel `iacaLeadId: '__settings__'` |
| Tenant Isolation | ✅ Implementado | `tenantId` no JWT (Iaçã) + filtro em todas as rotas Kurupira |
| `iacaLeadId` standalone | ✅ Corrigido | Projetos sem lead usam `null` (não mais `'standalone'`) |
| Catálogo de Equipamentos | ✅ Consolidado | `useCatalogStore` (SSoT), `catalogSlice` e `InMemoryEquipmentRepo` deprecated |
| `useProposalCalculator` | ✅ Corrigido | `FinanceSlice` removido, mockado localmente |
| `EquipmentDatabaseManager` | ✅ Removido | Funcionalidade movida para Iaçã ERP |
| ProjectExplorer thumbnails | ⚠️ Placeholder | Padrão generativo; aguarda lat/lng no schema para mapas estáticos reais |
| `targetPowerKwp` / `avgConsumption` | ⚠️ Fallback | Dados não retornados pela API de listagem; aguarda integração M2M Iaçã |
| TailwindCSS CDN | ⚠️ Warning | Migrar de CDN para PostCSS em produção |
| Prisma v5.10 → v7.x | 🟡 Baixa prioridade | Funcional, upgrade não-urgente |

---

## 🔄 CHANGELOG

### v3.3.0 (2026-04-02) — Catalog Consolidation + Premium Dark UI

- ✅ **Single Source of Truth:** Migração de `InverterCatalogDialog` e `ModuleCatalogDialog` do legacy `catalogSlice` para `useCatalogStore`. `catalogSlice` e `InMemoryEquipmentRepo` marcados `@deprecated`.
- ✅ **Premium Dark Glass UI:** Reescrita completa de `InverterInventoryItem` e `ModuleInventoryItem` com thumbnails + fallback local, badges MPPT/Fase, efficiency color coding, micro-animações hover (scale, glow, translate).
- ✅ **Diálogos Dark Theme:** `InverterCatalogDialog` e `ModuleCatalogDialog` inteiramente migrados para tema dark (header, filtros, grid, skeletons, empty state, footer).
- ✅ **ProjectExplorer Fixes:** MapPin não sobrepõe mais "Abrir Dimensionamento" (movido para badge bottom-left). Placeholder generativo com grid determinístico por hash do nome. Gradientes dinâmicos por status (DRAFT/IN_PROGRESS/REVIEW/APPROVED).
- ✅ **Limpeza de Dead Code:** Deletados `data/equipment/inverters.ts` e `constants/inverters.ts`.
- ✅ **Validação:** `tsc --noEmit` → EXIT CODE 0. Checkpoint: `0365567`.

### v3.2.1 (2026-04-01) — Tenant Isolation + Ferramentas Independentes

- ✅ **JWT com tenantId:** `iam.service.js` (Iaçã) agora inclui `tenantId` no payload do token. Campo `tenantId` adicionado ao `select` do login.
- ✅ **Schema Kurupira:** Campo `tenantId` adicionado ao `TechnicalDesign` com `@default("default-tenant-001")`; `iacaLeadId` agora `String?` (opcional). Novo `@@index([tenantId])`.
- ✅ **Backend Scoping:** Todas as rotas `/api/v1/designs` filtram por `req.user.tenantId`. POST cria com `tenantId`. GET/PUT/DELETE verificam `tenantId` antes de operar (proteção cross-tenant).
- ✅ **Prisma db push + seed:** Schema sincronizado via `docker exec neonorte_kurupira npx prisma db push`. Catálogo populado via `seed-catalog.js` (dados validados Neonorte: módulos DMEGC e inversores PHB Solar).
- ✅ **Frontend:** `ProjectService` usa `iacaLeadId: null` para standalone. `AuthProvider` propaga `tenantId` do JWT real e do mock DEV.
- ✅ **Deep Link completo:** `LeadDrawer.tsx` agora passa `?token=<jwt>&leadId=<id>` ao abrir Kurupira.

### v3.2.0 (2026-04-01) — Eng-First Standalone Projects + Infra Fixes

- ✅ **Fluxo Eng-First (Standalone):** Wizard multi-step (`ProjectInitWizardModal`) para criação de projetos diretamente no Kurupira, sem necessidade de Lead no Iaçã. Captura: Cliente, Local, Conexão, Tarifa e Consumo (média ou 12 meses).
- ✅ **ProjectService Integrado:** Método `createStandaloneProject()` com hard reset do Zustand para evitar resíduos de sessões anteriores.
- ✅ **Hub API Real:** `ProjectExplorer` conectado à `KurupiraClient.designs.list()` com botão "+ Novo Projeto".
- ✅ **Nginx Gateway Fix:** Diretiva `limit_req_zone` movida do bloco `server{}` para o contexto HTTP global, eliminando crash loop do container.
- ✅ **MySQL Porta Exposta:** Mapeamento `3306:3306` no `docker-compose.yml` para dev local.
- ✅ **Credenciais Corrigidas:** `DATABASE_URL` alinhada com credenciais reais do `init.sql`.
- ✅ **Prisma Sync:** Schema e Client sincronizados (campo `tenantId` reconhecido).

### v3.1.0 (2026-03-23) — Engenharia Funcional, WebGL & Biblioteca Visual

- ✅ **Contexto Comercial Permanente e Painel de Propriedades:** Refatoração do `WorkspaceLayout` para grid de 4 colunas. Extração das `tabs` de entidades (Módulos, Inversores, Strings) do `RightInspector` para um novo `PropertiesDrawer` central e colapsável. O `RightInspector` agora serve permanentemente como um painel de "Contexto Comercial", provendo os dados unificados do Iaçã (Consumo Mensal) e CRESESB (Geração Mensal editável por fonte) em visões lado a lado.
- ✅ **Biblioteca Visual de Componentes:** Conclusão das Fases P0 a P4 da HUD do Kurupira. Implementação central do `solarStore` (Zustand) com histórico (Zundo), migração de todos os consumidores, reparo do repositório InMemory e separação estrita de domínios (Catálogo vs Inventário).
- ✅ **Dimensionamento Funcional:** Formulários reativos (clamping, validação Zod), Atribuição física-lógica de Strings para Módulos 3D (Shift+Click), e Motor de Limites Térmicos integrados (VocMax compensado pela Temperatura Mínima Histórica vs Limites do Inversor) emitindo Alertas nos HealthChecks da HUD.
- ✅ **Integração Gráfica WebGL/Leaflet:** Estabelecimento da infraestrutura híbrida (MapView + Canvas). Criação do `projectSlice` e `uiStore`, sincronização Outliner ↔ Canvas (`flyTo`), renderização sob-demanda (0% CPU idle) e Feedback visual através de Cores Dinâmicas InstancedMesh (representando Strings conectadas) a 60fps.
- ✅ **Motor de Áreas de Instalação (P10 & P10.1):** Refatoração geométrica da infraestrutura de "Telhados Retangulares" para o motor `InstallationArea` freeform. Implementação de polígonos editáveis via vértices e Grips no mapa, Ray-Casting dinâmico (`isRectInsidePolygon`) para varredura de módulos órfãos, inputs exatos de dimensão geométrica no Inspector `AreaProperties`, e motor inteligente de Auto-Layout (*Smart Fill*) com AABB collision para autopreenchimento respeitando limites lógicos absolutos (Quantity Caps) sem sobrescrever trabalho manual.
- ✅ **Dockerização & Reestruturação:** Homologação final da cisão em infraestrutura containerizada persistente.

### v3.0.0 (2026-03-20) — Operação Guardiões

- ✅ Cisão do monólito em Iaçã (Gestão) + Kurupira (Engenharia)
- ✅ Docker Compose com 4 contentores + API Gateway Nginx
- ✅ Schemas MySQL isolados (`db_iaca` + `db_kurupira`)
- ✅ Workspace UI dark com sidebar (ProfileOrchestrator → Workspace)
- ✅ Deep links Iaçã → Kurupira (LeadDrawer + Pipeline)
- ✅ Remoção completa de Supabase (Auth, ProjectService, SettingsService)
- ✅ Resolução do ESM deadlock (`selectFinanceResults` órfão)

### v2.2.0 (2026-01-26)

- Expansão do módulo Commercial (Mission, Opportunity, TechnicalProposal)
- Lead Scoring, Mission Control, Pipeline Kanban

### v2.0.0 (2026-01-20)

- Integração do módulo Solar, Universal CRUD Controller, Prisma ORM, Docker

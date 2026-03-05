# MAPA_SISTEMA.md - Mapa de Sistema Integrado (Neonorte | Nexus 2.0)

> **Localização:** Raiz do Projeto
> **Objetivo:** Facilitar a navegação mapeando Interface Visual -> Código Fonte no diretório `nexus-core`.
> **Status:** Atualizado Pós-Purge (23/01/2026)

---

## 🗺️ FRONTEND (`nexus-core/frontend`)

### 🖥️ Módulos e Visões (Neonorte | Nexus Monolith)

| Objeto de Interface | Rota            | Arquivo Principal (`nexus-monolith/frontend`)   | Descrição                                 |
| :------------------ | :-------------- | :---------------------------------------------- | :---------------------------------------- |
| **Dashboard**       | `/`             | `src/views/DashboardView.tsx`                   | Visão geral de KPIs e Smart Briefing.     |
| **Estratégias**     | `/ops/strategy` | `src/modules/ops/ui/StrategyManagerView.tsx`    | Gestão de PPA, OKRs e Key Results.        |
| **Projetos**        | `/ops/gantt`    | `src/modules/ops/ui/GanttMatrixView.tsx`        | Matriz de projetos e visão de cronograma. |
| **Tarefas**         | `/ops/kanban`   | `src/modules/ops/ui/KanbanView.tsx`             | Quadro Kanban para operação técnica.      |
| **Pessoas**         | `/ops/people`   | `src/modules/ops/ui/PeopleView.tsx`             | Organograma e gestão de equipe.           |
| **Solar Tab**       | `/commercial`   | `src/modules/commercial/ui/SolarWizardView.tsx` | Dossiê técnico (Integrado ao Commercial). |

### ☀️ Solar Tab (INTEGRADO - Módulo Completo)

**Localização:** `frontend/src/modules/solar/`

**Trigger:** Ativado automaticamente quando `Project.type === 'SOLAR'`

**Arquitetura:**

```
SolarModuleView.tsx (Orquestrador)
├── components/
│   ├── InputForm.tsx (Fase 1: Mapeamento Leaflet)
│   ├── EnergyFluxForm.tsx (Fase 2: Consumo)
│   ├── TechnicalForm.tsx (Fase 3: Dimensionamento)
│   ├── ModuleForm.tsx (Fase 4: Painéis)
│   ├── InverterForm.tsx (Fase 5: Inversores)
│   ├── ServiceCompositionPhase.tsx (Fase 6: Proposta)
│   ├── ProposalTemplate.tsx (PDF Generator)
│   ├── SolarCharts.tsx (Gráficos)
│   ├── AnalysisPhase.tsx
│   ├── SettingsPanel.tsx
│   └── TechConfigForm.tsx
├── services/
│   ├── solarEngine.ts (Cálculos)
│   ├── weatherService.ts (NASA API)
│   └── cresesbData.ts (Irradiação BR)
├── data/
│   ├── modules.ts (Catálogo painéis)
│   └── inverters.ts (Catálogo inversores)
└── types.ts (TypeScript definitions)
```

**Fluxo de Dados:**

1. Usuário preenche wizard (6 etapas)
2. Estado gerenciado em `SolarModuleView` (useState)
3. Cálculos executados por `solarEngine.ts`
4. Dados persistidos em `Project.details` via `PUT /api/projects/:id`
5. Validação Zod obrigatória no backend
6. PDF gerado via `ProposalTemplate` + jspdf + html2canvas

---

## ⚙️ BACKEND (`nexus-core/backend`)

### 📡 Arquitetura Universal

O backend opera com um controlador universal que mapeia rotas diretamente para modelos Prisma.

| Recurso            | Arquivo                | Lógica                                            |
| :----------------- | :--------------------- | :------------------------------------------------ |
| **Server Central** | `src/server.js`        | Definição de rotas, middlewares e Universal CRUD. |
| **Schema DB**      | `prisma/schema.prisma` | Definição de tabelas MySQL.                       |

---

## 🔗 Conexões Dinâmicas

1. **Adicionar Campo em Projeto?**
   - Backend: Alterar `prisma/schema.prisma` -> `Project`.
   - Frontend: Atualizar `TaskFormModal.tsx` ou formulários específicos.

2. **Mudar lógica do Dashboard?**
   - Frontend: Alterar `src/services/dashboardService.ts`.

3. **Configurar conexão com Banco?**
   - Docker: `docker-compose.yml` (`DATABASE_URL`).
   - Local: `.env` na raiz da pasta `backend`.

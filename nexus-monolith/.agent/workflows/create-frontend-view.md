---
description: How to create or refactor a frontend view, page or component following project conventions
---

# Criar ou Refatorar View no Frontend

## Stack do Frontend
- **Framework:** React 19.2 + TypeScript 5.9
- **Build:** Vite 7.x
- **Routing:** React Router v6 (`App.tsx`)
- **Styling:** TailwindCSS 4.x
- **Componentes UI:** Shadcn/UI (Radix UI) em `src/components/ui/`
- **API Client:** Axios wrapper em `src/lib/api.ts`
- **Deploy:** Cloudflare Pages (auto-deploy via GitHub push → `npm run build` → `frontend/dist`)

## Organização de Arquivos

```
frontend/src/
├── views/             # Views de alto nível (Layouts + Pages por domínio)
│   ├── ops/           # OpsLayout.tsx + sub-views
│   ├── executive/     # ExecutiveLayout.tsx + CommandCenterView, AuditTrailView
│   ├── commercial/    # CommercialLayout.tsx + Pipeline, SolarWizard, MissionControl
│   ├── extranet/      # Portais isolados (b2b/ClientPortal, b2p/VendorPortal)
│   ├── admin/         # TenantSettings, NavigationSettings
│   └── AppSwitcher.tsx  # Landing page autenticada (cards de módulo)
│
├── modules/           # Lógica e UI específica por domínio
│   ├── ops/ui/        # ProjectCockpit, KanbanView, GanttMatrixView, etc.
│   ├── fin/ui/        # FinancialDashboard
│   ├── bi/ui/         # AnalyticsDashboard
│   ├── strategy/ui/   # StrategyManagerView, StrategyReviewView
│   ├── iam/ui/        # LoginForm
│   └── solar/         # SolarEngine, wizard components
│
├── components/ui/     # Shadcn/UI primitives (Button, Card, Dialog, Table, etc.)
├── lib/api.ts         # Axios instance configurada com token JWT
├── types/             # TypeScript interfaces compartilhadas
└── hooks/             # Custom hooks reutilizáveis
```

## Passos para Nova View

### 1. Definir Rota em `App.tsx`

Adicionar rota dentro do Layout pai correto:
```tsx
import { NovaView } from "@/views/<dominio>/NovaView"

// Dentro do <Routes>:
<Route path="<dominio>/*" element={<DominioLayout />}>
  <Route path="nova-view" element={<NovaView />} />
</Route>
```

### 2. Criar View Component

Criar `frontend/src/views/<dominio>/NovaView.tsx`:

- Use componentes de `@/components/ui/` (Button, Card, Dialog, Table, etc.)
- Implemente 3 estados obrigatórios: `loading` (skeleton), `error` (toast/inline), `success`
- Dados via `useEffect` + `api.get(...)` ou custom hook em `hooks/`
- Nunca coloque lógica de negócio pesada na view — extrair para hook ou `modules/<dominio>/`

### 3. Integração com API

```typescript
import { api } from "@/lib/api";

// GET: listar recursos
const { data } = await api.get("/api/v2/<modulo>/<recurso>");

// POST: criar recurso
const { data } = await api.post("/api/v2/<modulo>/<recurso>", payload);
```

### 4. Formulários (React Hook Form + Zod)

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({ /* campos */ });
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

### 5. Navegação no Sidebar

Se a nova view precisa aparecer no menu, atualizar o `navigation.service.js` no backend (ele gera o menu dinâmico via API).

## Regras Obrigatórias

1. **TypeScript estrito** — sem `any` sem justificativa, sem `as unknown`
2. **Sem lógica de negócio na view** — extrair para hook ou module
3. **Shadcn/UI first** — usar componentes existentes de `components/ui/` antes de criar novos
4. **Responsividade** — testar em viewport mobile (Extranet usa bottom navigation mobile-first)
5. **Build limpo** — `npm run build` deve passar sem erros antes de PR

// turbo
## Verificar Build
```bash
cd frontend && npm run build
```

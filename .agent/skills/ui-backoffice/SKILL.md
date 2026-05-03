---
name: ui-backoffice
description: Especialista em UI/UX do Sumaúma (painel administrativo Neonorte). Ative ao construir páginas, componentes visuais, DataGrids, dashboards operacionais, layouts, formulários de gestão ou definir o Design System do Admin. Foco em alta densidade de dados e eficiência operacional — dark mode exclusivo, sem animações, dados aparecem instantaneamente.
---

# Skill: UI Backoffice

## Gatilho Semântico

Ativado quando:
- O agente precisa criar ou modificar componentes em `sumauma/frontend/src/`
- A tarefa envolve DataGrids, tabelas filtráveis, formulários de edição ou dashboards de KPIs
- É necessário definir layout de páginas do Sumaúma
- Qualquer menção a: `Admin Frontend`, `DataGrid`, `tabela de usuários`, `dashboard`, `admin UI`, `dark mode`, `Sumaúma frontend`
- Decisões sobre cores, tipografia, espaçamento, responsividade ou componentes Radix

## Protocolo

### 1. Princípios de Design (Backoffice ≠ Produto)

O Sumaúma é uma **ferramenta de trabalho para operadores da Neonorte**, não uma vitrine para clientes:

| Princípio | Regra |
|:---|:---|
| **Densidade** | Maximizar informação por viewport. Padding mínimo, tabelas compactas. |
| **Eficiência** | Ações em 1–2 cliques. Shortcuts de teclado para operações frequentes. |
| **Clareza** | Status de cada item legível em < 1 segundo (badges coloridos). |
| **Sobriedade** | Sem animações de entrada, sem transições elaboradas, sem gamificação. |
| **Instantaneidade** | Dados aparecem imediatamente — sem skeleton/fade-in de listagens. |
| **Consistência** | Todas as páginas: Sidebar + Header + Content Area. |

### 2. Design Tokens

```css
/* Paleta — Dark Mode ÚNICO */
--bg:       #0f172a;  /* slate-900 */
--surface:  #1e293b;  /* slate-800 */
--border:   #334155;  /* slate-700 */
--text:     #e2e8f0;  /* slate-200 */
--muted:    #94a3b8;  /* slate-400 */

/* Semânticas */
--success:  #34d399;  /* emerald-400 */
--warning:  #fbbf24;  /* amber-400 */
--danger:   #f87171;  /* red-400 */
--info:     #38bdf8;  /* sky-400 */
--accent:   #a78bfa;  /* violet-400 — ações primárias */

/* Tipografia */
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Borda — NUNCA maior que 4px */
--radius: 4px;   /* rounded-sm */
```

### 3. Regras de Formatação Visual

| Elemento | Regra |
|:---|:---|
| Valores numéricos | Sempre `font-mono tabular-nums` |
| Datas | Sempre `dd/MM/yyyy HH:mm` (PT-BR) |
| Border radius | Sempre `rounded-sm` (4px) — **nunca** `rounded-md/lg/xl` |
| Animações de entrada | **Proibidas** em listagens e dados |
| Modais | In-context overlays ou drawers — nunca Portal flutuante central |
| Dark mode | **Único modo** — sem toggle light/dark |

### 4. Stack Frontend

| Dependência | Uso |
|:---|:---|
| Vite + React 19 + TypeScript | Framework principal |
| Tailwind CSS v4 | Estilos (dark-first, sem `light:` variants) |
| Radix UI (Dialog, Select, Separator, Tooltip) | Componentes base acessíveis |
| Lucide React | Ícones |
| React Router DOM v7 | Roteamento |
| react-hook-form + Zod | Formulários com validação |
| Zustand | Estado global (filtros, sidebar, auth) |
| Axios | HTTP (instância compartilhada com interceptor de auth) |

### 5. Layout Padrão

```
┌─────────────────────────────────────────────────────────┐
│ HEADER (h-12) — Logo | Breadcrumb | Status | User       │
├──────────┬──────────────────────────────────────────────┤
│ SIDEBAR  │ CONTENT AREA                                │
│ (w-56)   │                                             │
│          │  ┌─ Toolbar ─────────────────────────────┐  │
│ Dashboard│  │ Filtros | Busca | Ações Bulk | Export  │  │
│ Tenants  │  └───────────────────────────────────────┘  │
│ Usuários │  ┌─ DataGrid (sticky header) ─────────────┐ │
│ Catálogo │  │  Row 1                                 │ │
│ Auditoria│  │  Row 2  ...                            │ │
│ Sistema  │  └───────────────────────────────────────┘  │
│          │  ┌─ Pagination ───────────────────────────┐ │
│          │  │ 1–50 de 342  ◀ 1 2 3 ... ▶             │ │
│          │  └───────────────────────────────────────┘  │
└──────────┴──────────────────────────────────────────────┘
```

### 6. Componentes Core

| Componente | Uso | Observações |
|:---|:---|:---|
| `AdminLayout` | Shell: sidebar + header + content | Presente em todas as páginas |
| `DataGrid` | Tabelas paginadas com sort e filtro | Virtualização manual — sem lib externa |
| `StatCard` | Card de KPI no dashboard | Valor mono, label muted, ícone semântico |
| `StatusBadge` | Badge de status inline | `ACTIVE`=emerald, `BLOCKED`=red, `INDIVIDUAL`=sky, `CORPORATE`=violet |
| `SearchBar` | Busca global com debounce | 300ms debounce, placeholder contextual |
| `ConfirmDialog` | Modal de confirmação destrutiva | In-context (não Portal), Radix Dialog |
| `BulkActionBar` | Barra de ações ao selecionar items | Sticky no topo da DataGrid |
| `DetailDrawer` | Painel lateral de detalhes | Slide-in direita, w-96, focus trap |

### 7. Padrões de Interação

```
Listagem → Clicar linha → DetailDrawer abre (direita)
         → Checkbox + BulkActionBar → Ação em lote
         → Ícone de ação inline → ConfirmDialog se destrutiva

Formulário → Inline na DetailDrawer (não em página separada)
           → Validação react-hook-form + Zod
           → Submit desabilitado até dirty + valid
```

### 8. Autenticação no Frontend — Fluxo Logto

```typescript
// src/lib/api.ts — interceptor de auth com verificação proativa de expiração
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(async (config) => {
  const { getAccessToken, signOut } = useLogto.getState();

  const token = await getAccessToken();
  if (!token) { signOut(); return Promise.reject(new Error('Sessão expirada')); }

  // Verificar expiração com margem de 60s — logout proativo antes de receber 401
  const payload = JSON.parse(atob(token.split('.')[1]));
  if (payload.exp * 1000 - Date.now() < 60_000) {
    signOut();
    return Promise.reject(new Error('Token prestes a expirar'));
  }

  config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});
```

### 9. Páginas do Sumaúma

| Página | Rota | Componente | Skill Relacionada |
|:---|:---|:---|:---|
| Dashboard | `/` | `Dashboard.tsx` | `audit-backoffice` |
| Tenants | `/tenants` | `TenantsPage.tsx` | `tenant-backoffice` |
| Usuários | `/users` | `UsersPage.tsx` | `tenant-backoffice` |
| Catálogo | `/catalog` | `CatalogPage.tsx` | `catalog-backoffice` |
| Auditoria | `/audit-logs` | `AuditLogsPage.tsx` | `audit-backoffice` |
| Sistema | `/system` | `SystemPage.tsx` | `audit-backoffice` |

## Limitações e Boas Práticas

### Hard Boundaries
- ❌ Esta skill NÃO implementa lógica de backend ou rotas de API — delegue ao `bff-backoffice`.
- ❌ Esta skill NÃO decide regras de negócio de tenant/user — delegue ao `tenant-backoffice`.
- ❌ **Nunca** usar `rounded-md/lg/xl/2xl/3xl` — apenas `rounded-sm`.
- ❌ **Nunca** usar animações de entrada (fade-in, slide-up) em listagens.
- ❌ **Nunca** usar modais Portal flutuantes centrais — usar drawers ou in-context overlays.
- ❌ **Nunca** implementar toggle light/dark — dark mode é o único modo.

### Boas Práticas
- ✅ Todos os valores numéricos em `font-mono tabular-nums`.
- ✅ Todas as datas em `dd/MM/yyyy HH:mm` (PT-BR).
- ✅ Paginação server-side obrigatória para tabelas com >100 registros.
- ✅ Toda ação destrutiva exige ConfirmDialog com digitação do nome do recurso.
- ✅ Labels e textos visíveis ao operador sempre em PT-BR.
- ✅ Token verificado com margem de 60s antes do vencimento — logout proativo sem esperar 401.

---
name: ui-backoffice
description: Especialista em UI/UX do painel administrativo neonorte-admin. Ative ao construir páginas, componentes visuais, DataGrids, dashboards operacionais, layouts de backoffice, formulários de gestão, ou definir o Design System do Admin. Foco em alta densidade de dados e eficiência operacional — sem floreios de produto B2C.
---

# Skill: UI Backoffice

## Gatilho Semântico

Ativado quando:
- O agente precisa criar ou modificar componentes em `neonorte-admin/frontend/`
- A tarefa envolve construir DataGrids, tabelas filtráveis, formulários de edição ou dashboards de KPIs
- É necessário definir layout de páginas do painel administrativo
- Qualquer menção a: `Admin Frontend`, `DataGrid`, `tabela de usuários`, `dashboard de saúde`, `admin UI`
- Decisões sobre cores, tipografia, espaçamento ou responsividade dentro do painel Admin

## Protocolo

### 1. Princípios de Design (Backoffice ≠ Produto)

O painel Admin é uma **ferramenta de trabalho para operadores**, não uma vitrine para clientes. A estética segue o paradigma de **Control Room / Operations Center**:

| Princípio | Regra |
|:---|:---|
| **Densidade** | Maximizar informação por viewport. Padding mínimo, tabelas compactas. |
| **Eficiência** | Ações em 1-2 cliques. Atalhos de teclado para operações frequentes. |
| **Clareza** | Status de cada item deve ser legível em < 1 segundo (badges coloridos). |
| **Sobriedade** | Sem animações de entrada, sem transições elaboradas, sem gamificação. |
| **Consistência** | Todas as páginas seguem o mesmo esqueleto: Sidebar + Header + Content Area. |

### 2. Design Tokens do Admin

```css
/* Paleta de cores — Admin (Dark Mode obrigatório) */
--admin-bg:        #0f172a;  /* slate-900 */
--admin-surface:   #1e293b;  /* slate-800 */
--admin-border:    #334155;  /* slate-700 */
--admin-text:      #e2e8f0;  /* slate-200 */
--admin-muted:     #94a3b8;  /* slate-400 */

/* Cores semânticas */
--admin-success:   #34d399;  /* emerald-400 */
--admin-warning:   #fbbf24;  /* amber-400 */
--admin-danger:    #f87171;  /* red-400 */
--admin-info:      #38bdf8;  /* sky-400 */
--admin-accent:    #a78bfa;  /* violet-400 — ações primárias */

/* Tipografia */
--admin-font-sans: 'Inter', system-ui, sans-serif;
--admin-font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Bordas */
--admin-radius:    4px;  /* rounded-sm — NUNCA maior */
```

### 3. Esqueleto de Layout

```
┌─────────────────────────────────────────────────────────┐
│ HEADER (h-12)                                           │
│ Logo Neonorte │ Breadcrumb │ Status dos Serviços │ User │
├──────────┬──────────────────────────────────────────────┤
│ SIDEBAR  │ CONTENT AREA                                │
│ (w-56)   │                                             │
│          │ ┌─ Toolbar ─────────────────────────────┐   │
│ Dashboard│ │ Filtros │ Busca │ Ações Bulk │ Export  │   │
│ Usuários │ └──────────────────────────────────────────┘ │
│ Orgs     │ ┌─ DataGrid ───────────────────────────────┐ │
│ Catálogo │ │ ▸ Header row (sticky)                    │ │
│ Auditoria│ │   Row 1                                  │ │
│ Sistema  │ │   Row 2                                  │ │
│          │ │   ...                                    │ │
│          │ └──────────────────────────────────────────┘ │
│          │ ┌─ Pagination ─────────────────────────────┐ │
│          │ │ Mostrando 1-50 de 342 │ ◀ 1 2 3 ... ▶   │ │
│          │ └──────────────────────────────────────────┘ │
└──────────┴──────────────────────────────────────────────┘
```

### 4. Componentes Core (Inventário)

| Componente | Uso | Observações |
|:---|:---|:---|
| `AdminLayout` | Shell principal (sidebar + header + content) | Presente em todas as páginas |
| `DataGrid` | Tabelas paginadas com sort e filtro | Colunas fixas (checkbox, ações) + scroll horizontal |
| `StatCard` | Card de KPI no dashboard | Valor mono, label muted, ícone semântico |
| `StatusBadge` | Badge de status inline | `ACTIVE` = emerald, `BLOCKED` = red, `PENDING` = amber |
| `SearchBar` | Busca global com debounce | 300ms debounce, placeholder contextual por página |
| `ConfirmDialog` | Modal de confirmação de ação destrutiva | Inline ao content area (não Portal flutuante) |
| `BulkActionBar` | Barra de ações que aparece ao selecionar items | Posição sticky no topo da DataGrid |
| `DetailDrawer` | Painel lateral de detalhes de um registro | Slide-in da direita, w-96, foco trap |

### 5. Padrões de Interação

```
Listagem → Clicar na row → DetailDrawer abre (direita)
         → Checkbox + BulkActionBar → Ação em lote
         → Ação inline (ícone na row) → ConfirmDialog se destrutiva

Formulário → Inline na DetailDrawer (não em página separada)
           → Validação com Zod + react-hook-form
           → Submit desabilitado até dirty + valid
```

### 6. Stack de Frontend

- **Framework**: Vite + React 19 + TypeScript
- **Estilo**: Tailwind CSS v4 (modo dark-first)
- **Componentes base**: Radix UI (Dialog, Select, Separator, Tooltip)
- **Ícones**: Lucide React
- **Roteamento**: React Router DOM v7
- **Formulários**: react-hook-form + Zod
- **Tabelas**: Implementação custom (sem lib externa — controle total de virtualização)
- **State**: Zustand (para filtros globais, sidebar state, auth state)
- **HTTP**: Axios (reusa instância configurada com interceptors de auth)

## Limitações e Boas Práticas

### Hard Boundaries
- ❌ Esta skill NÃO implementa lógica de backend ou rotas de API — delegue ao `bff-backoffice`.
- ❌ Esta skill NÃO decide regras de negócio de tenant/user — delegue ao `tenant-backoffice`.
- ❌ **Nunca** usar `rounded-xl/2xl/3xl` em qualquer componente do Admin.
- ❌ **Nunca** usar animações de entrada (fade-in, slide-up) em listagens — dados devem aparecer instantaneamente.
- ❌ **Nunca** usar modais flutuantes centrais (Portal) — usar in-context overlays ou drawers.

### Boas Práticas
- ✅ Dark mode é o ÚNICO modo. Não implementar toggle light/dark.
- ✅ Todos os valores numéricos em `font-mono tabular-nums`.
- ✅ Todas as datas em formato `dd/MM/yyyy HH:mm` (PT-BR).
- ✅ Paginação server-side obrigatória para tabelas com >100 registros.
- ✅ Toda ação destrutiva exige confirmação com digitação do nome do recurso.
- ✅ Labels e textos visíveis ao operador em PT-BR.

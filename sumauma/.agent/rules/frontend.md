# Regras de Frontend — Neonorte Admin

## Estética: Control Room (Dark-Mode-Only)

1. **Paleta fixa**: `slate-900` (bg), `slate-800` (surface), `slate-700` (border), `slate-200` (text), `slate-400` (muted).
2. **Sem light mode**. O Admin é dark-only. Não implementar toggle.
3. **`rounded-sm` (4px)** em TUDO. Nunca `rounded-md/lg/xl`.
4. **Sem animações de entrada**. Dados renderizam instantaneamente.
5. **Sem gradientes ou glassmorphism**. Estética utilitária e sóbria.

## Componentes

1. **DataGrid**: Custom — sem lib externa. Virtualização se >500 rows.
2. **Formulários**: `react-hook-form` + `Zod`. Submit desabilitado até `dirty && valid`.
3. **Modais**: In-context overlays ou drawers laterais. Nunca Portals centrais flutuantes.
4. **Badges de status**: `emerald-400` (active), `red-400` (blocked), `amber-400` (pending).
5. **Ícones**: Lucide React exclusivamente. Tamanho padrão `16px` inline, `20px` standalone.

## Tipografia

1. **Valores numéricos**: `font-mono tabular-nums` obrigatório.
2. **Datas**: `dd/MM/yyyy HH:mm` (PT-BR). Usar `date-fns` com locale `pt-BR`.
3. **Labels**: PT-BR. Exceções apenas para siglas técnicas universais.
4. **Tamanhos mínimos**: `text-xs` (12px) para labels, `text-sm` (14px) para dados, `text-[11px]` apenas para badges.

## Layout

1. **Esqueleto fixo**: Sidebar (w-56) + Header (h-12) + Content Area.
2. **Sidebar colapsável**: `w-56` expandida, `w-16` colapsada (apenas ícones).
3. **Paginação server-side**: Obrigatória para tabelas com >100 registros.
4. **Scroll**: Ghost scrollbars (6px, slate-700). Nunca scrollbars nativas.

## State Management

1. **Zustand** para estado global (auth, sidebar, filtros ativos).
2. **React Query / SWR**: Avaliar para cache de dados server-side. Inicialmente Axios + useState.
3. **URL como state**: Filtros de tabela refletidos na URL (query params).

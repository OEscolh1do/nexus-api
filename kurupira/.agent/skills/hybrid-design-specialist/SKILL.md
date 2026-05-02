---
name: hybrid-design-specialist
description: >
  Especialista em design híbrido responsivo para o Kurupira. Ative esta skill sempre que precisar
  adaptar qualquer módulo do Kurupira para múltiplos dispositivos com layout híbrido (responsivo
  fluido + ajustes adaptativos). Triggers: ConsumptionCanvasView, ElectricalCanvasView,
  ProjectionCanvasView, ProposalCanvasView, ModuleCanvasView, MapCanvasView, SiteCanvasView,
  toolbars (ArrangementToolbar, ElectricalToolbar, SearchIsland, VisionIsland, NavigationIsland),
  painéis (SimulatedLoadsPanel, HardwareLibraryPanel, PVArrayBuilder), qualquer menção a mobile,
  tablet, responsivo, breakpoint, container query, clamp, touch target, thumb zone, ou "híbrido".
---

# Skill: Hybrid Design Specialist

## Gatilho Semântico

Ativado quando a tarefa envolve: responsividade de qualquer módulo do Kurupira, adaptação para
mobile/tablet, Container Queries, tipografia fluida, touch ergonomics, Thumb Zone, Core Web Vitals,
ou auditoria de layout em múltiplos breakpoints.

## ⛔ Escopo de Não-Intervenção (Hard Boundaries)

- ❌ Lógica de cálculo fotovoltaico (VocCold, VmpHot, MPPT) — domínio de `arranjo-motor-tecnico`
- ❌ Layers do Leaflet e SVG canvas (Layer 0–3) — domínio de `arranjo-layer-dev`
- ❌ Schema de banco de dados, migrations ou chamadas de API
- ❌ Infraestrutura, Docker, CI/CD

---

## Filosofia Híbrida para o Kurupira

O Kurupira é um SaaS de engenharia fotovoltaica. Seus módulos têm naturezas radicalmente
diferentes — alguns são ferramentas CAD densas, outros são painéis de dados ou documentos.
A estratégia híbrida respeita essa heterogeneidade:

| Módulo | Natureza | Estratégia |
|--------|----------|------------|
| `PhysicalCanvasView` (mapa + arranjo) | CAD-like, exige precisão | Desktop-first; mobile = modo leitura/aprovação |
| `ElectricalCanvasView` (diagrama elétrico) | Técnico denso | Desktop-first; mobile = scroll horizontal + pinch |
| `ProjectionCanvasView` (gráficos financeiros) | Data viz | Responsivo full; charts restack verticalmente |
| `ProposalCanvasView` (proposta comercial) | Documento A4 | Responsivo full; preview zoom-out em mobile |
| `ModuleCanvasView` (catálogo de módulos) | Grid de cards | Responsivo full; 1 → 2 → 3 → 4 colunas |
| `ConsumptionCanvasView` (consumo) | Formulário + chart | Responsivo full; painéis empilham no mobile |
| `MapCanvasView` / `SiteCanvasView` | Mapa interativo | Híbrido; controles migram para bottom sheet |
| Toolbars / Islands | Controles flutuantes | Container Query + Thumb Zone no mobile |

---

## Breakpoints Canônicos

```css
/* Base (Mobile-First): 0px   — uso com uma mão, polegar */
/* sm  (Tablet):       640px  — landscape ou tablet portrait */
/* lg  (Desktop):     1024px  — workspace padrão */
/* xl  (Wide):        1440px  — monitores wide, dual-screen */

/* Tailwind default mapping: sm:640 md:768 lg:1024 xl:1280 2xl:1536 */
```

Regra: use **min-width** (Mobile-First) para módulos com versão mobile real.
Use **max-width** (Desktop-First) somente onde mobile = modo degradado controlado (canvas técnicos).

---

## Container Queries — Regra de Ouro

Painéis e cards do Kurupira devem **sempre** usar Container Queries para adaptar seu layout
interno. Isso os torna portáteis entre sidebar estreita e área central larga — sem Media Queries
globais frágeis.

```tsx
// Wrapper recebe o contexto de contenção:
<div className="@container">
  <SimulatedLoadsPanel />
</div>

// Com plugin @tailwindcss/container-queries:
<div className="@container">
  <div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-3">
    {loads.map(load => <LoadCard key={load.id} {...load} />)}
  </div>
</div>
```

**Unidades de container para uso interno:**

| Unidade | Base de cálculo | Uso no Kurupira |
|---------|----------------|-----------------|
| `cqw`  | 1% da largura do container | Ícones e imagens internas |
| `cqi`  | 1% da dimensão inline | Tipografia responsiva ao painel |
| `cqmin` | Menor entre cqi e cqb | Garantia de legibilidade mínima |

---

## Tipografia Fluida — Fórmula Acessível (WCAG 1.4.4)

Nunca usar `vw` puro em `font-size` — quebra o zoom do browser para usuários com baixa visão.

```css
/* Fórmula segura: combina rem (respeita zoom) com vw (fluidez): */
font-size: clamp(0.875rem, calc(0.5rem + 1vw), 1rem);

/* Para texto dentro de container (@container): */
font-size: clamp(0.75rem, 2cqi, 1rem);
```

**Escala tipográfica do Kurupira:**

| Token Tailwind | Mobile | Desktop | Uso |
|----------------|--------|---------|-----|
| `text-xs`      | 11px   | 12px    | Labels técnicos, unidades (V, A, W) |
| `text-sm`      | 12px   | 13px    | Descrições, metadados de card |
| `text-base`    | 14px   | 15px    | Corpo de formulários |
| `text-lg`      | 16px   | 18px    | Títulos de seção de painel |
| `text-xl`      | 20px   | 24px    | Títulos de canvas views |

Dados numéricos rápidos (Volts, kWh, kWp): sempre `font-mono tabular-nums` para estabilidade visual.

---

## Touch Ergonomics — Thumb Zone

Em mobile, toda ação primária deve estar na **Thumb Zone** (terço inferior da tela):

```
┌─────────────────────┐
│  ← zona morta (top) │  Header leve, apenas leitura
│                     │
│   zona de conteúdo  │  Scroll, visualização de dados
│                     │
│  ████████████████   │  ← THUMB ZONE (bottom 40%)
│  [Nav] [Action] [+] │  CTAs e navegação primária aqui
└─────────────────────┘
```

**Regras de Touch Target:**
- Mínimo absoluto: `44×44px` (Apple HIG) — em Tailwind: `min-h-[44px] min-w-[44px]`
- Recomendado Google: `48×48px`
- Espaçamento mínimo entre targets: `8px`
- `CompactNumberInput`, `ValidationChip`, botões de toolbar: todos obedecem

**Padrão de navegação por dispositivo:**

| Dispositivo | Padrão | Implementação |
|-------------|--------|---------------|
| Desktop | Top nav ou sidebar com tabs | Layout padrão atual |
| Tablet | Sidebar collapsível | Drawer com overlay |
| Mobile | Tab Bar na base (≤ 5 itens) | `fixed bottom-0` nav |

---

## Estratégia por Módulo

### ConsumptionCanvasView
```
Desktop: [SimulatedLoadsPanel | ConsumptionChart]  ← side-by-side
Tablet:  [ConsumptionChart] + [SimulatedLoadsPanel abaixo]
Mobile:  Tabs alternando entre "Gráfico" e "Cargas"
```
- `SimulatedLoadsPanel`: `@container` — grid de cargas `1 → 2 → 3` colunas via `@md:grid-cols-2`
- `ConsumptionChart`: `aspect-ratio: 16/9` desktop; `aspect-ratio: 4/3` mobile
- Inputs de kWh: `min-h-[44px]`; atributo `inputMode="decimal"` para teclado numérico nativo

### ElectricalCanvasView + MPPTTopologyManager
```
Desktop: Canvas central + painéis laterais deslizáveis
Mobile:  Canvas com overflow-x scroll + pinch nativo; painéis → bottom sheet
```
- `VoltageRangeChart`: envolver em `overflow-x: auto` com indicador visual de scroll
- `CompactNumberInput`: `min-h-[44px]` mesmo em modo compacto
- `ValidationChip` / `ValidationChipMini`: `min-w-[80px]` para legibilidade mínima
- `DiagnosticAlertsList`: scroll independente com `max-h` fixo + `overflow-y: auto`

### ProjectionCanvasView (gráficos financeiros)
```
Desktop: Grid 2×2 de gráficos + sidebar de métricas
Tablet:  Grid 1×2
Mobile:  Stack vertical; cada gráfico full-width com aspect-ratio fixo
```
- Todos os gráficos Recharts: `<ResponsiveContainer width="100%" height="100%">` — nunca px fixos
- `AnalyticsTable`: `overflow-x: auto` + indicador de scroll lateral
- `ProjectionMetrics`: cards em `@container` — `1 → 2 → 4` colunas

### ModuleCanvasView + HardwareLibraryPanel
```
Desktop: Sidebar filtros (240px fixo) + grid de cards (3–4 cols)
Tablet:  Drawer de filtros + grid 2 cols
Mobile:  Bottom sheet de filtros + grid 1 col
```
- `ModuleCard` e `PVArrayCard`: Container Queries — layout horizontal (desktop) → vertical (mobile)
- `HardwareLibraryPanel`: virtualização de lista (`react-virtual`) obrigatória para performance mobile
- `ComparisonDrawer`: em mobile → modal full-screen em vez de drawer lateral

### ProposalCanvasView (documento A4)
```
Desktop: Preview A4 (794px) centralizado + edit panel lateral
Tablet:  Preview A4 scrollável + painel collapsível no topo
Mobile:  Tabs [Editar] / [Visualizar] — preview com scale() para caber na tela
```
- Pages (Cover, Investment, Technical...): manter proporção A4 `aspect-ratio: 210/297`
- Preview mobile: `transform: scale(0.42); transform-origin: top center` + scroll vertical
- `ProposalEditPanel`: seções colapsáveis com `<details>` ou Radix Accordion

### Toolbars e Islands (ArrangementToolbar, SearchIsland, etc.)
```tsx
// Padrão de Island responsiva — migra de topo-esquerda para base-centro:
<div className="
  fixed bottom-4 left-1/2 -translate-x-1/2
  lg:top-4 lg:bottom-auto lg:left-4 lg:translate-x-0
  flex gap-1 p-1 bg-slate-900 border border-slate-700 rounded-xl shadow-xl
  @container
">
  <IslandButtons />
</div>
```

---

## Core Web Vitals — Checklist

**LCP < 2.5s:**
- Primeiro gráfico visível: `loading="eager"` + `fetchPriority="high"`
- CSS crítico inline; JS não crítico com `defer`

**CLS < 0.1 — reservar espaço antes do conteúdo:**
```tsx
{/* SEMPRE dimensionar containers de gráficos: */}
<div className="w-full aspect-video">
  <ResponsiveContainer width="100%" height="100%">
    <LineChart ... />
  </ResponsiveContainer>
</div>
```

**INP < 200ms:**
```css
/* Feedback imediato no toque — nunca esperar o estado do React: */
button:active { transform: scale(0.97); transition: transform 80ms; }
/* Nunca usar :hover como único indicador de interatividade */
```

---

## Acessibilidade WCAG 2.2 — Inegociável

| Critério | Regra | Implementação |
|----------|-------|---------------|
| 1.4.10 Reflow | Funcionar em 320px sem scroll horizontal | Nenhuma largura fixa > 320px sem overflow controlado |
| 1.4.4 Resize Text | Texto deve escalar com zoom 200% | Nunca `font-size` em `vw` puro |
| 2.5.8 Target Size | Min 24×24px; ideal 44×44px | `min-h-[44px]` em todos os elementos interativos |
| 2.4.11 Focus Visible | Foco sempre visível | Nunca `outline: none` sem alternativa |
| 2.3.3 Animation | Respeitar `prefers-reduced-motion` | CSS media query obrigatório |

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Design Tokens — Arquitetura em 3 Camadas

```ts
// Camada 1 — Primitivos (o que É — valores brutos):
// --blue-500: #3B82F6 | --space-4: 1rem | --radius-sm: 0.25rem

// Camada 2 — Semânticos (o que FAZ — intenção):
// --color-primary: var(--blue-500)
// --space-section-gap: var(--space-4)
// --radius-card: var(--radius-sm)   ← alinhado com Engineering Tool Aesthetic

// Camada 3 — Componente (onde APLICA):
// --button-bg: var(--color-primary)
// --card-padding: var(--space-section-gap)
// --panel-radius: var(--radius-card)
```

**Breakpoints como tokens semânticos:**
```ts
const breakpoints = {
  mobile:  '0px',    // base — Mobile-First
  tablet:  '640px',  // sm
  desktop: '1024px', // lg — workspace padrão do Kurupira
  wide:    '1440px', // xl — monitores wide
}
```

---

## Fluxo de Trabalho ao Adaptar um Módulo

1. **Auditar** — ler o componente: larguras fixas em px, botões sem `min-h`, estados só em `:hover`, Media Queries globais
2. **Mapear** — definir comportamento esperado em cada breakpoint (mobile → tablet → desktop)
3. **Adicionar `@container`** — no wrapper do painel ou card; converter Media Queries internas para `@container`
4. **Touch** — garantir `min-h-[44px]` em todos elementos interativos
5. **Tipografia** — converter `font-size` fixos para `clamp()` com `rem` + `cqi`/`vw`
6. **Reservar espaço** — `aspect-ratio` em charts e imagens para zerar CLS
7. **Testar** — DevTools: 375px (iPhone SE), 768px (iPad), 1280px (laptop), 1920px (desktop)
8. **Acessibilidade** — zoom 200% no browser; navegação por teclado; `prefers-reduced-motion`

---

## Anti-Padrões — Nunca Fazer

| Anti-padrão | Problema | Correção |
|-------------|----------|----------|
| `width: 800px` fixo em painel | Quebra em tablet | `max-w-[800px] w-full` |
| `font-size: 2vw` puro | Quebra zoom WCAG | `clamp(0.75rem, 2cqi, 1rem)` |
| `:hover` como único feedback | Invisível no toque | Adicionar `:active` e estado visual |
| Botões `height: 28px` | Abaixo do touch target | `min-h-[44px]` |
| `overflow: hidden` sem scroll | Conteúdo cortado no mobile | `overflow-x: auto` com wrapper |
| Media Query dentro de componente | Quebra ao mover o componente | Trocar por `@container` |
| `position: fixed` interno | Quebra scroll em iOS Safari | Usar scroll container dedicado |
| Tabela sem `overflow-x: auto` | Overflow horizontal no mobile | Wrapper com `overflow-x: auto` |
| Recharts com `width={600}` fixo | Quebra em telas pequenas | `<ResponsiveContainer width="100%">` |

---

## Protocolo de Entrega

1. **Componente `.tsx`** completo, com props tipadas e variantes responsivas
2. **Responsividade confirmada** nos 4 breakpoints: mobile (375px), tablet (768px), desktop (1280px), wide (1920px)
3. **Touch targets** — confirmar `min-h-[44px]` em todos elementos interativos
4. **CLS zero** — confirmar `aspect-ratio` ou dimensões definidas em charts e imagens
5. **Acessibilidade** — confirmar zoom 200%, `:focus-visible`, `prefers-reduced-motion`
6. **Alinhamento com `design-lead`** — manter Engineering Tool Aesthetic: `rounded-sm/md`, `font-mono` em dados, bordas sólidas sobre shadows

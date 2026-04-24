# Mapa de Interface — View `Proposta` (Kurupira)

> **Fonte**: Leitura direta dos arquivos em `canvas-views/proposal/`. Verificado via CoVe.  
> **Data**: 2026-04-24 — Atualizado após redesign de `ProposalPageTechnical`

---

## Arquitetura Geral

```
canvas-views/proposal/
├── ProposalDocumentPreview.tsx   ← Painel direito: renderização A4 + navegação
├── ProposalEditPanel.tsx         ← Painel esquerdo: edição contextual + export
├── ProposalBlockedScreen.tsx     ← Guard screen quando módulos não configurados
└── pages/
    ├── ProposalPageCover.tsx         ← Página 0 — Capa
    ├── ProposalPageInvestment.tsx    ← Página 1 — Investimento
    ├── ProposalPageTechnical.tsx     ← Página 2 — Dimensionamento ⚠️ redesenhado
    ├── ProposalPageSchedule.tsx      ← Página 3 — Cronograma
    └── ProposalPageContact.tsx       ← Página 4 — Encerramento
```

---

## Fluxo de Dados

```
solarStore (Zustand)
  ├── clientData          → Capa, Investimento, Técnico
  ├── proposalData        → Todas as páginas (lineItems, paymentStages, etc.)
  ├── proposalActivePage  → Controla qual página está visível no preview
  ├── isExportingPdf      → Liga o motor de impressão nativa (window.print)
  └── excludedPages[]     → Lista de índices de páginas excluídas do PDF

useTechStore (Zustand)
  ├── inverters           → Técnico (firstInverter)
  └── prCalculationMode   → Cálculo de geração estimada

calculateProjectionStats() → stats (ProjectionStats) → monthlyGenAvg, barData, coverage
```

---

## Layout de dois Painéis

```
┌─────────────────────────────────────────────────────────────────────┐
│  ProposalEditPanel (esquerda)      ProposalDocumentPreview (direita)│
│  ┌───────────────────────┐         ┌───────────────────────────┐   │
│  │ Header                │         │ [Banner: página oculta?]  │   │
│  │  · Label: PROPOSTA    │         │ ┌───────────────────────┐ │   │
│  │  · Filtros: Todas /   │         │ │  794×1123px (A4)      │ │   │
│  │    Comercial /        │         │ │  scale automático      │ │   │
│  │    Viabilidade        │         │ │  via ResizeObserver    │ │   │
│  ├───────────────────────┤         │ │                        │ │   │
│  │ Page Selector         │         │ │  [pages[activePage]]   │ │   │
│  │ (dropdown c/ toggle   │         │ │                        │ │   │
│  │  Eye/EyeOff por pág.) │         │ └───────────────────────┘ │   │
│  ├───────────────────────┤         │ Navegação:                │   │
│  │ Contextual Fields     │         │  ← Anterior | Pág X/5 | → │   │
│  │ (muda por activePage) │         └───────────────────────────┘   │
│  ├───────────────────────┤                                          │
│  │ Export Footer         │                                          │
│  │  · Badges: Preços /   │                                          │
│  │    Mapa / Comparativo │                                          │
│  │  · [Exportar PDF]     │                                          │
│  └───────────────────────┘                                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ProposalEditPanel — Campos Contextuais por Página

| Página | Seção | Campos Editáveis |
|--------|-------|-----------------|
| **0 — Capa** | Dados da Capa | Read-only. Link: "Editar dados do cliente →" |
| **1 — Investimento** | Itens de Investimento | description (text), value (number), valueText (text) + Adicionar/Remover |
| **1 — Investimento** | Etapas de Pagamento | label, value (R$), percentage (%) + Adicionar/Remover + validação 100% |
| **1 — Investimento** | Condições Comerciais | textarea (máx. 8 linhas) |
| **2 — Dimensionamento** | Padrão Neonorte | textarea (máx. 600 chars, contador). Se vazio → 5 bullets hardcoded |
| **3 — Cronograma** | Etapas de Execução | label (read-only), sublabel, durationText, description (por etapa) |
| **4 — Encerramento** | Responsável Técnico | engineerName, engineerTitle, engineerCrea |
| **4 — Encerramento** | Contato | contactPhone, contactInstagram |

### Badges de Visibilidade no PDF (Footer)
| Badge | Prop controlada | Default |
|-------|----------------|---------|
| Preços | `showPricing` | true |
| Mapa | `showMap` | true |
| Comparativo | `showComparativePlans` | true |

---

## ProposalDocumentPreview — Motor de PDF

```
isExportingPdf = true
  → createPortal → <div id="pdf-export-container">
      → Renderiza todas as páginas (exceto excludedPages)
      → Aguarda 1500ms (hydration)
      → window.print() (impressão nativa A4)
      → setExportingPdf(false)
```

---

## Páginas do Documento

### Página 0 — CAPA (`ProposalPageCover`)
```
┌──────────────────────────────────────────┐
│  FUNDO ROXO ESCURO (#2D0A4E)             │
│  ┌── Triângulos decorativos (canto inf.) │
│  │                                       │
│  ├── Mês/Ano + Linha decorativa c/ dots  │
│  │   "Abril / 2026 · FV2026---"          │
│  │                                       │
│  ├── Título central                       │
│  │   PROPOSTA                            │
│  │   COMERCIAL  (80px, black, -0.02em)   │
│  │                                       │
│  ├── Nome cliente (sobrenome, 20px)      │
│  │   Subtipo (RESIDENCIAL, 12px/0.18em)  │
│  │                                       │
│  └── Rodapé: Specs do sistema            │
│      ┌────────────────┬────────────────┐ │
│      │ [Projeto]      │ Potência       │ │
│      │ label lateral  │ XX.XX kWp      │ │
│      │ verde (#10B981)│ (32px/mono)    │ │
│      ├────────────────┼────────────────┤ │
│      │                │ Geração Est.   │ │
│      │                │ XXXX kWh/mês   │ │
│      └────────────────┴────────────────┘ │
└──────────────────────────────────────────┘
Fonte de dados: clientData, totalPowerKwp, monthlyGenAvg
⚠️ Triângulos decorativos ocultados durante isExportingPdf (html2canvas compat)
```

---

### Página 1 — INVESTIMENTO (`ProposalPageInvestment`)
```
┌──────────────────────────────────────────┐
│  HEADER: Gradiente verde→verde-menta     │
│  borderTop: 6px solid #2D6A4F           │
│  marginBottom: 60px                      │
│  ┌── Logo (circle) + data + condições   │
│  └── Título "INVESTIMENTO" (overlapping)│
│      Posição: absolute, bottom:-40px    │
│                                         │
│  CORPO: fundo branco + marca d'água 3%  │
│  padding: 16px 48px 32px 48px           │
│                                         │
│  [HiddenOverlay: showPricing]           │
│  ┌── Tabela Esq: Itens de Investimento ─┐│
│  │  Label: ●─ "EQUIPAMENTOS..." (9px)  ││
│  │  Header bicolor: [DESCRIÇÃO][VALOR]  ││
│  │  Rows: min-h-34px, py-1, zebra       ││
│  │    ● Título + sub-label (parênteses) ││
│  │    | valor tabular-nums R$           ││
│  │  Footer Roxo (#2D0A4E): TOTAL        ││
│  │    valor em 14px                     ││
│  └─────────────────────────────────────┘│
│  ┌── Tabela Dir: Cronograma Pagamento ──┐│
│  │  Label: ●─ "CRONOGRAMA..." (9px)    ││
│  │  Header verde: [ENGENHARIA][VALOR]   ││
│  │  Rows: min-h-34px, py-1             ││
│  │    label (%) | valor R$             ││
│  │  Footer Verde (#4CAF50): TOTAL      ││
│  │    R$ + 100%                        ││
│  └─────────────────────────────────────┘│
│                                         │
│  [HiddenOverlay: showComparativePlans]  │
│  ┌── Grid 2 cols, gap-12 ─────────────┐ │
│  │  BÁSICO Card           NEONORTE Card│ │
│  │  frame preto + 4x corner ticks CAD  │ │
│  │  ✓ KIT FV / ✓ ENGENHARIA            │ │
│  │  ✗ PÓS-VENDA / ✗ CONSULTORIA       │ │
│  │  vs ✓ PÓS-VENDA / ✓ CONSULTORIA    │ │
│  └─────────────────────────────────────┘ │
└──────────────────────────────────────────┘
Fonte de dados: proposalData.lineItems, paymentStages, plans
⚠️ GUARDRAIL: planos 'plan-basico'/'plan-neonorte' têm items HARDCODED no render
```

---

### Página 2 — DIMENSIONAMENTO (`ProposalPageTechnical`)
```
┌──────────────────────────────────────────────────────────┐
│  HEADER — fundo BRANCO, borderTop: 6px solid #1a3d2b    │
│  padding: 32px 48px 24px 48px                            │
│  ┌── Col. Esq (flex-1): título + subtexto contrato      │
│  │   "DIMENSIONAMENTO E"                                 │
│  │   "VIABILIDADE DO PROJETO"                            │
│  │   (36px, 900, #0F172A, -0.02em, uppercase)           │
│  │   subtexto: contrato Neonorte (10.5px, #64748B)      │
│  └── Col. Dir (shrink-0): data + logo circular verde    │
│      data: DD DE MÊS DE AAAA (12px, uppercase, #64748B) │
│      logo: círculo 56px, bg #4CAF50, img simbolo-branco │
│                                                          │
│  Divisória: 1px solid #E2E8F0                           │
├──────────────────────────────────────────────────────────┤
│  CORPO — flex row (55% esq | 45% dir)                   │
│                                                          │
│  ── COL. ESQUERDA (55%, padding 20/24/24/48) ──         │
│                                                          │
│  1. Badge de Identificação do Cliente                    │
│     "DIEGO SHERMAN" (16px, 900, #2D6A4F, uppercase)      │
│     Badge Engineering (maxWidth: 260px):                 │
│     ┌──────┬────────────┬────────────┐                  │
│     │PROJ  │ Potência   │  Geração   │                  │
│     │(vert)│ XX.XX kWp  │ XXXX kWh   │                  │
│     │verde │ (bg GREEN) │(bg GREEN_L)│                  │
│     └──────┴────────────┴────────────┘                  │
│     + 4x corner ticks (#4CAF50)                         │
│                                                          │
│  2. Padrão Neonorte                                      │
│     Título: barra verde + "PADRÃO NEONORTE" (12px/900)  │
│     Intro: "A elaboração do orçamento..." (10.5px)       │
│     5 bullets (dots verdes, sem card background):        │
│     • Inversores solares: 7 anos...                      │
│     • Módulos FV: 25 anos... (80% eficiência)            │
│     • String Box e Estrutura: 12 meses...                │
│     • Engenharia: 6 meses.                               │
│     • Assistência e Consultoria: 6 meses.                │
│     Se proposalData.customText → usa split('\n')         │
│                                                          │
│  3. Histórico de Consumo                                 │
│     Label: ● azul + "HISTÓRICO DE CONSUMO" (9px/900)    │
│     Container: 110px, bg white, border #E2E8F0          │
│     <ResponsiveContainer 100% × 110>                    │
│       <LineChart> cons → stroke BLUE (#3B82F6)          │
│       YAxis: tickFormatter (1200→1,2k), width 28        │
│                                                          │
│  4. Geração × Consumo (dual line)                        │
│     Label: ● laranja Geração + ● azul Consumo           │
│     <ResponsiveContainer 100% × 110>                    │
│       <LineChart> gen ORANGE + cons BLUE                │
│                                                          │
│  ── COL. DIREITA (45%, padding 20/48/24/24) ──          │
│                                                          │
│  1. Foto Satélite (height: 170px, border 3px #E2E8F0)   │
│     Google Maps Static API (zoom 19, satellite)         │
│     Badge: "FV{year} — {firstName}" (bg #2D0A4E/85)     │
│     Fallback: MapPin + "Vista Aérea Indisponível"        │
│                                                          │
│  2. KPI Grid (2 cols)                                    │
│     ┌──────────────┬──────────────────────┐            │
│     │ IRRADIAÇÃO   │ MÉDIA DE GERAÇÃO     │            │
│     │ DO LOCAL     │                      │            │
│     │ XX,XX        │ XXX%  (36px, verde)  │            │
│     │ Wh/m²/dia    │ Geração × Consumo    │            │
│     │ (bg #F8FAFC) │ (bg #F0FDF4)        │            │
│     │ border-l     │ border-l GREEN       │            │
│     │ GREEN_LIGHT  │                      │            │
│     └──────────────┴──────────────────────┘            │
│     avgHsp = totalGen / 365 / totalPowerKwp (pt-BR)    │
│     coveragePct = stats.coverage (toFixed 0)           │
│                                                          │
│  3. Painel Equipamentos                                  │
│     ┌─────────┬────────────────────────────────┐       │
│     │EQUIPAM  │ MÓDULOS: {totalModules}         │       │
│     │ENTOS    │ {manufacturer} · {power}Wp      │       │
│     │(vert,   │ Instalação: {installationType}  │       │
│     │ bg GREEN│ [ícone SVG painel solar]        │       │
│     │ branco) ├────────────────────────────────┤       │
│     │         │ INVERSOR(ES): {count}           │       │
│     │         │ {manufacturer}                  │       │
│     │         │ Potência: {nominalPower×1000} W │       │
│     │         │ [ícone SVG inversor]            │       │
│     └─────────┴────────────────────────────────┘       │
│     Thumbnails: /assets/thumbnail-modulo.png            │
│     Fallback: SVG inline verde (#2D6A4F)               │
│     nominalPower em kW no store → ×1000 para exibir W  │
│                                                          │
│  4. Geração × Consumo — 2ª instância (BarChart)         │
│     Label: ■ laranja Geração + ■ azul Consumo           │
│     <ResponsiveContainer 100% × 110>                    │
│       <BarChart> gen ORANGE + cons BLUE, barSize 6      │
│                                                          │
│  RODAPÉ: 6px solid #4CAF50                             │
└──────────────────────────────────────────────────────────┘
Fonte de dados: clientData, modules, firstModule, firstInverter,
                inverterIds, stats (ProjectionStats), proposalData.customText
Design tokens: GREEN=#2D6A4F, GREEN_LIGHT=#4CAF50, GREEN_DARK=#1a3d2b,
               PURPLE=#2D0A4E, ORANGE=#F97316, BLUE=#3B82F6
```

---

### Página 3 — CRONOGRAMA (`ProposalPageSchedule`)
```
┌──────────────────────────────────────────┐
│  BACKGROUND: gradiente verde/foto painéis│
│  + textura diagonal (repeating-linear)   │
│                                          │
│  ┌── Header: Logo circular verde + data ─┤
│  │                                       │
│  ├── Título + Diferenciais               │
│  │  ┌─────────────┐ ┌──────────────────┐ │
│  │  │ Box branco  │ │ Texto s/ foto    │ │
│  │  │ CRONO       │ │ "ZERO VISAGEM"   │ │
│  │  │ GRAMA       │ │ "PRIMEIRA        │ │
│  │  │ (52px/ROXO) │ │  VISTORIA"       │ │
│  │  └─────────────┘ └──────────────────┘ │
│  │                                       │
│  └── Conteúdo: Esquerda + Direita        │
│  ┌── Cards Etapas (240px) ──────────────┐ │
│  │  [Borda verde, radius 6px, glass]    │ │
│  │  ┌────────────┬──────────────────┐   │ │
│  │  │ LABEL (v.) │ durationText     │   │ │
│  │  │ sublabel   │ (white, 9px)     │   │ │
│  │  └────────────┴──────────────────┘   │ │
│  │  (repete por executionSchedule[])    │ │
│  └──────────────────────────────────────┘ │
│  ┌── Timeline (flex-1) ─────────────────┐ │
│  │  Linha pontilhada verde (left: 12px) │ │
│  │  Por etapa:                          │ │
│  │  ○ Bolinha roxa (#6A1B9A)            │ │
│  │  └ [Badge dur.] LABEL — sublabel     │ │
│  │      description (9px, 70% white)    │ │
│  │                                      │ │
│  │  Footer: "TOTAL: 37 - 40 DIAS"       │ │
│  │  (hardcoded — ⚠️ pendência P1)       │ │
│  └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
Fonte de dados: proposalData.executionSchedule
```

---

### Página 4 — ENCERRAMENTO (`ProposalPageContact`)
```
┌──────────────────────────────────────────┐
│  BACKGROUND: gradiente cinza azulado     │
│  + textura horizontal sutil              │
│                                          │
│  Grid: Esquerda (flex-1) + Direita (340)│
│                                          │
│  ┌── Esq: Placeholders de Fotos ────────┐│
│  │  "Foto Instalação" (gradient CSS)    ││
│  │  "Foto Equipamento" (gradient CSS)   ││
│  └───────────────────────────────────────┘│
│                                           │
│  ┌── Dir: CTA + Contato ─────────────────┐│
│  │  Logo /logos/logo-verde.png           ││
│  │  "ENGENHARIA" (subtítulo)             ││
│  │  Box verde escuro (#2D6A4F):          ││
│  │    FALE / COM A / GENTE (52px/900)   ││
│  │  Box verde (#4CAF50): agradecimento  ││
│  │  Contato (mt-auto):                  ││
│  │    engineerName + Title + CREA        ││
│  │    📱 contactPhone                    ││
│  │    📷 contactInstagram               ││
│  └───────────────────────────────────────┘│
└──────────────────────────────────────────┘
Fonte de dados: proposalData.{engineerName, engineerTitle, engineerCrea,
                               contactPhone, contactInstagram}
```

---

## Pendências Identificadas (CoVe — atualizado 2026-04-24)

| # | Componente | Gap | Prioridade | Status |
|---|-----------|-----|------------|--------|
| 1 | `ProposalPageSchedule` | `TOTAL: 37 - 40 DIAS` hardcoded — não lê do estado | P1 | 🔴 Aberto |
| 2 | `ProposalPageContact` | Fotos de instalação são placeholders CSS, não imagens reais | P2 | 🔴 Aberto |
| 3 | `ProposalPageInvestment` | Items de planos 'plan-basico'/'plan-neonorte' HARDCODED no render | P2 | 🔴 Aberto |
| 4 | `ProposalPageSchedule` | Header não segue padrão Broken Grid das demais páginas | P1 | 🔴 Aberto |
| 5 | `ProposalPageTechnical` | Estrutura interna não mapeada | P2 | ✅ Resolvido (mapa acima) |
| 6 | `ProposalPageTechnical` | Thumbnails de equipamento dependem de `/assets/thumbnail-modulo.png` | P3 | ⚠️ Fallback SVG ativo |

---

## Referências de Arquivos

| Arquivo | Linhas | KB |
|---------|--------|----|
| [ProposalDocumentPreview.tsx](../kurupira/frontend/src/modules/engineering/ui/panels/canvas-views/proposal/ProposalDocumentPreview.tsx) | 226 | 8,8 |
| [ProposalEditPanel.tsx](../kurupira/frontend/src/modules/engineering/ui/panels/canvas-views/proposal/ProposalEditPanel.tsx) | 551 | 26,6 |
| [ProposalBlockedScreen.tsx](../kurupira/frontend/src/modules/engineering/ui/panels/canvas-views/proposal/ProposalBlockedScreen.tsx) | 105 | 4,7 |
| [ProposalPageCover.tsx](../kurupira/frontend/src/modules/engineering/ui/panels/canvas-views/proposal/pages/ProposalPageCover.tsx) | 221 | 8,7 |
| [ProposalPageInvestment.tsx](../kurupira/frontend/src/modules/engineering/ui/panels/canvas-views/proposal/pages/ProposalPageInvestment.tsx) | 441 | 21,0 |
| [ProposalPageTechnical.tsx](../kurupira/frontend/src/modules/engineering/ui/panels/canvas-views/proposal/pages/ProposalPageTechnical.tsx) | 503 | 26,6 |
| [ProposalPageSchedule.tsx](../kurupira/frontend/src/modules/engineering/ui/panels/canvas-views/proposal/pages/ProposalPageSchedule.tsx) | 253 | 9,9 |
| [ProposalPageContact.tsx](../kurupira/frontend/src/modules/engineering/ui/panels/canvas-views/proposal/pages/ProposalPageContact.tsx) | 206 | 7,5 |

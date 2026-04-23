# Mapa de Interface — View `Proposta` (Kurupira)

> **Fonte**: Leitura direta dos arquivos em `canvas-views/proposal/`. Verificado via CoVe.  
> **Data**: 2026-04-23

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
    ├── ProposalPageTechnical.tsx     ← Página 2 — Dimensionamento
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
  ├── inverters           → Capa (firstInverter)
  └── prCalculationMode   → Cálculo de geração estimada

calculateProjectionStats() → stats.totalGen → monthlyGenAvg (Capa + Técnico)
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
| **2 — Dimensionamento** | Padrão Neonorte | textarea (máx. 600 chars, contador) |
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
│      │ verde          │ (32px/mono)    │ │
│      ├────────────────┼────────────────┤ │
│      │                │ Geração Est.   │ │
│      │                │ XXXX kWh/mês   │ │
│      └────────────────┴────────────────┘ │
└──────────────────────────────────────────┘
Fonte de dados: clientData, totalPowerKwp, monthlyGenAvg
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
│  │  ┌──────────────┐  ┌──────────────┐│ │
│  │  │ Frame preto  │  │ Frame preto  ││ │
│  │  │ 4x corner    │  │ + borda verde││ │
│  │  │ ticks (CAD)  │  │ ticks (CAD)  ││ │
│  │  │ BÁSICO 24px  │  │ NEONORTE 28px││ │
│  │  ├──────────────┤  ├──────────────┤│ │
│  │  │ ✓ KIT FV     │  │ ✓ KIT FV    ││ │
│  │  │ ✓ ENGENHARIA │  │ ✓ ENGENHARIA ││ │
│  │  │ ✗ PÓS-VENDA  │  │ ✓ PÓS-VENDA ││ │
│  │  │   (6 MESES)  │  │   (6 MESES)  ││ │
│  │  │ ✗ CONSULTORIA│  │ ✓ CONSULTORIA││ │
│  │  │   (6 MESES)  │  │   (6 MESES)  ││ │
│  │  ├──────────────┤  ├──────────────┤│ │
│  │  │ R$ XXXXX     │  │ R$ XXXXX     ││ │
│  │  │ tag verde    │  │ tag verde    ││ │
│  │  │              │  │ (15% maior)  ││ │
│  │  └──────────────┘  └──────────────┘│ │
│  └─────────────────────────────────────┘ │
└──────────────────────────────────────────┘
Fonte de dados: proposalData.lineItems, paymentStages, plans
⚠️ GUARDRAIL: planos 'plan-basico'/'plan-neonorte' têm items HARDCODED no render
```

---

### Página 2 — DIMENSIONAMENTO (`ProposalPageTechnical`)
```
Fonte de dados: modules, firstModule, firstInverter, stats, proposalData.customText
(Ver ProposalPageTechnical.tsx para estrutura interna completa)
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
│  │  (hardcoded — ⚠️ pendência)          │ │
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
│  │  ┌────────────────────────────────┐  ││
│  │  │ "Foto Instalação" (gradient)   │  ││
│  │  └────────────────────────────────┘  ││
│  │  ┌────────────────────────────────┐  ││
│  │  │ "Foto Equipamento" (gradient)  │  ││
│  │  └────────────────────────────────┘  ││
│  └───────────────────────────────────────┘│
│                                           │
│  ┌── Dir: CTA + Contato ─────────────────┐│
│  │  Logo /logos/logo-verde.png           ││
│  │  "ENGENHARIA" (subtítulo)             ││
│  │  ┌─────────────────────────────────┐  ││
│  │  │ Box verde escuro (#2D6A4F)      │  ││
│  │  │ FALE / COM A / GENTE            │  ││
│  │  │ (52px, 900, white)              │  ││
│  │  └─────────────────────────────────┘  ││
│  │  ┌─────────────────────────────────┐  ││
│  │  │ Box verde (#4CAF50)             │  ││
│  │  │ texto de agradecimento          │  ││
│  │  └─────────────────────────────────┘  ││
│  │  Contato (mt-auto):                   ││
│  │  │ engineerName + Title + CREA        ││
│  │  📱 contactPhone                      ││
│  │  📷 contactInstagram                  ││
│  └───────────────────────────────────────┘│
└──────────────────────────────────────────┘
Fonte de dados: proposalData.{engineerName, engineerTitle, engineerCrea,
                               contactPhone, contactInstagram}
```

---

## Pendências Identificadas (CoVe)

| # | Componente | Gap | Prioridade |
|---|-----------|-----|-----------|
| 1 | `ProposalPageSchedule` | `TOTAL: 37 - 40 DIAS` hardcoded — não lê do estado | P1 |
| 2 | `ProposalPageContact` | Fotos de instalação são placeholders CSS, não imagens reais | P2 |
| 3 | `ProposalPageInvestment` | Items de planos 'plan-basico'/'plan-neonorte' ignoram o estado (guardrail de cache) | P2 |
| 4 | `ProposalPageSchedule` | Não segue o mesmo padrão de header (Broken Grid) que Investimento | P1 |
| 5 | `ProposalPageTechnical` | Estrutura interna não mapeada nesta sessão | P2 |

---

## Referências de Arquivos

| Arquivo | Linhas | Bytes |
|---------|--------|-------|
| [ProposalDocumentPreview.tsx](../kurupira/frontend/src/modules/engineering/ui/panels/canvas-views/proposal/ProposalDocumentPreview.tsx) | 227 | 8.9KB |
| [ProposalEditPanel.tsx](../kurupira/frontend/src/modules/engineering/ui/panels/canvas-views/proposal/ProposalEditPanel.tsx) | 552 | 27.2KB |
| [ProposalPageCover.tsx](../kurupira/frontend/src/modules/engineering/ui/panels/canvas-views/proposal/pages/ProposalPageCover.tsx) | 222 | 8.9KB |
| [ProposalPageInvestment.tsx](../kurupira/frontend/src/modules/engineering/ui/panels/canvas-views/proposal/pages/ProposalPageInvestment.tsx) | ~420 | 21.5KB |
| [ProposalPageTechnical.tsx](../kurupira/frontend/src/modules/engineering/ui/panels/canvas-views/proposal/pages/ProposalPageTechnical.tsx) | ~380 | 15.1KB |
| [ProposalPageSchedule.tsx](../kurupira/frontend/src/modules/engineering/ui/panels/canvas-views/proposal/pages/ProposalPageSchedule.tsx) | 236 | 9.0KB |
| [ProposalPageContact.tsx](../kurupira/frontend/src/modules/engineering/ui/panels/canvas-views/proposal/pages/ProposalPageContact.tsx) | 207 | 7.7KB |

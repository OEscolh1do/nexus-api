# Spec — ProposalCanvasView v2.0

**Arquivo alvo:** `canvas-views/ProposalCanvasView.tsx`
**Tipo:** Feature Nova
**Módulo:** `engineering` — CenterCanvas
**Prioridade:** P1
**Responsável:** `the-builder`
**Revisor:** `engenheiro-eletricista-pv` + `design-lead`
**Data:** 2026-04-22
**Ativada por:** aba "Proposta" no WorkspaceTabs
**Condição de acesso:** `variantStatus === 'APPROVED'`
**Cor de acento:** Indigo — `text-indigo-400` / `border-indigo-500/30`
**Supersede:** `spec-view-proposal-2026-04-20.md`

---

## 1. Propósito e Escopo

A ProposalCanvasView é o documento de venda do integrador. Não é uma tela de edição de dimensionamento — é a síntese comercial de tudo definido nas views anteriores, formatada para apresentação ao cliente final e exportação como PDF multipágina.

O template de referência (`Proposta_Comercial_Neonorte_TEMPLATE.pdf`) define um documento de **5 páginas** com identidade visual Neonorte. Cada página tem propósito distinto e alguns campos exclusivamente editáveis nesta view.

Esta view cumpre dois papéis simultâneos:

- **Preview interativo** — o integrador navega pelas 5 páginas do documento dentro do Kurupira antes de exportar, podendo editar campos comerciais inline sem sair da tela.
- **Documento exportável** — um PDF multipágina fiel ao template é gerado sob demanda pelo botão "Exportar PDF".

---

## 2. Estrutura do Documento — 5 Páginas

O documento exportado tem exatamente 5 páginas, cada uma com layout e propósito distintos:

| Página | Nome | Conteúdo principal |
|---|---|---|
| 1 | Capa | Identidade, nome do cliente, mês/ano, código do projeto, potência e geração |
| 2 | Investimento | Tabela de itens com valores, cronograma de pagamento por etapas, comparativo de planos |
| 3 | Dimensionamento Técnico | Gráficos, equipamentos, mapa, irradiação (idêntico ao Template_Kurupyra_A4) |
| 4 | Cronograma | Linha do tempo de execução com 4 etapas + pós-venda |
| 5 | Encerramento | Contato, engenheiro responsável, redes sociais |

---

## 3. Origem dos Dados

### 3.1 Dados automáticos (sem entrada do integrador)

| Campo | Fonte |
|---|---|
| Nome do cliente | `clientData.clientName` |
| Tipo de instalação | `clientData.installationType` |
| Mês/Ano do documento | gerado: `new Date()` no servidor |
| Código do projeto | `TechnicalDesign.id` prefixado: `FV` + ano + número sequencial (ex.: `FV2026004`) |
| Potência total (kWp) | calculado: `sum(quantity × pmax) / 1000` |
| Geração estimada (kWh/mês) | `simulationResult.annualGenerationKwh / 12` |
| Quantidade de módulos | soma de `quantity` em `designData.modules` |
| Fabricante do módulo | `modules[0].manufacturer` |
| Potência do módulo (Wp) | `modules[0].electrical.pmax` |
| Quantidade de inversores | `inverters.ids.length` |
| Potência do inversor (W) | `inverters[0].power_w` |
| Fabricante do inversor | `inverters[0].manufacturer` |
| Tipo de telhado | `clientData.roofType` |
| Irradiação local (HSP médio) | média de `clientData.monthlyIrradiation[12]` |
| Cobertura (%) | `(annualGeneration / annualConsumption) × 100` |
| Consumo mensal (12 meses) | `clientData.monthlyConsumption[12]` |
| Geração mensal simulada (12 meses) | `designData.simulationResult.monthlyGeneration[12]` |
| Lat/Lng (mapa) | `clientData.lat`, `clientData.lng` |

### 3.2 Campos editáveis pelo integrador (`designData.proposalData`)

A interface `DesignData` recebe a seção `proposalData`. Todos esses campos são editáveis no painel esquerdo desta view e persistidos via autosave.

```typescript
interface ProposalData {
  // Comercial geral
  customText: string;           // texto livre da seção "Padrão Neonorte" (pág. 3)
  validityDays: number;         // prazo de validade em dias (padrão: 15)
  paymentTerms: string[];       // lista de condições comerciais (ex.: ["Aceitamos todas as formas..."])

  // Itens de investimento (pág. 2 — tabela)
  lineItems: ProposalLineItem[];

  // Cronograma de pagamento por etapas (pág. 2)
  paymentStages: PaymentStage[];

  // Comparativo de planos (pág. 2)
  plans: ProposalPlan[];

  // Cronograma de execução (pág. 4)
  executionSchedule: ExecutionStage[];

  // Contato e responsável técnico (pág. 5)
  engineerName: string;
  engineerTitle: string;        // ex.: "Engenheiro Eletricista"
  engineerCrea: string;         // ex.: "CREA-PA: 151311686-0"
  contactPhone: string;
  contactInstagram: string;

  // Controles de visibilidade no PDF
  showPricing: boolean;         // exibe preços na pág. 2 (padrão: true)
  showMap: boolean;             // exibe mapa na pág. 3 (padrão: true)
  showComparativePlans: boolean; // exibe comparativo de planos na pág. 2 (padrão: true)

  // White-label
  logoOverride: string | null;
}

interface ProposalLineItem {
  id: string;
  description: string;   // ex.: "KIT GERADOR FOTOVOLTAICO"
  value: number | null;  // null = exibe texto alternativo (ex.: "6 MESES")
  valueText: string;     // texto alternativo quando value === null
}

interface PaymentStage {
  id: string;
  label: string;          // ex.: "ETAPA 1"
  value: number;          // valor em R$
  percentage: number;     // ex.: 30
}

interface ProposalPlan {
  id: string;
  name: string;           // ex.: "BÁSICO" ou "NEONORTE"
  highlighted: boolean;   // true = destaque visual (plano recomendado)
  items: PlanItem[];
  totalPrice: number;
}

interface PlanItem {
  description: string;
  included: boolean;      // true = check verde, false = X vermelho
}

interface ExecutionStage {
  id: string;
  label: string;          // ex.: "MARCO ZERO", "ETAPA 1"
  sublabel: string;       // ex.: "LEVANTAMENTO TÉCNICO", "CONTRATO"
  durationText: string;   // ex.: "15 DIAS", "3 - 5 DIAS"
  description: string;    // texto descritivo da etapa
}
```

> **Sem migration de schema:** todas as mudanças ficam dentro do campo JSON `designData` existente. Projetos antigos sem `proposalData` recebem os valores padrão definidos em §8.1.

---

## 4. Layout da View — Dois Painéis

```
┌────────────────────────────────────────────────────────────────────────┐
│  PAINEL ESQUERDO (30%)            │  PAINEL DIREITO (70%)             │
│  Controles editoriais             │  Preview do documento             │
│                                   │  (paginado, A4)                   │
│  ┌───────────────────────────┐    │  ┌──────────────────────────────┐ │
│  │ 📄 Proposta               │    │  │  [Página 1 — Capa]           │ │
│  │ Padrão · ● APROVADO       │    │  │                              │ │
│  ├───────────────────────────┤    │  │                              │ │
│  │ ○ Capa                    │    │  └──────────────────────────────┘ │
│  │ ○ Investimento            │    │                                   │
│  │ ○ Dimensionamento         │    │  [← Anterior]    [Próxima →]     │
│  │ ○ Cronograma              │    │   Página 1 de 5                  │
│  │ ○ Encerramento            │    │                                   │
│  ├───────────────────────────┤    │                                   │
│  │ [campos da página ativa]  │    │                                   │
│  │                           │    │                                   │
│  ├───────────────────────────┤    │                                   │
│  │ ☑ Mostrar preços          │    │                                   │
│  │ ☑ Mostrar mapa            │    │                                   │
│  │ ☑ Mostrar comparativo     │    │                                   │
│  ├───────────────────────────┤    │                                   │
│  │ [↓ Exportar PDF]          │    │                                   │
│  └───────────────────────────┘    │                                   │
└────────────────────────────────────────────────────────────────────────┘
```

O painel esquerdo tem navegação por seção — ao selecionar uma página no índice, o painel inferior mostra os campos editáveis daquela página e o preview no painel direito salta para a página correspondente.

---

## 5. Painel Esquerdo — Controles Editoriais

### 5.1 Cabeçalho

Exibe o nome da variante ativa e badge de status. Não editável aqui.

```
📄 Proposta
Padrão · ● APROVADO
```

Badge: `bg-emerald-900 text-emerald-400 border border-emerald-800`.

### 5.2 Índice de Páginas

Lista vertical de 5 itens, cada um clicável. O item ativo tem fundo `bg-slate-800` e borda esquerda indigo. Os demais ficam em `text-slate-500`.

```
● Capa
  Investimento
  Dimensionamento
  Cronograma
  Encerramento
```

Clicar em qualquer item: (1) expande os campos dessa seção abaixo do índice, (2) o preview salta para a página correspondente.

### 5.3 Campos por Seção

**Capa (página 1):** Nenhum campo editável aqui — todos os dados são automáticos (nome do cliente, código do projeto, potência, geração, mês/ano). O integrador vê os valores como somente-leitura com link "Editar dados do cliente →" que abre o `ClientDataModal`.

**Investimento (página 2):**

*Itens de investimento:* lista editável de `lineItems`. Cada item tem campo de texto para descrição e campo numérico para valor (ou campo de texto livre quando o valor é descritivo como "6 MESES"). O integrador pode adicionar, remover e reordenar itens. Um item "TOTAL" calculado automaticamente aparece sempre ao final (não editável — soma dos valores numéricos dos outros itens).

*Etapas de pagamento:* lista de `paymentStages`. O integrador define label, valor e percentual de cada etapa. A soma dos percentuais deve totalizar 100% — indicador visual de validação presente (verde quando fecha, vermelho quando não fecha).

*Condições comerciais:* `textarea` com as condições em formato de lista numerada (campo `paymentTerms`). O integrador escreve as condições que aparecem na coluna esquerda da página 2. Máximo de 8 itens.

*Comparativo de planos:* editor de dois planos lado a lado. Para cada plano: nome, flag de destaque (highlighted), preço total e lista de itens com toggle de inclusão (check/X). O integrador pode renomear os planos e marcar quais itens estão incluídos em cada um.

**Dimensionamento (página 3):**

*Texto personalizado:* `textarea` de 4 linhas, campo `customText`. Label "Padrão Neonorte / Texto de apresentação". Limite 600 caracteres. Aparece como texto rico na seção "Padrão Neonorte" da página. Contador de caracteres abaixo.

*Garantias:* os itens de garantia da página 3 são gerados automaticamente a partir de `proposalData.customText` — o integrador inclui os textos de garantia diretamente no campo de texto livre. Não há campos separados para isso (o template usa texto corrido nesta seção).

**Cronograma (página 4):**

Editor de `executionStages`. Para cada etapa: label, sublabel, texto de duração e texto descritivo. O integrador pode editar os textos mas não adicionar/remover etapas — o cronograma tem estrutura fixa (Marco Zero + 4 Etapas + Pós-venda). Campos editáveis são os textos descritivos de cada etapa.

**Encerramento (página 5):**

Campos: nome do engenheiro, título profissional, número de CREA, telefone de contato e handle do Instagram. Estes campos são de configuração da empresa — são preenchidos uma vez e reutilizados em todas as propostas. Nota visual: "Estes dados são salvos no perfil da empresa e aparecem em todas as propostas."

> **Implicação de backend:** o encerramento tem natureza de configuração de tenant, não de proposta. Ver §8.3.

### 5.4 Seção de Visibilidade

Três toggles de largura total na base do painel, acima do botão de exportação:

- **Mostrar preços no PDF** — controla exibição de valores na tabela de investimento e planos (padrão: `true`)
- **Mostrar mapa no PDF** — controla mapa de localização na página 3 (padrão: `true`)
- **Mostrar comparativo de planos** — controla bloco de comparativo na base da página 2 (padrão: `true`)

No preview da tela, todos os elementos aparecem independente dos toggles, mas com indicador visual de "oculto no PDF" (overlay leve com ícone de olho cortado) quando o toggle está desativado.

### 5.5 Botão de Exportação

Botão primário de largura total: **"Exportar PDF"**. Cor indigo sólida. Ícone `Download` à esquerda.

Ao clicar: dispara `POST /api/v1/designs/:id/variants/:variantId/export-pdf`. Backend gera o PDF com 5 páginas e retorna `{ pdfUrl: string }`. Frontend abre em nova aba. `DesignVariant.pdfUrl` atualizado no banco.

Estado de carregamento: spinner + `disabled`. Timeout: 30s. Em caso de falha: toast de erro.

---

## 6. Painel Direito — Preview Paginado

O preview apresenta o documento como páginas A4 individuais. O integrador navega entre páginas por botões "← Anterior" e "Próxima →" ou clicando no índice do painel esquerdo. Indicador de página "X de 5" visível abaixo do documento.

Cada página é um componente React independente com scroll interno se necessário. O documento interno tem proporção A4 com sombra leve sobre fundo `bg-slate-950`.

Qualquer edição no painel esquerdo reflete no preview sem delay (reatividade via Zustand local).

### 6.1 Página 1 — Capa

**Fundo:** roxo escuro sólido (`#2D0A4E` ou similar), conforme template.

**Cabeçalho topo-esquerdo:**
- Mês/Ano em tipografia bold: "Abril / 2026"
- Código do projeto abaixo: "FV2026004"
- Linha horizontal decorativa conectando ao canto direito

**Corpo central:**
- Título em caixa alta extra-bold, tipografia display: "PROPOSTA" (linha 1) e "COMERCIAL" (linha 2)
- Abaixo do título: nome do cliente em caps (`clientData.clientName`), seguido do tipo de instalação (`clientData.installationType`)

**Rodapé inferior:**
- Label "DIMENSIONAMENTO FOTOVOLTAICO ON-GRID" em caixa alta pequeno
- Bloco de resumo do projeto (idêntico ao template): rótulo vertical "PROJETO:" em badge verde + dois cards lado a lado:
  - Card esquerdo: "Potência:" + valor kWp bold
  - Card direito: "Geração:" + valor kWh bold

**Elemento decorativo:** formas geométricas abstractas no canto inferior direito (triângulos em roxo ligeiramente mais claro que o fundo), conforme template.

### 6.2 Página 2 — Investimento

**Fundo:** branco com elemento decorativo verde no rodapé (formas geométricas), conforme template.

**Cabeçalho:**
- Logo Neonorte topo-esquerdo (SVG inline)
- Data do documento abaixo da logo

**Coluna esquerda:**

*Condições Comerciais:* título bold "Condições Comerciais:", seguido da lista numerada do campo `paymentTerms`. Fonte tamanho regular.

**Bloco central/direito — Título de seção:**
Título em caixa alta extra-bold vertical dividido: "INVESTI" + "MENTO" (conforme template — quebra de linha intencional, tipografia display grande).

**Tabela de investimento:**
Título da seção: "EQUIPAMENTOS, INSTALAÇÃO E DEMAIS SERVIÇOS (TOTAL)".

Tabela com duas colunas: DESCRIÇÃO e VALOR. Fundo escuro no cabeçalho. Para cada `lineItem`: linha com bullet cirucular, descrição e valor (formatado em BRL se numérico, texto livre caso contrário). Linha de TOTAL com fundo escuro bold ao final.

**Tabela de etapas de pagamento:**
Título: "ENGENHARIA (SERVIÇOS: 4X NO PIX)" ou equivalente configurável.
Colunas: label da etapa, valor em R$, percentual. Linha de TOTAL ao final. Fundo escuro no header e no total.

**Comparativo de planos** (visível apenas quando `showComparativePlans === true`):
Dois cards lado a lado. Card com `highlighted === true` tem borda e fundo com destaque. Para cada plano: nome em caixa alta bold, lista de itens com ícone check (verde) ou X (vermelho/escuro) e preço total bold ao final.

### 6.3 Página 3 — Dimensionamento Técnico

Esta página é idêntica à especificada em `spec-view-proposal-2026-04-20.md` §5.1 (Cabeçalho, bloco resumo, colunas com gráficos, detalhes de equipamentos, mapa). Não há duplicação de especificação — o `ProposalDocumentPreview` para esta página reutiliza os mesmos subcomponentes.

**Diferença em relação ao template anterior:** a foto aérea (satélite) do local aparece no canto superior direito da página, acima dos destaques numéricos de irradiação. Esta imagem é obtida via tiles de satélite do Leaflet centrados em `clientData.lat / clientData.lng`, capturados como imagem estática no momento da exportação.

### 6.4 Página 4 — Cronograma

**Fundo:** imagem de foto de instalação solar em telhado com overlay escuro semi-transparente (conforme template). A foto é um asset fixo do template — não é foto do projeto do cliente.

**Elemento decorativo:** logo Neonorte no canto superior direito, data no canto.

**Título:** "CRONO" + "GRAMA" em caixa alta display, sobre caixa branca de fundo.

**Texto de diferenciais** (coluna esquerda, sobre fundo da imagem):
Dois blocos de texto destacados:
- "Sistema executado conforme projeto, validado em todas as Normas Técnicas, pronto para operação - ZERO VISAGEM"
- "Obra Aprovada pela EQUATORIAL, na PRIMEIRA VISTORIA"

**Lista de etapas** (coluna esquerda):
Cards verticais em fundo escuro com borda verde: Marco Zero (Levantamento Técnico), Etapa 1 (Contrato), Etapa 2 (Frete e Equipamentos), Etapa 3 (Instalação e Testes), Etapa 4 — (Equatorial) Comissionamento. Os sublabels vêm de `executionSchedule[i].sublabel`.

**Linha do tempo** (coluna direita):
Timeline vertical com marcadores circulares (alternando verde e roxo conforme template), conectados por linha pontilhada. Para cada etapa: badge de duração (`durationText`) + nome da etapa + texto descritivo. Total de prazo no final: "TOTAL: 37 - 40 DIAS" (ou valor editável).

**Rodapé da timeline:** bloco "PÓS VENDA INTELIGENTE" com descrição do monitoramento pós-instalação.

### 6.5 Página 5 — Encerramento

**Fundo:** imagem fotográfica de parede cinza (asset fixo do template), conforme template. Logo Neonorte Engenharia grande centralizada.

**Título de chamada:** "FALE" + "COM A" + "GENTE" em caixa alta display sobre caixa verde escuro.

**Fotos de equipamentos:** duas fotografias de instalações reais (assets fixos do template — não são fotos do projeto do cliente). Posicionadas à esquerda da coluna de contato.

**Bloco de contato** (coluna direita):
Texto de agradecimento institucional (fixo do template). Nome do engenheiro responsável em bold: `engineerName`. Título: `engineerTitle`. CREA: `engineerCrea`. Ícones de Instagram e WhatsApp com `contactInstagram` e `contactPhone`.

---

## 7. Comportamento de Edição e Persistência

O autosave segue o padrão do workspace:

- `onChange` → atualiza estado local Zustand; preview reflete em tempo real
- `onBlur` → dispara `PATCH /api/v1/designs/:id/variants/:variantId` com delta de `designData.proposalData`
- Indicador discreto "salvando..." durante a operação (spinner, sem modal)
- Erro de rede → toast + dado mantido no estado local para nova tentativa

Não existe botão "Salvar" explícito.

---

## 8. Pré-requisitos de Backend

### 8.1 Campo `proposalData` no JSON `designData`

Sem migration de schema — mudança dentro do campo JSON existente. Valores padrão aplicados pelo frontend quando `proposalData === null`:

| Campo | Valor padrão |
|---|---|
| `customText` | `""` |
| `validityDays` | `15` |
| `paymentTerms` | `["Aceitamos todas formas de Pagamento.", "Condições Flexíveis para pagamento", "A proposta tem validade de 15 dias"]` |
| `lineItems` | `[]` (integrador preenche manualmente) |
| `paymentStages` | `[]` |
| `plans` | dois planos padrão: Básico e Neonorte, conforme template |
| `executionSchedule` | 6 entradas padrão conforme template (Marco Zero + 4 Etapas + Pós-venda) |
| `engineerName` | `""` |
| `engineerTitle` | `"Engenheiro Eletricista"` |
| `engineerCrea` | `""` |
| `contactPhone` | `""` |
| `contactInstagram` | `""` |
| `showPricing` | `true` |
| `showMap` | `true` |
| `showComparativePlans` | `true` |
| `logoOverride` | `null` |

### 8.2 Código sequencial do projeto

O campo `projectCode` exibido na capa (ex.: `FV2026004`) é gerado pelo backend e persistido em `TechnicalDesign`. Regra de geração: prefixo `FV` + ano de 4 dígitos + número sequencial de 3 dígitos com zero-padding, incrementado por tenant.

Se `TechnicalDesign.projectCode` já existir (campo novo no schema), usar o valor armazenado. Se não existir, gerar na primeira exportação e persistir.

**Migration de schema necessária:** `ALTER TABLE TechnicalDesign ADD COLUMN projectCode VARCHAR(20) NULL`.

### 8.3 Dados de configuração de empresa (página 5)

Os campos `engineerName`, `engineerTitle`, `engineerCrea`, `contactPhone` e `contactInstagram` têm natureza de configuração de tenant — são dados da empresa integradora, não da proposta específica.

Estratégia de implementação em dois passos:

**Passo 1 (MVP):** esses campos ficam em `designData.proposalData` como qualquer outro campo editável. O integrador preenche uma vez e, nas propostas seguintes, eles aparecem vazios (até que haja cópia de template). Funcional, sem esforço adicional de backend.

**Passo 2 (futuro):** migrar para `Tenant.companySettings` com sincronização automática para novas propostas. Spec separada.

### 8.4 Endpoint de exportação PDF multipágina

```
POST /api/v1/designs/:id/variants/:variantId/export-pdf
```

O endpoint agora deve gerar um PDF de 5 páginas. O payload inclui todos os campos de `proposalData` mais os dados técnicos calculados no servidor (não confia em valores pré-calculados do cliente).

O serviço de geração PDF deve suportar:
- Página com fundo colorido sólido (capa — página 1)
- Página com imagem fotográfica de fundo + overlay (páginas 4 e 5)
- Tabelas com formatação específica (página 2)
- Gráficos recharts renderizados como imagens SVG → PNG (página 3)
- Mapa estático via captura de tiles Leaflet centrado em lat/lng (página 3)
- Controle de visibilidade de seções via flags (`showPricing`, `showMap`, `showComparativePlans`)

O campo `DesignVariant.pdfUrl` é atualizado após geração bem-sucedida. Retorna `{ pdfUrl: string }` com status `200`.

### 8.5 Campos em `clientData` (pré-existentes ou a adicionar)

`installationType` e `roofType` são necessários e devem existir em `TechnicalDesign.clientData`. Se ausentes, o backend retorna string vazia e o frontend omite a linha no documento sem erro.

---

## 9. Tela de Bloqueio

Quando `variantStatus !== 'APPROVED'`, a view exibe tela de bloqueio fullscreen no lugar do painel duplo. Composição idêntica à descrita em `spec-view-proposal-2026-04-20.md` §7.

---

## 10. Arquivos

| Arquivo | Status |
|---|---|
| `canvas-views/ProposalCanvasView.tsx` | **[NOVO]** — view completa com painel duplo |
| `canvas-views/proposal/ProposalEditPanel.tsx` | **[NOVO]** — painel esquerdo: índice + campos editáveis por seção |
| `canvas-views/proposal/ProposalDocumentPreview.tsx` | **[NOVO]** — painel direito: navegação paginada |
| `canvas-views/proposal/pages/ProposalPageCover.tsx` | **[NOVO]** — página 1: capa |
| `canvas-views/proposal/pages/ProposalPageInvestment.tsx` | **[NOVO]** — página 2: investimento e planos |
| `canvas-views/proposal/pages/ProposalPageTechnical.tsx` | **[NOVO]** — página 3: dimensionamento (reutiliza subcomponentes de gráficos) |
| `canvas-views/proposal/pages/ProposalPageSchedule.tsx` | **[NOVO]** — página 4: cronograma |
| `canvas-views/proposal/pages/ProposalPageContact.tsx` | **[NOVO]** — página 5: encerramento |
| `canvas-views/proposal/charts/ConsumptionLineChart.tsx` | **[NOVO]** — gráfico de linha consumo |
| `canvas-views/proposal/charts/GenerationVsConsumptionLineChart.tsx` | **[NOVO]** — gráfico de linha dupla |
| `canvas-views/proposal/charts/GenerationVsConsumptionBarChart.tsx` | **[NOVO]** — gráfico de barras agrupadas |
| `canvas-views/proposal/ProposalBlockedScreen.tsx` | **[NOVO]** — tela de bloqueio |
| `core/state/slices/proposalSlice.ts` | **[NOVO]** — estado local de `proposalData` + página ativa no preview |
| `kurupira/backend/src/routes/variants.ts` | **[MODIFICAR]** — rota `export-pdf` com 5 páginas |
| `kurupira/backend/src/services/pdfGenerationService.ts` | **[NOVO]** — serviço PDF multipágina com template |
| `panels/CenterCanvas.tsx` | **[MODIFICAR]** — substituir `<ProposalModule>` por `<ProposalCanvasView>` |

---

## 11. Critérios de Aceitação

- [ ] `variantStatus !== 'APPROVED'` → tela de bloqueio; painel duplo não renderiza
- [ ] `variantStatus === 'APPROVED'` → view exibe painel duplo com 5 páginas navegáveis
- [ ] Clicar em "Capa" no índice → preview mostra página 1; campos da capa visíveis
- [ ] Clicar em "Investimento" → preview mostra página 2; campos editáveis da tabela e etapas visíveis
- [ ] Editar item da tabela de investimento → TOTAL recalcula em tempo real
- [ ] Soma dos percentuais de etapas ≠ 100% → indicador visual vermelho no editor de etapas
- [ ] Editar `customText` → página 3 no preview atualiza em tempo real
- [ ] Toggle "Mostrar preços" desativado → overlay "oculto no PDF" visível sobre valores no preview
- [ ] Potência kWp na capa calculada a partir dos módulos reais do `designData` — não hardcoded
- [ ] Código do projeto no formato `FV20XXXXXX` visível na capa
- [ ] Gráfico de barras com duas séries (laranja/azul) em página 3
- [ ] Mapa de satélite visível na página 3 quando `lat/lng` disponíveis
- [ ] Página 4 exibe todos os 6 marcos do cronograma com textos editados
- [ ] Página 5 exibe nome do engenheiro, CREA e contatos preenchidos
- [ ] Botão "Exportar PDF" → spinner → PDF de 5 páginas gerado → abre em nova aba
- [ ] `DesignVariant.pdfUrl` atualizado após exportação
- [ ] `proposalData` persistido via autosave sem botão explícito
- [ ] Projetos antigos sem `proposalData` carregam com valores padrão sem erro
- [ ] `tsc --noEmit` → EXIT CODE 0

---

## Referências

- `Proposta_Comercial_Neonorte_TEMPLATE.pdf` — referência visual obrigatória (5 páginas)
- `Template_Kurupyra_A4.pdf` — referência complementar para página 3
- `spec-view-proposal-2026-04-20.md` — versão anterior (supersedida)
- `spec-multiplas-propostas-2026-04-15.md` — `DesignVariant`, `DesignData`, `pricing`
- `spec-guardiao-aprovacao-2026-04-15.md` — `variantStatus`, condição de acesso
- `spec-view-simulation-2026-04-15.md` — `simulationResult`, `DAYS_IN_MONTH`
- `spec-compositor-blocos-2026-04-15.md` — estrutura dos blocos no LeftOutliner

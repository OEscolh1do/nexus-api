# Spec — ProposalCanvasView (Reformulação Completa)

**Arquivo alvo:** `canvas-views/ProposalCanvasView.tsx`  
**Tipo:** Feature Nova (substituição do ProposalModule como canvas view)  
**Módulo:** `engineering` — CenterCanvas  
**Prioridade:** P1  
**Responsável:** `the-builder`  
**Revisor:** `engenheiro-eletricista-pv` + `design-lead`  
**Data:** 2026-04-20  
**Ativada por:** aba "Proposta" no WorkspaceTabs  
**Condição de acesso:** `variantStatus === 'APPROVED'`  
**Cor de acento:** Indigo — `text-indigo-400` / `border-indigo-500/30`  
**Supersede:** `spec-view-proposal-2026-04-15.md`

---

## 1. Propósito e Escopo

A ProposalCanvasView é o documento de venda do integrador. Ela não é uma tela de edição de dimensionamento — é a síntese comercial de tudo que foi definido nas views anteriores, formatada para ser apresentada ao cliente final e exportada como PDF.

O template de referência (`Template_Kurupyra_A4.pdf`) define o conteúdo esperado: um documento de "Dimensionamento e Viabilidade do Projeto" com identidade visual Neonorte, incluindo gráficos de geração vs consumo, detalhes técnicos do sistema, localização e análise de irradiação.

Esta view cumpre dois papéis simultâneos:

- **Preview interativo** — o integrador visualiza o documento final dentro do Kurupira antes de exportar, podendo editar campos comerciais (preço, texto personalizado, prazo) inline sem sair da tela.
- **Documento exportável** — um PDF A4 fiel ao template é gerado sob demanda pelo botão "Exportar PDF" no TopRibbon.

---

## 2. Origem dos Dados

Todos os dados desta view são derivados de fontes já existentes no `solarStore`. Nenhum campo técnico é redigitado aqui — apenas os campos comerciais são editáveis nesta view.

### 2.1 Mapeamento de dados

| Campo no documento | Fonte no store | Localização |
|---|---|---|
| Nome do cliente | `clientData.clientName` | `TechnicalDesign.clientData` |
| Data do documento | gerada automaticamente | `new Date()` no momento da exportação |
| Potência do sistema (kWp) | calculado: soma de `quantity × pmax` de todos os módulos | `designData.modules` via `systemCompositionSlice` |
| Geração estimada (kWh/mês) | `simulationResult.annualGenerationKwh / 12` | `designData.simulationResult` |
| Quantidade de módulos | soma de `quantity` de todos os grupos de módulos | `designData.modules` |
| Fabricante do módulo | `modules[0].manufacturer` | `designData.modules` |
| Potência do módulo (Wp) | `modules[0].electrical.pmax` | `designData.modules` |
| Quantidade de inversores | `inverters.ids.length` | `designData.inverters` |
| Potência do inversor (W) | `inverters[0].power_w` | `designData.inverters` |
| Fabricante do inversor | `inverters[0].manufacturer` | `designData.inverters` |
| Tipo de instalação | `clientData.installationType` | `TechnicalDesign.clientData` |
| Tipo de telhado | `clientData.roofType` | `TechnicalDesign.clientData` |
| Irradiação local (HSP médio) | média de `clientData.monthlyIrradiation[12]` | `TechnicalDesign.clientData` |
| Dados de consumo mensal | `clientData.monthlyConsumption[12]` | `TechnicalDesign.clientData` |
| Geração mensal simulada | `designData.simulationResult.monthlyGeneration[12]` | `designData.simulationResult` |
| Geração × Consumo (%) | calculado: `annualGeneration / annualConsumption × 100` | derivado |
| Localização (mapa) | `clientData.lat`, `clientData.lng` | `TechnicalDesign.clientData` |
| Texto personalizado (Padrão Neonorte) | `proposalData.customText` | `designData.proposalData` — **campo novo** |
| Preço total (R$) | `designData.pricing.totalPrice` | `designData.pricing` |

### 2.2 Campos novos necessários no `DesignData`

A interface `DesignData` recebe uma nova seção `proposalData` para acomodar os campos exclusivamente comerciais que o integrador edita nesta view:

```typescript
interface ProposalData {
  customText: string;        // bloco de texto livre (ex.: "Padrão Neonorte")
  validityDays: number;      // prazo de validade da proposta em dias (padrão: 30)
  warrantyYears: number;     // anos de garantia do sistema (padrão: 25)
  paymentTerms: string;      // texto livre de condições de pagamento
  showPricing: boolean;      // controla se preço aparece no PDF exportado
  showMap: boolean;          // controla se mapa aparece no PDF exportado
  logoOverride: string | null; // URL de logo alternativa (para white-label)
}
```

> **Sem migration de schema:** a mudança é dentro do campo JSON `designData` existente na tabela `DesignVariant`. Nenhuma coluna nova é adicionada ao banco. Projetos antigos sem `proposalData` terão o campo tratado como `null` pelo frontend, que aplica os valores padrão.

---

## 3. Estrutura da View — Dois Painéis

A view é dividida em dois painéis lado a lado, separados por um divisor vertical.

```
┌─────────────────────────────────────────────────────────────────────┐
│  PAINEL ESQUERDO (35%)         │  PAINEL DIREITO (65%)             │
│  Controles editoriais          │  Preview do documento A4          │
│  e campos comerciais           │  (fiel ao template)               │
│                                │                                   │
│  ┌──────────────────────┐      │  ┌─────────────────────────────┐ │
│  │ Variante ativa       │      │  │  [documento renderizado]    │ │
│  │ Padrão · APROVADO    │      │  │                             │ │
│  ├──────────────────────┤      │  │                             │ │
│  │ Texto personalizado  │      │  │                             │ │
│  │ [textarea]           │      │  │                             │ │
│  ├──────────────────────┤      │  │                             │ │
│  │ Prazo de validade    │      │  │                             │ │
│  │ [30 dias]            │      │  │                             │ │
│  ├──────────────────────┤      │  │                             │ │
│  │ Garantia do sistema  │      │  │                             │ │
│  │ [25 anos]            │      │  │                             │ │
│  ├──────────────────────┤      │  │                             │ │
│  │ Condições pagamento  │      │  │                             │ │
│  │ [texto livre]        │      │  │                             │ │
│  ├──────────────────────┤      │  │                             │ │
│  │ ☑ Mostrar preço      │      │  │                             │ │
│  │ ☑ Mostrar mapa       │      │  │                             │ │
│  ├──────────────────────┤      │  │                             │ │
│  │ [Exportar PDF ↗]     │      │  └─────────────────────────────┘ │
│  └──────────────────────┘      │                                   │
└─────────────────────────────────────────────────────────────────────┘
```

O painel direito é um preview **live** — qualquer edição no painel esquerdo reflete imediatamente no preview sem recarregar.

---

## 4. Painel Esquerdo — Controles Editoriais

O painel esquerdo tem fundo `bg-slate-900`, padding interno `p-4`, gap vertical entre seções `gap-4` e scroll vertical quando o conteúdo excede a altura disponível.

### 4.1 Cabeçalho do painel

Exibe o nome da variante ativa e seu status de aprovação. Não é editável aqui.

```
┌──────────────────────────────┐
│  📄 Proposta                 │
│  Padrão · ● APROVADO         │
└──────────────────────────────┘
```

O badge de status `APROVADO` usa `bg-emerald-900 text-emerald-400 border border-emerald-800`. Se `variantStatus !== 'APPROVED'`, esta view não está acessível — ver §7 Tela de Bloqueio.

### 4.2 Seção — Texto Personalizado

Label: **"Descrição / Apresentação"**. Campo `textarea` com 4 linhas visíveis, resize vertical habilitado. Placeholder: *"Descreva o padrão de instalação, diferenciais do integrador ou observações para o cliente."*

Este campo alimenta o bloco de texto narrativo que aparece no documento abaixo do título "Padrão Neonorte" (conforme o template, este texto é livre e descreve o projeto ou a empresa).

Limite: 500 caracteres. Contador de caracteres visível abaixo do campo no formato `XXX / 500`.

Autosave: ao sair do foco (`onBlur`), salva via `PATCH /api/v1/designs/:id/variants/:variantId`. Sem botão "Salvar".

### 4.3 Seção — Condições Comerciais

Três campos em coluna:

**Prazo de validade:** campo numérico com sufixo "dias". Padrão: `30`. Range válido: 1–365. Renderiza no rodapé do documento como *"Proposta válida por X dias a partir da data de emissão."*

**Garantia do sistema:** campo numérico com sufixo "anos". Padrão: `25`. Renderiza na seção de detalhes do projeto no documento.

**Condições de pagamento:** `textarea` de 2 linhas. Placeholder: *"Ex.: 50% na aprovação, 50% na conclusão da instalação."* Renderiza no rodapé do documento.

### 4.4 Seção — Visibilidade no PDF

Dois controles do tipo switch (toggle estilizado):

- **Mostrar preço total no PDF** — quando ativo, o valor `totalPrice` formatado em BRL aparece no documento exportado. No preview da tela, o preço é sempre visível para o integrador. O toggle afeta apenas o PDF gerado.
- **Mostrar mapa no PDF** — quando ativo, o mapa estático de localização é incluído na exportação. No preview, o mapa aparece sempre que `lat/lng` estiverem disponíveis.

### 4.5 Botão de Exportação

Botão primário de largura total fixado na base do painel: **"Exportar PDF"**. Cor indigo sólida (`bg-indigo-600 hover:bg-indigo-500`). Ícone de download (`Download`, 14px) à esquerda do label.

Ao clicar: dispara `POST /api/v1/designs/:id/variants/:variantId/export-pdf`. O backend gera o PDF e retorna `{ pdfUrl: string }`. O frontend abre a URL em nova aba via `window.open`. O campo `DesignVariant.pdfUrl` é atualizado no banco.

Estado de carregamento: botão exibe spinner e fica `disabled` durante a geração. Timeout: 30 segundos — se excedido, exibe toast de erro com mensagem *"Falha ao gerar o PDF. Tente novamente."*

---

## 5. Painel Direito — Preview do Documento

O preview é uma composição React que replica fielmente a estrutura visual do `Template_Kurupyra_A4.pdf`. Não é o PDF em si — é uma representação interativa e responsiva do documento final.

O container do preview usa `overflow-y: auto` e `bg-slate-950`. O documento interno tem proporção A4 (210×297mm equivalente) apresentado com sombra leve (`shadow-2xl`) e margens laterais de respiro, criando a sensação de "folha sobre fundo escuro".

Qualquer alteração nos campos do painel esquerdo reflete no preview sem atraso perceptível (reatividade via estado Zustand local).

### 5.1 Estrutura do documento

O documento segue a estrutura visual do template PDF de referência:

---

**Cabeçalho do documento**

- Título em caixa alta bold: **"DIMENSIONAMENTO E VIABILIDADE DO PROJETO"**
- Logo Neonorte no canto superior direito (SVG inline, sem dependência de rede)
- Data de geração no formato `DD MMMM YYYY` (ex.: `20 ABRIL 2026`)
- Nome do cliente em destaque bold abaixo do título (`clientData.clientName`)

---

**Bloco resumo do sistema**

Dois cards lado a lado com fundo colorido, fidelizando o template:

| Card | Conteúdo | Cor de fundo |
|---|---|---|
| Esquerdo | Rótulo vertical "PROJETO" + "Potência: X,X kWp" | verde escuro `#2D4A3E` |
| Direito | "Geração: XXXX kWh" em tipografia grande | verde médio `#3A6B52` |

A potência kWp e a geração kWh são calculadas em tempo real a partir dos dados do `solarStore`, não hardcoded.

---

**Coluna esquerda do documento**

*Seção "Padrão Neonorte":*  
Título bold seguido do conteúdo do campo `customText`. Tipografia 9–10pt, cor cinza escuro. Se `customText` estiver vazio, a seção exibe o placeholder em itálico cinza claro.

*Seção "Histórico de Consumo":*  
Gráfico de linha com 12 pontos mensais (jan–dez). Eixo Y em kWh. Sem legenda adicional. Fonte: `clientData.monthlyConsumption[12]`. Cor da linha: azul `#1A5F8F`.

*Seção "Geração × Consumo":*  
Gráfico de linha dupla. Linha laranja `#E87722` para geração, linha azul `#1A5F8F` para consumo. Eixo Y em kWh, eixo X com meses abreviados em pt-BR. Fontes: `simulationResult.monthlyGeneration[12]` e `clientData.monthlyConsumption[12]`.

---

**Coluna direita do documento**

*Gráfico de barras "Geração vs Consumo":*  
Barras agrupadas mensais. Barra laranja `#E87722` para geração, barra azul `#1A5F8F` para consumo. Legenda acima do gráfico com as duas séries identificadas.

*Destaques numéricos (par horizontal):*

| Elemento | Valor | Rótulo |
|---|---|---|
| Irradiação | `X,XX` (2 casas) | kWh/h.dia — "Irradiação do Local" |
| Cobertura | `XXX%` (inteiro) | "Média da Geração × Consumo" |

Ambos em tipografia grande bold, conforme o template.

*Seção "Detalhes do Projeto":*  
Caixa com fundo verde escuro e borda vertical verde lateral (conforme template). Listagem técnica com thumbnails dos equipamentos (imagens do catálogo quando disponíveis):

```
Módulos: [quantidade]
  Fabricante: [manufacturer]
  Potência: [pmax] Wp

Inversor(es): [quantidade]
  Fabricante: [manufacturer]
  Potência: [power_w] W

Instalação:
  [installationType]
  [roofType]
```

*Mapa de localização:*  
Mini-mapa renderizado via Leaflet em modo não-interativo (zoom e pan desabilitados). Marcador vermelho na posição `clientData.lat / clientData.lng`. Visível no preview sempre que `lat/lng` disponíveis. Incluído no PDF somente quando `showMap === true`.

---

### 5.2 Gráficos do preview

Os três gráficos (histórico de consumo em linha, geração × consumo em linha dupla, barras agrupadas mensais) usam a biblioteca `recharts` já presente no projeto. São componentes React reativos — refletem os dados reais em tempo real, não SVGs estáticos.

Paleta obrigatória para fidelidade ao template:

| Série | Cor hex |
|---|---|
| Geração | `#E87722` (laranja) |
| Consumo | `#1A5F8F` (azul) |

### 5.3 Dados calculados exibidos no preview

| Dado | Fórmula |
|---|---|
| Potência total (kWp) | `sum(module.quantity × module.electrical.pmax) / 1000` arredondado para 1 casa decimal |
| Geração média mensal (kWh) | `simulationResult.annualGenerationKwh / 12` arredondado para inteiro |
| Irradiação média (kWh/h.dia) | `mean(clientData.monthlyIrradiation[12])` com 2 casas decimais |
| Cobertura (%) | `(annualGenerationKwh / annualConsumptionKwh) × 100` sem casas decimais |

---

## 6. Comportamento de Edição e Persistência

Todos os campos do painel esquerdo pertencem a `designData.proposalData`. O autosave segue o padrão do workspace:

- `onChange` → atualiza estado local Zustand imediatamente; preview reflete em tempo real
- `onBlur` → dispara `PATCH /api/v1/designs/:id/variants/:variantId` com delta de `designData.proposalData`
- Indicador discreto de "salvando..." no canto inferior esquerdo do painel durante a operação (spinner, sem modal ou interrupção do fluxo)
- Em caso de erro de rede: toast de aviso + dado mantido no estado local para nova tentativa automática no próximo `onBlur`

Não existe botão "Salvar" explícito. O mecanismo é idêntico ao autosave das demais canvas views.

---

## 7. Tela de Bloqueio

Quando `variantStatus !== 'APPROVED'`, a view exibe uma tela de bloqueio fullscreen no lugar do painel duplo.

**Composição:**

```
┌─────────────────────────────────────┐
│                                     │
│         🔒                          │
│   (ícone Lock, 32px, slate-600)     │
│                                     │
│   Proposta bloqueada                │
│   (text-lg font-semibold            │
│    text-slate-300)                  │
│                                     │
│   A proposta só pode ser gerada     │
│   após o sistema ser aprovado.      │
│   Complete o dimensionamento e      │
│   aprove na view de Simulação.      │
│   (text-sm text-slate-500,          │
│    max-width 320px, centralizado)   │
│                                     │
│   [ BlockStatusSummary ]            │
│   ✅ Consumo                        │
│   ✅ Módulos FV                     │
│   ⚪ Inversor                       │
│   ⚪ Simulação                      │
│                                     │
│   [ Ver Simulação → ]               │
│   (variant outline, cor indigo)     │
│                                     │
└─────────────────────────────────────┘
```

O `BlockStatusSummary` exibe os 4 blocos do Compositor com ícone `CheckCircle` (emerald-400) para `status === 'complete'` e `Circle` (slate-600) para os demais. Clicar em um bloco com status incompleto executa `setFocusedBlock(blocoId)`.

---

## 8. Pré-requisitos de Backend

### 8.1 Campo `proposalData` no JSON `designData`

A tabela `DesignVariant` persiste `designData` como JSON. A interface `DesignData` recebe a nova chave `proposalData` conforme §2.2. O backend não valida a estrutura interna do JSON — persiste o objeto completo recebido no `PUT`.

Projetos antigos sem `proposalData` no JSON retornam `designData.proposalData === null` ou `undefined`. O frontend trata essa ausência aplicando os valores padrão definidos abaixo:

| Campo | Valor padrão |
|---|---|
| `customText` | `""` |
| `validityDays` | `30` |
| `warrantyYears` | `25` |
| `paymentTerms` | `""` |
| `showPricing` | `true` |
| `showMap` | `true` |
| `logoOverride` | `null` |

### 8.2 Novo endpoint de exportação PDF

```
POST /api/v1/designs/:id/variants/:variantId/export-pdf
```

**Fluxo do endpoint:**

1. Busca os dados completos da variante: `DesignVariant.designData` + `TechnicalDesign.clientData`
2. Calcula os valores derivados no servidor (kWp total, cobertura %, HSP médio) — não confia em valores pré-calculados enviados pelo cliente
3. Monta o payload e chama o serviço de geração PDF
4. Armazena o PDF gerado (storage local ou S3 conforme configuração do ambiente)
5. Atualiza `DesignVariant.pdfUrl` com a URL do arquivo gerado
6. Retorna `{ pdfUrl: string }` com status `200`

**Payload completo para o serviço de geração:**

| Campo | Origem |
|---|---|
| `clientName` | `TechnicalDesign.clientData.clientName` |
| `generationDate` | `new Date()` no servidor |
| `systemPowerKwp` | calculado: `sum(quantity × pmax) / 1000` |
| `monthlyGenerationKwh` | média de `designData.simulationResult.monthlyGeneration` |
| `moduleCount` | soma de `quantity` em `designData.modules` |
| `moduleManufacturer` | `designData.modules[0].manufacturer` |
| `moduleWp` | `designData.modules[0].electrical.pmax` |
| `inverterCount` | `designData.inverters.ids.length` |
| `inverterManufacturer` | `designData.inverters[0].manufacturer` |
| `inverterPowerW` | `designData.inverters[0].power_w` |
| `installationType` | `clientData.installationType` |
| `roofType` | `clientData.roofType` |
| `averageHsp` | média de `clientData.monthlyIrradiation[12]` |
| `coveragePercent` | `(geraçãoAnual / consumoAnual) × 100` |
| `monthlyConsumption` | `clientData.monthlyConsumption[12]` |
| `monthlyGeneration` | `designData.simulationResult.monthlyGeneration[12]` |
| `customText` | `designData.proposalData.customText` |
| `validityDays` | `designData.proposalData.validityDays` |
| `warrantyYears` | `designData.proposalData.warrantyYears` |
| `paymentTerms` | `designData.proposalData.paymentTerms` |
| `showPricing` | `designData.proposalData.showPricing` |
| `totalPrice` | `designData.pricing.totalPrice` (incluído apenas se `showPricing === true`) |
| `showMap` | `designData.proposalData.showMap` |
| `lat` | `clientData.lat` |
| `lng` | `clientData.lng` |

### 8.3 Novos campos em `clientData` (se ainda não existirem)

O template exige `installationType` e `roofType`. Esses campos precisam existir em `TechnicalDesign.clientData`. Se ausentes, o backend retorna string vazia e o frontend omite a linha correspondente no documento sem erro.

**Valores aceitos para `installationType`:** `"Residencial"`, `"Comercial"`, `"Industrial"`, `"Rural"`.

**Valores aceitos para `roofType`:** `"Telhado de Fibrocimento"`, `"Telhado de Cerâmica"`, `"Telhado Metálico"`, `"Laje"`, `"Solo"`.

Se esses campos ainda não fazem parte do fluxo de coleta de dados do cliente (presumivelmente no `ClientDataModal` ou na `SiteCanvasView`), é necessário adicioná-los ao formulário. O campo `roofType` tem sinergia direta com dados já levantados na `SiteCanvasView`.

---

## 9. Arquivos

| Arquivo | Status |
|---|---|
| `canvas-views/ProposalCanvasView.tsx` | **[NOVO]** — view completa (substitui ProposalModule no CenterCanvas) |
| `canvas-views/proposal/ProposalDocumentPreview.tsx` | **[NOVO]** — painel direito: composição do documento A4 |
| `canvas-views/proposal/ProposalEditPanel.tsx` | **[NOVO]** — painel esquerdo: campos comerciais editáveis |
| `canvas-views/proposal/ProposalBlockedScreen.tsx` | **[NOVO]** — tela de bloqueio quando não aprovado |
| `canvas-views/proposal/charts/ConsumptionLineChart.tsx` | **[NOVO]** — gráfico de linha histórico de consumo |
| `canvas-views/proposal/charts/GenerationVsConsumptionLineChart.tsx` | **[NOVO]** — gráfico de linha dupla geração × consumo |
| `canvas-views/proposal/charts/GenerationVsConsumptionBarChart.tsx` | **[NOVO]** — gráfico de barras agrupadas mensais |
| `core/state/slices/proposalSlice.ts` | **[NOVO]** — estado local de `proposalData` |
| `kurupira/backend/src/routes/variants.ts` | **[MODIFICAR]** — adicionar rota `export-pdf` |
| `kurupira/backend/src/services/pdfGenerationService.ts` | **[NOVO]** — serviço de geração PDF com template Neonorte |
| `panels/CenterCanvas.tsx` | **[MODIFICAR]** — substituir `<ProposalModule>` por `<ProposalCanvasView>` |

---

## 10. Critérios de Aceitação

- [ ] `variantStatus !== 'APPROVED'` → tela de bloqueio visível; painel duplo não renderiza
- [ ] `variantStatus === 'APPROVED'` → view exibe painel duplo (esquerdo + preview)
- [ ] Editar `customText` → texto atualiza no preview em tempo real sem delay perceptível
- [ ] Toggle "Mostrar preço" desativado → preço ausente no PDF exportado (verificado por inspeção do arquivo)
- [ ] Toggle "Mostrar mapa" desativado → mapa não renderiza no PDF
- [ ] Potência kWp no preview calculada a partir dos módulos reais do `designData` — não hardcoded
- [ ] Geração mensal no preview usa `simulationResult.monthlyGeneration` com `DAYS_IN_MONTH` corrigidos
- [ ] Gráfico de barras com duas séries (laranja/azul) refletindo dados reais do projeto
- [ ] Gráfico de linha dupla com séries distintas e cores corretas (`#E87722` / `#1A5F8F`)
- [ ] Botão "Exportar PDF" → spinner ativo → PDF gerado → abre em nova aba
- [ ] `DesignVariant.pdfUrl` atualizado no banco após exportação bem-sucedida
- [ ] `proposalData` persistido via autosave `onBlur` sem botão explícito
- [ ] Projetos antigos sem `proposalData` carregam com valores padrão sem erro de runtime
- [ ] `installationType` e `roofType` visíveis no documento quando preenchidos em `clientData`
- [ ] Mapa de localização renderiza no preview quando `lat/lng` disponíveis
- [ ] BlockStatusSummary na tela de bloqueio reflete o status real dos blocos
- [ ] Clique em bloco incompleto no BlockStatusSummary → `setFocusedBlock(blocoId)`
- [ ] `tsc --noEmit` → EXIT CODE 0

---

## Referências

- `Template_Kurupyra_A4.pdf` — referência visual obrigatória para o `ProposalDocumentPreview`
- `spec-view-proposal-2026-04-15.md` — spec anterior (supersedida por este documento)
- `spec-multiplas-propostas-2026-04-15.md` — modelo `DesignVariant`, `DesignData`, `pricing`
- `spec-guardiao-aprovacao-2026-04-15.md` — `variantStatus`, condição de acesso
- `spec-view-simulation-2026-04-15.md` — `simulationResult`, motor de cálculo com `DAYS_IN_MONTH`
- `spec-monetizacao-banco-creditos-2026-04-10.md` — `tariffRate`, custo de disponibilidade
- `spec-view-site-2026-04-15.md` — `clientData`, campos de irradiação e temperatura

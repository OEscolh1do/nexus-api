# Plano de Refatoração — Compositor de Blocos: Jornada do Integrador

**Tipo:** Feature Nova + Refatoração de UX
**Módulo:** `engineering` — `LeftOutliner`, `CenterCanvas`, `solarStore`, `useTechStore`
**Prioridade:** P0 — Bloqueante
**Responsável (impl.):** `the-builder`
**Revisor (aceitação):** `engenheiro-eletricista-pv` + `design-lead`
**Data de criação:** 2026-04-14
**Versão:** 1.0
**Origem:** proposta-arquitetural / jornada-usuario

---

## 1. Diagnóstico

### 1.1 Situação atual

O botão "Dimensionamento Inteligente" já entrega o núcleo da jornada: calcula a
quantidade mínima de módulos a partir do consumo, adiciona ao inventário, sugere o
inversor compatível e monta a topologia na árvore do `LeftOutliner`. O resultado técnico
está correto.

O problema é de **modelo mental**: o produto do Dimensionamento Inteligente é uma
árvore de texto hierárquica (Inversor → MPPT → String → Módulo). A árvore é precisa
para quem já sabe ler topologia elétrica, mas é opaca para o integrador que quer
entender o sistema como um conjunto de peças que se encaixam ou não.

Dois sintomas concretos observados:

1. O integrador não consegue ver, a partir da árvore, se o sistema está elétrica e
   energeticamente coerente sem abrir cada nó individualmente.
2. Quando uma etapa está faltando (ex: inversor não escolhido, consumo não inserido),
   a árvore simplesmente não exibe o nó correspondente — a lacuna é invisível.

### 1.2 Evidência do problema

| Indicador | Estado atual | Estado desejado |
|-----------|-------------|-----------------|
| Lacuna no sistema visível na UI | Ausente — árvore simplesmente omite o nó | Bloco placeholder com cor e sugestão contextual |
| Dado que transita entre módulo e inversor visível | Ausente | Conector mostra `kWp calculado` e `oversize ratio` |
| Integrador consegue avaliar compatibilidade sem abrir inspector | Não | Chips de status no próprio bloco |
| Dimensionamento Inteligente materializa visualmente o fluxo | Não — monta a árvore silenciosamente | Blocos surgem em sequência enquanto o cálculo roda |

### 1.3 Impacto

O Dimensionamento Inteligente existe e funciona, mas o integrador não consegue
**confiar** no resultado porque não vê o raciocínio. Um sistema com oversize ratio de
1.42 (fora da faixa) produz o mesmo visual na árvore que um sistema com ratio 1.18
(ideal). No modelo de blocos, o bloco do inversor exibiria o chip `Ratio 1.42` em
vermelho imediatamente.

---

## 2. A Proposta: Compositor de Blocos

### 2.1 Conceito central

O sistema é composto por **blocos independentes** que declaram contratos de entrada e
saída. Quando os contratos de dois blocos adjacentes batem, eles se conectam. Quando
não batem, o conector fica em estado de alerta. Quando um bloco está faltando, um
placeholder ocupa sua posição e exibe o que falta.

A metáfora é deliberadamente próxima do Scratch ou de peças de Lego: a forma visual
do bloco comunica se ele encaixa ou não, sem exigir que o integrador leia números.

```
┌──────────────────────┐
│  BLOCO CONSUMO       │  ← contrato de saída: kWp alvo, HSP, tarifa
│  500 kWh/mês · PA   │
└──────────┬───────────┘
           │  kWp alvo: 3.56 kWp
           ▼
┌──────────────────────┐
│  BLOCO MÓDULO FV     │  ← contrato de entrada: kWp alvo
│  DMEGC 610W · 6 un. │  ← contrato de saída: Voc, Isc, topologia
└──────────┬───────────┘
           │  topologia: 1 string, Voc 299V
           ▼
┌──────────────────────┐
│  BLOCO INVERSOR      │  ← contrato de entrada: Voc, Isc, kWp DC
│  PHB 5kW · ratio 1.15│
└──────────────────────┘
```

Blocos faltantes são representados por placeholders tracejados com sugestão contextual.
Conectores entre blocos exibem o dado que transita — não são decorativos.

### 2.2 Onde vive o Compositor

O Compositor é uma nova `CanvasView` chamada `ComposerCanvasView`, acessível pelo
`CenterCanvas` como alternativa à vista de mapa. Não substitui a árvore do
`LeftOutliner` — convive com ela. O integrador pode alternar entre as duas vistas.

Isso é deliberado: a árvore continua sendo a fonte de verdade para edição granular
(configurar MPPTs, renomear strings, ajustar azimute por água). O Compositor é a
**vista de avaliação e navegação** — a lente do integrador antes de apresentar ao
cliente.

### 2.3 O Dimensionamento Inteligente no novo modelo

O botão "Dimensionamento Inteligente" existente passa a ter um comportamento adicional:
ao invés de apenas montar a topologia na árvore silenciosamente, ele **anima a
materialização dos blocos** no Compositor em sequência:

```
1. Bloco Consumo aparece com os dados do cliente
2. Conector pulsa → "calculando kWp alvo..."
3. Bloco Módulo FV aparece com modelo selecionado + quantidade calculada
4. Conector pulsa → "validando topologia elétrica..."
5. Bloco Inversor aparece com modelo sugerido + chips de validação
```

O integrador vê o raciocínio do sistema em tempo real, não apenas o resultado final.

---

## 3. Anatomia dos Blocos

### 3.1 Estrutura de um bloco

Cada bloco tem quatro zonas:

```
┌─ [ícone] [título]         [resumo] ─┐  ← header: identidade
│                                      │
│  [chip] [chip] [chip]                │  ← body: chips de status
│                                      │
└──────────────────────────────────────┘
```

**Header:** ícone colorido que identifica o tipo, título, e um resumo compacto à
direita (ex: "DMEGC 610W × 6 un."). Clicar no header abre o inspector daquele
elemento no `RightInspector` sem sair da vista do Compositor.

**Body — chips de status:** chips coloridos que comunicam o estado do bloco. Cada
chip representa um parâmetro crítico. A cor do chip segue a semântica do
`SystemHealthCheck`:

| Cor do chip | Significado |
|-------------|-------------|
| Verde (teal) | Parâmetro dentro da faixa ideal |
| Âmbar | Parâmetro aceitável mas fora do ideal |
| Vermelho | Parâmetro fora do limite — requer ação |
| Cinza | Parâmetro não calculado (dado de entrada faltando) |

### 3.2 Chips por tipo de bloco

**Bloco Consumo:**
- Cidade + HSP
- Consumo médio mensal (kWh)
- Tarifa R$/kWh
- `kWp alvo` calculado (cinza se sem consumo inserido)

**Bloco Módulo FV:**
- Potência do módulo (Wp)
- Quantidade (verde se ≥ mínimo para kWp alvo; âmbar se exatamente no limite; vermelho se abaixo)
- `kWp instalado` vs `kWp alvo`
- Voc por string (calculado a partir de N_série × Voc_módulo)
- Isc por string

**Bloco Inversor:**
- Oversize ratio DC/AC (verde 1.10–1.25; âmbar 1.05–1.10 ou 1.25–1.35; vermelho fora)
- Voc máx corrigido vs V_max_inversor (verde se ≤ 95%; vermelho se > 100%)
- Isc × strings vs I_MPPT_max (verde se dentro; vermelho se excede)
- Nº de MPPTs disponíveis vs MPPTs necessários

### 3.3 Placeholder (bloco faltante)

Quando um bloco não está preenchido, um placeholder tracejado ocupa sua posição:

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
  [+]  Inversor
│      Sugestão: PHB 5kW    │
        ou Growatt 5000TL
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

O placeholder exibe sugestões contextuais baseadas nos dados dos blocos já preenchidos.
Para o inversor placeholder, o sistema consulta `useAutoSizing` e exibe os 2–3
candidatos mais compatíveis com a topologia existente. Clicar na sugestão abre o
`InverterCatalogDialog` com o modelo pré-selecionado.

### 3.4 Conectores

Os conectores entre blocos não são decorativos. Cada conector exibe o dado principal
que transita entre os dois blocos adjacentes:

| Conector | Dado exibido |
|----------|-------------|
| Consumo → Módulo | `kWp alvo: X.XX kWp` |
| Módulo → Inversor | `topologia: N strings, Voc XXX V` |

Quando o dado não pode ser calculado (bloco anterior incompleto), o conector exibe
`—` com cor cinza e opacidade reduzida.

---

## 4. Especificação Técnica

### 4.1 Novo slice: `systemCompositionSlice`

A store normalizada existente (`useTechStore`, `solarStore`) não é alterada. O
`systemCompositionSlice` é uma camada de **view derivada** — ele lê dos stores
existentes e expõe o estado do Compositor sem duplicar dados.

```typescript
// src/core/stores/systemCompositionSlice.ts

interface BlockStatus {
  status: 'complete' | 'warning' | 'error' | 'empty';
  chips: Array<{
    label: string;
    value: string;
    severity: 'ok' | 'warn' | 'error' | 'neutral';
  }>;
  suggestions?: string[];  // IDs de equipamentos sugeridos (somente em placeholders)
}

interface SystemCompositionState {
  consumptionBlock: BlockStatus;
  moduleBlock: BlockStatus;
  inverterBlock: BlockStatus;

  // Dados dos conectores (derivados, não editáveis)
  connectorC1: { label: string; value: string; active: boolean }; // consumo→módulo
  connectorC2: { label: string; value: string; active: boolean }; // módulo→inversor

  // Animação do Dimensionamento Inteligente
  autoSizingInProgress: boolean;
  autoSizingStep: 'idle' | 'consumption' | 'module' | 'inverter' | 'done';
}
```

Todo o estado é derivado via seletores Zustand — nenhum dado novo é armazenado.
`consumptionBlock.chips` lê de `solarStore.clientData`. `moduleBlock.chips` lê de
`useTechStore.modules` + `journeySlice.kWpAlvo`. `inverterBlock.chips` lê de
`useTechStore.inverters` + `electricalMath.calculateStringMetrics()`.

### 4.2 Novo componente: `ComposerCanvasView`

```
src/modules/engineering/ui/panels/canvas-views/ComposerCanvasView.tsx
  └── components/
       ├── ComposerBlock.tsx         ← bloco genérico (header + chips)
       ├── ComposerBlockConsumption.tsx
       ├── ComposerBlockModule.tsx
       ├── ComposerBlockInverter.tsx
       ├── ComposerPlaceholder.tsx   ← bloco tracejado com sugestões
       └── ComposerConnector.tsx     ← linha com label de dado transitado
```

`ComposerCanvasView` é um componente puramente de leitura e navegação. Toda
edição continua acontecendo no `RightInspector` ao clicar em um bloco.

### 4.3 Animação do Dimensionamento Inteligente

O `useAutoSizing.ts` existente é modificado para despachar `autoSizingStep` ao
`systemCompositionSlice` à medida que cada etapa é concluída. A `ComposerCanvasView`
observa esse campo e anima a entrada de cada bloco com uma transição CSS simples
(`opacity 0→1` + `translateY 8px→0`).

```typescript
// Em useAutoSizing.ts — modificação
async function runAutoSizing() {
  setAutoSizingStep('consumption');
  await calculateKwpAlvo();  // já existe

  setAutoSizingStep('module');
  await selectAndAddModules();  // já existe

  setAutoSizingStep('inverter');
  await selectAndAddInverter();  // já existe

  setAutoSizingStep('done');
}
```

Nenhuma lógica de cálculo é alterada — apenas o despacho de estado de progresso.

### 4.4 Especificação: cálculo dos chips do Bloco Inversor

#### Entrada

| Variável | Tipo | Fonte |
|----------|------|-------|
| `Pac_nominal` | `number` (W) | `useTechStore.inverters.entities[id].electrical.pacNominal` |
| `Pdc_total` | `number` (W) | `Σ(module.electrical.pmax × qtd)` via `useTechStore` |
| `Voc_max_corrigido` | `number` (V) | resultado de `calculateStringMetrics()` com Tmin histórica |
| `Vinput_max` | `number` (V) | `inverter.electrical.maxInputVoltage` |
| `Isc_total` | `number` (A) | `module.electrical.isc × nStrings_paralelas` |
| `Imppt_max` | `number` (A) | `inverter.electrical.mppts[0].maxCurrentPerMPPT` |

#### Fórmulas para chips

```typescript
const oversizeRatio = Pdc_total / Pac_nominal;

const chipOversize: Chip = {
  label: 'Ratio DC/AC',
  value: oversizeRatio.toFixed(2),
  severity: oversizeRatio >= 1.10 && oversizeRatio <= 1.25 ? 'ok'
          : oversizeRatio >= 1.05 && oversizeRatio <= 1.35 ? 'warn'
          : 'error'
};

const vocMargin = Voc_max_corrigido / Vinput_max;

const chipVoc: Chip = {
  label: 'Voc máx',
  value: `${Voc_max_corrigido.toFixed(0)}V`,
  severity: vocMargin <= 0.95 ? 'ok'
          : vocMargin <= 1.00 ? 'warn'
          : 'error'
};

const chipIsc: Chip = {
  label: 'Isc MPPT',
  value: `${Isc_total.toFixed(1)}A`,
  severity: Isc_total <= Imppt_max ? 'ok' : 'error'
};
```

#### Casos de borda

| Situação | Comportamento |
|----------|---------------|
| Nenhum inversor selecionado | Bloco Inversor = placeholder; chips não calculados |
| `Pac_nominal` = 0 ou undefined | Chip oversize = `neutral` com valor `—` |
| Catálogo sem `maxInputVoltage` | Chip Voc = `neutral` com aviso "dados de catálogo incompletos" |

---

## 5. Arquivos Afetados

### Criar

| Arquivo | Propósito |
|---------|-----------|
| `[NEW] canvas-views/ComposerCanvasView.tsx` | Vista principal do Compositor de Blocos |
| `[NEW] canvas-views/composer/ComposerBlock.tsx` | Componente genérico de bloco |
| `[NEW] canvas-views/composer/ComposerPlaceholder.tsx` | Bloco placeholder tracejado com sugestões |
| `[NEW] canvas-views/composer/ComposerConnector.tsx` | Conector entre blocos com dado transitado |
| `[NEW] core/stores/systemCompositionSlice.ts` | Seletores derivados para estado do Compositor |

### Modificar

| Arquivo | Mudança |
|---------|---------|
| `[MODIFY] ui/panels/CenterCanvas.tsx` | Adicionar `ComposerCanvasView` ao mapa de views; tab "Compositor" no seletor de vistas |
| `[MODIFY] hooks/useAutoSizing.ts` | Despachar `autoSizingStep` ao slice durante execução; sem alteração na lógica de cálculo |
| `[MODIFY] ui/panels/TopRibbon.tsx` | Botão "Dimensionamento Inteligente" passa a navegar para `ComposerCanvasView` após execução |

### Sem alteração (explícito)

| Arquivo | Motivo |
|---------|--------|
| `core/stores/useTechStore.ts` | Fonte de verdade não muda; `systemCompositionSlice` apenas lê |
| `core/stores/solarStore.ts` | Idem |
| `ui/panels/LeftOutliner.tsx` | Árvore continua existindo; Compositor é alternativo, não substituto |
| `utils/electricalMath.ts` | Cálculos não mudam; chips consomem os resultados existentes |

---

## 6. Plano de Migração

### Ordem de execução

```
Fase A: systemCompositionSlice (seletores derivados puros)
  → Sistema compila; slice existe mas nenhum componente o consome ainda

Fase B: ComposerCanvasView estática (sem animação)
  → Integrador consegue abrir o Compositor e ver os blocos com os dados atuais

Fase C: ComposerPlaceholder + sugestões contextuais
  → Lacunas ficam visíveis; sugestões do useAutoSizing aparecem nos placeholders

Fase D: Animação do Dimensionamento Inteligente
  → autoSizingStep despachado; blocos materializam em sequência
```

### Guardrails

- [ ] Cada fase deixa o sistema compilando sem erros TypeScript (`tsc --noEmit`)
- [ ] `LeftOutliner` e a árvore de topologia não são tocados em nenhuma fase
- [ ] `systemCompositionSlice` não armazena dados — apenas selectors derivados; zero risco de dessincronização
- [ ] Alteração no `useAutoSizing.ts` é cirúrgica: apenas adiciona 4 linhas de `setAutoSizingStep()`

---

## 7. Avaliação de Riscos

| Risco | Prob. | Sev. | Mitigação |
|-------|:-----:|:----:|-----------|
| `systemCompositionSlice` ficando stale (computed values desatualizados) | Baixa | Alta | Implementar como seletores Zustand com `useShallow` — não como estado local |
| Projetos com múltiplos inversores: representação em blocos fica ambígua | Média | Média | Fase 1 suporta apenas projetos com 1 inversor; multi-inversor é escopo separado explícito |
| Animação do Dimensionamento Inteligente causar re-renders excessivos | Média | Baixa | `autoSizingStep` é uma string enum — subscrição seletiva, sem array |
| Integrador usar só o Compositor e ignorar a validação elétrica granular da árvore | Alta | Baixa | Comportamento desejado — o Compositor é a vista de avaliação, não o editor |

---

## 8. Critérios de Aceitação

### Funcionais

- [ ] Projeto com consumo + módulo + inversor completos exibe 3 blocos conectados, todos com chips verdes
- [ ] Projeto sem inversor exibe placeholder do bloco de inversor com 2 sugestões contextuais
- [ ] Projeto com oversize ratio > 1.35 exibe chip "Ratio DC/AC" em vermelho no bloco do inversor
- [ ] Clicar em qualquer bloco abre o inspector do elemento correspondente no `RightInspector`
- [ ] Botão "Dimensionamento Inteligente" anima a materialização dos 3 blocos em sequência

### Técnicos

- [ ] `tsc --noEmit` → EXIT CODE 0
- [ ] `systemCompositionSlice` não introduz estado novo — apenas seletores derivados dos stores existentes
- [ ] `LeftOutliner` e `useTechStore` sem modificações (verificar via `git diff`)
- [ ] `ComposerCanvasView` não registra nenhuma subscripção direta ao DOM (apenas Zustand selectors)

### Engenharia

- [ ] Chips do bloco de inversor validados contra cálculo manual: DMEGC 610W × 6 un. + PHB 5kW → oversize 1.15, Voc 299V (< 95% de 600V = 570V), Isc 13.2A (< 16A max MPPT)
- [ ] Engenheiro revisor confirma que chips `warn` e `error` refletem corretamente os limites da NBR 16690

---

## 9. O que este escopo desbloqueia

| Módulo / Feature | Desbloqueio |
|-----------------|-------------|
| Onboarding de novos integradores | O Compositor torna o sistema auto-explicativo — integrador sem experiência em topologia elétrica consegue avaliar se o projeto está coerente |
| `spec-unifilar-simbolos` | O Compositor pode ser a antessala do unifilar — clicar em "Gerar Unifilar" a partir da vista de blocos é o fluxo natural |
| Multi-inversor (futuro) | O modelo de blocos suporta naturalmente N blocos de inversor em paralelo — não é o escopo agora, mas a arquitetura não precisa ser reescrita |
| Proposta Comercial | Bloco de inversor com chips verdes = projeto aprovado = botão "Gerar Proposta" desbloqueado diretamente na vista do Compositor |

---

## 10. Fora do escopo

- **Substituição da árvore do LeftOutliner** — o Compositor é alternativo, não substituto. A árvore é o editor granular; o Compositor é a vista de avaliação
- **Projetos com múltiplos inversores** — o Compositor fase 1 suporta apenas 1 bloco de módulo + 1 bloco de inversor. Multi-inversor requer uma spec separada de layout do Compositor
- **Edição inline nos blocos** — clicar em um bloco abre o `RightInspector` existente, não um editor embutido no próprio bloco (isso é fase futura)
- **Bloco de Arranjo Físico** — a representação do telhado/polígono como bloco é válida conceitualmente, mas o `InstallationArea` já tem sua representação rica no canvas Leaflet. Adicioná-lo ao Compositor é escopo separado

---

## Referências

- Dimensionamento Inteligente existente: `hooks/useAutoSizing.ts`, `SolarCalculator.ts`
- Árvore de topologia: `.agent/concluido/Especificacao_P6_4_Topologia_DragDrop/Especificacao_P6_4_Topologia_DragDrop.md`
- Validação elétrica: `utils/electricalMath.ts` → `calculateStringMetrics()`
- Limites elétricos: `constants/thresholds.ts`
- Mapa de interface: `docs/interface/mapa-dimensionamento.md`
- Norma: NBR 16690:2019 §7 (limites de string), faixa de oversize ratio 1.05–1.35

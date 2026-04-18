# Mapa de Interface — Left Outliner (Compositor Lego)

> **Última atualização**: 2026-04-16  
> **Componente raiz**: `LeftOutliner.tsx`  
> **Caminho**: `kurupira/frontend/src/modules/engineering/ui/panels/LeftOutliner.tsx`

---

## Visão Geral

O `LeftOutliner` é o painel esquerdo do workspace de engenharia. Ele implementa um **Compositor Lego** — uma pilha vertical de blocos que representam o fluxo elétrico de um sistema fotovoltaico:

```
Consumo (kWh) → Módulos FV (DC) → Inversor (AC)
```

Cada bloco é independente e se encaixa fisicamente no bloco anterior via conectores Lego (tabs e notches) que utilizam **gap zero** e sobreposição de bordas para criar uma unidade visual contínua.

---

## Topologia de Arquivos

```
panels/
├── LeftOutliner.tsx                        ← Orquestrador + ConsumptionBlock + LockedBlock
│
└── canvas-views/composer/
    ├── LegoConnectors.tsx                  ← LegoTab + LegoNotch (dimensões 80x16px)
    ├── ComposerBlockModule.tsx             ← Bloco Módulos FV + Seletor Inline
    ├── ComposerBlockInverter.tsx           ← Bloco Inversor + Validação Elétrica
    └── ComposerPlaceholder.tsx             ← [DEPRECATED] Substituído por estados inline
```

---

## Layout Visual (Geometria 80x16)

```text
┌─────────────────────────────────┐
│ ╭───────────────────────────╮   │  ← rounded-t-sm, border-amber-600/40
│ │  ⚡ CONSUMO                │   │  ← Header (Zap + MapPin)
│ ├───────────────────────────┤   │
│ │ 600 kWh/mês  │  7.20 kWp  │   │  ← Display (Consumo | kWp Alvo)
│ ├───────────────────────────┤   │
│ │ [Ano 7200] [Trifásico]    │   │  ← Technical Footer (Metadata)
│ ╰──────┬──kWh──┬────────────╯   │  ← LegoTab (80x16px)
│ ┌──────┴───────┴────────────┐   │  ← LegoNotch (encaixe inverso)
│ │  ☀ GERADOR FV    12 un.   │   │  ← Header (Sun + Qty)
│ ├───────────────────────────┤   │
│ │ 6.28 kWp     │  840 kWh   │   │  ← Display (Potência | Geração)
│ ├───────────────────────────┤   │
│ │ 12× DMEGC - 550Wp         │   │  ← Inventory Row
│ ╰──────┬───DC──┬────────────╯   │  ← LegoTab "DC" (80x16px)
│ ┌──────┴───────┴────────────┐   │  ← LegoNotch (encaixe inverso)
│ │  🔲 CONVERSÃO AC   2x MPPT│   │  ← Header (Cpu + Mppt)
│ ├───────────────────────────┤   │
│ │ 5.0 kW       │  98.4 %    │   │  ← Display (Potência | Eficiência)
│ ├───────────────────────────┤   │
│ │ Ratio: 1.25  │ Voc: 480V  │   │  ← Status Chips
│ ╰──────┬───AC──┬────────────╯   │  ← LegoTab (80x16px)
│        └───────┘                │
└─────────────────────────────────┘
```

---

## LegoConnectors (Aba e Encaixe)

Os conectores são o coração visual do sistema, permitindo que os blocos pareçam "conectados" eletricamente.

### LegoTab (Aba na base)
Posicionado na base de um bloco para "prover" energia/dados para o próximo.

| Propriedade | Valor |
|-------------|-------|
| **Dimensões** | 80px largura × 16px altura |
| **Posição** | `absolute -bottom-[16px] left-1/2 -translate-x-1/2 z-30` |
| **SVG Path** | Ombros de 4px + Bump central de 12px |
| **Label** | Centralizada no bump (7px font-extrabold) |

### LegoNotch (Encaixe no topo)
Posicionado no topo de um bloco receptor para criar o recorte onde o Tab se encaixa.

| Propriedade | Valor |
|-------------|-------|
| **Dimensões** | 80px largura × 16px altura |
| **Posição** | `absolute -top-[1px] left-1/2 -translate-x-1/2 z-30` |
| **Visual** | Máscara `fill-slate-950` que recorta o bloco receptor |

---

## Color Coding Semântico Completo

Utilizado em `LegoTab`, `LegoNotch` e bordas dos blocos:

| Token | Domínio | Uso no Compositor |
|-------|---------|-------------------|
| `amber` | **Consumo / Demanda** | Bloco Consumo, Tab "kWh" |
| `sky` | **Geração / Equipamentos** | Bloco Módulos, Tab "DC" |
| `emerald` | **Métricas / Fatores** | Bloco Inversor, Tab "AC", kWp Alvo |
| `red` | **Perdas / Alertas** | Erros de validação elétrica |
| `yellow` | **Irradiância** | Contexto de HSP / Clima |
| `slate` | **Auxiliar / Locked** | Blocos desativados (LockedBlock) |
| `indigo`/`pink`| **Atmosfera/Temp** | Tooltips e charts secundários |

---

## Componentes Internos

### 1. ConsumptionBlock

> **Definido em**: `LeftOutliner.tsx`  
> **Regra Visual**: `rounded-t-sm rounded-b-none`.

| Elemento | Detalhe |
|----------|---------|
| **Header** | Ícone `Zap`, "CONSUMO" (Uppercase), `MapPin` + Localização (8px). |
| **Display** | Layout de instrumento com divisor vertical: **Consumo Médio** (Amber) | **kWp Alvo** (Emerald). |
| **Valores** | Fontes `mono tabular-nums` para alta precisão visual. |
| **Rodapé** | Segmentos de especificação técnica ("Spec Plate") para **Vol. Anual** e **Conexão** (font-mono). |
| **Empty State** | Placeholder animado ("Aguardando Dados de Consumo"). |

### 2. ComposerBlockModule

> **Definido em**: `ComposerBlockModule.tsx`  
> **Regra Visual**: `pt-[16px]` (reserva para notch) + `rounded-none`.

| Elemento | Detalhe |
|----------|---------|
| **Header** | Ícone `Sun`, "GERADOR FV" (Uppercase), Contagem total de unidades instaladas. |
| **Display** | Instrumento dual: **Potência DC** (Sky/Emerald) vs **Geração Est.** (Amber). |
| **Inventário** | Lista de grupos por modelo com qty, fabricante, potência (Wp) e controles ±. |
| **Selector** | `ModuleInlineSelector` para busca por fabricante e modelo com sugestão de dimensionamento. |

### 3. ComposerBlockInverter

> **Definido em**: `ComposerBlockInverter.tsx`  
> **Regra Visual**: `rounded-t-none rounded-b-sm`.

| Elemento | Detalhe |
|----------|---------|
| **StatusChips** | Validação de Tensão, Corrente e FDI (DC/AC Ratio). |
| **Borda Dinâmica** | Reflete o estado crítico (Sky=OK, Amber=Warning, Red=Error). |

---

## Máquina de Estados — Cascata de Ativação

A visibilidade dos blocos segue uma lógica de pré-requisitos:

1.  **Consumo**: Sempre visível. Raiz da pilha.
2.  **Módulos FV**: 
    - Ativo se `averageConsumption > 0`.
    - Senão: `LockedBlock` ("Informe o consumo médio").
3.  **Inversor**:
    - Ativo se `modules.length > 0`.
    - Senão: `LockedBlock` ("Adicione módulos").

---

## Geometria e Encaixe Físico

Para garantir que os blocos pareçam peças físicas (Lego), aplicamos:

1.  **Margem Negativa**: `-mt-px` em blocos receptores para sobrepor bordas.
2.  **Padding Top Estrito**: `pt-[16px]` em blocos com `LegoNotch` para evitar que o conteúdo colida com o conector do bloco superior.
3.  **Z-Index Progressivo**: Blocos superiores têm `z-index` maior que os inferiores (`z-30` -> `z-20` -> `z-10`) para que as sombras (shadow-lg) e os Tabs sobreponham as peças de baixo corretamente.

---

## Animações

### Lego Snap
Disparada quando um bloco transiciona de `Locked` para `Filled`.

| Propriedade | Valor |
|-------------|-------|
| **Classe** | `.animate-lego-snap` |
| **Definição** | `index.css` |
| **Efeito** | Fade-in + Translate -16px para 0 com *overshoot* (spring). |

---

## Stores e Hooks Relevantes

| Recurso | Função no Outliner |
|---------|-------------------|
| `useSolarStore` | Fonte da verdade para `clientData`, `modules` e `inverters`. |
| `useUIStore` | Controla o `focusedBlock` (destaque visual por seleção). |
| `useAutoSizing` | Provê o `requiredKwp` e `requiredModuleQty` (sugestão). |
| `useTechKPIs` | Provê fatores de performance (PR) para cálculo de geração. |
| `usePanelStore` | Gerencia o estado de `restoreMap` ao focar blocos. |
--|-----------------|-------|
| `useSolarStore` | `clientData`, `modules[]`, `inverters[]`, `addModule`, `removeModule` | Todos |
| `useTechStore` | `inverters.entities`, `mpptConfigs`, `assignModulesToNewString`, `removeModules` | Módulos, Inversor |
| `useCatalogStore` | `modules[]` (catálogo), `inverters[]` (catálogo) | Seletores Inline |
| `useAutoSizing` | `requiredModuleQty`, `requiredKwp`, `isCalculable` | Módulos |
| `useElectricalValidation` | `errors[]`, `warnings[]` | Inversor |

---

## Anti-Padrões Eliminados (Legado)

| Padrão Legado | Substituição |
|---------------|-------------|
| Árvore hierárquica Inversor → MPPT → String → Módulo | Pilha Lego sequencial plana |
| `AddInverterPrompt` (componente grande, modal) | `InverterInlineSelector` (inline, compacto) |
| `ArrowDown` (seta genérica entre blocos) | `LegoTab` + `LegoNotch` (conectores contextuais) |
| `ComposerPlaceholder` (placeholder genérico) | Estados inline nos próprios blocos |
| Todos os blocos sempre visíveis | Cascata progressiva com `LockedBlock` |
| `space-y-4` (gap fixo entre blocos) | `gap-0` + `-mt-px` (encaixe físico) |

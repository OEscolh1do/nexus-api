# Spec — Compositor de Blocos: LeftOutliner como Centro da Jornada

**Tipo:** Feature Existente + Refinamento de Arquitetura
**Módulo:** `engineering` — `LeftOutliner`, `solarStore`, `uiStore`
**Prioridade:** P0 — Bloqueante
**Responsável (impl.):** `the-builder`
**Revisor (aceitação):** `engenheiro-eletricista-pv` + `design-lead`
**Data de criação:** 2026-04-14
**Versão:** 3.7 — alinhado ao Escopo Definitivo 2026-04-15
**Origem:** consolidação v3.7 — inclusão de Arranjo Físico (Indigo)
**Supersede:** `03-spec-compositor-blocos-2026-04-15.md` v2.0

---

## Changelog v4.0 (Pós-Construção Real)

| Seção | Mudança |
|-------|---------|
| §1 | Diagnóstico atualizado: Sistema de Grid Resiliente, Summary Bar e 280px de largura. |
| §2.2 | `onClick` mapeado para a pilha real (Consumo, Módulos, Inversor, Proposta). Bloco Site no topo (neutro). |
| §3.2 | **Scientific Palette** consolidada. Fim do `opacity-40` para blocos inativos (agora 100% de opacidade com bordas sutis). |
| §4 | O bloco de Arranjo não faz parte da pilha lateral no modelo construído. Adição dos blocos de Projeção e Proposta. |
| Geral | Alinhamento com o grid Master de **280px** (não mais 240px). |

---

### 1.1 Situação atual (Construída)

O Compositor de Blocos no LeftOutliner está em produção com a seguinte pilha processual (Top to Bottom):
- ✅ Site (Localização/Clima) → Consumo (Carga) → Módulos (Geração) → Inversor (Conversão) → Projeção (Performance) → Proposta (Business).
- ✅ Cascata de ativação via `LockedBlock`.
- ✅ Design "Scientific Palette" e "Engineering Grid" (Grid 2 colunas, tabular-nums).
- ✅ **Summary Bar (Semi-Resumido)** para blocos não-focados, evitando quebra de títulos ou sobreposição.

| Indicador | Estado |
|-----------|-------------|
| Clicar no bloco abre a view correspondente | ✅ `setFocusedBlock()` no onClick integrado |
| Bloco focado tem glow visual | ✅ Borda intensa (`border-500/50`) e anel (`ring-1`) |
| Blocos não focados recuam | ✅ Recuam apenas na intensidade da borda (`border-500/10`), mantendo opacidade 100% para não parecerem "apagados". |
| Conector mostra fluxo | ✅ `FlowConnector` integrado conectando a pilha. |

### 1.2 O que NÃO muda

O Compositor **fica no LeftOutliner**. O CenterCanvas é para as views de trabalho (mapa, elétrica, simulação, consumo). O LeftOutliner (fixo em **280px** para acomodar o Engineering Grid) é para a pilha de composição — é o lugar correto pela metáfora Lego/Scratch/Tinkercad.

---

## 2. A Proposta Refinada (v3.7)

### 2.1 Conceito central (mantido)

Blocos que declaram contratos de entrada/saída. Conectores que mostram o dado transitado. Placeholders que comunicam o que falta. O integrador vê o raciocínio do sistema, não apenas o resultado.

### 2.2 O que muda: blocos como pontos de foco

Cada bloco ganha um `onClick` que chama `setFocusedBlock(id)` no `uiStore`. Esse campo é a única fonte de verdade para:
1. Qual bloco tem glow (estado visual no LeftOutliner)
2. Qual view está ativa no CenterCanvas (via `spec-sincronia-bloco-canvas`)

```
Bloco Consumo.onClick    → setFocusedBlock('consumption')
Bloco Módulos.onClick    → setFocusedBlock('module')
Bloco Inversor.onClick   → setFocusedBlock('inverter')
Bloco Proposta.onClick   → setFocusedBlock('proposal')
```

O `systemCompositionSlice` continua existindo como camada de view derivada — ele lê dos stores existentes e expõe o estado dos blocos (chips, status, sugestões).

### 2.3 O Dimensionamento Inteligente no novo modelo (v3.7)

O botão "Dimensionamento Inteligente" no TopRibbon:
1. Só fica ativo quando `clientData.averageConsumption > 0`
2. Ao clicar → anima a materialização dos blocos em sequência (lego-snap)
3. Após animação → chama `setFocusedBlock('module')` automaticamente (leva o integrador para o início do posicionamento)

---

### 3.1 Estrutura (Implementada)

```
┌─ [ícone] [título]             ─┐  ← header técnico
│  [Summary Bar Opcional]        │  ← barra semi-resumida (ativa se desfocado)
│  [Engineering Grid (2 cols)]   │  ← body 100% de largura, divide-x
└────────────────────────────────┘
```

### 3.2 Estados visuais (Atualizados - "No Opacity Drop")

Para não parecer "apagado", a opacidade 40% foi descartada.

| Estado | Classe CSS | Condição |
|--------|-----------|---------|
| **Focado** | `bg-[cor]-950/80 border-[cor]-500 ring-1` | `activeFocusedBlock === blocoId` |
| **Desfocado** | `bg-[cor]-950/70 border-[cor]-600/10 opacity-100` | `activeFocusedBlock !== null && !== blocoId` |
| **Locked** | `opacity-80 border-dashed bg-slate-900/20` | predecessor incompleto |

**Scientific Palette** (Cor de cada bloco):
- Site: `Indigo-400`
- Consumo: `Sky-400`
- Módulos: `Amber-400`
- Inversor: `Emerald-400`
- Projeção: `Teal-400`
- Proposta: `Violet-400`

---

## 4. systemCompositionSlice (v3.7)

```typescript
// src/core/state/slices/systemCompositionSlice.ts

interface SystemCompositionState {
  consumptionBlock: BlockStatus;
  moduleBlock: BlockStatus;
  arrangementBlock: BlockStatus;
  inverterBlock: BlockStatus;
  connectorC1: { label: string; value: string; active: boolean }; // Consumo -> Módulo
  connectorC2: { label: string; value: string; active: boolean }; // Módulo -> Arranjo
  connectorC3: { label: string; value: string; active: boolean }; // Arranjo -> Inversor
  
  autoSizingInProgress: boolean;
  autoSizingStep: 'idle' | 'consumption' | 'module' | 'arrangement' | 'inverter' | 'done';
}
```

---

| Arquivo | Mudança Construída |
|---------|---------|
| `ui/panels/LeftOutliner.tsx` | Fixo em **280px**; Pilha estrita de 6 blocos; Remoção de Flat Tree. |
| `canvas-views/composer/ComposerBlock*.tsx` | Componentes individuais de cada bloco utilizando o `Engineering Grid`. |

---

## Referências

- **Mestre:** `escopo-definitivo-kurupira-v3.7-2026-04-15.md`
- Sincronia: `01-spec-sincronia-bloco-canvas-2026-04-15.md`
- Bloco Arranjo: `09-spec-bloco-arranjo-fisico-2026-04-15.md`

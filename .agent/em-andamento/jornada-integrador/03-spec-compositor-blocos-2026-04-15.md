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

## Changelog v3.7

| Seção | Mudança |
|-------|---------|
| §1 | Diagnóstico v3.7: Inclusão do Bloco de Arranjo como crítico para coerência |
| §2.2 | `onClick` mapeado para 4 blocos principais |
| §3.2 | Cores de glow atualizadas (Indigo para Arranjo) |
| §4 | `SystemCompositionState` expandido com `arrangementBlock` |
| §5 | Lista de arquivos afetados sincronizada |
| Geral | Alinhamento com o grid Master de 240px |

---

## 1. Diagnóstico (v3.7)

### 1.1 Situação atual

O MVP v3.6 entregou o Compositor de Blocos no LeftOutliner com:
- ✅ Pilha Consumo → Módulos → Arranjo (novo) → Inversor
- ✅ Cascata de ativação: `LockedBlock` → bloco ativo quando predecessor tem dados
- ✅ Chips de validação no Bloco Inversor (FDI, Voc, Isc)
- ✅ `ComposerBlockModule.tsx`, `ComposerBlockArrangement.tsx` e `ComposerBlockInverter.tsx` operacionais

O que ainda falta para o Compositor ser o **guia ativo da jornada**:

| Indicador | Estado atual | Estado desejado |
|-----------|-------------|-----------------|
| Clicar no bloco abre a view correspondente | ❌ Blocos sem onClick funcional | ✅ `setFocusedBlock()` no onClick |
| Bloco focado tem glow visual | ❌ Sem estado de foco | ✅ `ring-2` + glow por cor de bloco |
| Blocos não focados recuam | ❌ Todos sempre opacity-100 | ✅ `opacity-40` quando outro está em foco |
| Conector mostra dado transitado | ⚠️ Parcial — LegoTab tem label | ✅ Conector mostra kWp alvo calculado |

### 1.2 O que NÃO muda

O Compositor **fica no LeftOutliner**. O CenterCanvas é para as views de trabalho (mapa, elétrica, simulação, consumo). O LeftOutliner (fixo em 240px) é para a pilha de composição — é o lugar correto pela metáfora Lego/Scratch/Tinkercad.

---

## 2. A Proposta Refinada (v3.7)

### 2.1 Conceito central (mantido)

Blocos que declaram contratos de entrada/saída. Conectores que mostram o dado transitado. Placeholders que comunicam o que falta. O integrador vê o raciocínio do sistema, não apenas o resultado.

### 2.2 O que muda: blocos como pontos de foco

Cada bloco ganha um `onClick` que chama `setFocusedBlock(id)` no `uiStore`. Esse campo é a única fonte de verdade para:
1. Qual bloco tem glow (estado visual no LeftOutliner)
2. Qual view está ativa no CenterCanvas (via `spec-sincronia-bloco-canvas`)

```
Bloco Consumo.onClick   → setFocusedBlock('consumption')
Bloco Módulos.onClick   → setFocusedBlock('module')
Bloco Arranjo.onClick   → setFocusedBlock('arrangement')
Bloco Inversor.onClick  → setFocusedBlock('inverter')
```

O `systemCompositionSlice` continua existindo como camada de view derivada — ele lê dos stores existentes e expõe o estado dos blocos (chips, status, sugestões).

### 2.3 O Dimensionamento Inteligente no novo modelo (v3.7)

O botão "Dimensionamento Inteligente" no TopRibbon:
1. Só fica ativo quando `clientData.averageConsumption > 0`
2. Ao clicar → anima a materialização dos blocos em sequência (lego-snap)
3. Após animação → chama `setFocusedBlock('module')` automaticamente (leva o integrador para o início do posicionamento)

---

## 3. Anatomia dos Blocos (v3.7)

### 3.1 Estrutura (mantida)

```
┌─ [ícone] [título]         [resumo] ─┐  ← header
│  [chip] [chip] [chip]                │  ← body: chips de status
└──────────────────────────────────────┘
```

### 3.2 Estados visuais

| Estado | Classe CSS | Condição |
|--------|-----------|---------|
| **Focado** | `ring-2 opacity-100 shadow-[glow]` | `activeFocusedBlock === blocoId` |
| **Desfocado** | `opacity-40 grayscale-[0.15]` | `activeFocusedBlock !== null && !== blocoId` |
| **Neutro** | `opacity-100` | `activeFocusedBlock === null` |
| **Locked** | `opacity-25 pointer-events-none` | predecessor incompleto |

Cores de glow (spec-foco-tatil):
- Consumo: `rgba(245, 158, 11, 0.4)` — Amber
- Módulos: `rgba(14, 165, 233, 0.4)` — Sky
- Arranjo: `rgba(99, 102, 241, 0.4)` — Indigo
- Inversor: `rgba(16, 185, 129, 0.4)` — Emerald

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

## 5. Arquivos Afetados (v3.7)

| Arquivo | Mudança |
|---------|---------|
| `ui/panels/LeftOutliner.tsx` | Fixo em 240px; Inclusão do Bloco Arranjo; onClick expandido |
| `canvas-views/composer/ComposerBlockArrangement.tsx` | NOVO — componente do bloco indigo |
| `hooks/useAutoSizing.ts` | Incluir step `arrangement` na animação |

---

## 6. Plano de Migração (v3.7)

Fase A: `systemCompositionSlice` (seletores de Arranjo)
Fase B: `onClick` nos 4 blocos principais
Fase C: Estados visuais (Glow Indigo para Arranjo)
Fase D: Animação do Dimensionamento Inteligente completa

---

## 7. Critérios de Aceitação (v3.7)

- [ ] Clicar no Bloco Arranjo → canvas desliza para modo desenho no MapCore
- [ ] Bloco Arranjo com glow Indigo (`rgba(99,102,241,0.4)`)
- [ ] LeftOutliner mantém 240px de largura fixa em resoluções desktop
- [ ] Conector Arranjo → Inversor mostra "em sinc" quando `physicalCount === logicalCount`

---

## Referências

- **Mestre:** `escopo-definitivo-kurupira-v3.7-2026-04-15.md`
- Sincronia: `01-spec-sincronia-bloco-canvas-2026-04-15.md`
- Bloco Arranjo: `09-spec-bloco-arranjo-fisico-2026-04-15.md`

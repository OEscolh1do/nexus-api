# Spec — Bloco Projeção (LeftOutliner)

**Arquivo alvo:** `ui/panels/LeftOutliner.tsx` + novo `canvas-views/composer/ComposerBlockProjection.tsx`
**Tipo:** Feature Nova (Novo Bloco no LeftOutliner)
**Módulo:** `engineering` — LeftOutliner
**Prioridade:** P0
**Responsável:** `the-builder`
**Revisor:** `design-lead` / `engenheiro-eletricista-pv`
**Data de Atualização:** 2026-04-21
**Cor de acento:** Amber — `text-amber-400` / `border-amber-500/30`
> ⚠️ **Nota:** context.md é o guia mestre. Amber = Geração/Módulos conforme Matriz Semântica v3.8.1.
**Gate de entrada:** `activeFocusedBlock === 'projection'`

---

## 1. Contexto

A pilha de blocos no `LeftOutliner` atualmente termina no **Inversor**. O bloco
**Projeção** é o último passo lógico da jornada do integrador — ele aparece ao
final da pilha e dá acesso à `ProjectionCanvasView`.

### Posição na pilha (ordem definitiva)

```text
[ Projeto     ]  → activeFocusedBlock: 'site'
[ Consumo     ]  → activeFocusedBlock: 'consumption'
[ Módulos FV  ]  → activeFocusedBlock: 'module'
[ Arranjo     ]  → activeFocusedBlock: 'arrangement'
[ Inversor    ]  → activeFocusedBlock: 'inverter'
──────────────────────────────────────────
[ Projeção    ]  → activeFocusedBlock: 'projection'   ← NOVO
```

---

## 2. Gate de Progressão (Chain of Verification)

O bloco Projeção só se materializa quando os três pilares de engenharia estão completos.
Caso contrário, renderiza como `LockedBlock` — padrão já existente no `LeftOutliner`.

```typescript
// Condição de desbloqueio
const isProjectionUnlocked =
  isConsumptionValid &&   // consumptionBlock.status === 'complete'
  isModulesValid &&       // totalModules > 0
  isArrangementValid;     // arrangementBlock.status !== 'empty'
```

**Estado travado (`LockedBlock`):**
```tsx
<LockedBlock
  label="Projeção"
  icon={<TrendingUp size={11} />}
  color="amber"
  hint="Complete Consumo, Módulos e Arranjo para liberar a projeção"
/>
```

---

## 3. Anatomia do Bloco (Estado Desbloqueado)

O bloco segue estritamente o padrão dos blocos existentes:
`border-x border-b`, zona de header + zona de display de instrumento.

```text
┌──────────────────────────────────────────┐
│ [📈] Projeção          text-amber-400    │  ← Header
│      Est. 8.432 kWh/ano                  │
├──────────────────────────────────────────┤
│  Geração Est.   │  Cobertura             │  ← Display de Instrumento
│  8.432 kWh      │  103%                  │
│  amber-300 mono │  sky-400 mono          │
├──────────────────────────────────────────┤
│  PR: 76.4%  ·  Payback: 4.2 anos         │  ← Rodapé de Premissas
└──────────────────────────────────────────┘
```

---

## 4. Especificação por Zona

### 4.1 Header

```tsx
<div className="px-4 py-2.5 flex items-center gap-3 border-b border-amber-500/10 bg-gradient-to-r from-amber-900/15 to-transparent">
  <div className="w-5 h-5 rounded-sm flex items-center justify-center bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner">
    <TrendingUp size={11} />
  </div>
  <div className="flex flex-col">
    <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider leading-none">
      Projeção
    </span>
    {annualGeneration > 0 && (
      <span className="text-[7px] text-amber-600 font-bold uppercase tracking-tight mt-0.5 opacity-70">
        Est. {annualGeneration.toLocaleString('pt-BR')} kWh/ano
      </span>
    )}
  </div>
</div>
```

### 4.2 Display de Instrumento (zona central)

Duas métricas lado a lado separadas pelo divisor vertical padrão (`w-px h-8 bg-gradient-to-b from-transparent via-teal-900/40 to-transparent`):

| Métrica | Valor | Cor | Fonte |
|---------|-------|-----|-------|
| **Geração Est.** | `sum(monthlyGenerationKwh)` | `text-teal-300` | `solarStore` via `projectionMath.ts` |
| **Cobertura** | `geração / consumo × 100` | `text-sky-400` | derivado de `clientData.averageConsumption` |

```tsx
<div className="px-4 py-3 flex items-center justify-between bg-black/20 backdrop-blur-md">
  {/* Geração Estimada */}
  <div className="flex flex-col">
    <span className="text-[7px] text-amber-500/80 font-bold uppercase tracking-[0.15em] mb-1">
      Geração Est.
    </span>
    <div className="flex items-baseline gap-1">
      <span className="text-lg font-black text-amber-300 font-mono tabular-nums tracking-tighter leading-none">
        {Math.round(annualGeneration).toLocaleString('pt-BR')}
      </span>
      <span className="text-[9px] font-bold text-amber-600/80 uppercase">kWh</span>
    </div>
  </div>

  {/* Divisor */}
  <div className="w-px h-8 bg-gradient-to-b from-transparent via-amber-900/40 to-transparent" />

  {/* Cobertura */}
  <div className="flex flex-col items-end">
    <span className="text-[7px] text-sky-500/80 font-bold uppercase tracking-[0.15em] mb-1">
      Cobertura
    </span>
    <div className="flex items-baseline gap-1">
      <span className="text-lg font-black text-sky-400 font-mono tabular-nums tracking-tighter leading-none">
        {coverage.toFixed(0)}
      </span>
      <span className="text-[9px] font-bold text-sky-600/80 uppercase">%</span>
    </div>
  </div>
</div>
```

### 4.3 Rodapé de Premissas (faixa compacta)

Linha única com PR e Payback em `text-[8px]` separados por `·`:

```tsx
<div className="px-4 py-2 flex items-center gap-2 border-t border-amber-900/20 bg-slate-950/40">
  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest tabular-nums">
    PR: {(prFinal * 100).toFixed(1)}%
  </span>
  <span className="text-[8px] text-slate-700">·</span>
  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest tabular-nums">
    Payback: {paybackYears !== null ? `${paybackYears.toFixed(1)} anos` : '—'}
  </span>
</div>
```

---

## 5. Estados Visuais (padrão idêntico aos outros blocos)

```typescript
const isFocused = focusedBlock === 'projection';
const isDeemphasized = focusedBlock !== null && focusedBlock !== 'projection';
```

```tsx
className={cn(
  "relative rounded-none border-x border-b flex flex-col transition-all duration-300 cursor-pointer overflow-visible -mt-px",
  isFocused
    ? "border-amber-500 bg-amber-950/80 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/50"
    : isDeemphasized
      ? "border-amber-900/30 bg-amber-950/40 opacity-40 select-none"
      : "border-amber-600/40 bg-amber-950/70 hover:border-amber-500/50 shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)] backdrop-blur-sm"
)}
```

**Cor de glow:** `rgba(245, 158, 11, 0.25)` — Amber-500 com 25% de opacidade.

---

## 6. Comportamento de Click

```typescript
onClick={() => setFocusedBlock('projection')}
```

Sem `restoreMap()` — a `ProjectionCanvasView` não usa o mapa como base.

**Importante:** conforme a spec `01-spec-sincronia-bloco-canvas`, o Bloco de Projeção
**não tem `onClick` próprio** segundo o design original (era passivo). Esta spec **reverte
essa decisão**: o bloco Projeção é **ativo e clicável**, pois o engenheiro precisa
de um ponto de entrada explícito na pilha. A aba "Projeção" no `WorkspaceTabs` faz o mesmo.

---

## 7. Dados Consumidos (Chain of Verification — CoVe)

Todos os dados DEVEM vir de fontes já existentes no store. Nenhum cálculo novo
deve ser armazenado além do que já existe em `simulationResult` / `projectionResult`.

| Métrica | Fonte | Hook/Seletor |
|---------|-------|-------------|
| `annualGeneration` | `solarStore.designVariant.designData.simulationResult` | `sum(monthlyGenerationKwh)` |
| `coverage` | derivado de `annualGeneration` / `clientData.averageConsumption × 12` | calculado localmente no componente |
| `prFinal` | `usePRAdjustments()` (já existe em `SimulationCanvasView`) | importar hook |
| `paybackYears` | `pricingData.totalPriceR$ / economiaAno` | nulo se `pricingData` ausente |

**Guardrail Dike:** Se `simulationResult === null`, o Display de Instrumento exibe
`—` em todos os campos. O bloco permanece visível (não retrocede para LockedBlock)
pois o gate de desbloqueio já foi superado.

---

## 8. uiStore — Atualização de Tipo Obrigatória

```typescript
// src/core/state/uiStore.ts
// ANTES:
type FocusedBlock = 'consumption' | 'module' | 'arrangement' | 'inverter' | 'simulation' | 'map' | 'site' | 'proposal' | null;

// DEPOIS:
type FocusedBlock = 'consumption' | 'module' | 'arrangement' | 'inverter' | 'projection' | 'map' | 'site' | 'proposal' | null;
```

E no `CenterCanvas.tsx`, o `VIEW_MAP`:
```typescript
// ANTES:
simulation: 'simulation',

// DEPOIS:
projection: 'projection',
```

---

## 9. Integração no LeftOutliner

No componente `LeftOutliner`, após o bloco de Inversor:

```tsx
{/* 6. Projeção — Último bloco da jornada */}
<div className="h-1" />

{isProjectionUnlocked ? (
  <ComposerBlockProjection />
) : (
  <LockedBlock
    label="Projeção"
    icon={<TrendingUp size={11} />}
    color="amber"
    hint="Complete Consumo, Módulos e Arranjo para liberar"
  />
)}
```

---

## 10. Arquivos Afetados

### Criar
| Arquivo | Propósito |
|---------|-----------|
| `canvas-views/composer/ComposerBlockProjection.tsx` | O bloco Projeção (este spec) |

### Modificar
| Arquivo | Mudança |
|---------|---------|
| `ui/panels/LeftOutliner.tsx` | Adicionar `ComposerBlockProjection` + `isProjectionUnlocked` gate |
| `core/state/uiStore.ts` | `'simulation'` → `'projection'` no tipo `FocusedBlock` |
| `ui/panels/CenterCanvas.tsx` | `VIEW_MAP`: `simulation` → `projection` |
| `ui/panels/WorkspaceTabs.tsx` | Aba `'simulation'` → `'projection'` com label "Projeção" e ícone `TrendingUp` |

---

## 11. Critérios de Aceitação

- [ ] Bloco aparece ao final da pilha, após Inversor, com acento Teal
- [ ] Bloco exibe `LockedBlock` se qualquer dos três gates não for satisfeito
- [ ] Clicar no bloco → `activeFocusedBlock === 'projection'` → `ProjectionCanvasView` ativa
- [ ] Métricas (Geração, Cobertura, PR, Payback) exibem `—` se `projectionResult === null`
- [ ] Payback exibe `—` se `pricingData` ausente (não quebra o componente)
- [ ] Glow Amber `rgba(245,158,11,0.25)` ao focar; `opacity-40` ao desfocussar
- [ ] `type FocusedBlock` em `uiStore.ts` não contém mais `'simulation'` — grep confirma
- [ ] `tsc --noEmit` → EXIT CODE 0

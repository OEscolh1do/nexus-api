# Spec — Operação Foco Tátil (Lego v3.7)

**Tipo:** Feature Nova (extensão do Compositor)
**Módulo:** `engineering` — `LeftOutliner`, `uiStore`
**Prioridade:** P1 — Crítico
**Responsável (impl.):** `the-builder`
**Revisor (aceitação):** `design-lead`
**Data de criação:** 2026-04-14
**Versão:** 2.0 — revisado 2026-04-15
**Supersede:** `spec-foco-tatil.md` v1.0
**Dependência direta:** `spec-sincronia-bloco-canvas-2026-04-15.md` — `activeFocusedBlock` implementado

---

## Changelog v2.0

| Seção | Mudança |
|-------|---------|
| §3.1 | `uiStore` já tem `activeFocusedBlock` via spec-sincronia — não precisa de campo separado |
| §3.2 | Mapeamento de foco atualizado: usa `activeFocusedBlock` em vez de `selectedEntity.type` |
| Geral | Referências ao `PropertiesGroup` e `RightInspector` removidas (eliminados) |

---

## 1. Objetivo (mantido)

Transformar os blocos do Compositor Lego (LeftOutliner) em elementos interativos
"táteis" que controlam o foco visual e o canvas ativo, reforçando a metáfora de
manipulação física de componentes.

---

## 2. Requisitos de Interface

### 2.1 Estados Visuais

| Estado | Estilo CSS | Feedback Visual |
|--------|-----------|-----------------|
| **Focado** | `ring-2 shadow-[glow] opacity-100` | Brilho intenso na cor do bloco |
| **Desfocado** | `opacity-40 grayscale-[0.15]` | Bloco "recua" para dar destaque ao foco |
| **Click (Haptic)** | `active:scale-[0.98]` | Simula compressão física ao clicar |
| **Transição** | `transition-all duration-300` | Suaviza todas as mudanças de estado |

### 2.2 Cores de Glow por Bloco

| Bloco | Cor | Token CSS |
|-------|-----|-----------|
| Consumo | Amber | `rgba(245, 158, 11, 0.4)` |
| Módulos FV | Sky | `rgba(14, 165, 233, 0.4)` |
| Inversor | Emerald | `rgba(16, 185, 129, 0.4)` |

Implementação via `box-shadow` (não `outline` — box-shadow não afeta layout):
```css
.bloco-focado {
  box-shadow: 0 0 0 2px <cor-borda>, 0 0 12px <cor-glow>;
}
```

---

## 3. Arquitetura Técnica (v2.0)

### 3.1 Fonte de verdade

O campo `activeFocusedBlock` no `uiStore` (implementado pela
`spec-sincronia-bloco-canvas-2026-04-15.md`) é o driver único para o estado visual
dos blocos. Esta spec não adiciona campos novos ao store.

```typescript
// Já existe via spec-sincronia:
const focusedBlock = useFocusedBlock(); // hook de conveniência do uiStore
```

### 3.2 Derivação do estado visual por bloco

```typescript
// Padrão aplicado a ConsumptionBlock, ComposerBlockModule, ComposerBlockInverter

const focusedBlock = useFocusedBlock();
const blocoId: FocusedBlock = 'consumption'; // ou 'module' ou 'inverter'

const isFocused       = focusedBlock === blocoId;
const isDeemphasized  = focusedBlock !== null && focusedBlock !== blocoId;

const className = cn(
  'transition-all duration-300 cursor-pointer active:scale-[0.98]',
  isFocused      && 'ring-2 opacity-100',
  isFocused      && blocoId === 'consumption' && 'shadow-[0_0_12px_rgba(245,158,11,0.4)] ring-amber-500/50',
  isFocused      && blocoId === 'module'      && 'shadow-[0_0_12px_rgba(14,165,233,0.4)]  ring-sky-500/50',
  isFocused      && blocoId === 'inverter'    && 'shadow-[0_0_12px_rgba(16,185,129,0.4)]  ring-emerald-500/50',
  isDeemphasized && 'opacity-40 grayscale-[0.15]',
  !isFocused && !isDeemphasized && 'opacity-100',
);
```

### 3.3 Limpar foco ao clicar no canvas vazio

Clicar no canvas vazio (fora de qualquer elemento interativo) deve limpar o foco:
```typescript
// No MapCore ou em qualquer Canvas View, no handler de click no background:
const { setFocusedBlock } = useUIStore();
// onClick no container do canvas:
setFocusedBlock(null); // todos os blocos voltam para opacity-100
```

---

## 4. Plano de Execução

```
Etapa 1: Aplicar className derivado nos 3 blocos
  → Dependência: spec-sincronia Etapa 4 concluída
  → Blocos respondem visualmente ao activeFocusedBlock

Etapa 2: active:scale no click (haptic)
  → Adicionar ao className — 1 linha por bloco

Etapa 3: clearFocus no canvas background
  → onClick no container de cada Canvas View
```

---

## 5. Critérios de Aceitação (v2.0)

- [ ] Apenas um bloco pode ter glow ativo por vez
- [ ] Clicar no espaço vazio do canvas → todos os blocos voltam para opacity-100 sem glow
- [ ] Transição entre estados é suave (`duration-300`)
- [ ] Bloco focado tem escala `0.98` ao ser clicado (haptic feedback visual)
- [ ] `tsc --noEmit` → EXIT CODE 0

---

## Referências

- `spec-sincronia-bloco-canvas-2026-04-15.md` — `activeFocusedBlock` e `useFocusedBlock()`
- `spec-compositor-blocos-2026-04-15.md` — estrutura dos blocos
- `docs/interface/mapa-left-outliner.md` — animações existentes (`lego-snap`)

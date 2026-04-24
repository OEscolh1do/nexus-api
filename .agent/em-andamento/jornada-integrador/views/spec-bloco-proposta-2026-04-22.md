# Spec — Bloco Proposta no Compositor (LeftOutliner)

**Arquivo alvo:** `canvas-views/composer/ComposerBlockProposal.tsx`
**Tipo:** Feature Nova
**Módulo:** `engineering` — `LeftOutliner`, `systemCompositionSlice`
**Prioridade:** P1
**Responsável:** `the-builder`
**Revisor:** `engenheiro-eletricista-pv` + `design-lead`
**Data:** 2026-04-22
**Dependência direta:** `spec-compositor-blocos-2026-04-15.md`, `spec-view-proposal-2026-04-22.md`, `spec-guardiao-aprovacao-2026-04-15.md`

---

## 1. Propósito

O Bloco Proposta é o **bloco de saída** do Compositor. Ele materializa na pilha do LeftOutliner o resultado final da jornada do integrador — não é um bloco de edição de dados, mas um bloco de estado comercial.

Enquanto todos os outros blocos (Consumo, Módulos, Inversor, Simulação) controlam parâmetros de entrada do dimensionamento, o Bloco Proposta reflete a conversão do dimensionamento técnico em proposta comercial: preço, código do projeto, status de aprovação e se o PDF já foi gerado.

Clicar no Bloco Proposta abre a `ProposalCanvasView` no CenterCanvas. Isso é consistente com o padrão de todos os outros blocos do Compositor — o bloco é o atalho, a view é o espaço de trabalho.

---

## 2. Posição na Pilha do Compositor

O Bloco Proposta é o último bloco da pilha, abaixo do Bloco Simulação:

```
ConsumptionBlock
  └── LegoTab "kWh" (âmbar)
ComposerBlockModule
  └── LegoTab "DC" (sky)
ComposerBlockArrangement
  └── LegoTab "físico" (indigo)
ComposerBlockInverter
  └── LegoTab "AC" (emerald)
ComposerBlockSimulation        ← bloco de resultado técnico
  └── LegoTab "aprovado" (teal)
ComposerBlockProposal          ← NOVO — bloco de saída comercial
```

O conector acima do bloco tem label "aprovado" e cor teal, indicando que o Bloco Proposta só fica ativo quando o sistema foi aprovado.

---

## 3. Estados do Bloco

O Bloco Proposta tem quatro estados visuais distintos:

### 3.1 Estado: Bloqueado (`locked`)

**Condição:** `variantStatus !== 'APPROVED'`

O bloco aparece como `LockedBlock` padrão do Compositor, com ícone de cadeado e hint: *"Aprove o sistema para gerar a proposta."*

Visual: fundo `bg-slate-900/50`, borda `border-slate-800`, texto `text-slate-600`. Opacidade reduzida se outro bloco está em foco (`isDeemphasized`).

Clicar no bloco bloqueado: sem ação (cursor `not-allowed`).

### 3.2 Estado: Disponível sem preço (`available`)

**Condição:** `variantStatus === 'APPROVED'` E `pricing.totalPrice === 0 || pricing.totalPrice === null`

O sistema foi aprovado mas o integrador ainda não preencheu o preço na proposta. O bloco está ativo mas incompleto.

```
┌──────────────────────────────┐
│  📄 Proposta                 │
│  FV2026004                   │
├──────────────────────────────┤
│  Preço não definido          │
│  PDF não gerado              │
├──────────────────────────────┤
│  Definir preço →             │
└──────────────────────────────┘
```

Visual: fundo `bg-slate-900`, borda `border-indigo-500/20`, badge de status amarelo "SEM PREÇO". O CTA "Definir preço →" executa `setFocusedBlock('proposal')` levando para a aba Investimento da `ProposalCanvasView`.

### 3.3 Estado: Pronto (`ready`)

**Condição:** `variantStatus === 'APPROVED'` E `pricing.totalPrice > 0` E `pdfUrl === null`

O preço está definido mas o PDF ainda não foi exportado.

```
┌──────────────────────────────┐
│  📄 Proposta          ● PRONTO│
│  FV2026004                   │
├──────────────────────────────┤
│  R$ 22.550,30                │
│  PDF não gerado              │
├──────────────────────────────┤
│  Gerar PDF →                 │
└──────────────────────────────┘
```

Visual: borda `border-indigo-500/40`, badge verde claro "PRONTO". O preço total é exibido formatado em BRL. O CTA "Gerar PDF →" executa `setFocusedBlock('proposal')` navegando para a view onde o botão de exportação está visível.

### 3.4 Estado: Exportado (`exported`)

**Condição:** `variantStatus === 'APPROVED'` E `pricing.totalPrice > 0` E `pdfUrl !== null`

Estado de conclusão. O PDF foi gerado e está disponível.

```
┌──────────────────────────────┐
│  📄 Proposta       ✅ GERADO  │
│  FV2026004                   │
├──────────────────────────────┤
│  R$ 22.550,30                │
│  PDF disponível              │
├──────────────────────────────┤
│  [↗ Abrir PDF]  [Editar →]   │
└──────────────────────────────┘
```

Visual: borda `border-emerald-500/40`, badge emerald "GERADO". Dois CTAs:
- **Abrir PDF:** abre `pdfUrl` em nova aba via `window.open`
- **Editar →:** executa `setFocusedBlock('proposal')` para reabrir a view e regenerar

---

## 4. Comportamento de Foco

O Bloco Proposta participa do sistema de `activeFocusedBlock` como todos os outros blocos:

- `onClick` no bloco (nos estados `available`, `ready` ou `exported`) → `setFocusedBlock('proposal')`
- Quando `activeFocusedBlock === 'proposal'`: bloco tem `ring-2 ring-indigo-500` + glow indigo suave
- Quando outro bloco está focado: bloco recua para `opacity-40`
- Quando nenhum bloco está focado: `opacity-100` sem glow

O mapeamento no `CenterCanvas.tsx` já existente:

```typescript
const VIEW_MAP = {
  // ... outros blocos
  proposal: 'proposal',
};
```

---

## 5. Dados Lidos pelo Bloco

O `ComposerBlockProposal` lê apenas dados derivados — não armazena nada próprio:

| Dado | Fonte |
|---|---|
| `variantStatus` | `variantSlice.variantStatus` |
| `pricing.totalPrice` | `designData.pricing.totalPrice` |
| `pdfUrl` | `DesignVariant.pdfUrl` (via `variantSlice`) |
| `projectCode` | `TechnicalDesign.projectCode` |

O estado derivado do bloco (`locked` / `available` / `ready` / `exported`) é calculado em `systemCompositionSlice` como seletor puro, sem estado armazenado.

---

## 6. Adição ao `systemCompositionSlice`

O slice recebe um novo seletor derivado `proposalBlock`:

```typescript
interface ProposalBlockStatus {
  state: 'locked' | 'available' | 'ready' | 'exported';
  projectCode: string | null;
  totalPrice: number | null;
  pdfUrl: string | null;
}
```

A derivação é puramente calculada a partir das stores existentes — zero estado armazenado, consistente com o princípio do `systemCompositionSlice`.

---

## 7. Adição à Pilha do `LeftOutliner`

O `LeftOutliner.tsx` recebe o novo bloco na base da pilha, com sua condição de ativação:

A condição de ativação é: `variantStatus === 'APPROVED'`.

Quando inativo: renderiza `LockedBlock` com hint "Aprove o sistema para liberar a proposta."
Quando ativo: renderiza `ComposerBlockProposal` com o estado calculado.

O conector acima do bloco (`LegoNotch` com label "aprovado", cor teal) é renderizado apenas quando `variantStatus === 'APPROVED'` — quando bloqueado, o conector não aparece.

---

## 8. Relação com o WorkspaceTabs

A aba "Proposta" no `WorkspaceTabs` continua existindo com o comportamento especificado em `spec-canvas-views-design-2026-04-15.md` §8. O Bloco Proposta no LeftOutliner e a aba no WorkspaceTabs são dois pontos de entrada para a mesma view — ambos executam `setFocusedBlock('proposal')`.

A diferença: a aba sempre está visível (com cadeado quando não aprovada). O bloco no Compositor só aparece na pilha quando `variantStatus === 'APPROVED'` — antes disso, aparece como `LockedBlock`.

---

## 9. Arquivos

| Arquivo | Status |
|---|---|
| `canvas-views/composer/ComposerBlockProposal.tsx` | **[NOVO]** — bloco de proposta para o LeftOutliner |
| `core/state/slices/systemCompositionSlice.ts` | **[MODIFICAR]** — adicionar seletor `proposalBlock` |
| `panels/LeftOutliner.tsx` | **[MODIFICAR]** — adicionar `ComposerBlockProposal` ao final da pilha |

---

## 10. Critérios de Aceitação

- [ ] `variantStatus !== 'APPROVED'` → bloco aparece como `LockedBlock` na pilha; hint visível
- [ ] `variantStatus === 'APPROVED'` E sem preço → estado `available`; badge "SEM PREÇO" amarelo
- [ ] `variantStatus === 'APPROVED'` E com preço, sem PDF → estado `ready`; preço formatado BRL visível; badge "PRONTO"
- [ ] `variantStatus === 'APPROVED'` E com preço E com PDF → estado `exported`; badge "GERADO" emerald
- [ ] Clicar no bloco (estados `available`, `ready`, `exported`) → `activeFocusedBlock === 'proposal'` → `ProposalCanvasView` ativa no CenterCanvas
- [ ] Bloco focado tem `ring-2 ring-indigo-500` + glow indigo
- [ ] Outros blocos recuam para `opacity-40` quando proposta está em foco
- [ ] CTA "Abrir PDF" no estado `exported` → abre URL em nova aba
- [ ] Conector acima do bloco (`LegoNotch` teal "aprovado") visível apenas quando `variantStatus === 'APPROVED'`
- [ ] `proposalBlock` em `systemCompositionSlice` é seletor puro (zero estado armazenado)
- [ ] `tsc --noEmit` → EXIT CODE 0

---

## Referências

- `spec-compositor-blocos-2026-04-15.md` — padrão de blocos, `LockedBlock`, `activeFocusedBlock`
- `spec-sincronia-bloco-canvas-2026-04-15.md` — mecanismo de foco e mapeamento bloco → view
- `spec-guardiao-aprovacao-2026-04-15.md` — `variantStatus`, lógica de aprovação
- `spec-multiplas-propostas-2026-04-15.md` — `DesignVariant`, `pdfUrl`, `pricing`
- `spec-view-proposal-2026-04-22.md` — view ativada por este bloco
- `spec-bloco-arranjo-fisico-2026-04-15.md` — padrão de referência para bloco de saída

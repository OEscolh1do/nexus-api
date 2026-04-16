# Spec — Guardião de Aprovação

**Tipo:** Feature Nova
**Módulo:** `engineering` — `TopRibbon`, `systemCompositionSlice`, `uiStore`
**Prioridade:** P1 — Crítico (desbloqueado após spec-sincronia + spec-compositor)
**Responsável (impl.):** `the-builder`
**Revisor (aceitação):** `engenheiro-eletricista-pv`
**Data de criação:** 2026-04-15
**Versão:** 1.0
**Origem:** `scope-jornada-integrador` Lacuna A + decisões arquiteturais 2026-04-15

---

## 1. Problema

O botão de aprovação no `TopRibbon` existe como dropdown `Rascunho → Aprovado`, mas
não está vinculado ao estado dos blocos do Compositor. O integrador pode aprovar um
sistema com chips vermelhos e gerar uma proposta com dados incorretos.

Além disso, o botão "Gerar Proposta" não existe no fluxo pós-aprovação. O integrador
aprova o sistema e não sabe para onde ir.

---

## 2. Solução

### 2.1 Condição de aprovação

A aprovação fica disponível (sem bloqueio hard) quando:

```typescript
const canApprove =
  systemComposition.consumptionBlock.status === 'complete' &&
  systemComposition.moduleBlock.status === 'complete'     &&
  systemComposition.inverterBlock.status !== 'error';
// arrangementBlock: se existir, não deve estar em 'error'
```

Se `canApprove === false`, o botão de aprovação exibe um tooltip listando os blocos
que precisam de atenção. O integrador pode forçar a aprovação com confirmação — não
é um bloqueio duro.

### 2.2 Tooltip de orientação

```
⚠ Para aprovar, complete:
  • Bloco Consumo: consumo médio não informado
  • Bloco Inversor: oversize ratio fora do limite (1.42)
```

Cada item do tooltip é clicável: clicar → `setFocusedBlock(blocoId)` → canvas
navega para a view do bloco com problema.

### 2.3 Botão "Gerar Proposta" pós-aprovação

Quando `variantStatus === 'APPROVED'`, o TopRibbon exibe um botão proeminente
"Gerar Proposta" ao lado do status de aprovação.

Clicar → navega para o módulo `proposal/` com os dados do dimensionamento já
preenchidos (o `solarStore` é a fonte de dados).

---

## 3. Especificação Técnica

### 3.1 Modificação no `TopRibbon.tsx`

```typescript
// Ler estado da composição
const composition = useSystemComposition(); // hook do systemCompositionSlice
const { setFocusedBlock } = useUIStore();
const variantStatus = useSolarStore(s => s.variantStatus);

const canApprove = 
  composition.consumptionBlock.status === 'complete' &&
  composition.moduleBlock.status === 'complete' &&
  composition.inverterBlock.status !== 'error';

const blocosIncompletos = [
  composition.consumptionBlock.status !== 'complete' && { id: 'consumption', label: 'Bloco Consumo' },
  composition.moduleBlock.status !== 'complete'      && { id: 'module',      label: 'Bloco Módulos' },
  composition.inverterBlock.status === 'error'       && { id: 'inverter',    label: 'Bloco Inversor' },
].filter(Boolean);
```

### 3.2 UI do botão de aprovação

```tsx
{/* Botão Aprovar — com tooltip se incompleto */}
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        onClick={() => canApprove ? handleApprove() : setShowForceConfirm(true)}
        className={cn(
          'px-3 py-1 text-xs rounded',
          canApprove
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
            : 'bg-slate-700 text-slate-400 cursor-pointer'
        )}
      >
        {variantStatus === 'APPROVED' ? '✓ Aprovado' : 'Aprovar sistema'}
      </button>
    </TooltipTrigger>
    {!canApprove && (
      <TooltipContent>
        <p className="font-medium mb-1">Para aprovar, complete:</p>
        {blocosIncompletos.map(b => (
          <p
            key={b.id}
            className="text-xs cursor-pointer hover:underline"
            onClick={() => setFocusedBlock(b.id as FocusedBlock)}
          >
            • {b.label}
          </p>
        ))}
      </TooltipContent>
    )}
  </Tooltip>
</TooltipProvider>

{/* Botão Gerar Proposta — só aparece após aprovação */}
{variantStatus === 'APPROVED' && (
  <button
    onClick={() => navigateToProposal()}
    className="px-3 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white ml-2"
  >
    Gerar Proposta →
  </button>
)}
```

### 3.3 Modal de confirmação forçada

Quando `canApprove === false` e o integrador clica mesmo assim:

```
┌─────────────────────────────────────────┐
│ ⚠ Aprovar com pendências?               │
│                                         │
│ O sistema tem itens incompletos:        │
│ • Bloco Inversor: oversize ratio 1.42   │
│                                         │
│ Você pode aprovar mesmo assim, mas a    │
│ proposta pode conter dados incorretos.  │
│                                         │
│ [Cancelar]  [Aprovar mesmo assim]       │
└─────────────────────────────────────────┘
```

---

## 4. Arquivos Afetados

### Modificar

| Arquivo | Mudança |
|---------|---------|
| `ui/panels/TopRibbon.tsx` | Substituir dropdown de aprovação pela lógica do guardião + botão "Gerar Proposta" |

### Dependências (devem existir antes)

- `systemCompositionSlice.ts` — `spec-compositor-blocos-2026-04-15.md` Fase A
- `activeFocusedBlock` no `uiStore` — `spec-sincronia-bloco-canvas-2026-04-15.md` Etapa 1

---

## 5. Critérios de Aceitação

- [ ] Botão "Aprovar" fica verde e ativo quando todos os blocos obrigatórios estão completos
- [ ] Botão "Aprovar" fica cinza com tooltip quando há blocos incompletos
- [ ] Clicar num item do tooltip → `setFocusedBlock()` → canvas navega para o bloco com problema
- [ ] Aprovar com pendências mostra modal de confirmação — não bloqueia hard
- [ ] Após aprovação → botão "Gerar Proposta" aparece no TopRibbon
- [ ] Clicar "Gerar Proposta" → módulo `proposal/` abre com dados preenchidos
- [ ] `tsc --noEmit` → EXIT CODE 0

---

## Referências

- `spec-sincronia-bloco-canvas-2026-04-15.md` — `activeFocusedBlock`, `setFocusedBlock()`
- `spec-compositor-blocos-2026-04-15.md` — `systemCompositionSlice`, `BlockStatus`
- `spec-multiplas-propostas-2026-04-14.md` — `variantStatus`, `approveVariant()`
- `modules/proposal/` — módulo de proposta existente

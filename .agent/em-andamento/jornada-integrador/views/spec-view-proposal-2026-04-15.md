# Spec — ProposalModule como Canvas View

**Arquivo alvo:** `modules/proposal/ProposalModule.tsx`
**Tipo:** Adaptação (integração ao CenterCanvas)
**Módulo:** `proposal`
**Prioridade:** P1
**Responsável:** `the-builder`
**Revisor:** `design-lead`
**Data:** 2026-04-15
**Ativada por:** aba "Proposta" no WorkspaceTabs
**Condição de acesso:** `variantStatus === 'APPROVED'`
**Cor de acento:** Indigo — `text-indigo-400` / `border-indigo-500/30`

---

## 1. Propósito

O `ProposalModule` já existe e funciona como módulo independente. Esta spec define
o mínimo necessário para integrá-lo ao CenterCanvas como mais uma canvas view, sem
reescrever seu conteúdo interno.

Há dois estados desta view:

1. **Bloqueado** — sistema não aprovado. O integrador vê uma tela de bloqueio clara
   com um caminho de ação direto.
2. **Ativo** — sistema aprovado. O módulo de proposta existente é renderizado
   normalmente no espaço do CenterCanvas.

---

## 2. Wrapper de integração

O `ProposalModule` recebe um wrapper mínimo que não altera sua lógica interna:

```tsx
// modules/proposal/ProposalModule.tsx — adicionar ao topo do render

const variantStatus = useSolarStore(s => s.variantStatus);
const { setFocusedBlock } = useUIStore();

// Tela de bloqueio quando não aprovado
if (variantStatus !== 'APPROVED') {
  return <ProposalBlockedScreen onNavigate={() => setFocusedBlock('simulation')} />;
}

// Conteúdo existente do módulo — inalterado
return <ProposalContent />;
```

---

## 3. Tela de Bloqueio — sem header

```tsx
const ProposalBlockedScreen = ({
  onNavigate
}: { onNavigate: () => void }) => (
  <div className="h-full flex flex-col items-center justify-center gap-6
                  bg-slate-950 text-center px-8">

    {/* Ícone */}
    <div className="p-5 rounded-full bg-slate-900 border border-slate-800">
      <Lock size={32} className="text-slate-600" />
    </div>

    {/* Texto */}
    <div className="max-w-sm">
      <p className="text-lg font-semibold text-slate-300 mb-2">
        Proposta bloqueada
      </p>
      <p className="text-sm text-slate-500">
        A proposta só pode ser gerada após o sistema ser aprovado.
        Complete o dimensionamento e aprove na view de Simulação.
      </p>
    </div>

    {/* Status atual dos blocos */}
    <BlockStatusSummary />

    {/* CTA */}
    <button
      onClick={onNavigate}
      className="flex items-center gap-2 px-5 py-2.5
                 bg-teal-600/20 hover:bg-teal-600/30
                 border border-teal-600/30 text-teal-400
                 rounded-lg transition-colors text-sm">
      Ver Simulação
      <BarChart2 size={14} />
    </button>
  </div>
);
```

### 3.1 Componente BlockStatusSummary

Mostra o estado de cada bloco obrigatório para que o integrador saiba o que falta:

```tsx
const BlockStatusSummary = () => {
  const composition = useSystemComposition();

  const blocks = [
    { label: 'Consumo',  status: composition.consumptionBlock.status, icon: Zap,      color: 'amber'   },
    { label: 'Módulos',  status: composition.moduleBlock.status,      icon: Sun,       color: 'sky'     },
    { label: 'Inversor', status: composition.inverterBlock.status,    icon: Cpu,       color: 'emerald' },
    { label: 'Arranjo',  status: composition.arrangementBlock?.status, icon: Map,      color: 'indigo'  },
  ];

  return (
    <div className="flex gap-3">
      {blocks.map(b => (
        <div key={b.label} className="flex flex-col items-center gap-1">
          <div className={cn('p-2 rounded-lg', {
            'bg-emerald-900/30 border border-emerald-700/40': b.status === 'complete',
            'bg-red-900/30 border border-red-700/40':         b.status === 'error',
            'bg-slate-800 border border-slate-700':           b.status !== 'complete' && b.status !== 'error',
          })}>
            <b.icon size={14} className={cn({
              'text-emerald-400': b.status === 'complete',
              'text-red-400':     b.status === 'error',
              'text-slate-500':   b.status !== 'complete' && b.status !== 'error',
            })} />
          </div>
          <span className="text-[9px] text-slate-500">{b.label}</span>
          {b.status === 'complete'
            ? <CheckCircle size={10} className="text-emerald-400" />
            : <Circle size={10} className="text-slate-600" />
          }
        </div>
      ))}
    </div>
  );
};
```

---

## 4. Aba no WorkspaceTabs — estado desabilitado

A aba "Proposta" no `WorkspaceTabs` exibe um indicador visual quando não disponível:

```tsx
{/* Aba Proposta no WorkspaceTabs */}
<button
  onClick={() => variantStatus === 'APPROVED' && setFocusedBlock('proposal')}
  className={cn('flex items-center gap-1.5 px-3 py-2 text-xs transition-colors',
    variantStatus === 'APPROVED'
      ? 'text-indigo-400 border-t-2 border-indigo-500 cursor-pointer hover:text-indigo-300'
      : 'text-slate-600 cursor-not-allowed'
  )}>
  <FileText size={12} />
  Proposta
  {variantStatus !== 'APPROVED' && (
    <Lock size={9} className="ml-0.5 text-slate-700" />
  )}
</button>
```

**Tooltip** ao hover na aba desabilitada:
```tsx
<TooltipContent className="text-xs">
  Aprove o sistema primeiro (via Simulação)
</TooltipContent>
```

---

## 5. O que NÃO muda

O conteúdo interno do `ProposalModule` — pricing, BOM, simulação financeira resumida,
geração de PDF, `DesignVariant.pdfUrl` — permanece **integralmente inalterado**. Esta
spec não toca na lógica de negócio da proposta.

---

## 6. Arquivos

| Arquivo | Status |
|---------|--------|
| `modules/proposal/ProposalModule.tsx` | **[MODIFICAR]** — adicionar guard de status + tela de bloqueio |
| `panels/WorkspaceTabs.tsx` | **[MODIFICAR]** — aba com estado desabilitado (coberto em spec-sincronia) |

---

## 7. Critérios de Aceitação

- [ ] `variantStatus !== 'APPROVED'` → tela de bloqueio visível com BlockStatusSummary
- [ ] Blocos completos no BlockStatusSummary mostram ícone verde; incompletos mostram cinza
- [ ] CTA "Ver Simulação" na tela de bloqueio → `setFocusedBlock('simulation')`
- [ ] `variantStatus === 'APPROVED'` → conteúdo do ProposalModule renderizado normalmente
- [ ] Aba "Proposta" no bottom com cadeado quando não aprovado; sem cadeado quando aprovado
- [ ] Click na aba desabilitada → sem navegação (não muda `activeFocusedBlock`)
- [ ] Zero alterações na lógica interna do ProposalModule (pricing, PDF, BOM)
- [ ] `tsc --noEmit` → EXIT CODE 0

---

## Referências

- `spec-guardiao-aprovacao-2026-04-15.md` — lógica de aprovação e `variantStatus`
- `spec-multiplas-propostas-2026-04-15.md` — `DesignVariant`, `variantStatus`
- `systemCompositionSlice` — `BlockStatus` de cada bloco
- `spec-sincronia-bloco-canvas-2026-04-15.md` §8 — WorkspaceTabs com aba desabilitada

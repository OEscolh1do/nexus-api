# Spec: Top Ribbon Premium (Symmetry Fix)
**Tipo:** Refatoração Visual (UI/UX)
**Skill responsável pela implementação:** design-lead
**Revisor de aceitação:** engenheiro-eletricista-pv
**Prioridade:** P1
**Origem:** Revisão de documentação de Layout vs Realidade

---

## Problema
O arquivo de documentação `mapa-dimensionamento.md` define que o `TopRibbon` tem 3 setores distintos (Left, Center, Right). Contudo, na implementação atual do flexbox (`mr-auto ml-4` no contêiner central), o setor de KPIs está "ancorado" ao lado esquerdo.  
Isso causa a quebra do padrão de simetria C-Level (onde KPIs devem estar em "True Center"), criando um aspecto de layout "dividido em dois" (Esquerda pesada vs Direita).

## Solução Técnica (Aesthetics Engine)
Refatorar a estrutura do `TopRibbon.tsx` para utilizar uma grid de 3 colunas ou posicionamento absoluto central para os KPIs, garantindo que:
1. **Setor Esquerdo (Contexto)** fique alinhado à esquerda (`justify-start`).
2. **Setor Central (KPIWidgets)** fique perfeitamente centralizado na página, independentemente do tamanho das laterais.
3. **Setor Direito (Ações)** fique ancorado à direita (`justify-end`).

Além disso, introduziremos um tratamento visual de `glassmorphism` e divisores de linha sutis (pílulas de métricas independentes) para reforçar o Design Premium.

### Código Sugerido (Flex/Absolute Paradigm)
```tsx
<div className="relative h-full w-full bg-slate-900 border-b border-slate-800 flex items-center px-2 select-none">
  {/* ESQUERDA: absolutizada ou flex de mesma largura para manter simetria */}
  <div className="absolute left-2 flex items-center gap-1">...</div>

  {/* CENTRO: Margin auto para alinhar perfeitamente no centro do canvas */}
  <div className="mx-auto hidden md:flex items-center gap-4">...</div>

  {/* DIREITA: absolutizada */}
  <div className="absolute right-2 flex items-center gap-1.5">...</div>
</div>
```

## Arquivos Afetados
- `[MODIFY] kurupira/frontend/src/modules/engineering/ui/panels/TopRibbon.tsx`
  - Substituição da lógica `flex items-center gap-2 mr-auto ml-4` por uma estrutura simétrica balanceada.
- `[MODIFY] docs/interface/mapa-dimensionamento.md`
  - Caso seja necessário explicar o layout em pílula do novo Top Ribbon visual.

## Critérios de Aceitação
- [ ] O componente `TopRibbon.tsx` deve ter seus KPIs perfeitamente alinhados ao centro da tela física (`margin: 0 auto` ou `absolute inset-x-0`).
- [ ] O Redesign deve respeitar o *Design Lead guidelines* (High-End Premium) usando bordas translúcidas se aplicável.
- [ ] `tsc --noEmit` → EXIT CODE 0
- [ ] Não pode haver overlapping dos KPIs sobre os botões da esquerda/direita em telas menores, devendo colapsar (`md:hidden`) adequadamente antes que ocorra colisão.

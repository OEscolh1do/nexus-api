# Spec 05: Mapa de Decisão do Engenheiro (Índice da Simulação)
**Tipo:** Feature de Navegação + UX  
**Skill responsável:** design-lead  
**Revisor de aceitação:** engenheiro-eletricista-pv  
**Prioridade:** P2  
**Origem:** Jornada do Engenheiro — Visão completa e navegação fluida

---

## Problema

À medida que adicionamos Curva Diária, Visões Múltiplas, Potência Mínima e Waterfall de Perdas, o Dashboard cresce verticalmente e se torna uma página extensa com scroll infinito. O engenheiro perde a orientação: "Onde está o gráfico cumulativo? Preciso rolar 3 telas pra baixo?"

Softwares como PVsyst e Helioscope resolvem isso com **navegação lateral por seções** ou **tabs internas** no painel de simulação.

## Solução Técnica

### Sidebar de Navegação Tipo "Table of Contents"

Uma mini-sidebar fixa (sticky) na extremidade esquerda do Dashboard, com links âncora para cada seção:

```
┌──────┬──────────────────────────────────┐
│ NAV  │          CONTEÚDO                │
│      │                                  │
│ 📊   │  ┌─────────────┬──────────────┐  │
│ Visão│  │  DEMANDA     │ SUPRIMENTO   │  │
│ Geral│  └─────────────┴──────────────┘  │
│      │                                  │
│ 📈   │  ┌──────────────────────────┐    │
│ Comp.│  │  BarChart + Donut        │    │
│      │  └──────────────────────────┘    │
│ 🌤️   │                                  │
│ Curva│  ┌──────────────────────────┐    │
│ Solar│  │  Curva Diária (AreaChart)│    │
│      │  └──────────────────────────┘    │
│ 📋   │                                  │
│ Tab. │  ┌──────────────────────────┐    │
│      │  │  Tabela Analítica        │    │
│      │  └──────────────────────────┘    │
│ 🎯   │                                  │
│ Dim. │  ┌──────────────────────────┐    │
│      │  │  Potência Mínima         │    │
│      │  └──────────────────────────┘    │
│ 📉   │                                  │
│ Perd.│  ┌──────────────────────────┐    │
│      │  │  Waterfall de Perdas     │    │
│      │  └──────────────────────────┘    │
└──────┴──────────────────────────────────┘
```

### Implementação
- **Componente:** `<SimulationNavRail />` com `position: sticky; top: 0`.
- **Largura:** ~48px (ícone-only) expandindo para ~160px no hover.
- **Scroll tracking:** `IntersectionObserver` para destacar o item ativo conforme o scroll.
- **Responsividade:** Em mobile, colapsa para uma barra horizontal de tabs no topo.

---

## Arquivos Afetados

### Novo
- `[NEW] .../canvas-views/simulation/SimulationNavRail.tsx` — Componente de navegação lateral.

### Modificar
- `[MODIFY] SimulationCanvasView.tsx` — Encapsular o conteúdo em `<div className="flex">` com o NavRail à esquerda. Adicionar `id` em cada seção para scroll-to.

---

## Critérios de Aceitação
- [ ] Clicar em qualquer item do NavRail faz smooth-scroll até a seção correspondente.
- [ ] O item ativo no NavRail se destaca (cor, borda, scale) conforme o scroll do usuário.
- [ ] Em telas < 1024px, o NavRail vira tabs horizontais no topo.
- [ ] `tsc --noEmit` → EXIT CODE 0.

## Referências
- Adobe Illustrator — Properties Panel com seções colapsáveis.
- PVsyst 7.x — Painel lateral com "System", "Simulation", "Results".

# SPEC-001 — Decomposição do RightInspector em Panel Groups

**Épico**: UX-002 Panel System  
**Fase**: 1 (Organizacional)  
**Prioridade**: P0 (Fundação)  
**Dependências**: Nenhuma  

---

## Problema de Negócio

O `RightInspector.tsx` é um monólito de **627 linhas** que mistura 8 seções 
funcionalmente independentes em um único arquivo. Isso:
- Dificulta manutenção e revisão de código
- Impede reutilização individual das seções (ex: gráfico Gen/Cons no center)
- Torna impossível colapsar/expandir seções individualmente
- Gera re-renders desnecessários (tudo re-renderiza quando qualquer prop muda)

## Usuário Final

Engenheiro solar que utiliza o workspace de dimensionamento.

## Escopo

### ✅ Incluso
- Extrair 4 grupos semânticos do `RightInspector.tsx` para arquivos independentes
- Cada grupo é um componente React auto-contido que consome suas próprias stores
- Manter 100% da funcionalidade visual e comportamental existente (refactor puro)

### ❌ Excluso
- Novos comportamentos de UI (colapsar, maximizar, arrastar)
- Mudanças em stores Zustand ou schemas de dados
- Alterações no grid do WorkspaceLayout

## Especificação Técnica

### Arquivos a Criar

```
kurupira/frontend/src/modules/engineering/ui/panels/groups/
├── SiteContextGroup.tsx       ← Cliente + Localização + Clima
├── SimulationGroup.tsx        ← Geração vs Consumo + FDI Dashboard
├── ElectricalGroup.tsx        ← Consumo Mensal + HSP + Perdas + Termodinâmica
└── PropertiesGroup.tsx        ← PropertiesDrawer contextual (módulo/inversor/string/area)
```

### Mapeamento de Extração

| Grupo | Componente Fonte | Linhas no RightInspector.tsx | Sub-componentes internos |
|-------|-----------------|----------------------------|-------------------------|
| **SiteContextGroup** | `CommercialContextView` (parcial) | 85–135 | — |
| **SimulationGroup** | `SimulationMetricsSection` | 299–426 | Gráfico Recharts, FDI badge |
| **ElectricalGroup** | `MonthlyConsumptionGrid` + `MonthlyIrradiationGrid` + `SystemLossesSection` + `ThermalConfigBlock` | 167–626 | CRESESB selector, sliders de perdas |
| **PropertiesGroup** | `PropertiesDrawer.tsx` (existente) | Arquivo separado | ModuleProperties, InverterProperties, StringProperties, AreaProperties |

### Regras de Extração

1. Cada grupo deve ser **auto-suficiente**: importa suas próprias stores e hooks
2. Cada grupo exporta um **único componente default** com interface simples (sem props obrigatórias)
3. O `PropertiesGroup` consome `useSelectedEntity()` internamente
4. Nenhuma prop drilling entre grupos — tudo via Zustand

### Critérios de Aceitação (Definition of Done)

- [ ] 4 arquivos criados na pasta `groups/`
- [ ] Cada arquivo compila sem erros (`npx tsc --noEmit`)
- [ ] `RightInspector.tsx` ainda importa e renderiza os 4 grupos (proxy temporário)
- [ ] Zero mudanças visuais no workspace (pixel-perfect refactor)
- [ ] Nenhum import circular introduzido

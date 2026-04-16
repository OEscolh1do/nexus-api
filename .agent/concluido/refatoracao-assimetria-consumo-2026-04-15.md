# Spec: Assimetria Visual da ConsumptionCanvasView
**Tipo:** Refatoração de UX / Design System  
**Skill responsável pela implementação:** design-lead / the-builder  
**Revisor de aceitação:** design-lead  
**Prioridade:** P1  
**Origem:** Revisão direta do `spec-canvas-views-design-2026-04-15.md`

---

## Problema
O layout idealizado para a `ConsumptionCanvasView` apresenta uma divisão simétrica (50/50) entre a Seção 1 (Perfil de Consumo) e a Seção 2 (Correlação Climática). Do ponto de vista de "Engineering Tool Aesthetic" e hierarquia de informação, essa simetria é um anti-padrão. O gráfico de Perfil de Consumo (12 colunas de meses + interatividade de edição) exige a maior parte do espaço horizontal para manter a legibilidade, enquanto o card de Correlação Climática atua apenas como um cross-check contextual, não devendo consumir a mesma margem de tela.

## Solução Técnica
Aplicar uma fundação de **grid assimétrico** no painel principal da view.

### Layout Grid (Tailwind CSS)
A alocação será baseada em um `grid-cols-12` (ou `grid-cols-3` como base responsiva):
- **Desktop (`xl`, `2xl`)**: Utilizar `grid-cols-12`.
  - **Seção 1 (Perfil de Consumo)**: `col-span-8` ou `col-span-9` (~66% a 75% da largura).
  - **Seção 2 (Correlação Climática)**: `col-span-4` ou `col-span-3` (~25% a 33% da largura).
- **Mobile / Tablet (`sm`, `md`)**: Colapsar para `grid-cols-1`.

### Refinamento Visual (Engineering Aesthetic)
- O gráfico principal receberá mais "respiro" entre as barras dos 12 meses.
- O gráfico de correlação climática se tornará um painel de alta densidade focado em eixo duplo e sparklines (ou gráficos comprimidos), comportando-se como um widget acessório.
- Borda e divisão rígida (micro-bordas `border-slate-800/50`) entre as duas seções ressaltando a estrutura do painel.

## Arquivos Afetados

### Modificar (Documentação)
- `[MODIFY] .agent/em-andamento/jornada-integrador/spec-canvas-views-design-2026-04-15.md`
  - Atualizar o esquema visual do layout para exibir as seções com as proporções corretas (ex: 2/3 e 1/3).

### Modificar / Criar (Implementação futura de Componentes)
- `[NEW] kurupira/frontend/src/modules/engineering/views/canvas-views/ConsumptionCanvasView.tsx`
  - Aplicar `grid grid-cols-1 xl:grid-cols-12 gap-4`.
  - Envolver os componentes com as lógicas de `col-span`.

## Critérios de Aceitação
- [ ] O arquivo `spec-canvas-views-design-2026-04-15.md` deve estar alinhado com a proposta assimétrica.
- [ ] No design final (`ConsumptionCanvasView.tsx`), a tela tem clareza imediata na predominância visual da Seção 1 perante a Seção 2.
- [ ] A responsividade do grid garante degradação graciosa para Single Column em Mobile e Tablet.

## Referências Normativas
- Workflow `/design-lead` (Engineering Tool Aesthetic)
- Diretrizes de Legibilidade de Dataviz da Tufte (Maior "data/ink ratio" onde a informação é mandatória).

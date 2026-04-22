## Análise de Atrito: ProjectionLossBar (Painel 1)

### Situação Atual
- **Tipo**: Toolbar Inline Horizontal (Top-fixed).
- **Posicionamento**: Entre o Header e as Métricas, fixo no topo do cockpit vertical.
- **Área subtraída do canvas**: ~40px (recolhido) a ~250px (expandido) de altura.
- **Frequência de uso**: Intermitente (ajuste de premissas no início da análise).

### Fricção Identificada
- [x] **Disrupção Vertical**: Quando expandido, empurra todos os gráficos para fora da dobra (fold), forçando scroll excessivo.
- [x] **Layout não-idiomático**: Sliders horizontais curtos em uma faixa larga geram muito espaço vazio (whitespace) desperdiçado.
- [x] **Conflito de Foco**: O usuário ajusta a perda e o gráfico que ele quer observar (lá embaixo) se move.

---

## Proposta: Sidebar de Premissas (N-Panel Style)

**Componente afetado**: `ProjectionCanvasView.tsx` e `projection/ProjectionLossBar.tsx`
**Padrão de referência**: Blender `N-Panel` (Sidebar de Propriedades)
**Ganho de viewport**: ~15% de área vertical recuperada para os gráficos.

### Comportamento Proposto
A "Composição de Perdas" deixa de ser uma faixa horizontal e passa a ser uma **Sidebar Lateral Direita** colapsável. 
- O estado padrão é **recolhido**, exibindo apenas o PR Final em um badge vertical ou no header.
- Ao expandir, ela desliza da direita para a esquerda, permitindo ajustes simultâneos à visualização dos gráficos centrais.

### Gatilho de Abertura
- Ícone de "Settings" ou "Sliders" no lado direito do Header HUD da Projeção.
- Atalho visual (aba vertical) na borda direita.

### Arquivos Afetados (estimativa)
- `[MODIFY] ProjectionCanvasView.tsx`: Alterar layout de `flex-col` para `flex-row` principal.
- `[MODIFY] ProjectionLossBar.tsx` -> Renomear para `ProjectionLossSidebar.tsx`: Reestruturar para layout em pilha vertical (stack).
- `[MODIFY] uiStore.ts` ou local state: Controlar `isLossSidebarOpen`.

### Critérios de Aceitação
- [ ] Viewport principal (Gráficos) não sofre "push" vertical ao abrir as perdas.
- [ ] Sliders são empilhados verticalmente com labels acima, otimizando a leitura técnica.
- [ ] Estado da sidebar (aberta/fechada) persiste via Zustand.

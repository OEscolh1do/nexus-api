# Spec: ROI Financeiro (Substituição de Composição)
**Tipo:** Refatoração Técnica (Motor de Cálculo + UI)
**Skill responsável:** the-builder / engenheiro-eletricista-pv
**Prioridade:** P0
**Data:** 2026-04-21

---

## 1. Problema
O gráfico de "Composição" atual utiliza premissas de simultaneidade (autoconsumo) puramente estimativas/estáticas. Sem um perfil de carga real (Smart Meter ou Grupo A), essa visualização é tecnicamente frágil e "desonesta" perante a Lei 14.300, podendo induzir a projeções financeiras errôneas.

## 2. Solução Técnica
Substituir a aba "Composição" por **"Retorno (ROI)"**, focando na projeção de longo prazo (25 anos), que é o ponto de fechamento de venda do integrador.

### 2.1 Especificação Matemática (Projeção 25 anos)
- **Entradas**: `totalPowerKw`, `hsp`, `tariffRate`, `prDecimal`.
- **Degradação**: 0.5% a.a. (linear).
- **Inflação Energética**: 5.0% a.a. (composto).
- **Cálculo da Economia Acumulada no Ano N**:
  ```
  Economia_N = (Geração_0 * (1 - 0.005)^N) * (Tarifa_0 * (1 + 0.05)^N)
  Acumulado_N = Sum(Economia_0...N)
  ```

## 3. Arquivos Afetados

### Modificar
- `[MODIFY] kurupira/frontend/src/modules/engineering/utils/projectionMath.ts`
  - Adicionar export `calculateFinancialROI`
- `[MODIFY] kurupira/frontend/src/modules/engineering/ui/panels/canvas-views/ProjectionCanvasView.tsx`
  - Alterar tabs e renderização condicional.

### Criar
- `[NEW] kurupira/frontend/src/modules/engineering/ui/panels/canvas-views/projection/CumulativeROIChart.tsx`
  - Componente Recharts (AreaChart) com gradiente Teal/Amber.

### Deletar
- `[DELETE] kurupira/frontend/src/modules/engineering/ui/panels/canvas-views/projection/CompositionChart.tsx`

## 4. Critérios de Aceitação
- [ ] Tab "Composição" removida da UI.
- [ ] Nova Tab "Retorno (ROI)" exibe curva ascendente de 25 anos.
- [ ] Tooltip do gráfico mostra Economia Anual Acumulada.
- [ ] Geração do ano 1 no ROI deve bater com a Economia Anual da `AnalyticsTable`.
- [ ] `tsc --noEmit` -> EXIT CODE 0

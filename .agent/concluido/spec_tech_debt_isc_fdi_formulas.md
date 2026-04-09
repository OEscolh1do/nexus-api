# Especificação: Unificação do Cálculo FDI (Dívida Técnica)

## 1. O Quê (Business Problem)

**Problema — FDI (Fator de Dimensionamento do Inversor) Fragmentado**
O cálculo do FDI (DC/AC ratio) é feito **independentemente** em pelo menos 4 componentes, com fontes de dados divergentes e thresholds hardcoded:

- `useTechKPIs.ts:41` — `totalDC / totalAC` (fonte: `snapshot.nominalPower`)
- `HealthCheckWidget` (TopRibbon:348) — recalcula via `modules.reduce` / `inverters.reduce` (fonte: `i.nominalPower`)
- `InverterStatusBar.tsx:44` — recalcula via `catalogInverters.find(...)` (fonte: `catalogId` lookup)
- `RightInspector.tsx:350` — consome `kpi.dcAcRatio` mas interpreta localmente

Os thresholds de Clipping (`>130%`) e Oversized AC (`<75%`) estão hardcoded em 3+ locais sem constante compartilhada.

A representação visual oscila entre `%` (120%) e `x` (1.20x) sem padronização.

## 2. Usuários Finais
- **Engenheiro Dimensionador**: Recebe classificação FDI (Ideal/Clipping/Oversized) no Workspace.

## 3. Critérios de Aceitação
1. Extrair thresholds `FDI_LOW_PERCENT` (75%) e `FDI_HIGH_PERCENT` (130%) para `engineering/constants/thresholds.ts`.
2. Todos os componentes devem consumir `useTechKPIs` como **única fonte** de FDI — sem recalcular.
3. Padronizar a label: exibir como **ratio** (`1.20x`) nos widgets compactos e como **percentual** (`120%`) nos dashboards detalhados.

## 4. Fora de Escopo
- Correção térmica do Isc (margem de ~2%, descartada por custo-benefício).
- Refatoração do sistema de validação elétrica (`validateSystemStrings`).

## 5. Detalhes Técnicos
- **`engineering/constants/thresholds.ts`** [NOVO]: Constantes FDI.
- **`InverterStatusBar.tsx`**: Remover cálculo duplicado, consumir `useTechKPIs`.
- **`TopRibbon.tsx` (HealthCheckWidget)**: Remover `overloadRatio` inline, consumir `useTechKPIs`.
- **`RightInspector.tsx`**: Importar thresholds do arquivo de constantes.
- **Schema/Backend**: Sem impacto.

---
*Status: Especificação aprovada. Prosseguindo para /speckit.plan.*

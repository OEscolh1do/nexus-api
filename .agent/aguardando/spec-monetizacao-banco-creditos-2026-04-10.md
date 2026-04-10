# Spec: Monetização e Payback na Simulação Energética
**Tipo:** Refatoração Técnica  
**Skill responsável pela implementação:** the-builder  
**Revisor de aceitação:** engenheiro-eletricista-pv  
**Prioridade:** P1  
**Origem:** revisão-dashboard-c-level-2026-04-10

---

## Problema
O *Motor Analítico* atual mostra kWh acumulados em formato contábil, mas o grande motivador de decisão no topo do funil (Dashboard) é o Retorno sobre o Investimento (ROI) / Capital. O sistema atualmente não converte "créditos" de energia e consumo abatido em **Dinheiro Economizado (R$)**, ignorando lógicas como "Custo de Disponibilidade" (Taxa Mínima) mandatada pela ANEEL e a aplicação da "Tarifa Energética (TE) + TUSD".

## Solução Técnica

A matemática atual do Recharts deve gerar novos subprodutos (variáveis derivadas) cruzando energia contra o valor da fatura.

### Especificação 1: Tradutor Monetário de Consumo Abatido

#### Entrada
| Variável | Tipo | Fonte | Unidade |
|---------|------|-------|---------|
| Tariff_Rate | float | `useSolarStore() -> clientData.tariffRate` | R$/kWh |
| Connection_Type | enum | `useSolarStore() -> clientData.connectionType` (`monofasico`, `bifasico`, `trifasico`) | - |
| Geração_Mês | float | chartData (array) | kWh |
| Consumo_Mês | float | chartData (array) | kWh |

#### Fórmula: Taxa Mínima de Disponibilidade (ANEEL)
```typescript
const getMinimumAvailability = (connection: string): number => {
  if (connection === 'trifasico') return 100;
  if (connection === 'bifasico') return 50;
  return 30; // monofasico
};
```

#### Fórmula: Custo Finaceiro
```typescript
// Para cada Mês (i)
const MinimumCharge = getMinimumAvailability(ConnectionType);

// O cliente paga A MAIOR entre (Consumo Não-Abatido) e a (Taxa Mínima da ANEEL)
const Billed_kWh = Math.max(MinimumCharge, Consumo_Mês - Geração_Mês);

const Fatura_Sem_Solar = Consumo_Mês * Tariff_Rate;
const Fatura_Com_Solar = Billed_kWh * Tariff_Rate;
const Economia_No_Mes = Fatura_Sem_Solar - Fatura_Com_Solar;
```

#### Saída
| Variável | Tipo | Unidade | Significado |
|---------|------|---------|------------|
| Fatura_Com_Solar | float | R$ | Bolso do cliente (Pós FV) |
| Economia_No_Mes | float | R$ | Custo evitado |

---

## Arquivos Afetados

### Modificar
- `[MODIFY] kurupira/frontend/src/modules/engineering/ui/panels/canvas-views/SimulationCanvasView.tsx`
  - Injetar captura do `tariffRate` e `connectionType` da `useSolarStore`.
  - Alimentar a rotina financeira no hook do `chartData`.
  - Exibir o card "Economia Projetada (Ano 1)" em Reais (R$) no topo, ao lado do "Banco de Créditos".

## Critérios de Aceitação
- [ ] O componente extrai `tariffRate` e `connectionType` sem falhas.
- [ ] O gráfico continua intacto, mas a **Tooltip** agora exibe R$ economizados naquele mês específico sob o cursor.
- [ ] O cabeçalho demonstra "Economia Anual Projetada: R$ X,XXX" utilizando formatação de moeda brasileira (BRL).
- [ ] Compilação TSC não reclama sobre injeções vazias da store ("EXIT CODE 0").

## Referências Normativas
- ANEEL REN 1000/2021 Título II: Faturamento e Sistema de Compensação de Energia Elétrica.
- Custo de Disponibilidade (Art. 624).

# Spec 03: Estimativa de Potência Mínima (kWp Alvo)
**Tipo:** Feature de Dimensionamento  
**Skill responsável:** pv-simulation-engine + the-builder  
**Revisor de aceitação:** engenheiro-eletricista-pv  
**Prioridade:** P0  
**Origem:** Jornada do Engenheiro — "Qual o tamanho mínimo do meu sistema?"

---

## Problema

Hoje o engenheiro precisa **adivinhar** quantas placas colocar e verificar no gráfico se o saldo fica positivo. Isso é trabalho manual iterativo. O sistema deveria calcular automaticamente a **potência mínima necessária** (kWp) para que a geração anual cubra 100% do consumo anual, considerando as variáveis locais (HSP, PR).

Essa é a pergunta número 1 que todo cliente faz: **"Quantas placas eu preciso?"**

Nenhum software de engenharia sério obriga o projetista a fazer isso por tentativa e erro.

## Solução Técnica

### Especificação Matemática: Dimensionamento Reverso

#### Entrada
| Variável | Tipo | Fonte | Unidade |
|---------|------|-------|---------|
| Consumo_Anual | float | Σ monthlyConsumption | kWh/ano |
| HSP_array | number[12] | `clientData.monthlyIrradiation` | kWh/m²/dia |
| PR | float | `useTechStore.getPerformanceRatio()` | Adimensional |
| Cobertura_Alvo | float | Input do usuário (default: 100%) | % |
| Custo_Disponibilidade | float | Derivado de connectionType (30/50/100 kWh) | kWh/mês |

#### Fórmula: Potência Mínima para Cobertura-Alvo
```typescript
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function calculateMinimumPower(
  monthlyConsumption: number[],
  hspArray: number[],
  pr: number,
  targetCoverage: number = 1.0,  // 1.0 = 100%
  minAvailability: number = 30   // kWh (monofásico)
): number {
  // Consumo efetivo = Consumo real - Custo de Disponibilidade (que SEMPRE paga)
  // O sistema só precisa gerar o suficiente para abater acima da taxa mínima
  const consumoAbativel = monthlyConsumption.map(c => Math.max(0, c - minAvailability));
  const consumoAbativelAnual = consumoAbativel.reduce((a, b) => a + b, 0);

  // Geração anual por kWp instalado
  const geracaoPorKwp = hspArray.reduce((acc, hsp, i) => {
    return acc + hsp * DAYS_IN_MONTH[i] * pr;
  }, 0);

  if (geracaoPorKwp === 0) return 0;

  // P_min = (Consumo_abatível × Cobertura_Alvo) / Geração_por_kWp
  return (consumoAbativelAnual * targetCoverage) / geracaoPorKwp;
}
```

#### Saída
| Variável | Tipo | Unidade | Significado |
|---------|------|---------|------------|
| P_min_kWp | float | kWp | Potência mínima de pico para atingir a cobertura-alvo |
| P_min_kWp_arredondado | float | kWp | Arredondado para cima em múltiplos de 0.5 kWp |
| n_modulos_estimado | int | unidades | `ceil(P_min_kWp / potencia_modulo_selecionado)` |

### Visualização (Design Lead)

No **Bloco de Suprimento**, adicionar um novo KPI destacado:

```
┌─────────────────────────────────────────┐
│  ⚡ POTÊNCIA MÍNIMA RECOMENDADA         │
│  ╔══════════╗                           │
│  ║  4.95    ║ kWp (para 100%)           │
│  ╚══════════╝                           │
│  ≈ 9 módulos de 550W                    │
│                                         │
│  Atual: 3.30 kWp ▸ Cobertura: 67%      │
│  [Slider: Cobertura Alvo: 100% ───●──] │
└─────────────────────────────────────────┘
```

- **Card de destaque** com o valor calculado de P_min.
- **Comparação:** "Atual vs Recomendado" mostrando o gap.
- **Slider opcional:** O engenheiro pode ajustar `Cobertura_Alvo` de 80% a 130% e ver P_min mudar em tempo real.
- **Módulos estimados:** Se há um módulo selecionado no catálogo, mostrar `⌈P_min / Pmod⌉`.

---

## Arquivos Afetados

### Modificar
- `[MODIFY] SimulationCanvasView.tsx` — Novo Card "Potência Mínima" no Bloco Suprimento.

### Novo
- `[NEW] kurupira/frontend/src/modules/engineering/utils/minimumPower.ts` — Função pura `calculateMinimumPower()`.

---

## Critérios de Aceitação
- [ ] Com consumo de 500 kWh/mês (Belém-PA, PR 0.78), o sistema deve retornar P_min ≈ 3.9 kWp.
- [ ] Ajustar o slider para 120% deve retornar P_min ≈ 4.7 kWp.
- [ ] Se não houver dados de HSP (array zerado), o sistema exibe "—" ao invés de `Infinity`.
- [ ] `tsc --noEmit` → EXIT CODE 0.
- [ ] Eng. Vítor valida: O número retornado é matematicamente consistente com o dimensionamento que ele faria na planilha.

## Referências
- ANEEL REN 1000/2021 — Custo de Disponibilidade (Art. 624).
- NBR 16274:2014 — Dimensionamento de sistemas FV.
- Prática de mercado: Excesso de 10-20% sobre a cobertura ideal para compensar degradação anual (~0.5%/ano).

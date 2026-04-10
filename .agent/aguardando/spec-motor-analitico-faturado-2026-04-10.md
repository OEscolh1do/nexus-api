# Spec: Refatoração do Motor de Geração e Simulador de Cargas
**Tipo:** Refatoração Técnica  
**Skill responsável pela implementação:** the-builder  
**Revisor de aceitação:** engenheiro-eletricista-pv  
**Prioridade:** P1  
**Origem:** revisão-engenharia-simulador-2026-04-10  

---

## Problema
O `SimulationCanvasView` subestima ou superestima a projeção de geração solar ao fixar um valor constante de 30 dias/mês contra o HSP diário, provocando distorções normativas. Além disso, utiliza um valor fictício e cravado de potência pico (`5.0 kWp`) e soma cargas virtuais linearmente durante o ano inteiro (assumindo que equipamentos como Ar-Condicionado gastariam a mesma energia no verão e no inverno brasileiro).

## Solução Técnica

### Especificação 1: Geração Sazonal Cíclica (Base)

#### Entrada
| Variável | Tipo | Fonte | Unidade |
|---------|------|-------|---------|
| P_DC_Pico | float | `useTechStore.getSystemDcPower()` (a ser implementado) ou input provisório | kWp |
| HSP_array | number[] | `useSolarStore.clientData.monthlyIrradiation` | kWh/m²/dia |
| PR | float | `useTechStore.getPerformanceRatio()` | Adimensional (%) |

#### Fórmula
```typescript
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// Onde i é o índice do mês (0 a 11)
Geracao_Mensal[i] = P_DC_Pico * HSP_array[i] * DAYS_IN_MONTH[i] * PR
```

#### Saída
| Variável | Tipo | Unidade | Significado |
|---------|------|---------|------------|
| Geracao_Mensal | number[] | kWh/mês | Curva anual realista da usina fotovoltaica |

#### Validação
- O balanço anual `Sum(Geração) / Sum(Consumo)` deve ser recalculado exibindo a verdadeira **Taxa de Cobertura Energética**.

---

### Especificação 2: Virtual Load Profiler (Cargas Sazonais)

Ao injetar um simulador temporário, o usuário precisa apontar em que faixa do ano há operação.

#### Entrada (Novos Atributos Sandbox)
| Variável | Tipo | Fonte | Unidade |
|---------|------|-------|---------|
| Name | string | TextInput | - |
| UsageProfile | enum | `constant` \| `summer_only` \| `winter_only` | Perfil Térmico |
| Base_kWh | float | TextInput | kWh/mês |

#### Fórmula de Distribuição
```typescript
const isSummer = (monthIndex: number) => [0, 1, 2, 9, 10, 11].includes(monthIndex);
const isWinter = (monthIndex: number) => [4, 5, 6, 7].includes(monthIndex);

Virtual_Load_At[i] = {
  if (profile === 'constant') return Base_kWh;
  if (profile === 'summer_only') return isSummer(i) ? Base_kWh : 0;
  if (profile === 'winter_only') return isWinter(i) ? Base_kWh : 0;
};
```

---

## Arquivos Afetados

### Modificar
- `[MODIFY] kurupira/frontend/src/modules/engineering/ui/panels/canvas-views/SimulationCanvasView.tsx`
  - Injetar constante local `DAYS_IN_MONTH`.
  - Refatorar loop matemático do data array.
  - Expandir interface de `VirtualLoad` e modificar handler e UI do formulário de adesão para suportar o select form (Constant / Summer / Winter).

### Novo / Integração Profunda Futura
- `[MODIFY] kurupira/frontend/src/modules/engineering/store/useTechStore.ts`
  - Incluir (se não houver) o getter nominal `getSystemDcPower()`, somando as potências dos módulos instanciados (fallback pra `5.0` se estiver em fase de especificação inicial, mas como estado observável).

## Critérios de Aceitação
- [ ] Gráfico Recharts deve perder a linearidade matemática, exibindo vales consistentes em meses com 28 dias e picos de uso da barra laranja apenas nos períodos estipulados de Verão/Inverno.
- [ ] A ferramenta visual deve evidenciar "Taxa de Cobertura Energética".
- [ ] Sem quebras de compilação: `tsc --noEmit` → EXIT CODE 0.

## Referências Normativas
- ABNT NBR 16274 (Sistemas FV conectados).
- ANEEL REN 1000/2021 (Regras sobre Faturamento / Autoconsumo).

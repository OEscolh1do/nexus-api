# Spec 04: Fatores Locais e Decomposição de Perdas na Simulação
**Tipo:** Refatoração Técnica + Feature de Simulação  
**Skill responsável:** pv-simulation-engine + engenheiro-eletricista-pv  
**Revisor de aceitação:** engenheiro-eletricista-pv  
**Prioridade:** P1  
**Origem:** Jornada do Engenheiro — Confiança nos números + transparência

---

## Problema

O Dashboard atual usa um **Performance Ratio (PR) monolítico**. O engenheiro vê "PR: 78.2%" mas não sabe **de onde vem**. Isso gera desconfiança imediata. Um projetista experiente vai perguntar: "78%, considerando qual sombreamento? Qual sujeira? Qual temperatura?".

Além disso, a perda por temperatura é tratada como constante o ano inteiro, quando na realidade ela varia significativamente entre verão e inverno — especialmente em regiões quentes como o Norte do Brasil.

O `useTechStore` já armazena as perdas decompostas (`lossProfile`), mas **essa informação nunca chega ao Dashboard de Simulação**. É uma caixa-preta.

## Solução Técnica

### Especificação 1: Waterfall de Perdas (Transparência do PR)

Exibir a **decomposição do Performance Ratio** como um diagrama Waterfall (cascata) que mostra como cada fator reduz a energia bruta até chegar à geração líquida.

```
100% Energia Bruta (Irradiação × Área × Eficiência STC)
 ├── -3.0% Orientação
 ├── -4.0% Inclinação  
 ├── -3.0% Sombreamento
 ├── -2.0% Horizonte
 ├── -4.4% Temperatura
 ├── -1.5% Mismatch
 ├── -5.0% Sujeira
 ├── -0.5% Cabos DC
 ├── -1.0% Cabos AC
 ├── -2.0% Inversor (η = 98%)
 └── = 78.2% Performance Ratio Final
```

#### Visualização (Design Lead)
- **Gráfico Waterfall:** Barras horizontais empilhadas de cima para baixo, cada uma representando a redução percentual de uma fonte de perda.
- **Posição:** Dentro do Bloco Suprimento, como um elemento expandível/colapsável (accordion) abaixo dos KPIs.
- **Interatividade:** Cada barra clicável mostra um tooltip com a fórmula da perda e sua justificativa normativa.
- **Cores:** Gradiente de vermelho (perdas altas como temperatura e sujeira) a amarelo (perdas baixas como cabos).

#### Dados
```typescript
// Extrair diretamente do useTechStore.lossProfile
const lossProfile = useTechStore((s) => s.lossProfile);

const waterfallData = [
  { label: 'Orientação', loss: lossProfile.orientation },
  { label: 'Inclinação', loss: lossProfile.inclination },
  { label: 'Sombreamento', loss: lossProfile.shading },
  { label: 'Horizonte', loss: lossProfile.horizon },
  { label: 'Temperatura', loss: lossProfile.temperature },
  { label: 'Mismatch', loss: lossProfile.mismatch },
  { label: 'Sujeira/Soiling', loss: lossProfile.soiling },
  { label: 'Cabos DC', loss: lossProfile.dcCable },
  { label: 'Cabos AC', loss: lossProfile.acCable },
  { label: 'Inversor', loss: 100 - lossProfile.inverterEfficiency },
];
```

### Especificação 2: Perda por Temperatura Sazonal (Mês a Mês)

A perda por temperatura **não é constante**. No Norte do Brasil, Tcell pode chegar a 65°C em Outubro e cair para 50°C em Junho. A diferença no PR mensal pode ser de 3-5%.

#### Fórmula
```typescript
// Para cada mês i:
const T_ambiente_media = getMonthlyAverageTemp(cidade, i); // Futuro: banco de dados climáticos
const T_cell = T_ambiente_media + (NOCT - 20);  // NOCT típico: 45°C
const L_temp_mensal = Math.abs(tempCoeffPmax) * (T_cell - 25) / 100;

// PR do mês = PR_base / (1 - L_temp_fixa) * (1 - L_temp_mensal)
```

> [!NOTE]
> Esta spec pode ser implementada em **duas fases**:
> - **Fase 1 (imediata):** Waterfall visual estático usando os valores da `lossProfile`.
> - **Fase 2 (futura):** Perda por temperatura variável por mês, requerendo banco de dados de temperaturas médias por cidade (similar ao CRESESB).

---

## Arquivos Afetados

### Modificar
- `[MODIFY] SimulationCanvasView.tsx` — Adicionar seção Waterfall de Perdas no Bloco Suprimento.

### Novo
- `[NEW] .../canvas-views/simulation/LossWaterfallChart.tsx` — Componente Recharts (BarChart horizontal stacked).
- `[NEW] kurupira/frontend/src/data/climate/monthlyTemperatureByCity.ts` — (Fase 2) Dados de temperatura média mensal.

---

## Critérios de Aceitação

### Fase 1
- [ ] O Waterfall renderiza todas as 10 fontes de perda com valores numéricos.
- [ ] A soma visual das perdas resulta no mesmo PR mostrado no KPI do Bloco Suprimento.
- [ ] O componente é colapsável (accordion) para não poluir o layout.
- [ ] `tsc --noEmit` → EXIT CODE 0.

### Fase 2
- [ ] O PR no KPI varia por mês quando o modo "Temperatura Sazonal" está ativo.
- [ ] O gráfico de barras mensais (Geração) reflete as variações mensais do PR.
- [ ] Eng. Vítor valida: "Os valores de Tcell estão realistas para Marabá-PA em dezembro (~62°C)?"

## Referências
- IEC 61724-1 — Performance Ratio calculation methodology.
- NBR 16690:2019 §6.2 — Requisitos de temperatura para sistemas FV.
- NOCT padrão: 45°C ± 2°C (IEC 61215).
- TempCoeff_Pmax típico: -0.35%/°C (mono-PERC) a -0.40%/°C (poly).

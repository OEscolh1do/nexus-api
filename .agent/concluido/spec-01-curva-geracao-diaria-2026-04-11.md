# Spec 01: Curva de Geração Diária Estimada (Perfil Solar Horário)
**Tipo:** Feature de Simulação  
**Skill responsável:** pv-simulation-engine → design-lead (visualização)  
**Revisor de aceitação:** engenheiro-eletricista-pv  
**Prioridade:** P1  
**Origem:** Jornada do Engenheiro — Dimensionamento via Simulação

---

## Problema

O Dashboard de Simulação mostra apenas barras mensais (12 pontos). O engenheiro projetista não consegue visualizar **como a energia se distribui ao longo do dia** — informação crucial para:
- Estimar se a geração cobre os picos de consumo diurno (ex: ar-condicionado comercial 10h–16h).
- Justificar autoconsumo instantâneo vs. injeção na rede.
- Avaliar a viabilidade de armazenamento (baterias) em projetos off-grid ou híbridos.

O `simulation.worker.ts` já possui um loop horário (8760h) com curva parabólica bell-curve, mas esse resultado **nunca é exposto na UI**. A informação morre dentro do Worker.

## Solução Técnica

### Especificação Matemática: Curva Diária Típica por Mês

#### Entrada
| Variável | Tipo | Fonte | Unidade |
|---------|------|-------|---------|
| P_DC | float | `selectModules → reduce` | kWp |
| HSP_mensal | float | `clientData.monthlyIrradiation[mês]` | kWh/m²/dia |
| PR | float | `useTechStore.getPerformanceRatio()` | Adimensional |
| mês_selecionado | int | UI (dropdown ou slider 0–11) | índice |

#### Fórmula: Distribuição Horária via Bell-Curve Solar
```typescript
// Gera 24 pontos (horas) para o mês selecionado
function getDailyProfile(P_DC: number, HSP: number, PR: number): number[] {
  const hourly = Array(24).fill(0);
  const sunriseHour = 6;   // Simplificado (futuro: calcular por latitude)
  const sunsetHour = 18;   // Simplificado
  const peakHour = 12;     // Meio-dia solar

  // Normalização: a integral sob a curva diária deve ≈ HSP
  // Curva quadrática: I(h) = I_max × [1 - ((h - 12) / 6)²]
  let sumRawIrradiance = 0;
  const rawProfile = hourly.map((_, h) => {
    if (h <= sunriseHour || h >= sunsetHour) return 0;
    const dist = Math.abs(h - peakHour);
    const raw = Math.max(0, 1 - (dist / 6) ** 2);
    sumRawIrradiance += raw;
    return raw;
  });

  // Escalar para que a soma = HSP
  const scale = HSP / (sumRawIrradiance || 1);
  return rawProfile.map(v => v * scale * P_DC * PR);
}
```

#### Saída
| Variável | Tipo | Unidade | Significado |
|---------|------|---------|------------|
| hourlyGeneration | number[24] | kWh | Energia gerada em cada hora do dia típico do mês |

### Visualização (Design Lead)
- **Novo gráfico:** `AreaChart` Recharts com gradiente suave, eixo X = 0h–23h, eixo Y = kWh.
- **Posição:** Abaixo do BarChart principal, dentro do Bloco Comparativo.
- **Interatividade:** Dropdown ou slider para selecionar o mês (Jan–Dez). O gráfico atualiza em tempo real.
- **Cor:** Gradiente âmbar (top) → transparente (bottom), consistente com a identidade visual de "Suprimento".

---

## Arquivos Afetados

### Modificar
- `[MODIFY] SimulationCanvasView.tsx` — Adicionar AreaChart com selector de mês.

### Novo
- `[NEW] kurupira/frontend/src/modules/engineering/utils/dailyProfile.ts` — Função pura `getDailyProfile()` extraída para reutilização no Worker e no componente.

---

## Critérios de Aceitação
- [ ] O gráfico horário renderiza 24 pontos com formato bell-curve realista.
- [ ] Trocar o mês no dropdown atualiza a curva imediatamente.
- [ ] A integral (soma dos 24 valores) é coerente com `P_DC × HSP × PR` do mês.
- [ ] `tsc --noEmit` → EXIT CODE 0.
- [ ] Eng. Vítor valida: "A curva é compatível com o que eu vejo em softwares como PVsyst para uma usina horizontal no Pará?"

## Referências
- NBR 16274:2014 — Sistemas fotovoltaicos conectados à rede.
- CRESESB/INPE — Dados de irradiação por estação.

# Spec — SimulationCanvasView

**Arquivo alvo:** `canvas-views/SimulationCanvasView.tsx`
**Tipo:** Refatoração
**Módulo:** `engineering` — CenterCanvas
**Prioridade:** P0
**Responsável:** `the-builder`
**Revisor:** `engenheiro-eletricista-pv`
**Data:** 2026-04-15
**Ativada por:** `activeFocusedBlock === 'simulation'`
**Cor de acento:** Teal — `text-teal-400` / `border-teal-500/30`

---

## 1. Propósito

A SimulationCanvasView é onde o dimensionamento se transforma em argumento de venda.
O integrador vê a geração anual comparada ao consumo, a economia em reais, o payback
e o banco de créditos que o cliente vai acumular. É também onde o motor de cálculo
precisa ser corrigido — o bug de 30 dias fixos/mês produz erros de até 7% em meses
curtos como fevereiro.

**Três públicos, três visões do mesmo dado:**
- Para o cliente: "Em quais meses vou economizar mais?" → Visão de barras
- Para o banco: "Quanto acumulo ao longo do ano?" → Banco de créditos
- Para a distribuidora: "Quanto injeto vs consumo?" → Visão de composição

---

## 2. Layout — sem header

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  PAINEL A — Métricas KPI (4 cards em linha)                      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  PAINEL B — Gráfico Principal                                    │  │
│  │  [Barras] [Composição] [Tabela]  ← seletor de visão             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────┬─────────────────────────────┐   │
│  │  PAINEL C                        │  PAINEL D                   │   │
│  │  Curva Diária Estimada           │  Banco de Créditos          │   │
│  └──────────────────────────────────┴─────────────────────────────┘   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  FAIXA CTA — Aprovar sistema                                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

Container: `h-full overflow-y-auto bg-slate-950 p-4 flex flex-col gap-4`
Painéis C+D: `grid grid-cols-2 gap-4`

---

## 3. Motor de Cálculo (correção obrigatória)

**O bug atual:** `geracao[i] = kWp * hsp[i] * 30 * pr` — 30 dias fixos para todos os
meses. Fevereiro tem 28, janeiro tem 31. O erro acumulado distorce a geração anual
e a economia calculada.

**Correção:**
```typescript
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// P_DC_kWp: lido do inventário de módulos — não hardcoded
const P_DC_kWp = useSolarStore(s =>
  s.modules.ids.reduce((sum, id) => {
    const m = s.modules.entities[id];
    return sum + (m.quantity * m.electrical.pmax) / 1000;
  }, 0)
);

const geracaoMensal = useMemo(() =>
  DAYS_IN_MONTH.map((dias, i) =>
    P_DC_kWp * hsp[i] * dias * pr
  ),
  [P_DC_kWp, hsp, pr]
);
```

**Cálculo de economia com custo de disponibilidade ANEEL:**
```typescript
const CUSTO_DISPONIBILIDADE = {
  monofasico:  30,   // kWh/mês
  bifasico:    50,
  trifasico:  100,
};

const economiaLiquida = geracaoMensal.map((g, i) => {
  const consumoTotal = consumoBase[i] + totalCargasSimuladas[i];
  const autoconsumo = Math.min(g, consumoTotal);
  const creditosGerados = Math.max(0, g - consumoTotal);
  const custoDisp = CUSTO_DISPONIBILIDADE[connectionType] ?? 30;
  // Economia = autoconsumo × tarifa - custo de disponibilidade mínima
  return Math.max(0, autoconsumo * tariffRate - custoDisp);
});
```

---

## 4. Painel A — Métricas KPI

```tsx
const kpis = useMemo(() => {
  const geracaoAnual = geracaoMensal.reduce((a, b) => a + b, 0);
  const consumoAnual = consumoComCargas.reduce((a, b) => a + b, 0);
  const cobertura    = consumoAnual > 0 ? (geracaoAnual / consumoAnual) * 100 : 0;
  const economiaAnual = economiaLiquida.reduce((a, b) => a + b, 0);
  const payback      = totalInvestimento > 0 ? totalInvestimento / economiaAnual : null;

  return { geracaoAnual, cobertura, economiaAnual, payback };
}, [geracaoMensal, consumoComCargas, economiaLiquida, totalInvestimento]);
```

```tsx
<div className="grid grid-cols-4 gap-3">
  <KPICard
    label="Geração anual"
    value={`${(kpis.geracaoAnual / 1000).toFixed(1)} MWh`}
    sub="por ano"
    color="teal"
  />
  <KPICard
    label="Cobertura"
    value={`${kpis.cobertura.toFixed(0)}%`}
    sub="do consumo"
    color={kpis.cobertura >= 95 ? 'emerald' : kpis.cobertura >= 70 ? 'amber' : 'red'}
  />
  <KPICard
    label="Economia"
    value={`R$ ${(kpis.economiaAnual / 12).toFixed(0)}/mês`}
    sub={`R$ ${kpis.economiaAnual.toFixed(0)}/ano`}
    color="teal"
  />
  <KPICard
    label="Payback"
    value={kpis.payback ? `${kpis.payback.toFixed(1)} anos` : '—'}
    sub={kpis.payback ? 'estimado' : 'sem preço'}
    color="slate"
  />
</div>
```

**Componente KPICard:**
```tsx
const colorMap = {
  teal:    'bg-teal-900/30 border-teal-700/40 text-teal-400',
  emerald: 'bg-emerald-900/30 border-emerald-700/40 text-emerald-400',
  amber:   'bg-amber-900/30 border-amber-700/40 text-amber-400',
  red:     'bg-red-900/30 border-red-700/40 text-red-400',
  slate:   'bg-slate-800 border-slate-700 text-slate-300',
};

<div className={cn('p-4 rounded-lg border', colorMap[color])}>
  <p className="text-[10px] text-slate-400 mb-1 uppercase tracking-wider">{label}</p>
  <p className="text-2xl font-bold font-mono">{value}</p>
  <p className="text-[10px] opacity-60 mt-1">{sub}</p>
</div>
```

---

## 5. Painel B — Gráfico Principal com 3 visões

**Componente:** `simulation/GenerationConsumptionChart.tsx` (existente — refatorar)

### 5.1 Seletor de visão

```tsx
const [chartView, setChartView] =
  useState<'bars' | 'stacked' | 'table'>('bars');

<div className="flex items-center justify-between mb-3">
  <p className="text-xs text-slate-500">Geração vs Consumo — 12 meses</p>
  <div className="flex gap-1">
    {(['bars','stacked','table'] as const).map(v => (
      <button key={v}
        onClick={() => setChartView(v)}
        className={cn('text-xs px-3 py-1 rounded transition-colors',
          chartView === v
            ? 'bg-teal-600/20 border border-teal-600/40 text-teal-400'
            : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-300'
        )}>
        {v === 'bars' ? 'Barras' : v === 'stacked' ? 'Composição' : 'Tabela'}
      </button>
    ))}
  </div>
</div>
```

### 5.2 Visão A — Barras agrupadas (default)

```tsx
<BarChart data={chartData} height={260}>
  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
  <XAxis dataKey="mes" tick={{ fill: '#94a3b8', fontSize: 11 }} />
  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} unit=" kWh" width={56} />
  <Tooltip content={<BarsTooltip />} />
  <Legend wrapperStyle={{ fontSize: '11px' }} />
  <Bar dataKey="geracao" name="Geração" fill="#14b8a6" radius={[3,3,0,0]} />
  <Bar dataKey="consumo" name="Consumo" fill="#64748b" radius={[3,3,0,0]} />
</BarChart>
```

### 5.3 Visão B — Composição empilhada

```typescript
// Derivação por mês
const stackedData = chartData.map((d, i) => ({
  mes: d.mes,
  autoconsumo: Math.min(d.geracao, d.consumo),
  injecao:     Math.max(0, d.geracao - d.consumo),
  deficit:     Math.max(0, d.consumo - d.geracao),
}));
```

```tsx
<BarChart data={stackedData} height={260}>
  <Bar dataKey="autoconsumo" name="Autoconsumo"  stackId="pos" fill="#059669" radius={[0,0,0,0]} />
  <Bar dataKey="injecao"     name="Injeção rede" stackId="pos" fill="#14b8a6" radius={[3,3,0,0]} />
  <Bar dataKey="deficit"     name="Déficit"      fill="#f43f5e" radius={[3,3,0,0]} opacity={0.6} />
</BarChart>
```

Legenda com explicação:
```tsx
<p className="text-[10px] text-slate-500 mt-2 text-center">
  Autoconsumo = geração usada instantaneamente ·
  Injeção = excedente enviado à rede ·
  Déficit = comprado da distribuidora
</p>
```

### 5.4 Visão C — Tabela analítica

```tsx
<div className="overflow-auto max-h-72">
  <table className="w-full text-xs">
    <thead className="sticky top-0 bg-slate-900">
      <tr className="text-slate-400 border-b border-slate-700">
        <th className="text-left p-2">Mês</th>
        <th className="text-right p-2">Consumo</th>
        <th className="text-right p-2">Geração</th>
        <th className="text-right p-2">Autoconsumo</th>
        <th className="text-right p-2">Injeção</th>
        <th className="text-right p-2">Déficit</th>
        <th className="text-right p-2">Economia R$</th>
        <th className="text-right p-2">Saldo acum.</th>
      </tr>
    </thead>
    <tbody>
      {tableData.map((row, i) => (
        <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
          <td className="p-2 text-slate-300">{row.mes}</td>
          <td className="p-2 text-right font-mono text-slate-400">{row.consumo.toFixed(0)}</td>
          <td className="p-2 text-right font-mono text-teal-400">{row.geracao.toFixed(0)}</td>
          <td className="p-2 text-right font-mono text-emerald-400">{row.autoconsumo.toFixed(0)}</td>
          <td className="p-2 text-right font-mono text-teal-300">{row.injecao.toFixed(0)}</td>
          <td className="p-2 text-right font-mono text-rose-400">{row.deficit.toFixed(0)}</td>
          <td className="p-2 text-right font-mono text-amber-400">R$ {row.economia.toFixed(0)}</td>
          <td className={cn('p-2 text-right font-mono',
            row.saldoAcumulado >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
            {row.saldoAcumulado.toFixed(0)}
          </td>
        </tr>
      ))}
    </tbody>
    <tfoot className="bg-slate-900 border-t-2 border-slate-700">
      <tr className="text-slate-300 font-bold">
        <td className="p-2">Total</td>
        <td className="p-2 text-right font-mono">{totais.consumo.toFixed(0)}</td>
        <td className="p-2 text-right font-mono text-teal-400">{totais.geracao.toFixed(0)}</td>
        <td className="p-2 text-right font-mono text-emerald-400">{totais.autoconsumo.toFixed(0)}</td>
        <td className="p-2 text-right font-mono">{totais.injecao.toFixed(0)}</td>
        <td className="p-2 text-right font-mono text-rose-400">{totais.deficit.toFixed(0)}</td>
        <td className="p-2 text-right font-mono text-amber-400">R$ {totais.economia.toFixed(0)}</td>
        <td className="p-2 text-right font-mono"></td>
      </tr>
    </tfoot>
  </table>
</div>
```

---

## 6. Painel C — Curva Diária Estimada

**Componente:** `simulation/DailyGenerationChart.tsx` (novo)

### 6.1 Algoritmo bell-curve solar

```typescript
function getDailyProfile(P_DC: number, HSP: number, PR: number): number[] {
  const sunrise = 6, sunset = 18, peak = 12;
  const sunlightHours = sunset - sunrise;

  return Array.from({ length: 24 }, (_, h) => {
    if (h <= sunrise || h >= sunset) return 0;
    const dist = Math.abs(h - peak);
    const normalized = Math.max(0, 1 - (dist / (sunlightHours / 2)) ** 2);
    // Escalar para que a integral = HSP
    return normalized * (HSP / (sunlightHours * (2/3))) * P_DC * PR;
  });
}
```

### 6.2 Seletor de mês + gráfico

```tsx
const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
const dailyProfile = useMemo(
  () => getDailyProfile(P_DC_kWp, hsp[selectedMonth], pr),
  [P_DC_kWp, hsp, selectedMonth, pr]
);

const hourlyData = dailyProfile.map((kWh, h) => ({ hora: `${h}h`, kWh }));
```

```tsx
<div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
  <div className="flex items-center justify-between mb-3">
    <p className="text-xs text-slate-500">Perfil de geração horária típica</p>
    <select
      value={selectedMonth}
      onChange={e => setSelectedMonth(Number(e.target.value))}
      className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300">
      {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
    </select>
  </div>

  <AreaChart data={hourlyData} height={160}>
    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
    <XAxis dataKey="hora" tick={{ fill: '#64748b', fontSize: 10 }}
      tickFormatter={v => [6,9,12,15,18].includes(parseInt(v)) ? v : ''} />
    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} unit=" kWh" width={40} />
    <Tooltip formatter={(v: number) => [`${v.toFixed(2)} kWh`, 'Geração']} />
    <defs>
      <linearGradient id="solarGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.4} />
        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}   />
      </linearGradient>
    </defs>
    <Area type="monotone" dataKey="kWh"
      stroke="#f59e0b" strokeWidth={2}
      fill="url(#solarGradient)" />
  </AreaChart>

  <p className="text-[10px] text-slate-600 text-center mt-1">
    Pico estimado: {Math.max(...dailyProfile).toFixed(2)} kWh às 12h
    · HSP {hsp[selectedMonth].toFixed(1)} kWh/m²/dia
  </p>
</div>
```

---

## 7. Painel D — Banco de Créditos Acumulados

**Componente:** `simulation/CreditBankChart.tsx` (existente no SimulationGroup — promover)

### 7.1 Cálculo

```typescript
const cumulativoData = useMemo(() => {
  let saldo = 0;
  return geracaoMensal.map((g, i) => {
    saldo += g - consumoComCargas[i];
    return { mes: MESES[i], saldo };
  });
}, [geracaoMensal, consumoComCargas]);

const mesBreaakEven = cumulativoData.findIndex(d => d.saldo >= 0);
```

### 7.2 Gráfico

```tsx
<div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
  <p className="text-xs text-slate-500 mb-3">Banco de créditos acumulado (kWh)</p>

  <AreaChart data={cumulativoData} height={160}>
    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
    <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 10 }} />
    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} unit=" kWh" width={48} />
    <ReferenceLine y={0} stroke="#475569" strokeDasharray="2 2" />
    <Tooltip formatter={(v: number) =>
      [`${v.toFixed(0)} kWh ≈ R$ ${(Math.abs(v) * tariffRate).toFixed(0)}`, 'Saldo']} />
    <defs>
      <linearGradient id="posGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%"  stopColor="#14b8a6" stopOpacity={0.3} />
        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}   />
      </linearGradient>
      <linearGradient id="negGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0}   />
        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.3} />
      </linearGradient>
    </defs>
    <Area type="monotone" dataKey="saldo"
      stroke="#14b8a6" strokeWidth={2}
      fill="url(#posGrad)" />
  </AreaChart>

  {mesBreaakEven >= 0 && (
    <p className="text-[10px] text-teal-400/70 text-center mt-1">
      Saldo positivo a partir de {MESES[mesBreaakEven]}
    </p>
  )}
</div>
```

---

## 8. Faixa CTA

```tsx
<div className="mt-auto pt-2 border-t border-slate-800">
  {canApprove ? (
    <div className="flex items-center justify-between px-4 py-3
                    bg-teal-900/20 rounded-lg border border-teal-700/30">
      <div className="flex items-center gap-2">
        <CheckCircle size={16} className="text-teal-400" />
        <span className="text-sm text-teal-400">Dimensionamento completo</span>
      </div>
      <button
        onClick={handleApprove}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30
                   border border-emerald-600/30 text-emerald-400 text-sm rounded-lg transition-colors">
        Aprovar sistema
        <CheckCircle size={14} />
      </button>
    </div>
  ) : (
    <div className="px-4 py-3 bg-slate-900 rounded-lg border border-slate-800">
      <p className="text-xs text-slate-500">
        Complete os blocos de módulos e inversor para habilitar a aprovação.
      </p>
    </div>
  )}
</div>
```

`canApprove` derivado do `systemCompositionSlice`:
```typescript
const canApprove =
  consumptionBlock.status === 'complete' &&
  moduleBlock.status === 'complete' &&
  inverterBlock.status !== 'error';
```

---

## 9. Arquivos

| Arquivo | Status |
|---------|--------|
| `canvas-views/SimulationCanvasView.tsx` | **[MODIFICAR]** — reestruturar + motor correto |
| `canvas-views/simulation/GenerationConsumptionChart.tsx` | **[MODIFICAR]** — 3 visões + motor |
| `canvas-views/simulation/DailyGenerationChart.tsx` | **[NOVO]** |
| `canvas-views/simulation/CreditBankChart.tsx` | **[MODIFICAR/EXTRAIR]** do SimulationGroup |
| `canvas-views/simulation/SimulationKPICards.tsx` | **[NOVO]** |

---

## 10. Critérios de Aceitação

- [ ] Geração de fevereiro < geração de março no mesmo projeto (DAYS_IN_MONTH correto)
- [ ] Verificação: 4.88 kWp · HSP jan 5.2 · PR 0.80 · 31 dias → geração jan = 4.88 × 5.2 × 31 × 0.80 = 629 kWh (±1%)
- [ ] Alternância entre 3 visões do gráfico sem recarregar dados (mesmo `useMemo`)
- [ ] Tabela exibe 8 colunas com totalizadores corretos no rodapé
- [ ] Curva diária muda ao selecionar outro mês (diferença visível jan vs jul)
- [ ] Economia mensal inclui desconto do custo de disponibilidade ANEEL
- [ ] CTA "Aprovar sistema" visível apenas quando todos os blocos obrigatórios completos
- [ ] `tsc --noEmit` → EXIT CODE 0

---

## Referências

- Motor analítico: `spec-motor-analitico-faturado-2026-04-10.md`
- Visões múltiplas: `spec-02-visoes-multiplas-geracao-consumo-2026-04-11.md`
- Curva diária: `spec-01-curva-geracao-diaria-2026-04-11.md`
- `systemCompositionSlice`: `spec-compositor-blocos-2026-04-15.md` §4
- Guardião de aprovação: `spec-guardiao-aprovacao-2026-04-15.md`

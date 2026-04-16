# Spec — ConsumptionCanvasView

**Arquivo alvo:** `canvas-views/ConsumptionCanvasView.tsx`
**Tipo:** Feature Nova
**Módulo:** `engineering` — CenterCanvas
**Prioridade:** P0
**Responsável:** `the-builder`
**Revisor:** `engenheiro-eletricista-pv` + `design-lead`
**Data:** 2026-04-15
**Ativada por:** `activeFocusedBlock === 'consumption'`
**Cor de acento:** Amber — `text-amber-400` / `border-amber-500/30`

---

## 1. Propósito

A ConsumptionCanvasView é o raio-x do problema do cliente. É aqui que o integrador
entende o consumo, simula cargas futuras e vê o kWp alvo se calcular em tempo real.
Não é um formulário — é uma sala de análise. O integrador entra com dados brutos e
sai sabendo exatamente que sistema precisa construir.

**Estado do bloco correspondente:** quando esta view está ativa, o Bloco Consumo
no LeftOutliner tem `ring-2 shadow-[0_0_12px_rgba(245,158,11,0.4)]`. Tudo que muda
aqui reflete imediatamente no bloco.

---

## 2. Layout — sem header

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ┌──────────────────────────────────┬──────────────────────────────┐   │
│  │                                  │                              │   │
│  │  PAINEL A                        │  PAINEL B                    │   │
│  │  Perfil de Consumo               │  Correlação Climática        │   │
│  │  (60% da largura)                │  (40% da largura)            │   │
│  │                                  │                              │   │
│  └──────────────────────────────────┴──────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  PAINEL C — Cargas Simuladas                                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  PAINEL D — Fator de Crescimento                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  FAIXA DE RESULTADO — kWp alvo + CTA                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

Container: `h-full overflow-y-auto bg-slate-950 p-4 flex flex-col gap-4`
Painéis A+B: `grid grid-cols-[3fr_2fr] gap-4`

---

## 3. Painel A — Perfil de Consumo

**Componente:** `consumption/ConsumptionChart.tsx`

### 3.1 Campo de entrada rápida (topo do painel)

```tsx
<div className="flex items-center gap-3 mb-4 p-3 bg-slate-900 rounded-lg border border-amber-500/20">
  <Zap size={14} className="text-amber-400 shrink-0" />
  <span className="text-xs text-slate-400">Consumo médio mensal</span>
  <input
    type="number"
    value={averageConsumption}
    onChange={e => setAverageConsumption(Number(e.target.value))}
    className="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-1
               text-sm text-white text-right focus:border-amber-500 focus:outline-none"
    min={1} placeholder="kWh"
  />
  <span className="text-xs text-slate-500">kWh/mês</span>
</div>
```

**Action:** `useSolarStore(s => s.clientData.setAverageConsumption)`.
Ao alterar: redistribui proporcionalmente pelos 12 meses mantendo o padrão sazonal
existente. Se todos os meses forem iguais, aplica o valor diretamente.

**Estado vazio** (`averageConsumption === 0`): campo com borda âmbar piscante e
placeholder "Informe o consumo para dimensionar".

### 3.2 Gráfico ComposedChart

```tsx
<ComposedChart data={chartData} height={220}>
  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
  <XAxis dataKey="mes" tick={{ fill: '#94a3b8', fontSize: 11 }} />
  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} unit=" kWh" width={52} />
  <Tooltip content={<CustomConsumptionTooltip />} />

  {/* Consumo base */}
  <Bar dataKey="consumoBase" stackId="a" fill="#f59e0b" opacity={0.85} radius={[0,0,0,0]} />

  {/* Cargas simuladas empilhadas */}
  <Bar dataKey="cargasSimuladas" stackId="a" fill="#fbbf24" opacity={0.4} radius={[3,3,0,0]} />

  {/* Linha de média */}
  <ReferenceLine y={media} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.5} />
</ComposedChart>
```

**Dados derivados:**
```typescript
const chartData = useMemo(() => MESES.map((mes, i) => ({
  mes,
  consumoBase: monthlyConsumption[i],
  cargasSimuladas: simulatedItems.reduce((sum, item) => {
    const kwh = (item.potenciaW * item.horasDia * item.diasMes) / 1000;
    const ativo = item.perfil === 'constante'
      || (item.perfil === 'verao'   && [0,1,2,9,10,11].includes(i))
      || (item.perfil === 'inverno' && [4,5,6,7].includes(i));
    return sum + (ativo ? kwh : 0);
  }, 0),
})), [monthlyConsumption, simulatedItems]);
```

**Interatividade — edição por mês:**
Cada barra é clicável. Click abre um `Popover` posicionado abaixo da barra:

```tsx
<Popover open={editingMonth === i} onOpenChange={open => !open && setEditingMonth(null)}>
  <PopoverTrigger asChild>
    <rect className="cursor-pointer" onClick={() => setEditingMonth(i)} />
  </PopoverTrigger>
  <PopoverContent className="w-48 p-3 bg-slate-800 border-slate-700">
    <p className="text-xs text-slate-400 mb-2">{MESES[i]}</p>
    <input
      autoFocus
      type="number"
      defaultValue={monthlyConsumption[i]}
      onBlur={e => {
        updateMonthlyConsumption(i, Number(e.target.value));
        setEditingMonth(null);
      }}
      className="w-full bg-slate-900 border border-amber-500 rounded px-2 py-1 text-sm text-white"
    />
  </PopoverContent>
</Popover>
```

**Tooltip customizado:**
```typescript
interface TooltipPayload { mes: string; consumoBase: number; cargasSimuladas: number }
// Exibe: mês, consumo base, cargas, total, variação vs média (+12% / -8%)
```

### 3.3 Stores consumidos

```typescript
const monthlyConsumption  = useSolarStore(s => s.clientData.monthlyConsumption);
const averageConsumption  = useSolarStore(s => s.clientData.averageConsumption);
const simulatedItems      = useSolarStore(s => s.clientData.simulatedItems);
const setAverageConsumption  = useSolarStore(s => s.clientData.setAverageConsumption);
const updateMonthlyConsumption = useSolarStore(s => s.clientData.updateMonthlyConsumption);
```

---

## 4. Painel B — Correlação Climática

**Componente:** `consumption/ClimateCorrelationChart.tsx`
**Condição de renderização:** `weatherData?.monthlyAvgTemp` disponível.

### 4.1 Gráfico dual-axis

```tsx
<ComposedChart data={climateData} height={220}>
  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
  <XAxis dataKey="mes" tick={{ fill: '#94a3b8', fontSize: 11 }} />

  {/* Eixo esquerdo: kWh */}
  <YAxis yAxisId="kwh" orientation="left"
    tick={{ fill: '#94a3b8', fontSize: 11 }} unit=" kWh" width={52} />

  {/* Eixo direito: °C */}
  <YAxis yAxisId="temp" orientation="right"
    tick={{ fill: '#f97316', fontSize: 11 }} unit="°C" width={36} />

  <Tooltip content={<ClimateTooltip />} />

  {/* Barras de consumo — eixo esquerdo */}
  <Bar yAxisId="kwh" dataKey="consumo" fill="#f59e0b" opacity={0.7} radius={[3,3,0,0]} />

  {/* Linha de temperatura — eixo direito */}
  <Line yAxisId="temp" type="monotone" dataKey="tempMedia"
    stroke="#f97316" strokeWidth={2} dot={{ r: 3, fill: '#f97316' }} />
</ComposedChart>
```

**Dados:**
```typescript
const climateData = useMemo(() => MESES.map((mes, i) => ({
  mes,
  consumo: monthlyConsumption[i],
  tempMedia: weatherData?.monthlyAvgTemp?.[i] ?? null,
})), [monthlyConsumption, weatherData]);
```

**Fallback** quando `weatherData` indisponível:

```tsx
<div className="h-[220px] flex flex-col items-center justify-center
                bg-slate-900/50 rounded-lg border border-dashed border-slate-700">
  <Thermometer size={24} className="text-slate-600 mb-2" />
  <p className="text-xs text-slate-500 text-center">
    Dados climáticos não disponíveis
    <br />para {clientData.city}
  </p>
  <p className="text-[10px] text-slate-600 mt-1">
    Temperatura mínima padrão: −5°C (conservador)
  </p>
</div>
```

### 4.2 Legenda inline (abaixo do gráfico)

```tsx
<div className="flex gap-4 mt-2 text-[10px] text-slate-500">
  <span className="flex items-center gap-1">
    <span className="w-3 h-3 rounded-sm bg-amber-400/70 inline-block" />
    Consumo kWh
  </span>
  <span className="flex items-center gap-1">
    <span className="w-4 h-0.5 bg-orange-400 inline-block" />
    Temperatura média °C
  </span>
</div>
```

---

## 5. Painel C — Cargas Simuladas

**Componente:** `consumption/SimulatedLoadsPanel.tsx`

### 5.1 Interface do tipo

```typescript
interface LoadItem {
  id: string;
  nome: string;
  potenciaW: number;
  horasDia: number;
  diasMes: number;
  perfil: 'constante' | 'verao' | 'inverno';
}

// kWh/mês calculado:
const calcKwh = (item: LoadItem) =>
  (item.potenciaW * item.horasDia * item.diasMes) / 1000;
```

### 5.2 Renderização da lista

```tsx
<div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
  {/* Lista de itens */}
  {simulatedItems.map(item => (
    <div key={item.id}
      className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/50
                 last:border-0 hover:bg-slate-800/40 group">

      {/* Nome + perfil */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 truncate">{item.nome}</p>
        <p className="text-[10px] text-slate-500 mt-0.5">
          {item.horasDia}h/dia · {item.diasMes} dias
        </p>
      </div>

      {/* Badge de perfil */}
      <span className={cn(
        'text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold',
        item.perfil === 'constante' && 'bg-slate-700 text-slate-300',
        item.perfil === 'verao'     && 'bg-amber-900/40 text-amber-400',
        item.perfil === 'inverno'   && 'bg-sky-900/40 text-sky-400',
      )}>
        {item.perfil}
      </span>

      {/* kWh */}
      <span className="text-sm font-mono text-amber-400 w-20 text-right">
        {calcKwh(item).toFixed(0)} kWh
      </span>

      {/* Ações (visíveis no hover) */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditingItem(item.id)}
          className="p-1 hover:text-amber-400 text-slate-500">
          <Pencil size={12} />
        </button>
        <button onClick={() => removeLoadItem(item.id)}
          className="p-1 hover:text-red-400 text-slate-500">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  ))}

  {/* Total */}
  {simulatedItems.length > 0 && (
    <div className="flex justify-between items-center px-4 py-2 bg-slate-800/50">
      <span className="text-xs text-slate-400">Total cargas simuladas</span>
      <span className="text-sm font-mono text-amber-400">
        + {totalCargasKwh.toFixed(0)} kWh/mês
      </span>
    </div>
  )}
</div>
```

### 5.3 Formulário de adição inline

Sempre visível abaixo da lista (não modal, não colapsável):

```tsx
<div className="mt-3 p-3 bg-slate-900/60 rounded-lg border border-dashed border-slate-700">
  <p className="text-[10px] text-slate-500 mb-3 uppercase tracking-wider">
    Adicionar carga
  </p>

  <div className="grid grid-cols-2 gap-2 mb-2">
    <input placeholder="Nome da carga"
      value={form.nome} onChange={e => setForm(f => ({...f, nome: e.target.value}))}
      className="col-span-2 input-dark text-sm" />

    <input placeholder="Potência (W)" type="number" min={1}
      value={form.potenciaW} onChange={e => setForm(f => ({...f, potenciaW: +e.target.value}))}
      className="input-dark text-sm" />

    <select value={form.perfil} onChange={e => setForm(f => ({...f, perfil: e.target.value as any}))}
      className="input-dark text-sm">
      <option value="constante">Constante</option>
      <option value="verao">Verão</option>
      <option value="inverno">Inverno</option>
    </select>

    <input placeholder="Horas/dia" type="number" min={0.5} max={24} step={0.5}
      value={form.horasDia} onChange={e => setForm(f => ({...f, horasDia: +e.target.value}))}
      className="input-dark text-sm" />

    <input placeholder="Dias/mês" type="number" min={1} max={31}
      value={form.diasMes} onChange={e => setForm(f => ({...f, diasMes: +e.target.value}))}
      className="input-dark text-sm" />
  </div>

  {/* Preview do kWh antes de confirmar */}
  {form.potenciaW > 0 && form.horasDia > 0 && form.diasMes > 0 && (
    <p className="text-xs text-amber-400/80 mb-2">
      ≈ {calcKwh(form as LoadItem).toFixed(0)} kWh/mês
    </p>
  )}

  <button
    onClick={handleAddItem}
    disabled={!form.nome || form.potenciaW <= 0}
    className="w-full py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/30
               text-amber-400 text-xs rounded-md transition-colors disabled:opacity-30">
    + Adicionar
  </button>
</div>
```

**Action:** `addLoadItem(form)` no `solarStore.clientData`.

---

## 6. Painel D — Fator de Crescimento

```tsx
<div className="flex items-center gap-4 px-4 py-3 bg-slate-900 rounded-lg border border-slate-800">
  <TrendingUp size={14} className="text-amber-400 shrink-0" />
  <span className="text-xs text-slate-400 w-40 shrink-0">
    Crescimento projetado
  </span>
  <input
    type="range" min={0} max={50} step={5}
    value={loadGrowthFactor}
    onChange={e => setLoadGrowthFactor(Number(e.target.value))}
    className="flex-1 accent-amber-500"
  />
  <span className="text-sm font-mono text-amber-400 w-10 text-right">
    {loadGrowthFactor}%
  </span>
  {loadGrowthFactor > 0 && (
    <span className="text-[10px] text-slate-500">
      +{((kWpAlvo * loadGrowthFactor) / 100).toFixed(2)} kWp
    </span>
  )}
</div>
```

**Action:** `journeySlice.setLoadGrowthFactor(v)`.
Ao mover: `kWpAlvo` recalcula via:
```typescript
const consumoMedio = mean(monthlyConsumption) * (1 + loadGrowthFactor / 100);
const kWpAlvo = (consumoMedio * 12) / (hsp * 365 * pr);
```

---

## 7. Faixa de Resultado — kWp alvo + CTA

Faixa fixa no final do scroll (`sticky bottom-0` ou simplesmente last element):

```tsx
<div className="mt-auto pt-2 border-t border-slate-800">
  <div className="flex items-center justify-between px-4 py-3
                  bg-slate-900 rounded-lg border border-amber-500/20">

    {/* Resultado */}
    <div className="flex items-center gap-4">
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">kWp alvo</p>
        <p className="text-xl font-bold text-amber-400">
          {kWpAlvo > 0 ? `${kWpAlvo.toFixed(2)} kWp` : '—'}
        </p>
      </div>
      <div className="border-l border-slate-700 pl-4">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Consumo total</p>
        <p className="text-sm font-mono text-slate-300">
          {totalConsumoMensal.toFixed(0)} kWh/mês
        </p>
      </div>
    </div>

    {/* CTA */}
    {kWpAlvo > 0 && (
      <button
        onClick={() => setFocusedBlock('module')}
        className="flex items-center gap-2 px-4 py-2 bg-sky-600/20 hover:bg-sky-600/30
                   border border-sky-600/30 text-sky-400 text-sm rounded-lg transition-colors">
        Selecionar módulo
        <Sun size={14} />
      </button>
    )}
  </div>
</div>
```

---

## 8. Estado vazio completo

Quando `averageConsumption === 0` e `simulatedItems.length === 0`:

```tsx
<div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
  <div className="p-4 rounded-full bg-amber-500/10">
    <Zap size={32} className="text-amber-500/60" />
  </div>
  <div>
    <p className="text-slate-300 font-medium">Nenhum consumo informado</p>
    <p className="text-sm text-slate-500 mt-1 max-w-xs">
      Informe o consumo médio mensal acima para calcular o kWp alvo do sistema.
    </p>
  </div>
</div>
```

---

## 9. Arquivos

| Arquivo | Status |
|---------|--------|
| `canvas-views/ConsumptionCanvasView.tsx` | **[NOVO]** — orquestrador |
| `canvas-views/consumption/ConsumptionChart.tsx` | **[NOVO]** |
| `canvas-views/consumption/ClimateCorrelationChart.tsx` | **[NOVO]** |
| `canvas-views/consumption/SimulatedLoadsPanel.tsx` | **[NOVO]** |

---

## 10. Critérios de Aceitação

- [ ] Editar consumo médio → 12 barras redistribuem proporcionalmente → kWp alvo atualiza em < 100ms
- [ ] Clicar em barra de março → Popover abre → editar → bloco Consumo no Left atualiza
- [ ] Adicionar "Ar-cond 350W · 8h · 20 dias · verão" → gráfico soma nas barras de jan, fev, out, nov, dez → kWp alvo sobe
- [ ] Slider crescimento 20% → kWp alvo = base × 1.20
- [ ] CTA "Selecionar módulo" visível apenas quando `kWpAlvo > 0`; click → canvas desliza para MapCore
- [ ] `weatherData` ausente → Painel B mostra fallback, não quebra
- [ ] Estado vazio não mostra gráficos em branco — mostra o empty state descritivo
- [ ] `tsc --noEmit` → EXIT CODE 0

---

## Referências

- `spec-sincronia-bloco-canvas-2026-04-15.md` §4 — definição original desta view
- `spec-jornada-integrador-2026-04-15.md` §2.3 — fórmula do kWpAlvo
- `core/state/slices/journeySlice.ts` — `loadGrowthFactor`, `kWpAlvo`
- `solarStore.clientData` — `monthlyConsumption`, `simulatedItems`, actions
- `spec-motor-analitico-faturado-2026-04-10.md` — perfis sazonais de carga

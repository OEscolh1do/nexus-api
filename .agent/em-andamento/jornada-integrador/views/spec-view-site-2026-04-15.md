# Spec — SiteCanvasView

**Arquivo alvo:** `canvas-views/SiteCanvasView.tsx`
**Tipo:** Refatoração
**Módulo:** `engineering` — CenterCanvas
**Prioridade:** P1
**Responsável:** `the-builder`
**Revisor:** `design-lead`
**Data:** 2026-04-15
**Ativada por:** aba "Site" no WorkspaceTabs (sem bloco vinculado)
**Cor de acento:** Violet — `text-violet-400` / `border-violet-500/30`

---

## 1. Propósito

A SiteCanvasView é a folha de rosto técnica do projeto. Um dossiê read-only que
reúne numa única tela tudo que define o contexto físico da instalação: quem é o
cliente, onde é, qual a infraestrutura elétrica, como é a irradiação local, qual a
temperatura mínima histórica (crítica para o Voc de inverno) e qual é o estado atual
do dimensionamento.

Nenhum campo é editável aqui. A view é puramente de leitura e referência. Isso a
torna segura para mostrar ao cliente durante uma visita sem risco de edição acidental.

---

## 2. Layout — sem header

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ┌──────────────────────────┬────────────────────────────────────────┐  │
│  │  CARD: Cliente           │  CARD: Infraestrutura                  │  │
│  └──────────────────────────┴────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────┬────────────────────────────────────────┐  │
│  │  CARD: Irradiação        │  CARD: Temperatura                     │  │
│  └──────────────────────────┴────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  CARD: Dimensionamento Atual (espelho dos blocos)                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  FAIXA DE AÇÕES — links para edição                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

Container: `h-full overflow-y-auto bg-slate-950 p-4 flex flex-col gap-4`
Grid superior 2 colunas: `grid grid-cols-2 gap-4`

---

## 3. Card: Cliente

```tsx
<div className="bg-slate-900 rounded-lg border border-slate-800 p-4">

  {/* Identificação */}
  <div className="flex items-start justify-between mb-4">
    <div>
      <p className="text-lg font-semibold text-slate-100">{clientData.clientName}</p>
      <p className="text-sm text-slate-400 mt-0.5">
        {clientData.city}, {clientData.state}
      </p>
    </div>
    <div className="p-2 rounded-lg bg-violet-900/30 border border-violet-700/30">
      <User size={16} className="text-violet-400" />
    </div>
  </div>

  {/* Coordenadas */}
  {clientData.lat && clientData.lng && (
    <div className="flex items-center gap-2 mb-3 text-xs text-slate-500">
      <MapPin size={12} className="text-violet-400 shrink-0" />
      <span className="font-mono">
        {clientData.lat.toFixed(5)}°, {clientData.lng.toFixed(5)}°
      </span>
    </div>
  )}

  {/* Endereço se disponível */}
  {clientData.address && (
    <p className="text-xs text-slate-500">{clientData.address}</p>
  )}
</div>
```

---

## 4. Card: Infraestrutura

```tsx
<div className="bg-slate-900 rounded-lg border border-slate-800 p-4">

  <div className="flex items-center gap-2 mb-4">
    <Plug size={14} className="text-violet-400" />
    <p className="text-sm font-medium text-slate-200">Infraestrutura elétrica</p>
  </div>

  <div className="space-y-3">

    {/* Conexão */}
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">Tipo de ligação</span>
      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', {
        'bg-amber-900/30 text-amber-400':   clientData.connectionType === 'monofasico',
        'bg-sky-900/30 text-sky-400':        clientData.connectionType === 'bifasico',
        'bg-violet-900/30 text-violet-400': clientData.connectionType === 'trifasico',
      })}>
        {clientData.connectionType === 'monofasico' ? 'Monofásico' :
         clientData.connectionType === 'bifasico'   ? 'Bifásico'   : 'Trifásico'}
      </span>
    </div>

    {/* Distribuidora */}
    {clientData.distributorName && (
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Distribuidora</span>
        <span className="text-xs text-slate-300">{clientData.distributorName}</span>
      </div>
    )}

    {/* Tarifa */}
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">Tarifa</span>
      <span className="text-sm font-mono text-slate-200">
        R$ {clientData.tariffRate.toFixed(4)}/kWh
      </span>
    </div>

    {/* Custo de disponibilidade */}
    <div className="flex items-center justify-between border-t border-slate-800 pt-2">
      <span className="text-xs text-slate-500">Custo disponibilidade ANEEL</span>
      <span className="text-xs text-slate-400">
        {clientData.connectionType === 'monofasico' ? '30' :
         clientData.connectionType === 'bifasico'   ? '50' : '100'} kWh/mês
      </span>
    </div>
  </div>
</div>
```

---

## 5. Card: Irradiação

**Componente:** `site/IrradiationSparkline.tsx` (novo)

```tsx
<div className="bg-slate-900 rounded-lg border border-slate-800 p-4">

  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <Sun size={14} className="text-amber-400" />
      <p className="text-sm font-medium text-slate-200">Irradiação solar</p>
    </div>
    <div className="text-right">
      <p className="text-lg font-bold font-mono text-amber-400">
        {hspMedioAnual.toFixed(2)}
      </p>
      <p className="text-[10px] text-slate-500">kWh/m²/dia (média)</p>
    </div>
  </div>

  {/* Sparkline 12 meses */}
  <div className="h-20">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={hspData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
        <YAxis hide domain={[0, 'dataMax + 0.5']} />
        <Tooltip
          cursor={{ fill: '#1e293b' }}
          formatter={(v: number) => [`${v.toFixed(2)} kWh/m²/dia`, '']} />
        <Bar dataKey="hsp" fill="#f59e0b" opacity={0.8} radius={[2,2,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>

  {/* Meses extremos */}
  <div className="flex justify-between mt-2 text-[10px] text-slate-500">
    <span>
      ↓ mín: <span className="text-amber-400/70">{hspMin.value.toFixed(2)}</span> ({hspMin.mes})
    </span>
    <span className="text-slate-600">Fonte: CRESESB/SunData</span>
    <span>
      ↑ máx: <span className="text-amber-400">{hspMax.value.toFixed(2)}</span> ({hspMax.mes})
    </span>
  </div>
</div>
```

**Dados:**
```typescript
const monthlyIrradiation = useSolarStore(s => s.clientData.monthlyIrradiation);
const hspData = MESES.map((mes, i) => ({ mes, hsp: monthlyIrradiation[i] }));
const hspMedioAnual = monthlyIrradiation.reduce((a, b) => a + b, 0) / 12;
const hspMin = hspData.reduce((min, d) => d.hsp < min.value ? { value: d.hsp, mes: d.mes } : min,
  { value: Infinity, mes: '' });
const hspMax = hspData.reduce((max, d) => d.hsp > max.value ? { value: d.hsp, mes: d.mes } : max,
  { value: -Infinity, mes: '' });
```

---

## 6. Card: Temperatura

**Componente:** `site/TemperatureSparkline.tsx` (novo)

```tsx
<div className="bg-slate-900 rounded-lg border border-slate-800 p-4">

  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <Thermometer size={14} className="text-blue-400" />
      <p className="text-sm font-medium text-slate-200">Temperatura histórica</p>
    </div>
    <div className="text-right">
      <p className="text-lg font-bold font-mono text-blue-400">
        {tMinAnual.toFixed(0)}°C
      </p>
      <p className="text-[10px] text-red-400/80">mínima histórica (Voc)</p>
    </div>
  </div>

  {weatherData ? (
    <>
      {/* Sparkline Tmin */}
      <div className="h-20">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={tempData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
            <Tooltip formatter={(v: number) => [`${v.toFixed(1)}°C`, 'Tmin']} />
            {/* Linha de temperatura mínima */}
            <Line type="monotone" dataKey="tMin"
              stroke="#60a5fa" strokeWidth={2} dot={{ r: 2, fill: '#60a5fa' }} />
            {/* Linha de temperatura média */}
            <Line type="monotone" dataKey="tMedia"
              stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between mt-2 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-4 h-0.5 bg-blue-400 inline-block" /> Tmin mensal
        </span>
        <span className="text-slate-600">Fonte: INMET</span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-0.5 bg-slate-400 inline-block border-dashed border-b" /> Tmédio
        </span>
      </div>

      {/* Destaque da Tmin crítica */}
      <div className="mt-3 px-3 py-2 bg-blue-900/20 rounded border border-blue-700/30">
        <p className="text-[10px] text-blue-300">
          Temperatura mínima histórica: <strong>{tMinAnual.toFixed(1)}°C</strong>
          {' '}— usada para calcular Voc máximo de inverno
        </p>
      </div>
    </>
  ) : (
    /* Fallback sem dados climáticos */
    <div className="flex flex-col items-center justify-center h-20 gap-2">
      <p className="text-xs text-slate-500 text-center">
        Dados climáticos não disponíveis para {clientData.city}
      </p>
      <div className="px-3 py-1.5 bg-slate-800 rounded border border-slate-700">
        <p className="text-[10px] text-slate-400">
          Tmin padrão: <strong className="text-amber-400">−5°C</strong> (conservador)
        </p>
      </div>
    </div>
  )}
</div>
```

**Dados:**
```typescript
const weatherData = useSolarStore(s => s.clientData.weatherData);
const tempData = MESES.map((mes, i) => ({
  mes,
  tMin:   weatherData?.monthlyMinTemp?.[i]  ?? null,
  tMedia: weatherData?.monthlyAvgTemp?.[i]  ?? null,
}));
const tMinAnual = weatherData
  ? Math.min(...weatherData.monthlyMinTemp)
  : -5; // fallback conservador
```

---

## 7. Card: Dimensionamento Atual

Espelho read-only dos blocos do Compositor. Atualiza em tempo real quando o
integrador altera equipamentos nas outras views.

```tsx
<div className="bg-slate-900 rounded-lg border border-slate-800 p-4">

  <div className="flex items-center gap-2 mb-4">
    <Layers size={14} className="text-violet-400" />
    <p className="text-sm font-medium text-slate-200">Dimensionamento atual</p>
    <span className={cn('ml-auto text-xs px-2 py-0.5 rounded-full', {
      'bg-emerald-900/30 text-emerald-400': allBlocksComplete,
      'bg-amber-900/30 text-amber-400':    !allBlocksComplete,
    })}>
      {allBlocksComplete ? '✓ Completo' : 'Em andamento'}
    </span>
  </div>

  <div className="grid grid-cols-3 gap-3">
    <DimCard label="kWp instalado"
      value={`${totalDC.toFixed(2)} kWp`}
      sub={`${totalModules} módulos`}
      color="sky" />
    <DimCard label="Inversor"
      value={inversorAtivo?.model ?? '—'}
      sub={inversorAtivo ? `${inversorAtivo.nominalPower} kW AC` : 'não selecionado'}
      color="emerald" />
    <DimCard label="FDI"
      value={fdi > 0 ? fdi.toFixed(2) : '—'}
      sub={fdi >= 0.8 && fdi <= 1.35 ? 'OK' : fdi > 0 ? 'fora do recomendado' : ''}
      color={fdi >= 0.8 && fdi <= 1.35 ? 'emerald' : fdi > 0 ? 'amber' : 'slate'} />
  </div>

  <div className="grid grid-cols-2 gap-3 mt-3">
    <DimCard label="PR (Perf. Ratio)"
      value={`${(pr * 100).toFixed(0)}%`}
      sub="fator de desempenho"
      color="slate" />
    <DimCard label="Áreas no telhado"
      value={`${areaCount} área${areaCount !== 1 ? 's' : ''}`}
      sub={`${totalAreaM2.toFixed(0)} m² · FDI ${fdiArranjo.toFixed(2)}`}
      color="indigo" />
  </div>
</div>
```

**Dados:** lidos do `systemCompositionSlice` — derivado, sem armazenamento extra.

---

## 8. Faixa de Ações

```tsx
<div className="flex items-center justify-between px-4 py-3
                bg-slate-900 rounded-lg border border-slate-800">
  <p className="text-xs text-slate-500">
    Read-only — dados refletem o estado atual do projeto
  </p>
  <div className="flex gap-2">
    <button
      onClick={() => openModal('clientData')}
      className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700
                 border border-slate-700 text-slate-300 rounded transition-colors">
      Editar dados do cliente
    </button>
    <button
      onClick={() => openModal('settings')}
      className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700
                 border border-slate-700 text-slate-300 rounded transition-colors">
      Premissas de cálculo
    </button>
  </div>
</div>
```

---

## 9. Componente DimCard (utilitário interno)

```tsx
const DimCard = ({ label, value, sub, color }: {
  label: string; value: string; sub: string;
  color: 'sky'|'emerald'|'amber'|'slate'|'indigo';
}) => {
  const colors = {
    sky:     'text-sky-400',
    emerald: 'text-emerald-400',
    amber:   'text-amber-400',
    slate:   'text-slate-300',
    indigo:  'text-indigo-400',
  };
  return (
    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
      <p className="text-[10px] text-slate-500 mb-1">{label}</p>
      <p className={cn('text-sm font-medium truncate', colors[color])}>{value}</p>
      {sub && <p className="text-[10px] text-slate-600 mt-0.5 truncate">{sub}</p>}
    </div>
  );
};
```

---

## 10. Arquivos

| Arquivo | Status |
|---------|--------|
| `canvas-views/SiteCanvasView.tsx` | **[MODIFICAR]** — reestruturar com 5 cards |
| `canvas-views/site/IrradiationSparkline.tsx` | **[NOVO]** |
| `canvas-views/site/TemperatureSparkline.tsx` | **[NOVO]** |

---

## 11. Critérios de Aceitação

- [ ] 5 cards visíveis com dados completos para projeto com `clientData` preenchido
- [ ] Card Temperatura com `weatherData` → sparkline de Tmin + destaque do mínimo anual
- [ ] Card Temperatura sem `weatherData` → fallback "−5°C conservador" visível
- [ ] Card Dimensionamento reflete mudanças em tempo real ao trocar de view e voltar ao Site
- [ ] Nenhum campo editável em toda a view — apenas leitura
- [ ] Botão "Editar dados do cliente" abre `ClientDataModal`
- [ ] Botão "Premissas de cálculo" abre `SettingsModule`
- [ ] `tsc --noEmit` → EXIT CODE 0

---

## Referências

- `SPEC-002-site-context-view.md` — especificação original do dossiê
- `solarStore.clientData` — `clientName`, `city`, `lat/lng`, `monthlyIrradiation`, `weatherData`
- `systemCompositionSlice` — `totalDC`, `fdi`, estado dos blocos
- `ClientDataModal.tsx` — modal de edição existente

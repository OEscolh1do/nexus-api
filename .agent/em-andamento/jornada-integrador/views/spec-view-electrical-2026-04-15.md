# Spec — ElectricalCanvasView

**Arquivo alvo:** `canvas-views/ElectricalCanvasView.tsx`
**Tipo:** Refatoração
**Módulo:** `engineering` — CenterCanvas
**Prioridade:** P0
**Responsável:** `the-builder`
**Revisor:** `engenheiro-eletricista-pv`
**Data:** 2026-04-15
**Ativada por:** `activeFocusedBlock === 'inverter'`
**Cor de acento:** Emerald — `text-emerald-400` / `border-emerald-500/30`

---

## 1. Propósito

A ElectricalCanvasView é a sala de máquinas do dimensionamento. Reúne em um único
espaço tudo que o engenheiro precisa para validar a topologia elétrica: o gráfico de
faixas de tensão, os chips de status em tempo real, a topologia visual de strings, e
os campos de configuração MPPT editáveis diretamente. Nenhuma dessas funcionalidades
precisa de um painel lateral ou modal separado.

**O que muda em relação ao estado atual:** o `VoltageRangeChart` sai do overlay do
`CenterCanvas` e entra como seção principal desta view. O `StringConfigurator` sai
do `LeftOutliner`/`RightInspector` e entra como seção de configuração aqui. O
`ElectricalGroup` existente é absorvido.

---

## 2. Layout — sem header

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ┌──────────────────────────────────┬──────────────────────────────┐   │
│  │                                  │                              │   │
│  │  PAINEL A                        │  PAINEL B                    │   │
│  │  VoltageRangeChart               │  Chips de Validação          │   │
│  │  (50% largura)                   │  + Lista de erros            │   │
│  │                                  │  (50% largura)               │   │
│  └──────────────────────────────────┴──────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  PAINEL C — Topologia de Strings (visual)                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  PAINEL D — Configuração MPPT (campos editáveis por MPPT)       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  FAIXA CTA — status global + ação                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

Container: `h-full overflow-y-auto bg-slate-950 p-4 flex flex-col gap-4`
Painéis A+B: `grid grid-cols-2 gap-4`

---

## 3. Painel A — VoltageRangeChart (promover de overlay)

**Componente:** `VoltageRangeChart.tsx` (existente — mover de overlay para seção)

### 3.1 O que o gráfico mostra

Gráfico de barras horizontais representando as tensões do sistema:

```
Tensão (V)
0                    300        400         600
│                     │          │           │
│──── Vmp Range ──────│          │           │  ← faixa verde (zona útil MPPT)
│   [Vmp_min ←──────────────→ Vmp_max]      │
│                     │          │           │
│── Voc_nominal ─────►│          │           │  ← linha âmbar
│                     │          │           │
│───────────── Voc_max (Tmin) ──►│           │  ← linha vermelha pontilhada
│                     │          │           │
│──────────────────────────── V_max_inv ────►│  ← limite vermelho sólido
│                     │          │           │
```

**Correção de temperatura obrigatória:**
```typescript
// Ler do store — não hardcodar
const minAmbientTemp = useSolarStore(s =>
  s.project.settings?.minHistoricalTemp ?? -5
);
const tempCoeff = selectedModule?.electrical?.tempCoeffVoc ?? -0.0029; // %/°C

// Voc corrigido para temperatura mínima histórica
const Voc_corrigido = Voc_STC * (1 + tempCoeff * (minAmbientTemp - 25));
const Voc_max_string = Voc_corrigido * modulesPerString;
```

### 3.2 Dados de entrada

```typescript
const { inverters } = useTechStore();
const { modules }   = useSolarStore(s => s.modules);
const selectedModule = /* primeiro módulo do inventário */;

// Por MPPT ativo:
const modulesPerString = mpptConfig.modulesPerString;
const Vmp_min_string   = selectedModule.electrical.vmp * modulesPerString * 0.85;
const Vmp_max_string   = selectedModule.electrical.vmp * modulesPerString * 1.10;
const Voc_str          = Voc_corrigido * modulesPerString;
const V_mppt_min       = inverterSpec.mppts[mpptId].vmpptMin;
const V_mppt_max       = inverterSpec.mppts[mpptId].vmpptMax;
const V_max_inv        = inverterSpec.maxInputVoltage;
```

### 3.3 Indicadores de status no gráfico

- Voc_max dentro dos limites → cor esmeralda
- Voc_max > 95% do V_max_inv → cor âmbar (aviso)
- Voc_max > V_max_inv → cor vermelha (erro crítico)
- Vmp fora da faixa MPPT → zona cinza com hachura

### 3.4 Seletor de MPPT

Quando o inversor tem múltiplos MPPTs:
```tsx
<div className="flex gap-1 mb-3">
  {mpptConfigs.map((mppt, i) => (
    <button key={i}
      onClick={() => setSelectedMppt(i)}
      className={cn('text-xs px-3 py-1 rounded',
        selectedMppt === i
          ? 'bg-emerald-600/20 border border-emerald-600/40 text-emerald-400'
          : 'bg-slate-800 border border-slate-700 text-slate-400'
      )}>
      MPPT {i + 1}
    </button>
  ))}
</div>
```

---

## 4. Painel B — Chips de Validação

**Componente:** `electrical/ElectricalValidationSummary.tsx` (novo — extraído do `ElectricalGroup`)

### 4.1 Cards de chips

```tsx
<div className="grid grid-cols-3 gap-2 mb-4">
  <ValidationChip
    label="FDI"
    value={`${fdi.toFixed(2)}`}
    severity={fdi >= 0.8 && fdi <= 1.35 ? 'ok' : fdi > 1.35 ? 'error' : 'warn'}
    detail={`${(fdi * 100).toFixed(0)}% · recom. 80–120%`}
  />
  <ValidationChip
    label="Voc máx"
    value={`${Voc_max_string.toFixed(0)} V`}
    severity={Voc_max_string < V_max_inv * 0.95 ? 'ok'
            : Voc_max_string < V_max_inv ? 'warn' : 'error'}
    detail={`limite: ${V_max_inv} V`}
  />
  <ValidationChip
    label="Isc MPPT"
    value={`${Isc_total.toFixed(1)} A`}
    severity={Isc_total <= Imax_mppt ? 'ok' : 'error'}
    detail={`limite: ${Imax_mppt} A`}
  />
</div>
```

**Componente `ValidationChip`:**
```tsx
const severityStyles = {
  ok:   'bg-emerald-900/30 border-emerald-700/40 text-emerald-400',
  warn: 'bg-amber-900/30  border-amber-700/40  text-amber-400',
  error:'bg-red-900/30    border-red-700/40    text-red-400',
};

<div className={cn('p-3 rounded-lg border', severityStyles[severity])}>
  <p className="text-[10px] text-slate-400 mb-1">{label}</p>
  <p className="text-lg font-bold font-mono">{value}</p>
  <p className="text-[10px] opacity-70 mt-0.5">{detail}</p>
</div>
```

### 4.2 Lista de erros e warnings

```tsx
{validation.messages.length > 0 && (
  <div className="space-y-1">
    {validation.messages.map((msg, i) => (
      <button key={i}
        onClick={() => scrollToMppt(msg.mpptId)}
        className={cn(
          'w-full text-left flex items-start gap-2 px-3 py-2 rounded text-xs',
          'hover:bg-slate-800 transition-colors',
          msg.severity === 'error' ? 'text-red-400' : 'text-amber-400'
        )}>
        {msg.severity === 'error'
          ? <AlertCircle size={12} className="shrink-0 mt-0.5" />
          : <AlertTriangle size={12} className="shrink-0 mt-0.5" />
        }
        {msg.text}
        <ChevronRight size={10} className="ml-auto shrink-0 mt-0.5 opacity-50" />
      </button>
    ))}
  </div>
)}
```

Clicar num item de erro rola a view até o campo relevante no Painel D e destaca o MPPT com `ring-2`.

### 4.3 Botão de troca de inversor

```tsx
<button
  onClick={() => setShowInverterCatalog(true)}
  className="w-full mt-3 flex items-center justify-between px-3 py-2
             bg-slate-800 hover:bg-slate-700 border border-slate-700
             rounded-lg text-sm transition-colors">
  <span className="text-slate-300">{inversorAtivo.model}</span>
  <span className="text-xs text-emerald-400">{inversorAtivo.nominalPower} kW AC</span>
  <ArrowRightLeft size={12} className="text-slate-500 ml-2" />
</button>
```

Abre `InverterCatalogDialog` como overlay (componente existente).

---

## 5. Painel C — Topologia de Strings

**Componente:** `electrical/StringTopologyDiagram.tsx` (novo)

### 5.1 Estrutura visual

```tsx
<div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
  <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">
    Topologia elétrica
  </p>

  {/* Inversor */}
  <div className="flex items-start gap-3">
    <div className="flex flex-col items-center">
      <div className="p-2 bg-emerald-900/30 border border-emerald-700/40 rounded-lg">
        <Cpu size={16} className="text-emerald-400" />
      </div>
      <div className="w-px h-full bg-slate-700 mt-1" />
    </div>
    <div className="flex-1">
      <p className="text-sm text-slate-200 font-medium">{inversor.model}</p>
      <p className="text-xs text-slate-500">{inversor.nominalPower} kW AC</p>

      {/* MPPTs */}
      {mpptConfigs.map((mppt, mpptIdx) => (
        <div key={mpptIdx} className="mt-3 ml-4 border-l-2 border-slate-700 pl-3">
          <p className="text-xs text-slate-400 mb-2">MPPT {mpptIdx + 1}</p>

          {/* Strings */}
          {Array.from({ length: mppt.stringsCount }).map((_, strIdx) => {
            const stringValidation = getStringValidation(mpptIdx, strIdx);
            return (
              <div key={strIdx}
                className={cn(
                  'flex items-center gap-2 mb-1.5 px-2 py-1.5 rounded',
                  'border text-xs',
                  stringValidation.ok
                    ? 'bg-slate-800/50 border-slate-700'
                    : 'bg-red-900/20 border-red-700/40'
                )}>
                {/* Módulos representados como bolinhas */}
                <div className="flex gap-0.5">
                  {Array.from({ length: mppt.modulesPerString }).map((_, m) => (
                    <div key={m}
                      className={cn('w-2 h-2 rounded-sm',
                        stringValidation.ok ? 'bg-sky-500' : 'bg-red-500'
                      )} />
                  ))}
                </div>
                <span className="text-slate-400 ml-1">
                  {mppt.modulesPerString} módulos
                </span>
                <span className="font-mono text-slate-300 ml-auto">
                  Voc {stringValidation.voc.toFixed(0)}V
                </span>
                {!stringValidation.ok && (
                  <AlertCircle size={10} className="text-red-400" />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  </div>
</div>
```

### 5.2 Cálculo de status por string

```typescript
function getStringValidation(mpptIdx: number, strIdx: number) {
  const voc = Voc_corrigido * mpptConfigs[mpptIdx].modulesPerString;
  const vmpMin = selectedModule.electrical.vmp * 0.85 * mpptConfigs[mpptIdx].modulesPerString;
  const vmpMax = selectedModule.electrical.vmp * 1.10 * mpptConfigs[mpptIdx].modulesPerString;
  return {
    voc,
    ok: voc < V_max_inv && vmpMin >= V_mppt_min && vmpMax <= V_mppt_max,
  };
}
```

---

## 6. Painel D — Configuração MPPT

**Componente:** `electrical/MPPTConfigSection.tsx` (novo — absorve StringConfigurator)

### 6.1 Card por MPPT

```tsx
{mpptConfigs.map((mppt, mpptIdx) => (
  <div key={mpptIdx}
    id={`mppt-${mpptIdx}`}
    className={cn(
      'bg-slate-900 rounded-lg border p-4 transition-all',
      highlightedMppt === mpptIdx
        ? 'border-emerald-500/50 ring-1 ring-emerald-500/30'
        : 'border-slate-800'
    )}>

    <p className="text-xs text-emerald-400 font-bold mb-3 uppercase tracking-wider">
      MPPT {mpptIdx + 1}
    </p>

    <div className="grid grid-cols-2 gap-3">
      <MPPTField
        label="Módulos/String"
        value={mppt.modulesPerString}
        min={1} max={30}
        onCommit={v => updateMPPTConfig(inverterId, mppt.mpptId, { modulesPerString: v })}
      />
      <MPPTField
        label="Nº de Strings"
        value={mppt.stringsCount}
        min={1} max={10}
        onCommit={v => updateMPPTConfig(inverterId, mppt.mpptId, { stringsCount: v })}
      />
      <MPPTField
        label="Azimute (°)"
        value={mppt.azimuth ?? 180}
        min={0} max={360}
        onCommit={v => updateMPPTConfig(inverterId, mppt.mpptId, { azimuth: v })}
      />
      <MPPTField
        label="Inclinação (°)"
        value={mppt.inclination ?? 14}
        min={0} max={90}
        onCommit={v => updateMPPTConfig(inverterId, mppt.mpptId, { inclination: v })}
      />
    </div>

    {/* Preview calculado */}
    <div className="mt-3 pt-3 border-t border-slate-800 flex gap-4 text-[10px] text-slate-500">
      <span>Voc string: <strong className="text-slate-300">
        {(Voc_corrigido * mppt.modulesPerString).toFixed(0)} V
      </strong></span>
      <span>Isc total: <strong className="text-slate-300">
        {(selectedModule?.electrical?.isc ?? 0 * mppt.stringsCount).toFixed(1)} A
      </strong></span>
      <span>Potência DC: <strong className="text-slate-300">
        {(selectedModule?.electrical?.pmax ?? 0 * mppt.modulesPerString * mppt.stringsCount / 1000).toFixed(2)} kWp
      </strong></span>
    </div>
  </div>
))}
```

### 6.2 Componente MPPTField

```tsx
interface MPPTFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onCommit: (v: number) => void;
}

const MPPTField: React.FC<MPPTFieldProps> = ({ label, value, min, max, onCommit }) => {
  const [local, setLocal] = useState(String(value));
  useEffect(() => setLocal(String(value)), [value]);

  return (
    <div>
      <p className="text-[10px] text-slate-500 mb-1">{label}</p>
      <input
        type="number"
        value={local}
        min={min} max={max}
        onChange={e => setLocal(e.target.value)}
        onBlur={() => {
          const n = Math.min(max, Math.max(min, Number(local)));
          onCommit(n);
        }}
        onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5
                   text-sm text-white focus:border-emerald-500 focus:outline-none"
      />
    </div>
  );
};
```

**Commit:** `onBlur` ou `Enter`. Nunca a cada keystroke.
**Zundo:** `updateMPPTConfig` está no domínio parcializado — Ctrl+Z funciona.

---

## 7. Faixa CTA

```tsx
<div className="mt-auto pt-2 border-t border-slate-800">
  {globalHealth === 'ok' ? (
    <div className="flex items-center justify-between px-4 py-3
                    bg-emerald-900/20 rounded-lg border border-emerald-700/30">
      <div className="flex items-center gap-2">
        <CheckCircle size={16} className="text-emerald-400" />
        <span className="text-sm text-emerald-400">Sistema elétrico válido</span>
      </div>
      <button
        onClick={() => setFocusedBlock('simulation')}
        className="flex items-center gap-2 px-4 py-2 bg-teal-600/20 hover:bg-teal-600/30
                   border border-teal-600/30 text-teal-400 text-sm rounded-lg transition-colors">
        Ver Simulação
        <BarChart2 size={14} />
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-3 px-4 py-3
                    bg-slate-900 rounded-lg border border-slate-800">
      <AlertCircle size={16} className={
        globalHealth === 'error' ? 'text-red-400' : 'text-amber-400'
      } />
      <span className="text-sm text-slate-400">
        {validation.messages.length} {validation.messages.length === 1 ? 'item' : 'itens'} para revisar
      </span>
    </div>
  )}
</div>
```

---

## 8. Arquivos

| Arquivo | Status |
|---------|--------|
| `canvas-views/ElectricalCanvasView.tsx` | **[MODIFICAR]** — reestruturar layout |
| `canvas-views/electrical/ElectricalValidationSummary.tsx` | **[NOVO]** |
| `canvas-views/electrical/StringTopologyDiagram.tsx` | **[NOVO]** |
| `canvas-views/electrical/MPPTConfigSection.tsx` | **[NOVO]** |
| `components/VoltageRangeChart.tsx` | **[MOVER]** de overlay para seção A |

---

## 9. Critérios de Aceitação

- [ ] VoltageRangeChart usa `minHistoricalTemp` do store — não hardcoded 0°C
- [ ] Alterar módulos/string → VoltageRangeChart e chips atualizam em < 200ms
- [ ] Voc > 95% do limite → chip âmbar + item na lista de erros
- [ ] Voc > limite → chip vermelho + erro clicável que rola até MPPT correspondente
- [ ] `onBlur` no campo MPPT dispara `updateMPPTConfig` — não a cada keystroke
- [ ] Ctrl+Z desfaz alteração no MPPT (Zundo)
- [ ] CTA "Ver Simulação" visível apenas quando `globalHealth === 'ok'`
- [ ] `InverterCatalogDialog` abre ao clicar no botão de troca
- [ ] Multi-MPPT: seletor muda gráfico VoltageRangeChart para o MPPT selecionado
- [ ] `tsc --noEmit` → EXIT CODE 0

---

## Referências

- `VoltageRangeChart` e bug de temperatura: `Especificacao_Engenharia_Funcional.md` §3.1
- `calculateStringMetrics()`: `electricalMath.ts`
- `useElectricalValidation()`: hook existente — `EV` no mapa de stores
- `updateMPPTConfig`: `useTechStore.ts` linha 70
- Reconstrução da validação: `spec_rebuild_electrical_validation.md`
- `spec-sincronia-bloco-canvas-2026-04-15.md` §3 — ativação por bloco

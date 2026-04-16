# Spec — ElectricalCanvasView (Engineering Tool Aesthetic)

**Arquivo alvo:** `canvas-views/ElectricalCanvasView.tsx`
**Tipo:** Refatoração Completa (UX/UI & Layout)
**Módulo:** `engineering` — CenterCanvas
**Prioridade:** P0
**Responsável:** `the-builder` + `design-lead`
**Revisor:** `engenheiro-eletricista-pv`
**Data:** 2026-04-15
**Ativada por:** `activeFocusedBlock === 'inverter'`
**Cor de acento:** Emerald — `text-emerald-400` / `border-emerald-500/30`

---

## 1. Propósito

A `ElectricalCanvasView` é a sala de máquinas do dimensionamento elétrico. Transicionando do modelo de "formulário linear" para o padrão "Engineering Tool Aesthetic", esta view reúne em um único grid denso (75/25) tudo que o engenheiro precisa para validar a topologia elétrica: gráfico de faixas de tensão, chips paramétricos de validação em tempo real e a configuração MPPT com "mini-laudos" inline.

O integrador não precisa abrir modais ou painéis laterais. Tudo respira de forma síncrona com os stores de estado (`techStore`, `solarStore`).

---

## 2. Layout — Engineering Tool Grid (Assimétrico 75/25)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ┌──────────────────────────────────┬──────────────────────────────┐   │
│  │  PAINEL A (Esquerda - 75%)       │  PAINEL B (Direita - 25%)    │   │
│  │                                  │                              │   │
│  │  ┌────────────────────────────┐  │  ┌────────────────────────┐  │   │
│  │  │ Gráfico Voltage Range      │  │  │ Informações do Inversor│  │   │
│  │  │ (Análise Termodinâmica)    │  │  │ + Botão de Troca       │  │   │
│  │  └────────────────────────────┘  │  └────────────────────────┘  │   │
│  │                                  │                              │   │
│  │  ┌────────────────────────────┐  │  ┌────────────────────────┐  │   │
│  │  │ Topologia e Config. MPPT   │  │  │ Diagnósticos e Valid.  │  │   │
│  │  │ (Representação Visual e    │  │  │ Chips: FDI, Voc. Máx   │  │   │
│  │  │  inputs unificados)        │  │  │ Lista de Alertas       │  │   │
│  │  └────────────────────────────┘  │  └────────────────────────┘  │   │
│  │                                  │                              │   │
│  └──────────────────────────────────┴──────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  FAIXA DE RESULTADO CTA — Status de Validação Global            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Container Principal:** `h-full overflow-y-auto bg-slate-950 p-4 flex flex-col gap-4`
**Grid do Canvas:** `grid grid-cols-[3fr_1fr] gap-4 flex-1 items-start`

---

## 3. Painel A — Gráfico de Faixa de Tensão (VoltageRangeChart)

**Componente:** `electrical/VoltageRangeChart.tsx` (Promovido a cidadão de primeira classe no grid principal)

Um gráfico linear/horizontal de alta legibilidade, vital para análise térmica da string operando em temperaturas extremas.

### 3.1 Anatomia e Cores

- **Zonas MPPT:** Faixa verde esmeralda translúcida (`fill: rgba(16, 185, 129, 0.2)`).
- **Limite do Inversor (V_max_inv):** Linha sólida vermelha e fundo de erro translúcido acima do limite.
- **Tensão Máxima Calculada (Voc_max_string em Tmin):** Linha pontilhada (âmbar ou vermelha se ultrapassar limite).
- **Legendas embutidas:** Exibição clara dos valores em cada linha limitante.
- **Microinteração:** Hover exibe o detalhamento do cálculo de temperatura e os coeficientes aplicados.

### 3.2 Cálculos de Engenharia Requeridos

```typescript
// Nunca usar 0°C constante. Puxar do contexto climático/projeto!
const minAmbientTemp = useSolarStore(s => s.project.settings?.minHistoricalTemp ?? -5);
const tempCoeff = selectedModule?.electrical?.tempCoeffVoc ?? -0.0029; // %/°C

// Voc e Vmp corrigidos para temperatura crítica
const Voc_corrigido = Voc_STC * (1 + tempCoeff * (minAmbientTemp - 25));
const Vmp_corrigido_quente = Vmp_STC * (1 - tempCoeff * (maxAmbientTemp - 25)); // Exemplo

const Voc_max_string = Voc_corrigido * modulesPerString; // Total por string
```

---

## 4. Painel A (Bottom) — Topologia e Configuração MPPT

**Componente:** `electrical/MPPTTopologyManager.tsx`

Absorve a responsabilidade do antigo formulário do `LeftOutliner`. Agora, a configuração numérica e a resposta hierárquica (diagrama) acontecem no mesmo componente.

### 4.1 Card por MPPT

Para cada MPPT do inversor, renderizar um bloco distinto.

```tsx
<div className="bg-slate-900 rounded-lg border border-slate-800 p-4 relative overflow-hidden flex flex-col gap-4">
  {/* Header do MPPT e Status */}
  <div className="flex justify-between items-center pb-2 border-b border-slate-800/50">
     <span className="text-xs font-mono text-emerald-400 tracking-widest uppercase">MPPT {mpptIdx + 1}</span>
     <StatusBadge isValid={mpptValid} />
  </div>

  {/* Controles Otimizados (Engineering Aesthetic) */}
  <div className="grid grid-cols-4 gap-3">
    <CompactNumberInput label="Mods/String" value={mppt.modulesPerString} min={1} max={30} onCommit={updateMPPT} />
    <CompactNumberInput label="Qtd Strings" value={mppt.stringsCount} min={0} max={10} onCommit={updateMPPT} />
    <CompactNumberInput label="Azimute (°)" value={mppt.azimuth} min={0} max={360} onCommit={updateMPPT} />
    <CompactNumberInput label="Inclin. (°)" value={mppt.inclination} min={0} max={90} onCommit={updateMPPT} />
  </div>

  {/* Representação Visual da String (Mini-Diagrama) */}
  <div className="bg-slate-950 border border-slate-800/50 rounded p-3">
    <div className="flex flex-col gap-1.5">
      {Array.from({ length: mppt.stringsCount }).map((_, i) => (
         <StringRow visualizador modulos={mppt.modulesPerString} />
      ))}
    </div>
  </div>

  {/* Mini-Laudo Embutido (Resultados estáticos por MPPT) */}
  <div className="flex gap-4 text-[10px] text-slate-500 font-mono mt-1">
     <span>Voc (Tmin): <span className={vocExcede ? 'text-red-400 font-bold' : 'text-slate-300'}>{VocCalculado.toFixed(1)}V</span></span>
     <span>Isc Máx: <span className={iscExcede ? 'text-red-400 font-bold' : 'text-slate-300'}>{IscCalculado.toFixed(1)}A</span></span>
     <span>P. DC: <span className="text-slate-300">{PotenciaMppt.toFixed(2)}kWp</span></span>
  </div>
</div>
```

---

## 5. Painel B (Coluna da Direita) — Contexto & Diagnósticos

A coluna de 25% (ou `1fr`) é focada em leitura e auditoria.

### 5.1 Bloco de Overview do Inversor

```tsx
<div className="bg-slate-900 rounded-lg border border-slate-800 p-4 flex flex-col gap-2">
  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Equipamento Selecionado</p>
  <h3 className="text-sm font-medium text-slate-200">{inversorInfo.fabricante}</h3>
  <h4 className="text-sm text-emerald-400 font-mono truncate cursor-pointer hover:underline" title={inversorInfo.modelo}>{inversorInfo.modelo}</h4>
  
  <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-400">
    <span className="flex justify-between">Potência: <span className="text-slate-300 font-mono">{inversorInfo.potenciaAC} kW</span></span>
    <span className="flex justify-between">V Max: <span className="text-slate-300 font-mono">{inversorInfo.vMax} V</span></span>
    <span className="flex justify-between">Qtd MPPTs: <span className="text-slate-300 font-mono">{inversorInfo.mppts.length}</span></span>
  </div>

  <button onClick={abrirCatalogo} className="mt-3 w-full py-1.5 border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded transition-colors flex items-center justify-center gap-2">
    <RefreshCw size={12} />
    Trocar Inversor
  </button>
</div>
```

### 5.2 Painel Escala de FDI (Fator de Dimensionamento) e Chips

Exibe métricas vitais globais (FDI geral, corrente total vs max)

```tsx
<div className="bg-slate-900 rounded-lg border border-slate-800 p-3 flex flex-col gap-3">
  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Métricas de Dimensionamento</p>
  
  {/* FDI Progress Bar / Chip */}
  <ValidationChip 
    label="FDI Global" 
    value={`${(fdi * 100).toFixed(1)}%`} 
    severity={fdi >= 0.8 && fdi <= 1.35 ? 'ok' : fdi > 1.35 ? 'error' : 'warn'} 
    subtitle="Recomendado: 80% - 135%"
  />

  <div className="grid grid-cols-2 gap-2">
    {/* Outros chips de integridade */}
    <ValidationChipMini label="Voc Máx Sistema" value={`${VocMaxGlobal} V`} severity={VocGlobalStatus} />
    <ValidationChipMini label="Isc Máx Inversor" value={`${IscMaxGlobal} A`} severity={IscGlobalStatus} />
  </div>
</div>
```

### 5.3 Lista de Diagnósticos e Alertas

Mensagens do Motor de Regras do projeto, ordenadas por severidade:

```tsx
<div className="flex-1 min-h-0 overflow-y-auto pr-1">
  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Diagnósticos Ativos</p>
  {alertas.length === 0 ? (
    <div className="text-xs text-slate-500 flex items-center justify-center h-20 border border-dashed border-slate-800 rounded bg-slate-900/50">
      <CheckCircle2 size={16} className="text-emerald-500/50 mr-2" />
      Sem restrições técnicas
    </div>
  ) : (
    <div className="flex flex-col gap-1.5">
       {alertas.map(alerta => (
          <AlertItem key={alerta.id} type={alerta.type} message={alerta.msg} onClick={() => scrollToMppt(alerta.mpptId)} />
       ))}
    </div>
  )}
</div>
```

---

## 6. Faixa de Resultado Inferior (Global Health CTA)

Uma faixa que se prende ao fundo e orienta o próximo estágio da jornada (ou exige ações mitigatórias).

```tsx
<div className="mt-auto pt-4 border-t border-slate-800">
  {isValid ? (
    <div className="flex items-center justify-between px-4 py-3 bg-emerald-900/10 border border-emerald-500/20 rounded-lg">
       <span className="text-sm font-medium text-emerald-400 flex items-center gap-2">
         <CheckCircle size={16} /> Dimensionamento Elétrico Válido
       </span>
       <button className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-sm font-bold rounded shadow-lg transition-all focus:ring-2 focus:ring-emerald-400 focus:outline-none">
         Prosseguir para Simulação Energética
         <ArrowRight size={16} />
       </button>
    </div>
  ) : (
    <div className="flex items-center gap-3 px-4 py-3 bg-red-950/20 border border-red-900/40 rounded-lg">
       <AlertTriangle size={18} className="text-red-500 shrink-0" />
       <span className="text-sm text-red-300">
         Existem restrições técnicas impeditivas. Revise as strings e limites de tensão/corrente para prosseguir.
       </span>
    </div>
  )}
</div>
```

---

## 7. Critérios de Aceitação Arquitetural

1. **Separação de Componentes:** O `VoltageRangeChart`, `TopologyManager` e seções de diagnóstico devem ser arquivos desacoplados na pasta `canvas-views/electrical/` ou de suporte.
2. **Reatividade Híbrida (`solarStore`/`techStore`):** Atualizar módulos/string deve disparar recálculo do "mini-laudo" do MPPT e do `VoltageRangeChart` indiretamente, via estado global da cena. Cuidar estritamente para não desencadear *Render Loops* ou renderizações descontroladas na raiz.
3. **Commit Inteligente:** Inputs numéricos de configuração (como *Módulos por String*) dependem de *Debounce* ou validação `onBlur`/`Enter`. Eles NÃO devem despachar mutations completas a cada *keystroke*, para não degradar a experiência e performance.
4. **Precisão Témica Rigorosa:** O cálculo contínuo do VOC em temperatura mínima e VMP em temperatura máxima (`minHistoricalTemp`) deve extrair seus valores da configuração climática global persistida em vez de ser estática (0°C ou padrão inercial).
5. **No-Modal Policy:** Exceto ao acionar o "Catálogo de Inversores", nenhuma aba ou painel suspenso é permitida. Tudo que governa o dimensionamento elétrico está visível de imediato no Grid (75/25).
6. **Integração de Foco (Scroll & Highlight):** Se houver um alerta informando um erro na capacidade do MPPT 2, o clique nesse alerta rola a tela naturalmente (`scrollIntoView({ behavior: 'smooth' })`) e aplica uma borda momentânea (ex. `ring-2 ring-red-500 animate-pulse500ms`) no respectivo card de MPPT.

---

## Referências Úteis (Domain Canon)

- `spec-view-consumption-2026-04-15.md` — Para consistência direta de Layout UI (Tokens Típicos da "Engineering Tool").
- `kurupira/frontend/src/store/slices/journeySlice.ts` e `techStore` — Mananciais para buscar informações do inventário de Inversores selecionados.
- KIs referenciando cálculos elétricos de limites VMP e Corrente de Curto/Sobrecarga do sistema local!

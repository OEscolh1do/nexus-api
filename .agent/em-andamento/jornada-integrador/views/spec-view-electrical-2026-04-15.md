# Spec — ElectricalCanvasView (Engineering Tool Aesthetic)

**Arquivo alvo:** `canvas-views/ElectricalCanvasView.tsx`
**Tipo:** Refatoração Completa (UX/UI & Layout)
**Módulo:** `engineering` — CenterCanvas
**Prioridade:** P0
**Responsável:** `the-builder`
**Revisor:** `design-lead` / `engenheiro-eletricista-pv`
**Data de Atualização:** 2026-04-18
**Ativada por:** `activeFocusedBlock === 'inverter'`
**Cor de acento:** Emerald — `text-emerald-400` / `border-emerald-500/30`

---

## 1. Propósito

A `ElectricalCanvasView` é a sala de máquinas do dimensionamento elétrico. 
Através da nova estética de **Cockpit de Engenharia**, a visão assimétrica (75/25) obsoleta foi substituída pelo empilhamento estrito de painéis horizontais (`flex-col`), começando pelo Header HUD Travado que não sai do campo de visão do Engenheiro, abrigando a Qualificação Térmica Global.

Todo o diagnóstico de engenharia agora vive organicamente ao lado (no mesmo Grid) do gráfico termodinâmico, garantindo legibilidade tabular absoluta nos rigorosos cálculos exigidos pela *NBR 16690*.

---

## 2. Layout (Cockpit de Engenharia)

```text
┌────────────────────────────────────────────────────────────────────────┐
│  HEADER (Fixo - HUD)                                                   │
│  [Ícone] Dimensionamento Elétrico  |   Diagnóstico Vital               │
│          Inversor: [ Modelo ]      |   [ FDI 118% ] (Emerald)          │
│                                    |   [ Voc Máx 590V ] (Amber/Red)    │
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│  PAINEL 1 — Barra de Premissas e Catálogo Base (Inline)                │
│  [Ícone de status do BD] | [Dropdown Inversor Atual] | [Botão: Trocar] │
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│  PAINEL 2 — Gráfico de Faixa de Tensão (VoltageRangeChart)             │
│  [ ------------------------------|---- Voc Máx (Tmin) ---|------- ]    │
│  Análise Termodinâmica Completa em Full-Width (Maior resolução visual) │
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│  PAINEL 3 — Inventário de MPPTs e Strings (MPPTTopologyManager)        │
│                                                                        │
│  ┌─────────────────────────┐  ┌─────────────────────────┐              │
│  │ MPPT 1     [ OK ]       │  │ MPPT 2     [ ALERT ]    │              │
│  │ [Qty Mod/Sr] [Qtd Strs] │  │ [Qty Mod/Sr] [Qtd Strs] │              │
│  │ [Azimute (°)] [Inclin]  │  │ [Azimute (°)] [Inclin]  │              │
│  │ Mini-Laudo V / A / kWp  │  │ Mini-Laudo V / A / kWp  │              │
│  └─────────────────────────┘  └─────────────────────────┘              │
└────────────────────────────────────────────────────────────────────────┘
```

**Container:** `relative w-full h-full flex flex-col bg-slate-950 overflow-hidden`
Estética focada em `tabular-nums tracking-widest text-[11px] font-black`.

---

## 3. Especificações por Componente

### 3.1 Header HUD
Fixado no topo e blindado ao rolamento.
- Exibe Título da View (Dimensionamento Elétrico).
- Lado esquerdo: Marca e Modelo do inversor Base, retirado do `inversorInfo` do `systemCompositionSlice`.
- Lado direito (HUD Vital): Dois *displays numéricos enormes*:
    1. **FDI (Fator de Dimensionamento do Inversor)** — Verde se 0.8 a 1.35. Âmbar/Vermelho demais.
    2. **Voc Máx da Instalação**, usando `minHistoricalTemp`. Informa instantaneamente se a fronteira mecânica de tensão foi rompida.

### 3.2 Painel 1 — Controle e Equipamento Base
Eliminando a velha aba de detalhes lateral (25%), o Inversor é invocado rapidamente na fita primária.
```tsx
<div className="flex flex-row items-center gap-4 bg-slate-900 border border-slate-800 p-3 rounded-sm">
  <div className="flex-1 max-w-lg flex items-center bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-sm">
     ...
     <span className="text-[11px] font-mono text-emerald-400 truncate">{inversorInfo.modelo} ({inversorInfo.potenciaAC}kW CA)</span>
  </div>
  <div className="w-px h-6 bg-slate-800/60" />
  <button onClick={abrirCatalogo} className="text-[11px] font-bold uppercase tracking-widest text-slate-300 hover:text-white">
    <RefreshCw size={12} className="inline mr-2" /> Trocar Inversor Central
  </button>
</div>
```

### 3.3 Painel 2 — Gráfico Termodinâmico (`VoltageRangeChart`)
Em toda a sua plenitude de largura (sem mais achatamentos a 75%), o gráfico termodinâmico reflete a Voltagem Máxima.
**Engenharia Exata:** Usa-se `minAmbientTemp = s.clientData.weatherData?.monthlyMinTemp` vs `-5°C` (fallback conservador).

### 3.4. Painel 3 — Gestor de Topologia (`MPPTTopologyManager`)
Exibe cada instância MPPT com layout retangular estrito, incorporando simultaneamente Módulos por String e Quantidade de Strings nos inputs frontais, seguidos pelo Laudo Local.

As **Listas de Anomalias Elétricas** (antigos Diagnósticos do painel direito) mudam de posição: se houver alguma anomalia crítica (Ex: Corrente de Curto `Isc` maior que o limite do MPPT 1), renderiza-se um Banner vibrante vermelho/ambar no Rodapé Ativo da Caixa do MPPT comprometido. Essa tática context-aware aumenta exponencialmente a velocidade de troubleshooting visual para o projetista.

---

## 4. Faixa de Resultado (Bottom CTA)
Para prosseguir a jornada, o sistema requer validação verde. Um CTA estático adere à base do *scroll-x* se - e apenas se - todos os Health Checks do inversor passarem sem pendências fatais (permitindo Warnings, mas bloqueando Errors).

---

## 5. Critérios de Aceitação Atualizados
- [x] O Layout desiste do grid simétrico em prol do **Cockpit de Engenharia** puro contínuo e flex-col.
- [x] Header HUD opera os limites centrais `FDI` e `Voc Máxima do Pior Caso` com validação de cor ao vivo.
- [x] A Voltagem é obrigatoriamente vinculada à `Temperatura Mínima Histórica` armazenada durante o Ato 0.
- [x] Os bugs da string isolada acendem o sinal de alarme diretamente na caixa do seu MPPT gerador, sem painéis de log apartados.
- [x] `tsc --noEmit` → EXIT CODE 0

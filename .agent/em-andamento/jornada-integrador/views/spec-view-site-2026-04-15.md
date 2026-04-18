# Spec — SiteCanvasView (Engineering Tool Aesthetic)

**Arquivo alvo:** `canvas-views/SiteCanvasView.tsx`
**Tipo:** Refatoração Completa (UX/UI & Layout)
**Módulo:** `engineering` — CenterCanvas
**Prioridade:** P1
**Responsável:** `the-builder`
**Revisor:** `design-lead` / `engenheiro-eletricista-pv`
**Data de Atualização:** 2026-04-18
**Ativada por:** aba "Site" no WorkspaceTabs (sem bloco vinculado no Flow)
**Cor de acento:** Violet — `text-violet-400` / `border-violet-500/30`

---

## 1. Propósito

A `SiteCanvasView` migrou do modelo fragmentado de "Cards Suspensos" para um **Cockpit de Engenharia** rigoroso e espesso. É um dossiê técnico de leitura (read-only em sua maioria) que compõe a folha de rosto do projeto.  
Consolida métricas-chaves da localidade (Irradiação, Temperaturas extremas, Infraestrutura de conexão) influenciando passivamente o resto do sistema. 

O layout agora é puramente monolítico/`flex-col` contínuo, iniciando com um **Header HUD travado no topo**, seguido de uma **Barra de Premissas** esguia para navegação tática.

---

## 2. Layout (Cockpit de Engenharia)

```text
┌────────────────────────────────────────────────────────────────────────┐
│  HEADER (Fixo - HUD)                                                   │
│  [Ícone] Dossiê Técnico da Planta  |   Aptidão Climática               │
│          Cliente, Cidade/UF        |   [ HSP 0.00 ] kWh/m²/dia         │
│          Status: Em Andamento      |   [ -5.0°C ] Tmin Histórica       │
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│  PAINEL 1 — Configuração e Acesso Rápido (Inline)                      │
│  [Provider Climático: INMET/CRESESB] | [Btn: Dados do Cliente]         │
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│  PAINEL 2 — Infraestrutura Elétrica                                    │
│  [Ligação] [Distribuidora] [Tarifa Base] [Custo Disponibilidade]       │
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│  PAINEL 3 — Dados Termodinâmicos e Climáticos (Data Grids)             │
│  [IrradiationSparkline] [TemperatureSparkline]                         │
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│  PAINEL 4 — Estado do Dimensionamento Atual (Resumo)                   │
│  [kWp Instalado] [Inversor] [FDI] [Performance Ratio]                  │
└────────────────────────────────────────────────────────────────────────┘
```

**Container:** `relative w-full h-full flex flex-col bg-slate-950 overflow-hidden`
Estética base focada em `tabular-nums tracking-widest text-[11px] font-black`.

---

## 3. Especificações por Componente

### 3.1 Header HUD
Fixado no topo com borda forte de separação `border-b border-slate-800`.
- Exibe Título da View (Dossiê Técnico do Local).
- Mostra dinamicamente `clientData.clientName`, `city`, `state` e um *Status Badge* atrelado a `allBlocksComplete`.
- No lado direito (HUD Vital), dois grandiosos displays numéricos (em fonte mono, violeta ou âmbar):
    1. **HSP Médio Regional**
    2. **Temperatura Mínima Histórica (Crítico para Voc)**

### 3.2 Barra de Controle (Painel 1)
Linha flex reduzida e grudada no bottom do Header.
Substitui a antiga "Faixa de Ações" lábios inferiores da página.
```tsx
<div className="flex flex-row items-center gap-4 bg-slate-900 border border-slate-800 p-3 rounded-sm">
  <div className="flex items-center gap-2">
      <label className="text-[11px] text-slate-500 font-black uppercase">Metadados</label>
      <div className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded-sm border border-slate-800">Coord: {clientData.lat?.toFixed(5)}, {clientData.lng?.toFixed(5)}</div>
  </div>
  <div className="w-px h-6 bg-slate-800/60" />
  <button onClick={() => openModal('clientData')} className="text-[11px] font-bold uppercase tracking-widest text-violet-400 hover:text-violet-300">
    Editar Ficha de Cliente
  </button>
</div>
```

### 3.3. Painel 2 — Infraestrutura
Painéis densos na vertical ao invés de dispersos (que perde espaço).
Blocos retangulares, sem bordas flutuantes, focados em tabela.
- `Tipo de ligação` (Monofásico, etc)
- `Distribuidora`
- `Tarifa Fixada`
- `Custo de Disponibilidade Estimado (kWh/mês)`

### 3.4. Painel 3 — Metrologia e Termodinâmica
Absorve os atuais **IrradiationSparkline** e **TemperatureSparkline**, mas retifica o layout deles para gráficos compactos, mono tipográficos e fundo escuro (Night-mode Dashboard), usando `fill="#8b5cf6"` como cor primária do módulo.
- Gráfico de irradiação exibe as 12 barras com o Mínimo e Máximo textual.
- A linha de temperatura estampa claramente a **TMin Mensal**.
*(Nota: O engenheiro que visitar esta etapa não quer "cards fofos", mas uma matriz legível. Focar na visibilidade das marcas D-Mínimo / D-Máximo)*.

### 3.5. Painel 4 — Sumário de Projeto
Mantém a tabela de espelho, mas transicionada para o estilo numérico robusto (igual Painel C do antigo, mas agora como um rodapé contínuo de conteúdo e sem limite estrito de largura).

---

## 4. Integração de Estado

Toda interação invoca a store central (`useSolarStore`, `systemCompositionSlice`):
```typescript
const hspMedioAnual = monthlyIrradiation.reduce((a, b) => a + b, 0) / 12;
const allBlocksComplete = ... // vem do slice de progressão
```

---

## 5. Critérios de Aceitação Atualizados
- [x] O Header carrega a `Temperature Mínima Histórica` nativa calculada do `weatherData`, servindo de *heads-up* constante para o Engenheiro que vai focar em tensão no inversor.
- [x] O layout agora flui de cima para baixo sem rodapés flutuantes que colidam com componentes em telas 1080p, mantendo apenas a aba visual no topo.
- [x] Todas as tipologias de números obedecem a `tabular-nums font-mono text-xs`.
- [x] Sem estados mutáveis espalhados; o único botão invoca `ClientDataModal`.
- [x] `tsc --noEmit` → EXIT CODE 0

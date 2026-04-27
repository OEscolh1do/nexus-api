# Spec — PhysicalCanvas Layer 2: Diagrama de Blocos (Topologia Elétrica)

**Arquivo alvo:** `canvas-views/arrangement/Layer2BlockDiagram.tsx`
**Tipo:** Feature Nova
**Módulo:** `engineering` — `PhysicalCanvasView`
**Camada:** 2 de 3 (leitura + navegação — derivada do grafo da Layer 1)
**Prioridade:** P1 — depende da Layer 1 estar funcional
**Responsável (impl.):** `the-builder`
**Revisor (aceitação):** `engenheiro-eletricista-pv`
**Data de criação:** 2026-04-26
**Versão:** 1.0
**Depende de:** `spec-arrangement-layer1-fisico-stringing-2026-04-26.md`
**Alimenta:** `patch-spec-view-electrical-pv-2026-04-25.md` (validação de mismatch por MPPT)

---

## 1. Propósito

A Layer 2 é uma **vista de consolidação elétrica**. Enquanto a Layer 1 mostra onde os módulos estão fisicamente, a Layer 2 mostra como eles estão agrupados eletricamente — strings, MPPTs e a relação entre áreas de orientação diferente.

É uma camada de **leitura e navegação**, não de edição. O integrador não arrasta nem conecta elementos aqui — usa a Layer 2 para confirmar que a topologia elétrica faz sentido antes de avançar para a validação elétrica.

---

## 2. Contexto Visual

A Layer 2 substitui o tile satelital por um **fundo blueprint de engenharia**:

```
Fundo: bg-slate-950
Grid: linhas em rgba(99,102,241,0.10), espaçamento 24px
Sem imagem satelital — Layer 0 fica oculta quando Layer 2 está ativa
```

A transição entre Layer 1 e Layer 2 aplica:
- `opacity: 0 → 1` no grid blueprint (200ms ease)
- `opacity: 1 → 0` no tile satelital (200ms ease, simultâneo)
- Os blocos de strings e MPPTs surgem com `translateY(8px) → translateY(0)` (250ms, stagger de 30ms por grupo)

---

## 3. Layout do Diagrama

### 3.1 Estrutura geral

O diagrama organiza os elementos em colunas verticais por grupo de orientação. Cada coluna representa uma `PhysicalArrangement` com seu azimute/tilt.

```
╔══════════════════════════════════════════════════════════════════════╗
║  GRID BLUEPRINT (azul-escuro quadriculado)                          ║
║                                                                      ║
║  ┌────────────────────────┐    ┌─────────────────────────┐          ║
║  │ ÁREA 1 — Az 180° / 14° │    │ ÁREA 2 — Az 90° / 14°  │          ║
║  │  (indigo/15% fundo)    │    │  (indigo/15% fundo)     │          ║
║  │                        │    │                         │          ║
║  │  ┌──┬──┬──┬──┬──┐     │    │  ┌──┬──┬──┐            │          ║
║  │  │01│02│03│04│05│     │    │  │01│02│03│            │          ║
║  │  └──┴──┴──┴──┴──┘     │    │  └──┴──┴──┘            │          ║
║  │  ─── String 1 (S1) ──▶│    │  ─── String 3 (S3) ───▶│          ║
║  │                        │    │                         │          ║
║  │  ┌──┬──┬──┬──┬──┐     │    └─────────────────────────┘          ║
║  │  │06│07│08│09│10│     │              │                           ║
║  │  └──┴──┴──┴──┴──┘     │              ▼                           ║
║  │  ─── String 2 (S2) ──▶│        ┌──────────┐                     ║
║  └────────────────────────┘        │  MPPT 2  │                     ║
║              │                     │  S3 (1×) │                     ║
║              ▼                     └──────────┘                     ║
║        ┌──────────┐                      │                          ║
║        │  MPPT 1  │                      │                          ║
║        │  S1+S2   │                      │                          ║
║        │  (2×)    │                      │                          ║
║        └──────────┘                      │                          ║
║              │                           │                          ║
║              └──────────────┬────────────┘                          ║
║                             ▼                                        ║
║                    ┌─────────────────┐                              ║
║                    │    INVERSOR     │                              ║
║                    │  Huawei 5kTL   │                              ║
║                    │  5,0 kW        │                              ║
║                    └─────────────────┘                              ║
╚══════════════════════════════════════════════════════════════════════╝
```

### 3.2 Derivação do layout

O posicionamento dos blocos é calculado pelo algoritmo de Sugiyama simplificado (somente fase de camadas e coordenadas — sem minimização de cruzamentos, pois o grafo de arranjo tipicamente tem < 20 nós):

```typescript
// Camadas do diagrama (top → bottom):
// L0: Blocos de área (PhysicalArrangement agrupados por orientação)
// L1: Blocos de string (StringGroup)
// L2: Blocos de MPPT (MPPTConfig)
// L3: Bloco do inversor

// Espaçamento fixo:
const LAYER_GAP_PX = 80;
const NODE_WIDTH = 120;
const NODE_HEIGHT = 48;
const NODE_H_GAP = 20;
```

Para projetos com múltiplos inversores (quando `inverters.length > 1`), cada inversor ocupa uma coluna independente com seus MPPTs e strings.

---

## 4. Blocos e Conteúdo

### 4.1 Bloco de Área

```
┌────────────────────────────┐
│  ÁREA 1                    │
│  Az: 180°  Incl: 14°       │
│  18 módulos  ·  134 m²     │
│  [Cerâmica]                │
└────────────────────────────┘
```

Fundo: `bg-slate-800 border border-indigo-500/30`
Header em `text-indigo-400 text-[10px] font-mono uppercase tracking-widest`
Subcampo: tipo de superfície como badge pequeno

### 4.2 Bloco de String

```
┌──────────────────────────┐
│  S1  ·  10 módulos       │
│  Voc: 412 V  Isc: 10.2 A │
│  [Az 180° / 14°]  ✅      │
└──────────────────────────┘
```

Fundo: cor da string (rotação de cores: `indigo-900`, `sky-900`, `emerald-900`, `amber-900`)
Badge de status:
- `✅` — string OK e conectada ao MPPT
- `⚠` — string com mismatch de orientação
- `🔴` — string aberta (sem caminho ao inversor)

**Voc e Isc** calculados em tempo real a partir do `ArrangementGraph` e dos valores do módulo selecionado.

### 4.3 Bloco de MPPT

```
┌──────────────────────────┐
│  MPPT 1                  │
│  S1 + S2  (2 strings)    │
│  Voc: 412 V  Isc: 20.4 A │
│  Az 180° / 14°           │
│  [✅ Compatível]          │
└──────────────────────────┘
```

Fundo: `bg-slate-700 border border-emerald-500/30`
Status `Compatível` / `⚠ Mismatch` / `🔴 Erro` derivado de `validateArrangementGraph`.

Quando o MPPT recebe strings de orientações diferentes: status `⚠ Mismatch`, fundo `bg-amber-950/40`, borda `border-amber-500/50`.

### 4.4 Bloco do Inversor

```
┌───────────────────────────────┐
│  🔲  Huawei SUN2000-5KTL      │
│      5,0 kW CA                │
│  MPPT 1: 2 strings            │
│  MPPT 2: 1 string             │
│  [FDI 1,18 ✅]                │
└───────────────────────────────┘
```

Fundo: `bg-slate-800 border border-emerald-500/40`
FDI calculado de `systemCompositionSlice` — mesmo chip da ElectricalCanvasView.

---

## 5. Interatividade

### 5.1 Click em bloco de String

Ao clicar em qualquer bloco de string na Layer 2:
- Painel lateral direito desliza para dentro (width 280px, `translateX(280px) → translateX(0)`, 250ms ease)
- Conteúdo do painel:

```
┌──────────────────────────────────────┐
│  String S1                      [✕] │
│  ─────────────────────────────────  │
│  Módulos:         10               │
│  Voc (STC):      490,0 V           │
│  Voc (frio):     512,3 V  ✅       │
│  Isc:            10,2 A   ✅       │
│  Comprimento:    ~18 m (estimado)  │
│  Área:           Az 180° / 14°     │
│  MPPT destino:   MPPT 1            │
│                                    │
│  [→ Ver no mapa (Layer 1)]         │
│  [→ Validação elétrica]            │
└──────────────────────────────────────┘
```

"Ver no mapa (Layer 1)": retorna para Layer 1 com os módulos da string S1 destacados (borda pulsante branca).

"Validação elétrica": `setFocusedBlock('inverter')` → navega para `ElectricalCanvasView` com MPPT correspondente pré-selecionado.

### 5.2 Click em bloco de MPPT

Painel lateral com dados elétricos do MPPT:

```
┌──────────────────────────────────────┐
│  MPPT 1                         [✕] │
│  ─────────────────────────────────  │
│  Strings conectadas: S1, S2         │
│  Módulos totais: 20                 │
│  Voc máx (frio): 512,3 V  ✅       │
│  Isc total: 20,4 A  ✅             │
│  Orientação única: Az 180° / 14°   │
│  Mismatch: Não detectado           │
│                                    │
│  [→ Validação elétrica completa]   │
└──────────────────────────────────────┘
```

### 5.3 Click em bloco de Área

Retorna para Layer 1 com aquela área em foco (zoom para o bounding box da área).

### 5.4 Hover

Hover em qualquer bloco → `box-shadow: 0 0 0 1px rgba(99,102,241,0.6)` (halo indigo sutil). As arestas conectadas ao bloco ficam em destaque (`stroke-width: 2 → 3`, `opacity: 0.4 → 1`).

---

## 6. Arestas (Conexões entre Blocos)

As arestas são linhas ortogonais (somente segmentos H e V) roteadas pelo mesmo motor A\* da Layer 1, adaptado para o espaço do diagrama de blocos (não georreferenciado).

**Estilo das arestas:**
- Arestas OK: `stroke: rgba(99,102,241,0.6)`, `stroke-width: 1.5`
- Arestas com mismatch: `stroke: rgba(245,158,11,0.8)` (amber), `stroke-dasharray: 4 2`
- Arestas com erro: `stroke: rgba(239,68,68,0.8)` (red), `stroke-dasharray: 2 2`

**Setas de direção:** marcadores de ponta de seta (`<marker>` SVG) indicam o fluxo de corrente (positivo → negativo → MPPT → Inversor).

---

## 7. Alertas Globais da Layer 2

Quando há problemas na topologia, um banner aparece no topo do canvas (abaixo do HUD):

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠  2 strings com orientações mistas no mesmo MPPT             │
│     Isso causa perdas por mismatch. Reorganize os MPPTs.        │
│     [Ver detalhes]                                              │
└─────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────┐
│  🔴  1 módulo desconectado detectado                            │
│     S2 tem 1 módulo sem conexão na Layer 1.                     │
│     [Ir para Layer 1]                                           │
└─────────────────────────────────────────────────────────────────┘
```

Múltiplos alertas empilham verticalmente, ordenados por severidade (erro antes de aviso).

---

## 8. CTA de Avanço

Rodapé fixo da Layer 2:

```
┌─────────────────────────────────────────────────────────────────┐
│  Topologia elétrica OK — 24 módulos em 3 strings, 2 MPPTs      │
│                                [→ Ir para Validação Elétrica]   │
└─────────────────────────────────────────────────────────────────┘
```

O CTA "Ir para Validação Elétrica" executa `setFocusedBlock('inverter')`.

Quando há erros: o CTA fica desabilitado com tooltip "Resolva os erros de topologia antes de avançar". Quando há apenas avisos (mismatch): CTA habilitado com badge `⚠` no texto.

---

## 9. Integração de Estado

```typescript
// Tudo derivado — Layer 2 não escreve no store diretamente

// Leitura do grafo
const arrangements = useSolarStore(s => s.designData.physicalArrangements);
const inverters = useSolarStore(s => s.designData.inverters);
const mpptConfigs = useSolarStore(s => s.designData.mpptConfigs);

// Seletor derivado (systemCompositionSlice)
const blockDiagramData = useBlockDiagramData();
// Retorna: { areas, strings, mpptsWithStrings, inverterNode, validationResult }

// Navegação
const setFocusedBlock = useUIStore(s => s.setFocusedBlock);
const setActiveArrangementLayer = useUIStore(s => s.setActiveArrangementLayer);
```

`useBlockDiagramData` é um seletor memoizado que:
1. Agrupa strings por MPPT e áreas por orientação
2. Calcula Voc e Isc por string usando `ArrangementGraph` + catálogo do módulo
3. Executa `validateArrangementGraph` e retorna o resultado
4. Calcula posições Sugiyama dos blocos no canvas

---

## 10. Critérios de Aceitação

- [ ] Layer 2 renderiza sem tile satelital — apenas grid blueprint
- [ ] Blocos de área, string, MPPT e inversor derivados automaticamente do `ArrangementGraph`
- [ ] Para 2 strings no mesmo MPPT com orientações iguais: bloco MPPT status `✅ Compatível`
- [ ] Para 2 strings no mesmo MPPT com azimutes distintos: bloco MPPT status `⚠ Mismatch`, fundo amber
- [ ] Click em bloco de string abre painel lateral com Voc(frio) e Isc calculados
- [ ] "Ver no mapa (Layer 1)" retorna para Layer 1 com módulos da string destacados
- [ ] "Ir para Validação Elétrica" executa `setFocusedBlock('inverter')` com MPPT pré-selecionado
- [ ] Banner de mismatch aparece quando orientações mistas no mesmo MPPT
- [ ] Banner de erro vermelho aparece quando módulo desconectado detectado
- [ ] CTA desabilitado quando há erros; habilitado com badge `⚠` quando apenas avisos
- [ ] Transição Layer 1 → Layer 2 em 250ms sem flash
- [ ] `tsc --noEmit` → EXIT CODE 0

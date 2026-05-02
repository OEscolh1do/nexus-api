---
name: arranjo-layer-dev
description: >
  Guia de implementação das camadas visuais (Layer 0–3) do PhysicalCanvasView do módulo de arranjo Kurupira. Use esta skill quando trabalhar em: integração Leaflet com mapa satélite/blueprint (Layer 0), ferramentas interativas do canvas como STRING_WIRE, PLACE_MODULE, DRAW_POLYGON e DROP_POINT (Layer 1), painel de diagrama de blocos com detecção de mismatch de orientação (Layer 2), ou esquema elétrico completo com símbolos IEC 60617 / NBR 5444 (Layer 3). Ative também para qualquer tarefa envolvendo: Layer0ContextValue, useLayer0(), useBlockDiagramData(), layout Sugiyama, state machine do STRING_WIRE, Quadtree hit-test, tokens de cor do HUD (indigo/sky/emerald/amber), ou classes CSS .layer-0--blueprint / .layer-0--recon.
---

# Arranjo Layer Dev — Guia de Implementação do PhysicalCanvasView

Você é especialista nas **camadas visuais do PhysicalCanvasView** do Kurupira, SaaS brasileiro para projeto de usinas fotovoltaicas. Este guia cobre as Layers 0–3 do canvas de arranjo.

---

## Visão Geral da Arquitetura

```
PhysicalCanvasView
├── Layer 0 — Mapa Leaflet (modo satélite / blueprint)
├── Layer 1 — Canvas de ferramentas interativas (SVG overlay)
├── Layer 2 — Painel lateral de diagrama de blocos
└── Layer 3 — Esquema elétrico completo (IEC 60617 / NBR 5444)
```

Cada layer é um componente React com seu próprio contexto/hook. As layers devem ser montadas **uma única vez** — evite re-mount em re-renders do pai.

---

## Layer 0 — Leaflet Single-Mount

### Interface de contexto

```typescript
export interface Layer0ContextValue {
  map: L.Map | null;
  mode: 'recon' | 'blueprint';
  setMode: (mode: 'recon' | 'blueprint') => void;
  pixelOrigin: L.Point | null;
  zoom: number;
}

const Layer0Context = React.createContext<Layer0ContextValue | null>(null);

export function useLayer0(): Layer0ContextValue {
  const ctx = useContext(Layer0Context);
  if (!ctx) throw new Error('useLayer0 deve ser usado dentro do Layer0Provider');
  return ctx;
}
```

### Guarda de montagem única

O container do mapa Leaflet deve ser inicializado exatamente uma vez. Use array de deps vazio e cleanup no unmount:

```typescript
useEffect(() => {
  if (!containerRef.current || mapRef.current) return;
  mapRef.current = L.map(containerRef.current, { ... });
  return () => { mapRef.current?.remove(); mapRef.current = null; };
}, []); // ← deps vazio, intencional
// eslint-disable-next-line react-hooks/exhaustive-deps
```

O array vazio é **correto** aqui — o mapa só deve ser criado uma vez, não ao mudar dependências.

### Guarda de lat/lng nulo

Sempre verificar antes de centralizar o mapa:

```typescript
if (lat === null || lng === null) {
  return <div className="layer-0--error">Localização não definida</div>;
}
```

### Classes CSS de filtro visual

Aplicar no elemento container do mapa:

| Classe | Modo | Efeito |
|---|---|---|
| `.layer-0--blueprint` | blueprint | dessaturar + tint azul |
| `.layer-0--recon` | recon | cor total, satélite |

```tsx
<div
  ref={containerRef}
  className={cn(
    'layer-0-container',
    mode === 'blueprint' ? 'layer-0--blueprint' : 'layer-0--recon'
  )}
/>
```

---

## Layer 1 — Canvas de Ferramentas Interativas

### State machine das ferramentas

```
idle
 ├─[ativar DRAW_POLYGON]──→ draw_polygon_active → idle
 ├─[ativar PLACE_MODULE]──→ place_module_active → idle
 ├─[ativar DROP_POINT]────→ drop_point_active   → idle
 └─[ativar STRING_WIRE]───→ string_wire_idle
                                 └─[clicar módulo]──→ string_wire_dragging
                                                        ├─[clicar alvo]──→ string_wire_completed → idle
                                                        └─[Escape/cancel]──→ idle
```

### State machine do STRING_WIRE

```typescript
type StringWireState =
  | { phase: 'idle' }
  | { phase: 'dragging'; sourceId: string; currentVoc: number }
  | { phase: 'completed'; stringId: string };
```

**Cálculo de tensão** durante o drag — usar Voc frio com correção térmica:

```typescript
// N = número de módulos na string em formação (incluindo fonte)
const vocFrio = N * mod.vocStc * (1 + mod.tempCoeffVoc * (weather.tMin - 25));
```

### Tokens de cor do StringWireHUD

Usar classes Tailwind semânticas, **nunca** hex arbitrário:

| Estado | Classe Tailwind | Uso |
|---|---|---|
| OK | `text-emerald-400` | tensão dentro do limite |
| Atenção (>80%) | `text-amber-400` | aproximando do limite |
| Acima do limite | `text-red-400` | excede maxVoc |
| Contador de módulos | `text-sky-300` | badge de contagem |
| Título da ferramenta | `text-indigo-300` | label do cabeçalho |

### Quadtree para hit-test

Usar `d3-quadtree` para hit-test O(log n) durante o drag:

```typescript
const qt = quadtree<ArrangementNode>()
  .x(d => d.pixelX)
  .y(d => d.pixelY)
  .addAll(nodes);

function encontrarModuloMaisProximo(px: number, py: number, raio = 20) {
  return qt.find(px, py, raio) ?? null;
}
```

Reconstruir o quadtree quando os módulos mudarem, **não** a cada movimento do mouse.

### Web Worker de auto-layout

Cálculos pesados de layout (grade de módulos, roteamento de strings) rodam em Web Worker:

```typescript
// workers/autoLayout.worker.ts
self.onmessage = (e: MessageEvent<AutoLayoutInput>) => {
  const result = computeAutoLayout(e.data);
  self.postMessage(result);
};
```

---

## Layer 2 — Painel de Diagrama de Blocos

### Selector de dados

```typescript
// Selector memoizado — recalcula só quando o arranjo muda
export function useBlockDiagramData() {
  const arrangement = useSolarStore(s => s.currentArrangement);
  return useMemo(() => buildBlockDiagramData(arrangement), [arrangement]);
}
```

### Layout: Sugiyama simplificado

Layer 2 usa um Sugiyama **simplificado** (sem minimização completa de cruzamentos). Nós em camadas:
- Módulos → Strings → MPPTs → Inversores (esquerda para direita)

### Estilo de detecção de mismatch

Quando strings de diferentes `arrangementId` (faces do telhado) estão no mesmo MPPT, destacar o nó MPPT com:

```tsx
<div className="bg-amber-950/40 border border-amber-500/50 rounded-md px-3 py-2">
  <span className="text-amber-400 text-xs">Orientações mistas</span>
</div>
```

### Animação do painel lateral

```tsx
<div
  style={{
    transform: isOpen ? 'translateX(0)' : 'translateX(280px)',
    transition: 'transform 250ms ease-in-out',
    width: 280,
  }}
>
```

### Link de navegação para Layer 1

O botão de navegação deve ser em português e referenciar a layer correta:

```tsx
<button onClick={() => setActiveLayer(1)}>
  Ver no mapa (Layer 1)
</button>
```

**Não usar** strings em inglês como "View in map" nem "Ver MPPT no painel elétrico".

---

## Layer 3 — Esquema Elétrico Completo

### Layout: Pipeline Sugiyama completo

Layer 3 roda o algoritmo Sugiyama completo em Web Worker:

```typescript
// workers/sugiyama.worker.ts
import { layeredLayout } from '../lib/sugiyama';

self.onmessage = (e: MessageEvent<SchematicInput>) => {
  const positioned = layeredLayout(e.data.graph);
  self.postMessage(positioned);
};
```

Etapas: remoção de ciclos → atribuição de camadas → minimização de cruzamentos → atribuição de coordenadas.

### Símbolos SVG IEC 60617 / NBR 5444

Cada componente elétrico tem um símbolo SVG canônico:

| Componente | Chave do símbolo | Norma |
|---|---|---|
| Módulo FV | `pv-module` | IEC 60617 |
| String combiner | `combiner-box` | NBR 5444 |
| Seccionador CC | `dc-disconnect` | IEC 60617 |
| Inversor | `inverter` | IEC 60617 |
| Painel CA | `ac-panel` | NBR 5444 |
| Terra | `ground-symbol` | IEC 60617 |

Símbolos ficam em `src/components/arrangement/symbols/`. Importar via registry:

```typescript
import { getSymbol } from '../symbols/registry';
const SymbolComponent = getSymbol('inverter');
```

### Cores dos condutores

| Condutor | Classe de cor | Observação |
|---|---|---|
| CC positivo (CC+) | `stroke-red-500` | linha sólida |
| CC negativo (CC−) | `stroke-blue-500` | linha sólida |
| CA (CA) | `stroke-slate-400` | linha sólida |
| Terra (GND) | `stroke-green-500` | tracejado `strokeDasharray="4 2"` |

---

## Padrões Comuns

### Isolamento de layers

O estado de cada layer vive no seu próprio contexto. Nunca acessar diretamente o contexto de outra layer — comunicar via stores Zustand compartilhados (`useSolarStore`, `useUIStore`).

### Conversão Pixel ↔ LatLng

Sempre usar `map.latLngToContainerPoint()` / `map.containerPointToLatLng()` relativo ao `pixelOrigin` do `Layer0ContextValue`. Não hardcodar offsets de pixel.

### Checklist antes de qualquer mudança em Layer

- [ ] Layer 0 monta uma única vez (verificar contagem de renders no React DevTools)
- [ ] `useLayer0()` lança fora do provider
- [ ] Classes CSS `.layer-0--blueprint` / `.layer-0--recon` aplicadas corretamente
- [ ] STRING_WIRE transita pelas 3 fases sem memory leaks
- [ ] Fórmula do Voc usa `tempCoeffVoc × (Tmin − 25)` (não `Tmin` isolado)
- [ ] Link "Ver no mapa (Layer 1)" está em português
- [ ] Condutores da Layer 3 seguem as cores acima

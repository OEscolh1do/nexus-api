---
name: canvas-layers
description: >
  Implementação visual das 4 layers do PhysicalCanvasView do Kurupira e arquitetura de performance de canvas. Ative ao trabalhar em: Layer 0 (Leaflet satellite/blueprint), Layer 1 (ferramentas SVG: STRING_WIRE, PLACE_MODULE, DRAW_POLYGON, DROP_POINT), Layer 2 (diagrama de blocos visual com BlockDiagramFootprint), Layer 3 (esquema unifilar IEC 60617 / NBR 5444 com Sugiyama), state machines de ferramenta, Quadtree hit-test, Web Workers de layout, ResizeObserver de canvas, undo/redo de cena, ou tokens de cor do HUD.
---

# Skill: Canvas Layers

Implementação visual das 4 layers do `PhysicalCanvasView` do Kurupira + arquitetura de performance para viewports de canvas. Consolidação de `arranjo-layer-dev` e `webgl-architect`.

---

## 1. Arquitetura das Layers

```
PhysicalCanvasView
├── Layer 0 — Mapa Leaflet (satellite / blueprint)
├── Layer 1 — Canvas de ferramentas interativas (SVG overlay)
├── Layer 2 — Painel de Diagrama de Blocos (topologia física)
└── Layer 3 — Esquema Elétrico Completo (IEC 60617 / NBR 5444)
```

Cada layer é um componente React com seu próprio contexto/hook. **Monte uma única vez** — evite re-mount em re-renders do pai. Comunicação entre layers via `useSolarStore` / `useUIStore` exclusivamente.

---

## 2. Layer 0 — Leaflet Single-Mount

```typescript
export interface Layer0ContextValue {
  map: L.Map | null;
  mode: 'recon' | 'blueprint';
  setMode: (mode: 'recon' | 'blueprint') => void;
  pixelOrigin: L.Point | null;
  zoom: number;
}

export function useLayer0(): Layer0ContextValue { ... }
```

**Guarda de montagem única:**
```typescript
useEffect(() => {
  if (!containerRef.current || mapRef.current) return;
  mapRef.current = L.map(containerRef.current, { ... });
  return () => { mapRef.current?.remove(); mapRef.current = null; };
}, []); // deps vazio — intencional e correto
```

**Classes CSS de filtro:**
```tsx
<div className={cn('layer-0-container',
  mode === 'blueprint' ? 'layer-0--blueprint' : 'layer-0--recon'
)} />
```

| Classe | Efeito |
|---|---|
| `.layer-0--blueprint` | dessaturar + tint azul |
| `.layer-0--recon` | cor total, satélite |

**Conversão de coordenadas:** sempre usar `map.latLngToContainerPoint()` / `map.containerPointToLatLng()` relativo ao `pixelOrigin`. Nunca hardcodar offsets de pixel.

---

## 3. Layer 1 — Ferramentas Interativas (SVG)

### State machine das ferramentas

```
idle
 ├─[DRAW_POLYGON]──→ draw_polygon_active → idle
 ├─[PLACE_MODULE]──→ place_module_active → idle
 ├─[DROP_POINT]────→ drop_point_active   → idle
 └─[STRING_WIRE]───→ string_wire_idle
                         └─[clicar módulo]──→ string_wire_dragging
                                              ├─[clicar alvo]──→ completed → idle
                                              └─[Escape]────────→ idle
```

```typescript
type StringWireState =
  | { phase: 'idle' }
  | { phase: 'dragging'; sourceId: string; currentVoc: number }
  | { phase: 'completed'; stringId: string };
```

**Cálculo de Voc durante drag:**
```typescript
const vocFrio = N * mod.vocStc * (1 + mod.tempCoeffVoc * (weather.tMin - 25));
```

### Tokens de cor do HUD

| Estado | Tailwind | Uso |
|---|---|---|
| OK | `text-emerald-400` | tensão dentro do limite |
| Atenção (>80%) | `text-amber-400` | aproximando do limite |
| Excede limite | `text-red-400` | acima do maxVoc |
| Contador de módulos | `text-sky-300` | badge de contagem |
| Label da ferramenta | `text-indigo-300` | cabeçalho |

### Quadtree para hit-test

```typescript
import { quadtree } from 'd3-quadtree';

const qt = quadtree<ArrangementNode>()
  .x(d => d.pixelX).y(d => d.pixelY)
  .addAll(nodes);

// Reconstruir quando módulos mudam — não a cada mousemove
function encontrarModuloMaisProximo(px: number, py: number, raio = 20) {
  return qt.find(px, py, raio) ?? null;
}
```

---

## 4. Layer 2 — Diagrama de Blocos

### Contrato de dados

```typescript
// Selector memoizado — recalcula só quando o arranjo muda
export function useBlockDiagramData() {
  const arrangement = useSolarStore(s => s.currentArrangement);
  return useMemo(() => buildBlockDiagramData(arrangement), [arrangement]);
}
```

### Renderização do bloco de inversor

O bloco do inversor na Layer 2 é gerado a partir do `BlockDiagramFootprint` (ver skill `diagram-engine`):
- **Pinos CC na parte inferior:** N pinos, um por `inputCount` de cada `MPPTChannel`, agrupados por MPPT
- **Pino CA na lateral direita:** 1 pino único
- **Labels dos MPPTs:** exibidos acima de cada grupo de pinos

```
┌─────────────────────────┐
│       INVERSOR          │──── CA (saída)
│  MPPT1    MPPT2         │
└──┬──┬──────┬──┬─────────┘
  PV1 PV2   PV3 PV4
```

### Layout: Sugiyama simplificado

Camadas da esquerda para direita:
```
Módulos → Strings → MPPTs → Inversores
```

### Mismatch de orientação

```tsx
// Strings de diferentes arrangementId no mesmo MPPT
<div className="bg-amber-950/40 border border-amber-500/50 rounded-md px-3 py-2">
  <span className="text-amber-400 text-xs">Orientações mistas</span>
</div>
```

### Botão de navegação

```tsx
<button onClick={() => setActiveLayer(1)}>Ver no mapa (Layer 1)</button>
// NÃO usar inglês. NÃO usar "Ver MPPT no painel elétrico".
```

---

## 5. Layer 3 — Esquema Elétrico (Unifilar)

### Layout: Sugiyama completo (via Web Worker)

```typescript
// workers/sugiyama.worker.ts
self.onmessage = (e: MessageEvent<SchematicInput>) => {
  const positioned = layeredLayout(e.data.graph);
  self.postMessage(positioned);
};
// Etapas: remoção de ciclos → camadas → minimização cruzamentos → coordenadas
```

### Símbolos IEC 60617 / NBR 5444

| Componente | Chave | Norma |
|---|---|---|
| Módulo FV | `pv-module` | IEC 60617 |
| String combiner | `combiner-box` | NBR 5444 |
| Seccionador CC | `dc-disconnect` | IEC 60617 |
| Inversor | `inverter` | IEC 60617 |
| Painel CA | `ac-panel` | NBR 5444 |
| Terra | `ground-symbol` | IEC 60617 |

```typescript
import { getSymbol } from '../symbols/registry';
const SymbolComponent = getSymbol('inverter');
```

### Cores dos condutores

| Condutor | Classe | Observação |
|---|---|---|
| CC+ | `stroke-red-500` | linha sólida |
| CC− | `stroke-blue-500` | linha sólida |
| CA | `stroke-slate-400` | linha sólida |
| GND | `stroke-green-500` | tracejado `strokeDasharray="4 2"` |

---

## 6. Arquitetura de Performance (WebGL / Canvas)

### ResizeObserver — padrão correto

```tsx
const sizeRef = useRef({ w: 0, h: 0 });
useEffect(() => {
  const ro = new ResizeObserver(([entry]) => {
    sizeRef.current = { w: entry.contentRect.width, h: entry.contentRect.height };
  });
  ro.observe(containerRef.current);
  return () => ro.disconnect();
}, []);
// Observar o container pai, NUNCA o canvas diretamente.
// Em R3F: <Canvas resize={{ debounce: 0 }}>
```

### Regra cardinal do render loop

**Nunca** use `setState` dentro de `useFrame` ou loops de animação:
```tsx
useFrame(() => {
  const data = useAppStore.getState().entities[id]; // leitura off-cycle
  meshRef.current.position.set(data.x, data.y, data.z);
  // Sem setState aqui
});
```

### Undo/Redo

| Critério | Solução |
|---|---|
| Operações vetoriais reversíveis, encapsulamento por feature | **Command Pattern** |
| Integração rápida Zustand, menos boilerplate | **Immer Patches** via `zundo` |

Regras para ambos:
- **Parcialize:** exclua estado transiente (mouse pos, menus, painéis colapsados)
- **Agrupe drags:** 1 snapshot no `onPointerUp`, nunca 1 por frame
- **Cap da pilha:** máximo 100 entradas

### Estado Paramétrico

| Critério | Solução |
|---|---|
| Time-travel, serialização, rastreabilidade | **Zustand** normalizado por UUID |
| Formulários densos, folhas isoladas | **Jotai** atômico |

```typescript
// ✅ Zustand normalizado
{ entities: { [uuid]: { depth: 10, parentId: 'abc' } }, childrenMap: { 'abc': ['uuid'] } }
// ❌ nesting profundo
{ project: { inverters: [{ strings: [{ modules: [...] }] }] } }
```

### Web Workers para cálculos pesados

```typescript
// workers/autoLayout.worker.ts
self.onmessage = (e: MessageEvent<AutoLayoutInput>) => {
  const result = computeAutoLayout(e.data);
  self.postMessage(result);
};
// Usar Comlink para expor como métodos async
// SharedArrayBuffer + Atomics para dados massivos (zero-copy)
```

---

## 7. Checklist Obrigatório

- [ ] Layer 0 monta uma única vez (verificar React DevTools)
- [ ] `useLayer0()` lança fora do provider
- [ ] Classes `.layer-0--blueprint` / `.layer-0--recon` aplicadas corretamente
- [ ] `STRING_WIRE` transita pelas 3 fases sem memory leaks
- [ ] Fórmula do Voc no HUD usa `tempCoeffVoc × (Tmin − 25)`
- [ ] Botão de navegação Layer 2 → Layer 1 está em **português**
- [ ] Condutores da Layer 3 seguem as cores definidas acima
- [ ] Bloco do inversor na Layer 2 usa `BlockDiagramFootprint`, não `ParametricSymbolConfig`
- [ ] ResizeObserver observa o container pai, não o canvas
- [ ] `setState` nunca dentro de `useFrame`
- [ ] Grupos de drag geram **1** snapshot no `onPointerUp`

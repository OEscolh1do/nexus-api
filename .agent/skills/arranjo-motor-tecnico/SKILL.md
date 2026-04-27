---
name: arranjo-motor-tecnico
description: >
  Guia do modelo de dados central, tipos TypeScript, stores Zustand e lógica de validação elétrica do módulo de arranjo Kurupira. Use esta skill quando trabalhar em: interfaces do ArrangementGraph (ArrangementNode, StringEdge, StringGroup, MPPTConfig, DropPoint), função validateArrangementGraph() e suas 4 regras (UNCONNECTED_MODULE, VOC_OVERCURRENT, MPPT_ORIENTATION_MISMATCH, POLARITY_CONFLICT), cálculos de tensão térmica (calculateVocCold, calculateVmpHot), stores useSolarStore / useUIStore, ou qualquer camada de dados do engine de arranjo. Ative também para tarefas envolvendo: haversineDistanceM, tempCoeffVoc, maxVocInput, validação de string fotovoltaica, ou regras elétricas de MPPT.
---

# Arranjo Motor Técnico — Modelo de Dados e Validação Elétrica

Você é especialista no **engine de arranjo** do Kurupira, SaaS brasileiro para projeto de usinas fotovoltaicas. Este guia cobre o modelo de dados TypeScript, stores Zustand e regras de validação elétrica.

---

## Modelo de Dados Central

### ArrangementGraph

Estrutura de dados central que representa um arranjo FV completo:

```typescript
export interface ArrangementGraph {
  nodes: ArrangementNode[];
  edges: StringEdge[];
  stringGroups: StringGroup[];
  mpptConfigs: MPPTConfig[];
  dropPoints: DropPoint[];
}
```

### ArrangementNode

Representa um módulo FV posicionado no canvas:

```typescript
export interface ArrangementNode {
  id: string;                        // UUID
  moduleModelId: string;             // referência ao catálogo ModuleModel
  arrangementId: string;             // id da face/sub-área do telhado
  position: { lat: number; lng: number };
  rotation: number;                  // graus, 0–359
  stringGroupId: string | null;      // null = desconectado
  portPositive: PortPosition;
  portNegative: PortPosition;
}

export interface PortPosition {
  side: 'top' | 'right' | 'bottom' | 'left';
  offset: number;                    // 0–1 ao longo do lado
}
```

### StringEdge

Conexão direcionada entre dois terminais de módulos:

```typescript
export interface StringEdge {
  id: string;
  sourceNodeId: string;
  sourcePortPolarity: 'positive' | 'negative';
  targetNodeId: string;
  targetPortPolarity: 'positive' | 'negative';
  stringGroupId: string;
}
```

### StringGroup

String lógica (módulos conectados em série para uma entrada MPPT):

```typescript
export interface StringGroup {
  id: string;
  nodeIds: string[];                 // ordenado, fonte → carga
  mpptConfigId: string | null;
  arrangementId: string;             // deve ser homogêneo para melhor rendimento
}
```

### MPPTConfig

Mapeia entradas MPPT do inversor para grupos de string:

```typescript
export interface MPPTConfig {
  id: string;
  inverterId: string;                // referência ao catálogo InverterModel
  mpptIndex: number;                 // canal MPPT no inversor (base 0)
  stringGroupIds: string[];
}
```

### DropPoint

Ponto de descida CA no canvas (localização do painel/transformador):

```typescript
export interface DropPoint {
  id: string;
  position: { lat: number; lng: number };
  label: string;
  inverterId: string;
}
```

---

## Modelos de Catálogo

### ModuleModel

```typescript
export interface ModuleModel {
  id: string;
  manufacturer: string;
  model: string;
  // Parâmetros elétricos STC
  vocStc: number;          // V — tensão de circuito aberto em STC
  vmpStc: number;          // V — tensão no ponto de máxima potência
  iscStc: number;          // A — corrente de curto-circuito
  pmaxStc: number;         // Wp — potência nominal
  // Coeficientes de temperatura (por °C, negativo para tensão, positivo para corrente)
  tempCoeffVoc: number;    // ex: -0.0029 (−0,29%/°C)
  tempCoeffVmp: number;    // ex: -0.0032
  tempCoeffIsc: number;    // ex: +0.0004
  noct: number;            // °C — temperatura nominal de operação da célula
  // Físico
  widthMm: number;
  heightMm: number;
  weightKg: number;
}
```

### InverterModel

```typescript
export interface InverterModel {
  id: string;
  manufacturer: string;
  model: string;
  maxVocInput: number;     // V — tensão CC máxima absoluta de entrada
  maxVmpInput: number;     // V — limite superior da janela MPPT
  minVmpInput: number;     // V — limite inferior da janela MPPT
  maxIscInput: number;     // A — por canal MPPT
  mpptCount: number;
  stringsPerMppt: number;
  phaseCount: 1 | 3;
  nominalPowerW: number;
}
```

### WeatherData

```typescript
export interface WeatherData {
  tMin: number;   // °C — temperatura ambiente mínima (dia mais frio do ano)
  tMax: number;   // °C — temperatura ambiente máxima (dia mais quente do ano)
}
```

---

## Cálculos Elétricos

### Voc frio (tensão de circuito aberto no pior caso)

Usar esta fórmula **exatamente** — é o que os evals verificam:

```typescript
export function calculateVocCold(
  nModules: number,
  mod: ModuleModel,
  tMin: number
): number {
  const tempDelta = tMin - 25;
  return nModules * mod.vocStc * (1 + mod.tempCoeffVoc * tempDelta);
}
```

`tempCoeffVoc` é uma fração por °C (ex: `−0,0029`), **não** uma porcentagem.

### Vmp quente (verificação do limite inferior MPPT)

```typescript
export function calculateVmpHot(
  nModules: number,
  mod: ModuleModel,
  tAmbMax: number,
  surfaceType: 'open-rack' | 'close-mount' = 'open-rack'
): number {
  // Estimativa de temperatura da célula baseada em NOCT
  const noctOffset = surfaceType === 'close-mount' ? 35 : 20;
  const tCell = tAmbMax + (mod.noct - noctOffset) * 0.8;
  return nModules * mod.vmpStc * (1 + mod.tempCoeffVmp * (tCell - 25));
}
```

### Distância Haversine

```typescript
export function haversineDistanceM(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6_371_000; // raio da Terra em metros — usar esta constante exatamente
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

---

## validateArrangementGraph — 4 Regras

```typescript
export interface ValidationIssue {
  code: string;
  severity: 'error' | 'warning';
  message: string;           // Português — visível ao usuário
  affectedIds: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export function validateArrangementGraph(
  graph: ArrangementGraph,
  mpptConfigs: MPPTConfig[],
  inverters: InverterModel[],
  modules: ModuleModel[],
  weather: WeatherData
): ValidationResult
```

### Regra 1 — UNCONNECTED_MODULE (error)

Todo `ArrangementNode` com `stringGroupId === null` está desconectado:

```typescript
const desconectados = graph.nodes.filter(n => n.stringGroupId === null);
if (desconectados.length > 0) {
  errors.push({
    code: 'UNCONNECTED_MODULE',
    severity: 'error',
    message: `${desconectados.length} módulo(s) não conectado(s) a nenhuma string`,
    affectedIds: desconectados.map(n => n.id),
  });
}
```

### Regra 2 — VOC_OVERCURRENT (error)

Voc frio não pode exceder `inverter.maxVocInput`:

```typescript
for (const sg of graph.stringGroups) {
  const mppt = mpptConfigs.find(m => m.stringGroupIds.includes(sg.id));
  if (!mppt) continue;
  const inverter = inverters.find(inv => inv.id === mppt.inverterId);
  if (!inverter) continue;
  const modModel = modules[0]; // todos os nós da string compartilham o mesmo modelo
  const vocFrio = calculateVocCold(sg.nodeIds.length, modModel, weather.tMin);
  if (vocFrio > inverter.maxVocInput) {
    errors.push({
      code: 'VOC_OVERCURRENT',
      severity: 'error',
      message: `String ${sg.id}: Voc frio ${vocFrio.toFixed(1)} V excede limite do inversor ${inverter.maxVocInput} V`,
      affectedIds: [sg.id],
    });
  }
}
```

### Regra 3 — MPPT_ORIENTATION_MISMATCH (warning)

Strings de diferentes `arrangementId` no mesmo canal MPPT geram perdas por mismatch:

```typescript
for (const mppt of mpptConfigs) {
  const stringsNoMppt = graph.stringGroups.filter(sg =>
    mppt.stringGroupIds.includes(sg.id)
  );
  const arrangementIds = new Set(stringsNoMppt.map(sg => sg.arrangementId));
  if (arrangementIds.size > 1) {
    warnings.push({
      code: 'MPPT_ORIENTATION_MISMATCH',
      severity: 'warning',
      message: `MPPT ${mppt.id}: strings de diferentes orientações (${[...arrangementIds].join(', ')})`,
      affectedIds: [mppt.id],
    });
  }
}
```

### Regra 4 — POLARITY_CONFLICT (error)

Um `StringEdge` deve conectar polaridades opostas:

```typescript
for (const edge of graph.edges) {
  if (edge.sourcePortPolarity === edge.targetPortPolarity) {
    errors.push({
      code: 'POLARITY_CONFLICT',
      severity: 'error',
      message: `Conexão ${edge.id}: mesma polaridade nos dois terminais (${edge.sourcePortPolarity})`,
      affectedIds: [edge.id],
    });
  }
}
```

---

## Stores Zustand

### useSolarStore

Dados persistentes do projeto (salvos no banco):

```typescript
interface SolarState {
  currentArrangement: ArrangementGraph | null;
  moduleModels: ModuleModel[];
  inverterModels: InverterModel[];
  weatherData: WeatherData | null;

  // Actions
  setArrangement: (g: ArrangementGraph) => void;
  addNode: (node: ArrangementNode) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: StringEdge) => void;
  removeEdge: (id: string) => void;
  updateStringGroup: (sg: StringGroup) => void;
}

export const useSolarStore = create<SolarState>()(
  persist(
    (set) => ({ ... }),
    { name: 'kurupira-solar-store' }
  )
);
```

### useUIStore

Estado efêmero da UI (não persiste):

```typescript
interface UIState {
  activeLayer: 0 | 1 | 2 | 3;
  activeTool: 'DRAW_POLYGON' | 'PLACE_MODULE' | 'STRING_WIRE' | 'DROP_POINT' | null;
  selectedNodeIds: string[];
  blockDiagramOpen: boolean;
  stringWireState: StringWireState;

  // Actions
  setActiveLayer: (layer: 0 | 1 | 2 | 3) => void;
  setActiveTool: (tool: UIState['activeTool']) => void;
  setStringWireState: (state: StringWireState) => void;
  toggleBlockDiagram: () => void;
}

export const useUIStore = create<UIState>()((set) => ({ ... }));
```

### Padrões de selector

Sempre selecionar o menor slice para evitar re-renders desnecessários:

```typescript
// Bom — referência estável, re-render só quando currentArrangement muda
const arrangement = useSolarStore(s => s.currentArrangement);

// Bom — dado derivado, memoizado
const contadorModulos = useSolarStore(
  s => s.currentArrangement?.nodes.length ?? 0,
  shallow
);

// Evitar — seleciona a store inteira, re-render a qualquer mudança
const store = useSolarStore(); // ← não fazer isso
```

---

## Invariantes e Restrições

| Invariante | Regra |
|---|---|
| Homogeneidade da string | Todos os nós de um `StringGroup` devem referenciar o mesmo `moduleModelId` |
| Capacidade do MPPT | `stringGroupIds.length <= inverter.stringsPerMppt` |
| Polaridade da edge | `sourcePortPolarity !== targetPortPolarity` |
| Posição do nó | `lat` e `lng` devem ser números finitos, nunca `null` |
| Continuidade da string | `nodeIds` deve formar um caminho em `edges` sem lacunas |

Validar estes invariantes em `validateArrangementGraph()` e também antes de salvar na store.

---

## Checklist de Testes

- [ ] `calculateVocCold` usa `tempCoeffVoc × (tMin − 25)`, não `tMin` isolado
- [ ] `haversineDistanceM` usa `R = 6_371_000`
- [ ] Erro `UNCONNECTED_MODULE` dispara quando `stringGroupId === null`
- [ ] `MPPT_ORIENTATION_MISMATCH` é um `warning`, não um `error`
- [ ] `POLARITY_CONFLICT` verifica `sourcePortPolarity === targetPortPolarity`
- [ ] `VOC_OVERCURRENT` compara contra `inverter.maxVocInput` (não `maxVmpInput`)
- [ ] Selectors da store usam `shallow` onde selecionam múltiplos campos
- [ ] `useSolarStore` persiste; `useUIStore` não persiste

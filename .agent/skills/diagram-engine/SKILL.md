---
name: diagram-engine
description: >
  Motor de dados e contratos de renderização para todos os tipos de diagrama do Kurupira: arranjo físico (ArrangementGraph), bloco paramétrico de inversor (BlockDiagramFootprint), símbolo elétrico unifilar (UnifilarSymbolRef) e validação elétrica de string (validateArrangementGraph). Ative ao trabalhar em: ArrangementNode, StringEdge, StringGroup, MPPTConfig, DropPoint, ParametricSymbolConfig, BlockDiagramFootprint, calculateVocCold, calculateVmpHot, haversineDistanceM, useSolarStore, useUIStore, InverterModel, ModuleModel, ou ao definir o contrato de dados consumido pelas Layers 2 e 3.
---

# Skill: Diagram Engine

Motor de dados e contratos de renderização do Kurupira. Cobre o modelo TypeScript central, stores Zustand, validação elétrica e os contratos que alimentam todos os tipos de diagrama.

---

## 1. Hierarquia dos Diagramas

```
Kurupira — Tipos de Diagrama
├── Arranjo Físico (Layer 1)     → ArrangementGraph
├── Diagrama de Blocos (Layer 2) → BlockDiagramFootprint + useBlockDiagramData()
└── Unifilar (Layer 3)           → UnifilarSymbolRef + símbolos IEC 60617 / NBR 5444
```

**Diferença fundamental (obrigatório entender):**

| Diagrama | Propósito | Bloco do Inversor |
|---|---|---|
| **Diagrama de Blocos** | Topologia física de conexões (quais strings vão em qual entrada) | Caixa com N pinos CC embaixo (um por entrada física) e 1 pino CA em cima |
| **Diagrama Unifilar** | Esquema elétrico normativo (IEC/NBR) | Símbolo normativo com seta diagonal de conversão CC→CA |

---

## 2. ArrangementGraph — Arranjo Físico

```typescript
export interface ArrangementGraph {
  nodes: ArrangementNode[];
  edges: StringEdge[];
  stringGroups: StringGroup[];
  mpptConfigs: MPPTConfig[];
  dropPoints: DropPoint[];
}

export interface ArrangementNode {
  id: string;
  moduleModelId: string;
  arrangementId: string;
  position: { lat: number; lng: number };
  rotation: number;
  stringGroupId: string | null;      // null = desconectado
  portPositive: PortPosition;
  portNegative: PortPosition;
}

export interface StringEdge {
  id: string;
  sourceNodeId: string;
  sourcePortPolarity: 'positive' | 'negative';
  targetNodeId: string;
  targetPortPolarity: 'positive' | 'negative';
  stringGroupId: string;
}

export interface StringGroup {
  id: string;
  nodeIds: string[];
  mpptConfigId: string | null;
  arrangementId: string;
}

export interface MPPTConfig {
  id: string;
  inverterId: string;
  mpptIndex: number;                 // base 0
  stringGroupIds: string[];
}

export interface DropPoint {
  id: string;
  position: { lat: number; lng: number };
  label: string;
  inverterId: string;
}
```

---

## 3. BlockDiagramFootprint — Contrato do Diagrama de Blocos ⭐ NOVO

Este é o contrato canônico para o bloco visual do inversor no Diagrama de Blocos (Layer 2).
Diferente do `ParametricSymbolConfig` (unifilar), mapeia a **topologia física real** de conexões.

```typescript
export interface BlockDiagramFootprint {
  inverterId: string;
  mpptChannels: MPPTChannel[];
  acOutput: {
    label: string;      // ex: "CA 220V"
    phase: 'mono' | 'tri';
  };
}

export interface MPPTChannel {
  mpptIndex: number;          // base 1, para exibição
  inputCount: number;         // pares de bornes +/- físicos neste canal
  inputLabels?: string[];     // ex: ["PV1", "PV2"]
}
```

**Exemplos:**
```typescript
// Growatt 15kW — 2 MPPTs, 2 entradas cada
{ mpptChannels: [
    { mpptIndex: 1, inputCount: 2, inputLabels: ['PV1', 'PV2'] },
    { mpptIndex: 2, inputCount: 2, inputLabels: ['PV3', 'PV4'] },
  ], acOutput: { label: 'CA 220V', phase: 'mono' } }

// SMA Tripower 25kW — 3 MPPTs, 1 entrada cada
{ mpptChannels: [
    { mpptIndex: 1, inputCount: 1 },
    { mpptIndex: 2, inputCount: 1 },
    { mpptIndex: 3, inputCount: 1 },
  ], acOutput: { label: 'CA 380V', phase: 'tri' } }
```

**Onde vive:**
- **Sumaúma** → salvo em `InverterCatalog.blockDiagramFootprint` (JSONB, separado de `symbolConfig`)
- **Kurupira** → lido via `InverterModel.blockDiagramFootprint` para renderizar Layer 2

---

## 4. ParametricSymbolConfig — Símbolo Unifilar

```typescript
export interface ParametricSymbolConfig {
  type: 'parametric-block';
  dimensions: { width: number; height: number };
  ports: Record<PortKey, ParametricPort>;
}

export type PortKey = `mppt_${number}_pos` | `mppt_${number}_neg` | 'ac-out';

export interface ParametricPort {
  side: 'left' | 'right' | 'top' | 'bottom';
  offset: number;
  label: string;
  polarity: 'positive' | 'negative' | 'ac-out';
  mpptIndex?: number;
}
```

---

## 5. Modelos de Catálogo

```typescript
export interface ModuleModel {
  id: string; manufacturer: string; model: string;
  vocStc: number; vmpStc: number; iscStc: number; pmaxStc: number;
  tempCoeffVoc: number;   // fração por °C, ex: -0.0029 (NÃO porcentagem)
  tempCoeffVmp: number; tempCoeffIsc: number;
  noct: number; widthMm: number; heightMm: number; weightKg: number;
}

export interface InverterModel {
  id: string; manufacturer: string; model: string;
  maxVocInput: number;    // V — absoluto
  maxVmpInput: number;    // V — teto MPPT
  minVmpInput: number;    // V — piso MPPT
  maxIscInput: number;    // A — por canal
  mpptCount: number; stringsPerMppt: number;
  phaseCount: 1 | 3; nominalPowerW: number;
  blockDiagramFootprint?: BlockDiagramFootprint;   // ← campo adicionado
  symbolConfig?: ParametricSymbolConfig;
}
```

---

## 6. Cálculos Elétricos Canônicos

```typescript
// Voc frio — pior caso para segurança
export function calculateVocCold(nModules: number, mod: ModuleModel, tMin: number): number {
  return nModules * mod.vocStc * (1 + mod.tempCoeffVoc * (tMin - 25));
}

// Vmp quente — verificação do piso da janela MPPT
export function calculateVmpHot(
  nModules: number, mod: ModuleModel, tAmbMax: number,
  surfaceType: 'open-rack' | 'close-mount' = 'open-rack'
): number {
  const noctOffset = surfaceType === 'close-mount' ? 35 : 20;
  const tCell = tAmbMax + (mod.noct - noctOffset) * 0.8;
  return nModules * mod.vmpStc * (1 + mod.tempCoeffVmp * (tCell - 25));
}

// Distância haversine
export function haversineDistanceM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000; // usar EXATAMENTE esta constante
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
```

---

## 7. validateArrangementGraph — 4 Regras

| Código | Severidade | Condição |
|---|---|---|
| `UNCONNECTED_MODULE` | **error** | `node.stringGroupId === null` |
| `VOC_OVERCURRENT` | **error** | `calculateVocCold(...) > inverter.maxVocInput` |
| `MPPT_ORIENTATION_MISMATCH` | **warning** | strings de diferentes `arrangementId` no mesmo MPPT |
| `POLARITY_CONFLICT` | **error** | `edge.sourcePortPolarity === edge.targetPortPolarity` |

> ⚠️ `MPPT_ORIENTATION_MISMATCH` é **warning**, não error. `VOC_OVERCURRENT` compara contra `maxVocInput`, não `maxVmpInput`.

---

## 8. Stores Zustand

```typescript
// useSolarStore — persiste (kurupira-solar-store)
interface SolarState {
  currentArrangement: ArrangementGraph | null;
  moduleModels: ModuleModel[];
  inverterModels: InverterModel[];
  weatherData: WeatherData | null;
}

// useUIStore — efêmero, não persiste
interface UIState {
  activeLayer: 0 | 1 | 2 | 3;
  activeTool: 'DRAW_POLYGON' | 'PLACE_MODULE' | 'STRING_WIRE' | 'DROP_POINT' | null;
  selectedNodeIds: string[];
  blockDiagramOpen: boolean;
}

// Selector correto — slice mínimo
const arrangement = useSolarStore(s => s.currentArrangement);
// ❌ const store = useSolarStore(); — re-render total
```

---

## 9. Invariantes

| Invariante | Regra |
|---|---|
| Homogeneidade | Todos os nós de um `StringGroup` têm o mesmo `moduleModelId` |
| Capacidade MPPT | `stringGroupIds.length <= inverter.stringsPerMppt` |
| Polaridade | `sourcePortPolarity !== targetPortPolarity` |
| BlockDiagram ≠ Unifilar | `BlockDiagramFootprint.inputCount` e `ParametricSymbolConfig.ports` são modelos **distintos** |

---

## 10. Checklist

- [ ] `calculateVocCold` usa `tempCoeffVoc × (tMin − 25)`, não `tMin` isolado
- [ ] `haversineDistanceM` usa `R = 6_371_000`
- [ ] `MPPT_ORIENTATION_MISMATCH` é `warning`, não `error`
- [ ] `VOC_OVERCURRENT` compara contra `maxVocInput`, não `maxVmpInput`
- [ ] `BlockDiagramFootprint` e `ParametricSymbolConfig` são campos **separados** no catálogo
- [ ] `inputCount` do `MPPTChannel` = entradas físicas (bornes MC4), não lógicas
- [ ] `useSolarStore` persiste; `useUIStore` não persiste

---
name: pv-symbol-renderer
description: >
  Especialista em renderização SVG de símbolos elétricos fotovoltaicos para o Kurupira.
  Ative ao implementar ou modificar símbolos para o Diagrama Unifilar (IEC 60617)
  ou para o Diagrama de Blocos (topologia física/BlockDiagramFootprint). Cobre: registry de símbolos
  (DynamicParametricBlock + estáticos IEC), ParametricSymbolBuilder no Sumaúma,
  regras de simbologia ABNT/IEC, cores de condutores e composição SVG parametrizada.
  Triggers: "desenhar símbolo", "ícone unifilar", "bloco do inversor",
  "registry de símbolos", "ParametricSymbolConfig", "BlockDiagramFootprint", "DynamicParametricBlock",
  Layer 2, Layer 3.
---

# Skill: PV Symbol Renderer

Motor de referência para desenho de símbolos elétricos fotovoltaicos no Kurupira.
Cobre as duas linguagens gráficas usadas no produto: **Diagrama Unifilar** (normativo/IEC)
e **Diagrama de Blocos** (topologia física/hardware).

---

## 1. Dois Mundos, Dois Sistemas de Símbolos

| Dimensão | Unifilar (Layer 3) | Diagrama de Blocos (Layer 2) |
|---|---|---|
| **Propósito** | Esquema elétrico normativo | Topologia física de conexões |
| **Referência** | IEC 60617 / NBR (cancelada: NBR 5444) | Convenção de blocos funcionais |
| **Bloco do Inversor** | Quadrado dividido na diagonal: `=` (CC) + `~` (CA) | Caixa com N pinos CC embaixo + 1 pino CA à direita |
| **Módulo FV** | Fonte de corrente com setas de radiação incidentes | Retângulo rotulado com Pmpp e strings |
| **Condutor CC** | Linha com polaridade `+`/`-` indicada | Linha grossa com label da string (ex: S1, S2) |
| **Dados principais** | `ParametricSymbolConfig` | `BlockDiagramFootprint` |
| **Arquivo de dados** | `symbolConfig` em `InverterCatalog` | `blockDiagramFootprint` em `InverterCatalog` |

> ⚠️ **Invariante hard:** `ParametricSymbolConfig` e `BlockDiagramFootprint` são **campos separados**
> no banco e nunca devem ser misturados ou inferidos um do outro.

---

## 2. Simbologia IEC 60617 — Referência Canônica para o Unifilar

### 2.1 Componentes Obrigatórios e seus Símbolos

| Componente | Descrição do Símbolo IEC | Parâmetro no Diagrama |
|---|---|---|
| **Módulo FV** | Retângulo + setas de radiação incidindo sobre linha inclinada | `Pmpp`, `Voc`, nº de módulos na série |
| **Inversor (UCP)** | Quadrado dividido diagonalmente: metade `=` (CC), metade `~` (CA) | `Pnom`, `mpptCount`, presença de trafo |
| **Fusível CC (gPV)** | Retângulo sólido atravessado por linha central | `Inom`, capacidade de interrupção CC |
| **Chave Seccionadora CC** | Chave aberta com indicação "DC Disconnect" | Manual/automático, fusíveis integrados |
| **DPS CC** | Retângulo com aterramento (varistor) | Classe (Tipo I/II), `Uc`, `In`, `Imax` |
| **DPS CA** | Idem, posicionado no lado CA | Compatível com tensão da rede (ex: 275Vca) |
| **Disjuntor CA** | Interruptor automático térmico + magnético | `Inom`, `Icc`, curva (B/C) |
| **Aterramento (Terra Geral)** | Três linhas horizontais decrescentes | Continuidade das massas |
| **Medidor Bidirecional** | Círculo com setas duplas ou "kWh" | Ponto de entrega da concessionária |
| **Condutores CC** | Linha com `+`/`-`, seção e tipo de isolação | Seção (mm²), NBR 16612 (UV, 1,5kV CC) |
| **Condutores CA** | Linha com Fase/Neutro/Terra | Seção (mm²), NBR 5410 |

### 2.2 Referências Normativas

- **IEC 60617** — Base de símbolos gráficos (≈1.900 símbolos). Referência absoluta após cancelamento da NBR 5444 (2014).
- **ABNT NBR 16690:2019** — Requisitos de projeto para arranjos FV; define chave seccionadora CC, fusíveis gPV, DPS e aterramento.
- **ABNT NBR 5410** — Instalações de baixa tensão; rege o lado CA.
- **ABNT NBR 16149** — Interface de conexão com a rede; proteções ANSI (27, 59, 81U/O, Anti-ilhamento).
- **ABNT NBR 10899** — Terminologia fotovoltaica; usar vocabulário correto nos labels.

### 2.3 Proteções ANSI no Bloco da UCP

```
27  → Subtensão
59  → Sobretensão
81U → Subfrequência
81O → Sobrefrequência
25  → Relé de Sincronismo
Anti-ilhamento → nota técnica vinculada ao bloco
```

---

## 3. ParametricSymbolConfig — Contrato do Unifilar

```typescript
// Fonte canônica: kurupira/frontend/src/core/schemas/inverterSchema.ts

export type PortKey =
  | `mppt_${number}_${'pos' | 'neg'}`
  | 'ac_out';  // ← underscore, NÃO hífen

export interface ParametricPort {
  side: 'top' | 'right' | 'bottom' | 'left';
  offset: number;         // 0..1, fração ao longo do lado
  label: string;          // ex: "MPPT 1 +", "MPPT 1 −", "CA 380V"
  polarity: 'positive' | 'negative' | 'ac-out';
  mpptIndex?: number;     // base 0 (min: 0) — undefined apenas para 'ac_out'
}

export interface ParametricSymbolConfig {
  type: 'parametric-block';
  dimensions: { width: number; height: number };
  ports: Record<string, ParametricPort>; // keys são PortKey
}
```

> ⚠️ **Armadilha crítica:** A `PortKey` para saída CA é `'ac_out'` (underscore)
> em todo o código TypeScript real. A propriedade `polarity` ainda usa o valor
> `'ac-out'` (hífen) — são coisas distintas: a **chave** usa underscore, o **valor** usa hífen.

**Regras de composição SVG do símbolo parametrizado:**
1. O bloco base é um `<rect>` com a diagonal interna: `=` (CC) no triângulo esquerdo/superior, `~` (CA) no triângulo direito/inferior.
2. Cada `PortKey` gera um `<circle>` de pino no lado indicado, posicionado em `offset × ladoHeight`.
3. Labels renderizados como `<text>` em fonte monospace, tamanho mínimo 8px, contraste garantido.
4. Cores dos condutores: CC+ → `stroke-red-500`, CC− → `stroke-blue-500`, CA → `stroke-slate-400`, GND → `stroke-green-500` (tracejado `4 2`).

---

## 4. BlockDiagramFootprint — Contrato do Diagrama de Blocos

```typescript
export interface BlockDiagramFootprint {
  inverterId: string;
  mpptChannels: MPPTChannel[];
  acOutput: {
    label: string;       // ex: "CA 220V", "CA 380V"
    phase: 'mono' | 'tri';
  };
}

export interface MPPTChannel {
  mpptIndex: number;     // base 1 para exibição
  inputCount: number;    // pares de bornes +/− físicos (MC4)
  inputLabels?: string[]; // ex: ["PV1", "PV2"]
}
```

### 4.1 Layout Visual do Bloco de Inversor (Layer 2)

```
┌──────────────────────────────┐
│         INVERSOR             │──── CA (pino lateral direito)
│   MPPT1      MPPT2           │
└──┬──┬──────────┬──┬──────────┘
  PV1 PV2      PV3 PV4
  (pinos CC, agrupados por MPPT, na parte inferior)
```

**Regras de renderização SVG do bloco físico:**
1. **Pinos CC** na borda inferior: N pinos, um por `inputCount` de cada `MPPTChannel`.
2. Pinos de um mesmo MPPT ficam agrupados com label de grupo acima (ex: "MPPT 1").
3. **Pino CA** na borda direita: único, com label do `acOutput.label`.
4. Fundo do bloco: `bg-slate-900/30` com borda `border-slate-700`. Labels: fonte mono 8px.
5. Em caso de `phase === 'tri'`: pino CA com ícone `3φ`; em `mono`: ícone `1φ`.

### 4.2 Exemplos Canônicos

```typescript
// Growatt 15kW — 2 MPPTs, 2 entradas cada, monofásico
{
  mpptChannels: [
    { mpptIndex: 1, inputCount: 2, inputLabels: ['PV1', 'PV2'] },
    { mpptIndex: 2, inputCount: 2, inputLabels: ['PV3', 'PV4'] },
  ],
  acOutput: { label: 'CA 220V', phase: 'mono' }
}

// SMA Tripower 25kW — 3 MPPTs, 1 entrada cada, trifásico
{
  mpptChannels: [
    { mpptIndex: 1, inputCount: 1 },
    { mpptIndex: 2, inputCount: 1 },
    { mpptIndex: 3, inputCount: 1 },
  ],
  acOutput: { label: 'CA 380V', phase: 'tri' }
}

// Huawei SUN2000-100KTL — 10 MPPTs, 2 entradas cada, trifásico
{
  mpptChannels: Array.from({ length: 10 }, (_, i) => ({
    mpptIndex: i + 1, inputCount: 2, inputLabels: [`PV${i*2+1}`, `PV${i*2+2}`]
  })),
  acOutput: { label: 'CA 380V', phase: 'tri' }
}
```

---

## 5. Registry de Símbolos (Layer 3)

> **Caminho real:** `src/modules/engineering/ui/panels/canvas-views/electrical/symbols/registry.ts`

O registry resolve o componente de símbolo correto para um inversor seguindo esta prioridade:

```typescript
import { getSymbol } from '...electrical/symbols/registry';
import type { InverterCatalogItem, PortKey } from '@/core/schemas/inverterSchema';

/**
 * Assinatura real — 3 argumentos:
 * 1. inverterId     — ID do inversor no catálogo
 * 2. catalog        — Array de InverterCatalogItem da store
 * 3. activePortKey? — Porta ativa para highlight (Sugiyama routing)
 */
const SymbolComponent = getSymbol(inverterId, catalog, activePortKey);

// Prioridade 1: symbolConfig.type === 'parametric-block' → DynamicParametricBlock
// Prioridade 2: unifilarSymbolRef → símbolo IEC estático correspondente
// Prioridade 3: fallback garantido → 'inverter-default' (NUNCA retorna undefined)
```

**Símbolos estáticos atualmente registrados:**

```typescript
// STATIC_SYMBOLS em registry.ts (estado atual do codebase)
const STATIC_SYMBOLS: Record<string, StaticSymbol> = {
  'inverter-default': GenericInverterSymbol, // fallback IEC genérico
  // Roadmap: 'inverter-string', 'inverter-micro', 'inverter-hybrid'
};
```

> ⚠️ **O registry atual é focado em inversores.** Símbolos para outros componentes
> (módulo FV, DPS, fusíveis, aterramento) ainda não estão implementados como `StaticSymbol`
> registrados — estão previstos como roadmap para a Layer 3.

**Protocolo para adicionar novo símbolo estático:**
1. Criar o componente SVG em `...electrical/symbols/<NomeDoSimbolo>.tsx`.
   - Usar `React.createElement` (arquivo `.ts`) ou JSX (arquivo `.tsx`).
   - **Nunca hardcodar hex** — usar `currentColor` ou variáveis CSS para `stroke` e `fill`.
2. Exportar como `StaticSymbol = ComponentType<SVGProps<SVGSVGElement>>`.
3. Adicionar ao `STATIC_SYMBOLS` em `registry.ts` com a chave adequada.
4. Atualizar o campo `unifilarSymbolRef` no catálogo do inversor para usar a nova chave.

**Protocolo para o símbolo paramétrico (`DynamicParametricBlock`):**
1. Configurar via `ParametricSymbolBuilder` no **Sumaúma** (`src/components/catalog/ParametricSymbolBuilder.tsx`).
2. O builder persiste um `ParametricSymbolConfig` no campo `symbolConfig` do catálogo.
3. O `registry.ts` detecta `symbolConfig.type === 'parametric-block'` automaticamente e usa `DynamicParametricBlock`.

---

## 6. Sinalização e Segurança (Obrigatório no Diagrama)

Conforme NT.020.EQTL Rev. 05, NBR 16690 e Portaria INMETRO 515/2023, o diagrama **deve indicar** localização das placas:

| Placa | Localização | Texto / Norma |
|---|---|---|
| Advertência no padrão | Junto ao medidor | "CUIDADO: Risco de Choque Elétrico — Geração Própria" |
| Etiqueta Solar CC | Caixas de junção e eletrodutos | "SOLAR c.c." — NBR 16690 |
| Rapid Shutdown | Próximo ao medidor | Ícone cogumelo + símbolo FV — NBR 17193:2025 |
| Conformidade INMETRO | Bloco da UCP no diagrama | Referência ao cert. INMETRO; campo `portaria515Compliant` no schema |

> **Nota:** A Portaria INMETRO nº 140/2022 (inversores ≤10kW) foi sucedida pela **Portaria 515/2023**.
> O schema do Kurupira mantém o campo `portaria515Compliant: boolean` para rastrear essa conformidade.
> Sistemas > 10kW tinham prazo até maio de 2025 para adequação.

---

## 7. Checklist Obrigatório

- [ ] **Unifilar:** símbolo do inversor usa diagonal IEC (`=` / `~`), não bloco genérico
- [ ] **Blocos:** pinos CC na borda **inferior**, pino CA na borda **direita**
- [ ] `ParametricSymbolConfig` e `BlockDiagramFootprint` são campos **separados** no DB
- [ ] `mpptIndex` em `BlockDiagramFootprint` é base **1** (exibição); em `ParametricSymbolConfig.PortKey` é base **0**
- [ ] Cores de condutores: CC+ `red-500`, CC− `blue-500`, CA `slate-400`, GND `green-500` (tracejado)
- [ ] Labels em PT-BR: "MPPT 1", "Entrada CA", "Trifásico" — nunca inglês
- [ ] `getSymbol()` **nunca retorna undefined** — fallback garantido é `'inverter-default'`; não é necessário tratamento de null no renderer
- [ ] Todo símbolo SVG usa `currentColor` — sem hexadecimais hardcoded
- [ ] DPS representado **em paralelo** com o circuito, conectado ao aterramento
- [ ] Proteção CC obrigatória com mais de **2 séries em paralelo** (NBR 16690)

---

## 8. Hard Boundaries — O Que Esta Skill NÃO Faz

- ❌ Não decide a topologia elétrica do projeto (use `dimensionamento-string`)
- ❌ Não valida parâmetros elétricos do inversor (use `validador-ond`)
- ❌ Não gerencia as layers do canvas (use `canvas-layers`)
- ❌ Não implementa o motor de dados/contratos do arranjo (use `diagram-engine`)
- ❌ Não define a infraestrutura de estado Zustand (use `diagram-engine`)

---

## Referências Normativas

| Norma | Escopo |
|---|---|
| IEC 60617 | Base internacional de símbolos gráficos (~1.900 símbolos) |
| ABNT NBR 16690:2019 | Instalações CC de arranjos FV — requisitos de projeto |
| ABNT NBR 5410:2004 | Instalações elétricas de baixa tensão (lado CA) |
| ABNT NBR 16149 | Interface de conexão com a rede (proteções ANSI) |
| ABNT NBR 10899 | Terminologia solar fotovoltaica |
| ABNT NBR 16274 | Comissionamento e documentação executiva |
| NT.020.EQTL Rev.05 | Exigências Equatorial — diagrama e memorial técnico |

# Spec — Bloco de Arranjo Físico no Compositor

**Tipo:** Feature Nova (extensão da spec-compositor-blocos)
**Módulo:** `engineering` — `LeftOutliner`, `projectSlice`, `systemCompositionSlice`, `uiStore`
**Prioridade:** P1 — Crítico (paralelo à spec-sincronia; não bloqueante para a jornada principal)
**Responsável (impl.):** `the-builder`
**Revisor (aceitação):** `engenheiro-eletricista-pv` + `design-lead`
**Data de criação:** 2026-04-14
**Versão:** 2.0 — revisado 2026-04-15
**Supersede:** `spec-bloco-arranjo-fisico-2026-04-14.md` v1.0
**Dependência direta:** `spec-compositor-blocos-2026-04-15.md` — Fase A concluída
                        `spec-sincronia-bloco-canvas-2026-04-15.md` — Etapa 1 concluída

---

## Changelog v2.0

| Seção | Mudança |
|-------|---------|
| Header | Módulo: `ComposerCanvasView` removido — bloco vive no `LeftOutliner` |
| §2.6 | Navegação reescrita: usa `setFocusedBlock('module')` em vez de `uiStore.setActiveCanvasView('map')` diretamente |
| §3 | `ComposerCanvasView.tsx` removido de todos os arquivos afetados |
| §3.1 | Caminho do slice corrigido: `core/stores/` → `core/state/slices/` |
| §3.3 | `ComposerBlockArrangement.tsx` movido para `panels/canvas-views/composer/` dentro do LeftOutliner |
| §4 | Referências ao `RightInspector` e `AreaProperties` via Inspector removidas — edição granular via `MapCore` |
| Referências | Atualizadas para versões v2.0 |

---

## 1. Diagnóstico

### 1.1 Situação atual

O `InstallationArea` é a entidade mais rica do `projectSlice`: suporta polígonos
freeform com vértices editáveis, relação pai-filho com `PlacedModule`, Auto-Layout
inteligente com otimização Portrait/Landscape, e cruzamento físico-lógico com as
strings do `useTechStore`. Toda essa riqueza vive exclusivamente no canvas Leaflet
— o Compositor de Blocos no LeftOutliner não a enxerga.

A consequência é uma lacuna de coerência: o integrador pode estar com todos os chips
verdes (consumo ✓, módulo ✓, inversor ✓) enquanto o canvas Leaflet tem 0 módulos
posicionados no telhado. O sistema parece aprovado mas fisicamente não existe.

O alerta `physicalCount ≠ logicalCount` já existe no `HealthCheckWidget` do
`TopRibbon`, mas é invisível no Compositor — a lacuna não tem representação como bloco.

### 1.2 O problema de representar geometria como bloco

O `InstallationArea` tem representação canônica no canvas Leaflet. Transformá-lo em
bloco cria uma tensão: o bloco é simples por definição, mas o arranjo físico pode ser
complexo — N áreas, formas distintas, orientações por água de telhado.

A resolução certa é expor **apenas o que interessa para avaliação de coerência**: o
arranjo está definido? Quantos módulos posicionados? Eles batem com a topologia
elétrica? Toda edição continua no `MapCore`.

### 1.3 Impacto

| Indicador | Atual | Desejado |
|-----------|-------|---------|
| Coerência físico-lógica visível no Compositor | ❌ | ✅ Chip de consistência |
| Projeto sem áreas identificável no Compositor | ❌ | ✅ Placeholder com acesso ao canvas |
| Métricas de arranjo (área total, FDI) no Compositor | ❌ | ✅ Chips derivados do `projectSlice` |
| Navegação Compositor → canvas para editar | ❌ | ✅ "Editar no mapa" no bloco |

---

## 2. Solução: Bloco de Arranjo Físico no LeftOutliner

### 2.1 Posição na cadeia

Terceira posição — após Módulo FV e antes do Inversor:

```
[⚡ Consumo] → [☀ Módulos FV] → [🗺 Arranjo Físico] → [🔲 Inversor]
                     DC                  físicos                AC
```

O conector `Módulo FV → Arranjo` carrega: `N módulos lógicos`.
O conector `Arranjo → Inversor` carrega: `N posicionados · consistência`.

### 2.2 Anatomia visual

```
┌─ [🗺] Arranjo físico          [3 áreas · 24 módulos] ─┐
│                                                         │
│  [✅ 24 · em sinc]   [Área: 134 m²]                    │
│  [FDI: 0.47 ⚠️]     [Editar no mapa →]                │
└─────────────────────────────────────────────────────────┘
```

**Cor do bloco:** violeta/índigo — distinto de Consumo (âmbar), Módulos (cyan) e
Inversor (esmeralda). Comunicação visual: é o bloco do "espaço físico".

**Estado de foco:** quando `activeFocusedBlock === 'arrangement'`, o bloco recebe
`ring-2 shadow-[0_0_12px_rgba(99,102,241,0.4)]` (índigo). Os outros blocos recuam
para `opacity-40`.

### 2.3 Chips do bloco

| Chip | Fonte de dados | Fórmula | Semáforo |
|------|---------------|---------|----------|
| **Consistência** | `projectSlice` × `useTechStore` | `physicalCount` vs `logicalCount` | Verde se iguais e > 0; Vermelho se divergem (exibe `△N`); Neutro se ambos = 0 |
| **Área total** | `projectSlice.installationAreas` | `Σ shoelaceAreaM2(area.localVertices)` | Neutro (informativo) |
| **FDI** | `placedModules` + `areas` + `moduleSpecs` | `(N_físico × modAreaM²) / totalAreaM²` | Verde ≥ 0.60; Âmbar 0.40–0.59; Vermelho < 0.40 |

**Chip de Consistência — detalhe semântico:**

O chip comunica a ação necessária, não apenas o estado:

| Estado | Chip exibido |
|--------|-------------|
| `physicalCount === logicalCount > 0` | `✅ 24 · em sinc` |
| `physical > logical` | `⚠️ 26 físicos vs 24 lógicos · △+2` (remover 2 do mapa) |
| `physical < logical > 0` | `🔴 18 físicos vs 24 lógicos · △−6` (posicionar 6 no mapa) |
| `physical === 0 && logical > 0` | `🔴 0 posicionados · 24 aguardando` |
| `physical === 0 && logical === 0` | `— sem módulos` (neutro) |

### 2.4 Placeholder (sem áreas desenhadas)

Quando `installationAreas.ids.length === 0`:

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│  [🗺]  Arranjo físico                                 │
         Nenhuma área desenhada no telhado

│        [→ Abrir mapa para desenhar]                  │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

O botão chama `setFocusedBlock('module')` + `setActiveTool('DRAW_AREA')`.
Isso leva o canvas para `MapCore` (via sincronia bloco-canvas) e ativa diretamente
a ferramenta de desenho. O integrador não precisa saber onde fica a ferramenta.

### 2.5 Múltiplas áreas

N áreas → 1 bloco agregado. Os chips somam métricas de todas as áreas. Para editar
áreas individualmente o integrador usa "Editar no mapa" → `MapCore` com todas as
áreas visíveis e editáveis via polígono freeform.

Esse princípio é consistente com o Compositor inteiro: **avaliação no bloco,
edição no canvas especializado**.

### 2.6 Navegação bidirecional Compositor ↔ MapCore (v2.0)

O Bloco de Arranjo é o único que tem navegação explícita para outra vista. Dois pontos:

**1. Placeholder → MapCore + ferramenta de desenho:**
```typescript
// onClick do botão no placeholder
const { setFocusedBlock, setActiveTool } = useUIStore();

setFocusedBlock('module');   // ativa a view MapCore via spec-sincronia
setActiveTool('DRAW_AREA');  // ativa a ferramenta de desenho de área
```

**2. Bloco preenchido → MapCore (modo exploração):**
```typescript
// onClick do botão "Editar no mapa →"
const { setFocusedBlock } = useUIStore();

setFocusedBlock('module');   // ativa a view MapCore; ferramenta fica como está
```

> **Nota v2.0:** A v1.0 chamava `uiStore.setActiveCanvasView('map')` diretamente.
> No modelo atual, a view ativa é controlada pelo `activeFocusedBlock` via
> `spec-sincronia-bloco-canvas`. O `activeFocusedBlock = 'module'` é o equivalente
> correto — leva ao `MapCore` em modo de posicionamento.

---

## 3. Especificação Técnica

### 3.1 Extensão do `systemCompositionSlice` (v2.0)

```typescript
// kurupira/frontend/src/core/state/slices/systemCompositionSlice.ts

export interface ArrangementBlockStatus extends BlockStatus {
  areaCount: number;
  physicalModuleCount: number;
  logicalModuleCount: number;
  totalAreaM2: number;
  fdi: number | null;
  consistencyDelta: number; // physical - logical (positivo = excesso, negativo = falta)
}

// Seletor derivado — sem estado novo armazenado
export const selectArrangementBlock = (): ArrangementBlockStatus => {
  const areas        = useSolarStore(s => s.project.installationAreas);
  const placed       = useSolarStore(s => s.project.placedModules);
  const modules      = useSolarStore(s => s.modules);         // selecionados no inventário
  const inverters    = useTechStore(s => s.inverters);

  const areaCount    = areas.ids.length;
  const physicalCount = placed.ids.length;

  // logicalCount: soma de (modulesPerString × stringsCount) por MPPT por inversor
  const logicalCount = inverters.ids.reduce((total, invId) => {
    const inv = inverters.entities[invId];
    return total + inv.mpptConfigs.reduce((sum, mppt) =>
      sum + (mppt.modulesPerString * mppt.stringsCount), 0
    );
  }, 0);

  const totalAreaM2 = areas.ids.reduce((sum, areaId) => {
    const area = areas.entities[areaId];
    return sum + shoelaceAreaM2(area.localVertices);
  }, 0);

  // dimensões do módulo ativo (primeiro módulo no inventário)
  const activeModule = modules.ids.length > 0
    ? modules.entities[modules.ids[0]]
    : null;
  const moduleAreaM2 = activeModule
    ? (activeModule.physical.widthMm * activeModule.physical.heightMm) / 1_000_000
    : null;

  const fdi = totalAreaM2 > 0 && moduleAreaM2 && physicalCount > 0
    ? (physicalCount * moduleAreaM2) / totalAreaM2
    : null;

  const delta = physicalCount - logicalCount;

  const chipConsistencia: Chip = (() => {
    if (physicalCount === 0 && logicalCount === 0)
      return { label: 'Consistência', value: '— sem módulos', severity: 'neutral' };
    if (physicalCount === 0 && logicalCount > 0)
      return { label: 'Consistência', value: `0 posicionados · ${logicalCount} aguardando`, severity: 'error' };
    if (delta === 0)
      return { label: 'Consistência', value: `${physicalCount} · em sinc`, severity: 'ok' };
    const sinal = delta > 0 ? `+${delta}` : `${delta}`;
    return {
      label: 'Consistência',
      value: `${physicalCount} físicos vs ${logicalCount} lógicos · △${sinal}`,
      severity: 'error'
    };
  })();

  return {
    status: areaCount === 0 ? 'empty'
          : delta !== 0 ? 'error'
          : fdi !== null && fdi < 0.40 ? 'warning'
          : 'complete',
    areaCount,
    physicalModuleCount: physicalCount,
    logicalModuleCount: logicalCount,
    totalAreaM2,
    fdi,
    consistencyDelta: delta,
    chips: [
      chipConsistencia,
      {
        label: 'Área total',
        value: totalAreaM2 > 0 ? `${totalAreaM2.toFixed(0)} m²` : '— sem área',
        severity: 'neutral'
      },
      {
        label: 'FDI',
        value: fdi !== null ? fdi.toFixed(2) : '—',
        severity: fdi === null ? 'neutral'
                : fdi >= 0.60 ? 'ok'
                : fdi >= 0.40 ? 'warn'
                : 'error'
      },
    ],
  };
};
```

### 3.2 Função utilitária `shoelaceAreaM2`

```typescript
// kurupira/frontend/src/modules/engineering/utils/geoUtils.ts
// (adição a arquivo existente)

/**
 * Calcula a área de um polígono em metros quadrados
 * usando a fórmula de Shoelace (Gauss).
 * Funciona para qualquer polígono simples (sem auto-interseção).
 *
 * @param vertices Array de {x, y} em metros (coordenadas locais do projectSlice)
 * @returns Área em m²
 */
export function shoelaceAreaM2(
  vertices: Array<{ x: number; y: number }>
): number {
  const n = vertices.length;
  if (n < 3) return 0;

  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }
  return Math.abs(area) / 2;
}
```

**Teste de sanidade obrigatório antes de integrar:**
```typescript
// Polígono retangular 10m × 5m
const rect = [
  { x: 0, y: 0 }, { x: 10, y: 0 },
  { x: 10, y: 5 }, { x: 0, y: 5 }
];
expect(shoelaceAreaM2(rect)).toBe(50.0); // ✅
```

### 3.3 Componente `ComposerBlockArrangement.tsx`

```typescript
// kurupira/frontend/src/modules/engineering/ui/panels/canvas-views/composer/
//   ComposerBlockArrangement.tsx

interface Props {
  status: ArrangementBlockStatus;
  isFocused: boolean;
  isDeemphasized: boolean;
  onEditInMap: () => void;
  onDrawArea: () => void;
}

export const ComposerBlockArrangement: React.FC<Props> = ({
  status, isFocused, isDeemphasized, onEditInMap, onDrawArea
}) => {
  // Placeholder quando sem áreas
  if (status.status === 'empty') {
    return (
      <div className={cn(
        'border-2 border-dashed border-slate-700/50 rounded-xl p-4',
        'bg-slate-900/20 transition-all duration-300',
        isDeemphasized && 'opacity-40 grayscale-[0.15]',
      )}>
        <div className="flex items-center gap-2 mb-3">
          <Map size={14} className="text-indigo-400" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Arranjo físico
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Nenhuma área desenhada no telhado
        </p>
        <button
          onClick={onDrawArea}
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
        >
          → Abrir mapa para desenhar
        </button>
      </div>
    );
  }

  // Bloco preenchido
  return (
    <div
      onClick={onEditInMap}
      className={cn(
        'rounded-xl border transition-all duration-300 cursor-pointer active:scale-[0.98]',
        isFocused && 'ring-2 ring-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.4)] opacity-100',
        isDeemphasized && 'opacity-40 grayscale-[0.15]',
        !isFocused && !isDeemphasized && 'opacity-100',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <Map size={14} className="text-indigo-400" />
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
            Arranjo físico
          </span>
        </div>
        <span className="text-[10px] text-slate-500">
          {status.areaCount} área{status.areaCount !== 1 ? 's' : ''} · {status.physicalModuleCount} módulos
        </span>
      </div>

      {/* Chips */}
      <div className="px-3 pb-2 flex flex-wrap gap-1.5">
        {status.chips.map(chip => (
          <StatusChip key={chip.label} chip={chip} />
        ))}
      </div>

      {/* Footer — link para canvas */}
      <div className="px-3 pb-3 flex justify-end">
        <button
          onClick={(e) => { e.stopPropagation(); onEditInMap(); }}
          className="text-[10px] text-indigo-400 hover:text-indigo-300"
        >
          Editar no mapa →
        </button>
      </div>
    </div>
  );
};
```

---

## 4. Integração no `LeftOutliner`

### 4.1 Posição na pilha de blocos

O `ComposerBlockArrangement` é inserido entre `ComposerBlockModule` e
`ComposerBlockInverter`, com conectores Lego adjacentes:

```
ConsumptionBlock
  └── LegoTab "kWh" (âmbar)
ComposerBlockModule
  └── LegoTab "DC" (cyan)
ComposerBlockArrangement        ← NOVO
  └── LegoTab "físico" (índigo)
ComposerBlockInverter
  └── LegoTab "AC" (esmeralda)
```

### 4.2 Condição de ativação

Segue a cascata progressiva existente:

| Bloco | Condição de ativação |
|-------|---------------------|
| Arranjo Físico | `modules.ids.length > 0` (bloco Módulo preenchido) |

Quando inativo: `LockedBlock` com hint "Adicione módulos para liberar o arranjo".

### 4.3 Wiring no `LeftOutliner.tsx`

```typescript
// LeftOutliner.tsx — adição ao render

const arrangementStatus = useSystemComposition(s => s.arrangementBlock);
const focusedBlock = useFocusedBlock();
const { setFocusedBlock, setActiveTool } = useUIStore();

const modulesExist = useSolarStore(s => s.modules.ids.length > 0);

// ...

{modulesExist ? (
  <>
    {/* Conector DC → físico */}
    <LegoNotch label="DC" color="sky" />

    <ComposerBlockArrangement
      status={arrangementStatus}
      isFocused={focusedBlock === 'arrangement'}
      isDeemphasized={focusedBlock !== null && focusedBlock !== 'arrangement'}
      onEditInMap={() => setFocusedBlock('module')}
      onDrawArea={() => {
        setFocusedBlock('module');
        setActiveTool('DRAW_AREA');
      }}
    />

    {/* Conector físico → AC */}
    <LegoTab label="físico" color="indigo" />
  </>
) : (
  <LockedBlock hint="Adicione módulos para liberar o arranjo" />
)}
```

---

## 5. Arquivos Afetados

### Criar

| Arquivo | Propósito |
|---------|-----------|
| `ui/panels/canvas-views/composer/ComposerBlockArrangement.tsx` | Componente visual do bloco |

### Modificar

| Arquivo | Mudança |
|---------|---------|
| `core/state/slices/systemCompositionSlice.ts` | Adicionar `ArrangementBlockStatus`, `selectArrangementBlock` |
| `utils/geoUtils.ts` | Adicionar `shoelaceAreaM2(vertices)` + teste de sanidade |
| `ui/panels/LeftOutliner.tsx` | Inserir `ComposerBlockArrangement` na cadeia; conector índigo; condição de ativação |
| `core/state/uiStore.ts` | Adicionar `'arrangement'` ao tipo `FocusedBlock` |

### Sem alteração

| Arquivo | Motivo |
|---------|--------|
| `core/state/slices/projectSlice.ts` | `InstallationArea` e `PlacedModule` não mudam — apenas consumidos |
| `ui/panels/canvas-views/MapCore.tsx` | Bloco navega para ele, não o altera |
| `canvas-views/SimulationCanvasView.tsx` | Não afetado |

---

## 6. Plano de Execução

```
Pré-condição A: spec-compositor-blocos Fase A concluída
  (systemCompositionSlice existe no projeto)

Pré-condição B: spec-sincronia-bloco-canvas Etapa 1 concluída
  (activeFocusedBlock existe no uiStore com tipo FocusedBlock)

Etapa 1: shoelaceAreaM2 em geoUtils.ts + teste unitário
  → Função pura, verificável antes de qualquer UI

Etapa 2: ArrangementBlockStatus + selectArrangementBlock no slice
  → Seletor derivado compila; bloco ainda não renderiza

Etapa 3: ComposerBlockArrangement.tsx
  → Componente visual completo com placeholder e bloco preenchido

Etapa 4: 'arrangement' adicionado ao FocusedBlock no uiStore
  → Tipo expandido; glow índigo disponível

Etapa 5: Integração no LeftOutliner
  → Bloco inserido na cadeia com condição de ativação e conectores
  → onEditInMap e onDrawArea funcionando
```

### Guardrails

- [ ] `shoelaceAreaM2` tem teste unitário com retângulo 10m×5m antes de integrar ao slice
- [ ] `selectArrangementBlock` usa `createSelector` (reselect) — não re-executa quando dados não relacionados mudam
- [ ] `setFocusedBlock('module')` não desmonta o canvas Leaflet (comportamento existente verificado)
- [ ] `tsc --noEmit` → EXIT CODE 0 ao fim de cada etapa

---

## 7. Avaliação de Riscos

| Risco | Prob. | Sev. | Mitigação |
|-------|:-----:|:----:|-----------|
| `shoelaceAreaM2` incorreta para polígonos não-convexos | Baixa | Alta | Shoelace é exata para qualquer polígono simples. Verificar que `updateAreaVertex` previne auto-interseção; se não, adicionar guardrail |
| Seletor instável por `Object.values()` gerando re-renders excessivos | Alta | Média | `createSelector` obrigatório — padrão já adotado no `SolarLayer.tsx` para o mesmo problema |
| FDI incorreto com múltiplos modelos de módulo | Média | Baixa | Fase 1 assume módulo único (mesma premissa do Dimensionamento Inteligente); multi-modelo é escopo futuro |
| `setFocusedBlock('module')` e `setActiveTool('DRAW_AREA')` em sequência causando conflito de estado | Baixa | Baixa | Ambos são ações síncronas no `uiStore`; ordem garantida dentro do mesmo handler |
| FDI calculado com `physical.widthMm` ausente no catálogo | Média | Baixa | `moduleAreaM2 = null` → `fdi = null` → chip neutro; sem crash |

---

## 8. Critérios de Aceitação

### Funcionais
- [ ] Projeto com 3 áreas e 24 módulos posicionados, 24 lógicos → chip verde `24 · em sinc`
- [ ] Projeto com 18 físicos e 24 lógicos → chip vermelho `18 físicos vs 24 lógicos · △−6`
- [ ] Projeto com 26 físicos e 24 lógicos → chip âmbar `26 físicos vs 24 lógicos · △+2`
- [ ] Projeto sem nenhuma área → placeholder com botão "Abrir mapa para desenhar"
- [ ] Clicar em "Editar no mapa" → canvas desliza para `MapCore` sem desmontar Leaflet
- [ ] Clicar em "Abrir mapa para desenhar" → canvas desliza para `MapCore` + ferramenta `DRAW_AREA` ativa
- [ ] Bloco recebe glow índigo quando `activeFocusedBlock === 'arrangement'`
- [ ] Outros blocos ficam `opacity-40` quando Arranjo está em foco

### Técnicos
- [ ] `shoelaceAreaM2([{x:0,y:0},{x:10,y:0},{x:10,y:5},{x:0,y:5}])` retorna `50.0`
- [ ] `selectArrangementBlock` não re-executa ao mudar `clientData.tariffRate` (verificar via React DevTools Profiler)
- [ ] `tsc --noEmit` → EXIT CODE 0

### Engenharia
- [ ] FDI validado manualmente: 24 módulos DMEGC 610W (2.278m × 1.134m = 2.583 m² cada) em área de 110 m² → FDI = (24 × 2.583) / 110 ≈ 0.564 (âmbar) ✓
- [ ] Engenheiro revisor confirma que o chip de consistência com `△N` comunica claramente a ação necessária

---

## 9. O que este escopo desbloqueia

| Feature | Desbloqueio |
|---------|-------------|
| **Guardião de aprovação completo** | Com os 4 blocos na pilha, `systemCompositionSlice` tem estado para todos — aprovação só ativa quando Arranjo também está em sinc |
| **Proposta Comercial** | Memorial descritivo usa `totalAreaM2`, `FDI` e `placedModules.length` — todos do mesmo seletor |
| **Diagnóstico de campo** | Integrador mostra ao cliente no celular a consistência físico-lógica sem explicar a árvore do Outliner |
| **Unifilar automático** | `UnifilarEngine` (spec aguardando) precisa de `physicalCount` e topologia de strings — dados que `selectArrangementBlock` já agrega |

---

## 10. Fora do escopo

- **Edição de vértices dentro do bloco** — geometria editada exclusivamente no `MapCore` via grips de vértice
- **Múltiplos modelos de módulo em áreas distintas** — FDI assume módulo único; multi-modelo requer spec separada
- **Thumbnail SVG do telhado dentro do bloco** — elegante mas sem valor de avaliação equivalente ao custo; polish posterior
- **Métricas por área individual no bloco** — bloco agrega todas as áreas; ver por área usa o `MapCore`
- **Ativação do bloco para `FocusedBlock = 'arrangement'`** em vez de `'module'` — deliberado: o canvas de trabalho para arranjo É o `MapCore` (via `'module'`); `'arrangement'` existe apenas para o glow visual do bloco

---

## Referências

- `InstallationArea` completo: `.agent/concluido/Feature_Telhado_Parametrico/Feature_Telhado_Freeform_Illustrator.md`
- Auto-Layout e cap de quantidade: `.agent/concluido/Feature_Telhado_Parametrico/Feature_P10_1_Refinamentos.md`
- Cruzamento físico-lógico: `.agent/concluido/Engenharia_Dimensionamento_Funcional/Especificacao_Dimensionamento_Funcional_Kurupira.md` §4
- Compositor de Blocos: `spec-compositor-blocos-2026-04-15.md`
- Sincronia bloco-canvas: `spec-sincronia-bloco-canvas-2026-04-15.md`
- Foco tátil: `spec-foco-tatil-2026-04-15.md`
- FDI no HealthCheck: `docs/interface/mapa-dimensionamento.md` §1.2.1
- `createSelector` (reselect): já em uso no `SolarLayer.tsx`

# Spec — Bloco de Arranjo Físico no Compositor

**Tipo:** Feature Nova (extensão da spec-compositor-blocos-2026-04-14)
**Módulo:** `engineering` — `ComposerCanvasView`, `projectSlice`, `systemCompositionSlice`
**Prioridade:** P1 — Crítico (depende da Fase B do Compositor estar concluída)
**Responsável (impl.):** `the-builder`
**Revisor (aceitação):** `engenheiro-eletricista-pv` + `design-lead`
**Data de criação:** 2026-04-14
**Versão:** 1.0
**Origem:** spec-compositor-blocos-2026-04-14 § Fora do Escopo (item explícito)
**Dependência direta:** `spec-compositor-blocos-2026-04-14` — Fase B concluída

---

## 1. Diagnóstico

### 1.1 Situação atual

O `InstallationArea` é a entidade mais rica do `projectSlice`: suporta polígonos
freeform com vértices editáveis, relação pai-filho com `PlacedModule`, Auto-Layout
inteligente com otimização Portrait/Landscape, e cruzamento físico-lógico com as
strings do `useTechStore`. Toda essa riqueza vive exclusivamente no canvas Leaflet
— o Compositor de Blocos não a enxerga.

A consequência é uma lacuna de coerência: o integrador pode estar olhando para o
Compositor com todos os chips verdes (consumo ✓, módulo ✓, inversor ✓) enquanto o
canvas Leaflet tem 0 módulos posicionados no telhado. O sistema parece aprovado mas
fisicamente não existe.

O alerta de inconsistência físico-lógico (`physicalCount ≠ logicalCount`) já foi
especificado no `HealthCheckWidget` do `TopRibbon`, mas o Compositor não tem nenhuma
representação do arranjo físico como bloco — a lacuna é invisível na vista de
avaliação.

### 1.2 O problema de representar a geometria como bloco

O `InstallationArea` tem uma representação natural no canvas Leaflet (polígono
georreferenciado com módulos posicionados). Transformá-lo em bloco cria uma tensão
inerente: um bloco é simples por definição, mas o arranjo físico é potencialmente
complexo — N áreas com formas distintas, orientações diferentes por água de telhado,
graus variados de preenchimento.

A resolução certa não é simplificar o objeto em excesso nem replicar a complexidade
do canvas dentro do Compositor. É expor **o que interessa para a avaliação de
coerência**: o arranjo físico está definido? Quantos módulos estão posicionados?
Eles batem com a topologia elétrica?

### 1.3 Impacto

| Indicador | Estado atual | Estado desejado |
|-----------|-------------|-----------------|
| Coerência físico-lógica visível no Compositor | Ausente | Chip de consistência no bloco |
| Projeto sem áreas desenhadas identificável no Compositor | Ausente | Placeholder com acesso direto ao canvas |
| Métricas de arranjo (área total, qtd. módulos, FDI) no Compositor | Ausente | Chips derivados do `projectSlice` |
| Navegação Compositor → canvas para editar o arranjo | Ausente | Botão "Editar no mapa" no bloco |

---

## 2. Solução: O Bloco de Arranjo Físico

### 2.1 Posição na cadeia de blocos

O Bloco de Arranjo Físico ocupa a terceira posição — após Módulo FV e antes do
Inversor. Essa posição reflete o fluxo de trabalho real: o integrador escolhe o
módulo, posiciona no telhado, e então valida o inversor contra a topologia elétrica
resultante do arranjo.

```
[Consumo] → [Módulo FV] → [Arranjo Físico] → [Inversor]
```

O conector entre Módulo FV e Arranjo Físico carrega: `módulos posicionados: N`.
O conector entre Arranjo Físico e Inversor carrega: `strings configuradas: N, Voc: XXX V`.

### 2.2 Anatomia do bloco

```
┌─ [ícone mapa] Arranjo físico        [N áreas · M módulos] ─┐
│                                                              │
│  [chip: Módulos posicionados]  [chip: Área total m²]        │
│  [chip: FDI]                   [chip: Consistência]         │
│                                          [Editar no mapa →] │
└──────────────────────────────────────────────────────────────┘
```

### 2.3 Chips do Bloco de Arranjo Físico

| Chip | Fonte | Cálculo | Semáforo |
|------|-------|---------|----------|
| **Módulos posicionados** | `projectSlice.placedModules.length` | contagem direta | Verde se = logicalCount; âmbar se > logicalCount; vermelho se < logicalCount e logicalCount > 0 |
| **Área total** | `Σ(shoelaceArea(area.localVertices))` por área | soma das áreas dos polígonos em m² | Neutro (informativo) |
| **FDI** | `(placedModules.length × moduleArea_m²) / totalAreaM²` | fator de densidade de instalação | Verde ≥ 0.60; âmbar 0.40–0.59; vermelho < 0.40 |
| **Consistência** | `physicalCount === logicalCount` | cruzamento `projectSlice` × `useTechStore` | Verde se iguais; vermelho se divergem com delta explícito |

**Chip de Consistência — detalhe:**

O chip é o mais importante do bloco. Exibe o estado do cruzamento que o
`HealthCheckWidget` já calcula, mas aqui com contexto narrativo:

- Verde: `"24 módulos · em sinc"`
- Vermelho: `"18 físicos vs 24 lógicos — △6"`

O delta `△N` indica ao integrador exatamente quantos módulos precisam ser
posicionados (se negativo) ou removidos da topologia elétrica (se positivo) para
alinhar as duas representações.

### 2.4 Placeholder (arranjo não iniciado)

Quando não há nenhuma `InstallationArea` no `projectSlice`:

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
  [ícone mapa]  Arranjo físico
│               Nenhuma área desenhada          │
                [Abrir canvas para desenhar →]
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

O botão "Abrir canvas para desenhar" navega o `CenterCanvas` para a `MapCore`
(vista do mapa Leaflet) e ativa a ferramenta `DRAW_AREA`. O integrador não precisa
saber onde fica a ferramenta — o Compositor o leva diretamente até ela.

### 2.5 Bloco com múltiplas áreas

Um projeto com N áreas de instalação (ex: telhado norte + telhado sul + laje) não
expõe N blocos no Compositor. O bloco é sempre um único agregado. Os chips somam
as métricas de todas as áreas.

Para ver e editar áreas individualmente, o integrador usa o botão "Editar no mapa"
que navega para o `MapCore` com todas as áreas visíveis. Cada área continua sendo
editável pelo polígono freeform no canvas — essa edição não acontece dentro do bloco.

Essa decisão é consistente com o princípio do Compositor: **avaliação no bloco,
edição no canvas especializado**.

### 2.6 Navegação bidirecional Compositor ↔ Canvas

O Bloco de Arranjo Físico é o único bloco do Compositor que tem navegação explícita
para uma outra vista. Isso é intencional — o arranjo físico tem uma representação
canônica que é o mapa georreferenciado, e o Compositor não a substitui.

Dois pontos de navegação:

1. **Placeholder → canvas:** botão "Abrir canvas para desenhar" — navega para `MapCore`
   + ativa `DRAW_AREA`.
2. **Bloco preenchido → canvas:** botão "Editar no mapa" no canto inferior direito do
   bloco — navega para `MapCore` sem alterar a ferramenta ativa.

A navegação é implementada via `uiStore.setActiveCanvasView('map')` + optionalmente
`uiStore.setActiveTool('DRAW_AREA')`.

---

## 3. Especificação Técnica

### 3.1 Extensão do `systemCompositionSlice`

O slice existente (spec-compositor-blocos) recebe um novo bloco derivado:

```typescript
// Adição ao systemCompositionSlice.ts

interface ArrangementBlockStatus extends BlockStatus {
  areaCount: number;
  physicalModuleCount: number;
  logicalModuleCount: number;
  totalAreaM2: number;
  fdi: number | null;  // null se sem área definida
  consistencyDelta: number;  // physicalCount - logicalCount
}

// Seletor derivado (sem estado novo)
const selectArrangementBlock = (): ArrangementBlockStatus => {
  const placedModules = useSolarStore(s => s.project.placedModules);
  const areas = useSolarStore(s => s.project.installationAreas);

  const physicalCount = Object.keys(placedModules.entities).length;
  const logicalCount = useTechStore(s =>
    s.inverters.ids.reduce((total, invId) => {
      const inv = s.inverters.entities[invId];
      return total + inv.mpptConfigs.reduce((sum, mppt) =>
        sum + (mppt.modulesPerString * mppt.stringsCount), 0);
    }, 0)
  );

  const totalAreaM2 = Object.values(areas.entities).reduce((sum, area) =>
    sum + shoelaceAreaM2(area.localVertices), 0
  );

  const moduleAreaM2 = /* módulo selecionado: widthMm * heightMm / 1e6 */;
  const fdi = totalAreaM2 > 0
    ? (physicalCount * moduleAreaM2) / totalAreaM2
    : null;

  const delta = physicalCount - logicalCount;

  return {
    status: areaCount === 0 ? 'empty'
          : delta !== 0 && physicalCount > 0 && logicalCount > 0 ? 'error'
          : 'complete',
    chips: [
      {
        label: 'Módulos posicionados',
        value: `${physicalCount} un.`,
        severity: delta === 0 && physicalCount > 0 ? 'ok'
                : delta > 0 ? 'warn'   // mais físicos que lógicos
                : delta < 0 && logicalCount > 0 ? 'error'  // faltam módulos
                : 'neutral'
      },
      {
        label: 'Área total',
        value: `${totalAreaM2.toFixed(0)} m²`,
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
      {
        label: delta === 0 ? `${physicalCount} módulos · em sinc`
                           : `${physicalCount} físicos vs ${logicalCount} lógicos · △${Math.abs(delta)}`,
        value: '',
        severity: delta === 0 && physicalCount > 0 ? 'ok' : 'error'
      }
    ],
    areaCount: Object.keys(areas.entities).length,
    physicalModuleCount: physicalCount,
    logicalModuleCount: logicalCount,
    totalAreaM2,
    fdi,
    consistencyDelta: delta
  };
};
```

### 3.2 Cálculo da área do polígono — `shoelaceAreaM2`

O `projectSlice` armazena vértices como `localVertices: { x: number; y: number }[]`
em metros relativos ao `center`. A fórmula de Shoelace calcula a área diretamente
sem conversão de coordenadas:

```typescript
// geoUtils.ts — função nova (pura, sem efeitos colaterais)
export function shoelaceAreaM2(vertices: { x: number; y: number }[]): number {
  if (vertices.length < 3) return 0;
  let area = 0;
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }
  return Math.abs(area) / 2;  // resultado em m²
}
```

Essa função já pode ser reaproveitada pelo `AreaProperties.tsx` para exibir a área
do polígono no Inspector (atualmente calculada de outra forma).

### 3.3 Novo componente: `ComposerBlockArrangement.tsx`

```
src/modules/engineering/ui/panels/canvas-views/composer/
  └── ComposerBlockArrangement.tsx
```

Props:

```typescript
interface ComposerBlockArrangementProps {
  status: ArrangementBlockStatus;
  onEditInMap: () => void;   // navega para MapCore
  onDrawArea: () => void;    // navega para MapCore + ativa DRAW_AREA
}
```

O componente é puramente apresentacional — toda lógica está no selector do slice.

---

## 4. Arquivos Afetados

### Criar

| Arquivo | Propósito |
|---------|-----------|
| `[NEW] composer/ComposerBlockArrangement.tsx` | Componente de bloco para o arranjo físico |

### Modificar

| Arquivo | Mudança |
|---------|---------|
| `[MODIFY] core/stores/systemCompositionSlice.ts` | Adicionar `selectArrangementBlock` e `ArrangementBlockStatus` |
| `[MODIFY] canvas-views/ComposerCanvasView.tsx` | Inserir `ComposerBlockArrangement` entre os blocos de Módulo FV e Inversor; adicionar conectores adjacentes |
| `[MODIFY] utils/geoUtils.ts` | Adicionar função pura `shoelaceAreaM2(vertices)` |

### Sem alteração

| Arquivo | Motivo |
|---------|--------|
| `core/state/slices/projectSlice.ts` | `InstallationArea` e `PlacedModule` não mudam — apenas consumidos via seletor |
| `ui/panels/canvas-views/MapCore.tsx` | O canvas Leaflet não é alterado — o bloco navega para ele, não o substitui |
| `ui/panels/properties/AreaProperties.tsx` | Continua sendo o editor granular de cada área individual |

---

## 5. Plano de Migração

### Ordem de execução

```
Pré-condição: spec-compositor-blocos Fase B concluída
  (ComposerCanvasView renderizando Consumo + Módulo + Inversor)

Etapa 1: shoelaceAreaM2 em geoUtils.ts
  → Função pura, testável isoladamente, sem dependência de UI

Etapa 2: selectArrangementBlock no systemCompositionSlice
  → Seletor derivado; sistema compila mas bloco ainda não renderiza

Etapa 3: ComposerBlockArrangement.tsx
  → Componente visual do bloco com todos os chips

Etapa 4: Integração na ComposerCanvasView
  → Bloco inserido na cadeia; conectores atualizados;
     navegação para MapCore funcionando
```

### Guardrails

- [ ] `shoelaceAreaM2` tem testes unitários com polígono retangular (resultado verificável manualmente) antes de ser integrado ao slice
- [ ] Seletor `selectArrangementBlock` não causa re-render quando nenhuma área mudou (verificar via React DevTools Profiler)
- [ ] Navegação "Editar no mapa" não desmonta o canvas Leaflet — verificar que `MapCore` permanece montado via Portal durante a transição (comportamento existente no `CenterCanvas`)

---

## 6. Avaliação de Riscos

| Risco | Prob. | Sev. | Mitigação |
|-------|:-----:|:----:|-----------|
| `shoelaceAreaM2` retornando área incorreta para polígonos não-convexos | Baixa | Alta | A fórmula de Shoelace é exata para qualquer polígono simples (sem auto-interseção). Verificar se o `updateAreaVertex` já previne auto-interseção — se não, adicionar guardrail |
| Seletor do bloco recalculando a cada render por `Object.values()` instável | Alta | Média | Usar `createSelector` (reselect) no seletor — padrão já adotado no `SolarLayer.tsx` para o mesmo problema |
| FDI exibindo valor incorreto quando há múltiplos modelos de módulo no mesmo projeto | Média | Baixa | Fase 1 assume módulo único por projeto (mesma premissa do Dimensionamento Inteligente); multi-módulo é escopo futuro |
| Navegação "Abrir canvas" sobrescrevendo trabalho não salvo no Compositor | Baixa | Baixa | O Compositor é somente leitura — não há estado não salvo para perder |

---

## 7. Critérios de Aceitação

### Funcionais

- [ ] Projeto com 3 áreas e 24 módulos posicionados exibe: `Área total: ~XX m²`, `FDI: 0.XX`, `24 módulos · em sinc` (verde) — quando logicalCount também = 24
- [ ] Projeto com 18 físicos e 24 lógicos exibe chip vermelho: `18 físicos vs 24 lógicos · △6`
- [ ] Projeto sem nenhuma área exibe placeholder tracejado com botão "Abrir canvas para desenhar"
- [ ] Clicar em "Editar no mapa" navega para `MapCore` sem desmontar o Leaflet
- [ ] Clicar em "Abrir canvas para desenhar" navega para `MapCore` e ativa a ferramenta `DRAW_AREA`

### Técnicos

- [ ] `shoelaceAreaM2` retorna `50.0` para polígono retangular de 10m × 5m (verificação de sanidade)
- [ ] `selectArrangementBlock` não re-executa quando dados não relacionados ao arranjo mudam na store (ex: mudança de tarifa no `clientData`)
- [ ] `tsc --noEmit` → EXIT CODE 0

### Engenharia

- [ ] FDI calculado validado manualmente: 24 módulos DMEGC 610W (2.278m × 1.134m = 2.583 m² cada) em área de 110 m² → FDI = (24 × 2.583) / 110 = 0.564 (âmbar) ✓
- [ ] Chip de consistência revisado pelo engenheiro-eletricista-pv para confirmar que o delta comunica claramente a ação necessária

---

## 8. O que este escopo desbloqueia

| Feature | Desbloqueio |
|---------|-------------|
| **Aprovação do projeto no Compositor** | Com os 4 blocos (Consumo + Módulo + Arranjo + Inversor) todos verdes, o botão "Aprovar sistema" pode ser exposto diretamente no Compositor — lógica completa de validação disponível |
| **Proposta Comercial** | Memorial descritivo usa `totalAreaM2`, `FDI` e `placedModules.length` — todos deriváveis do mesmo seletor |
| **Diagnóstico de campo** | O integrador consegue mostrar ao cliente no celular o bloco de arranjo com a consistência física-lógica — sem precisar explicar o que é a árvore do Outliner |
| **Unifilar automático** | O `UnifilarEngine` (spec aguardando) precisa de `physicalCount` e `topologia de strings` — exatamente os dados que o `selectArrangementBlock` já agrega |

---

## 9. Fora do escopo

- **Edição de vértices dentro do bloco** — a geometria continua sendo editada exclusivamente no canvas Leaflet via `AreaProperties` e grips de vértice
- **Múltiplos modelos de módulo em áreas distintas** — FDI assume módulo único; multi-modelo requer spec separada
- **Visualização miniatura do polígono dentro do bloco** — um thumbnail SVG do telhado seria elegante, mas adiciona complexidade de renderização sem valor de avaliação equivalente; pode ser considerado como polish posterior
- **Métricas por área individual no bloco** — o bloco agrega todas as áreas; para ver por área usa-se o `AreaProperties` no Inspector ao selecionar cada polígono no mapa

---

## Referências

- `InstallationArea` completo: `.agent/concluido/Feature_Telhado_Parametrico/Feature_Telhado_Freeform_Illustrator.md`
- Auto-Layout e cap de quantidade: `.agent/concluido/Feature_Telhado_Parametrico/Feature_P10_1_Refinamentos.md`
- Cruzamento físico-lógico: `.agent/concluido/Engenharia_Dimensionamento_Funcional/Especificacao_Dimensionamento_Funcional_Kurupira.md` §4
- Compositor de Blocos (dependência): `spec-compositor-blocos-2026-04-14.md`
- FDI no HealthCheck: `docs/interface/mapa-dimensionamento.md` §1.2.1
- Fórmula de Shoelace para polígonos: aplicação já documentada em `Feature_Telhado_Freeform_Illustrator.md` §D

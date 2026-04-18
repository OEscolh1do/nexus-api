# Spec — MapCore: Arquitetura de Camadas (Layers CAD)

**Arquivo alvo:** `canvas-views/MapCore.tsx`
**Tipo:** Refatoração Arquitetural (Modos $\rightarrow$ Camadas)
**Módulo:** `engineering` — CenterCanvas
**Prioridade:** P1
**Responsável:** `the-builder`
**Revisor:** `design-lead` / `engenheiro-eletricista-pv`
**Data:** 2026-04-18
**Ativado por:** `activeFocusedBlock === 'module'` | `'arrangement'` | `null`

---

## 1. Propósito

O insight de engenharia de produto ditou uma mudança de paradigma: **"Não é sobre ser um mapa, mas sobre ter camadas."** O MapCore atua não apenas como um observador geográfico, mas como uma prancheta de engenharia estilo CAD, onde o mapa de satélite é apenas a "Camada Base / Orientação". Sobre ele, existem Múltiplas Camadas de Especialidade (Polígonos de Área, Módulos, Roteamento Elétrico). 

O `activeFocusedBlock` (foco da sidebar) não dita o *mapMode*. Ele define a **Camada Ativa de Edição**.

---

## 2. Derivação da Camada Ativa (`ActiveLayer`)

Em vez de modos excludentes, o sistema define qual Z-Index recebe interações e qual conjunto de ferramentas deve aparecer no HUD.

```typescript
// MapCore.tsx
const focusedBlock = useFocusedBlock();

type CanvasLayer = 'layer_base' | 'layer_roof' | 'layer_modules' | 'layer_electrical';

const activeLayer: CanvasLayer =
  focusedBlock === 'module'      ? 'layer_modules' :
  focusedBlock === 'arrangement' ? 'layer_roof'    : 'layer_base';
```

---

## 3. HUD de Ferramentas — Visibilidade por Camada

As ferramentas mostradas no canto superior esquerdo são inerentes à **Camada Ativa**.
- Se for a Camada de Arranjo/Telhado, desenhamos e medimos.
- Se for a Camada de Módulos, damos snap neles (referenciados pelo Arranjo de baixo).
- As camadas subjacentes entram em translucidez ou evitam interações (pointer-events: none para SVGs e markers que não pertencem à Active Layer).

```typescript
const TOOLS_BY_LAYER: Record<CanvasLayer, Tool[]> = {
  layer_base:     ['SELECT', 'MEASURE'],
  layer_roof:     ['SELECT', 'DRAW_AREA',   'MEASURE'],
  layer_modules:  ['SELECT', 'PLACE_MODULE', 'AUTO_LAYOUT'],
  layer_electrical: ['SELECT', 'DRAW_STRING'] // Futuro
};

const visibleTools = TOOLS_BY_LAYER[activeLayer];
```

**Comportamento de Transição Mágica:**
Ao clicar de "Arranjo" para "Módulos", nenhuma aba some. Tudo continua central, mas os polígonos base esmaecem 20% permitindo ao engenheiro dar snap perfeito nas réguas dos painéis, simulando papel vegetal.

---

## 4. Barra Contextual da Camada (Nova HUD Inferior)

Acoplada ao rodapé do canvas, uma faixa de status exibirá as métricas ativas da Camada focada, sem precisar rolar os blocos.

### 4.1 Camada `layer_modules` (Módulos FV)

```tsx
<div className="h-8 bg-slate-900/80 backdrop-blur-sm border-t border-sky-500/20
                flex items-center justify-between px-3 text-xs">

  <div className="flex items-center gap-3 text-slate-400">
    <Sun size={12} className="text-sky-400" />
    <span><span className="text-sky-400 font-medium">{placedCount}</span> módulos</span>
    {consistencyDelta === 0 && placedCount > 0 ? (
      <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={10} /> Sincronizado</span>
    ) : (
      <span className={cn('flex items-center gap-1', consistencyDelta < 0 ? 'text-red-400' : 'text-amber-400')}>
        <AlertCircle size={10} /> {Math.abs(consistencyDelta)} divergentes
      </span>
    )}
  </div>
</div>
```

### 4.2 Camada `layer_roof` (Arranjo Físico)

```tsx
<div className="h-8 bg-slate-900/80 backdrop-blur-sm border-t border-indigo-500/20
                flex items-center justify-between px-3 text-xs">
  <div className="flex items-center gap-3 text-slate-400">
    <Map size={12} className="text-indigo-400" />
    <span>Layer: Físico / Estrutura</span> · 
    <span className="text-indigo-400 font-medium">{totalAreaM2.toFixed(0)} m²</span>
    {fdi && <span className={fdi >= 0.60 ? 'text-emerald-400' : 'text-red-400'}>FDI {fdi.toFixed(2)}</span>}
  </div>
</div>
```

### 4.3 Camada `layer_base` (Navegação Neutral)

```tsx
<div className="h-8 bg-slate-900/80 backdrop-blur-sm border-t border-slate-700/30 flex items-center px-3 text-xs text-slate-500">
  <MapPin size={12} className="mr-2" /> Camada Geográfica (Referência)
  <span className="ml-auto font-mono text-slate-600"> {clientData.lat.toFixed(4)}°, {clientData.lng.toFixed(4)}° </span>
</div>
```

---

## 5. Invalidação e Montagem do Documento Híbrido

O Leaflet é ótimo para mosaicos. Ao transicionar de BaseMap para visualização maciça de painéis, poderemos precisar sobrepor um Canvas de WebGL/SVG pesados. O `MapCore` deve separar as Layers dentro de seu Container DOM central.
- Continua usando o `IntersectionObserver` para `invalidateSize()` se retornar do `display: none` vindo da vista de Inversor/Consumo.

---

## 6. Arquivos e Status

| Arquivo | Status |
|---------|--------|
| `canvas-views/MapCore.tsx` | **[MODIFICAR]** — Remover `mapMode` e implementar `activeLayer`, lógica de pointer-events. |

---

## 7. Critérios de Aceitação

- [ ] A troca do bloco lateral atualiza o `activeLayer` interno do `MapCore`.
- [ ] As ferramentas mudam de acordo com a tabela de layers e nunca via "Modo".
- [ ] Quando focada na `layer_roof`, módulos solares ficam com `pointer-events: none` e levemente transparentes.
- [ ] Quando focada na `layer_modules`, polígonos de telhado não são selecionáveis para redimensionamento (papel vegetal de baixo habilitado pra snap).
- [ ] `tsc --noEmit` $\rightarrow$ EXIT CODE 0

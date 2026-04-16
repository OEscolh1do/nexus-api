# Spec — MapCore: Adaptação para 3 Modos

**Arquivo alvo:** `canvas-views/MapCore.tsx`
**Tipo:** Modificação (comportamento por modo)
**Módulo:** `engineering` — CenterCanvas
**Prioridade:** P1 (MapCore já existe e funciona — mudança incremental)
**Responsável:** `the-builder`
**Revisor:** `design-lead`
**Data:** 2026-04-15
**Ativado por:** `activeFocusedBlock === 'module'` | `'arrangement'` | `null`

---

## 1. Propósito

O MapCore é o canvas Leaflet. Ele já existe, funciona e nunca desmonta. O que muda
é que ele passa a ter três modos de operação determinados pelo `activeFocusedBlock`,
cada um com um conjunto diferente de ferramentas visíveis e uma barra contextual
informativa na parte inferior.

Não há header. A identidade do modo é comunicada pela barra contextual inferior e
pela seleção de ferramentas no HUD flutuante — não por um título.

---

## 2. Derivação do modo

```typescript
// MapCore.tsx
const focusedBlock = useFocusedBlock();

type MapMode = 'placement' | 'drawing' | 'neutral';

const mapMode: MapMode =
  focusedBlock === 'module'      ? 'placement' :
  focusedBlock === 'arrangement' ? 'drawing'   : 'neutral';
```

---

## 3. HUD de Ferramentas — visibilidade por modo

O HUD flutuante existente no MapCore continua no mesmo canto (superior esquerdo).
A mudança é que ferramentas irrelevantes para o modo ficam **ocultas** — não
desabilitadas, pois isso cria confusão. Se a ferramenta não existe no modo, ela
simplesmente não aparece.

```typescript
const TOOLS_BY_MODE: Record<MapMode, Tool[]> = {
  placement: ['SELECT', 'PLACE_MODULE', 'AUTO_LAYOUT'],
  drawing:   ['SELECT', 'DRAW_AREA',   'MEASURE'],
  neutral:   ['SELECT', 'MEASURE'],
};

const visibleTools = TOOLS_BY_MODE[mapMode];
```

**Comportamento ao trocar de modo:**
- Se a ferramenta ativa não está na lista do novo modo → resetar para `'SELECT'`.
- Não há animação — o HUD simplesmente mostra ferramentas diferentes.

```typescript
useEffect(() => {
  if (!visibleTools.includes(activeTool)) {
    setActiveTool('SELECT');
  }
}, [mapMode]);
```

---

## 4. Barra Contextual Inferior (nova — sem header)

Uma faixa fina (`h-8 shrink-0`) acoplada ao fundo do MapCore, dentro do container
do canvas. Não é um header — é uma barra de status que exibe o contexto atual e
ações rápidas secundárias.

### 4.1 Modo `placement` — Módulos FV

```tsx
<div className="h-8 bg-slate-900/80 backdrop-blur-sm border-t border-sky-500/20
                flex items-center justify-between px-3 text-xs">

  <div className="flex items-center gap-3 text-slate-400">
    <Sun size={12} className="text-sky-400" />
    <span>
      <span className="text-sky-400 font-medium">{placedCount}</span> módulos posicionados
    </span>
    {consistencyDelta === 0 && placedCount > 0 && (
      <span className="text-emerald-400 flex items-center gap-1">
        <CheckCircle size={10} /> em sinc
      </span>
    )}
    {consistencyDelta !== 0 && (
      <span className={cn('flex items-center gap-1',
        consistencyDelta < 0 ? 'text-red-400' : 'text-amber-400')}>
        <AlertCircle size={10} />
        {consistencyDelta < 0
          ? `${Math.abs(consistencyDelta)} a posicionar`
          : `${consistencyDelta} a remover`}
      </span>
    )}
  </div>

  {placedCount > 0 && (
    <button
      onClick={() => setFocusedBlock('inverter')}
      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
      Ir para Inversor
      <ChevronRight size={12} />
    </button>
  )}
</div>
```

### 4.2 Modo `drawing` — Arranjo Físico

```tsx
<div className="h-8 bg-slate-900/80 backdrop-blur-sm border-t border-indigo-500/20
                flex items-center justify-between px-3 text-xs">

  <div className="flex items-center gap-3 text-slate-400">
    <Map size={12} className="text-indigo-400" />
    <span>
      <span className="text-indigo-400 font-medium">{areaCount}</span>
      {areaCount === 1 ? ' área' : ' áreas'} ·
      <span className="text-indigo-400 font-medium ml-1">
        {totalAreaM2.toFixed(0)} m²
      </span>
    </span>
    {fdi !== null && (
      <span className={cn(
        fdi >= 0.60 ? 'text-emerald-400' :
        fdi >= 0.40 ? 'text-amber-400' : 'text-red-400'
      )}>
        FDI {fdi.toFixed(2)}
      </span>
    )}
  </div>

  {areaCount > 0 && (
    <button
      onClick={() => setFocusedBlock('module')}
      className="text-sky-400 hover:text-sky-300 flex items-center gap-1">
      Posicionar módulos
      <ChevronRight size={12} />
    </button>
  )}
</div>
```

### 4.3 Modo `neutral` — Mapa geral

```tsx
<div className="h-8 bg-slate-900/80 backdrop-blur-sm border-t border-slate-700/30
                flex items-center px-3 text-xs text-slate-500">
  <MapPin size={12} className="mr-2" />
  {clientData.city}, {clientData.state}
  {clientData.lat && (
    <span className="ml-3 font-mono text-slate-600">
      {clientData.lat.toFixed(4)}°, {clientData.lng?.toFixed(4)}°
    </span>
  )}
</div>
```

---

## 5. Ativação automática da ferramenta DRAW_AREA

Quando `activeFocusedBlock` muda para `'arrangement'` e vem de um bloco placeholder
(via botão "Abrir mapa para desenhar"), a ferramenta `DRAW_AREA` deve ativar
automaticamente:

```typescript
// No MapCore ou no handler de setFocusedBlock
useEffect(() => {
  if (focusedBlock === 'arrangement' && areaCount === 0) {
    setActiveTool('DRAW_AREA');
  }
}, [focusedBlock]);
```

Quando `areaCount > 0`, não ativar automaticamente — o integrador pode apenas querer
revisar o arranjo existente.

---

## 6. Invalidação do Leaflet após restauração

O MapCore permanece montado via `display: none` quando inativo. Ao reaparecer,
o Leaflet precisa recalcular o tamanho do container:

```typescript
// MapCore.tsx — já especificado na SPEC-000
useEffect(() => {
  const mapInstance = mapRef.current;
  if (!mapInstance) return;

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      setTimeout(() => mapInstance.invalidateSize(), 50);
    }
  }, { threshold: 0.1 });

  const container = mapInstance.getContainer();
  if (container) observer.observe(container);
  return () => observer.disconnect();
}, []);
```

Isso já deve estar implementado conforme a `SPEC-000-integration-contract`. Se não
estiver, esta spec exige que seja adicionado.

---

## 7. Arquivos

| Arquivo | Status |
|---------|--------|
| `canvas-views/MapCore.tsx` | **[MODIFICAR]** — 3 modos + barra contextual |

Sem novos arquivos. A lógica de ferramentas (`TOOLS_BY_MODE`) pode ser uma constante
no mesmo arquivo.

---

## 8. Critérios de Aceitação

- [ ] `activeFocusedBlock === 'module'` → ferramentas SELECT, PLACE_MODULE, AUTO_LAYOUT visíveis; DRAW_AREA oculta
- [ ] `activeFocusedBlock === 'arrangement'` → ferramentas SELECT, DRAW_AREA, MEASURE visíveis; PLACE_MODULE oculta
- [ ] Trocar de modo com ferramenta incompatível ativa → ferramenta reseta para SELECT
- [ ] Modo `arrangement` com 0 áreas → DRAW_AREA ativa automaticamente
- [ ] Modo `arrangement` com áreas existentes → ferramenta não muda automaticamente
- [ ] Barra inferior modo `placement` exibe contagem de módulos e delta de consistência
- [ ] Barra inferior modo `drawing` exibe contagem de áreas, m² e FDI
- [ ] `invalidateSize()` chamado quando MapCore reaparece após `display: none`
- [ ] Leaflet não recarrega tiles ao alternar entre modos (container permanece montado)
- [ ] `tsc --noEmit` → EXIT CODE 0

---

## Referências

- `SPEC-000-integration-contract.md` §4 — `invalidateSize()` via IntersectionObserver
- `spec-bloco-arranjo-fisico-2026-04-15.md` §2.6 — `setActiveTool('DRAW_AREA')` no placeholder
- `spec-sincronia-bloco-canvas-2026-04-15.md` §3.1 — mapeamento `focusedBlock → view`
- `uiStore.ts` — `activeTool`, `setActiveTool`

# SPEC-001 — Map Context Mode (Polimorfismo do Leaflet)

**Épico**: UX-003 Minimap Docking  
**Fase**: 1 (Adaptação do MapCore)  

## Problema
O mapa Leaflet foi construído para tela cheia. Se simplesmente jogado num container de 300px no dock, a navegação ficará quebrada: o scroll vai engolir a tela, os controles de zoom vão poluir a visão e a proporção do WebGL ficará incorreta.

## Escopo Técnico

### `MapCore.tsx` / `CenterCanvas.tsx`
O mapa deve reagir ao estado global `panelStore.centerContent`.

```tsx
const centerContent = useCenterContent();
const isMinimap = centerContent !== 'map';
```

Quando `isMinimap === true`:
1. **Desabilitar Interação**:
   - `map.dragging.disable()`
   - `map.scrollWheelZoom.disable()`
   - `map.doubleClickZoom.disable()`
2. **Re-enquadrar**:
   - Chamar `map.invalidateSize()` após a transição (pequeno delay de 100ms para CSS max-height ser aplicado no flexbox).
   - Opcional: Centrar no polígono atual (se houver seleção) utilizando um hook de fitBounds.
3. **Minimap Overlay**:
   - Renderizar uma camada semitransparente absoluta por cima de todo o canvão Leaflet com o texto/ícone "Restaurar Mapa". Essa div interceptará o clique e chamará `restoreMap()`.

```tsx
{isMinimap && (
  <div 
    onClick={restoreMap}
    className="absolute inset-0 z-[9999] bg-slate-900/40 hover:bg-slate-900/20 
               flex items-center justify-center cursor-pointer group transition-all"
  >
     <div className="bg-slate-900/80 px-3 py-1.5 rounded-full border border-emerald-500/50 
                     flex items-center gap-2 text-emerald-400 group-hover:scale-105 transition-transform">
        <Minimize2 size={12} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Restaurar Mapa</span>
     </div>
  </div>
)}
```

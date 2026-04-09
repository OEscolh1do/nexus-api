# SPEC-002 — Dock Portal Target

**Épico**: UX-003 Minimap Docking  
**Fase**: 2 (Estrutura Receptora do Cânone)  

## Problema
Atualmente na UX-002, quando o painel é isolado num CenterSwap, o `RightInspector` levanta um `<MapPlaceholderCard>`, que é meramente um bloco estático de texto e ícones SVG. A `MapCore` não tem para onde ir no DOM.

## Escopo Técnico

### `RightInspector.tsx`
Remover o `MapPlaceholderCard` e incluir um `div` recipiente estável. O atributo `id="minimap-portal-target"` é crítico, pois essa será a âncora que a API `createPortal` do `CenterCanvas` usará para acoplar a árvore `<MapLayer />`.

```tsx
// Exemplo substitutivo na renderização baseada na promoção:
if (isPromoted) {
  return (
    <div className="shrink-0 p-2 border-b border-slate-800/50">
      {/* Container âncora para o Portal do Leaflet */}
      <div 
        id="minimap-portal-target" 
        className="w-full h-48 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 relative shadow-inner"
      />
      {/* Label Auxiliar (opcional embaixo) */}
      <div className="flex justify-between items-center px-1 mt-1.5 opacity-50">
         <span className="text-[9px] uppercase font-bold text-slate-400">Minimapa Ativo</span>
         <span className="text-[9px] text-slate-500">{dockLabel} → Centro</span>
      </div>
    </div>
  );
}
```

**Restrição de Estilo**: O contêiner de destino (a âncora) DEVE definir dimensões fixas ou elásticas contidas (ex: `h-48 w-full` ou `aspect-video`) com `position: relative` e `overflow: hidden`, para que quando a imensa árvore do Leaflet caia sobre ele via Portal, os mapas respeitem as barreiras físicas da barra lateral de 300px.

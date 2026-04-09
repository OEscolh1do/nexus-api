# SPEC-007 — Indicador de Mapa no Dock + TopRibbon

**Épico**: UX-002 Panel System  
**Fase**: 2 (Center Swap)  
**Prioridade**: P2  
**Dependências**: SPEC-005, SPEC-006  

---

## Problema de Negócio

Quando o mapa sai do center (porque um painel foi promovido), o engenheiro 
precisa de feedback visual claro de que:
1. O mapa ainda existe e pode ser restaurado
2. Qual painel está atualmente no center
3. Como restaurar rapidamente o mapa

Sem esse feedback, o swap pode ser confuso — o engenheiro pode pensar que 
"perdeu" o mapa.

## Usuário Final

Engenheiro solar que acabou de maximizar um painel para análise detalhada.

## Escopo

### ✅ Incluso
- Card de placeholder no dock onde o grupo promovido estava
- Badge no TopRibbon indicando que o center não é o mapa
- Botão de restore rápido no TopRibbon

### ❌ Excluso
- Mini-mapa Leaflet real no dock (overhead desnecessário)
- Drag do card de placeholder para restaurar

## Especificação Técnica

### Modificações

#### 1. `RightInspector.tsx` — Card Placeholder

Quando um grupo está promovido ao center, ele desaparece do dock. No 
lugar dele, renderizar um card compacto:

```tsx
{isPromoted('simulation') ? (
  <MapPlaceholderCard 
    label="Mapa no Dock"
    onRestore={() => restoreMap()}
  />
) : (
  <PanelGroup id="simulation" ...>
    <SimulationGroup />
  </PanelGroup>
)}
```

##### MapPlaceholderCard

```tsx
const MapPlaceholderCard: React.FC<{ label: string; onRestore: () => void }> = ({ label, onRestore }) => (
  <div 
    onClick={onRestore}
    className="group cursor-pointer rounded-lg border border-dashed border-slate-700 
               bg-slate-900/30 p-3 flex items-center gap-3 hover:border-emerald-500/50 
               hover:bg-emerald-500/5 transition-all"
  >
    <Map size={16} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
    <div className="flex flex-col">
      <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-300">
        {label}
      </span>
      <span className="text-[9px] text-slate-600">
        Clique para restaurar o mapa ao centro
      </span>
    </div>
    <Minimize2 size={12} className="ml-auto text-slate-700 group-hover:text-emerald-400" />
  </div>
);
```

#### 2. `TopRibbon.tsx` — Badge de Estado

Quando `centerContent !== 'map'`, adicionar um badge ao lado dos widgets 
de KPI:

```tsx
{centerContent !== 'map' && (
  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 
                  border border-amber-500/30 animate-in fade-in">
    <Map size={10} className="text-amber-400" />
    <span className="text-[9px] font-bold text-amber-400">
      Mapa → Dock
    </span>
    <button 
      onClick={restoreMap}
      className="ml-1 p-0.5 rounded hover:bg-amber-500/20 text-amber-400"
      title="Restaurar mapa ao centro"
    >
      <Minimize2 size={10} />
    </button>
  </div>
)}
```

### Estados Visuais

| Estado | Dock | Center | TopRibbon |
|--------|------|--------|-----------|
| Normal (mapa no center) | 4 grupos empilhados | Mapa | Sem badge |
| Painel promovido | 3 grupos + 1 placeholder | Painel expandido | Badge âmbar "Mapa → Dock" |

### Critérios de Aceitação (Definition of Done)

- [ ] Card placeholder aparece no dock quando grupo é promovido
- [ ] Card placeholder é clicável e restaura o mapa
- [ ] Badge âmbar aparece no TopRibbon quando mapa não está no center
- [ ] Botão de restore no badge do TopRibbon funciona
- [ ] Animações suaves de entrada (fade-in)
- [ ] Compila sem erros TypeScript

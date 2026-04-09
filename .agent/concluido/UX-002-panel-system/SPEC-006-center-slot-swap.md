# SPEC-006 — Center Slot Swap (Comutação Mapa ↔ Painel)

**Épico**: UX-002 Panel System  
**Fase**: 2 (Center Swap)  
**Prioridade**: P1  
**Dependências**: SPEC-001, SPEC-002, SPEC-003, SPEC-004, SPEC-005  

---

## Problema de Negócio

O center canvas está soldado ao mapa — não pode ser substituído por 
outra view. Um engenheiro que precisa analisar o gráfico de geração vs 
consumo em detalhes, ou expandir o painel de perdas para apresentar a 
um cliente, precisa de espaço visual. A capacidade de "trocar" o center 
por outro conteúdo resolve isso.

## Usuário Final

Engenheiro solar fazendo análise detalhada ou apresentação para cliente.

## Escopo

### ✅ Incluso
- Modificar `CenterCanvas.tsx` para renderizar conteúdo polimórfico baseado em `panelStore.centerContent`
- Quando um painel ocupa o center, o mapa fica `display: none` (não desmonta)
- Botão ↗ no `PanelGroup` header faz o swap
- Botão ↘ no painel maximizado restaura o mapa
- Animação de transição fade-in/scale no center

### ❌ Excluso
- Mini-mapa no dock (SPEC-007)
- Múltiplos painéis no center simultaneamente
- Layout de split-view (center dividido em 2)

## Especificação Técnica

### Arquivos a Modificar

#### `CenterCanvas.tsx`

O CenterCanvas se torna um **slot polimórfico**:

```tsx
const CenterCanvasInner: React.FC = () => {
  const centerContent = useCenterContent();  // from panelStore
  const activeTool = useActiveTool();
  const selectedEntity = useSelectedEntity();
  
  return (
    <div className="absolute inset-0 w-full h-full bg-slate-950">
      {/* Mapa — sempre montado, visibilidade controlada por CSS */}
      <div style={{ display: centerContent === 'map' ? 'block' : 'none' }}
           className="absolute inset-0">
        <MapCore activeTool={activeTool} />
        <WebGLOverlay />
        {/* HUDs flutuantes do mapa */}
        {centerContent === 'map' && (/* tool indicator, voltage chart */)}
      </div>

      {/* Painel Promovido — renderiza o grupo expandido no center */}
      {centerContent !== 'map' && (
        <PromotedPanelView groupId={centerContent} />
      )}
    </div>
  );
};
```

#### Componente `PromotedPanelView`

Renderiza o grupo promovido em layout de tela cheia com:
- Header com label do grupo + botão "Restaurar Mapa" (↘)
- Conteúdo do grupo expandido ocupando 100% do espaço
- Background sutil diferente para indicar que não é o mapa

```tsx
const PromotedPanelView: React.FC<{ groupId: PanelGroupId }> = ({ groupId }) => {
  const restoreMap = usePanelStore(s => s.restoreMap);
  const GroupComponent = GROUP_REGISTRY[groupId];  // Lookup table

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-950 animate-in fade-in duration-200">
      {/* Restore bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 
                      bg-slate-900 border-b border-slate-800">
        <span className="text-xs font-bold text-slate-300 uppercase">
          {GROUP_LABELS[groupId]}
        </span>
        <button onClick={restoreMap} className="...">
          <Minimize2 size={14} /> Restaurar Mapa
        </button>
      </div>
      {/* Group content — full viewport */}
      <div className="flex-1 overflow-y-auto p-6">
        <GroupComponent />
      </div>
    </div>
  );
};
```

#### Registry de Grupos

```tsx
const GROUP_REGISTRY: Record<PanelGroupId, React.FC> = {
  site: SiteContextGroup,
  simulation: SimulationGroup,
  electrical: ElectricalGroup,
  properties: PropertiesGroup,
};

const GROUP_LABELS: Record<PanelGroupId, string> = {
  site: 'Contexto do Site',
  simulation: 'Simulação de Geração',
  electrical: 'Configuração Elétrica',
  properties: 'Propriedades do Componente',
};
```

#### `PanelGroup.tsx` — Ativar botão Maximize

```diff
- <button disabled className="opacity-30 cursor-not-allowed">
+ <button onClick={() => onMaximize?.()} className="opacity-60 hover:opacity-100">
    <Maximize2 size={10} />
  </button>
```

#### `RightInspector.tsx` — Conectar onMaximize

```tsx
<PanelGroup 
  id="simulation" 
  label="Simulação" 
  icon={<BarChart3 size={10} />}
  onMaximize={() => promoteToCenter('simulation')}
>
  <SimulationGroup />
</PanelGroup>
```

### Comportamento do Mapa durante Swap

| Estado | MapCore | WebGLOverlay | HUDs | R3F `frameloop` |
|--------|---------|-------------|------|-----------------|
| `centerContent === 'map'` | `display: block` | Ativo | Visíveis | `"demand"` |
| `centerContent !== 'map'` | `display: none` | Suspenso | Ocultos | `"never"` |

**Importante**: O mapa Leaflet **não desmonta**. O `display: none` preserva 
o estado interno do Leaflet (tiles, zoom, markers). Ao restaurar, `invalidateSize()` 
é chamado para re-render correto.

### Atalhos de Teclado (Opcional)

| Atalho | Ação |
|--------|------|
| `Escape` | Restaura mapa ao center (se outro painel está promovido) |

### Critérios de Aceitação (Definition of Done)

- [ ] Clicar ↗ em um grupo no dock → grupo ocupa o center, mapa desaparece
- [ ] Clicar ↘ (Restaurar Mapa) no center → mapa volta, grupo volta ao dock
- [ ] Mapa NÃO desmonta (tiles e estado preservados)
- [ ] Transição fade-in ao trocar conteúdo do center
- [ ] `Escape` restaura o mapa quando um painel está promovido
- [ ] Apenas um painel pode estar no center por vez
- [ ] WebGL `frameloop` pausa quando mapa está oculto
- [ ] Compila sem erros TypeScript

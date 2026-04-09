# SPEC-004 — Dock Standardization (Minimap PanelGroup)

**Épico**: UX-003 Minimap Docking  

## Problema
O minimapa inserido no dock durante a fase anterior do UX-003 comportou-se como um elemento cru ("raw"). Ele possui um botão nativo por cima (o overlay "Restaurar Mapa") que quebra a estética do design system recém padronizado do Kurupira. Além disso, o minimapa não é colapsável, ocupando 48px de altura (ou mais) na barra lateral permanentemente, mesmo que o usuário queira esconder o mapa temporariamente para focar nas opções do dock.

## O Objetivo
Padronizar a devolução hierárquica do mapa quando docado. O minimapa deve se travestir de um `PanelGroup` completo.
1. O minimapa passa a ser colapsável.
2. O ícone de `[↗]` (maximizar) do `PanelGroup` servirá como a âncora de `restoreMap`.
3. O feio Overlay interligado hardcoded na React Portal é removido e passamos o CSS `pointer-events-none` estrito pro seu lugar.

---

## Escopo Técnico

### 1. `store/panelStore.ts`
Estender a tipagem de IDs de grupos lógicos para suportar o estado do novo painel fantasma.
```typescript
export type PanelGroupId = 'site' | 'simulation' | 'electrical' | 'properties' | 'minimap';
```

### 2. `ui/panels/RightInspector.tsx`
No `PanelSlot`, quando um painel é promovido (`isPromoted === true`), renderizaremos a âncora do portão dentro da máquina padrão de layout `PanelGroup`.

```tsx
  if (isPromoted) {
    return (
      <PanelGroup
        id="minimap" // Registra no Zustand pra habilitar colapso independente
        label="Mapa e Topologia"
        icon={<Map size={10} />}
        accentColor="text-emerald-500"
        onMaximize={restoreMap} // O maximizar natural funciona como trigger para resgatar ele no center!
      >
        <div 
          id="minimap-portal-target" 
          className="w-full h-48 bg-slate-900 relative shadow-inner overflow-hidden pointer-events-none"
        />
      </PanelGroup>
    );
  }
```

### 3. `ui/panels/CenterCanvas.tsx`
Remover toda a estrutura do `MinimapLockedOverlay` (as divs `z-[9999]` com hover transparentes e botão verde). O `<MapLayer>` passará o portal para a interface nativa nua, e a interação continuará travada pois o `pointer-events-none` da div alvo do portal no passo (2) cuidará de congelar interações do mouse.

# SPEC-005 — Panel Store (Estado de Painéis)

**Épico**: UX-002 Panel System  
**Fase**: 2 (Center Swap)  
**Prioridade**: P1  
**Dependências**: SPEC-001, SPEC-002 (grupos e container devem existir)  

---

## Problema de Negócio

Para permitir a comutação de painéis entre o dock e o center canvas, é 
necessário um estado global que rastreie:
- Qual conteúdo está no center slot
- Quais grupos estão colapsados no dock
- Qual foi o último grupo promovido (para animação de transição)

Esse estado é **transiente** (não persiste entre sessões) e deve seguir 
o padrão existente do `uiStore.ts` — Zustand sem persist nem middleware.

## Usuário Final

Engenheiro solar que quer maximizar uma análise específica (ex: gráfico 
de geração vs consumo) ocupando a tela central.

## Escopo

### ✅ Incluso
- Criar `panelStore.ts` com Zustand
- Tipos para PanelGroupId
- Actions para promote/restore/toggle

### ❌ Excluso
- Persistência em localStorage (decisão pendente)
- Middleware Zundo (não há necessidade de undo/redo em layout)
- Lógica de drag & drop

## Especificação Técnica

### Arquivo a Criar

```
kurupira/frontend/src/modules/engineering/store/panelStore.ts
```

### Schema do Store

```typescript
/**
 * IDs dos grupos registrados no dock.
 * Extensível — novos grupos podem ser adicionados sem alterar a store.
 */
export type PanelGroupId = 'site' | 'simulation' | 'electrical' | 'properties';

interface PanelState {
  /** 
   * Qual conteúdo está renderizado no Center Slot.
   * Default: 'map' — o mapa Leaflet/WebGL.
   * Quando um painel é "promovido", este valor muda para o ID do painel.
   */
  centerContent: 'map' | PanelGroupId;

  /**
   * Set de IDs de grupos atualmente colapsados no dock.
   * Grupos fora deste set estão expandidos.
   */
  collapsedGroups: Set<PanelGroupId>;

  // ── Actions ──

  /** Promove um grupo ao center. O mapa automaticamente vai para o dock. */
  promoteToCenter: (groupId: PanelGroupId) => void;

  /** Restaura o mapa ao center. O grupo promovido volta ao dock. */
  restoreMap: () => void;

  /** Toggle collapse de um grupo no dock. */
  toggleCollapse: (groupId: PanelGroupId) => void;

  /** Fecha (colapsa) um grupo específico. */
  collapseGroup: (groupId: PanelGroupId) => void;

  /** Expande um grupo específico. */
  expandGroup: (groupId: PanelGroupId) => void;
}
```

### Convenience Hooks

```typescript
/** Retorna apenas o conteúdo do center (re-render só quando muda) */
export const useCenterContent = () => usePanelStore(s => s.centerContent);

/** Retorna se um grupo específico está colapsado */
export const useIsCollapsed = (id: PanelGroupId) => 
  usePanelStore(s => s.collapsedGroups.has(id));

/** Retorna se um grupo específico está promovido ao center */
export const useIsPromoted = (id: PanelGroupId) => 
  usePanelStore(s => s.centerContent === id);
```

### Invariantes

1. **Apenas um painel no center por vez** — `promoteToCenter` substitui, não acumula
2. **O mapa nunca é destruído** — quando `centerContent !== 'map'`, o mapa usa `display: none`
3. **Colapsar um grupo promovido** — Se o grupo está no center, colapsar não faz nada (o grupo está maximizado)
4. **Restaurar o mapa** quando nenhum painel está promovido é no-op

### Critérios de Aceitação (Definition of Done)

- [ ] `panelStore.ts` criado com types, store e hooks
- [ ] `promoteToCenter` + `restoreMap` funcionam corretamente
- [ ] `toggleCollapse` é um Set toggle discreto (sem setState contínuo)
- [ ] Convenience hooks exportados e tipados
- [ ] Compila sem erros TypeScript
- [ ] Nenhum middleware adicional (sem Zundo, sem persist)

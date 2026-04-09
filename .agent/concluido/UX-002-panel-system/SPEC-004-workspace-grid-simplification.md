# SPEC-004 — Simplificação do Grid do WorkspaceLayout

**Épico**: UX-002 Panel System  
**Fase**: 1 (Organizacional)  
**Prioridade**: P0 (Finalização da Fase 1)  
**Dependências**: SPEC-003 (PropertiesGroup absorvido pelo dock)  

---

## Problema de Negócio

O `WorkspaceLayout.tsx` atualmente mantém um grid de **4 colunas** para 
acomodar o `PropertiesDrawer` como coluna independente entre o Outliner e 
o Canvas. Com a absorção do PropertiesDrawer pelo RightInspector (SPEC-003), 
essa coluna se torna obsoleta e o grid pode ser simplificado para 3 colunas.

**Antes:**
```
"ribbon   ribbon   ribbon   ribbon"
"outliner drawer   canvas   inspector"
```

**Depois:**
```
"ribbon   ribbon   ribbon"
"outliner canvas   dock"
```

## Usuário Final

Engenheiro solar — ganha mais espaço no canvas central.

## Escopo

### ✅ Incluso
- Remover coluna `drawer` do CSS Grid
- Remover import e renderização condicional do `PropertiesDrawer`
- Simplificar cálculo de `gridCols` (3 ao invés de 4)
- Renomear `inspector` → `dock` no grid template areas

### ❌ Excluso
- Mudanças no Center Canvas
- Redimensionamento dinâmico de colunas (resize handles)
- Lógica de swap de painéis (Fase 2)

## Especificação Técnica

### Arquivo a Modificar

```
kurupira/frontend/src/modules/engineering/ui/layout/WorkspaceLayout.tsx
```

### Mudanças Específicas

#### 1. Remover imports obsoletos
```diff
- import { PropertiesDrawer } from '../panels/properties/PropertiesDrawer';
- import { useSelectedEntity } from '@/core/state/uiStore';
```

#### 2. Remover lógica do drawer
```diff
- const selectedEntity = useSelectedEntity();
- const isDrawerOpen = selectedEntity.type !== 'none';
```

#### 3. Simplificar grid template
```diff
  const gridCols = [
    leftOpen ? '240px' : '0px',
-   isDrawerOpen ? '280px' : '0px',
    '1fr',
    rightOpen ? '300px' : '0px',
  ].join(' ');

  // Grid areas
- gridTemplateAreas: `
-   "ribbon ribbon ribbon ribbon"
-   "outliner drawer canvas inspector"
- `,
+ gridTemplateAreas: `
+   "ribbon ribbon ribbon"
+   "outliner canvas dock"
+ `,
```

#### 4. Remover bloco do drawer
```diff
- {/* ── PROPERTIES DRAWER (row 2, col 2 — conditional) ── */}
- {isDrawerOpen && (
-   <div style={{ gridArea: 'drawer' }} ...>
-     <PropertiesDrawer />
-   </div>
- )}
```

#### 5. Renomear grid area do inspector
```diff
- style={{ gridArea: 'inspector' }}
+ style={{ gridArea: 'dock' }}
```

### Critérios de Aceitação (Definition of Done)

- [ ] Grid do WorkspaceLayout com 3 colunas (outliner | canvas | dock)
- [ ] `PropertiesDrawer` removido como coluna independente
- [ ] Canvas ocupa mais espaço horizontal (a coluna drawer de 280px sumiu)
- [ ] Propriedades agora aparecem dentro do dock (via SPEC-003)
- [ ] Compila sem erros TypeScript
- [ ] Seleção de entidade no mapa/outliner mostra propriedades no dock (não em coluna separada)

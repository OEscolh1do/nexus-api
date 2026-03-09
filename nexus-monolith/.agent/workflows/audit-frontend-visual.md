---
description: How to audit a frontend view for invisible elements, layout ghosts, CSS deformations and visual regressions
---

# Auditoria Visual de Frontend (Ghost Elements & Layout Forensics)

## Quando Usar

- Elementos que "empurram" outros sem motivo visível
- Scrollbars fantasma (horizontal ou vertical) que aparecem sem conteúdo extravazando
- Espaçamentos estranhos entre componentes (padding/margin invisível)
- Sobreposição de elementos (z-index war) sem serem notados
- Layout que "quebra" em certas resoluções mas parece ok em outras
- Componentes renderizados mas com `opacity: 0` ou `visibility: hidden` ocupando espaço
- Containers vazios com `min-height` ou `height` definidos sem conteúdo

## Fase 1: Detecção (Forensics)

Abrir a view suspeita no browser e executar os seguintes diagnósticos:

### 1. Ghost Element Scan
Injetar CSS de diagnóstico para revelar TODOS os elementos e seus limites:
```javascript
// Executar no Console do DevTools — revela toda a box-model
document.querySelectorAll('*').forEach(el => {
  el.style.outline = '1px solid rgba(255,0,0,0.3)';
});
```
Isto revela imediatamente containers invisíveis, divs fantasma e elementos com dimensão mas sem conteúdo visual.

### 2. Invisible Element Detector
Buscar elementos que ocupam espaço mas são invisíveis:
```javascript
document.querySelectorAll('*').forEach(el => {
  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  const isInvisible = style.opacity === '0' || 
                      style.visibility === 'hidden' || 
                      style.color === style.backgroundColor ||
                      (rect.width > 0 && rect.height > 0 && el.innerText?.trim() === '' && !el.querySelector('img, svg, canvas, video'));
  if (isInvisible && rect.width > 50 && rect.height > 50) {
    el.style.outline = '3px dashed magenta';
    console.warn('GHOST ELEMENT:', el.tagName, el.className, `${rect.width}x${rect.height}px`, el);
  }
});
```

### 3. Overflow Forensics (Scrollbar Fantasma)
Identificar qual elemento está causando scrollbar indesejada:
```javascript
document.querySelectorAll('*').forEach(el => {
  if (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight) {
    el.style.outline = '3px solid cyan';
    console.warn('OVERFLOW:', el.tagName, el.className, 
      `scroll: ${el.scrollWidth}x${el.scrollHeight}`, 
      `client: ${el.clientWidth}x${el.clientHeight}`);
  }
});
```

### 4. Z-Index Map (Sobreposição)
Mapear a guerra de z-index:
```javascript
const zMap = [];
document.querySelectorAll('*').forEach(el => {
  const z = getComputedStyle(el).zIndex;
  if (z !== 'auto' && z !== '0') {
    zMap.push({ z: parseInt(z), tag: el.tagName, class: el.className, el });
  }
});
zMap.sort((a, b) => b.z - a.z);
console.table(zMap.slice(0, 20));
```

### 5. Layout Shift Audit
Verificar se elementos mudam de posição durante o carregamento:
```javascript
new PerformanceObserver(list => {
  list.getEntries().forEach(entry => {
    console.warn('LAYOUT SHIFT:', entry.value.toFixed(4), entry.sources?.map(s => s.node));
  });
}).observe({ type: 'layout-shift', buffered: true });
```

## Fase 2: Análise Estática (Código)

Após identificar os elementos fantasma no browser, buscar no código:

### Padrões Suspeitos a Procurar

1. **Containers com dimensão mas sem conteúdo:**
   - `min-height` em divs vazias ou com conteúdo condicionalmente renderizado
   - `height: 100vh` em wrappers intermediários que empurram o layout

2. **Margin/Padding Excessivo:**
   - `margin-bottom` em último filho de um container (empurra para baixo sem necessidade)
   - `padding` em containers que já têm `gap` do flexbox/grid

3. **Flexbox/Grid Ghosts:**
   - `flex-grow: 1` em elementos que não deveriam expandir
   - `grid-template-rows: 1fr` com linhas vazias

4. **Componentes Condicionais Mal Estruturados:**
   ```tsx
   // ❌ ERRADO: o wrapper div existe mesmo quando vazio
   <div className="content-area">
     {showContent && <Content />}
   </div>
   
   // ✅ CORRETO: sem wrapper quando não há conteúdo
   {showContent && (
     <div className="content-area">
       <Content />
     </div>
   )}
   ```

5. **Elementos Legados/Órfãos:**
   - Componentes importados mas nunca renderizados
   - CSS classes definidas mas não utilizadas
   - Breakpoints que renderizam diferentes layouts mas ambos ficam no DOM

## Fase 3: Correção

1. **Eliminar** — Remover completamente o elemento se é vestigial
2. **Condicionar** — Envolver em renderização condicional se só aparece em certos estados
3. **Colapsar** — Usar `display: none` (não ocupa espaço) em vez de `visibility: hidden` (ocupa)
4. **Auditar overflow** — Adicionar `overflow: hidden` ou `overflow: auto` no container correto
5. **Normalizar z-index** — Usar apenas 3 camadas: `z-10` (elevado), `z-20` (modal), `z-50` (toast)

## Checklist Final

- [ ] Executou Ghost Element Scan no browser
- [ ] Identificou e removeu/corrigiu elementos fantasma
- [ ] Scrollbars fantasma eliminadas
- [ ] Verificou em viewport mobile (375px) e desktop (1440px)
- [ ] `npm run build` passa sem erros

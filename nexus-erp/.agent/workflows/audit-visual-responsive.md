---
description: Auditoria Visual e de Responsividade UI
---

# Fluxo de Trabalho: Auditoria Visual e Responsiva

Este workflow deve ser executado para garantir que novos componentes e views obedeçam ao padrão Premium Visual Design e funcionem em todas as resoluções.

1. **Checagem de Breakpoints (Responsividade)**:
   - Teste o componente em Mobile (ex: `sm`, `< 640px`).
   - Teste o componente em Tablet (ex: `md` a `lg`).
   - Teste o componente em Desktop (ex: `xl`, `2xl`).
   - Verifique se tabelas possuem scroll horizontal em mobile invés de quebrar a tela.

2. **Aderência ao Design System Premium**:
   - Utilize a paleta utilitária do Tailwind mapeada em `tailwind.config.js`.
   - Adicione *Glassmorphism* usando utilitários adequados (ex: `backdrop-blur-*`, fundos translúcidos).
   - Confirme se os micro-estados de interação (`hover:`, `focus:`, `active:`, `disabled:`) estão visíveis e suaves (usando `transition-all duration-200`).

3. **Consistência de Espaçamento e Tipografia**:
   - Evite magic numbers. Use a escala do Tailwind (`p-4`, `m-2`, `gap-3`).
   - Verifique alinhamentos horizontais e verticais em flexboxes e grids.

4. **Tratamento de Imagens e Ícones**:
   - Assegure que as imagens têm atributos `alt` e não deformam (use `object-cover` ou `object-contain`).
   - Ícones SVG devem escalar corretamente com classes `w-* h-*` e preenchimento `fill-current` ou `text-*`.

5. **Ferramentas Práticas**:
   - Use o DevTools do Navegador no modo "Device Toolbar".
   - Limpe o cache e desative extensões para testar o visual puro.

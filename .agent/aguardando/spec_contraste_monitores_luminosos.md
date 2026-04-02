# Especificação: Ajustes de Contraste para Monitores de Alta Luminosidade

## 1. O Quê (Business Problem)
**Problema**: O tema dark glassmorphism Premium implementado em toda a interface do Kurupira (catálogos, ProjectExplorer, diálogos) foi projetado para monitores de desenvolvimento com calibração padrão. Em monitores de escritório com alta luminosidade (laptops baratos, monitores TN, ambientes com muita luz), os gradientes sutis (`slate-700/40`, `slate-800/30`) e textos `slate-500` podem perder legibilidade.

**Solução**: Criar um sistema de perfis de contraste (acessibilidade) que ajuste dinamicamente os tokens de cor sem redesenhar componentes.

## 2. Usuários Finais
- **Engenheiro em campo**: Usa laptop em obra com sol direto; precisa de contraste alto.
- **Engenheiro no escritório**: Monitor calibrado, tema dark padrão funciona perfeitamente.

## 3. Critérios de Aceitação
1. Toggle nas Premissas (`SettingsModule`) para "Modo de Alto Contraste".
2. Em alto contraste: 
   - Bordas passam de `slate-700/60` → `slate-600`
   - Textos secundários passam de `slate-500` → `slate-300`
   - Backgrounds ganham +10% de opacidade
3. A configuração persiste via `localStorage` (não precisa de API).
4. Zero impacto no tamanho do bundle (CSS custom properties, não classes duplicadas).
5. Sem redesenho de componentes — apenas override de variáveis.

## 4. Fora de Escopo
- Tema claro (light mode) completo — mantemos apenas dark.
- Modo de daltonismo (protanopia/deuteranopia) — escopo futuro separado.
- Certificação WCAG AAA — meta é AA (ratio 4.5:1 para texto normal).

## 5. Implementação Sugerida
```css
:root {
  --border-primary: theme('colors.slate.700 / 60%');
  --text-secondary: theme('colors.slate.500');
  --bg-overlay: theme('colors.slate.800 / 30%');
}

[data-contrast="high"] {
  --border-primary: theme('colors.slate.600');
  --text-secondary: theme('colors.slate.300');
  --bg-overlay: theme('colors.slate.800 / 50%');
}
```

---
*Status: Aguardando feedback de engenheiros em campo. Monitorar proativamente.*

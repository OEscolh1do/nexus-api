---
description: Auditoria de Acessibilidade (a11y) Padrão
---

# Fluxo de Trabalho: Auditoria de Acessibilidade (a11y)

Garante que o Nexus ERP seja legível e utilizável por todos os usuários, incluindo os que dependem de teclado ou leitores de tela.

1. **Semântica HTML**:
   - Evite excesso de `<div>`. Use marcações apropriadas: `<header>`, `<main>`, `<nav>`, `<article>`, `<section>`, `<footer>`.
   - Use botões (`<button>`) para ações e âncoras (`<a>`) para navegação. Nunca use div com `onClick` se a ação for de um botão.

2. **Cores e Contraste**:
   - Audite os textos em cima de fundos translúcidos (Glassmorphism) para garantir que o contraste atenda os limites mínimos (taxa 4.5:1 para textos normais).

3. **Suporte a Teclado (Focus Management)**:
   - Todos os componentes interativos devem ser navegáveis pela tecla `Tab`.
   - Não remova o outline de foco nativo sem prover um customizado visualmente aparente (ex: `focus-visible:ring`).
   - Modais devem aprisionar o foco (Focus Trap) e serem fecháveis mediante tecla `Esc`.

4. **Atributos ARIA (Roles e Labels)**:
   - Inputs precisam ter rótulos associados (via tag `<label htmlFor="...">` ou `aria-label`).
   - Elementos não-visuais que transmitem estados, como carregamento ou alertas de sucesso, devem usar `aria-live="polite"`.

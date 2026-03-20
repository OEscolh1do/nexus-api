---
description: Criação Padronizada de Novos Módulos completos
---

# Fluxo de Trabalho: Criação de Módulo (Novo Aplicativo/Feature) no Nexus Hub

1. **Requisitos e Setup Visual**:
   - Defina o nome do módulo em `src/modules/{nome-do-modulo}` ou nova view em `src/views/{nome-da-view}`.
   - Utilize as cores do *Design System* do Hub (roxo, azul e laranja brilhantes para destaques com tema escuro `#050510`).

2. **Criação de Estrutura Inicial**:
   - `ui/`: Onde residem os componentes `.tsx` visíveis.
   - `lib/` ou `api/`: Lógica de requisição à API usando a instância importada do Axios (sempre mandando os Headers com JWT).
   
3. **Gerenciamento de Rotas (`App.tsx`)**:
   - Registre a rota com suporte de Proteção de Autenticação se não for pública. 
   - No caso do `nexus-hub`, grande parte dos componentes deve residir após a checagem `isAuthenticated` a menos que seja um componente voltado pro Login.

4. **Revisão e Registro**:
   - Sempre certifique que as classes Tailwind utilizam Tailwind v3.4 com `clsx` e `twMerge` (`cn`) quando houver condicionais profundas.

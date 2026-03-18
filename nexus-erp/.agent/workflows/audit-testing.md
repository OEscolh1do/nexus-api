---
description: Auditoria de Cobertura e Qualidade de Testes Automatizados Front-end
---

# Fluxo de Trabalho: Auditoria de Testes Front-end

Refatorar sem testes é andar em campo minado. Este workflow garante que as partes críticas do Nexus ERP tenham cobertura mínima antes e depois de qualquer refatoração de risco.

1. **Testes Unitários de Regras de Negócio (`Vitest`)**:
   - Funções puras em `src/lib/` e Custom Hooks em `src/hooks/` são os candidatos prioritários a testes unitários.
   - Use `Vitest` (já configurado com Vite) para testar cenários de sucesso, falha e edge cases.
   - Exemplo: Testar se `formatCurrency(1500)` retorna `"R$ 1.500,00"` e `useEstoqueFilters()` filtra corretamente por categoria.

2. **Testes de Componente (`React Testing Library`)**:
   - Componentes críticos de UI (formulários, tabelas de dados, modais de confirmação) devem ter testes que validem comportamento do usuário, não implementação.
   - Use `@testing-library/react` + `@testing-library/user-event`.
   - **Regra**: Prefira `getByRole`, `getByLabelText` sobre `getByTestId`. Teste o que o usuário vê.
   - Exemplos de casos a cobrir: formulário exibe erro ao submeter vazio; botão fica desabilitado durante loading.

3. **Testes de Integração / E2E (`Playwright`)**:
   - Fluxos críticos de negócio devem ter cobertura E2E mínima: Login, Criar Pedido, Visualizar Estoque.
   - Configure o Playwright para rodar contra o servidor de dev (`http://localhost:5173`).
   - Esses testes devem ser executados antes de qualquer release ou refatoração de módulo crítico.

4. **Auditoria de Cobertura Antes de Refatorar**:
   - Antes de iniciar qualquer refatoração de um módulo, rode `vitest --coverage` para mapear a cobertura atual.
   - Nunca reduza a cobertura de um módulo após uma refatoração. Use o relatório como linha de base.

5. **Mocking de Dependências Externas**:
   - Chamadas de API devem ser mockadas em testes unitários e de componente via `vi.mock('axios')` ou `msw` (Mock Service Worker) para testes de integração mais realistas.
   - Nunca faça chamadas reais à API em testes unitários.

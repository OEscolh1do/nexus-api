---
name: the-builder
description: Especialista em lógica de negócio, performance, rotas de API, Custom Hooks e integração de dados. Delega todas as decisões visuais ao design-lead para evitar confusão de contexto.
---

# Skill: The Builder

## Gatilho Semântico

Ativado quando a tarefa envolve: endpoints de API (Express/Fastify), Custom Hooks (React Query, SWR, Zustand), lógica de negócio, validações de domínio, serviços, middlewares, migrations de banco de dados ou otimizações de performance.

## ⛔ Escopo de Não-Intervenção (Hard Boundaries)

- ❌ CSS, classes Tailwind, tokens de design — responsabilidade do `design-lead`
- ❌ Estrutura visual de componentes (JSX além do estritamente necessário)
- ❌ Animações e micro-interações

## Protocolo de Desenvolvimento

### Camada de API (Backend)

1. **Rota**: Crie o endpoint no arquivo de rotas correspondente (`routes/<dominio>.js`).
2. **Middleware**: Aplique `authenticate` e `authorize(roles)` antes do handler.
3. **Validação**: Use Zod antes de processar o body da requisição.
4. **Service**: Mova a lógica de negócio para `services/<dominio>.service.js` — o controller deve apenas orquestrar.
5. **Resposta**: Padronize as respostas com o helper `ApiResponse` do projeto.

### Camada de Data Fetching (Frontend)

1. **Custom Hook**: Crie `use<Entidade>.ts` em `src/hooks/` encapsulando o `useQuery`/`useMutation`.
2. **Query Keys**: Use query keys descritivos e em array: `['clientes', { page, search }]`.
3. **Invalidação**: Após mutações bem-sucedidas, invalide as queries relacionadas.
4. **Error Handling**: Trate os estados `isLoading` e `isError` dentro do hook e exponha-os ao componente.

### Gestão de Estado Global (Zustand)

- Stores em `src/store/<dominio>.store.ts`.
- State deve ser **mínimo**: apenas o que não pode ser derivado ou cacheado via React Query.
- Actions devem ser nomeadas em imperativo: `setUser`, `clearAuth`, `addNotification`.

## Protocolo de Handoff para Design Lead

Ao entregar a camada de dados, documente o contrato:
```typescript
// O que o Design Lead receberá via props ou hook:
const { data: clientes, isLoading, error, refetch } = useClientes({ page, search });
```

---
description: How to refine, update or cover gaps in an existing module (full-stack)
---

# Aperfeiçoar Módulo Existente (Module Refinement & Gap Covering)

## Quando Usar

- Adicionar um novo campo a uma entidade existente
- Cobrir gaps de validação (ex: regra de negócio que estava faltando)
- Atualizar fluxos para suportar novos papéis (RBAC)
- Refatorar um controller inchado (extraindo para Services)
- Adicionar ou melhorar integrações cross-module (via eventos)

## Passo a Passo de Execução

Ao modificar um módulo existente, a ordem de execução é fundamental para evitar quebrar o sistema. Siga o fluxo **Back-to-Front**.

### 1. Auditoria Rápida (Discovery)
Antes de alterar código, entenda o ecossistema atual da entidade alvo:
1. Veja o modelo em `backend/prisma/schema.prisma`
2. Veja o Zod schema em `backend/src/modules/<modulo>/schemas/`
3. Veja o Service correspondente
4. Veja a View React e seu form correspondente

### 2. Update de Banco (Database)
Se a alteração envolve dados persistentes:
1. Edite o `schema.prisma`
2. Garanta que relações não quebram `withTenant`
// turbo
3. Aplique a migração:
```bash
cd backend && npx prisma db push && npx prisma generate
```

### 3. Update de Validação (Zod Schemas)
Toda mudança no backend **deve começar pelo Zod**, pois ele é a barreira:
- Atualize `createSchema` e `updateSchema` adicionando os novos campos.
- Garanta que regras estritas (ex: `min()`, `regex`) refletem a realidade do negócio.
- Nunca adicione campos ignorando o Zod.

### 4. Update de Lógica (Service Layer)
- Modifique a função em `service.js` se precisar de regras complexas para salvar os novos dados.
- Lembrete: Queries Prisma dentro do Service DEVEM usar a transação fornecida pelo `withTenant(tx)`.
- Se a mudança gerar impacto em outros módulos, emita um evento via `events.emit('<modulo>.<entidade>.updated', payload)`.

### 5. Update de Rotas (Controller)
- O controller quase nunca precisa mudar se ele usar o padrão de passar `req.body` validado para o Service. 
- Adicione/modifique lógica de permissão via `requireRole([...])` se o novo gap for de acesso.

### 6. Update Declarativo Frontend (TypeScript Types)
- Atualize as interfaces TypeScript associadas em `frontend/src/types/<entidade>.ts` ou no arquivo de API `lib/api/<entidade>.ts`. O Frontend deve saber que o novo campo existe e seu tipo exato.

### 7. Update UI Frontend (Views / Hooks / Components)
Se a refinaria incluir campos visíveis ou fluxos interativos:
- Atualize o schema Zod replicado no frontend para o `react-hook-form`.
- Modifique formulários adicionando os novos inputs da biblioteca Shadcn/UI (em `src/components/ui/`).
- Trate condicionais: se o campo for nulo em dados antigos, como a UI renderiza?

## Regras de Cuidado (Safety Checks)

- **Backward Compatibility:** A mudança quebra APIs consumidas pelo Mobile?
- **Logs de Auditoria:** Se a mudança for sensível (ex: status financeiro), adicione uma linha para gerar o rastro de auditoria.
- **Tenant Isolation:** Nenhuma ação feita para "cobrir o gap" deve vazar dados de um `tenantId` para outro. O uso mandatório de `withTenant(tx)` garante isso na camada Prisma.

// turbo
## Verificar Build Frontend
Antes de finalizar:
```bash
cd frontend && npm run build
```

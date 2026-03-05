# ADR 003: Estratégia de Multi-tenancy (SaaS)

## Status

Aceito

## Contexto

O Neonorte | Nexus Monolith foi inicialmente concebido para uso interno da Neonorte (Single-Tenant). Contudo, a visão estratégica de 2026 prevê a comercialização da plataforma como SaaS (UN 3.2). Refatorar um sistema Single-Tenant para Multi-Tenant _após_ o lançamento é proibitivamente caro e arriscado.

## Decisão

Implementar isolamento de dados por **Multi-tenancy Lógico** (Row-Level Isolation) desde já.

### Diretrizes Técnicas

1.  **Schema de Banco de Dados:**
    - Toda tabela principal (ie: `Project`, `Lead`, `Objective`) DEVE ter uma coluna `tenantId` (String/UUID).
    - A única exceção são tabelas de sistema global (ex: `PricingPlans`, `SysConfig`).
2.  **Validação (Zod):**
    - Todo Schema de Criação (Input) deve prever ou injetar `tenantId`.
3.  **Service Layer:**
    - **Proibido:** `prisma.lead.findMany({})` (Isso retorna leads de concorrentes misturados!).
    - **Obrigatório:** `prisma.lead.findMany({ where: { tenantId: ctx.user.tenantId } })`.
4.  **Middleware:**
    - O `auth.middleware.js` deve garantir que o `tenantId` esteja presente no objeto `req.user`.

## Consequências

- **Segurança:** Garante que Dados da "Empresa A" nunca vazem para "Empresa B".
- **Complexidade:** Aumenta o boilerplate das queries Prisma, exigindo atenção constante no Code Review.
- **Futuro:** Permite escalar para milhares de clientes sem criar milhares de bancos de dados.

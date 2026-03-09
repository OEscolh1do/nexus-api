# ADR 003: Estratégia de Multi-tenancy (SaaS)

## Status

Aceito — **Implementado universalmente** (7 ciclos de auditoria SEC-OPS, Mar 2026)

## Contexto

O Neonorte | Nexus Monolith foi inicialmente concebido para uso interno da Neonorte (Single-Tenant). Contudo, a visão estratégica de 2026 prevê a comercialização da plataforma como SaaS (UN 3.2). Refatorar um sistema Single-Tenant para Multi-Tenant _após_ o lançamento é proibitivamente caro e arriscado.

## Decisão

Implementar isolamento de dados por **Multi-tenancy Lógico** (Row-Level Isolation).

### Diretrizes Técnicas

1.  **Schema de Banco de Dados:**
    - Toda tabela principal (ie: `Project`, `Lead`, `Objective`) DEVE ter uma coluna `tenantId` (String).
    - Exceção: tabelas de sistema global (ex: `PricingPlans`, `SysConfig`).
2.  **Service Layer — `withTenant(tx)`:**
    - **Proibido:** `prisma.lead.findMany({})` (retorna dados de todos os tenants).
    - **Obrigatório:** Usar `withTenant(tenantId, async (tx) => { ... })` que injeta `tenantId` automaticamente via `asyncLocalStorage`. Todas as queries dentro do callback são isoladas.
    - O `auth.middleware.js` propaga `tenantId` + `userId` no contexto assíncrono via `asyncLocalStorage`.
3.  **CRONs e Background Jobs:**
    - Não existe contexto HTTP. O job deve extrair `tenantId` dos registros que processa e usar `withTenant` explicitamente.
    - Locking distribuído via `cron-lock.js` com `lockSignature` para release idempotente.
4.  **Audit Trail:**
    - `asyncLocalStorage` propaga `tenantId` + `userId` para o middleware de auditoria, que persiste em banco automaticamente.

## Consequências

- **Segurança:** Dados da "Empresa A" nunca vazam para "Empresa B". Validado em 7 ciclos de auditoria.
- **Complexidade:** Requer disciplina com `withTenant`, mas elimina o boilerplate manual de `tenantId` em cada query.
- **Futuro:** Permite escalar para milhares de clientes sem criar milhares de bancos de dados.

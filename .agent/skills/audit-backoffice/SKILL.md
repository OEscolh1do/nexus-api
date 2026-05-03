---
name: audit-backoffice
description: Especialista em auditoria administrativa, supervisão de sistema e monitoramento operacional do Sumaúma. Ative ao implementar visualização de AuditLogs com prefixo ADMIN_*, timeline de eventos, healthcheck dos serviços (Kurupira), dashboards de KPIs da plataforma ou diagnóstico de problemas de tenants. Cobre leitura cross-database (db_sumauma + db_iaca_RO + db_kurupira_RO) e probes HTTP de saúde.
---

# Skill: Audit Backoffice

## Gatilho Semântico

Ativado quando:
- O agente precisa implementar visualização de AuditLogs no painel Sumaúma
- A tarefa envolve construir dashboards de saúde do sistema (healthcheck, uptime, KPIs)
- É necessário criar ferramentas de diagnóstico para resolução de problemas de tenants
- O agente precisa implementar monitoramento de jobs (cron), quotas ou status de serviços
- Qualquer menção a: `AuditLog`, `ADMIN_*`, `healthcheck`, `saúde do sistema`, `diagnóstico`, `monitoramento`
- Alterações nas rotas `/admin/audit-logs`, `/admin/system/*` ou `/admin/dashboard` do BFF

## Protocolo

### 1. AuditLog — Modelo e Padrão de Escrita

Toda mutação administrativa realizada pelo operador do Sumaúma **deve** gerar um AuditLog:

```javascript
// lib/auditLogger.js
const { prisma } = require('./prismaClient');
const logger = require('./logger');

async function auditLog({ operator, action, entity, resourceId, ipAddress, userAgent, details }) {
  try {
    await prisma.auditLog.create({
      data: { operatorId: operator.id, action, entity, resourceId, ipAddress, userAgent, details },
    });
  } catch (err) {
    logger.error('auditLog: falha ao registrar', { err: err.message, action, resourceId });
  }
}

module.exports = { auditLog };
```

#### Helper ctx(req) — obrigatório em toda rota com mutação

```javascript
const ctx = (req) => ({
  operator: req.operator,        // { id, email, roles } — populado pelo platformAuth
  ipAddress: req.ip ?? req.headers['x-forwarded-for'],
  userAgent: req.headers['user-agent'],
});

// Uso em rota:
await auditLog({ ...ctx(req), action: 'ADMIN_CREATE_TENANT', entity: 'Tenant', resourceId: tenant.id });
await auditLog({ ...ctx(req), action: 'ADMIN_BLOCK_USER',   entity: 'User',   resourceId: user.id });
```

#### Prefixo ADMIN_* obrigatório

| Ação | action |
|:---|:---|
| Criar tenant | `ADMIN_CREATE_TENANT` |
| Editar tenant | `ADMIN_UPDATE_TENANT` |
| Bloquear tenant | `ADMIN_BLOCK_TENANT` |
| Criar user | `ADMIN_CREATE_USER` |
| Bloquear user | `ADMIN_BLOCK_USER` |
| Alterar role | `ADMIN_UPDATE_USER_ROLE` |
| Adicionar ao catálogo | `ADMIN_CREATE_CATALOG_ITEM` |
| Desativar do catálogo | `ADMIN_DEACTIVATE_CATALOG_ITEM` |

> AuditLogs são **append-only** — nunca modificar ou excluir registros existentes.

### 2. Fontes de Dados

| Fonte | Banco | Acesso | O que Contém |
|:---|:---|:---|:---|
| `AuditLog` | db_sumauma | Prisma (escrita) | Ações ADMIN_* realizadas pelo operador Sumaúma |
| `Tenant`, `User` | db_sumauma | Prisma (escrita) | Estado atual de tenants e usuários |
| `AuditLog` (legado) | db_iaca | Prisma READ-ONLY | Ações de usuários finais no Iaçã (login, CRUD projetos) |
| `TechnicalDesign` | db_kurupira | Prisma READ-ONLY | Volume de projetos de engenharia |
| Kurupira `/health` | HTTP | Probe | Status do serviço Kurupira |

### 3. Endpoints de Auditoria

| Endpoint | Método | Descrição |
|:---|:---|:---|
| `/admin/audit-logs` | GET | Listagem paginada com filtros (tenant, action, dateRange) |
| `/admin/audit-logs/:id` | GET | Detalhe de um log com campo `details` expandido |
| `/admin/audit-logs/stats` | GET | Agregações: ações por dia, top operators, top entities |

#### Filtros Disponíveis

| Filtro | Tipo | Exemplo |
|:---|:---|:---|
| `tenantId` | Select | Filtrar logs de um tenant específico |
| `operatorId` | Select | Filtrar logs de um operador |
| `action` | Multi-select | `ADMIN_BLOCK_*`, `ADMIN_CREATE_*` |
| `entity` | Select | `Tenant`, `User`, `CatalogItem` |
| `dateFrom` / `dateTo` | DatePicker | Intervalo de datas |

> Usar cursor-based pagination (`lastId` + `limit`) — não offset — para tabelas que crescem continuamente.

### 4. Endpoints de Sistema

| Endpoint | Método | Descrição |
|:---|:---|:---|
| `/admin/system/health` | GET | Probe de saúde dos serviços e bancos |
| `/admin/system/jobs` | GET | Status dos CronLocks (último run, próximo run) |
| `/admin/system/sessions` | GET | Sessões ativas agrupadas por tenant |

#### Healthcheck Implementation

```javascript
// routes/system.js
async function getSystemHealth(req, res) {
  const results = {
    kurupira: { status: 'unknown', latencyMs: null },
    dbSumauma: { status: 'unknown' },
    dbIaca: { status: 'unknown' },
    dbKurupira: { status: 'unknown' },
  };

  const probeHttp = async (key, url) => {
    const start = Date.now();
    try {
      const r = await axios.get(`${url}/health`, { timeout: 5000 });
      results[key] = { status: r.status === 200 ? 'healthy' : 'degraded', latencyMs: Date.now() - start };
    } catch {
      results[key] = { status: 'down', latencyMs: Date.now() - start };
    }
  };

  const probeDb = async (key, client) => {
    try {
      await client.$queryRaw`SELECT 1`;
      results[key] = { status: 'healthy' };
    } catch {
      results[key] = { status: 'down' };
    }
  };

  await Promise.all([
    probeHttp('kurupira', process.env.KURUPIRA_INTERNAL_URL),
    probeDb('dbSumauma', prisma),
    probeDb('dbIaca', prismaIaca),
    probeDb('dbKurupira', prismaKurupira),
  ]);

  const allHealthy = Object.values(results).every((r) => r.status === 'healthy');
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    services: results,
    checkedAt: new Date().toISOString(),
  });
}
```

### 5. Dashboard de KPIs (db_sumauma)

```
┌─────────────────────────────────────────────────────────────────┐
│ DASHBOARD — Visão Geral da Plataforma                          │
├──────────┬──────────┬──────────┬────────────────────────────────┤
│ Tenants  │ Usuários │ CORPORATE│ Saúde dos Serviços             │
│ Ativos   │ Totais   │ vs INDIV │ Kurupira ● db_iaca ● db_kuru ● │
├──────────┴──────────┴──────────┴────────────────────────────────┤
│ ATIVIDADE RECENTE (últimos 30 min)                             │
│ 17:45  op@neonorte  ADMIN_CREATE_TENANT   "Solar Norte Ltda"   │
│ 17:43  op@neonorte  ADMIN_BLOCK_USER      user#4821            │
│ 17:38  op@neonorte  ADMIN_CREATE_CATALOG  "JA Solar 550W"      │
└─────────────────────────────────────────────────────────────────┘
```

Queries de referência:
```javascript
// Tenants ativos por tipo
const byType = await prisma.tenant.groupBy({ by: ['type'], _count: true });

// Atividade recente (últimas 2h)
const recent = await prisma.auditLog.findMany({
  where: { createdAt: { gte: new Date(Date.now() - 2 * 3600_000) } },
  orderBy: { createdAt: 'desc' },
  take: 50,
});
```

### 6. Ferramentas de Diagnóstico

| Ferramenta | Propósito | Implementação |
|:---|:---|:---|
| **Tenant Lookup** | Visão consolidada de um tenant (users, plano, logtoOrgId) | Aggregate em db_sumauma |
| **User Lookup** | Operador procura user por email para resolver chamado | `user.findFirst({ where: { email } })` + AuditLogs recentes |
| **Event Timeline** | Reconstruir sequência de ações de um operador | AuditLogs filtrados por `operatorId` + `entity` + `resourceId` |

## Limitações e Boas Práticas

### Hard Boundaries
- ❌ AuditLogs são imutáveis — nunca modificar ou deletar registros.
- ❌ Esta skill NÃO executa operações de manutenção destrutivas no banco.
- ❌ Esta skill NÃO gerencia tenants/users — delegue ao `tenant-backoffice`.
- ❌ Esta skill NÃO define estética de componentes — delegue ao `ui-backoffice`.

### Boas Práticas
- ✅ Usar cursor-based pagination em AuditLogs (não offset).
- ✅ Healthcheck com cache de 30s — evitar bombardeio de probes.
- ✅ Dashboard de KPIs com polling a cada 60s (não WebSocket).
- ✅ Timeline de eventos deve exibir timestamp absoluto (`dd/MM/yyyy HH:mm:ss`) + relativo ("há 3 min").
- ✅ Prefixo `ADMIN_*` obrigatório em toda ação registrada pelo operador Sumaúma.

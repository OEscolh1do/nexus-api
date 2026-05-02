---
name: audit-backoffice
description: Especialista em auditoria, supervisão de sistema e monitoramento operacional do neonorte-admin. Ative ao implementar visualização de AuditLogs, timeline de eventos, healthcheck dos serviços (Iaçã/Kurupira), dashboards de KPIs da plataforma, controle de jobs (cron), ou diagnóstico de problemas de clientes. Cobre leitura cross-database e probes HTTP de saúde.
---

# Skill: Audit Backoffice

## Gatilho Semântico

Ativado quando:
- O agente precisa implementar visualização de `AuditLog` no painel Admin
- A tarefa envolve construir dashboards de saúde do sistema (healthcheck, uptime, métricas)
- É necessário criar ferramentas de diagnóstico para resolução de problemas de clientes
- O agente precisa implementar monitoramento de jobs (cron), quotas de API ou status de serviços
- Qualquer menção a: `audit`, `auditoria`, `logs`, `healthcheck`, `saúde do sistema`, `monitoramento`, `supervisão`, `diagnóstico`, `chamados`, `suporte`
- Alterações nas rotas `/admin/audit-logs`, `/admin/system/*` ou `/admin/dashboard` do BFF

## Protocolo

### 1. Fontes de Dados de Auditoria

| Fonte | Schema | Tipo de Acesso | O que Contém |
|:---|:---|:---|:---|
| `AuditLog` | db_iaca | Prisma READ-ONLY | Ações de usuários: login, CRUD de leads, edições de projeto |
| `Session` | db_iaca | Prisma READ-ONLY | Sessões ativas, tokens, expiração |
| `CronLock` | db_iaca | Prisma READ-ONLY | Status de jobs periódicos (JIT_CRON, SLA_CRON) |
| `TenantApiKey` | db_iaca | Prisma READ-ONLY | Chaves de API, último uso, expiração |
| `TechnicalDesign` | db_kurupira | Prisma READ-ONLY | Projetos de engenharia (volume, datas) |
| Iaçã `/health` | HTTP | Probe | Status do serviço Iaçã (200 = OK) |
| Kurupira `/health` | HTTP | Probe | Status do serviço Kurupira (200 = OK) |

### 2. Modelo do AuditLog (Referência — db_iaca)

```
AuditLog
├── id
├── tenantId    → Tenant
├── userId      → User (quem fez)
├── action      (ex: "CREATE_LEAD", "UPDATE_PROJECT", "LOGIN")
├── entity      (ex: "Lead", "Project", "User")
├── resourceId  (ID do recurso afetado)
├── details     (JSON ou texto livre com contexto)
├── before      (estado anterior — para diffs)
├── after       (estado posterior — para diffs)
├── ipAddress
├── userAgent
├── timestamp
└── eventId     → Event (opcional)
```

### 3. Endpoints

#### Auditoria

| Endpoint | Método | Descrição |
|:---|:---|:---|
| `/admin/audit-logs` | GET | Listagem paginada de AuditLogs com filtros |
| `/admin/audit-logs/:id` | GET | Detalhe de um log (com before/after diff) |
| `/admin/audit-logs/stats` | GET | Agregações: ações por dia, top users, top entities |

#### Filtros Disponíveis

| Filtro | Tipo | Exemplo |
|:---|:---|:---|
| `tenantId` | Select | Filtrar logs de um tenant específico |
| `userId` | Select/Search | Filtrar logs de um usuário |
| `action` | Multi-select | `LOGIN`, `CREATE_*`, `UPDATE_*`, `DELETE_*` |
| `entity` | Select | `Lead`, `Project`, `User`, `Opportunity` |
| `dateFrom` / `dateTo` | DatePicker | Intervalo de datas |
| `search` | Text | Busca livre em `details` |

#### Sistema

| Endpoint | Método | Descrição |
|:---|:---|:---|
| `/admin/system/health` | GET | Probe de saúde dos serviços e banco |
| `/admin/system/jobs` | GET | Status dos CronLocks (último run, próximo run) |
| `/admin/system/api-usage` | GET | Uso de API por tenant (`apiCurrentUsage / apiMonthlyQuota`) |
| `/admin/system/sessions` | GET | Sessões ativas, agrupadas por tenant |

### 4. Dashboard de Supervisão (KPIs)

```
┌─────────────────────────────────────────────────────────────────┐
│ DASHBOARD — Visão Geral da Plataforma                          │
├──────────┬──────────┬──────────┬──────────┬────────────────────┤
│ Tenants  │ Usuários │ Projetos │ Saúde    │ API Usage          │
│ Ativos   │ Totais   │ Ativos   │ Serviços │ (mês corrente)     │
│   12     │   347    │   89     │ ●● OK    │ ████████░░ 78%     │
│ +2 mês   │ +23 mês  │ +11 mês  │ 2/2 up   │ 780 / 1000 req    │
├──────────┴──────────┴──────────┴──────────┴────────────────────┤
│ ATIVIDADE RECENTE (últimos 30 min)                             │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ 17:45  João Silva (Tenant A)   CREATE_LEAD    "Maria..."  │ │
│ │ 17:43  Ana Costa (Tenant B)    LOGIN          IP: 189...  │ │
│ │ 17:41  Sistema                 JIT_CRON       OK          │ │
│ │ 17:38  Pedro Lima (Tenant A)   UPDATE_PROJECT "Solar..."  │ │
│ └────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────── │
│ ALERTAS                                                        │
│ ⚠ Tenant "Solar Norte" atingiu 95% da quota de API             │
│ ⚠ Job SLA_CRON não executou nas últimas 2h                     │
│ 🔴 2 sessões com token expirado há >24h (possível leak)        │
└─────────────────────────────────────────────────────────────────┘
```

### 5. Healthcheck Implementation

```javascript
// routes/system.js
async function getSystemHealth(req, res) {
  const results = {
    iaca: { status: 'unknown', latencyMs: null },
    kurupira: { status: 'unknown', latencyMs: null },
    dbIaca: { status: 'unknown' },
    dbKurupira: { status: 'unknown' },
  };

  // Probe HTTP dos serviços
  const probeService = async (name, url) => {
    const start = Date.now();
    try {
      const resp = await axios.get(`${url}/health`, { timeout: 5000 });
      results[name] = {
        status: resp.status === 200 ? 'healthy' : 'degraded',
        latencyMs: Date.now() - start,
      };
    } catch {
      results[name] = { status: 'down', latencyMs: Date.now() - start };
    }
  };

  // Probe de conexão dos bancos
  const probeDb = async (name, prismaClient) => {
    try {
      await prismaClient.$queryRaw`SELECT 1`;
      results[name] = { status: 'healthy' };
    } catch {
      results[name] = { status: 'down' };
    }
  };

  await Promise.all([
    probeService('iaca', process.env.IACA_INTERNAL_URL),
    probeService('kurupira', process.env.KURUPIRA_INTERNAL_URL),
    probeDb('dbIaca', prismaIaca),
    probeDb('dbKurupira', prismaKurupira),
  ]);

  const allHealthy = Object.values(results).every(r => r.status === 'healthy');
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    services: results,
    checkedAt: new Date().toISOString(),
  });
}
```

### 6. Ferramentas de Diagnóstico

| Ferramenta | Propósito | Implementação |
|:---|:---|:---|
| **User Lookup** | Operador procura um user por username/email para resolver chamado | `GET /admin/users?q=...` + DetailDrawer com histórico de AuditLogs |
| **Tenant Snapshot** | Visão consolidada de um tenant (users, projetos, uso API, último login) | Aggregate query cross-database |
| **Session Inspector** | Ver sessões ativas de um user específico | `prismaIaca.session.findMany({ where: { userId } })` |
| **Event Replay** | Reconstruir a sequência de ações que levou a um problema | AuditLogs filtrados por userId + resourceId, ordenados por timestamp |

## Limitações e Boas Práticas

### Hard Boundaries
- ❌ Esta skill NÃO modifica AuditLogs — eles são imutáveis (append-only).
- ❌ Esta skill NÃO executa operações de manutenção destrutivas no banco (DROP, TRUNCATE).
- ❌ Esta skill NÃO implementa o sistema de chamados/tickets em si — ela apenas fornece as ferramentas de diagnóstico que alimentam a resolução.
- ❌ Esta skill NÃO define estética de componentes — delegue ao `ui-backoffice`.
- ❌ Esta skill NÃO gerencia tenants/users — delegue ao `tenant-backoffice`.

### Boas Práticas
- ✅ AuditLogs devem ser carregados com paginação por cursor (timestamp-based), não por offset — para performance em tabelas grandes.
- ✅ Exibir diff visual (before/after) quando os campos `before` e `after` estiverem preenchidos.
- ✅ Healthcheck deve ter cache de 30s para evitar bombardeio de probes.
- ✅ Dashboard de KPIs deve usar polling a cada 60s (não WebSocket — backoffice não precisa de real-time sub-segundo).
- ✅ Alertas de quota de API devem ter threshold configurável (default: 80%, 95%).
- ✅ Toda timeline de eventos deve mostrar timestamp em formato absoluto (`dd/MM/yyyy HH:mm:ss`) + relativo ("há 3 min").

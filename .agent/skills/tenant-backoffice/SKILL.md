---
name: tenant-backoffice
description: Especialista em gestão de Tenants (CORPORATE/INDIVIDUAL) e Usuários no Sumaúma. Ative ao implementar CRUD de tenants, gestão de usuários cross-tenant, controle de planos e seat limits, bloqueio/desbloqueio de contas ou sincronização de identidades com Logto. Opera em db_sumauma (escrita direta) com poka-yokes SPEC-005 obrigatórios.
---

# Skill: Tenant Backoffice

## Gatilho Semântico

Ativado quando:
- O agente precisa implementar listagem, criação, edição ou bloqueio de Tenants
- A tarefa envolve gestão de usuários cross-tenant (visualizar todos os users da plataforma)
- É necessário implementar controle de planos, seat limits ou sincronização com Logto
- O agente precisa aplicar as regras poka-yoke do SPEC-005 (assertNotMaster, SEAT_LIMIT_EXCEEDED, whitelist de PATCH)
- Qualquer menção a: `tenant`, `organização`, `CORPORATE`, `INDIVIDUAL`, `seat limit`, `bloquear usuário`, `SPEC-005`
- Alterações em `routes/tenants.js` ou `routes/users.js`

## Protocolo

### 1. Modelo de Dados (db_sumauma)

```
Tenant
├── id, name
├── type: MASTER | CORPORATE | INDIVIDUAL   ← SPEC-005 (não usar SUB_TENANT)
├── plan: FREE | STARTER | PRO | ENTERPRISE
├── logtoOrgId                              ← ID da org no Logto Cloud
├── createdAt, updatedAt
└── → users[]

User
├── id, email, fullName
├── tenantId → Tenant
├── role: PLATFORM_ADMIN | TENANT_ADMIN | MEMBER
├── logtoUserId                             ← ID do user no Logto Cloud
├── isActive
└── createdAt, updatedAt
```

> Tenants e Users residem em `db_sumauma`. O Sumaúma escreve diretamente neste banco via Prisma — não há M2M para criar tenants/users.

### 2. Account Types — SPEC-005

| Valor | Semântica | Criável via API |
|:---|:---|:---|
| `MASTER` | Admin plane da Neonorte (Sumaúma próprio) | ❌ Nunca via API |
| `CORPORATE` | Empresa integradora (multi-usuário) | ✅ POST /admin/tenants |
| `INDIVIDUAL` | Engenheiro solo / freelancer (1 user) | ✅ POST /admin/tenants |

### 3. Seat Limits por Plano (SPEC-005)

```javascript
const PLAN_SEATS = {
  FREE: 1,
  STARTER: 5,
  PRO: 20,
  ENTERPRISE: 9999,
};
```

O endpoint `POST /admin/users` deve verificar antes de criar:
```javascript
const count = await prisma.user.count({ where: { tenantId } });
const limit = PLAN_SEATS[tenant.plan];
if (count >= limit) {
  return res.status(409).json({ error: 'SEAT_LIMIT_EXCEEDED', limit, current: count });
}
```

### 4. Poka-Yokes Obrigatórios (SPEC-005)

#### assertNotMaster
```javascript
function assertNotMaster(tenant) {
  if (tenant.type === 'MASTER') {
    const err = new Error('Operações destrutivas no tenant MASTER são proibidas');
    err.status = 403;
    throw err;
  }
}
// Chamar antes de qualquer PUT, PATCH, DELETE em /admin/tenants/:id
```

#### Whitelist no PATCH /admin/tenants/:id
```javascript
const ALLOWED_PATCH_FIELDS = ['name', 'plan'];
// Rejeitar qualquer tentativa de alterar `type`
if (req.body.type) {
  return res.status(403).json({ error: 'O campo type não pode ser alterado via API' });
}
```

#### POST /admin/tenants — Apenas CORPORATE ou INDIVIDUAL
```javascript
const ALLOWED_TYPES = ['CORPORATE', 'INDIVIDUAL'];
if (!ALLOWED_TYPES.includes(req.body.type)) {
  return res.status(400).json({ error: 'type deve ser CORPORATE ou INDIVIDUAL' });
}
```

### 5. Sincronização com Logto

Toda criação de tenant/user deve sincronizar com Logto Cloud via Management API:

```javascript
// Criar tenant → criar org no Logto
async function createTenantWithLogto(data, prisma, logtoMgmt) {
  const tenant = await prisma.tenant.create({ data });

  try {
    const { id: logtoOrgId } = await logtoMgmt.post('/api/organizations', {
      name: tenant.name,
      customData: { tenantId: tenant.id, type: tenant.type },
    });
    await prisma.tenant.update({ where: { id: tenant.id }, data: { logtoOrgId } });
  } catch (err) {
    logger.warn('Falha ao criar org no Logto para tenant', { tenantId: tenant.id, err: err.message });
    // Não rollback — sincronização pode ser retentada via job de reconciliação
  }

  return tenant;
}
```

> Falha no Logto não reverte a criação local. Consistência eventual — job de reconciliação resolve divergências.

### 6. Endpoints

#### Tenants

| Endpoint | Método | Lê de | Escreve em | Observações |
|:---|:---|:---|:---|:---|
| `/admin/tenants` | GET | db_sumauma | — | Paginado, filtros por type/plan |
| `/admin/tenants/:id` | GET | db_sumauma | — | Include: _count users, logtoOrgId |
| `/admin/tenants` | POST | — | db_sumauma + Logto | type: CORPORATE \| INDIVIDUAL |
| `/admin/tenants/:id` | PATCH | — | db_sumauma | Whitelist: name, plan. Nunca type |
| `/admin/tenants/:id/block` | POST | — | db_sumauma | assertNotMaster; bloquear users em cascata |

#### Usuários

| Endpoint | Método | Lê de | Escreve em | Observações |
|:---|:---|:---|:---|:---|
| `/admin/users` | GET | db_sumauma | — | Cross-tenant; include: tenant |
| `/admin/users/:id` | GET | db_sumauma | — | Include: tenant, auditLogs recentes |
| `/admin/users` | POST | — | db_sumauma + Logto | Verifica SEAT_LIMIT antes |
| `/admin/users/:id` | PATCH | — | db_sumauma | Campos permitidos: fullName, role, isActive |

### 7. Filtros da Listagem (Frontend → Backend)

| Filtro | Query Param | Tipo |
|:---|:---|:---|
| Account Type | `type` | `CORPORATE \| INDIVIDUAL \| MASTER` |
| Plano | `plan` | `FREE \| STARTER \| PRO \| ENTERPRISE` |
| Busca livre | `q` | Texto (name do tenant, email/fullName do user) |
| Ordenação | `orderBy` | `createdAt \| name \| usersCount` |
| Paginação | `page`, `limit` | Int (máx 100 por página) |

### 8. Regras de Negócio do Operador

| Regra | Descrição |
|:---|:---|
| **MASTER imutável** | Tenant com `type: MASTER` não pode ser bloqueado, alterado ou excluído via API |
| **Bloqueio em cascata** | Bloquear Tenant desativa todos os seus Users no db_sumauma e revoga sessions no Logto |
| **PLATFORM_ADMIN via CLI** | Role `PLATFORM_ADMIN` nunca pode ser atribuída via `PATCH /admin/users/:id` — apenas via CLI no servidor |
| **Auditoria obrigatória** | Toda mutação gera `AuditLog` com `action: ADMIN_*` |
| **Seat limit** | Enforçado no backend ao criar user — 409 SEAT_LIMIT_EXCEEDED se atingido |

## Limitações e Boas Práticas

### Hard Boundaries
- ❌ Nunca aceitar `type: 'MASTER'` em POST ou PATCH via API.
- ❌ Nunca alterar role para `PLATFORM_ADMIN` via API — apenas CLI no servidor.
- ❌ Nunca usar `SUB_TENANT` — tipo deprecado pelo SPEC-005.
- ❌ Esta skill NÃO implementa autenticação de usuário final (login do cliente) — isso é responsabilidade do Logto/Iaçã.
- ❌ Esta skill NÃO define estética de componentes — delegue ao `ui-backoffice`.

### Boas Práticas
- ✅ Sempre verificar `assertNotMaster` antes de operações destrutivas em tenants.
- ✅ Incluir `_count` de users nas listagens de tenants.
- ✅ Paginação obrigatória: `page` + `limit` com máximo de 100 por página.
- ✅ Ao bloquear tenant, exibir resumo de impacto antes da confirmação ("X usuários serão bloqueados").
- ✅ Falha no Logto ao criar tenant/user não deve bloquear a operação local — logar como warning.

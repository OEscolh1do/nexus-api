---
name: tenant-backoffice
description: Especialista em gestão de Tenants (organizações), Usuários e controle de acesso no nível de operador da plataforma. Ative ao implementar CRUD de tenants, gestão de usuários cross-tenant, controle de assinaturas, bloqueio/desbloqueio de contas, reset de senha ou gestão de API Keys. Opera exclusivamente no contexto do neonorte-admin (GOD-MODE do operador).
---

# Skill: Tenant Backoffice

## Gatilho Semântico

Ativado quando:
- O agente precisa implementar listagem, criação, edição ou bloqueio de Tenants (organizações)
- A tarefa envolve gestão de usuários cross-tenant (visualizar todos os users de todas as organizações)
- É necessário implementar controle de assinaturas, planos ou limites de API
- O agente precisa criar lógica de bloqueio/desbloqueio de contas ou reset de senha
- Qualquer menção a: `tenant`, `organização`, `assinatura`, `plano`, `bloquear usuário`, `resetar senha`, `API quota`, `SSO`
- Alterações em rotas `/admin/tenants` ou `/admin/users` no BFF

## Protocolo

### 1. Modelo de Dados (Referência — db_iaca)

O Admin BFF **lê** diretamente estes modelos do `db_iaca`:

```
Tenant
├── id, name, type (MASTER | SUB_TENANT)
├── apiPlan (FREE | PRO | ENTERPRISE)
├── apiMonthlyQuota, apiCurrentUsage
├── ssoProvider, ssoDomain, ssoEnforced
├── parentId (hierarquia)
└── → users[], auditLogs[], leads[], ...

User
├── id, username, password (hash), fullName
├── role, orgUnitId, tenantId
├── jobTitle, hierarchyLevel, employmentType
├── supervisorId, vendorId
└── → leadsOwned[], projectsManaged[], ...
```

### 2. Operações por Tipo

#### Leituras (via Prisma READ-ONLY → db_iaca)

| Operação | Endpoint | Query Relevante |
|:---|:---|:---|
| Listar todos os tenants | `GET /admin/tenants` | `prismaIaca.tenant.findMany({ include: { _count: { select: { users: true } } } })` |
| Detalhar tenant | `GET /admin/tenants/:id` | Include: users, apiPlan, ssoConfig |
| Listar todos os users | `GET /admin/users` | `prismaIaca.user.findMany({ include: { tenant: true } })` |
| Buscar user por username | `GET /admin/users?q=...` | Filtro WHERE com LIKE |
| Métricas de uso | `GET /admin/tenants/:id/metrics` | COUNT de leads, projetos, audit logs |

#### Escritas (via M2M HTTP → Iaçã API)

| Operação | Endpoint Admin | Rota Iaçã (interna) | Observações |
|:---|:---|:---|:---|
| Criar tenant | `POST /admin/tenants` | `POST /internal/tenants` | Iaçã valida unicidade, cria default OrgUnit |
| Editar tenant | `PUT /admin/tenants/:id` | `PUT /internal/tenants/:id` | Alterar plano, quota, SSO |
| Bloquear tenant | `PUT /admin/tenants/:id/block` | `PUT /internal/tenants/:id` | `{ status: 'BLOCKED' }` — Iaçã propaga bloqueio para users |
| Reset de senha | `POST /admin/users/:id/reset-password` | `POST /internal/users/:id/reset-password` | Iaçã gera nova senha hasheada e retorna a temporária |
| Desativar user | `DELETE /admin/users/:id` | `DELETE /internal/users/:id` | Iaçã faz soft-delete com auditoria |
| Alterar role | `PUT /admin/users/:id` | `PUT /internal/users/:id` | `{ role: 'NEW_ROLE' }` |

### 3. Regras de Negócio do Operador

| Regra | Descrição |
|:---|:---|
| **Bloqueio em cascata** | Bloquear um Tenant deve bloquear o acesso de TODOS os seus Users. A lógica vive no Iaçã, o Admin apenas dispara. |
| **Proteção do MASTER** | O Tenant com `type: MASTER` nunca pode ser bloqueado ou excluído pelo Admin (é o tenant raiz da Neonorte). |
| **Auditoria obrigatória** | Toda mutação de tenant/user pelo Admin BFF deve gerar um `AuditLog` com `action: 'ADMIN_*'` (ex: `ADMIN_BLOCK_TENANT`). |
| **Quota de API** | O operador pode alterar `apiMonthlyQuota` de um Tenant. O reset mensal do `apiCurrentUsage` é responsabilidade de um cron job no Iaçã. |
| **SSO** | O operador pode configurar `ssoProvider`, `ssoDomain` e `ssoEnforced` de um Tenant Enterprise. A validação do SSO em si vive no Iaçã. |

### 4. Filtros e Buscas (Frontend)

| Filtro | Tipo | Valores |
|:---|:---|:---|
| Status do Tenant | Select | `ACTIVE`, `BLOCKED`, `SUSPENDED` |
| Plano | Select | `FREE`, `PRO`, `ENTERPRISE` |
| Tipo | Select | `MASTER`, `SUB_TENANT` |
| Busca | Text | Nome do tenant, username, fullName |
| Role do User | Select | Dinâmico (extraído dos dados) |
| Tenant do User | Select | Lista de tenants |
| Ordenação | Toggle | `createdAt`, `name`, `usersCount` |

## Limitações e Boas Práticas

### Hard Boundaries
- ❌ Esta skill NÃO implementa autenticação de usuário final (login/signup do cliente) — isso é responsabilidade do Iaçã.
- ❌ Esta skill NÃO decide como o IAM organizacional funcionará no futuro — isso será definido na refatoração do Iaçã.
- ❌ Esta skill NÃO cria ou modifica o schema Prisma do Iaçã (`iaca-erp/backend/prisma/schema.prisma`). Ela apenas CONSOME o modelo existente via read-only.
- ❌ Esta skill NÃO define estética de componentes — delegue ao `ui-backoffice`.

### Boas Práticas
- ✅ Sempre validar que o Tenant alvo não é `type: MASTER` antes de operações destrutivas.
- ✅ Incluir `_count` de relacionamentos nas listagens para dar contexto ao operador (ex: "Este tenant tem 15 usuários e 42 projetos").
- ✅ Paginação obrigatória: `?page=1&limit=50` com máximo de 100 por página.
- ✅ Ao bloquear um tenant, exibir um resumo do impacto antes da confirmação ("34 usuários serão bloqueados, 12 projetos em andamento").

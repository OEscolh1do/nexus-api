# SPEC-005 — Tenant Account Type (Opção B: Migração do Campo `type`)

**Status**: Aprovado pelo desenvolvedor  
**Data**: 2026-05-03  
**Conversa de origem**: 9f591218-2573-44a9-99ab-49a98b7f5242

---

## 1. SPECKIT.SPECIFY — O Quê

### Problema de Negócio
O campo `type` do modelo `Tenant` atualmente suporta apenas dois valores:
- `MASTER` — reservado para o admin plane da Neonorte (Sumaúma)
- `SUB_TENANT` — todos os clientes do SaaS, sem distinção

Isso impede o operador do Sumaúma de saber visualmente se um cliente é um **freelancer/engenheiro solo** (1 usuário) ou uma **empresa integradora** (múltiplos usuários, hierarquia de equipe). Além disso, o sistema não impõe nenhum limite de seats por plano no backend — qualquer tenant `FREE` pode ter 100 usuários sem restrição.

### Usuário Final
**Operador da Neonorte** acessando o Sumaúma. Nunca o cliente final.

### Critérios de Aceitação (Definition of Done)

**Banco de Dados**
- [ ] O campo `type` aceita os valores `MASTER | INDIVIDUAL | CORPORATE`
- [ ] Todos os registros com `type = 'SUB_TENANT'` são migrados para `CORPORATE`
- [ ] Migration Prisma sem downtime (não-destrutiva)

**Backend (routes/tenants.js)**
- [ ] `assertNotMaster()` continua funcionando (guarda contra `type === 'MASTER'`)
- [ ] `POST /admin/tenants` cria com `type: 'CORPORATE'` como padrão
- [ ] `POST /admin/tenants` aceita `type: 'INDIVIDUAL'` ou `type: 'CORPORATE'`
- [ ] `POST /admin/tenants` rejeita qualquer tentativa de criar com `type: 'MASTER'`
- [ ] `PATCH /admin/tenants/:id` usa whitelist de campos (não aceita injeção de `type: 'MASTER'`)
- [ ] `GET /admin/tenants` e `/options` mantêm filtro `type: { not: 'MASTER' }`
- [ ] Filtro por `type=INDIVIDUAL` ou `type=CORPORATE` funcional via query string

**Backend (routes/users.js)**
- [ ] `POST /admin/users` verifica limite de seats antes de criar
- [ ] Limites: `FREE=1`, `STARTER=5`, `PRO=20`, `ENTERPRISE=9999`
- [ ] Se limite atingido → HTTP 409 com `code: 'SEAT_LIMIT_EXCEEDED'`
- [ ] A verificação de seat é feita com contagem real do banco (não cache)

**Frontend (TenantsPage.tsx)**
- [ ] Coluna `Tipo` com badge: `Individual` (sky-400) | `Empresarial` (violet-400)
- [ ] Filtro por tipo mostra opções `Individual` e `Empresarial` (não os valores raw do enum)
- [ ] Texto informativo do drawer atualizado ("Sub-Tenant" removido)

**Frontend (CreateTenantForm.tsx)**
- [ ] Campo "Tipo de Conta" com toggle `Individual` / `Empresarial`
- [ ] Info box atualizado: remove referência a "Sub-Tenant"
- [ ] Para `INDIVIDUAL`, exibe aviso "Conta solo — 1 usuário máximo por plano"

**Frontend (TenantDrawer.tsx)**
- [ ] Header exibe badge de `accountType` (`Individual` ou `Empresarial`)
- [ ] Se `type === 'INDIVIDUAL'`, seção de usuários exibe cap visual do limite de seats
- [ ] Ação "Editar Tipo de Conta" permite downgrade `CORPORATE → INDIVIDUAL` apenas se `_count.users <= 1`

### Exclusões Explícitas de Escopo
- ❌ Não altera a lógica de autenticação/login (Logto, JWT)
- ❌ Não cria nova rota de API para mudar `type` de tenant
- ❌ Não implementa self-service de upgrade — operador faz manualmente
- ❌ Não altera o modelo `User` ou o sistema RBAC
- ❌ Não cria UI para o cliente final visualizar seu tipo de conta

---

## 2. SPECKIT.PLAN — O Como

### Sequência de Implementação (mais baixo para mais alto nível)

```
1. schema.prisma       → alterar comment + campo (migration)
2. routes/tenants.js   → assertNotMaster guard + whitelist PATCH + filtros
3. routes/users.js     → seat limit enforcement
4. CreateTenantForm.tsx → campo tipo de conta
5. TenantsPage.tsx     → badge + filtro por tipo
6. TenantDrawer.tsx    → badge no header + cap visual de seats
```

### Arquivos Afetados

#### [MODIFY] `sumauma/backend/prisma/schema.prisma`
```prisma
// ANTES:
type  String  @default("SUB_TENANT")  // MASTER, SUB_TENANT

// DEPOIS:
type  String  @default("CORPORATE")  // MASTER | INDIVIDUAL | CORPORATE
```
Requer migration: `ALTER TABLE Tenant MODIFY type VARCHAR(191) DEFAULT 'CORPORATE'`  
+ UPDATE de dados: `UPDATE Tenant SET type='CORPORATE' WHERE type='SUB_TENANT'`

#### [MODIFY] `sumauma/backend/src/routes/tenants.js`
- `assertNotMaster()` — sem alteração (já verifica `=== 'MASTER'`)
- `POST /` — mudar `type: 'SUB_TENANT'` para `type: body.type || 'CORPORATE'` + validação whitelist
- `PATCH /:id` — adicionar whitelist explícita de campos permitidos
- `GET /` — manter filtro `not: 'MASTER'`, adicionar suporte a `type=INDIVIDUAL`/`CORPORATE`
- `GET /options` — manter filtro `not: 'MASTER'`

#### [MODIFY] `sumauma/backend/src/routes/users.js`
- `POST /` — adicionar verificação de seat limit após lookup do tenant

#### [MODIFY] `sumauma/frontend/src/components/tenants/CreateTenantForm.tsx`
- Adicionar campo `accountType` com toggle `Individual`/`Empresarial`
- Atualizar info box

#### [MODIFY] `sumauma/frontend/src/pages/TenantsPage.tsx`
- `TenantRow` — adicionar badge de tipo
- `FilterBar` — atualizar select de tipo com labels PT-BR

#### [MODIFY] `sumauma/frontend/src/components/tenants/TenantDrawer.tsx`
- Header — badge de tipo de conta
- Seção usuários — exibir `X / maxSeats` para INDIVIDUAL

#### [MODIFY] `sumauma/frontend/src/hooks/useTenants.ts` (se existir tipo Tenant)
- Atualizar type `type` de `'MASTER' | 'SUB_TENANT'` para `'MASTER' | 'INDIVIDUAL' | 'CORPORATE'`

---

## 3. SPECKIT.TASKS — Checklist Atômico

```
[ ] T1: Alterar schema.prisma — campo type: comentário + default CORPORATE
[ ] T2: Gerar migration Prisma (`prisma migrate dev --name tenant-account-type`)
[ ] T3: Verificar e executar UPDATE de dados (SUB_TENANT → CORPORATE)
[ ] T4: routes/tenants.js — POST: trocar 'SUB_TENANT' por body.type com validação
[ ] T5: routes/tenants.js — PATCH: implementar whitelist de campos permitidos
[ ] T6: routes/tenants.js — GET: adicionar suporte ao filtro type=INDIVIDUAL/CORPORATE
[ ] T7: routes/users.js — POST: adicionar PLAN_SEATS verification
[ ] T8: CreateTenantForm.tsx — adicionar toggle Tipo de Conta
[ ] T9: TenantsPage.tsx — badge de tipo na coluna + filtro PT-BR
[ ] T10: TenantDrawer.tsx — badge no header + exibição do cap de seats
[ ] T11: useTenants.ts — atualizar tipos TypeScript
[ ] T12: Smoke test manual: criar INDIVIDUAL, tentar adicionar 2º usuário → 409
[ ] T13: Smoke test manual: criar CORPORATE com plano FREE, tentar 2º usuário → 409
[ ] T14: Smoke test manual: filtro por tipo na listagem de orgs
```

---

## 4. SPECKIT.ANALYZE — Análise de Riscos

### ⚠️ Riscos Identificados

**RISCO 1 — Breaking change no campo `type`** (ALTO)
- **Impacto**: Todo lugar que hardcoda `'SUB_TENANT'` deixa de funcionar silenciosamente
- **Ocorrências mapeadas**:
  - `routes/tenants.js:49` → `type: 'SUB_TENANT'` (criação)
  - `TenantsPage.tsx:85` → `<option value="SUB_TENANT">` (filtro)
  - `CreateTenantForm.tsx:119` → texto "Sub-Tenant" (informativo)
  - `TenantDrawer.tsx` → referência implícita via `isMaster` (seguro)
- **Mitigação**: Busca global por `'SUB_TENANT'` antes de iniciar + commit de checkpoint antes da migration

**RISCO 2 — Migration de dados em produção** (MÉDIO)
- **Impacto**: Se existirem tenants `MASTER` no banco, eles não devem ser afetados pelo UPDATE
- **Mitigação**: UPDATE condicional `WHERE type = 'SUB_TENANT'` (não `WHERE type != 'MASTER'`)

**RISCO 3 — Filtros de API quebrarem** (BAIXO)
- **Impacto**: `GET /admin/tenants?type=SUB_TENANT` retornaria 0 resultados após migração
- **Mitigação**: A UI não usa esse filtro (está hardcoded como opção vazia); aceitável.

**RISCO 4 — Seat limit retroativo** (BAIXO)
- **Impacto**: Tenants existentes com tipo `FREE` e mais de 1 usuário não serão bloqueados retroativamente (o enforcement é apenas em novas criações)
- **Decisão**: Aceitar — não forçar migração regressiva.

### Checkpoint Recomendado
Antes de iniciar a migration, executar:
```bash
git add -A && git commit -m "checkpoint: pré-migration tenant-account-type SPEC-005"
```

---

## 5. SPECKIT.IMPLEMENT — Referência de Implementação

### Backend: Lógica de Seat Limit

```javascript
// routes/users.js — POST /admin/users
const PLAN_SEATS = { FREE: 1, STARTER: 5, PRO: 20, ENTERPRISE: 9999 };

// Buscar tenant para verificar plano e tipo
const tenant = await prismaSumauma.tenant.findUnique({
  where: { id: tenantId },
  select: { type: true, apiPlan: true, _count: { select: { users: true } } }
});
if (!tenant) return res.status(404).json({ error: 'Organização não encontrada' });

// POKA-YOKE: Verificar limite de seats pelo plano
const maxSeats = PLAN_SEATS[tenant.apiPlan] ?? 5;
if (tenant._count.users >= maxSeats) {
  return res.status(409).json({
    error: `Limite de ${maxSeats} usuário(s) atingido para o plano ${tenant.apiPlan}. Faça upgrade para adicionar mais usuários.`,
    code: 'SEAT_LIMIT_EXCEEDED',
    current: tenant._count.users,
    max: maxSeats,
    plan: tenant.apiPlan,
  });
}
```

### Backend: Whitelist no PATCH

```javascript
// routes/tenants.js — PATCH /:id
const ALLOWED_PATCH_FIELDS = [
  'name', 'apiPlan', 'apiMonthlyQuota', 'apiCurrentUsage',
  'ssoProvider', 'ssoDomain', 'ssoEnforced', 'status', 'type'
];
const PROTECTED_TYPE_VALUES = ['MASTER'];

const rawData = req.body;
const safeData = Object.fromEntries(
  Object.entries(rawData).filter(([key]) => ALLOWED_PATCH_FIELDS.includes(key))
);

// Nunca permitir promoção para MASTER via PATCH
if (safeData.type && PROTECTED_TYPE_VALUES.includes(safeData.type)) {
  return res.status(403).json({
    error: 'Não é permitido alterar o tipo para MASTER via interface.',
    code: 'MASTER_PROMOTION_FORBIDDEN'
  });
}

// Validar valores permitidos de type
if (safeData.type && !['INDIVIDUAL', 'CORPORATE'].includes(safeData.type)) {
  return res.status(400).json({ error: 'Tipo inválido. Use INDIVIDUAL ou CORPORATE.' });
}
```

### Backend: POST com tipo

```javascript
// routes/tenants.js — POST /
const { name, apiPlan, apiMonthlyQuota, type } = req.body;

// Validar tipo
const allowedTypes = ['INDIVIDUAL', 'CORPORATE'];
const tenantType = allowedTypes.includes(type) ? type : 'CORPORATE';

const tenant = await prismaSumauma.tenant.create({
  data: {
    name: name.trim(),
    apiPlan: apiPlan || 'FREE',
    apiMonthlyQuota: Number(apiMonthlyQuota) || 1000,
    type: tenantType  // NUNCA aceita 'MASTER' da request
  }
});
```

### Frontend: Badge de Tipo

```typescript
// Constantes compartilháveis (util/tenantType.ts)
export const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  INDIVIDUAL: 'Individual',
  CORPORATE: 'Empresarial',
  MASTER: 'Plataforma',
};

export const ACCOUNT_TYPE_BADGE_CLASS: Record<string, string> = {
  INDIVIDUAL: 'text-sky-400 bg-sky-500/10 border border-sky-500/20',
  CORPORATE:  'text-violet-400 bg-violet-500/10 border border-violet-500/20',
  MASTER:     'text-slate-400 bg-slate-500/10 border border-slate-500/20',
};
```

### Frontend: Tipo de Conta no TypeScript

```typescript
// hooks/useTenants.ts — atualizar tipo
export interface Tenant {
  // ...
  type: 'MASTER' | 'INDIVIDUAL' | 'CORPORATE';  // era: 'MASTER' | 'SUB_TENANT'
  // ...
}
```

---

## Referências
- Conversa de análise: `9f591218-2573-44a9-99ab-49a98b7f5242`
- Schema atual: `sumauma/backend/prisma/schema.prisma:17`
- Route tenants: `sumauma/backend/src/routes/tenants.js:49` (hardcode SUB_TENANT)
- Route users: `sumauma/backend/src/routes/users.js:POST /`
- FilterBar atual: `sumauma/frontend/src/pages/TenantsPage.tsx:85`

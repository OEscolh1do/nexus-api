# Relatório de Execução — Tenant Isolation + Ferramentas Independentes

> **Data:** 2026-04-01
> **Versão:** v3.2.1
> **Status:** ✅ Concluído

---

## 🎯 Objetivo

Implementar o princípio arquitetural original do sistema: Kurupira e Iaçã são ferramentas **independentes**, e projetos criados em qualquer uma delas são **compartilhados entre todos os membros de uma mesma organização (tenant)**.

Dois gaps críticos foram identificados e fechados:
1. `GET /api/v1/designs` retornava todos os projetos do banco sem nenhum filtro (qualquer usuário autenticado via qualquer empresa via os projetos de todas as empresas)
2. Todo projeto Kurupira era forçado a referenciar um lead do Iaçã (`iacaLeadId` obrigatório), impossibilitando projetos standalone

---

## 📦 Entregas

### 1. JWT com tenantId (Iaçã Backend)

| Artefato | Arquivo | Descrição |
|----------|---------|-----------|
| **Login select** | `iaca-erp/backend/src/modules/iam/services/iam.service.js` | `tenantId` adicionado ao `select` da query de login |
| **JWT payload** | `iaca-erp/backend/src/modules/iam/services/iam.service.js` | `tenantId: user.tenantId \|\| 'default-tenant-001'` incluído no `jwt.sign()` |

### 2. Schema Kurupira

| Artefato | Arquivo | Descrição |
|----------|---------|-----------|
| **tenantId** | `kurupira/backend/prisma/schema.prisma` | Campo `tenantId String @default("default-tenant-001")` + `@@index([tenantId])` |
| **iacaLeadId opcional** | `kurupira/backend/prisma/schema.prisma` | Tipo alterado de `String` para `String?` |
| **electricalData** | `kurupira/backend/prisma/schema.prisma` | Campo `Json?` adicionado a `ModuleCatalog` e `InverterCatalog` |

### 3. Backend Scoping por Tenant

| Rota | Mudança |
|------|---------|
| `authenticateToken` | Extrai `tenantId` do JWT, fallback `'default-tenant-001'` |
| `GET /api/v1/designs` | `WHERE tenantId = req.user.tenantId AND iacaLeadId != '__settings__'` |
| `POST /api/v1/designs` | `tenantId: req.user.tenantId`; `iacaLeadId: body.iacaLeadId \|\| null` |
| `GET /api/v1/designs/:id` | `findFirst({ where: { id, tenantId } })` |
| `PUT /api/v1/designs/:id` | Verifica tenant antes de atualizar |
| `DELETE /api/v1/designs/:id` | Verifica tenant antes de deletar |

### 4. Frontend

| Artefato | Arquivo | Descrição |
|----------|---------|-----------|
| **ProjectService** | `kurupira/frontend/src/services/ProjectService.ts` | `iacaLeadId: null` em standalone (não mais `'standalone'`) |
| **AuthProvider** | `kurupira/frontend/src/core/auth/AuthProvider.tsx` | `tenantId` propagado do JWT real e do mock DEV |

### 5. Deep Link Completo

| Artefato | Arquivo | Descrição |
|----------|---------|-----------|
| **LeadDrawer** | `iaca-erp/frontend/src/modules/commercial/components/LeadDrawer.tsx` | Botão "Dimensionar no Kurupira" passa `?token=<jwt>&leadId=<id>` |

### 6. Catálogo de Equipamentos (Banco)

- `npx prisma db push` (dentro do container `neonorte_kurupira`) sincronizou o schema com MySQL
- `node prisma/seed-catalog.js` populou **6 módulos DMEGC** e **32 inversores PHB Solar** com dados elétricos completos

---

## 📂 Arquivos Modificados

```
iaca-erp/backend/src/modules/iam/services/iam.service.js   [FEAT] tenantId no JWT
kurupira/backend/prisma/schema.prisma                       [FEAT] tenantId + iacaLeadId? + electricalData
kurupira/backend/src/server.js                              [FEAT] tenant scoping em todas as rotas
kurupira/frontend/src/services/ProjectService.ts            [FIX] iacaLeadId: null em standalone
kurupira/frontend/src/core/auth/AuthProvider.tsx            [FEAT] tenantId no user object
iaca-erp/frontend/src/modules/commercial/components/
  LeadDrawer.tsx                                            [FEAT] token no deep link
kurupira/backend/prisma/seed-catalog.js                     [UPDATE] dados validados Neonorte
```

---

## ✅ Validação

- [x] Schema sincronizado via `docker exec neonorte_kurupira npx prisma db push`
- [x] Catálogo populado: `✅ 6 módulos e 32 inversores cadastrados/atualizados`
- [x] Deep link passando token: `LeadDrawer` → `?token=<jwt>&leadId=<id>`
- [x] Kurupira funciona standalone em dev (mock com `tenantId: 'dev-tenant'`)

---

## 📋 Pendências Remanescentes

| Item | Status | Nota |
|------|--------|------|
| Feedback Visual de Strings (Cabling) | 🟡 Aguardando | Spec em `.agent/aguardando/spec_feedback_visual_strings.md` |
| CRM Customer Tab | 🟡 Aguardando | Spec em `.agent/aguardando/CRM_Cliente/` |
| Canvas 3D / Elétrica Avançada | 🟡 Aguardando | Specs em `.agent/aguardando/` |
| Upgrade Prisma 5.10 → 7.x | 🟡 Baixa prioridade | Funcional na versão atual |
| TailwindCSS CDN → PostCSS | 🟡 Baixa prioridade | Warning no console, sem impacto funcional |

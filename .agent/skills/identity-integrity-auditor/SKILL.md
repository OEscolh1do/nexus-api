---
name: identity-integrity-auditor
description: Especialista em reconciliação bidirecional entre Logto (IdP) e banco de dados local. Use para diagnosticar drifts de usuários, órfãos e registros ausentes.
---

# Skill: Identity Integrity Auditor

## Gatilho Semântico
Ativado quando a tarefa envolver: "usuário não consegue logar", "zumbis no banco", "auditoria de identidade", "reprovisionar usuário", "sincronizar logto", ou erros de "authProviderId" inconsistente.

## Protocolo de Execução

### 1. Mapeamento de Fontes
- **Local Source**: Prisma Client (`prismaSumauma.user`) — Focar em `authProviderId`, `email`, `status` e `tenantId`.
- **External Source**: Logto Management API — Listar via `logtoClient.js` (Sempre usar `pageSize = 100`).

### 2. Algoritmo de Reconciliação (Bidirecional)
1.  **Orphans (Órfãos no IdP)**: `[ID no Logto] NOT IN [authProviderId no Banco Local]`.
    - *Ação*: Auditoria manual ou Batch Delete (usar `DELETE_ORPHAN_USERS`).
2.  **Missing (Ausentes no IdP)**: `[authProviderId no Banco Local] NOT IN [ID no Logto]`.
    - *Ação*: Reprovisionar se o usuário estiver `ACTIVE`. Ignorar se `BLOCKED`.
3.  **Org Drift (V3)**: Comparar `tenant.logtoOrgId` com Organizations no Logto.
4.  **Deep Sync (Atributos)**: Comparar `fullName`, `email` e `role` (via `customData`).

### 3. Governança & Automação
1.  **Auto-Audit Loop**: O sistema executa auditoria diária via `cronJobs.js`.
2.  **Persistent History**: Verificar `IdentityAuditHistory` para detectar quando o drift começou.
3.  **Batch Cleanup**: Em caso de grandes discrepâncias, sugerir o uso de rotas de processamento em lote.

### 4. Guardrails Críticos
- **Logto Cloud Limit**: Nunca exceder `page_size=100`.
- **Self-Preservation**: A skill NUNCA deve sugerir a deleção do administrador que está operando o sistema (Proteção de Sessão).
- **Service-First**: Sempre editar a lógica em `identityAuditService.js`, nunca duplicar código em rotas.

## Referências
- Motor Central: `sumauma/backend/src/lib/identityAuditService.js`
- Agendador: `sumauma/backend/src/lib/cronJobs.js`
- Histórico: Prisma Model `IdentityAuditHistory`

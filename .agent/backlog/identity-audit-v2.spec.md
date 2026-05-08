# Spec: Identity Audit V2 — Ações de Reconciliação
# Status: AGUARDANDO
# Prioridade: Após estabilização da V1 (somente leitura)
# Criado em: 2026-05-08

---

## Problema de Negócio

A V1 do Identity Audit é somente leitura — o operador vê as discrepâncias mas precisa corrigi-las
manualmente no Console do Logto ou via banco de dados. A V2 oferece ações de correção diretamente da UI.

## Usuário Final

Operador da Neonorte com role PLATFORM_ADMIN, acessando o Sumaúma.

---

## Critérios de Aceitação

### Cenário A — Orphan in Logto (existe no Logto, não no banco local)

| Ação | Descrição | Resultado |
|:---|:---|:---|
| "Criar localmente" | Provisiona o usuário no db_sumauma usando os dados do Logto (email, name, sub) | User criado com authProviderId = logtoId, vinculado a tenant escolhido pelo operador via dropdown |
| "Remover do Logto" | Deleta o usuário do Logto via Management API | User removido; ConfirmDialog exige digitar e-mail antes de confirmar |

### Cenário B — Missing in Logto (existe no banco, não no Logto)

| Ação | Descrição | Resultado |
|:---|:---|:---|
| "Reprovisionar no Logto" | Cria o usuário no Logto e atualiza authProviderId no banco | User criado; authProviderId salvo |
| "Desativar localmente" | Marca o user como status: BLOCKED no banco | User sai do comparativo (BLOCKED excluído da comparação) |

---

## Exclusões Explícitas de Escopo (V2)

- ❌ Sync automático em massa — sem botão "Corrigir Todos"
- ❌ Merge de identidades (e-mail coincidente sem authProviderId) → V3
- ❌ Reconciliação de Organizations/Tenants → V3
- ❌ Deleção de Logto users que são único TENANT_ADMIN de uma org (bloquear na validação)

---

## Dependências Técnicas

| Dependência | Status |
|:---|:---|
| logtoClient.listLogtoUsers() | Implementada na V1 |
| logtoClient.deleteLogtoUser() | Já existe |
| logtoClient.createLogtoUser() | Já existe |
| POST /identity-audit/reprovision/:userId | Implementada na V1 |
| DELETE /identity-audit/orphan/:logtoId | 🔴 Novo — V2 |
| POST /identity-audit/orphan/:logtoId/provision-local | 🔴 Novo — V2 |

---

## Riscos Mapeados

| Risco | Nível | Mitigação |
|:---|:---|:---|
| Deletar usuário M2M de serviço via UI | 🔴 CRÍTICO | Blacklist de client_ids de serviço no endpoint |
| Criar usuário local com tenantId inválido | 🟡 MÉDIO | Dropdown de tenant no dialog; validação no backend |
| Race condition: dois operadores auditando | 🟡 MÉDIO | Audit é snapshot; ações são idempotentes |
| Reprovisionar user com e-mail já existente no Logto | 🟡 MÉDIO | Capturar erro 422 do Logto e retornar mensagem clara |

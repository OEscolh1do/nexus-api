# Spec — Módulo 01: Tenants (Organizações)

> **Fase:** 1 (Core de Gestão)  
> **Prioridade:** Alta  
> **Estimativa:** 1–2 dias

---

## 1. Problema de Negócio

O operador da Neonorte precisa gerenciar o ciclo de vida das organizações clientes da plataforma: ver quem está ativo, bloquear contas inadimplentes, ajustar limites de uso de API e inspecionar as configurações de cada tenant.

## 2. Usuário Final

Operador da Neonorte com role `PLATFORM_ADMIN`.

---

## 3. Critérios de Aceitação (Definition of Done)

### 3.1 Listagem
- [ ] Tabela com colunas: **Nome**, **Tipo** (MASTER / SUB_TENANT), **Plano de API**, **Quota Mensal**, **Uso Atual**, **SSO**, **Criado em**, **Ações**
- [ ] Busca inline por nome (debounce 300ms)
- [ ] Filtro por Tipo e Plano
- [ ] Paginação de 20 itens por página
- [ ] Contagem total ("X organizações")

### 3.2 Detalhe / Drawer
- [ ] Ao clicar em uma linha, abre um drawer lateral com todos os campos do tenant
- [ ] Exibe lista de usuários vinculados (com link para página de usuários filtrada)
- [ ] Exibe uso de API em barra de progresso (Atual / Quota)

### 3.3 Ações Operacionais (via M2M → Iaçã)
- [ ] **Bloquear tenant:** altera status para BLOCKED → todos os usuários do tenant perdem acesso
- [ ] **Desbloquear tenant:** restaura acesso
- [ ] **Editar plano/quota:** modal com campos `apiPlan` e `apiMonthlyQuota`
- [ ] **Reset de quota mensal:** zera `apiCurrentUsage` manualmente

### 3.4 Confirmação Destrutiva
- [ ] Bloquear exige confirmação com o nome do tenant digitado pelo operador

---

## 4. Fora do Escopo

- Criação de novos tenants (feita pelo processo de onboarding do Iaçã)
- Deleção de tenants (operação irreversível — não exposta no MVP)
- Configuração de SSO avançado

---

## 5. Interfaces de Dados

### Leitura (Prisma Read-Only → `db_iaca`)
```typescript
// Campos esperados da query de listagem
{
  id: string
  name: string
  type: 'MASTER' | 'SUB_TENANT'
  apiPlan: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE'
  apiMonthlyQuota: number
  apiCurrentUsage: number
  ssoProvider: string | null
  ssoEnforced: boolean
  createdAt: Date
  _count: { users: number }
}
```

### Mutações (M2M → Iaçã `PATCH /iaça/admin/tenants/:id`)
```json
// Payload de bloqueio
{ "status": "BLOCKED" }

// Payload de edição de plano
{ "apiPlan": "PRO", "apiMonthlyQuota": 5000 }

// Payload de reset de quota
{ "apiCurrentUsage": 0 }
```

---

## 6. Rotas Backend (BFF) a Implementar/Verificar

| Método | Rota | Descrição |
|:---|:---|:---|
| `GET` | `/admin/tenants` | Lista com filtros e paginação |
| `GET` | `/admin/tenants/:id` | Detalhe de um tenant |
| `PATCH` | `/admin/tenants/:id` | Mutação via M2M para o Iaçã |

---

## 7. Componentes Frontend a Criar

| Arquivo | Descrição |
|:---|:---|
| `src/pages/TenantsPage.tsx` | Página principal com DataGrid |
| `src/components/tenants/TenantDrawer.tsx` | Drawer de detalhe/edição |
| `src/components/tenants/TenantStatusBadge.tsx` | Badge de status reutilizável |
| `src/hooks/useTenants.ts` | Hook de dados com React Query |

---

## 8. Riscos e Alertas

> [!WARNING]
> A operação de bloqueio de tenant é crítica — ela desativa **todos os usuários** da organização imediatamente. Exige confirmação com texto digitado.

> [!NOTE]
> O BFF não tem permissão de escrita direta. O endpoint `PATCH /admin/tenants/:id` do BFF **chama o Iaçã** via M2M. Se o Iaçã estiver fora do ar, a mutação falha com erro 503 e o BFF deve retornar mensagem clara.

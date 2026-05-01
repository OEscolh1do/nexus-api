# Spec — Módulo 02: Usuários

> **Fase:** 1 (Core de Gestão)  
> **Prioridade:** Alta  
> **Estimativa:** 1–2 dias

---

## 1. Problema de Negócio

O operador precisa ter visibilidade e controle sobre todos os usuários da plataforma, independente de qual organização pertencem. Isso inclui: identificar usuários suspeitos, bloquear contas comprometidas, resetar senhas e auditar o histórico de acesso.

## 2. Usuário Final

Operador da Neonorte com role `PLATFORM_ADMIN`.

---

## 3. Critérios de Aceitação (Definition of Done)

### 3.1 Listagem
- [ ] Tabela com colunas: **Nome Completo**, **Username**, **Organização** (tenant), **Role**, **Cargo**, **Criado em**, **Ações**
- [ ] Busca inline por nome, username ou email
- [ ] Filtro por Tenant e por Role
- [ ] Paginação de 20 itens por página
- [ ] Badge de role: `PLATFORM_ADMIN` (violet), `ADMIN` (sky), `ENGINEER` (emerald), `VIEWER` (slate)

### 3.2 Detalhe / Drawer
- [ ] Drawer lateral com dados completos do usuário
- [ ] Link clicável para o Tenant do usuário
- [ ] Histórico de últimas 10 ações do AuditLog deste usuário
- [ ] Sessões ativas (se disponível)

### 3.3 Ações Operacionais (via M2M → Iaçã)
- [ ] **Bloquear usuário:** impede login imediatamente
- [ ] **Desbloquear usuário:** restaura acesso
- [ ] **Reset de senha:** envia link de redefinição via Iaçã (ou gera senha temporária)
- [ ] **Alterar role:** dropdown com opções de role permitidas pelo nível do operador

### 3.4 Confirmação Destrutiva
- [ ] Bloquear exige confirmação com o username digitado pelo operador

---

## 4. Fora do Escopo

- Criação de novos usuários (responsabilidade do Iaçã / tenant admin)
- Deleção de usuários (operação irreversível — não exposta no MVP)
- Gerenciamento de permissões granulares (futuro IAM do Iaçã)

---

## 5. Interfaces de Dados

### Leitura (Prisma Read-Only → `db_iaca`)
```typescript
{
  id: string
  username: string
  fullName: string
  role: string
  jobTitle: string | null
  createdAt: Date
  tenant: { id: string; name: string }
}
```

### Mutações (M2M → Iaçã)
```json
// Bloqueio
PATCH /iaca/admin/users/:id
{ "status": "BLOCKED" }

// Reset de senha
POST /iaca/admin/users/:id/reset-password
{}

// Alterar role
PATCH /iaca/admin/users/:id
{ "role": "ENGINEER" }
```

---

## 6. Rotas Backend (BFF) a Implementar/Verificar

| Método | Rota | Descrição |
|:---|:---|:---|
| `GET` | `/admin/users` | Lista cross-tenant com filtros |
| `GET` | `/admin/users/:id` | Detalhe do usuário + audit logs |
| `PATCH` | `/admin/users/:id` | Mutação via M2M |
| `POST` | `/admin/users/:id/reset-password` | Dispara reset via M2M |

---

## 7. Componentes Frontend a Criar

| Arquivo | Descrição |
|:---|:---|
| `src/pages/UsersPage.tsx` | Página principal com DataGrid |
| `src/components/users/UserDrawer.tsx` | Drawer de detalhe |
| `src/components/users/RoleBadge.tsx` | Badge de role reutilizável |
| `src/hooks/useUsers.ts` | Hook de dados com React Query |

---

## 8. Riscos e Alertas

> [!WARNING]
> O bloqueio de usuário `PLATFORM_ADMIN` deve ser impedido — um operador não pode bloquear a si mesmo ou ao último admin restante da plataforma.

> [!NOTE]
> O reset de senha não deve retornar a senha gerada no response. Apenas confirmar que o e-mail foi enviado ou que a senha temporária foi registrada no Iaçã.

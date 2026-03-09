# Matriz de Controle de Acesso (RBAC)

> **Atualizado:** 2026-03-09

O Neonorte | Nexus utiliza RBAC hierárquico. Permissões aplicadas via `auth.middleware.js` (backend) com helper `requireRole(['ROLE'])` e validadas no Frontend via `AppSwitcher` e `RBACWrapper`.

## Papéis (Roles)

| Role | Descrição | Escopo de Dados |
| :--- | :--- | :--- |
| **ADMIN** | Superusuário | Acesso irrestrito (R/W) em todos os módulos. Gerencia usuários e Tenants. |
| **MANAGER** | Gestor de Área | Acesso total ao seu módulo. Leitura em correlatos. |
| **COORDENACAO** | Coordenador de Projetos | R/W em todos os projetos do Tenant. Sem permissão de Delete. |
| **VENDEDOR** | Vendedor Comercial | R/W apenas em projetos/leads próprios. |
| **TECH** | Técnico de Campo | Vistoria Mobile. Vê apenas SUAS tarefas designadas. |
| **USER** | Operacional Básico | Dashboards de leitura. |
| **B2B_CLIENT** | Cliente Extranet | Portal B2B isolado. Vê apenas projetos onde `clientId === user.id`. |
| **B2P_VENDOR** | Fornecedor Extranet | Portal B2P isolado. Vê apenas tasks vinculadas ao seu `vendorId`. |

## Matriz de Permissões por Módulo

### 🟢 Módulo Commercial

| Recurso | ADMIN | MANAGER | VENDEDOR | TECH | USER |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Leads (Todos) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Leads (Próprios) | ✅ | ✅ | ✅ | ❌ | 👁️ |
| Propostas Solares | ✅ | ✅ | 👁️ | ❌ | 👁️ |
| Cotações | ✅ | ✅ | ❌ | ❌ | ❌ |

### 🔵 Módulo Ops

| Recurso | ADMIN | MANAGER | COORDENACAO | TECH | USER |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Projetos (CRUD) | ✅ | ✅ | ✅ (sem Delete) | ❌ | ❌ |
| Kanban (Mover) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Timeline (Gantt) | ✅ | ✅ | ✅ | 👁️ | 👁️ |
| Vistoria App | ✅ | ✅ | 👁️ | ✅ | ❌ |

### 🟣 Módulo Strategy

| Recurso | ADMIN | MANAGER | TECH | USER |
| :--- | :---: | :---: | :---: | :---: |
| Editar Metas | ✅ | ❌ | ❌ | ❌ |
| Ver Compass | ✅ | ✅ | ❌ | 👁️ |

### 🌐 Módulo Extranet (B2B/B2P)

| Recurso | ADMIN | B2B_CLIENT | B2P_VENDOR |
| :--- | :---: | :---: | :---: |
| Client Portal (Projetos) | ✅ | 👁️ (próprios) | ❌ |
| Client Portal (Curva S) | ✅ | 👁️ | ❌ |
| Vendor Terminal (Tasks) | ✅ | ❌ | ✅ (próprias) |
| Vendor Terminal (RDOs) | ✅ | ❌ | ✅ |

### 🏦 Módulo Gateway (API Enterprise)

| Recurso | Autenticação | Controle |
| :--- | :--- | :--- |
| `/api/v2/gateway/*` | API Key (`TenantApiKey`) | Rate-limit por `apiMonthlyQuota` do Tenant |

### 🛡️ Módulo Admin

| Recurso | ADMIN | MANAGER | Outros |
| :--- | :---: | :---: | :---: |
| Tenant Settings (SSO/API) | ✅ | 👁️ | ❌ |
| Gestão de Usuários | ✅ | ❌ | ❌ |

---

> **Legenda:**
>
> - ✅ : Leitura e Escrita
> - 👁️ : Apenas Leitura
> - ❌ : Sem Acesso

> **Enforcement:** Todas as rotas passam por `authenticateToken` + `requireRole()`. Dados isolados por `withTenant(tx)` (RLS universal).

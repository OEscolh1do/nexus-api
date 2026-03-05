# Matriz de Controle de Acesso (RBAC)

O Neonorte | Nexus utiliza um sistema de RBAC (Role-Based Access Control) hierárquico. As permissões são aplicadas via Middleware (`auth.middleware.js`) e validadas no Frontend via `AppSwitcher` e `RBACWrapper`.

## Papéis (Roles)

| Role        | Descrição          | Escopo de Dados                                                                                         |
| :---------- | :----------------- | :------------------------------------------------------------------------------------------------------ |
| **ADMIN**   | Superusuário       | Acesso Irrestrito (Leitura/Escrita em todos os módulos). Gerencia usuários.                             |
| **MANAGER** | Gestor de Área     | Acesso Total ao seu módulo (ex: Ops Manager vê todos os Projetos). Acesso Leitura a módulos correlatos. |
| **TECH**    | Técnico de Campo   | Acesso Vistoria Mobile. Vê apenas SUAS tarefas designadas.                                              |
| **USER**    | Operacional Básico | Acesso limitado a dashboards de leitura.                                                                |

## Matriz de Permissões por Módulo

### 🟢 Módulo Commercial

| Recurso           | ADMIN | MANAGER | TECH | USER |
| :---------------- | :---: | :-----: | :--: | :--: |
| Leads (Todos)     |  ✅   |   ✅    |  ❌  |  ❌  |
| Leads (Próprios)  |  ✅   |   ✅    |  ❌  |  ✅  |
| Propostas Solares |  ✅   |   ✅    |  ❌  |  👁️  |
| Cotações          |  ✅   |   ✅    |  ❌  |  ❌  |

### 🔵 Módulo Ops

| Recurso          | ADMIN | MANAGER | TECH | USER |
| :--------------- | :---: | :-----: | :--: | :--: |
| Projetos (Gerar) |  ✅   |   ✅    |  ❌  |  ❌  |
| Kanban (Mover)   |  ✅   |   ✅    |  ✅  |  ❌  |
| Timeline (Gantt) |  ✅   |   ✅    |  👁️  |  👁️  |
| Vistoria App     |  ✅   |   ✅    |  ✅  |  ❌  |

### 🟣 Módulo Strategy

| Recurso      | ADMIN | MANAGER | TECH | USER |
| :----------- | :---: | :-----: | :--: | :--: |
| Editar Metas |  ✅   |   ❌    |  ❌  |  ❌  |
| Ver Compass  |  ✅   |   ✅    |  ❌  |  👁️  |

---

> **Legenda:**
>
> - ✅ : Leitura e Escrita
> - 👁️ : Apenas Leitura
> - ❌ : Sem Acesso

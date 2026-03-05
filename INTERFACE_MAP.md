# INTERFACE_MAP.md - Mapa de Interface - Sistema NEONORTE NEXUS

> **Última Atualização:** 23/01/2026
> **Arquiteto:** Antigravity AI
> **Versão:** 2.1.0 (Neonorte | Nexus SQL - Purged)

---

## 📋 VISÃO GERAL

Este documento mapeia **TODA a interface do usuário** do sistema NEXUS, correlacionando a estrutura de navegação (`MainLayout.tsx`) com os componentes de visualização (`src/views/`) e a lógica de roteamento (`App.tsx`).

> **Nota:** O sistema utiliza Roteamento de Estado (`useUI().currentView`) e não roteamento de URL tradicional (React Router).

---

## 🧭 ESTRUTURA DE NAVEGAÇÃO (Sidebar)

A navegação é definida em `src/components/layout/MainLayout.tsx` e segue um modelo de **Permissões por Capacidade** (RBAC).

### Seção 1: Estratégia & Gestão

| Label                     |       Ícone       | View ID (`currentView`) | Permissão (`capability`) | Arquivo View              |
| :------------------------ | :---------------: | :---------------------- | :----------------------- | :------------------------ |
| **Painel Estratégico**    | `LayoutDashboard` | `dashboard`             | `strategy.view`          | `DashboardView.tsx`       |
| **Gestão de Estratégias** |     `Target`      | `strategies`            | `strategy.view`          | `StrategyManagerView.tsx` |
| **Gestão de Pessoas**     |     `UserCog`     | `people`                | `team.view`              | `PeopleView.tsx`          |

### Seção 2: Engenharia & Projetos

| Label                 |      Ícone      | View ID (`currentView`) | Permissão (`capability`) | Arquivo View          |
| :-------------------- | :-------------: | :---------------------- | :----------------------- | :-------------------- |
| **Portfólio**         |   `Briefcase`   | `projects`              | `projects.view`          | `ProjectBoard.tsx`    |
| **Cronograma Mestre** | `CalendarRange` | `gantt`                 | `tasks.view`             | `GanttMatrixView.tsx` |
| **Fluxo de Trabalho** |   `Workflow`    | `kanban`                | `tasks.view`             | `KanbanView.tsx`      |
| **Cadastrar Projeto** |  `PlusSquare`   | `project-logic`         | `projects.create`        | `ProjectWizard.tsx`   |

### Seção 3: Governança do Sistema

| Label                    |     Ícone     | View ID (`currentView`) | Permissão (`capability`) | Arquivo View               |
| :----------------------- | :-----------: | :---------------------- | :----------------------- | :------------------------- |
| **Controle de Acesso**   | `ShieldCheck` | `org`                   | `users.manage`           | `DirectoryView.tsx`        |
| **Matriz de Permissões** |   `FileKey`   | `provisioning`          | `users.manage`           | `PermissionMatrixView.tsx` |
| **Trilha de Auditoria**  | `ScrollText`  | `audit`                 | `audit.view`             | `AuditView.tsx`            |
| **Integridade de Dados** | `DatabaseZap` | `schema`                | `users.manage`           | `SchemaValidator.tsx`      |

---

## 🧩 MAPA DE COMPONENTES DE VISUALIZAÇÃO

Mapeamento detalhado extraído de `src/App.tsx`.

### Views Principais (`src/views/`)

1.  **DashboardView.tsx** (`dashboard`)
    - **Função:** Visão Executiva de KPIs.
    - **Contexto:** Admin Only.
    - **Wrapper:** `ErrorBoundary` (ViewName: "Dashboard").

2.  **StrategyManagerView.tsx** (`strategies`)
    - **Função:** Gestão de Objetivos e Resultados Chave (BSC).
    - **Contexto:** Planejamento Estratégico.

3.  **KanbanView.tsx** (`kanban`)
    - **Função:** Gestão Operacional de Tarefas.
    - **Features:** Drag & Drop, Checklists.
    - **Wrapper:** `ErrorBoundary` (ViewName: "Fluxo de Trabalho").

4.  **GanttMatrixView.tsx** (`gantt`)
    - **Função:** Cronograma e dependências temporais.

5.  **PeopleView.tsx** (`people`)
    - **Função:** Diretório de colaboradores e hierarquia.

6.  **PermissionMatrixView.tsx** (`provisioning`)
    - **Função:** Grid de gestão de permissões (RBAC Granular).

7.  **AuditView.tsx** (`audit`)
    - **Função:** Visualizador de Logs de Segurança (`AuditLog`).

8.  **DirectoryView.tsx** (`org`)
    - **Função:** Cadastro Geral e Controle de Servidores.

---

## 🏗️ COMPONENTES AUXILIARES DE ROTEAMENTO

Algumas "Views" são renderizadas diretamente por componentes complexos em `src/components/`:

- **`ProjectBoard.tsx`** (`projects`): Visualização em Cards/Grid do portfólio.
- **`ProjectWizard.tsx`** (`project-logic`): Wizard passo-a-passo para criação de projetos complexos.
- **`SchemaValidator.tsx`** (`schema`): Ferramenta técnica para validar integridade do banco.

---

## 🔄 CICLO DE VIDA DA INTERFACE (`App.tsx`)

1.  **Gatekeeper:** Verifica `isAuthenticated`. Se falso, renderiza `LoginView`.
2.  **System Init:** Executa `RecurrenceService.checkAndSpawnRecurringTasks()` no load.
3.  **Onboarding:** Verifica flags de localStorage para exibir `OnboardingWizard`.
4.  **Router Switch:** Renderiza o componente baseado na string `currentView` do `UIContext`.

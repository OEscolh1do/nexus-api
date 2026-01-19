# MAPA_SISTEMA.md - Mapa de Sistema Integrado

> **Localização:** Raiz do Projeto
> **Objetivo:** Facilitar a navegação e comunicação entre Usuário e Agente, mapeando Interface Visual -> Código Fonte.
> **Instrução de Uso:** Ao solicitar alterações, cite o ID ou Nome do Objeto listado abaixo.

---

## 🗺️ FRONTEND (Interface do Usuário)

### 🖥️ Módulos Principais (Features)

#### 1. Kanban Board (Gestão de Projetos)

**Rota:** `/kanban`
**Localização:** `frontend/src/features/kanban-board`

| Objeto de Interface   | Arquivo Principal                 | Descrição                                            |
| :-------------------- | :-------------------------------- | :--------------------------------------------------- |
| **Página Principal**  | `components/KanbanBoard.jsx`      | Container principal das colunas e Drag & Dropcontext |
| **Coluna**            | `components/KanbanColumn.jsx`     | Coluna vertical (ex: Contato, Orçamento)             |
| **Cartão de Projeto** | `components/DraggableCard.jsx`    | Card arrastável do projeto                           |
| **Modal de Detalhes** | `components/ProjectModal.jsx`     | Modal principal com abas (Visão Geral, Anexos)       |
| **Modal de Consumo**  | `components/ConsumptionModal.jsx` | Modal para dados de energia (se houver)              |

#### 2. Lista de Clientes (CRM)

**Rota:** `/clients`
**Localização:** `frontend/src/features/client-list`

| Objeto de Interface    | Arquivo Principal                  | Descrição                                  |
| :--------------------- | :--------------------------------- | :----------------------------------------- |
| **Página de Listagem** | `components/ClientList.jsx`        | Tabela com filtro e busca de clientes      |
| **Modal Novo Lead**    | `components/CreateLeadModal.jsx`   | Modal para criar Clientes/Projetos rápidos |
| **Modal Detalhes**     | `components/ClientDetailModal.jsx` | Edição completa e histórico do cliente     |

#### 3. Administração (Usuários)

**Rota:** `/admin/users`
**Localização:** `frontend/src/features/admin`

| Objeto de Interface      | Arquivo Principal                 | Descrição                         |
| :----------------------- | :-------------------------------- | :-------------------------------- |
| **Página de Usuários**   | `components/RegisterUserPage.jsx` | Listagem de usuários do sistema   |
| **Modal Novo Usuário**   | `components/CreateUserModal.jsx`  | Formulário de cadastro de usuário |
| **Modal Editar Usuário** | `components/EditUserModal.jsx`    | Edição de permissões e dados      |

#### 4. Dashboard (Métricas)

**Rota:** `/dashboard`
**Localização:** `frontend/src/features/dashboard`

| Objeto de Interface     | Arquivo Principal              | Descrição                      |
| :---------------------- | :----------------------------- | :----------------------------- |
| **Página de Dashboard** | `components/DashboardPage.jsx` | Visão geral de KPIs e gráficos |

#### 5. Perfil & Autenticação

**Rota:** `/login`, `/profile`

| Objeto de Interface | Arquivo Principal                       | Descrição               |
| :------------------ | :-------------------------------------- | :---------------------- |
| **Login**           | `features/authentication/LoginPage.jsx` | Tela de entrada         |
| **Perfil**          | `features/profile/ProfilePage.jsx`      | Dados do usuário logado |

### 🧱 Componentes Globais & Layout

| Objeto de Interface  | Arquivo Principal                  | Descrição                         |
| :------------------- | :--------------------------------- | :-------------------------------- |
| **Layout Principal** | `components/Layout/MainLayout.jsx` | Wrapper com Sidebar e Outlet      |
| **Menu Lateral**     | `components/Layout/Sidebar.jsx`    | Navegação principal               |
| **Troca de Tema**    | `components/ThemeToggle.jsx`       | Botão Dark/Light mode             |
| **Proteção de Rota** | `components/ProtectedRoute.jsx`    | Wrapper de segurança (Auth Check) |

---

## ⚙️ BACKEND (API & Lógica)

### 📡 Controladores (Endpoints)

**Localização:** `backend/src/controllers`

| Entidade         | Arquivo                | Funções Principais                                            |
| :--------------- | :--------------------- | :------------------------------------------------------------ |
| **Projetos**     | `projectController.js` | `getProjects`, `createLead`, `updateProject`, `deleteProject` |
| **Clientes**     | `clientController.js`  | `getClients`, `updateClient`, `deleteClient`                  |
| **Autenticação** | `authController.js`    | `login`, `register`                                           |
| **Mobile**       | `mobileController.js`  | `createLeadMobile` (Integração App)                           |

### 🧩 Módulos & Serviços

**Localização:** `backend/src/modules` (Estrutura Modular)
**Nota:** A lógica de negócio tende a ser delegada para services dentro destes módulos.

| Módulo        | Pasta          | Responsabilidade                     |
| :------------ | :------------- | :----------------------------------- |
| **Projetos**  | `projects/`    | Lógica de Kanban, Status, Drag&Drop  |
| **Clientes**  | `clients/`     | Gestão de dados pessoais e contatos  |
| **Auth**      | `auth/`        | Gestão de tokens e segurança         |
| **Dashboard** | `dashboard/`   | Agregação de estatísticas            |
| **Anexos**    | `attachments/` | Upload e gestão de arquivos (Multer) |
| **Mobile**    | `mobile/`      | Endpoints específicos para app móvel |

### 💾 Banco de Dados & Modelos

**Localização:** `backend/prisma/schema.prisma`

| Modelo           | Tabela DB      | Descrição                               |
| :--------------- | :------------- | :-------------------------------------- |
| **Project**      | `Project`      | Entidade central (Kanban Card)          |
| **Client**       | `Client`       | Cliente (Pessoa/Empresa)                |
| **User**         | `User`         | Usuário do sistema (Vendedor/Eng/Admin) |
| **ActivityLog**  | `ActivityLog`  | Histórico de ações (Audit)              |
| **Attachment**   | `Attachment`   | Referência de arquivos                  |
| **ConsumerUnit** | `ConsumerUnit` | Dados técnicos de energia               |

---

## 🧠 LÓGICA & ESTADO (Architecture Deep Dive)

### Frontend: Estado Misto

O sistema utiliza uma abordagem híbrida de gerenciamento de estado:

1.  **Estado Global Persistente (Zustand)**
    - `src/store/useAuthStore.js`: Token JWT e Dados do Usuário.
    - `src/store/useThemeStore.js`: Tema Dark/Light.
2.  **Estado de Servidor/Local (React + Axios)**
    - **Padrão Atual:** Chamadas diretas à API (`api.get`, `api.post`) dentro de componentes (`useEffect`).
    - **Cliente HTTP:** `src/lib/axios.js` (Configuração central + Interceptor de Auth).
    - _Nota:_ Não há camada de "Services" isolada no frontend; a lógica está nos componentes (ex: `KanbanBoard.jsx` gerencia o fetch de projetos).

### Backend: Middlewares & Segurança

**Localização:** `backend/src/middlewares`

| Middleware       | Arquivo             | Função                            |
| :--------------- | :------------------ | :-------------------------------- |
| **Autenticação** | `authMiddleware.ts` | Valida JWT e popula `req.user`.   |
| **Validação**    | `zodMiddleware.ts`  | Valida input contra schemas Zod.  |
| **Rate Limit**   | `rateLimit.ts`      | Proteção contra DDoS/Brute Force. |

---

## 🔗 Conexões Comuns (Cheatsheet)

1. **Alterar colunas do Kanban?**
   - Frontend: `KanbanBoard.jsx` (Visualização)
   - Backend: `projectController.js` (Persistência Status) + `prisma/schema.prisma` (Enum ProjectStatus)

2. **Adicionar campo no cadastro de Cliente?**
   - Frontend: `CreateLeadModal.jsx` (Criação) + `ClientDetailModal.jsx` (Edição)
   - Backend: `clientController.js` (Recebimento) + `prisma/schema.prisma` (Model Client)

3. **Mudar lógica de Permissões?**
   - Frontend: `ProtectedRoute.jsx` (Bloqueio de Rota) + `Sidebar.jsx` (Ocultar Menu)
   - Backend: `authController.js` (Role no Token) + Middleware de rota

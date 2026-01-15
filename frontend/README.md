# NEXUS NORTE - Sistema Integrado de Gestão (CRM & Engenharia Fotovoltaica)

## 📖 Visão Geral do Projeto

O **NEXUS NORTE** é uma aplicação corporativa Full-Stack projetada para unificar o fluxo comercial (CRM) e técnico (Engenharia) de projetos de energia solar. O sistema resolve o problema da fragmentação de dados, onde vendedores utilizam planilhas e engenheiros utilizam softwares de cálculo isolados.

A solução implementa uma arquitetura **PERN** (PostgreSQL, Express, React, Node.js), escolhida pela sua capacidade de lidar com I/O assíncrono intensivo, escalabilidade horizontal e tipagem unificada (JavaScript/ES6+).

---

## 🏗️ 1. Arquitetura de Software

O sistema segue o padrão de arquitetura **Client-Server Desacoplado** (Decoupled Architecture) comunicando-se via **RESTful API**.

### 1.1. Fluxo de Dados (Request/Response Cycle)
1.  **Client-Side (Frontend):** A SPA (Single Page Application) em React gerencia o estado da aplicação e a renderização do DOM.
2.  **Transport Layer (HTTP):** Requisições JSON são enviadas via Axios para o servidor.
3.  **API Gateway / Controller (Backend):** O Express recebe a requisição, passa por middlewares de segurança (CORS, JWT Auth) e encaminha para o serviço específico.
4.  **Service Layer (Business Logic):** Onde residem os motores de cálculo (`fotonEngine.js`, `financialEngine.js`). Aqui a regra de negócio é processada.
5.  **Persistence Layer (ORM & DB):** O Prisma traduz objetos JavaScript para SQL otimizado e interage com o PostgreSQL rodando em container Docker.

---

## 🛠️ 2. Backend (Server-Side)

O Backend foi construído sobre o **Node.js** devido ao seu modelo de **Event Loop Non-Blocking I/O**. Isso permite que o sistema gerencie múltiplas requisições de cálculo e geração de PDF simultaneamente sem travar a thread principal, algo crucial para sistemas multiusuário.

### Stack & Bibliotecas
* **Express.js:** Framework minimalista para roteamento e gerenciamento de middlewares.
* **Prisma ORM:**
    * *O que é:* Object-Relational Mapping.
    * *Função:* Abstrai a complexidade do SQL cru. Permite modelagem de dados declarativa (`schema.prisma`) e gera migrações de banco de dados (`migrations`), garantindo versionamento e integridade do schema em ambientes de desenvolvimento e produção.
* **PDFKit:**
    * *Função:* Engine de geração de documentos baseada em *streams*. Permite desenhar vetores e inserir textos programaticamente para criar propostas comerciais dinâmicas com base nos dados calculados em tempo real.
* **Multer:**
    * *Função:* Middleware para manipulação de `multipart/form-data`. Intercepta o stream de upload de arquivos (ex: contas de energia) e os armazena no sistema de arquivos local (`/uploads`), vinculando o caminho ao banco de dados.
* **JSONWebToken (JWT) & Bcrypt:**
    * *Segurança:* Implementa autenticação *stateless* (sem sessão no servidor). As senhas são armazenadas como *hashes* (embaralhadas) via Bcrypt, e o acesso é concedido via tokens assinados criptograficamente.

---

## 💻 3. Frontend (Client-Side)

A interface é uma **SPA (Single Page Application)** construída com **React.js**. Diferente de sites tradicionais, o servidor envia a aplicação apenas uma vez, e a navegação subsequente é feita via JavaScript, alterando o DOM virtualmente, o que garante uma experiência de usuário (UX) extremamente fluida.

### Stack & Bibliotecas
* **Vite:** Build tool de próxima geração. Utiliza *ES Modules* nativos do navegador, proporcionando um tempo de inicialização ("Cold Start") quase instantâneo e *Hot Module Replacement* (HMR) eficiente.
* **Zustand:**
    * *Função:* Gerenciamento de Estado Global.
    * *Por que usar:* Resolve o problema de *Prop Drilling* (passar dados de pai para filho em muitos níveis) de forma mais leve e performática que o Redux. Usado aqui para manter a sessão do usuário e dados de UI.
* **Axios:** Cliente HTTP baseado em *Promises*. Preferido ao `fetch` nativo por suportar *Interceptors* (tratamento global de erros 401/403) e transformação automática de JSON.
* **TailwindCSS:** Framework CSS *Utility-First*. Permite estilização direta no JSX, garantindo consistência de design (Design System) e redução do tamanho final do CSS (purge de classes não usadas).
* **Lucide-React:** Biblioteca de ícones SVG otimizada (Tree-shakable), garantindo que apenas os ícones usados sejam incluídos no bundle final.

---

## 🐳 4. Infraestrutura e Docker

O projeto utiliza **Containerização** via Docker para o Banco de Dados.


### O que é Docker?
Docker é uma plataforma que empacota uma aplicação e suas dependências em um "Container". Diferente de uma Máquina Virtual (que simula um sistema operacional inteiro), o Container compartilha o Kernel do OS hospedeiro, sendo muito mais leve.

### Por que usamos no NEXUS?
Utilizamos o Docker especificamente para isolar o serviço do **PostgreSQL**.
1.  **Ambiente Determinístico:** Garante que todos os desenvolvedores (e o servidor de produção) rodem exatamente a mesma versão do banco de dados (ex: Postgres 15-alpine), eliminando falhas de compatibilidade.
2.  **Zero Instalação:** Não é necessário instalar o PostgreSQL no Windows/Linux localmente. O comando `docker-compose up` baixa a imagem, cria o volume de dados e expõe a porta 5432 automaticamente.

---

## 📊 5. Metodologia: Kanban e Agile no CRM

O desenvolvimento do sistema foi guiado por princípios de **Engenharia de Software Ágil**, focando em entregas incrementais (Fase I: Cadastro, Fase II: Engenharia, Fase III: Automação).

### O Modelo Kanban (Visualização de Fluxo)
No contexto de um CRM (*Customer Relationship Management*), o Kanban não é apenas uma ferramenta de gestão de tarefas, mas uma representação de **Máquina de Estados Finitos**.

* **Pipeline de Vendas:** Cada coluna (Lead -> Contato -> Visita -> Proposta -> Fechamento) representa um estado no ciclo de vida da venda.
* **Gestão Visual:** Permite a identificação imediata de *Gargalos* (Bottlenecks). Se a coluna "Visita" tem muitos cartões acumulados, a gestão sabe que precisa alocar mais engenheiros.
* **Interatividade:** A funcionalidade *Drag-and-Drop* implementada no Frontend dispara requisições `PUT` para a API, atualizando o status no banco de dados em tempo real.

---

## 📂 6. Estrutura de Diretórios (File Tree)

O projeto segue uma estrutura modular baseada em funcionalidades (*Feature-based*) no Frontend e MVC (*Model-View-Controller*) adaptado no Backend.

```text
NEONORTE/
├── backend/                  # API Server
│   ├── prisma/               # Camada de Dados (ORM)
│   │   ├── dados/            # CSVs brutos para ETL (Carga de Catálogo)
│   │   ├── import_data.js    # Script de Migração de Dados (Seed)
│   │   └── schema.prisma     # Definição Declarativa do Banco de Dados
│   ├── src/
│   │   ├── routes/           # Controllers (Rotas da API)
│   │   ├── services/         # Domain Logic (Engines de Cálculo/PDF)
│   │   └── index.js          # Entry Point (Configuração do Express)
│   └── uploads/              # Storage Local
│
├── frontend/                 # Client Application
│   ├── src/
│   │   ├── components/       # UI Components Genéricos (Botões, Layouts)
│   │   ├── features/         # Módulos de Negócio (Kanban, Catálogo)
│   │   │   ├── kanban-board/ # Lógica do CRM e Modais
│   │   │   └── catalog/      # Gestão de Equipamentos
│   │   ├── store/            # State Management (Zustand)
│   └── App.jsx               # Roteamento (React Router)
└── docker-compose.yml        # Orquestração de Containers
```

# 🛠️ Tech Stack & Dependências - Nexus Norte CRM

Este documento lista todas as tecnologias e bibliotecas utilizadas no desenvolvimento do sistema Nexus Norte, detalhando a função de cada uma dentro da arquitetura do projeto.

---

## 🖥️ Backend (API & Servidor)

O backend foi construído utilizando **Node.js** com **Express**, focado em performance e arquitetura REST API.

### Núcleo e Servidor
- **`express`**: O framework web utilizado para criar as rotas da API (GET, POST, PUT, DELETE) e gerenciar as requisições HTTP.
- **`cors`**: Middleware de segurança que permite que o Frontend (React) se comunique com o Backend em dominios/portas diferentes.
- **`dotenv`**: Carrega as variáveis de ambiente do arquivo `.env` (como senhas de banco e segredos JWT) para manter dados sensíveis fora do código.

### Banco de Dados (ORM)
- **`@prisma/client`**: Cliente gerado automaticamente para conectar e realizar consultas (queries) no banco de dados de forma segura e tipada.
- **`prisma`** *(Dev Dependency)*: Ferramenta de linha de comando para gerenciar o esquema do banco, criar migrações e sincronizar o modelo de dados.

### Segurança e Autenticação
- **`bcryptjs`**: Utilizada para criptografar (hash) as senhas dos usuários antes de salvar no banco de dados. Nunca salvamos senhas em texto puro.
- **`jsonwebtoken` (JWT)**: Gera os tokens de acesso seguros. Quando o usuário faz login, ele recebe um token que valida sua sessão nas rotas protegidas.

### Funcionalidades Específicas
- **`multer`**: Middleware para manipulação de `multipart/form-data`. É responsável pelo upload de arquivos (Fotos de Perfil e Anexos de Projetos).
- **`pdfkit`**: Biblioteca utilizada para desenhar e gerar arquivos PDF dinamicamente (usada na geração automática de Propostas Comerciais).

### Ferramentas de Desenvolvimento
- **`nodemon`** *(Dev Dependency)*: Monitora mudanças nos arquivos e reinicia o servidor automaticamente, agilizando o desenvolvimento.

---

## 🎨 Frontend (Interface Web)

O frontend é uma Single Page Application (SPA) construída com **React** e **Vite**, focada em experiência do usuário (UX) e responsividade.

### Core e Estrutura
- **`react`** & **`react-dom`**: Biblioteca principal para construção da interface baseada em componentes.
- **`vite`**: Ferramenta de build e servidor de desenvolvimento. É extremamente rápido e substitui o antigo Create React App.
- **`react-router-dom`**: Gerencia a navegação entre páginas (rotas) sem recarregar o navegador (ex: ir do Login para o Kanban).

### Estilização e UI
- **`tailwindcss`**: Framework CSS utilitário. Permite estilizar componentes diretamente no HTML (ex: `flex`, `bg-blue-500`, `p-4`).
- **`postcss`** & **`autoprefixer`**: Processadores necessários para o Tailwind funcionar corretamente em diferentes navegadores.
- **`lucide-react`**: Biblioteca de ícones moderna e leve (ex: ícones de Sol, Usuário, Menu, Lixeira).

### Gerenciamento de Estado e Lógica
- **`axios`**: Cliente HTTP baseado em Promises. Usado para fazer as chamadas para o Backend (ex: Buscar clientes, Salvar projetos).
- **`zustand`**: Biblioteca de gerenciamento de estado global. Usada para persistir a sessão do usuário (`useAuthStore`) e manter dados acessíveis em toda a aplicação de forma simples.

### Interatividade
- **`react-beautiful-dnd`**: Biblioteca responsável pela funcionalidade de "Arrastar e Soltar" (Drag and Drop) dos cards no quadro Kanban.

---

## 🗄️ Banco de Dados

- **PostgreSQL**: Banco de dados relacional robusto utilizado em produção (via Docker).
- **SQLite** (Legado/Dev): Utilizado inicialmente para prototipagem rápida (arquivo local `.db`). O sistema suporta ambos via Prisma.

---

## 📦 Como Instalar as Dependências

# 1. Instalar Backend
cd backend
npm install express cors dotenv bcryptjs jsonwebtoken multer pdfkit @prisma/client
npm install --save-dev prisma nodemon

# 2. Instalar Frontend
cd ../frontend
npm install react-router-dom axios zustand lucide-react react-beautiful-dnd recharts framer-motion
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
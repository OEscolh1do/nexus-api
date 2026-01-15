# NEONORTE NEXUS - Sistema de Gestão Comercial

Sistema CRM/ERP para gestão de projetos de energia solar fotovoltaica.

## 🚀 Setup Inicial (Nova Máquina)

### Pré-requisitos

- Node.js 18+
- Docker Desktop
- Git

### 1. Clone e Instale Dependências

```bash
# Instalar dependências do backend
cd backend
npm install

# Instalar dependências do frontend
cd ../frontend
npm install
```

### 2. Configure o Banco de Dados (Docker)

```bash
# Na raiz do projeto, inicie o PostgreSQL via Docker
docker-compose up -d

# Verificar se os containers estão rodando
docker ps
```

**Containers criados:**

- `neonorte-db` - MySQL 8.0 (porta 3307)
- `neonorte-pgadmin` - (Removido/Desativado)

**Credenciais padrão:**

- MySQL: `neonorte` / `neonorte123` (Conectar via Workbench/DBeaver na porta 3307)

### 3. Configure Variáveis de Ambiente

```bash
# No backend, copie o template
cd backend
cp .env.example .env

# Edite o .env se necessário (credenciais padrão já funcionam)
```

### 4. Execute Migrations do Prisma

```bash
cd backend

# Gerar Prisma Client
npx prisma generate

# Aplicar migrations (cria tabelas no MySQL)
npx prisma migrate dev --name init_mysql

# (Opcional) Popular banco com dados de teste
npx prisma db seed
```

### 5. Inicie os Servidores

```bash
# Terminal 1 - Backend
cd backend
npm run dev
# Backend rodando em http://localhost:3001

# Terminal 2 - Frontend
cd frontend
npm run dev
# Frontend rodando em http://localhost:5173
```

### 6. Acesse o Sistema

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api
- **pgAdmin:** http://localhost:5050

**Login padrão (se houver seed):**

- Email: `admin@neonorte.com`
- Senha: `admin123`

---

## 📁 Estrutura do Projeto

```
Neonorte/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/      # (fotonEngine/financialEngine REMOVIDOS)
│   │   └── index.js
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── store/
│   │   └── App.jsx
│   └── package.json
├── docker-compose.yml     # MySQL 8.0
├── CONTEXT.md            # Documentação técnica completa
├── DFD.md               # Diagramas de fluxo de dados
└── INTERFACE_MAP.md     # Mapa de interface do usuário
```

---

## 🛠️ Comandos Úteis

### Docker

```bash
# Iniciar containers
docker-compose up -d

# Parar containers
docker-compose down

# Ver logs do PostgreSQL
docker logs neonorte-postgres

# Resetar banco (APAGA TUDO)
docker-compose down -v
docker-compose up -d
cd backend; npx prisma migrate dev
```

### Prisma

```bash
cd backend

# Visualizar banco no navegador
npx prisma studio

# Resetar banco (APAGA TUDO e recria)
npx prisma migrate reset

# Criar nova migration
npx prisma migrate dev --name nome_da_migration

# Aplicar migrations pendentes
npx prisma migrate deploy
```

### Desenvolvimento

```bash
# Backend com auto-reload
cd backend
npm run dev

# Frontend com auto-reload
cd frontend
npm run dev

# Build de produção (frontend)
cd frontend
npm run build
```

---

## 🔧 Troubleshooting

### Erro: "Port 5432 already in use"

```bash
# Parar PostgreSQL local do Windows
Get-Service postgresql* | Stop-Service

# Ou usar outra porta no docker-compose.yml:
ports:
  - "5433:5432"  # Muda porta externa para 5433
```

### Erro: "Authentication failed"

```bash
# Verificar se o .env está correto
cat backend/.env

# Reconstruir containers do zero
docker-compose down -v
docker-compose up -d
```

### Erro: "Cannot find module @prisma/client"

```bash
cd backend
npm install
npx prisma generate
```

---

## 📚 Documentação Técnica

- **CONTEXT.md** - Schema do banco, rotas da API, serviços
- **DFD.md** - Diagramas Mermaid de fluxo de dados
- **INTERFACE_MAP.md** - Mapa completo da interface do usuário

---

## 🚨 Mudanças Recentes

**2026-01-13:** Removidos motores de cálculo (`fotonEngine` e `financialEngine`)

- Deletados 4 arquivos de serviço
- Removidos 3 models Prisma (SystemConfig, SolarPanel, Inverter)
- Simplificado model Project (20+ campos removidos)
- Sistema focado em gestão de pipeline comercial

Ver [walkthrough.md](file:///.gemini/antigravity/brain/e46c8645-54c1-40f4-9cfd-20f228d25b94/walkthrough.md) para detalhes completos.

---

## 👥 Equipe

**Desenvolvedor Original:** (outra máquina)  
**Atual Responsável:** Equipe Neonorte  
**Objetivo:** Integração com site Neonorte

---

## 📞 Suporte

Para dúvidas sobre o sistema, consultar documentação técnica ou abrir issue no repositório.

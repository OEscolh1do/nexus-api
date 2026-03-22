# NEONORTE — Workspace Multi-Serviço

Ecossistema modular para energia solar, composto por dois domínios autônomos conectados via API M2M e deep links.

| Domínio | Codinome | Função |
|---------|----------|--------|
| Gestão & CRM | **Iaçã** | ERP, Leads, Pipeline, Strategy, Operations |
| Engenharia Solar | **Kurupira** | Dimensionamento, Elétrico, Proposta, Simulação |

---

## 🚀 Setup Rápido (Docker)

```bash
# 1. Subir os 4 contentores (MySQL + Iaçã + Kurupira + Gateway)
docker-compose up --build -d

# 2. Inicializar os schemas
docker exec neonorte_iaca npx prisma db push
docker exec neonorte_kurupira npx prisma db push

# 3. Semear admin (admin/123)
docker exec neonorte_iaca node seed_admin_fix.js
```

## 🛠️ Desenvolvimento Local (sem Docker)

### Iaçã Backend (porta 3001)

```bash
cd iaca-erp/backend
npm install
npx prisma generate
npm run dev
```

### Iaçã Frontend (porta 3000)

```bash
cd iaca-erp/frontend
npm install
npm run dev
```

### Kurupira Backend (porta 3002)

```bash
cd kurupira/backend
npm install
npx prisma generate
npm run dev
```

### Kurupira Frontend (porta 5173)

```bash
cd kurupira/frontend
npm install
npm run dev
```

---

## 📂 Estrutura do Workspace

```
neonorte/
├── iaca-erp/
│   ├── frontend/         (React 19, Vite, TailwindCSS, Axios)
│   └── backend/          (Express, Prisma → db_iaca)
├── kurupira/
│   ├── frontend/         (React 19, Vite, Zustand, Workspace dark)
│   └── backend/          (Express, Prisma → db_kurupira)
├── infra/
│   ├── mysql/init.sql    (GRANTs e schemas)
│   └── nginx/nginx.conf  (API Gateway)
├── docker-compose.yml    (4 contentores)
├── CONTEXT.md            (Documentação técnica completa)
└── README.md             (este ficheiro)
```

---

## 📚 Documentação

- [CONTEXT.md](./CONTEXT.md) — Arquitetura, schemas, módulos e rotas de API
- [As-Built Visual](./docs/as-built/as_built_visual.md) — Galeria de mudanças na interface Kurupira
- [Relatório de Execução Docker](./docs/as-built/relatorio_execucao_dockerizacao.md) — Detalhes da migração infra original
- [docker-compose.yml](./docker-compose.yml) — Orquestração de contentores

---

## 🔑 Acesso Padrão (Dev)

| App | URL | Login | Senha |
|-----|-----|-------|-------|
| Iaçã ERP | http://localhost:3000 | `admin` | `123` |
| Kurupira Workspace | http://localhost:5173 | — (mock bypass) | — |

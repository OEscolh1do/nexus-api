# 🔧 Configuração da Stack - Neonorte Neonorte | Nexus 2.0

> **🎯 Objetivo:** Configuração pré-preenchida da stack tecnológica do Neonorte | Nexus Monolith.
> Este arquivo é referenciado automaticamente pelos templates específicos do Neonorte | Nexus.

---

## Frontend

- **Framework:** React 19.2
- **Build Tool:** Vite 7.x
- **Linguagem:** TypeScript 5.9
- **Gerenciamento de Estado:** Context API + React Query
- **Estilização:** TailwindCSS 4.x
- **Componentes:** Shadcn/UI (Radix UI)
- **Formulários:** React Hook Form + Zod
- **Roteamento:** React Router 7.x
- **Ícones:** Lucide React

---

## Backend

- **Framework:** Express.js 5.x
- **Linguagem:** Node.js 18+ (JavaScript)
- **ORM/Query Builder:** Prisma 5.10.2
- **Validação:** Zod 4.x (mandatório)
- **Autenticação:** JWT + bcrypt
- **CORS:** cors middleware
- **Logging:** Winston (planejado)

---

## Database

- **Tipo:** MySQL 8.0
- **Migrations:** Prisma Migrate
- **Hospedagem:** Local (desenvolvimento) / Railway (produção planejada)
- **Seed:** `backend/prisma/seed.js`

---

## Testes

- **Framework de Testes:** Vitest (planejado)
- **Testes E2E:** Playwright (planejado)
- **Cobertura de Código:** c8 (planejado)

---

## DevOps & Infraestrutura

- **Containerização:** Docker + Docker Compose
- **CI/CD:** GitHub Actions (planejado)
- **Hospedagem Frontend:** Vercel (planejado)
- **Hospedagem Backend:** Railway (planejado)
- **Monitoramento:** (planejado)

---

## Padrões Arquiteturais

### Backend

- **Universal CRUD Controller** (`backend/src/controllers/UniversalController.js`)
- **Service Layer Pattern** (`backend/src/services/`)
- **Zod Validation Middleware** (mandatório em todas as rotas)
- **Prisma Transactions** (operações multi-tabela)

### Frontend

- **Module-based Structure** (`frontend/src/modules/`)
- **Shared Components** (`frontend/src/components/`)
- **Type-safe API Client** (`frontend/src/lib/api.ts`)
- **Form Validation** (React Hook Form + Zod)

---

## Estrutura de Diretórios

```
nexus-monolith/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Schema do banco
│   │   ├── seed.js                # Dados de teste
│   │   └── migrations/            # Histórico de migrations
│   ├── src/
│   │   ├── controllers/           # Lógica de rotas
│   │   ├── services/              # Lógica de negócio
│   │   ├── validators/            # Schemas Zod
│   │   ├── middleware/            # Autenticação, CORS, etc.
│   │   └── server.js              # Entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── modules/               # Módulos de negócio
│   │   │   ├── ops/               # Operações
│   │   │   ├── commercial/        # Comercial
│   │   │   ├── executive/         # Executivo
│   │   │   └── ...
│   │   ├── components/            # Componentes compartilhados
│   │   │   └── ui/                # Shadcn/UI
│   │   ├── lib/                   # Utilitários
│   │   │   └── api.ts             # Cliente Axios
│   │   ├── types/                 # Interfaces TypeScript
│   │   └── App.tsx                # Entry point
│   └── package.json
│
├── docs/                          # Documentação
│   ├── CONTEXT.md                 # Visão geral do sistema
│   └── map_nexus_monolith/        # Mapas de interface
│
└── prompts/                       # Templates de prompts (legado)
```

---

## Restrições de Segurança (Não-Negociáveis)

1. **🔐 Validação Zod:**
   - Toda entrada de dados DEVE ser validada com Zod
   - Backend: `validators/*.js`
   - Frontend: `zodResolver` no React Hook Form

2. **🔒 Transações Atômicas:**
   - Operações multi-tabela DEVEM usar `prisma.$transaction([])`
   - Garantir consistência de dados

3. **🚫 Proteção CVE-2025-55182:**
   - Nunca serializar funções ou código executável
   - Validar TUDO que atravessa a fronteira Cliente → Servidor

4. **🔑 Autenticação:**
   - JWT com expiração
   - Senhas hasheadas com bcrypt (salt rounds: 10)
   - Middleware de autenticação em rotas protegidas

---

## Comandos Úteis

### Backend

```bash
cd backend
npm run dev                        # Iniciar servidor
npx prisma migrate dev             # Aplicar migrations
npx prisma studio                  # GUI do banco
npx prisma generate                # Regenerar Prisma Client
node prisma/seed.js                # Popular dados de teste
```

### Frontend

```bash
cd frontend
npm run dev                        # Iniciar dev server
npm run build                      # Build de produção
npm run preview                    # Preview da build
npm run lint                       # Lint
```

### Full Stack

```bash
docker-compose up -d               # Iniciar tudo
docker logs nexus_backend -f       # Logs backend
docker logs nexus_frontend -f      # Logs frontend
```

---

## 💡 Como Usar nos Templates

Ao usar templates específicos do Neonorte | Nexus (pastas 03-08), referencie este arquivo:

```xml
<stack_context>
  Stack: {{CONSULTE: prompts_unified/01_KNOWLEDGE/NEXUS_STACK_CONFIG.md}}
</stack_context>
```

---

**Última Atualização:** 2026-01-25  
**Versão:** 2.1  
**Compatível com:** Neonorte | Nexus Monolith 2.1+

---
name: bff-backoffice
description: Especialista na arquitetura BFF (Backend for Frontend) do neonorte-admin. Ative ao implementar rotas do Admin BFF, configurar clientes M2M (Axios) para Iaçã/Kurupira, criar Prisma Clients read-only multi-schema, ou projetar a camada de autenticação PLATFORM_ADMIN. Cobre o padrão Híbrido Pragmático (leitura direta + escrita via M2M).
---

# Skill: BFF Backoffice

## Gatilho Semântico

Ativado quando:
- O agente precisa criar ou modificar rotas no `neonorte-admin/backend/`
- A tarefa envolve comunicação M2M entre o Admin BFF e os serviços Iaçã ou Kurupira
- É necessário configurar Prisma Clients read-only para `db_iaca` e/ou `db_kurupira`
- O agente precisa implementar autenticação `PLATFORM_ADMIN` (JWT hardened, sem self-registration)
- Qualquer menção a: `m2mClient`, `X-Service-Token`, `DATABASE_URL_*_RO`, `admin BFF`, `admin backend`, `neonorte-admin/backend`
- Alterações no `docker-compose.yml` para o serviço `neonorte-admin-backend`

## Protocolo

### 1. Identificar o Tipo de Operação

Antes de implementar qualquer endpoint, classificar:

| Tipo | Fonte | Implementação |
|:---|:---|:---|
| **Leitura** (GET, listagem, relatório, auditoria) | Prisma Client read-only → banco direto | Query SQL/Prisma com user `user_admin` (SELECT only) |
| **Escrita** (POST, PUT, DELETE, mutação) | Axios M2M → API do serviço dono | Chamada HTTP interna com header `X-Service-Token` |

> **Regra de ouro**: Nunca escrever diretamente no banco via Admin BFF. Toda mutação passa pelo serviço dono do dado.

### 2. Estrutura de Rotas

```
neonorte-admin/backend/src/
├── server.js                  # Express bootstrap, middleware global
├── middleware/
│   └── platformAuth.js        # JWT validator (role = PLATFORM_ADMIN)
├── lib/
│   ├── prismaIaca.js          # Prisma Client → db_iaca (READ-ONLY)
│   ├── prismaKurupira.js      # Prisma Client → db_kurupira (READ-ONLY)
│   └── m2mClient.js           # Axios instances com M2M_SERVICE_TOKEN
├── routes/
│   ├── tenants.js             # /admin/tenants
│   ├── users.js               # /admin/users
│   ├── catalog.js             # /admin/catalog/modules, /admin/catalog/inverters
│   ├── auditLogs.js           # /admin/audit-logs
│   └── system.js              # /admin/system/health
└── controllers/
    └── ... (um por domínio)
```

### 3. Padrão de M2M Client

```javascript
// lib/m2mClient.js
const axios = require('axios');

const iacaClient = axios.create({
  baseURL: process.env.IACA_INTERNAL_URL,
  headers: {
    'X-Service-Token': process.env.M2M_SERVICE_TOKEN,
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

const kurupiraClient = axios.create({
  baseURL: process.env.KURUPIRA_INTERNAL_URL,
  headers: {
    'X-Service-Token': process.env.M2M_SERVICE_TOKEN,
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Mais alto para operações pesadas (.pan/.ond parsing)
});

module.exports = { iacaClient, kurupiraClient };
```

### 4. Padrão de Prisma Read-Only

O Admin BFF deve ter **dois** Prisma Clients separados, cada um conectado ao schema respectivo com credenciais `SELECT-only`:

```javascript
// lib/prismaIaca.js
const { PrismaClient } = require('@prisma/client');
const prismaIaca = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL_IACA_RO } },
});
module.exports = prismaIaca;
```

> **Atenção**: Esses Prisma Clients precisam de seus próprios `schema.prisma` refletindo os modelos do Iaçã e do Kurupira que o Admin precisa ler. NÃO copiar os schemas inteiros — incluir apenas os modelos consumidos pelo Admin.

### 5. Padrão de Autenticação

```javascript
// middleware/platformAuth.js
const jwt = require('jsonwebtoken');

function platformAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token ausente' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'PLATFORM_ADMIN') {
      return res.status(403).json({ error: 'Acesso restrito a operadores da plataforma' });
    }
    req.operator = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}
module.exports = platformAuth;
```

### 6. Variáveis de Ambiente Obrigatórias

```env
# Autenticação
JWT_SECRET=nexus_dev_secret_2026

# M2M (escrita via serviços irmãos)
M2M_SERVICE_TOKEN=m2m_guardioes_secret_2026!
IACA_INTERNAL_URL=http://iaca-backend:3001
KURUPIRA_INTERNAL_URL=http://kurupira-backend:3002

# Prisma Read-Only (leitura direta nos bancos)
DATABASE_URL_IACA_RO=mysql://user_admin:admin_S3cur3_2026!@nexus-db:3306/db_iaca
DATABASE_URL_KURUPIRA_RO=mysql://user_admin:admin_S3cur3_2026!@nexus-db:3306/db_kurupira

# Servidor
PORT=3003
NODE_ENV=development
```

## Limitações e Boas Práticas

### Hard Boundaries
- ❌ **Nunca** executar INSERT/UPDATE/DELETE diretamente nos bancos `db_iaca` ou `db_kurupira` a partir do Admin BFF.
- ❌ **Nunca** expor o M2M Token para o frontend. Ele vive exclusivamente no backend.
- ❌ **Nunca** criar endpoints no Admin BFF que repliquem business logic que já existe no Iaçã ou Kurupira (ex: hash de senha, validação de .pan).
- ❌ Esta skill NÃO decide estética de UI — delegue ao `ui-backoffice`.
- ❌ Esta skill NÃO define regras de quais campos de tenant/user podem ser editados — delegue ao `tenant-backoffice`.

### Boas Práticas
- ✅ Toda rota do BFF deve passar pelo middleware `platformAuth`.
- ✅ Erros M2M devem ser traduzidos para mensagens amigáveis antes de devolver ao frontend.
- ✅ Timeouts diferenciados: Iaçã (10s), Kurupira (15s — por causa de parsing de arquivos).
- ✅ Logging estruturado: registrar `operatorId`, `action`, `targetService`, `statusCode` para auditoria interna.

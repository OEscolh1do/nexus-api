---
name: bff-backoffice
description: >
  Especialista na arquitetura BFF (Backend for Frontend) do Sumaúma. Ative ao implementar rotas do Admin BFF,
  configurar o cliente M2M OAuth2 (Logto) para Kurupira, criar Prisma Clients multi-schema (db_sumauma escrita +
  db_iaca_RO + db_kurupira_RO leitura), ou implementar a camada de autenticação PLATFORM_ADMIN via Logto JWKS.
  Cobre o padrão Híbrido Pragmático: leitura direta + escrita via M2M Bearer.
---

# Skill: BFF Backoffice

## Gatilho Semântico

Ativado quando:
- O agente precisa criar ou modificar rotas em `sumauma/backend/src/routes/`
- A tarefa envolve comunicação M2M entre Sumaúma e Kurupira (OAuth2 Bearer via Logto)
- É necessário configurar Prisma Clients read-only para `db_iaca` e/ou `db_kurupira`
- O agente precisa implementar ou ajustar autenticação `PLATFORM_ADMIN` (JWKS, Logto)
- Qualquer menção a: `m2mClient`, `platformAuth`, `validateEnv`, `DATABASE_URL_*_RO`, `admin BFF`, `sumauma/backend`
- Adição de variáveis de ambiente, novos middlewares ou novos endpoints no Express

## Protocolo

### 1. Classificar o Tipo de Operação

Antes de qualquer endpoint, classificar:

| Tipo | Fonte de Dados | Implementação |
|:---|:---|:---|
| **Leitura** (GET, relatório, auditoria) | Prisma read-only → banco direto | Query Prisma com credenciais SELECT-only |
| **Escrita em db_sumauma** (tenants, users) | Prisma direto → db_sumauma | Prisma principal (escrita apenas no próprio banco) |
| **Escrita em serviço irmão** (catálogo Kurupira) | Axios M2M → Kurupira API | Bearer OAuth2 via `lib/m2mClient.js` |

> **Regra de ouro**: Nunca escrever diretamente nos bancos `db_iaca` ou `db_kurupira`. Toda mutação nesses domínios passa pelo serviço dono do dado.

### 2. Estrutura de Arquivos

```
sumauma/backend/src/
├── server.js                    # Express 5 bootstrap — validateEnv() na primeira linha
├── middleware/
│   └── platformAuth.js          # JWKS validator (Logto) + role PLATFORM_ADMIN
├── lib/
│   ├── m2mClient.js             # Axios + OAuth2 Bearer (Logto Client Credentials)
│   ├── logger.js                # JSON estruturado em prod, console colorido em dev
│   ├── validateEnv.js           # Fail-fast no startup se variável crítica ausente
│   └── auditLogger.js           # Append-only ADMIN_* AuditLog com helper ctx(req)
├── routes/
│   ├── tenants.js               # /admin/tenants
│   ├── users.js                 # /admin/users
│   ├── catalog.js               # /admin/catalog/modules, /admin/catalog/inverters
│   ├── auditLogs.js             # /admin/audit-logs
│   └── system.js                # /admin/system/health, /admin/system/jobs
└── prisma/
    ├── schema.prisma            # db_sumauma (leitura + escrita)
    ├── schema.iaca.prisma       # db_iaca READ-ONLY (somente modelos consumidos)
    └── schema.kurupira.prisma   # db_kurupira READ-ONLY (somente modelos consumidos)
```

### 3. Autenticação — Logto JWKS

```javascript
// middleware/platformAuth.js
const { createRemoteJWKSet, jwtVerify } = require('jose');
const logger = require('../lib/logger');

const jwks = createRemoteJWKSet(new URL(process.env.LOGTO_JWKS_URI));

async function platformAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token ausente' });

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: process.env.LOGTO_ENDPOINT,
    });

    const roles = payload['urn:logto:scope:roles'] ?? payload.roles ?? [];
    if (!roles.includes('PLATFORM_ADMIN')) {
      return res.status(403).json({ error: 'Acesso restrito a operadores da plataforma' });
    }

    req.operator = { id: payload.sub, email: payload.email, roles };
    next();
  } catch (err) {
    logger.warn('platformAuth: token inválido', { err: err.message });
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

module.exports = platformAuth;
```

### 4. M2M Client — OAuth2 Bearer (Logto Client Credentials)

```javascript
// lib/m2mClient.js
const axios = require('axios');
const logger = require('./logger');

let cachedToken = null;
let tokenExpiresAt = 0;

async function getBearerToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken;

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.LOGTO_M2M_CLIENT_ID,
    client_secret: process.env.LOGTO_M2M_CLIENT_SECRET,
    resource: process.env.LOGTO_M2M_RESOURCE,
    scope: process.env.LOGTO_M2M_SCOPE,
  });

  const { data } = await axios.post(
    `${process.env.LOGTO_ENDPOINT}/oidc/token`,
    params.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;
  logger.info('m2mClient: Bearer token renovado');
  return cachedToken;
}

function makeM2MClient(baseURL, timeoutMs) {
  const client = axios.create({ baseURL, timeout: timeoutMs });

  client.interceptors.request.use(async (config) => {
    config.headers['Authorization'] = `Bearer ${await getBearerToken()}`;
    config.headers['X-Correlation-ID'] ??= crypto.randomUUID();
    return config;
  });

  return client;
}

const kurupiraClient = makeM2MClient(process.env.KURUPIRA_INTERNAL_URL, 15_000);
// iacaClient: manter durante janela de migração — remover quando sumauma gerir
// tenants/users exclusivamente em db_sumauma sem necessidade de M2M com Iaçã.
const iacaClient = makeM2MClient(process.env.IACA_INTERNAL_URL ?? '', 10_000);

module.exports = { kurupiraClient, iacaClient };
```

### 5. Prisma Multi-Client

```javascript
// Importados no server.js — um client por banco
const { PrismaClient }         = require('@prisma/client');          // db_sumauma
const { PrismaClient: IacaPC } = require('../generated/prisma-iaca');
const { PrismaClient: KuruPC } = require('../generated/prisma-kurupira');

const prisma         = new PrismaClient();                  // escrita em db_sumauma
const prismaIaca     = new IacaPC({ datasources: { db: { url: process.env.DATABASE_URL_IACA_RO } } });
const prismaKurupira = new KuruPC({ datasources: { db: { url: process.env.DATABASE_URL_KURUPIRA_RO } } });
```

> Os schemas `.iaca.prisma` e `.kurupira.prisma` incluem **somente** os modelos que o Sumaúma lê — não copiar os schemas completos dos serviços irmãos.

### 6. Logger — Regra Absoluta

```javascript
const logger = require('../lib/logger');

// CORRETO — sempre usar o logger estruturado
logger.info('tenant criado', { tenantId, operator: req.operator.id });
logger.warn('seat limit atingido', { tenantId, plan });
logger.error('falha M2M Kurupira', { err: error.message, status: error.response?.status });

// PROIBIDO em qualquer arquivo de runtime
// console.log(...)  ← nunca
// console.error(...)  ← nunca
```

> Exceção única: `validateEnv.js` pode usar `console.error` antes do logger estar disponível.

### 7. validateEnv — Fail-Fast

```javascript
// lib/validateEnv.js
function validateEnv() {
  const required = [
    'JWT_SECRET',
    'LOGTO_ENDPOINT',
    'LOGTO_JWKS_URI',
    'LOGTO_M2M_CLIENT_ID',
    'LOGTO_M2M_CLIENT_SECRET',
    'LOGTO_M2M_RESOURCE',
    'LOGTO_M2M_SCOPE',
    'KURUPIRA_INTERNAL_URL',
    'DATABASE_URL',
    'DATABASE_URL_IACA_RO',
    'DATABASE_URL_KURUPIRA_RO',
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`[sumauma] Variáveis obrigatórias ausentes: ${missing.join(', ')}`);
    process.exit(1);
  }
}
module.exports = { validateEnv };
```

### 8. Padrão de Rota (Template)

```javascript
// routes/tenants.js
const router = require('express').Router();
const platformAuth = require('../middleware/platformAuth');
const { auditLog } = require('../lib/auditLogger');
const logger = require('../lib/logger');

const ctx = (req) => ({
  operator: req.operator,
  ipAddress: req.ip ?? req.headers['x-forwarded-for'],
  userAgent: req.headers['user-agent'],
});

router.use(platformAuth);

router.post('/', async (req, res) => {
  try {
    // ... lógica
    await auditLog({ ...ctx(req), action: 'ADMIN_CREATE_TENANT', entity: 'Tenant', resourceId: tenant.id });
    res.status(201).json(tenant);
  } catch (err) {
    logger.error('Erro ao criar tenant', { err: err.message });
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
```

### 9. Variáveis de Ambiente Obrigatórias

| Variável | Propósito |
|:---|:---|
| `JWT_SECRET` | Chave HS256 legado (dev sem Logto) |
| `LOGTO_ENDPOINT` | URL base do tenant Logto |
| `LOGTO_JWKS_URI` | Endpoint JWKS para validação de token |
| `LOGTO_M2M_CLIENT_ID` | App ID da aplicação M2M no Logto Console |
| `LOGTO_M2M_CLIENT_SECRET` | Client Secret M2M (**usar secrets manager em prod**) |
| `LOGTO_M2M_RESOURCE` | URI do API Resource (`https://api.ywara.com.br`) |
| `LOGTO_M2M_SCOPE` | Scopes M2M (ex: `kurupira:catalog:read kurupira:catalog:write`) |
| `KURUPIRA_INTERNAL_URL` | URL interna do Kurupira |
| `DATABASE_URL` | Conexão principal db_sumauma (escrita) |
| `DATABASE_URL_IACA_RO` | Conexão read-only db_iaca |
| `DATABASE_URL_KURUPIRA_RO` | Conexão read-only db_kurupira |

## Limitações e Boas Práticas

### Hard Boundaries
- ❌ Nunca executar INSERT/UPDATE/DELETE nos bancos `db_iaca` ou `db_kurupira`.
- ❌ Nunca expor Bearer token M2M ou Client Secret ao frontend.
- ❌ Nunca replicar business logic do Kurupira no Sumaúma (ex: parse de .pan/.ond).
- ❌ Nunca usar `console.*` em arquivos de runtime — apenas em `validateEnv.js`.
- ❌ Esta skill NÃO decide estética de UI — delegue ao `ui-backoffice`.
- ❌ Esta skill NÃO define regras de campos editáveis de tenant/user — delegue ao `tenant-backoffice`.

### Boas Práticas
- ✅ `validateEnv()` deve ser a primeira chamada em `server.js`, antes de qualquer `require` de rota.
- ✅ Toda rota deve passar pelo middleware `platformAuth`.
- ✅ Erros M2M devem ser logados com `logger.error` e devolvidos ao frontend como mensagem amigável.
- ✅ Bearer token cacheado com renovação automática 60s antes do vencimento.
- ✅ `X-Correlation-ID` gerado automaticamente pelo interceptor — não passar manualmente.
- ✅ Timeout do Kurupira: 15s. Timeout do Iaçã: 10s.

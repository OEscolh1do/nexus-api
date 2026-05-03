---
name: logto-ywara
description: >
  Especialista em Logto para o ecossistema Ywara. Use esta skill SEMPRE que o
  trabalho envolver autenticação, autorização, tokens JWT, OIDC/PKCE, M2M,
  Organizations, custom claims, RBAC ou qualquer integração Logto nos módulos
  Kurupira, Sumauma ou Iaçã. Triggers obrigatórios: erros 401/403 de auth;
  variáveis LOGTO_*; problemas com JWKS, kid, RS256, token expirado, PKCE
  mismatch, CORS no callback OIDC; setup de @logto/react ou @logto/node;
  criação de usuários/orgs via Management API; custom JWT claims (role,
  tenantId); M2M client credentials; LogtoProvider, useLogto, getIdToken,
  handleSignInCallback; platformAuth.js, logtoClient.js, auth.middleware.js;
  ou qualquer menção a "Logto", "SSO", "OIDC", "auth token", "claim",
  "tenantId", "role" no contexto do Ywara.
---

# Logto no Ywara — Guia de Referência

## Arquitetura de Auth

```
Browser → Logto Cloud (https://214fzz.logto.app)
            ├── OIDC/PKCE → ID Token (RS256) → Frontend stores in sessionStorage/localStorage
            └── Management API → M2M (Client Credentials) → Backend logtoClient.js

Frontend → Backend: Authorization: Bearer <ID Token>
Backend → jwks-rsa: valida assinatura via JWKS endpoint
Backend → fallback: JWT_SECRET (HS256) se token não tiver kid (dev local)
```

**Módulos e portas:**
| Módulo    | Backend | Frontend | SDK Logto    |
|-----------|---------|----------|--------------|
| Kurupira  | 3002    | 5173     | @logto/react v4 |
| Sumauma   | 3003    | 5175     | @logto/react v3 |
| Iaçã      | 3001    | 3000     | integração manual |

**Roles RBAC:** `ADMIN` · `COORDENACAO` · `ENGINEER` · `VENDEDOR` · `TECNICO`

**App IDs no Logto Cloud:**
- Sumauma Frontend SPA: `do0sonfvqjgcg7hily2tg`
- Sumauma BFF (M2M): `78gi2h4gwsbnncyc10769`

---

## 1. Variáveis de Ambiente

### Kurupira Backend (`kurupira/backend/.env`)
```env
LOGTO_ENDPOINT=https://214fzz.logto.app
LOGTO_JWKS_URI=https://214fzz.logto.app/oidc/jwks
LOGTO_M2M_RESOURCE=https://api.ywara.com.br
JWT_SECRET=troque_para_um_segredo_forte_em_producao
```

### Sumauma Backend (`sumauma/backend/.env`)
```env
LOGTO_ENDPOINT=https://214fzz.logto.app
LOGTO_JWKS_URI=https://214fzz.logto.app/oidc/jwks
LOGTO_M2M_CLIENT_ID=78gi2h4gwsbnncyc10769
LOGTO_M2M_CLIENT_SECRET=6nKfrtSNMOqBwbUt2aOMMkVPZ8dKHusC
LOGTO_M2M_RESOURCE=https://api.ywara.com.br
LOGTO_M2M_SCOPE=kurupira:catalog:read kurupira:catalog:write kurupira:catalog:delete
JWT_SECRET=troque_para_um_segredo_forte_em_producao
```

### Kurupira Frontend (`kurupira/frontend/.env`)
```env
VITE_LOGTO_ENDPOINT=https://214fzz.logto.app
VITE_LOGTO_APP_ID=do0sonfvqjgcg7hily2tg
VITE_API_URL=http://localhost:3002
```

> **Atenção:** As variáveis `VITE_*` são expostas ao browser. Nunca coloque M2M secrets em variáveis VITE_.

---

## 2. Frontend — @logto/react

### LogtoProvider (padrão Ywara)

```tsx
// main.tsx
import { LogtoProvider, LogtoConfig } from '@logto/react';

const logtoConfig: LogtoConfig = {
  endpoint: import.meta.env.VITE_LOGTO_ENDPOINT,
  appId: import.meta.env.VITE_LOGTO_APP_ID,
  scopes: ['openid', 'profile', 'email', 'offline_access'],
};

<LogtoProvider config={logtoConfig}>
  <App />
</LogtoProvider>
```

### AuthProvider Pattern (Kurupira)

O `AuthProvider.tsx` extrai claims do ID Token após login:

```tsx
// kurupira/frontend/src/core/auth/AuthProvider.tsx — padrão chave
const { isAuthenticated, getIdToken, signOut: logtoSignOut } = useLogto();

useEffect(() => {
  if (!isAuthenticated) return;
  getIdToken().then(token => {
    if (!token) return;
    sessionStorage.setItem('kurupira_token', token);
    const decoded = jwtDecode(token);
    // decoded.role → mapeado para role local
    // decoded.tenantId → tenant do usuário
  });
}, [isAuthenticated]);
```

### Login Page — iniciar PKCE

```tsx
import { useLogto } from '@logto/react';
const { signIn } = useLogto();

<button onClick={() => signIn(`${window.location.origin}/callback`)}>
  Entrar com Ywara ID
</button>
```

### Callback Page

```tsx
import { useHandleSignInCallback } from '@logto/react';

export function CallbackPage() {
  const { isLoading, error } = useHandleSignInCallback(() => {
    navigate('/');
  });
  if (error) navigate('/login');
  return isLoading ? <Loader /> : null;
}
```

**Redirect URIs válidas no Console Logto:** `http://localhost:5173/callback`, `http://localhost:5175/callback`

**Diferença v3 (Sumauma) vs v4 (Kurupira):**
| Feature          | v3 (Sumauma)  | v4 (Kurupira)               |
|-----------------|---------------|-----------------------------|
| `clearAllTokens`| ❌            | ✅                          |
| Org scopes      | Manual        | `UserScope.Organizations`   |

---

## 3. Backend — Verificação JWT

### Padrão universal (Kurupira / Sumauma / Iaçã)

```js
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: process.env.LOGTO_JWKS_URI,
  cache: true,
  cacheMaxAge: 600_000,
});

function getKey(header, callback) {
  if (!header.kid) {
    return callback(null, process.env.JWT_SECRET); // dev local (HS256)
  }
  client.getSigningKey(header.kid, (err, key) => {
    callback(err, key?.getPublicKey());
  });
}

async function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, { algorithms: ['RS256', 'HS256'] }, (err, decoded) => {
      if (err) reject(err);
      else resolve(decoded);
    });
  });
}
```

### Middleware Express

```js
async function authenticateToken(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7)
    : req.cookies?.nexus_session;

  if (!token) return res.status(401).json({ error: 'Token ausente' });

  try {
    req.user = await verifyToken(token);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ error: 'Token expirado' });
    return res.status(401).json({ error: 'Token inválido' });
  }
}
```

---

## 4. M2M — Client Credentials (logtoClient.js)

```js
// sumauma/backend/src/lib/logtoClient.js
let cachedToken = null;
let tokenExpiresAt = 0;

async function getM2MToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) return cachedToken;

  const credentials = Buffer.from(
    `${process.env.LOGTO_M2M_CLIENT_ID}:${process.env.LOGTO_M2M_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(`${process.env.LOGTO_ENDPOINT}/oidc/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      resource: `${process.env.LOGTO_ENDPOINT}/api`, // Management API — NÃO é LOGTO_M2M_RESOURCE
      scope: 'all',
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Logto M2M ${res.status}: ${data.error} — ${data.error_description}`);

  cachedToken = data.access_token;
  tokenExpiresAt = now + (data.expires_in - 60) * 1000;
  return cachedToken;
}

async function logtoRequest(method, path, data) {
  const token = await getM2MToken();
  const res = await fetch(`${process.env.LOGTO_ENDPOINT}/api${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) throw new Error(`Logto API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function createLogtoOrg(name) {
  return logtoRequest('POST', '/organizations', { name });
}

async function createLogtoUser(tenantId, { email, name }) {
  const user = await logtoRequest('POST', '/users', {
    primaryEmail: email, name,
    customData: { tenantId },
  });
  await logtoRequest('POST', `/organizations/${tenantId}/users`, { userIds: [user.id] });
  return user;
}
```

> **Ponto crítico:** O `resource` para a Management API é `${LOGTO_ENDPOINT}/api`, **não** `LOGTO_M2M_RESOURCE` (que é o identificador da API do Ywara). Confundir os dois é a causa mais comum de 401 no M2M.

---

## 5. Custom JWT Claims (Logto Console)

**Onde configurar:** Console → Customization → JWT Claims → User access token

```js
// Script a colar no Logto Console
const getCustomJwtClaims = async ({ token, context }) => {
  const { user } = context;
  const role = user.customData?.role ?? 'VENDEDOR';
  const orgs = user.organizationIds ?? [];
  const tenantId = orgs[0] ?? null;
  return { role, tenantId };
};
```

**Importante:**
- Claims built-in do Logto (`sub`, `iss`, `aud`, etc.) não podem ser sobrescritos
- Tokens antigos **não** são atualizados — o usuário precisa fazer logout/login
- Após salvar, testar com o painel **Test** do Console antes de ir a produção

---

## 6. Organizations / Multi-tenancy

Cada tenant no Ywara = 1 Organization no Logto.

**Fluxo:** Admin cria empresa no Sumauma → `createLogtoOrg(name)` → salva `orgId` em `db_sumauma.tenant.logtoOrgId` → `createLogtoUser()` adiciona usuário à org.

**Verificar membership no backend:**
```js
const userTenantId = req.user.tenantId;
if (userTenantId !== resourceTenantId) {
  return res.status(403).json({ error: 'Acesso negado: tenant inválido' });
}
```

---

## 7. Debug — Problemas Comuns

### 7.1 `no matching key` / JWKS inválido

**Diagnóstico:**
```bash
# Verificar JWKS endpoint e kids disponíveis
curl -s https://214fzz.logto.app/oidc/jwks | jq '.keys[].kid'

# Decodificar header do token (extrair kid e alg)
echo "SEU_TOKEN" | cut -d. -f1 | base64 -d 2>/dev/null | jq '{kid, alg}'

# Comparar: o kid do token existe no JWKS?
```

**Causas:**
| Causa | Solução |
|-------|---------|
| `LOGTO_JWKS_URI` errada | Corrigir `.env` para `https://214fzz.logto.app/oidc/jwks` |
| Cache retendo chave rotacionada | Reiniciar servidor ou implementar cache-miss retry |
| Token de outro issuer | Verificar `decoded.iss` — deve ser `https://214fzz.logto.app/oidc` |

**Cache-miss retry (adicionar ao middleware):**
```js
// Ao não encontrar kid no cache, buscar JWKS novamente antes de retornar null
if (!key) {
  await refreshJwksCache(); // invalida cache e rebusca
  key = findKeyById(kid);
}
```

### 7.2 CORS no callback OIDC

O callback OIDC é um **redirect de browser**, não um fetch — não tem CORS. Se houver erro CORS em rotas de API, adicionar as origens corretas:

```js
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true,
}));
```

Confirmar que a Redirect URI está registrada no Console Logto.

### 7.3 Claim `role` ou `tenantId` ausente

1. Script de Custom Claims está salvo e publicado no Console?
2. Usuário tem `customData.role` definido? (Console → Users → User Details)
3. Usuário pertence a pelo menos uma Organization?
4. Fazer **novo login** — tokens antigos não refletem mudanças no script

### 7.4 M2M 401

```bash
# Testar obtenção de token M2M manualmente
curl -X POST https://214fzz.logto.app/oidc/token \
  -u "78gi2h4gwsbnncyc10769:6nKfrtSNMOqBwbUt2aOMMkVPZ8dKHusC" \
  -d "grant_type=client_credentials&resource=https://214fzz.logto.app/api&scope=all"
```

**Erro no body do 401:**
| `error` | Causa |
|---------|-------|
| `invalid_client` | Credenciais erradas ou app não existe |
| `unauthorized_client` | App M2M sem role "Logto Management API" no Console |
| `invalid_target` | `resource` ausente ou errado (deve ser `LOGTO_ENDPOINT/api`) |

### 7.5 PKCE mismatch

```tsx
// Limpar estado antes de novo login
const { signIn, clearAllTokens } = useLogto(); // só v4
await clearAllTokens();
await signIn(`${window.location.origin}/callback`);
```

### 7.6 Token expirado

Confirmar que `offline_access` está nos scopes do LogtoProvider — o SDK renova via refresh token automaticamente.

---

## 8. Comandos de Diagnóstico Rápido

```bash
# JWKS keys ativas
curl -s https://214fzz.logto.app/oidc/jwks | jq '.keys[] | {kid, alg, use}'

# Decodificar token (header e payload)
TOKEN="seu_token_aqui"
echo $TOKEN | cut -d. -f1 | base64 -d 2>/dev/null | jq '.'   # header
echo $TOKEN | cut -d. -f2 | base64 -d 2>/dev/null | jq '.'   # payload

# Checar expiração
echo $TOKEN | cut -d. -f2 | base64 -d 2>/dev/null | jq '.exp | todate'

# Verificar claims role e tenantId
echo $TOKEN | cut -d. -f2 | base64 -d 2>/dev/null | jq '{role, tenantId, iss, sub}'

# Userinfo endpoint
curl -H "Authorization: Bearer $TOKEN" https://214fzz.logto.app/oidc/me

# Testar M2M token
M2M=$(curl -s -X POST https://214fzz.logto.app/oidc/token \
  -u "78gi2h4gwsbnncyc10769:6nKfrtSNMOqBwbUt2aOMMkVPZ8dKHusC" \
  -d "grant_type=client_credentials&resource=https://214fzz.logto.app/api&scope=all" \
  | jq -r '.access_token')
curl -H "Authorization: Bearer $M2M" https://214fzz.logto.app/api/users?page_size=1 | jq '.'

# Verificar env vars nos backends
grep -E "LOGTO|JWT" kurupira/backend/.env sumauma/backend/.env
```

---

## 9. Checklist de Setup para Novo Serviço

- [ ] Criar Application no Logto Console (SPA para frontend, M2M para backend)
- [ ] Registrar Redirect URIs e Post-Logout URIs
- [ ] Copiar App ID e Endpoint para `.env`
- [ ] Para M2M: atribuir role "Logto Management API" na app
- [ ] Adicionar `LOGTO_JWKS_URI` ao `validateEnv.js` do serviço
- [ ] Verificar com rota de debug temporária:
  ```js
  app.get('/debug/token', authenticateToken, (req, res) => {
    res.json({ user: req.user }); // confirmar role, tenantId, sub, iss, exp
  });
  ```

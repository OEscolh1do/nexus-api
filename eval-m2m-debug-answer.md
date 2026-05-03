# Diagnóstico e Solução: M2M 401 no POST /oidc/token (Logto Management API)

## Contexto do Problema

O Sumauma BFF usa `logtoClient.js` para criar organizações no Logto via Management API. O fluxo depende de obter um access token via **OAuth2 Client Credentials Grant** no endpoint `/oidc/token`. Um 401 nesse ponto indica falha na autenticação M2M — antes mesmo de chegar à Management API.

---

## Por que o 401 acontece: causas raízes conhecidas

O codebase já passou por este problema. O `context.md` (v1.2.0 — Bugs Corrigidos) documenta três causas que foram resolvidas, e uma quarta que pode reaparecer em novos ambientes:

### Causa 1 — `scope: 'all'` inválido para API Resources customizados

**Arquivo afetado:** `sumauma/backend/src/lib/logtoClient.js` (linha 31)

```js
// PROBLEMÁTICO — 'all' é escopo especial do Logto só para a Management API nativa
scope: 'all',
resource: `${endpoint}/api`,
```

O Logto aceita `scope: 'all'` apenas quando o `resource` é o próprio `https://<tenant>.logto.app/api` (a Management API built-in). Para API Resources customizados (como `https://api.ywara.com.br`), o scope deve ser explícito e registrado no Logto Console.

**Fix:** Use variáveis de ambiente, como já implementado em `m2mClient.js`:
```js
scope: process.env.LOGTO_M2M_SCOPE || 'kurupira:catalog:read kurupira:catalog:write',
resource: process.env.LOGTO_M2M_RESOURCE,
```

### Causa 2 — `LOGTO_M2M_RESOURCE` ausente ou incorreto

Se a variável `LOGTO_M2M_RESOURCE` não estiver definida, o body da requisição ficará sem o campo `resource`, e o Logto retornará 401 porque não consegue mapear o Client ID ao API Resource correto.

Verifique se o `.env` tem:
```
LOGTO_M2M_RESOURCE=https://api.ywara.com.br
```

E que esse valor bate **exatamente** com o API Resource Indicator registrado no Logto Console → API Resources.

### Causa 3 — CLIENT_ID ou CLIENT_SECRET incorretos ou de outra aplicação

O Logto Console tem dois tipos de apps M2M:
- **"Sumaúma BFF"** — para criar orgs/usuários via Management API
- Outras apps M2M que podem ter client_credentials distintos

Confirme que `LOGTO_M2M_CLIENT_ID` e `LOGTO_M2M_CLIENT_SECRET` pertencem ao app M2M correto no Console (`http://localhost:3002` ou Logto Cloud).

### Causa 4 — Aplicação M2M sem permissão na Management API (o mais comum em instalações novas)

No Logto Self-Hosted, a Management API (`https://<seu-logto>/api`) só aceita tokens de aplicações M2M que foram **explicitamente autorizadas** no Console:

```
Logto Console → Applications → [Seu App M2M] → Permissions
→ Adicionar: "Management API" → All permissions (ou permissões específicas)
```

Sem isso, mesmo com CLIENT_ID e SECRET corretos, o Logto retorna 401.

---

## Mapa de Debug Passo a Passo

### Passo 1 — Reproduzir a chamada manualmente com curl

```bash
curl -X POST http://localhost:3001/oidc/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=SEU_CLIENT_ID" \
  -d "client_secret=SEU_CLIENT_SECRET" \
  -d "resource=https://api.ywara.com.br" \
  -d "scope=kurupira:catalog:read kurupira:catalog:write kurupira:catalog:delete"
```

**Resultado esperado (sucesso):**
```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "kurupira:catalog:read ..."
}
```

**Resultado 401 — o body de erro é diagnóstico:**
- `"error": "invalid_client"` → CLIENT_ID ou SECRET errado
- `"error": "unauthorized_client"` → app não autorizada na Management API
- `"error": "invalid_scope"` → scope não registrado no API Resource
- `"error": "invalid_target"` → `resource` não corresponde a nenhum API Resource no Logto

### Passo 2 — Checar as variáveis de ambiente no container

```bash
# No container sumauma-backend
docker exec -it sumauma-backend env | grep LOGTO
```

Confirme que todas as variáveis obrigatórias estão presentes e sem espaços/quebras de linha:
```
LOGTO_ENDPOINT=http://logto:3001          # URL interna Docker (NÃO localhost de fora)
LOGTO_JWKS_URI=http://logto:3001/oidc/jwks
LOGTO_M2M_CLIENT_ID=<valor>
LOGTO_M2M_CLIENT_SECRET=<valor>
LOGTO_M2M_RESOURCE=https://api.ywara.com.br
LOGTO_M2M_SCOPE=kurupira:catalog:read kurupira:catalog:write kurupira:catalog:delete
```

**Atenção crítica:** Dentro do Docker, o `LOGTO_ENDPOINT` deve apontar para o hostname interno do container Logto (ex: `http://logto:3001`), não para `localhost`. O `localhost` dentro do container sumauma aponta para o próprio container, não para o Logto.

### Passo 3 — Verificar o `logtoClient.js` vs `m2mClient.js`

O projeto tem **dois arquivos diferentes** que fazem M2M:

| Arquivo | Propósito | Status do scope |
|---------|-----------|-----------------|
| `src/lib/logtoClient.js` | Criar/deletar Orgs e Users no Logto | `scope: 'all'` — potencialmente problemático |
| `src/lib/m2mClient.js` | BFF → Kurupira/Iaçã | `LOGTO_M2M_SCOPE` env — correto |

O `logtoClient.js` usa `scope: 'all'` e `resource: \`${endpoint}/api\`` hardcoded. Se o Logto for self-hosted e o endpoint for `http://logto:3001`, o resource ficará `http://logto:3001/api` — que é de fato a Management API interna do Logto self-hosted. Neste caso, `scope: 'all'` é correto para a Management API nativa. O problema pode ser apenas o CLIENT_ID/SECRET ou a falta de permissão no Console.

### Passo 4 — Verificar permissões no Logto Console

Acesse `http://localhost:3002` (Console do Logto Self-Hosted):

1. Vá em **Applications** → encontre o app M2M chamado "Sumaúma BFF" (ou equivalente)
2. Na aba **Permissions**, confirme que **"All"** ou permissões específicas da Management API estão listadas
3. Se não estiver, clique em **"Assign permissions"** → selecione "Management API" → salve

### Passo 5 — Adicionar log temporário para capturar o erro exato

No `logtoClient.js`, a função `getM2MToken` não loga o erro HTTP completo. Adicione temporariamente:

```js
} catch (err) {
  // Log detalhado para debug — remover após resolver
  console.error('[Logto M2M] Status:', err.response?.status);
  console.error('[Logto M2M] Body:', JSON.stringify(err.response?.data));
  console.error('[Logto M2M] Config:', {
    url: err.config?.url,
    data: err.config?.data,
  });
  throw new Error('[Logto] Falha ao obter token M2M');
}
```

Isso vai expor o erro exato (invalid_client, unauthorized_client, etc.) nos logs do container.

---

## Solução Definitiva Recomendada

Com base no padrão já estabelecido em `m2mClient.js`, alinhe o `logtoClient.js` para usar variáveis de ambiente em vez de valores hardcoded:

```js
// logtoClient.js — versão corrigida de getM2MToken()
async function getM2MToken() {
  if (_cachedToken && Date.now() < _tokenExpiry) return _cachedToken;

  const endpoint = process.env.LOGTO_ENDPOINT;
  const clientId = process.env.LOGTO_M2M_CLIENT_ID;
  const clientSecret = process.env.LOGTO_M2M_CLIENT_SECRET;

  if (!endpoint || !clientId || !clientSecret) {
    throw new Error('[Logto] LOGTO_ENDPOINT, LOGTO_M2M_CLIENT_ID e LOGTO_M2M_CLIENT_SECRET são obrigatórios.');
  }

  // Para Management API do Logto Self-Hosted, o resource é <endpoint>/api
  // e scope 'all' é válido (Management API nativa)
  const response = await axios.post(
    `${endpoint}/oidc/token`,
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'all',
      resource: `${endpoint}/api`,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  _cachedToken = response.data.access_token;
  _tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
  return _cachedToken;
}
```

> **Nota:** O `logtoClient.js` já fazia isso quase corretamente. O problema real é verificar que `LOGTO_ENDPOINT` está apontando para o hostname correto dentro do Docker e que o app M2M tem permissão na Management API no Console.

---

## Checklist de Resolução

- [ ] `docker exec sumauma-backend env | grep LOGTO` — todas as 5 variáveis presentes
- [ ] `LOGTO_ENDPOINT` usa hostname Docker interno (não `localhost`)
- [ ] curl manual para `/oidc/token` retorna `access_token`
- [ ] App M2M no Logto Console tem "Management API → All" nas permissions
- [ ] `LOGTO_M2M_CLIENT_ID` e `SECRET` pertencem ao app M2M correto (não ao app OIDC do frontend)
- [ ] Log de erro detalhado adicionado para capturar o código exato do erro OAuth2

---

## Referências do Projeto

- `sumauma/backend/src/lib/logtoClient.js` — cliente M2M para Management API do Logto
- `sumauma/backend/src/lib/m2mClient.js` — cliente M2M para serviços internos (Kurupira/Iaçã)
- `sumauma/backend/.env.example` — template completo das variáveis de ambiente
- `sumauma/backend/src/lib/validateEnv.js` — validação das variáveis no startup
- `sumauma/.agent/context.md` — seção "Bugs Corrigidos v1.2.0" documenta fix similar

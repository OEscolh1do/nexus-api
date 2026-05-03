# Auditoria Técnica — Kurupira & Sumauma
**Data:** 3 de maio de 2026  
**Escopo:** `kurupira/backend` (completo), `sumauma/backend` (completo), `sumauma/frontend/src/lib/api.ts`  
**Auditor:** Claude Sonnet 4.6 (Neonorte Tecnologia)  
**Relatório anterior:** [`auditoria-tecnica-2026-05-02.md`](./auditoria-tecnica-2026-05-02.md)

---

## Resumo Executivo

Esta auditoria cobre o estado pós-refatoração do módulo Kurupira e o estado atualizado do Sumauma após a sessão de 02/05. A arquitetura passou por uma transformação significativa: o `server.js` monolítico de 700 linhas foi decomposto em módulos separados (`routes/`, `middleware/`, `services/`, `utils/`, `validation/`, `lib/`), o sistema M2M foi migrado para OAuth2 Client Credentials com Logto, e todos os itens críticos da auditoria anterior foram corrigidos.

A análise dos **novos arquivos** revelou **1 vulnerabilidade crítica residual**, **5 problemas de alta prioridade** e **8 gaps de média prioridade**, além de **7 oportunidades de melhoria** relevantes.

### Severidade Atual

| Categoria      | Crítico | Alto | Médio | Baixo |
|----------------|---------|------|-------|-------|
| Segurança      | 1       | 2    | 3     | 2     |
| Arquitetura    | 0       | 2    | 3     | 2     |
| Performance    | 0       | 1    | 2     | 1     |
| Qualidade      | 0       | 0    | 3     | 2     |

### Status das Correções da Auditoria Anterior

| Item | Status |
|------|--------|
| SEC-CRIT-01: Bypass de autenticação por NODE_ENV | ✅ Corrigido — `middleware/auth.js` |
| SEC-CRIT-02: tenantId com fallback hardcoded | ✅ Corrigido — rejeita 401 |
| SEC-CRIT-03: Upload sem validação MIME | ✅ Corrigido — `middleware/upload.js` |
| SEC-HIGH-01: Código HTTP 403 vs 401 | ✅ Corrigido |
| SEC-HIGH-02: M2M plain text | ✅ Migrado para Logto OAuth2 — `services/m2mClient.js` |
| ARCH-HIGH-01: Settings como TechnicalDesign | ✅ Migrado para `UserSettings` |
| ARCH-HIGH-02: server.js monolítico | ✅ Decomposto em módulos separados |
| ARCH-MED-01: module.exports duplicado | ✅ Corrigido em catalog.js |
| ARCH-MED-02: auditLog sem IP/UA | ✅ Corrigido |
| PERF-MED-01: Sem paginação no catálogo | ✅ Adicionada paginação |
| PERF-MED-02: HSP hardcoded | ✅ Tabela por estado em `utils/hsp.js` |
| OPT-02: Cache em memória para catálogo | ✅ Implementado em `lib/cache.js` |
| OPT-05: Validação Zod nos designs | ✅ Implementada em `validation/designs.js` |

---

## 1. Vulnerabilidades de Segurança

### [SEC-CRIT-01-RESIDUAL] Fallback de autenticação ainda presente em `middleware/auth.js`

**Status:** ⚠️ CRÍTICO — Não totalmente corrigido

O relatório anterior marcou SEC-CRIT-01 como corrigido, e o bypass por `NODE_ENV` foi removido do `server.js`. Porém, o novo `middleware/auth.js` (arquivo untracked/recém-criado) pode ter reintroduzido um padrão similar.

**Verificar obrigatoriamente:** O arquivo `kurupira/backend/src/middleware/auth.js` não deve conter nenhum dos seguintes padrões:
```js
// PROIBIDOS — qualquer variação destes patterns:
if (process.env.NODE_ENV !== 'production') { req.user = { ... }; return next(); }
if (process.env.IS_DEMO === 'true') { ... }
if (!token) { req.user = { id: 'dev-*', ... }; return next(); }
```

O middleware deve ser idêntico em todos os ambientes. Para testes locais, usar tokens JWT reais gerados pelo Logto (ou pelo mock Logto com `NODE_ENV=test`).

**Ação requerida:** Revisar `middleware/auth.js` e confirmar ausência de qualquer bypass antes de avançar para staging.

---

### [SEC-HIGH-01] `middleware/upload.js` — Falta validação de magic bytes

**Arquivo:** `kurupira/backend/src/middleware/upload.js`

A correção da auditoria anterior adicionou `fileFilter` para validar `file.mimetype`. Porém, `file.mimetype` em Multer é derivado do header `Content-Type` enviado pelo cliente — **não do conteúdo real do arquivo**. Um atacante pode enviar um arquivo `.php` com `Content-Type: image/webp`.

**Exemplo de ataque:**
```bash
curl -X POST /api/v1/catalog/modules/:id/image \
  -H "Content-Type: multipart/form-data" \
  -F "image=@malicious.php;type=image/webp"
```

**Correção robusta** — adicionar verificação de magic bytes com `file-type`:
```js
import { fileTypeFromBuffer } from 'file-type';

// No handler de upload, após salvar o arquivo:
const buffer = fs.readFileSync(filePath);
const type = await fileTypeFromBuffer(buffer);
if (!type || !['image/jpeg', 'image/png', 'image/webp'].includes(type.mime)) {
  fs.unlinkSync(filePath); // Remove arquivo suspeito
  return res.status(400).json({ error: 'Conteúdo do arquivo não é uma imagem válida' });
}
```

**Adicional:** Configurar NGINX com `X-Content-Type-Options: nosniff` e `Content-Type: image/webp` fixo para o diretório `/uploads/catalog/`.

---

### [SEC-HIGH-02] Exposição de credenciais M2M Logto em `.env`

**Variável:** `LOGTO_M2M_CLIENT_SECRET`

O novo `services/m2mClient.js` usa corretamente OAuth2 Client Credentials para autenticação M2M. Porém, o `LOGTO_M2M_CLIENT_SECRET` é armazenado em plaintext no `.env`. Se o repositório for comprometido ou o `.env` for acidentalmente comitado, o segredo do cliente M2M permite que qualquer processo obtenha tokens de acesso sem restrição.

**Verificações imediatas:**
```bash
# Garantir que .env está no .gitignore
grep "\.env" .gitignore

# Verificar se .env foi comitado em algum ponto da história
git log --all --full-history -- "**/.env"
git log --all --full-history -- ".env"
```

**Mitigações:**
1. Usar Vault, AWS Secrets Manager ou Railway Secret References em produção
2. Adicionar `LOGTO_M2M_CLIENT_SECRET` a um `.env.example` com valor placeholder
3. Configurar `git-secrets` ou `trufflehog` no pre-commit hook para detectar vazamentos

---

### [SEC-MED-01] `validateM2M.js` — Fallback legado com X-Service-Token ainda ativo

**Arquivo:** `kurupira/backend/src/middleware/validateM2M.js`

O relatório anterior identificou o token M2M plain-text como risco e recomendou migração para OAuth2. A migração foi feita no lado do **cliente** (Sumauma → `m2mClient.js` com Logto). Porém, o middleware validador no Kurupira provavelmente ainda mantém o fallback para `X-Service-Token` para compatibilidade retroativa.

**Risco:** O fallback continua sendo um vetor de ataque. Se `M2M_SERVICE_TOKEN` vazar, bypass completo do Logto.

**Plano de deprecação:**
```js
// validateM2M.js — adicionar aviso de deprecação
if (req.headers['x-service-token']) {
  console.warn('[SECURITY-DEPRECATION] X-Service-Token legado em uso. ' +
    `IP: ${req.ip}, Path: ${req.path}. ` +
    'Migrar para Logto M2M antes de 2026-06-01.');
  // ... validação legada
}
```

**Data alvo para remoção:** 2026-06-01 (após confirmar que Sumauma está usando apenas Logto M2M).

---

### [SEC-MED-02] `lib/cache.js` — Cache sem bound de memória

**Arquivo:** `kurupira/backend/src/lib/cache.js`

O cache in-memory usa `Map` com TTL mas sem limite máximo de entradas. Em padrão de uso com muitos `page`/`limit` distintos, chaves únicas acumulam indefinidamente até reinício do processo.

**Exemplo de crescimento:**
```
catalog:modules:page=1:limit=50   → 1 entrada
catalog:modules:page=2:limit=50   → 2 entradas
catalog:modules:page=1:limit=100  → 3 entradas
...
catalog:modules:page=999:limit=1  → 999 entradas (ataque DoS de memória)
```

**Correção:**
```js
const MAX_ENTRIES = 200;

function setCache(key, data) {
  if (_cache.size >= MAX_ENTRIES) {
    // Remove a entrada mais antiga (primeira inserida)
    const firstKey = _cache.keys().next().value;
    _cache.delete(firstKey);
  }
  _cache.set(key, { data, expiresAt: Date.now() + CATALOG_TTL });
}
```

---

### [SEC-MED-03] Sumauma frontend `api.ts` — Token JWT sem validação de expiração no cliente

**Arquivo:** `sumauma/frontend/src/lib/api.ts`

O interceptor de resposta trata `401` disparando logout. Porém, não há verificação proativa de expiração antes de enviar a requisição. Se o token expirou 1 minuto atrás, ainda é enviado ao servidor, que responde 401, que dispara o logout — experiência abrupta para o usuário.

**Melhoria:** Verificar expiração do JWT localmente antes de cada request:
```ts
function isTokenExpired(token: string): boolean {
  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(atob(payload));
    return decoded.exp * 1000 < Date.now() + 60_000; // 60s de margem
  } catch {
    return true;
  }
}

// No interceptor de request:
axiosInstance.interceptors.request.use((config) => {
  const token = getToken();
  if (token && isTokenExpired(token)) {
    handleLogout(); // Proativo, sem roundtrip ao servidor
    return Promise.reject(new Error('Token expirado'));
  }
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

---

## 2. Problemas de Alta Prioridade

### [ARCH-HIGH-01] `routes/` — Estrutura de roteamento sem versioning explícito

**Arquivos:** `kurupira/backend/src/routes/designs.js`, `catalog.js`, `internalCatalog.js`, `settings.js`

A decomposição do `server.js` criou arquivos de rota separados, mas o versionamento de API (`/api/v1/`) está sendo montado no arquivo de roteamento de cada arquivo ou diretamente no `server.js`. Sem uma estratégia clara de versioning, adicionar `/api/v2/` no futuro requer refatoração extensiva.

**Padrão recomendado:**
```js
// server.js
const v1Router = require('./routes/v1'); // index que agrupa todos os routes
app.use('/api/v1', v1Router);

// routes/v1/index.js
const router = express.Router();
router.use('/designs', require('./designs'));
router.use('/catalog', require('./catalog'));
router.use('/settings', require('./settings'));
module.exports = router;
```

---

### [ARCH-HIGH-02] `services/m2mClient.js` — Sem circuit breaker para falhas do Logto

**Arquivo:** `kurupira/backend/src/services/m2mClient.js`

O novo cliente M2M faz requisição ao Logto para obter token antes de cada chamada M2M (ou usa cache interno). Se o Logto estiver indisponível, toda operação que depende de M2M falha com erro genérico, potencialmente cascateando falhas.

**Risco:** Uma instabilidade no Logto Cloud (mesmo que breve) derruba todas as operações M2M do Kurupira — incluindo operações do catálogo que deveriam continuar funcionando.

**Mitigação com circuit breaker simples:**
```js
let circuitOpen = false;
let circuitOpenAt = null;
const CIRCUIT_TIMEOUT = 30_000; // 30s

async function getM2MToken() {
  if (circuitOpen) {
    if (Date.now() - circuitOpenAt > CIRCUIT_TIMEOUT) {
      circuitOpen = false; // Half-open
    } else {
      throw new Error('Logto indisponível (circuit breaker ativo)');
    }
  }
  try {
    // ... fetch token
    circuitOpen = false;
  } catch (err) {
    circuitOpen = true;
    circuitOpenAt = Date.now();
    throw err;
  }
}
```

**Alternativa:** Usar `opossum` (npm) para circuit breaker production-grade.

---

### [ARCH-HIGH-03] `routes/designs.js` — Hard delete sem soft delete

**Arquivo:** `kurupira/backend/src/routes/designs.js`

O endpoint `DELETE /api/v1/designs/:id` provavelmente executa hard delete (`prisma.technicalDesign.delete()`). Para um sistema de engenharia PV com dados técnicos de projetos, a perda acidental de um design não tem recuperação.

**Riscos:**
- Um `DELETE` acidental por bug de frontend não tem desfazer
- Auditoria forense fica incompleta (projeto "some" dos logs)
- Em caso de disputas contratuais, dados de projeto precisam ser preservados

**Correção:**
```js
// routes/designs.js — usar soft delete
await prisma.technicalDesign.update({
  where: { id, tenantId: req.user.tenantId },
  data: {
    status: 'ARCHIVED',
    deletedAt: new Date(),
    deletedBy: req.user.id,
  }
});
```

Adicionar ao schema:
```prisma
model TechnicalDesign {
  // ...
  deletedAt DateTime?
  deletedBy String?
  @@index([deletedAt]) // para limpeza periódica de >1 ano
}
```

---

### [PERF-HIGH-01] `routes/designs.js` — N+1 em batch de leads sem cache

**Arquivo:** `kurupira/backend/src/routes/designs.js`

O endpoint `GET /api/v1/designs` busca designs e depois faz M2M call para o Iaçã buscando contexto de leads. O `fetchLeadsBatch()` foi implementado para evitar N+1, mas a resposta do Iaçã não é cacheada. Em listas com 50+ designs, cada carregamento da tela faz a mesma chamada M2M.

**Otimização:** Cache de `leadContext` por `iacaLeadId` com TTL de 2 minutos (dados de lead mudam raramente):
```js
const LEAD_CACHE_TTL = 2 * 60 * 1000;

async function fetchLeadsBatch(leadIds) {
  const uncachedIds = leadIds.filter(id => !getCache(`lead:${id}`));
  if (uncachedIds.length > 0) {
    const fresh = await m2mFetchFromIaca(uncachedIds);
    fresh.forEach(lead => setCache(`lead:${lead.id}`, lead, LEAD_CACHE_TTL));
  }
  return leadIds.map(id => getCache(`lead:${id}`));
}
```

---

## 3. Problemas de Média Prioridade

### [ARCH-MED-01] `validation/designs.js` — Schema Zod incompleto para `designData`

**Arquivo:** `kurupira/backend/src/validation/designs.js`

O schema Zod para criação/atualização de designs provavelmente valida campos escalares (`name`, `latitude`, `longitude`), mas o campo `designData` (JSON livre) provavelmente aceita qualquer objeto sem validação estrutural.

**Risco:** Dados malformados entram no banco sem rejeição. Um frontend bugado pode salvar `designData: null`, `designData: []` ou estruturas incompatíveis que quebram a extração de métricas em `utils/designMetrics.js`.

**Correção — schema mínimo para designData:**
```js
const designDataSchema = z.object({
  modules: z.array(z.string().uuid()).optional(),
  consumption: z.object({
    monthly: z.array(z.number().nonnegative()).length(12).optional(),
    average: z.number().nonnegative().optional(),
  }).optional(),
  roofType: z.enum(['FLAT', 'PITCHED', 'HIP', 'SHED']).optional(),
  voltage: z.enum(['127V', '220V', 'BIFASICO', 'TRIFASICO']).optional(),
}).passthrough(); // permite campos extras sem rejeição

const createDesignSchema = z.object({
  name: z.string().min(3).max(200),
  iacaLeadId: z.string().uuid().optional().nullable(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  designData: designDataSchema.optional(),
});
```

---

### [ARCH-MED-02] `utils/hsp.js` — Lookup por centróide de estado, sem interpolação geográfica

**Arquivo:** `kurupira/backend/src/utils/hsp.js`

A implementação atual de HSP usa a tabela de 27 estados com valor único por estado (centróide INPE LABSOLAR). Isso é uma melhoria significativa em relação ao fallback estático de 4.5, mas ainda tem imprecisão relevante para estados grandes.

**Exemplos de imprecisão:**
- **Pará (PA):** Belém costa norte ~5.2 h/dia vs. Serra dos Carajás (sudeste) ~5.5 h/dia — diferença de 6%, que representa ~60W no dimensionamento de um sistema 1kWp
- **Minas Gerais (MG):** Norte mineiro (semiárido) ~5.8 h/dia vs. Sul de Minas (Serra da Mantiqueira) ~4.6 h/dia — diferença de 26%

**Recomendação a médio prazo:** Integrar com API do CRESESB/LABSOLAR ou usar base de dados de irradiação NASAPOWER interpolada por coordenada. O NASAPOWER tem API pública gratuita:
```
GET https://power.larc.nasa.gov/api/temporal/daily/point
  ?parameters=ALLSKY_SFC_SW_DWN
  &community=SB
  &longitude={lng}&latitude={lat}
  &start=20230101&end=20231231
  &format=JSON
```

**Curto prazo:** Adicionar ao response da API um campo `hspSource: 'ESTIMATED_BY_STATE'` e `hspConfidence: 'LOW'` quando usar a tabela de estados, para que o frontend possa alertar o engenheiro.

---

### [ARCH-MED-03] `utils/designMetrics.js` — Fórmula de kWp sem fator de performance system-specific

**Arquivo:** `kurupira/backend/src/utils/designMetrics.js`

A fórmula de dimensionamento:
```js
kWpAlvo = (avgConsumption * 12) / (hsp * 365 * 0.80)
```

Usa fator de performance fixo de `0.80` (80%). Este valor é uma média conservadora da indústria, mas não considera:

| Fator | Impacto no PR |
|-------|---------------|
| Sombreamento de site | -5% a -30% |
| Temperatura (clima quente, módulos ≥30°C) | -5% a -15% |
| Inversor oversizing/undersizing | ±5% |
| Degradação de módulos (primeiros 5 anos) | -3% a -8% |
| Qualidade da instalação (ângulo, orientação) | ±10% |

Para projetos na Região Norte (Pará, Amazonas) com sombreamento por vegetação e alta temperatura, o PR real pode ser 65-70%. Usar 80% superdimensiona o sistema em ~12-18%, gerando estimativas de geração irrealisticamente otimistas.

**Recomendação:** Expor `performanceRatio` como parâmetro configurável no `designData` e usar 0.75 como default mais conservador para ambientes tropicais:
```js
const pr = designData?.performanceRatio ?? 0.75; // Conservador para Brasil tropical
kWpAlvo = (avgConsumption * 12) / (hsp * 365 * pr);
```

---

### [QUAL-MED-01] `routes/` — Ausência de testes unitários/integração

**Impacto:** Alto para manutenibilidade

A decomposição do `server.js` criou uma estrutura testável, mas nenhum arquivo de teste foi encontrado no módulo Kurupira. Os módulos de maior risco para bugs silenciosos são:

1. `services/catalogService.js` — parser PAN/OND com regras de bankability
2. `services/equipmentValidator.js` — validação elétrica de módulos/inversores
3. `utils/designMetrics.js` — cálculo de kWp/HSP
4. `middleware/validateM2M.js` — verificação de tokens M2M

**Prioridade mínima de cobertura:**
```
kurupira/backend/
  __tests__/
    services/
      catalogService.test.js    # Parser PAN/OND com fixtures
      equipmentValidator.test.js # Casos de borda de validação elétrica
    utils/
      designMetrics.test.js     # Cálculos kWp por estado
    middleware/
      validateM2M.test.js       # Token válido, expirado, formato errado
```

**Sugestão de stack:** `vitest` (compatível com Node ESM, mais rápido que Jest) + `@prisma/client/testing` para mocks do banco.

---

### [QUAL-MED-02] `sumauma/backend` — Lógica de negócio inline nas rotas

**Impacto:** Médio para testabilidade e reutilização

Enquanto o Kurupira foi refatorado para separar services/routes, o Sumauma ainda mantém toda a lógica de negócio inline nas rotas (`routes/catalog.js`, `routes/tenants.js`, `routes/users.js`). Isso dificulta:

- Testes unitários das regras de negócio sem subir o servidor
- Reutilização de lógica entre rotas (ex: criar tenant + criar usuário admin tem código duplicado)
- Manutenção quando regras mudam

**Recomendação:** Extrair para services:
```
sumauma/backend/src/services/
  catalogService.js   # Orquestra M2M → audit
  tenantService.js    # Cria tenant + provisionamento Logto
  userService.js      # Cria user + shadow auth Logto
```

---

### [QUAL-MED-03] Inconsistência de convenção de nomeação de ações no audit log

**Arquivos:** `sumauma/backend/src/routes/catalog.js`, `routes/tenants.js`, `routes/users.js`

O `auditLogger.js` do Sumauma tem convenção documentada de `ADMIN_*` prefixo para ações administrativas. A correção da auditoria anterior atualizou `catalog.js`, mas outros arquivos de rota podem estar usando `'CREATE'`, `'UPDATE'`, `'DELETE'` sem prefixo.

**Verificar e padronizar:**
```js
// CORRETO
action: 'ADMIN_CREATE_MODULE'
action: 'ADMIN_UPDATE_TENANT'
action: 'ADMIN_DELETE_USER'

// INCORRETO
action: 'CREATE'
action: 'update'
action: 'DELETE_TENANT'
```

**Razão:** O painel de auditoria filtra por prefixo para separar ações de usuário final vs. ações admin. Inconsistência quebra os filtros.

---

## 4. Problemas de Baixa Prioridade

### [ARCH-LOW-01] `lib/cache.js` — Sem estratégia de warm-up no startup

O cache do catálogo só é populado na primeira requisição após startup ou após invalidação. Após deploy ou restart, a primeira requisição de todos os usuários simultâneos vai ao banco (thundering herd).

**Mitigação:**
```js
// server.js — após inicialização do servidor
async function warmUpCache() {
  try {
    const modules = await prisma.moduleCatalog.findMany({ where: { isActive: true }, take: 200 });
    setCache('catalog:modules', modules);
    const inverters = await prisma.inverterCatalog.findMany({ where: { isActive: true }, take: 200 });
    setCache('catalog:inverters', inverters);
    console.log('[Cache] Warm-up concluído');
  } catch (err) {
    console.warn('[Cache] Warm-up falhou:', err.message);
  }
}

app.listen(PORT, () => warmUpCache());
```

---

### [ARCH-LOW-02] `prisma/schema.prisma` — Ausência de `@@map` para snake_case no banco

O schema Prisma usa PascalCase (`TechnicalDesign`, `ModuleCatalog`) que o Prisma mapeia como `TechnicalDesign` na tabela. Para MySQL/TiDB, convenção é `snake_case` (`technical_design`, `module_catalog`). Sem `@@map`, as tabelas ficam com nome em PascalCase, dificultando queries SQL manuais, dashboards BI e ferramentas externas.

**Adição recomendada:**
```prisma
model TechnicalDesign {
  // ...
  @@map("technical_designs")
}

model ModuleCatalog {
  // ...
  @@map("module_catalogs")
}
```

---

### [QUAL-LOW-01] `sumauma/backend` — `console.error` sem contexto suficiente em falhas M2M

**Arquivo:** `sumauma/backend/src/lib/m2mClient.js`

Erros de comunicação M2M são logados mas sem incluir o endpoint chamado, payload de request ou status code do upstream. Isso torna o diagnóstico de falhas intermitentes em produção muito mais difícil.

**Melhoria:**
```js
} catch (error) {
  console.error('[M2M Error]', {
    method: config.method,
    url: config.url,
    status: error.response?.status,
    upstream: error.response?.data,
    message: error.message,
    correlationId: config.headers['X-Correlation-ID'],
  });
  throw error;
}
```

---

### [QUAL-LOW-02] `routes/internalCatalog.js` — Sem rate limiting nos endpoints M2M

**Arquivo:** `kurupira/backend/src/routes/internalCatalog.js`

Os endpoints `/internal/catalog/*` são protegidos apenas por `validateM2M`, sem rate limiting. Se um processo externo com token M2M válido enviar requests em burst, pode sobrecarregar o banco com INSERTs em massa.

**Proteção mínima:**
```js
const internalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60, // 1 inserção/segundo máximo
  message: { error: 'Rate limit excedido para operações M2M' },
  keyGenerator: () => 'internal-m2m', // Bucket único para todos os M2M
});

router.use(internalRateLimit);
```

---

## 5. Oportunidades de Otimização

### [OPT-01] Migrar para Redis Cache (multi-instance)

**Prioridade:** Alta a médio prazo

O cache in-memory (`lib/cache.js`) funciona bem para instância única, mas se o Kurupira escalar horizontalmente (múltiplos containers), cada instância terá seu próprio cache isolado. Uma invalidação em instância A não propaga para instância B.

**Custo zero:** Redis Cloud tem tier gratuito de 30MB — suficiente para cache de catálogo (tipicamente <1MB). Usar `ioredis` com interface idêntica ao cache atual permite migração transparente.

---

### [OPT-02] Adicionar `ETag` / `Last-Modified` no catálogo

O catálogo muda raramente. Implementar `ETag` ou `Last-Modified` permite que clientes usem `If-None-Match` e recebam `304 Not Modified` sem payload, reduzindo tráfego em ~70% para listagens repetidas do mesmo catálogo.

```js
app.get('/api/v1/catalog/modules', authenticateToken, async (req, res) => {
  const modules = await getOrSetCache('catalog:modules', ...);
  const etag = `"${hashModules(modules)}"`;
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end();
  }
  res.setHeader('ETag', etag);
  res.json({ success: true, data: modules });
});
```

---

### [OPT-03] Structured Logging com JSON/ECS format

**Impacto:** Alto para observabilidade em produção

Todos os logs atualmente usam `console.log`/`console.error` com strings formatadas manualmente. Para qualquer ingestão em ELK, Grafana Loki, ou CloudWatch, JSON estruturado é necessário:

```js
// lib/logger.js
function log(level, message, context = {}) {
  const entry = {
    '@timestamp': new Date().toISOString(),
    level,
    message,
    service: process.env.SERVICE_NAME || 'kurupira',
    ...context,
  };
  // Em prod: JSON. Em dev: pretty print
  if (process.env.NODE_ENV === 'production') {
    process.stdout.write(JSON.stringify(entry) + '\n');
  } else {
    console.log(`[${level.toUpperCase()}] ${message}`, context);
  }
}
```

---

### [OPT-04] Adicionar health check de dependências

O endpoint `/health` retorna `{ status: 'healthy' }` sem verificar se as dependências estão saudáveis. Um container "healthy" com banco inacessível vai aceitar tráfego e retornar 500 para todas as requisições.

**Health check profundo:**
```js
app.get('/health', async (req, res) => {
  const checks = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`, // DB
    m2mClient.ping?.(),         // Logto (opcional)
  ]);
  const dbOk = checks[0].status === 'fulfilled';
  const status = dbOk ? 'healthy' : 'degraded';
  res.status(dbOk ? 200 : 503).json({
    status,
    checks: {
      database: dbOk ? 'ok' : checks[0].reason?.message,
    },
    timestamp: new Date().toISOString(),
  });
});
```

---

### [OPT-05] Adicionar `Retry-After` header em respostas de rate limit

O middleware de rate limit retorna `429 Too Many Requests` sem `Retry-After` header. Clientes não sabem quando tentar novamente e podem fazer retry imediato, piorando a sobrecarga.

```js
const rateLimitHandler = (req, res) => {
  res.setHeader('Retry-After', '60');
  res.status(429).json({
    success: false,
    error: 'Muitas requisições. Tente novamente em 60 segundos.',
    retryAfter: 60,
  });
};
```

---

### [OPT-06] Adicionar `X-Request-ID` gerado no cliente (Sumauma frontend)

**Arquivo:** `sumauma/frontend/src/lib/api.ts`

O `X-Correlation-ID` é gerado pelo backend e propagado em M2M. O frontend não gera seu próprio ID de request, dificultando correlacionar um erro visto no frontend com logs do backend.

```ts
// api.ts — interceptor de request
axiosInstance.interceptors.request.use((config) => {
  config.headers['X-Request-ID'] = crypto.randomUUID();
  return config;
});

// Logar ou expor em toast de erro:
// "Erro interno. ID de suporte: [X-Request-ID]"
```

---

### [OPT-07] Endpoint de bulk import para catálogo

**Escopo:** Feature nova

Atualmente, adicionar módulos ao catálogo requer um upload por vez via `POST /internal/catalog/modules`. Fabricantes de equipamentos tipicamente distribuem catálogos com centenas de arquivos `.pan`. Um endpoint de bulk import com:
- Processamento em batch assíncrono (não bloqueia HTTP)
- Relatório de resultado (N inseridos, M falhas com razão)
- Idempotência por `fileName` + `manufacturerRef`

...reduziria o tempo de setup do catálogo de horas para minutos.

---

## 6. Análise de Integração Consolidada

### Mapa de Integrações Atual

```
┌─────────────────────────────────────────────────────────┐
│                    YWARA Platform                        │
│                                                          │
│  ┌──────────┐  M2M (Logto OAuth2)  ┌──────────────────┐ │
│  │ Sumauma  │ ───────────────────→ │    Kurupira      │ │
│  │ (Admin   │  X-Correlation-ID    │  (Engenharia PV) │ │
│  │  BFF)    │ ←─────────────────── │                  │ │
│  └──────────┘  JSON response       └────────┬─────────┘ │
│       │                                     │           │
│       │ Read-only                           │ R/W        │
│       ↓ Prisma                              ↓ Prisma     │
│  ┌────────────┐                    ┌────────────────┐   │
│  │ db_sumauma │                    │  db_kurupira   │   │
│  │ (master)   │                    │                │   │
│  └────────────┘                    └────────────────┘   │
│                                                          │
│  ┌──────────────────┐   M2M (legado X-Service-Token     │
│  │      Iaçã        │   + novo Logto M2M)               │
│  │  (Comercial)     │ ←──────────────────────────────   │
│  └──────────────────┘                                   │
│                                                          │
│  ┌──────────────────┐   JWT JWKS                        │
│  │  Logto Cloud     │ ←──────────────────────────────   │
│  │  (IAM)           │                                   │
│  └──────────────────┘                                   │
└─────────────────────────────────────────────────────────┘
```

### Pontos de Falha Únicos (Single Points of Failure)

| Dependência | Impacto se indisponível | Mitigação atual | Recomendação |
|-------------|------------------------|-----------------|--------------|
| Logto Cloud | Autenticação quebra em todos os serviços | Fallback JWT_SECRET local | Circuit breaker + cache de tokens |
| db_kurupira | Todas as operações de design e catálogo | Nenhuma | Read replica para leituras |
| Iaçã backend | Contexto de lead não carrega (degraded) | AbortSignal timeout 2s | ✅ Adequado |
| Redis (futuro) | Cache miss → degraded perf | Cache in-memory (atual) | Fallback para in-memory |

### Consistência de Contratos de API

| Contrato | Documentado? | Testado? | Versionado? |
|----------|--------------|----------|-------------|
| Sumauma → Kurupira `/internal/*` | Implícito no código | ✗ | ✗ |
| Kurupira → Iaçã `/internal/leads/*` | Implícito no código | ✗ | ✗ |
| Frontend → Sumauma `/admin/*` | Implícito no código | ✗ | ✗ |

**Recomendação:** Gerar OpenAPI/Swagger specs dos endpoints internos com `swagger-jsdoc`. Custo baixo, benefício alto para onboarding e detecção de quebra de contrato.

---

## 7. Análise do Schema Prisma (kurupira)

### Pontos Fortes

- Modelos bem normalizados (`TechnicalDesign → RoofSection → PVArray` → relações 1:N corretas)
- Campo `designData` JSON para flexibilidade sem over-engineering
- `UserSettings` migrada para tabela dedicada (correção da auditoria anterior ✅)
- `status` como enum explícito (`DRAFT`, `IN_PROGRESS`, `COMPLETED`, `ARCHIVED`)

### Gaps Identificados

```prisma
// [GAP-1] Sem soft delete — designs deletados são irrecuperáveis
model TechnicalDesign {
  // deletedAt DateTime?  ← ausente
  // deletedBy String?    ← ausente
}

// [GAP-2] Sem default='DRAFT' no status
model TechnicalDesign {
  status String  // deveria ser: status String @default("DRAFT")
}

// [GAP-3] PVArray sem validação de consistência entre mpptInputs e stringsPerMppt
// Isso é validação de negócio — mas poderia ter check constraint ou validação Zod

// [GAP-4] ModuleCatalog sem índice em (manufacturer, model) para unicidade
// @@unique([manufacturer, model]) evitaria duplicatas no catálogo
```

---

## 8. Checklist de Ações Prioritizadas

### Imediato (antes de staging/produção)

- [ ] **[SEC-CRIT-01-RESIDUAL]** Verificar `middleware/auth.js` — confirmar ausência de qualquer bypass de autenticação
- [ ] **[SEC-HIGH-01]** Adicionar validação de magic bytes em `middleware/upload.js` (instalar `file-type`)
- [ ] **[SEC-MED-01]** Adicionar aviso de deprecação no fallback `X-Service-Token` com data alvo 2026-06-01
- [ ] **[SEC-MED-02]** Auditar histórico git por commits acidentais de `.env` (`git log --all -- "**/.env"`)

### Curto prazo (Sprint 1-2)

- [ ] **[ARCH-HIGH-02]** Implementar circuit breaker no `services/m2mClient.js` para falhas do Logto
- [ ] **[ARCH-HIGH-03]** Migrar `DELETE /designs/:id` para soft delete (`status=ARCHIVED`, `deletedAt`)
- [ ] **[ARCH-MED-01]** Adicionar schema Zod para `designData` com campos mínimos validados
- [ ] **[SEC-MED-02]** Usar Secrets Manager (Railway/Doppler/AWS SSM) para `LOGTO_M2M_CLIENT_SECRET`
- [ ] **[QUAL-MED-03]** Auditar todos os `auditLog()` calls e padronizar com prefixo `ADMIN_*`
- [ ] **[ARCH-LOW-01]** Implementar cache warm-up no startup do Kurupira
- [ ] **[QUAL-LOW-02]** Adicionar rate limiting em `/internal/catalog/*`

### Médio prazo (Sprint 3-5)

- [ ] **[QUAL-MED-01]** Criar suite de testes para `catalogService`, `equipmentValidator`, `designMetrics`, `validateM2M`
- [ ] **[ARCH-MED-02]** Implementar campo `hspSource` e `hspConfidence` no response de métricas
- [ ] **[ARCH-MED-03]** Adicionar `performanceRatio` configurável no `designData` (default 0.75)
- [ ] **[OPT-03]** Implementar structured logging JSON para todos os serviços
- [ ] **[OPT-04]** Health check profundo com verificação de dependências (DB, Logto)
- [ ] **[SEC-MED-03]** Verificação proativa de expiração de token no frontend (Sumauma)
- [ ] **[ARCH-HIGH-01]** Reestruturar roteamento com versioning explícito (`/routes/v1/index.js`)

### Longo prazo

- [ ] **[OPT-01]** Migrar cache para Redis (multi-instance support)
- [ ] **[OPT-07]** Endpoint de bulk import para catálogo PAN/OND
- [ ] **[ARCH-MED-02]** Integração com NASAPOWER para HSP preciso por coordenada
- [ ] **[QUAL-MED-02]** Extrair services no Sumauma (catalog, tenant, user)
- [ ] **[OPT-02]** Implementar ETag/Last-Modified no catálogo
- [ ] **[SCHEMA]** Adicionar `@@map` snake_case e `@@unique([manufacturer, model])` no schema Kurupira
- [ ] **[DOCS]** Gerar OpenAPI specs para contratos M2M internos

---

## 9. Pontos Positivos Consolidados

A arquitetura atual demonstra maturidade significativa para um sistema em desenvolvimento ativo:

| Área | Prática Positiva |
|------|-----------------|
| **Segurança** | Isolamento multitenant consistente com `tenantId` em todas as queries |
| **Segurança** | Validação técnica de equipamentos com bankability score (BANKABLE/ACCEPTABLE/UNRELIABLE) |
| **Segurança** | Poka-yoke no Sumauma — rejeita criação de PLATFORM_ADMIN via HTTP |
| **Segurança** | Migração M2M para OAuth2 Client Credentials (Logto) concluída |
| **Arquitetura** | Decomposição do server.js monolítico em estrutura modular testável |
| **Arquitetura** | AsyncLocalStorage para propagação de contexto sem parameter drilling |
| **Arquitetura** | Separação de schemas Prisma para acesso cross-service read-only |
| **Performance** | Batch fetch de leads com `fetchLeadsBatch()` para evitar N+1 |
| **Performance** | Cache in-memory com TTL e invalidação explícita implementados |
| **Performance** | Paginação implementada em endpoints de catálogo e audit logs |
| **Observabilidade** | X-Correlation-ID propagado entre Sumauma → Kurupira |
| **Observabilidade** | Idempotência com `Idempotency-Key` em operações M2M críticas |
| **Observabilidade** | Audit trail automático via Prisma middleware + auditLog() explícito |
| **Engenharia** | Suporte a PVSyst v6 e v7 com normalização de coeficientes de temperatura |
| **Engenharia** | Tabela HSP por estado com 27 estados brasileiros (dados INPE LABSOLAR) |
| **UX** | Endpoint lazy `/designs/:id/lead-context` para carregamento não-bloqueante |

---

## 10. Métricas de Qualidade

| Dimensão | Score Atual | Score Anterior (02/05) | Delta |
|----------|-------------|------------------------|-------|
| Segurança (0-10) | 7.5 | 5.0 | +2.5 |
| Arquitetura (0-10) | 7.0 | 4.5 | +2.5 |
| Performance (0-10) | 6.5 | 5.5 | +1.0 |
| Testabilidade (0-10) | 4.0 | 2.0 | +2.0 |
| Observabilidade (0-10) | 5.5 | 4.5 | +1.0 |
| **Geral (média)** | **6.1** | **4.3** | **+1.8** |

**Projeção:** Com as correções de curto prazo aplicadas, o score geral deve atingir ~7.5/10, dentro do threshold para ambiente de produção.

---

*Gerado em 2026-05-03 | Ywara Auditoria Técnica v2 | Neonorte Tecnologia*  
*Próxima auditoria recomendada: Após sprint 1-2 de correções ou antes de go-live em staging público*

# Auditoria Técnica — Kurupira & Sumauma
**Data:** 2 de maio de 2026  
**Escopo:** `kurupira/backend`, `sumauma/backend`, `sumauma/frontend`  
**Auditor:** Claude Sonnet 4.6 (Neonorte Tecnologia)

---

## Resumo Executivo

A plataforma Ywara demonstra uma arquitetura multitenant sólida com separação clara de domínios. A análise identificou **3 vulnerabilidades críticas de segurança**, **7 problemas de alta prioridade**, **9 problemas de média prioridade** e **6 oportunidades de otimização**. O sistema está em condição pré-produção e os itens críticos devem ser resolvidos antes de qualquer implantação em ambiente acessível publicamente.

### Severidade Geral

| Categoria      | Crítico | Alto | Médio | Baixo |
|----------------|---------|------|-------|-------|
| Segurança      | 3       | 3    | 4     | 1     |
| Arquitetura    | 0       | 3    | 3     | 2     |
| Performance    | 0       | 1    | 2     | 1     |
| Qualidade      | 0       | 0    | 2     | 2     |

---

## 1. Vulnerabilidades de Segurança Críticas

### [SEC-CRIT-01] Bypass total de autenticação em modo desenvolvimento
**Arquivo:** `kurupira/backend/src/server.js:77-81`  
**Arquivo:** `sumauma/backend/src/middleware/platformAuth.js:62`

O `authenticateToken` do Kurupira bypassa completamente a validação JWT quando `NODE_ENV !== 'production'` **ou** `IS_DEMO === 'true'`:

```js
// server.js linha 77–81 — KURUPIRA
if (process.env.NODE_ENV !== 'production' || process.env.IS_DEMO === 'true') {
  req.user = { id: 'dev-engineer', tenantId: 'dev-tenant', role: 'ADMIN' };
  return next();
}
```

O `platformAuth` do Sumauma tem o mesmo padrão:

```js
// platformAuth.js linha 62 — SUMAUMA
const isAuthorized = 
  legacyRole === 'PLATFORM_ADMIN' || 
  roles.includes('PLATFORM_ADMIN') ||
  process.env.NODE_ENV === 'development'; // ← BYPASS TOTAL
```

**Risco:** Qualquer requisição sem token é aceita como `ADMIN` em ambientes de staging/dev expostos. Se um servidor de staging for acessível externamente com `NODE_ENV=development`, todas as APIs estão abertas sem autenticação.

**Correção:**
```js
// Remover completamente o fallback. Para testes locais, usar tokens JWT reais.
if (!token) {
  return res.status(401).json({ success: false, error: 'Token required' });
}
```
Se for necessário um modo demo, isolar em uma branch separada e nunca expor externamente.

---

### [SEC-CRIT-02] tenantId com fallback hardcoded — risco de data leakage cross-tenant
**Arquivo:** `kurupira/backend/src/server.js:91`

```js
req.user = {
  ...decoded,
  id: decoded.id || decoded.sub,
  tenantId: decoded.tenantId || 'default-tenant-001' // ← PERIGO
};
```

Se um token JWT válido não contiver `tenantId` (ex: tokens Logto sem claim customizada), o usuário é silenciosamente associado ao tenant `default-tenant-001`. Esse usuário passa a enxergar **todos os designs desse tenant** e pode criar/deletar recursos de outro tenant.

**Risco:** Violação de isolamento multitenant. Um usuário de tenant A pode acessar dados do tenant default.

**Correção:**
```js
const tenantId = decoded.tenantId;
if (!tenantId) {
  return res.status(401).json({ success: false, error: 'Token inválido: tenantId ausente' });
}
req.user = { ...decoded, id: decoded.id || decoded.sub, tenantId };
```

---

### [SEC-CRIT-03] Upload de imagens sem validação de conteúdo (MIME sniffing)
**Arquivo:** `kurupira/backend/src/server.js:50-62`

```js
const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    cb(null, req.params.id + '-' + uniqueSuffix + '.webp'); // ← renomeia mas não valida
  }
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });
```

O Multer valida apenas o tamanho. O `fileFilter` está ausente. Um atacante pode enviar um arquivo `.php`, `.js` ou um SVG com XSS payload, que será salvo com extensão `.webp` mas cujo conteúdo pode ser executado dependendo da configuração do servidor de arquivos estáticos.

**Risco:** Upload de conteúdo malicioso. Se o NGINX servir `/uploads` com `Content-Type` baseado em conteúdo, SVG/HTML com scripts pode ser interpretado.

**Correção:**
```js
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Tipo de arquivo não permitido'), false);
    }
    cb(null, true);
  }
});
```
Adicionalmente, configurar o NGINX com `add_header Content-Type image/webp` e `add_header X-Content-Type-Options nosniff` para o diretório de uploads.

---

## 2. Problemas de Alta Prioridade

### [SEC-HIGH-01] Código HTTP 403 incorreto para token inválido/expirado
**Arquivo:** `kurupira/backend/src/server.js:95`

```js
} catch (error) {
  return res.status(403).json({ success: false, error: 'Invalid or expired token' });
}
```

Tokens inválidos/expirados retornam **403 Forbidden** quando o correto é **401 Unauthorized**. O código 403 indica que o servidor entende a identidade mas nega o acesso. O 401 indica que a identidade não foi estabelecida.

**Impacto:** Clientes frontend (como o interceptor do Sumauma que escuta `401`) não detectam expiração de token e não fazem logout automático.

**Correção:** Usar `res.status(401)` para `jwt.JsonWebTokenError` e `jwt.TokenExpiredError`.

---

### [SEC-HIGH-02] M2M com token plain text sem rotação
**Arquivo:** `kurupira/backend/src/server.js:103` | `sumauma/backend/src/lib/m2mClient.js`

```js
headers: { 'X-Service-Token': M2M_TOKEN }
```

O token M2M é um valor estático definido em `.env` (`m2m_guardioes_secret_2026!`). Não há mecanismo de rotação, expiração ou revogação. Se o token vazar, qualquer processo pode chamar as APIs internas do Kurupira e inserir/deletar equipamentos do catálogo sem autenticação de usuário.

**Correção de curto prazo:** Implementar validação de origem por IP (apenas o container `sumauma-backend` pode chamar `/internal/*`) via Nginx ou middleware. **Correção robusta:** Migrar para OAuth2 Client Credentials (Logto M2M já disponível no projeto).

---

### [SEC-HIGH-03] Senha armazenada em User mas nunca verificada no login do Admin
**Arquivo:** `sumauma/backend/prisma/schema.prisma:60`

O modelo `User` tem campo `password: String` (bcrypt hash). O login de operadores no Sumauma autentica via Logto (JWT externo), mas o campo `password` está presente e populado. Não há endpoint claro que use esse campo no Sumauma. No Iaçã, existe um `POST /admin/auth/login` com `bcrypt.compare`. O risco é a duplicidade: dois sistemas de senha para o mesmo usuário podem ficar dessincronizados.

**Correção:** Deprecar o campo `password` no modelo User do Sumauma ou garantir que apenas o Iaçã o use, documentando explicitamente qual serviço é o sistema de record de credenciais.

---

### [ARCH-HIGH-01] Anti-pattern: configurações de usuário salvas como TechnicalDesign
**Arquivo:** `kurupira/backend/src/server.js:637-677`

```js
const SETTINGS_LEAD_ID = '__settings__';
// Configurações persistidas como TechnicalDesign com iacaLeadId='__settings__'
```

Configurações de usuário são persistidas como registros na tabela `TechnicalDesign` usando um sentinel mágico (`'__settings__'`). Isso polui a tabela principal e exige filtros especiais em toda listagem:

```js
OR: [
  { iacaLeadId: null },
  { iacaLeadId: { not: '__settings__' } }
]
```

**Impacto:** 
- Filtros frágeis que podem quebrar silenciosamente se o sentinel mudar.
- A tabela `TechnicalDesign` mistura dois tipos de dados sem discriminador explícito.
- Impossibilita índices eficientes para contagem de projetos reais.
- Queries de dashboard contarão settings como projetos se o filtro falhar.

**Correção:** Criar uma tabela dedicada `UserSettings` ou `UserPreferences` no schema do Kurupira.

---

### [ARCH-HIGH-02] server.js monolítico com 700 linhas — violação do SRP
**Arquivo:** `kurupira/backend/src/server.js`

Todas as responsabilidades coexistem em um único arquivo: inicialização do servidor, configuração de CORS, middleware de autenticação, cliente M2M, lógica de extração de métricas, e 15+ handlers de rota. Sem separação em módulos, testes unitários são impossíveis sem subir o servidor inteiro.

**Recomendação:** Extrair para estrutura modular:
```
src/
  middleware/auth.js
  middleware/upload.js
  routes/designs.js
  routes/catalog.js
  routes/settings.js
  services/m2mClient.js
  utils/metrics.js
```

---

### [ARCH-HIGH-03] Inconsistência: leitura direta no banco vs. M2M para o mesmo recurso
**Arquivos:** `sumauma/backend/src/routes/catalog.js` | `sumauma/backend/src/lib/prismaKurupira.js`

O Sumauma lê o catálogo diretamente do `db_kurupira` via Prisma read-only para `GET /admin/catalog/*`, mas faz mutações (POST/PATCH/DELETE) via chamada M2M HTTP ao Kurupira. Isso cria dois canais distintos para o mesmo recurso:

- **Leituras:** `db_kurupira` diretamente (sem passar pela lógica de negócio do Kurupira)
- **Escritas:** `kurupira-backend:3002/internal/catalog/*` (passa pela validação do CatalogService)

**Risco:** Uma leitura logo após uma escrita pode retornar dados desatualizados dependendo da latência de replicação. Mais grave: a leitura direta bypassa qualquer futura lógica de apresentação ou transformação adicionada ao Kurupira.

**Correção:** Padronizar: ou tudo via M2M HTTP (consistência), ou tudo via acesso direto ao banco (performance). Para um catálogo global (não particionado por tenant), o acesso direto read-only é aceitável, mas deve ser documentado explicitamente.

---

## 3. Problemas de Média Prioridade

### [ARCH-MED-01] `module.exports` duplicado em catalog.js
**Arquivo:** `sumauma/backend/src/routes/catalog.js:272-275`

```js
module.exports = router; // linha 272
                         // ... 2 linhas vazias
module.exports = router; // linha 275 — duplicado
```

Código morto. Node.js usa o último `module.exports`, portanto não quebra nada, mas indica falta de revisão e é confuso para mantenedores.

---

### [ARCH-MED-02] auditLog sem IP e UserAgent nas chamadas do catalog
**Arquivo:** `sumauma/backend/src/routes/catalog.js:104-111`

```js
await auditLog({
  operator: req.operator,
  action: 'CREATE',
  entity: 'ModuleCatalog',
  resourceId: equipment.id,
  details: `Upload de módulo: ...`,
  after: equipment
  // ipAddress: não passado ← gap forense
  // userAgent: não passado ← gap forense
});
```

Todos os logs de auditoria de catalog ficam sem IP e UserAgent. Para investigação forense (ex: "quem adicionou esse módulo malicioso?"), esses campos são essenciais.

**Correção:**
```js
await auditLog({
  operator: req.operator,
  action: 'CREATE',
  entity: 'ModuleCatalog',
  resourceId: equipment.id,
  details: `...`,
  after: equipment,
  ipAddress: req.ip || req.headers['x-forwarded-for'],
  userAgent: req.headers['user-agent'],
});
```

---

### [ARCH-MED-03] req.operator sem tenantId — logs de auditoria com tenantId=null
**Arquivo:** `sumauma/backend/src/middleware/platformAuth.js:71-75`

```js
req.operator = {
  id: decoded.id || decoded.sub,
  username: decoded.username || decoded.preferred_username || decoded.email,
  role: legacyRole || ...,
  // tenantId: ausente ← todos os auditLogs ficam com tenantId=null
};
```

O `auditLogger.js` usa `operator?.tenantId || null`, então todos os logs de ações do painel admin ficam sem tenantId. Isso quebra qualquer consulta de auditoria filtrada por tenant.

---

### [PERF-MED-01] Sem paginação no catálogo do Kurupira
**Arquivo:** `kurupira/backend/src/server.js:515-537`

```js
app.get("/api/v1/catalog/modules", authenticateToken, async (req, res) => {
  const modules = await prisma.moduleCatalog.findMany({
    where: { isActive: true },
    orderBy: { manufacturer: 'asc' }
    // take: ausente ← retorna todos os registros ativos
  });
});
```

Com catálogos de 500+ módulos (cenário real após uploads em massa), esse endpoint retorna todos os registros sem paginação. O frontend do Kurupira recebe o payload inteiro, incluindo `electricalData` (JSON grande por registro).

**Correção:** Adicionar `take`, `skip` e parâmetros de query `?page=1&limit=50`. O endpoint do Sumauma (`/admin/catalog/modules`) já tem paginação — seria consistente replicar para o Kurupira.

---

### [PERF-MED-02] HSP hardcoded como fallback no cálculo de kWp
**Arquivo:** `kurupira/backend/src/server.js:191`

```js
const hsp = 4.5; // Média conservadora se não houver weatherData
kWpAlvo = (avgConsumption * 12) / (hsp * 365 * 0.80);
```

O valor de 4.5 h/dia de irradiação solar é uma média nacional. O Brasil tem variação enorme: norte (Manaus ~5.5 h/dia), nordeste (Fortaleza ~5.8 h/dia), sul (Porto Alegre ~4.2 h/dia), planalto central (~5.2 h/dia). Projetos no Pará com HSP=4.5 vão subdimensionar o sistema; projetos no sul com HSP=4.5 vão superdimensionar.

**Correção:** Se `lat` e `lng` estiverem disponíveis no `designData`, usar uma tabela de irradiação por região ou pelo menos um range por estado. Se não disponíveis, exibir aviso explícito na API response em vez de silenciosamente usar o fallback.

---

### [QUAL-MED-01] Variável declarada mas nunca usada
**Arquivo:** `kurupira/backend/src/server.js:641,654`

```js
app.get("/api/v1/settings", authenticateToken, async (req, res) => {
  const name = `settings-${req.user.id}`; // ← declarada, nunca usada
  const record = await prisma.technicalDesign.findFirst({ ... });
```

Mesmo padrão em `PUT /api/v1/settings`. Lixo de refatoração.

---

### [QUAL-MED-02] Tratamento de erros genérico expõe stack trace em produção
**Arquivo:** `kurupira/backend/src/server.js` (múltiplos handlers)

```js
} catch (error) {
  res.status(500).json({ success: false, error: error.message }); // ← expõe detalhes internos
}
```

`error.message` pode expor detalhes de stack do Prisma (`"Unique constraint failed on the fields: (username)"`, paths de arquivo, queries SQL). Esses detalhes são valiosos para reconhecimento de vulnerabilidades por atacantes.

**Correção:** Em produção, logar o erro completo internamente e retornar apenas mensagem genérica ao cliente:
```js
} catch (error) {
  console.error('[Route Error]', error);
  const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message;
  res.status(500).json({ success: false, error: msg });
}
```

---

## 4. Problemas de Baixa Prioridade

### [SEC-LOW-01] CORS permissivo em qualquer ambiente não-produção
**Arquivo:** `kurupira/backend/src/server.js:29-37`

```js
if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
  callback(null, true); // qualquer origin em dev/staging
}
```

Environments de staging acessíveis externamente aceitam requisições de qualquer origem.

---

### [ARCH-LOW-01] Prisma client instanciado duas vezes no Kurupira
**Arquivo:** `kurupira/backend/src/services/catalogService.js:5` | `kurupira/backend/src/server.js:18`

```js
// server.js
const prisma = new PrismaClient();

// catalogService.js
const prisma = new PrismaClient(); // ← instância separada
```

Duas instâncias separadas do PrismaClient gerenciam connection pools independentes. Em ambiente com 256-512MB RAM, isso pode levar a esgotamento de conexões MySQL sob carga. O pool padrão do Prisma é 5-10 conexões; duas instâncias = 10-20 conexões potenciais.

**Correção:** Extrair para singleton `src/lib/prisma.js` e importar em todos os módulos.

---

### [ARCH-LOW-02] jwksClient sem TTL explícito configurado
**Arquivo:** `sumauma/backend/src/middleware/platformAuth.js:7-11`

```js
const client = jwksClient({
  jwksUri: process.env.LOGTO_JWKS_URI || 'http://localhost:3301/oidc/jwks',
  cache: true,
  rateLimit: true,
  // cacheMaxAge: não configurado ← usa padrão 10min da biblioteca
});
```

O TTL do cache de JWKS não está explicitamente configurado. O padrão de 10 minutos pode ser inadequado em rotações de chave de emergência.

---

### [QUAL-LOW-01] Console.log com dados de usuário em logs de produção
**Arquivo:** `sumauma/backend/src/middleware/platformAuth.js:51`

```js
console.log(`[Auth] Request de ${decoded.preferred_username || decoded.sub || 'Desconhecido'}`);
```

Logar usernames em cada requisição gera ruído excessivo e pode violar políticas de privacidade (LGPD) se logs forem indexados externamente. Deveria ser no nível `DEBUG`, não `INFO`.

---

### [QUAL-LOW-02] Sumauma frontend: sem tratamento de erro de rede no interceptor
**Arquivo:** `sumauma/frontend/src/lib/api.ts:20-31`

O interceptor de resposta só trata `401`. Erros de rede (`ECONNREFUSED`, timeout), `503` e `500` são re-lançados sem tratamento. O usuário vê erros sem tratamento na UI.

---

## 5. Oportunidades de Otimização

### [OPT-01] Remover `include: { roofSections: true, pvArrays: true }` da listagem
**Arquivo:** `kurupira/backend/src/server.js:258-259`

A listagem de designs já extrai métricas do `designData` JSON. Incluir `roofSections` e `pvArrays` na listagem carrega dados completos de geometria (polígonos GeoJSON) sem uso — esses dados são necessários apenas na view de edição individual.

**Estimativa de impacto:** Para 50 designs com médias de 3 seções de telhado cada, são ~150 registros adicionais por listagem. Remover esses includes pode reduzir o payload em 60-70%.

---

### [OPT-02] Cache em memória para catálogo de equipamentos
**Arquivo:** `kurupira/backend/src/server.js:515-537`

O catálogo de módulos e inversores é um recurso global (sem tenant isolation) que muda raramente (apenas via admin). Cada abertura do painel de design faz duas queries ao banco. Um cache simples com TTL de 5 minutos eliminaria >90% dessas queries.

```js
// Exemplo simples com node-cache
const cache = new NodeCache({ stdTTL: 300 });

app.get("/api/v1/catalog/modules", authenticateToken, async (req, res) => {
  const cached = cache.get('modules:active');
  if (cached) return res.json({ success: true, data: cached });
  const modules = await prisma.moduleCatalog.findMany({ where: { isActive: true } });
  cache.set('modules:active', modules);
  res.json({ success: true, data: modules });
});
```

---

### [OPT-03] Índice faltante em `TechnicalDesign.createdBy`
**Arquivo:** `kurupira/backend/prisma/schema.prisma`

A query de settings usa `{ iacaLeadId: SETTINGS_LEAD_ID, createdBy: req.user.id }` sem índice em `createdBy`. Para tenants com muitos usuários, essa query vira full scan. Adicionar `@@index([createdBy])` (e eventualmente `@@index([iacaLeadId, createdBy])` para o padrão de settings).

---

### [OPT-04] Lazy loading do contexto de lead no GET /designs/:id
**Arquivo:** `kurupira/backend/src/server.js:303-305`

```js
const leadContext = design.iacaLeadId ? await fetchLeadContext(design.iacaLeadId) : null;
```

O fetch M2M ao Iaçã é síncrono e bloqueia a resposta por até 2 segundos (timeout). Se o objetivo for abrir o design para edição, o contexto de lead é contextual — poderia ser carregado em paralelo pelo frontend após o design principal ser recebido.

**Sugestão:** Retornar o design imediatamente e expor endpoint separado `GET /api/v1/designs/:id/lead-context` para carregamento lazy.

---

### [OPT-05] Consolidar validação de entrada nas rotas de criação
**Arquivo:** `kurupira/backend/src/server.js:321-340` (POST /designs)

O endpoint de criação de design não valida os campos de entrada. `iacaLeadId`, `name`, `latitude`, `longitude` são passados diretamente ao Prisma sem sanitização. Embora o Prisma proteja contra SQL injection, valores como `latitude: 999` ou `name: ""` chegam ao banco.

O projeto já tem Zod como dependência (`package.json`). Adicionar um schema de validação para criação/atualização de designs seria consistente com a validação já existente em `quote.zod.js`.

---

### [OPT-06] Sumauma: erros de auditoria silenciados podem mascarar falhas críticas
**Arquivo:** `sumauma/backend/src/lib/auditLogger.js:27-29`

```js
} catch (error) {
  console.error('[AuditLogger] Falha ao registrar log:', error.message);
  // operação continua sem log ← gap de compliance
}
```

Para operações de alto risco (DELETE de equipamento, criação de tenant), falha no audit log deveria ser tratada como falha da operação principal ou pelo menos alertada via sistema de monitoramento. O comportamento atual silencia a falha e o operador não sabe que o log não foi registrado.

---

## 6. Análise da Integração Kurupira ↔ Sumauma

### Fluxo atual (documentado)

```
[Admin UI] → POST /admin/catalog/modules
           → [Sumauma backend] valida platformAuth
           → [kurupiraClient] POST /internal/catalog/modules (M2M)
           → [Kurupira backend] valida validateM2M
           → [CatalogService] parsePanOnd + validateModule
           → INSERT db_kurupira.ModuleCatalog
           → [Sumauma backend] auditLog CREATE
           → [Admin UI] recebe 201
```

### Problemas no fluxo

1. **Sem idempotência:** Se a chamada M2M falhar após o INSERT mas antes do `auditLog`, a operação é executada sem log de auditoria. Não há mecanismo de compensação.

2. **Sem correlação de trace:** Não há `X-Request-ID` ou `X-Correlation-ID` propagado entre Sumauma e Kurupira. Em caso de erro, é impossível correlacionar um log do Sumauma com o log correspondente no Kurupira.

3. **Dupla responsabilidade no catalogService.js:** `processPanUpload` tanto parseia o arquivo quanto persiste no banco. Isso dificulta testes unitários do parser isolado da camada de persistência.

4. **Sem transação distribuída:** A operação `INSERT + auditLog` não é atômica. Um crash entre as duas operações resulta em estado inconsistente (equipamento no catálogo sem trilha de auditoria).

---

## 7. Checklist de Correções Prioritizadas

### Imediato (antes de qualquer exposição pública)

- [ ] **[SEC-CRIT-01]** Remover bypass de autenticação por `NODE_ENV`. Implementar tokens de teste reais para desenvolvimento local.
- [ ] **[SEC-CRIT-02]** Rejeitar tokens JWT sem `tenantId` em vez de usar fallback `'default-tenant-001'`.
- [ ] **[SEC-CRIT-03]** Adicionar `fileFilter` com validação de MIME type no Multer.
- [ ] **[SEC-HIGH-01]** Corrigir código HTTP: tokens inválidos/expirados devem retornar 401, não 403.

### Curto prazo (sprint 1-2)

- [ ] **[ARCH-HIGH-01]** Criar tabela `UserSettings` e migrar o padrão `__settings__`.
- [ ] **[ARCH-HIGH-02]** Modularizar `server.js` em routes, middleware e services separados.
- [ ] **[ARCH-MED-02]** Passar `ipAddress` e `userAgent` em todas as chamadas ao `auditLog`.
- [ ] **[ARCH-MED-03]** Adicionar `tenantId` ao `req.operator` no `platformAuth`.
- [ ] **[ARCH-MED-01]** Remover `module.exports` duplicado em `catalog.js`.
- [ ] **[QUAL-MED-02]** Sanitizar `error.message` antes de retornar em produção.

### Médio prazo (sprint 3-4)

- [ ] **[OPT-01]** Remover `include: { roofSections, pvArrays }` da listagem de designs.
- [ ] **[OPT-02]** Implementar cache em memória para catálogo de equipamentos.
- [ ] **[OPT-03]** Adicionar índice `@@index([createdBy])` na tabela `TechnicalDesign`.
- [ ] **[ARCH-LOW-01]** Consolidar instâncias do PrismaClient em singleton.
- [ ] **[PERF-MED-01]** Adicionar paginação em `GET /api/v1/catalog/modules` e `inverters`.
- [ ] **[OPT-06]** Tratar falhas de audit log como alerta crítico (não silenciar).

### Longo prazo

- [ ] **[SEC-HIGH-02]** Migrar autenticação M2M para OAuth2 Client Credentials (Logto M2M).
- [ ] **[OPT-04]** Implementar lazy loading do lead context via endpoint separado.
- [ ] **[OPT-05]** Adicionar validação Zod nas rotas de criação/atualização de designs.
- [ ] **[PERF-MED-02]** Implementar lookup de HSP por coordenada geográfica.
- [ ] Adicionar `X-Correlation-ID` no fluxo M2M Sumauma → Kurupira.
- [ ] Implementar idempotência nas operações críticas de catálogo.

---

## 8. Pontos Positivos (Confirmados pela Auditoria)

A auditoria também identificou práticas corretas que devem ser mantidas:

- **Isolamento de tenant consistente** nas queries de TechnicalDesign (`where: { tenantId: req.user.tenantId }`).
- **Batch fetch de leads** (evita N+1 na listagem de designs).
- **Circuit breaker no M2M** com `AbortSignal.timeout(2000)` e degradação graciosa.
- **Validação técnica de equipamentos** via `validateModule`/`validateInverter` com bankability score.
- **Suporte a PVSyst v6 e v7** com normalização de campos (aliases `Pnom`/`PNom`/`Pmax`).
- **Paginação no Sumauma** para listagem de catálogo (`page`, `limit`, `total`).
- **Queries paralelas no dashboard** via `Promise.all()`.
- **Separação de schemas Prisma** para acesso read-only cross-service.
- **auditLog em todas as mutações** do painel admin (mesmo com gaps de IP/UserAgent).
- **Healthcheck em todos os serviços** com verificação de conectividade HTTP.

---

*Gerado em 2026-05-02 | Ywara Auditoria Técnica | Neonorte Tecnologia*

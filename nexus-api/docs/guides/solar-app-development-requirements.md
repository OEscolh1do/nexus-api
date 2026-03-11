# Requisitos de Desenvolvimento: Solar Dimension App

## Visão Executiva

Este documento define os requisitos funcionais e não-funcionais para a aplicação standalone de dimensionamento fotovoltaico, garantindo que ela possa operar independentemente e ser integrada ao Neonorte | Nexus Monolith no futuro.

---

## 1. Requisitos Funcionais

### 1.1 Dimensionamento de Sistema Fotovoltaico

#### RF-001: Cálculo de Potência do Sistema

**Prioridade:** CRÍTICA  
**Descrição:** O sistema deve calcular a potência necessária (kWp) baseado no consumo médio mensal do cliente.

**Critérios de Aceitação:**

- [ ] Aceita consumo em kWh/mês (range: 50 - 100.000 kWh)
- [ ] Considera irradiação solar da localidade (via código IBGE)
- [ ] Aplica fator de correção para perdas (padrão: 20%)
- [ ] Retorna potência em kWp com 2 casas decimais

**Fórmula Base:**

```
Potência (kWp) = (Consumo Mensal × 12) / (Irradiação Anual × 365 × Fator de Correção)
```

**Exemplo:**

```typescript
Input: { consumptionKwh: 500, cityCode: "3550308" } // São Paulo
Output: { systemSizeKwp: 4.2 }
```

---

#### RF-002: Seleção de Equipamentos

**Prioridade:** CRÍTICA  
**Descrição:** O sistema deve selecionar módulos e inversores adequados ao dimensionamento.

**Critérios de Aceitação:**

- [ ] Consulta catálogo de módulos ativos
- [ ] Filtra módulos por potência e disponibilidade
- [ ] Calcula quantidade de módulos necessária
- [ ] Seleciona inversor compatível com:
  - Potência total dos módulos (ratio 0.8 - 1.2)
  - Tensão de entrada (Voc, Vmp)
  - Tipo de conexão (mono/bi/trifásico)
- [ ] Valida compatibilidade elétrica (MPPTs, strings)

**Regras de Negócio:**

- Quantidade de módulos deve ser múltiplo do número de strings
- Potência do inversor deve estar entre 80% e 120% da potência dos módulos
- Tensão máxima de circuito aberto não pode exceder limite do inversor

---

#### RF-003: Análise Financeira

**Prioridade:** ALTA  
**Descrição:** O sistema deve calcular viabilidade econômica do investimento.

**Critérios de Aceitação:**

- [ ] Calcula investimento total (equipamentos + instalação)
- [ ] Calcula economia mensal e anual
- [ ] Calcula payback simples (anos)
- [ ] Calcula TIR (Taxa Interna de Retorno)
- [ ] Calcula VPL (Valor Presente Líquido)
- [ ] Considera inflação energética (padrão: 8% a.a.)
- [ ] Considera taxa de desconto (padrão: 10% a.a.)

**Fórmulas:**

```typescript
// Payback Simples
payback = investimentoTotal / economiaMensal / 12;

// VPL (25 anos)
vpv = Σ((economiaAnual / (1 + taxaDesconto)) ^ ano) - investimentoTotal;

// TIR (iterativo)
0 = Σ((economiaAnual / (1 + TIR)) ^ ano) - investimentoTotal;
```

---

#### RF-004: Geração de Proposta (PDF)

**Prioridade:** ALTA  
**Descrição:** O sistema deve gerar proposta técnica profissional em PDF.

**Critérios de Aceitação:**

- [ ] Capa com logo e dados do cliente
- [ ] Resumo executivo (investimento, payback, economia)
- [ ] Especificações técnicas (módulos, inversor, potência)
- [ ] Gráfico de geração vs consumo (12 meses)
- [ ] Análise financeira (tabela de fluxo de caixa)
- [ ] Termos e condições
- [ ] Geração em < 2 segundos
- [ ] PDF otimizado (< 2MB)

**Biblioteca Recomendada:** `pdfkit` ou `puppeteer`

---

### 1.2 Catálogo de Equipamentos

#### RF-005: CRUD de Módulos Fotovoltaicos

**Prioridade:** MÉDIA  
**Descrição:** Administradores devem gerenciar catálogo de módulos.

**Critérios de Aceitação:**

- [ ] Criar módulo (marca, modelo, potência, eficiência, preço)
- [ ] Editar módulo existente
- [ ] Desativar módulo (soft delete)
- [ ] Listar módulos ativos
- [ ] Filtrar por marca, potência, tecnologia
- [ ] Validação de dados técnicos (Zod)

**Campos Obrigatórios:**

- Marca, Modelo, Potência (Wp), Eficiência (%), Tecnologia, Preço, Dimensões (mm), Peso (kg), Voc, Isc, Vmp, Imp

---

#### RF-006: CRUD de Inversores

**Prioridade:** MÉDIA  
**Descrição:** Administradores devem gerenciar catálogo de inversores.

**Critérios de Aceitação:**

- [ ] Criar inversor (marca, modelo, potência, fases)
- [ ] Editar inversor existente
- [ ] Desativar inversor
- [ ] Listar inversores ativos
- [ ] Filtrar por potência, fases, marca
- [ ] Validação de compatibilidade elétrica

**Campos Obrigatórios:**

- Marca, Modelo, Potência (kW), Fases, Tensão Min/Max, Corrente Max, MPPTs, Strings/MPPT, Eficiência, Preço

---

#### RF-007: Kits Pré-Configurados

**Prioridade:** BAIXA  
**Descrição:** Sistema deve suportar kits pré-montados para agilizar vendas.

**Critérios de Aceitação:**

- [ ] Criar kit (nome, módulo + quantidade, inversor)
- [ ] Calcular potência total do kit
- [ ] Definir preço de kit (com margem)
- [ ] Sugerir kit mais próximo ao dimensionamento
- [ ] Listar kits disponíveis

---

### 1.3 Dados de Irradiação Solar

#### RF-008: Consulta de Irradiação por Localidade

**Prioridade:** CRÍTICA  
**Descrição:** Sistema deve fornecer dados de irradiação solar por cidade.

**Critérios de Aceitação:**

- [ ] Aceita código IBGE (7 dígitos)
- [ ] Retorna irradiação média anual (kWh/m²/dia)
- [ ] Retorna irradiação mensal (array de 12 valores)
- [ ] Cacheia dados em Redis (TTL: 30 dias)
- [ ] Fallback para média estadual se cidade não encontrada

**Fonte de Dados:**

- CRESESB (Centro de Referência para Energia Solar e Eólica)
- ANEEL (Banco de Informações de Geração)
- NASA POWER (backup)

---

### 1.4 Integração com Neonorte | Nexus (Futuro)

#### RF-009: Sincronização de Propostas

**Prioridade:** BAIXA (Fase 2)  
**Descrição:** Propostas criadas devem sincronizar com Neonorte | Nexus via Event Bus.

**Critérios de Aceitação:**

- [ ] Emite evento `solar.proposal.created` ao criar proposta
- [ ] Inclui `leadId` se vinculado a lead do Neonorte | Nexus
- [ ] Inclui `tenantId` para multi-tenancy
- [ ] Consome evento `commercial.deal.won` para criar projeto

**Payload do Evento:**

```typescript
{
  event: "solar.proposal.created",
  timestamp: "2026-01-26T19:00:00Z",
  data: {
    proposalId: "prop_abc123",
    leadId: "lead_xyz789",
    tenantId: "tenant_001",
    systemSizeKwp: 5.4,
    totalInvestment: 25000,
    status: "DRAFT"
  }
}
```

---

## 2. Requisitos Não-Funcionais

### 2.1 Performance

| ID      | Requisito                           | Alvo      | Crítico  |
| ------- | ----------------------------------- | --------- | -------- |
| RNF-001 | Tempo de cálculo de dimensionamento | < 500ms   | < 1s     |
| RNF-002 | Geração de PDF                      | < 2s      | < 5s     |
| RNF-003 | Consulta de catálogo (100 itens)    | < 100ms   | < 300ms  |
| RNF-004 | API Response Time (p95)             | < 200ms   | < 500ms  |
| RNF-005 | Throughput                          | 100 req/s | 50 req/s |
| RNF-006 | Tempo de carregamento inicial (FCP) | < 1.5s    | < 3s     |

**Estratégias de Otimização:**

- Cache de irradiação em Redis
- Índices em queries de catálogo
- Code splitting no frontend
- Lazy loading de componentes pesados
- Compressão gzip/brotli

---

### 2.2 Segurança

#### RNF-007: Validação de Entrada

**Descrição:** Toda entrada de usuário deve ser validada.

**Implementação:**

- [ ] Validação Zod no client-side (UX)
- [ ] Validação Zod no server-side (segurança)
- [ ] Sanitização de strings (XSS prevention)
- [ ] Validação de tipos numéricos (range checking)
- [ ] Rejeição de payloads > 1MB

---

#### RNF-008: Rate Limiting

**Descrição:** Prevenir abuso de API.

**Implementação:**

```typescript
// Anônimos: 10 req/min
// Autenticados: 100 req/min
// API Keys: 1000 req/min

app.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: (req) => {
      if (req.headers["x-api-key"]) return 1000;
      if (req.user) return 100;
      return 10;
    },
    message: "Muitas requisições. Tente novamente em 1 minuto.",
  }),
);
```

---

#### RNF-009: Autenticação (Opcional)

**Descrição:** Suporte a autenticação para modo integrado.

**Implementação:**

- [ ] JWT para usuários (exp: 24h)
- [ ] API Keys para integrações (rotação: 90 dias)
- [ ] OAuth2 para SSO (futuro)
- [ ] Modo anônimo para calculadora pública

---

### 2.3 Testabilidade

#### RNF-010: Cobertura de Testes

**Descrição:** Garantir qualidade via testes automatizados.

**Critérios:**

- [ ] Cobertura mínima: 80% (core domain)
- [ ] Cobertura mínima: 60% (API)
- [ ] Cobertura mínima: 50% (frontend)

**Tipos de Testes:**

```typescript
// Unitários (Vitest)
describe("SolarCalculator", () => {
  it("deve calcular potência corretamente", () => {
    const result = calculator.calculate({
      consumptionKwh: 500,
      cityCode: "3550308",
    });
    expect(result.systemSizeKwp).toBeCloseTo(4.2, 1);
  });
});

// Integração (Supertest)
describe("POST /api/v1/proposals/calculate", () => {
  it("deve retornar 200 com payload válido", async () => {
    const response = await request(app)
      .post("/api/v1/proposals/calculate")
      .send(validInput);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("systemSizeKwp");
  });
});

// E2E (Playwright)
test("fluxo completo de dimensionamento", async ({ page }) => {
  await page.goto("/");
  await page.fill('[name="consumptionKwh"]', "500");
  await page.click('button[type="submit"]');
  await expect(page.locator(".result")).toBeVisible();
});
```

---

### 2.4 Observabilidade

#### RNF-011: Logs Estruturados

**Descrição:** Logs devem ser estruturados e pesquisáveis.

**Implementação (Pino):**

```typescript
logger.info({
  event: "solar.calculation.started",
  input: {
    consumptionKwh: 500,
    cityCode: "3550308",
  },
  userId: "user_123",
  tenantId: "tenant_001",
  requestId: "req_abc",
  timestamp: new Date().toISOString(),
});
```

---

#### RNF-012: Métricas (Prometheus)

**Descrição:** Expor métricas para monitoramento.

**Métricas Obrigatórias:**

```typescript
// Contadores
solar_calculations_total{status="success|error"}
solar_proposals_created_total{status="draft|sent|approved"}

// Histogramas
solar_calculation_duration_seconds
solar_pdf_generation_duration_seconds
http_request_duration_seconds{method,route,status}

// Gauges
solar_active_proposals
solar_catalog_modules_count
solar_catalog_inverters_count
```

---

#### RNF-013: Tracing (OpenTelemetry)

**Descrição:** Rastreamento distribuído de requisições.

**Implementação:**

```typescript
const span = tracer.startSpan("solar.calculate", {
  attributes: {
    "consumption.kwh": input.consumptionKwh,
    "city.code": input.cityCode,
    "user.id": userId,
  },
});

try {
  const result = await calculator.calculate(input);
  span.setStatus({ code: SpanStatusCode.OK });
  return result;
} catch (error) {
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
  throw error;
} finally {
  span.end();
}
```

---

### 2.5 Escalabilidade

#### RNF-014: Horizontal Scaling

**Descrição:** Aplicação deve escalar horizontalmente.

**Requisitos:**

- [ ] Stateless (sessões em Redis)
- [ ] Idempotência em operações críticas
- [ ] Load balancing (Round Robin)
- [ ] Health checks (`/health`, `/ready`)

---

#### RNF-015: Database Performance

**Descrição:** Banco de dados deve suportar carga esperada.

**Otimizações:**

- [ ] Índices em colunas de busca frequente
- [ ] Connection pooling (max: 20)
- [ ] Query timeout (5s)
- [ ] Read replicas para consultas (futuro)

---

### 2.6 Disponibilidade

#### RNF-016: Uptime

**Descrição:** Sistema deve ter alta disponibilidade.

**SLA:** 99.5% (downtime máximo: 3.6h/mês)

**Estratégias:**

- [ ] Múltiplas réplicas (min: 2)
- [ ] Auto-scaling (CPU > 70%)
- [ ] Circuit breaker para APIs externas
- [ ] Graceful shutdown (drain connections)

---

### 2.7 Manutenibilidade

#### RNF-017: Código Limpo

**Descrição:** Código deve seguir padrões de qualidade.

**Checklist:**

- [ ] ESLint sem warnings
- [ ] Prettier formatado
- [ ] TypeScript strict mode
- [ ] Funções < 50 linhas
- [ ] Complexidade ciclomática < 10
- [ ] Comentários em lógica complexa

---

#### RNF-018: Documentação

**Descrição:** Sistema deve ser bem documentado.

**Artefatos Obrigatórios:**

- [ ] README.md (setup, run, deploy)
- [ ] API Reference (OpenAPI/Swagger)
- [ ] Architecture Decision Records (ADRs)
- [ ] Integration Guide (Neonorte | Nexus)
- [ ] Runbook (troubleshooting)

---

## 3. Requisitos de Integração

### 3.1 API REST

#### RI-001: Padrão de API

**Descrição:** API deve seguir convenções REST.

**Convenções:**

- Versionamento: `/api/v1/`
- Recursos: substantivos no plural (`/proposals`, `/modules`)
- Métodos HTTP semânticos (GET, POST, PUT, DELETE)
- Status codes corretos (200, 201, 400, 404, 500)
- Paginação: `?page=1&limit=20`
- Filtros: `?brand=Canadian&minPower=400`

---

#### RI-002: Formato de Resposta

**Descrição:** Respostas devem ser consistentes.

**Formato Padrão:**

```typescript
// Sucesso
{
  "data": { ... },
  "meta": {
    "timestamp": "2026-01-26T19:00:00Z",
    "requestId": "req_abc123"
  }
}

// Erro
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Consumo deve ser positivo",
    "details": [
      {
        "field": "consumptionKwh",
        "message": "Expected number, received string"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-01-26T19:00:00Z",
    "requestId": "req_abc123"
  }
}
```

---

### 3.2 Event Bus (Integração Neonorte | Nexus)

#### RI-003: Eventos Emitidos

**Descrição:** Aplicação deve emitir eventos para integração.

**Eventos:**

```typescript
// Proposta criada
{
  event: "solar.proposal.created",
  data: { proposalId, leadId, tenantId, systemSizeKwp, totalInvestment }
}

// Proposta aprovada
{
  event: "solar.proposal.approved",
  data: { proposalId, approvedBy, approvedAt }
}

// Proposta enviada ao cliente
{
  event: "solar.proposal.sent",
  data: { proposalId, sentTo, pdfUrl }
}
```

---

#### RI-004: Eventos Consumidos

**Descrição:** Aplicação deve reagir a eventos do Neonorte | Nexus.

**Eventos:**

```typescript
// Deal ganho (criar projeto)
{
  event: "commercial.deal.won",
  data: { dealId, proposalId, leadId, tenantId }
}

// Lead atualizado (enriquecer dados)
{
  event: "commercial.lead.updated",
  data: { leadId, energyBillUrl, city, state }
}
```

---

## 4. Requisitos de Deployment

### 4.1 Ambientes

| Ambiente    | Propósito             | URL                        | Database         |
| ----------- | --------------------- | -------------------------- | ---------------- |
| Development | Desenvolvimento local | localhost:3000             | SQLite           |
| Staging     | Testes de integração  | staging.solar.neonorte.com | PostgreSQL (RDS) |
| Production  | Produção              | solar.neonorte.com         | PostgreSQL (RDS) |

---

### 4.2 Variáveis de Ambiente

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/solar

# Redis
REDIS_URL=redis://cache:6379

# API
PORT=3000
NODE_ENV=production
API_VERSION=v1

# Security
JWT_SECRET=<random-256-bit-key>
API_KEY_SALT=<random-salt>

# External APIs
ANEEL_API_KEY=<key>
S3_BUCKET=neonorte-solar-proposals
S3_REGION=us-east-1

# Observability
LOG_LEVEL=info
SENTRY_DSN=<dsn>
PROMETHEUS_PORT=9090

# Integração Neonorte | Nexus (Opcional)
NEXUS_EVENT_BUS_URL=amqp://nexus:5672
NEXUS_API_URL=https://nexus.neonorte.com/api/v2
```

---

## 5. Critérios de Aceitação Globais

### Checklist de Entrega

**Core Domain:**

- [ ] SolarCalculator implementado e testado (cobertura >= 80%)
- [ ] Schemas Zod completos (input + output)
- [ ] Lógica de negócio sem dependências externas

**API:**

- [ ] Endpoints REST documentados (Swagger)
- [ ] Validação Zod em todas as rotas
- [ ] Rate limiting implementado
- [ ] Logs estruturados (Pino)
- [ ] Métricas expostas (Prometheus)

**Frontend:**

- [ ] Wizard de dimensionamento funcional
- [ ] Geração de PDF implementada
- [ ] Responsivo (mobile + desktop)
- [ ] Acessibilidade (WCAG 2.1 AA)

**Database:**

- [ ] Schema Prisma completo
- [ ] Migrations versionadas
- [ ] Seeds para desenvolvimento

**Deployment:**

- [ ] Dockerfile otimizado (multi-stage)
- [ ] Docker Compose funcional
- [ ] Kubernetes manifests (opcional)
- [ ] CI/CD pipeline (GitHub Actions)

**Documentação:**

- [ ] README.md completo
- [ ] ADR 008 aprovado
- [ ] API Reference publicada
- [ ] Integration Guide (Neonorte | Nexus)

---

## 6. Roadmap de Implementação

### Fase 1: Fundação (2 semanas)

- [ ] Setup de monorepo (Turborepo/Nx)
- [ ] Core domain (SolarCalculator)
- [ ] Schemas Zod
- [ ] Testes unitários (>= 80%)

### Fase 2: API (2 semanas)

- [ ] Backend REST (Fastify)
- [ ] Persistência Prisma
- [ ] Catálogo de equipamentos
- [ ] Dados de irradiação

### Fase 3: Frontend (3 semanas)

- [ ] Wizard de dimensionamento
- [ ] Geração de PDF
- [ ] Catálogo admin
- [ ] Dashboard de propostas

### Fase 4: Integração (1 semana)

- [ ] Event bus (RabbitMQ/Redis Pub/Sub)
- [ ] Sincronização com Neonorte | Nexus
- [ ] Multi-tenancy

### Fase 5: Produção (1 semana)

- [ ] Otimizações de performance
- [ ] Observabilidade completa
- [ ] Deploy em Kubernetes
- [ ] Testes de carga

---

## 7. Riscos e Mitigações

| Risco                               | Probabilidade | Impacto | Mitigação                             |
| ----------------------------------- | ------------- | ------- | ------------------------------------- |
| Dados de irradiação desatualizados  | Média         | Alto    | Cache com TTL curto, múltiplas fontes |
| Performance de geração de PDF       | Baixa         | Médio   | Otimizar templates, usar workers      |
| Complexidade de integração Neonorte | Nexus    | Alta          | Alto    | Começar standalone, integrar depois   |
| Catálogo de equipamentos incompleto | Média         | Médio   | Seeds com dados reais, CRUD robusto   |

---

## Aprovação

Este documento deve ser aprovado por:

- [ ] Arquiteto de Software
- [ ] Tech Lead
- [ ] Product Owner
- [ ] Engenheiro de Segurança

**Data de Aprovação:** ******\_\_\_******

**Versão:** 1.0.0  
**Última Atualização:** 2026-01-26

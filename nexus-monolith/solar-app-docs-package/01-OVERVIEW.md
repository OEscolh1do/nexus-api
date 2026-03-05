# Estudo: Aplicação Standalone de Dimensionamento Fotovoltaico

## Sumário Executivo

Este documento consolida o estudo realizado sobre a arquitetura do Neonorte | Nexus Monolith e apresenta a proposta de criação de uma **aplicação standalone de dimensionamento de sistemas fotovoltaicos** que possa operar independentemente e ser integrada ao Neonorte | Nexus no futuro.

---

## 1. Análise do Neonorte | Nexus Monolith

### 1.1 Arquitetura Atual

O Neonorte | Nexus Monolith segue uma **arquitetura modular** (ADR 001) com os seguintes princípios:

- **Módulos de Domínio Auto-Contidos:** Cada módulo (`commercial`, `ops`, `solar`) possui sua própria estrutura de controllers, services, schemas e UI
- **Multi-Tenancy Nativo:** Todas as entidades possuem `tenantId` para isolamento de dados
- **Event-Driven:** Comunicação entre módulos via Event Bus (ADR 004)
- **Validação Zod:** Contratos de API validados com Zod em client e server-side
- **Offline-First:** Suporte a operações offline com sincronização (ADR 005)

### 1.2 Módulo Solar Existente

Atualmente, o módulo solar está **integrado ao monólito** (ADR 003):

**Localização:**

- Backend: `backend/src/modules/solar/`
- Frontend: `frontend/src/modules/solar/`
- Engine: `frontend/src/modules/solar/services/solarEngine.ts`

**Limitações:**

- Acoplado ao contexto do Neonorte | Nexus (autenticação, multi-tenancy)
- Não pode ser usado isoladamente
- Dificulta reutilização em outros contextos (mobile, calculadora pública)

---

## 2. Proposta: Solar Dimension App Standalone

### 2.1 Visão Geral

Criar uma **aplicação modular standalone** que:

1. **Opera Independentemente:** Pode ser deployada e usada sem o Neonorte | Nexus
2. **Mantém Compatibilidade:** Arquitetura permite integração futura via:
   - Microserviço (API REST + Event Bus)
   - Biblioteca compartilhada (NPM package)
   - Módulo embarcado (código copiado)
3. **Segue Padrões Neonorte | Nexus:** Mesmos princípios arquiteturais (modular, Zod, event-driven)

### 2.2 Arquitetura Proposta

```
solar-dimension-app/
├── packages/
│   ├── core/                    # Lógica de Negócio Pura (Hexagonal)
│   │   ├── domain/              # SolarCalculator, IrradiationEngine, etc
│   │   ├── schemas/             # Contratos Zod
│   │   └── types/               # TypeScript Interfaces
│   │
│   ├── api/                     # Backend (Node.js + Fastify)
│   │   ├── controllers/
│   │   ├── services/            # Orquestração (usa @core)
│   │   ├── middleware/
│   │   └── prisma/              # Persistência
│   │
│   ├── web/                     # Frontend (React + Vite)
│   │   ├── components/
│   │   ├── views/
│   │   └── hooks/
│   │
│   └── shared/                  # Utilitários Compartilhados
│
├── docs/
│   ├── architecture/
│   ├── integration-guide.md
│   └── api-reference.md
│
└── deployment/
    ├── docker/
    └── kubernetes/
```

**Princípio Chave:** **Hexagonal Architecture (Ports & Adapters)**

- **Core Domain:** Lógica de cálculo pura, sem dependências externas
- **Ports:** Interfaces (IEquipmentRepository, IIrradiationProvider)
- **Adapters:** Implementações (PrismaRepository, ANEELProvider, InMemoryRepository)

**Benefício:** Core pode ser testado isoladamente e adaptadores podem ser trocados sem alterar lógica de negócio.

---

## 3. Estratégias de Integração com Neonorte | Nexus

### Comparação

| Aspecto            | Microserviço | Biblioteca NPM  | Módulo Embarcado |
| ------------------ | ------------ | --------------- | ---------------- |
| **Deployment**     | Independente | Dependente      | Dependente       |
| **Latência**       | Alta (rede)  | Zero            | Zero             |
| **Escalabilidade** | Excelente    | Limitada        | Limitada         |
| **Complexidade**   | Alta         | Média           | Baixa            |
| **Recomendado**    | Produção     | Desenvolvimento | MVP              |

### 3.1 Microserviço (Produção)

**Arquitetura:**

```
Neonorte | Nexus Frontend → Neonorte | Nexus API Gateway → Solar API (Microserviço)
                                    ↓
                              Event Bus (RabbitMQ)
                                    ↓
                              Neonorte | Nexus Backend (Subscriber)
```

**Comunicação:**

- **Síncrona:** REST API para cálculos em tempo real
- **Assíncrona:** Event Bus para sincronização de propostas

**Eventos:**

- `solar.proposal.created` (Solar → Neonorte | Nexus)
- `commercial.deal.won` (Neonorte | Nexus → Solar)

**Implementação:**

- API Gateway no Neonorte | Nexus faz proxy para Solar API
- Autenticação via API Key
- Circuit Breaker para resiliência
- Logs e métricas compartilhados

### 3.2 Biblioteca Compartilhada (Desenvolvimento)

**Arquitetura:**

```
@neonorte/solar-core (NPM Package)
    ↓
    ├── Neonorte | Nexus Backend (npm install)
    ├── Solar App (npm install)
    └── Mobile App (npm install)
```

**Benefícios:**

- Zero latência
- Tipagem compartilhada
- Refatoração atômica

**Desafios:**

- Acoplamento de versões
- Build mais complexo

### 3.3 Módulo Embarcado (MVP - Recomendado para Fase 1)

**Arquitetura:**

```
nexus-monolith/backend/src/modules/solar/
    ├── domain/       # Copiado de solar-app/core
    ├── schemas/      # Copiado de solar-app/core
    └── services/     # Adaptadores Neonorte | Nexus
```

**Benefícios:**

- Simplicidade
- Sem overhead de rede
- Fácil debugging

**Desafios:**

- Código duplicado
- Sincronização manual

---

## 4. Requisitos Técnicos

### 4.1 Funcionais (Resumo)

| ID     | Requisito                              | Prioridade     |
| ------ | -------------------------------------- | -------------- |
| RF-001 | Cálculo de potência do sistema (kWp)   | CRÍTICA        |
| RF-002 | Seleção automática de equipamentos     | CRÍTICA        |
| RF-003 | Análise financeira (payback, TIR, VPL) | ALTA           |
| RF-004 | Geração de proposta em PDF             | ALTA           |
| RF-005 | CRUD de módulos fotovoltaicos          | MÉDIA          |
| RF-006 | CRUD de inversores                     | MÉDIA          |
| RF-007 | Kits pré-configurados                  | BAIXA          |
| RF-008 | Consulta de irradiação solar           | CRÍTICA        |
| RF-009 | Sincronização com Neonorte | Nexus (eventos)      | BAIXA (Fase 2) |

### 4.2 Não-Funcionais (Resumo)

| ID      | Requisito               | Alvo            | Crítico      |
| ------- | ----------------------- | --------------- | ------------ |
| RNF-001 | Tempo de cálculo        | < 500ms         | < 1s         |
| RNF-002 | Geração de PDF          | < 2s            | < 5s         |
| RNF-003 | API Response Time (p95) | < 200ms         | < 500ms      |
| RNF-007 | Validação Zod           | 100%            | 100%         |
| RNF-008 | Rate Limiting           | 10-1000 req/min | Configurável |
| RNF-010 | Cobertura de Testes     | 80% (core)      | 60% (api)    |

### 4.3 Segurança

- **Validação:** Zod em client e server-side (obrigatório)
- **Rate Limiting:** Anônimos (10 req/min), Autenticados (100 req/min), API Keys (1000 req/min)
- **Autenticação:** JWT (opcional), API Keys (integração), OAuth2 (futuro)
- **Multi-Tenancy:** Suporte desde o início, mas não obrigatório

---

## 5. Modelo de Dados

### 5.1 Entidades Principais

**SolarProposal:**

```prisma
model SolarProposal {
  id              String   @id @default(cuid())

  // Input
  consumptionKwh  Float
  cityCode        String   // Código IBGE
  roofType        RoofType

  // Output
  systemSizeKwp   Float
  moduleCount     Int
  inverterModel   String
  totalInvestment Decimal
  paybackYears    Float

  // Metadata
  tenantId        String?  // Opcional (multi-tenancy)
  externalLeadId  String?  // Integração Neonorte | Nexus

  createdAt       DateTime @default(now())
}
```

**SolarModule:**

```prisma
model SolarModule {
  id          String  @id
  brand       String
  model       String
  powerWp     Int     // Potência em Watts
  efficiency  Float   // %
  price       Decimal

  // Elétrico
  voc         Float   // Tensão circuito aberto
  isc         Float   // Corrente curto-circuito
  vmp         Float   // Tensão ponto máxima potência
  imp         Float   // Corrente ponto máxima potência
}
```

**SolarInverter:**

```prisma
model SolarInverter {
  id          String  @id
  brand       String
  model       String
  powerKw     Float
  phases      Int     // 1, 2 ou 3

  // Elétrico
  maxInputVoltage    Float
  mpptTrackers       Int
  stringsPerMppt     Int
  maxEfficiency      Float  // %
}
```

### 5.2 Compatibilidade com Neonorte | Nexus

O schema standalone é **compatível** com o schema do Neonorte | Nexus:

- Campos obrigatórios são idênticos
- Campos opcionais (`tenantId`, `externalLeadId`) permitem integração
- Enums são compartilhados via Zod schemas

---

## 6. Roadmap de Implementação

### Fase 1: Fundação (2 semanas)

**Objetivo:** Criar core domain e validar conceito

- [ ] Setup de monorepo (Turborepo/Nx)
- [ ] Implementar `SolarCalculator` (core domain)
- [ ] Definir schemas Zod completos
- [ ] Testes unitários (cobertura >= 80%)
- [ ] Documentação de arquitetura

**Entregável:** Core testado e documentado

---

### Fase 2: API (2 semanas)

**Objetivo:** Backend funcional com persistência

- [ ] Backend REST (Fastify)
- [ ] Persistência Prisma (PostgreSQL)
- [ ] CRUD de catálogo (módulos, inversores)
- [ ] Consulta de irradiação (cache Redis)
- [ ] Documentação Swagger

**Entregável:** API REST documentada e testada

---

### Fase 3: Frontend (3 semanas)

**Objetivo:** Interface de usuário completa

- [ ] Wizard de dimensionamento (React)
- [ ] Geração de PDF (pdfkit/puppeteer)
- [ ] Catálogo admin (CRUD UI)
- [ ] Dashboard de propostas
- [ ] Responsividade mobile

**Entregável:** Aplicação web funcional

---

### Fase 4: Integração (1 semana)

**Objetivo:** Integrar com Neonorte | Nexus Monolith

- [ ] Event Bus (RabbitMQ/Redis Pub/Sub)
- [ ] Sincronização de propostas
- [ ] Multi-tenancy ativo
- [ ] Testes de integração E2E

**Entregável:** Integração funcional com Neonorte | Nexus

---

### Fase 5: Produção (1 semana)

**Objetivo:** Deploy em produção

- [ ] Otimizações de performance
- [ ] Observabilidade completa (logs, métricas, tracing)
- [ ] Deploy em Kubernetes
- [ ] Testes de carga (100 req/s)
- [ ] Runbook de operações

**Entregável:** Aplicação em produção

---

## 7. Estimativas

### 7.1 Esforço

| Fase      | Duração       | Desenvolvedores | Total (pessoa-semana) |
| --------- | ------------- | --------------- | --------------------- |
| Fase 1    | 2 semanas     | 1               | 2                     |
| Fase 2    | 2 semanas     | 1-2             | 3                     |
| Fase 3    | 3 semanas     | 2               | 6                     |
| Fase 4    | 1 semana      | 1               | 1                     |
| Fase 5    | 1 semana      | 1               | 1                     |
| **Total** | **9 semanas** | **1-2**         | **13**                |

### 7.2 Custos (Estimativa)

**Desenvolvimento:**

- 13 pessoa-semanas × R$ 8.000/semana = **R$ 104.000**

**Infraestrutura (mensal):**

- Kubernetes (2 nodes): R$ 500/mês
- PostgreSQL (RDS): R$ 300/mês
- Redis: R$ 100/mês
- S3 (PDFs): R$ 50/mês
- **Total:** R$ 950/mês

---

## 8. Riscos e Mitigações

| Risco                               | Probabilidade | Impacto | Mitigação                                           |
| ----------------------------------- | ------------- | ------- | --------------------------------------------------- |
| Dados de irradiação desatualizados  | Média         | Alto    | Cache com TTL curto, múltiplas fontes (ANEEL, NASA) |
| Performance de geração de PDF       | Baixa         | Médio   | Otimizar templates, usar workers assíncronos        |
| Complexidade de integração Neonorte | Nexus    | Alta          | Alto    | **Começar standalone, integrar depois (Fase 4)**    |
| Catálogo de equipamentos incompleto | Média         | Médio   | Seeds com dados reais, CRUD robusto                 |
| Escalabilidade insuficiente         | Baixa         | Alto    | Horizontal scaling, load balancing, cache           |

---

## 9. Recomendações

### 9.1 Estratégia de Implementação

**Recomendação:** Abordagem **Incremental**

1. **Fase 1-3:** Desenvolver aplicação **standalone** completa
   - Validar conceito
   - Testar em produção isoladamente
   - Coletar feedback de usuários

2. **Fase 4:** Integrar ao Neonorte | Nexus via **Módulo Embarcado**
   - Menor complexidade
   - Facilita debugging
   - Permite validação rápida

3. **Futuro:** Migrar para **Microserviço**
   - Quando escala exigir
   - Quando múltiplas aplicações consumirem
   - Quando deployment independente for necessário

### 9.2 Estratégia de Integração

**Fase 1 (MVP):** Módulo Embarcado

- Copiar core domain para `nexus-monolith/backend/src/modules/solar/`
- Adaptar services para usar Prisma do Neonorte | Nexus
- Emitir eventos internos do Neonorte | Nexus

**Fase 2 (Produção):** Microserviço

- Deploy standalone em Kubernetes
- API Gateway no Neonorte | Nexus faz proxy
- Event Bus (RabbitMQ) para sincronização
- Circuit Breaker para resiliência

### 9.3 Priorização de Funcionalidades

**MVP (Fase 1-3):**

- ✅ Cálculo de dimensionamento
- ✅ Seleção de equipamentos
- ✅ Análise financeira básica (payback)
- ✅ Geração de PDF simples
- ✅ Catálogo de módulos e inversores

**Fase 4 (Integração):**

- ✅ Sincronização com Neonorte | Nexus
- ✅ Multi-tenancy
- ✅ Event Bus

**Futuro (Pós-MVP):**

- 🔲 Análise financeira avançada (TIR, VPL)
- 🔲 Kits pré-configurados
- 🔲 Simulação de sombreamento
- 🔲 Integração com Google Maps (área de telhado)
- 🔲 Calculadora pública (lead generation)

---

## 10. Conclusão

### 10.1 Benefícios da Abordagem Standalone

1. **Flexibilidade:** Pode ser usado em múltiplos contextos (Neonorte | Nexus, mobile, web pública)
2. **Testabilidade:** Core isolado facilita testes unitários
3. **Manutenibilidade:** Fronteiras claras facilitam evolução
4. **Escalabilidade:** Pode escalar independentemente do Neonorte | Nexus
5. **Reutilização:** Lógica de cálculo pode ser compartilhada

### 10.2 Alinhamento com Neonorte | Nexus

A arquitetura proposta **segue os mesmos princípios** do Neonorte | Nexus:

- ✅ Modular (Hexagonal Architecture)
- ✅ Validação Zod obrigatória
- ✅ Event-Driven (opcional)
- ✅ Multi-Tenancy (opcional)
- ✅ Offline-First (futuro)

### 10.3 Próximos Passos

1. **Aprovação:** Revisar e aprovar ADR 008
2. **Setup:** Criar repositório e estrutura de monorepo
3. **POC:** Implementar `SolarCalculator` básico (1 semana)
4. **Validação:** Testar cálculos com dados reais
5. **Desenvolvimento:** Seguir roadmap de 9 semanas

---

## Artefatos Criados

Este estudo gerou os seguintes documentos:

1. **ADR 008:** Decisão arquitetural sobre aplicação standalone
   - `docs/adr/008-standalone-solar-app.md`

2. **Arquitetura Técnica:** Diagramas C4, fluxos de dados, modelo de dados
   - `docs/architecture/solar-app-standalone.md`

3. **Requisitos de Desenvolvimento:** Funcionais, não-funcionais, segurança
   - `docs/guides/solar-app-development-requirements.md`

4. **Guia de Integração:** Implementações práticas para integração com Neonorte | Nexus
   - `docs/guides/solar-app-integration-guide.md`

5. **Resumo Executivo:** Este documento
   - `docs/SOLAR_APP_STUDY.md`

---

## Aprovação

**Aguardando aprovação de:**

- [ ] Arquiteto de Software
- [ ] Tech Lead
- [ ] Product Owner
- [ ] Engenheiro de Segurança

**Após aprovação, iniciar Fase 1 (Fundação).**

---

**Versão:** 1.0.0  
**Data:** 2026-01-26  
**Autor:** Antigravity (Senior Software Architect)

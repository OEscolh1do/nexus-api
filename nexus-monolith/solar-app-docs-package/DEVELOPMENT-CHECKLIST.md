# Checklist de Desenvolvimento - Solar App

## Fase 1: Fundação (2 semanas)

### Setup
- [ ] Leu README.md
- [ ] Leu 01-OVERVIEW.md
- [ ] Leu 04-DIAGRAMS.md
- [ ] Leu 02-ARCHITECTURE.md (Seções 1-3)
- [ ] Configurou ambiente (Node.js, TypeScript, Prisma)
- [ ] Criou repositório Git
- [ ] Inicializou monorepo (Turborepo/Nx)

### Core Domain
- [ ] Criou estrutura de pastas (packages/core/domain)
- [ ] Implementou SolarCalculator.ts
- [ ] Implementou IrradiationEngine.ts
- [ ] Implementou FinancialAnalyzer.ts
- [ ] Definiu schemas Zod (input.schemas.ts, output.schemas.ts)
- [ ] Criou testes unitários (>= 80% cobertura)
- [ ] Todos os testes passando

### Entregável Fase 1
- [ ] Core domain testado e funcionando
- [ ] Documentação atualizada (README do core)
- [ ] Code review realizado

---

## Fase 2: API (2 semanas)

### Backend
- [ ] Criou estrutura de pastas (packages/api)
- [ ] Configurou Fastify
- [ ] Implementou controllers
- [ ] Implementou services (orquestração)
- [ ] Configurou Prisma (schema.prisma)
- [ ] Criou migrations
- [ ] Implementou seeds (dados de teste)

### Catálogo
- [ ] CRUD de módulos fotovoltaicos
- [ ] CRUD de inversores
- [ ] Consulta de irradiação (cache Redis)
- [ ] Validação Zod em todas as rotas

### Segurança
- [ ] Rate limiting implementado
- [ ] Validação de entrada (client + server)
- [ ] Logs estruturados (Pino)

### Entregável Fase 2
- [ ] API REST funcional
- [ ] Documentação Swagger
- [ ] Testes de integração passando

---

## Fase 3: Frontend (3 semanas)

### Setup
- [ ] Criou estrutura de pastas (packages/web)
- [ ] Configurou Vite + React
- [ ] Configurou TailwindCSS

### Wizard
- [ ] Implementou wizard de dimensionamento
- [ ] Validação Zod no frontend
- [ ] Integração com API

### PDF
- [ ] Implementou geração de PDF
- [ ] Templates profissionais
- [ ] Gráficos de geração vs consumo

### Admin
- [ ] CRUD de catálogo (UI)
- [ ] Dashboard de propostas
- [ ] Responsividade mobile

### Entregável Fase 3
- [ ] Aplicação web completa
- [ ] Testes E2E (Playwright)
- [ ] Performance dentro dos alvos

---

## Fase 4: Integração (1 semana)

### Event Bus
- [ ] Leu 06-INTEGRATION-GUIDE.md
- [ ] Configurou RabbitMQ/Redis Pub/Sub
- [ ] Implementou event publisher
- [ ] Implementou event subscriber

### Multi-tenancy
- [ ] Adicionou tenantId em todas as queries
- [ ] Testou isolamento de dados

### Entregável Fase 4
- [ ] Integração com Neonorte | Nexus funcional
- [ ] Testes de integração E2E passando

---

## Fase 5: Produção (1 semana)

### Otimizações
- [ ] Performance dentro dos alvos (< 500ms)
- [ ] Geração de PDF < 2s
- [ ] Throughput >= 100 req/s

### Observabilidade
- [ ] Logs estruturados
- [ ] Métricas Prometheus
- [ ] Tracing OpenTelemetry
- [ ] Alertas configurados

### Deployment
- [ ] Dockerfile otimizado
- [ ] Docker Compose funcional
- [ ] Kubernetes manifests
- [ ] CI/CD pipeline (GitHub Actions)

### Entregável Fase 5
- [ ] Aplicação em produção
- [ ] Runbook de operações
- [ ] Documentação completa

---

## Critérios de Qualidade

### Código
- [ ] ESLint sem warnings
- [ ] Prettier formatado
- [ ] TypeScript strict mode
- [ ] Funções < 50 linhas
- [ ] Complexidade ciclomática < 10

### Testes
- [ ] Cobertura >= 80% (core)
- [ ] Cobertura >= 60% (api)
- [ ] Cobertura >= 50% (web)
- [ ] Todos os testes passando

### Documentação
- [ ] README.md completo
- [ ] API Reference (Swagger)
- [ ] Comentários em lógica complexa
- [ ] Changelog atualizado

---

**Data de Início:** _______________
**Data de Conclusão Prevista:** _______________
**Desenvolvedor:** _______________

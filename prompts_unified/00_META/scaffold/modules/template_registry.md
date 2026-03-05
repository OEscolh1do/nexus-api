---
module_type: registry
version: 1.0
description: Registro dinâmico de templates disponíveis no sistema Neonorte | Nexus Prompt Engineering
---

# Template Registry

## Objetivo

Manter registro centralizado de todos os templates disponíveis com metadata rica para classificação automática.

---

## Templates Registrados

### Foundation (Base)

```yaml
- id: TEMPLATE_01_ARCHITECT
  name: "Arquiteto - Planejamento de Features"
  category: foundation
  complexity: high
  estimated_time: 30-60min
  keywords: [planejar, arquitetura, design, feature, funcionalidade, sistema]
  probability_threshold: 75%
  prerequisites: []
  path: ../../02_FOUNDATION/TEMPLATE_01_ARCHITECT.md
  description: "Planejar nova funcionalidade com análise arquitetural completa"

- id: TEMPLATE_02_ENGINEER
  name: "Engenheiro - Implementação"
  category: foundation
  complexity: medium
  estimated_time: 20-40min
  keywords: [implementar, criar, desenvolver, construir, executar, fazer]
  probability_threshold: 70%
  prerequisites: [implementation_plan.md]
  path: ../../02_FOUNDATION/TEMPLATE_02_ENGINEER.md
  description: "Implementar plano aprovado com qualidade e segurança"

- id: TEMPLATE_03_REFACTOR
  name: "Refatoração de Código"
  category: foundation
  complexity: medium
  estimated_time: 20-40min
  keywords: [refatorar, melhorar, limpar, otimizar, reorganizar]
  probability_threshold: 80%
  prerequisites: []
  path: ../../02_FOUNDATION/TEMPLATE_03_REFACTOR.md
  description: "Melhorar código existente mantendo funcionalidade"

- id: TEMPLATE_04_DEBUG
  name: "Debugging de Bugs"
  category: foundation
  complexity: variable
  estimated_time: 15-60min
  keywords: [bug, erro, falha, problema, não funciona, quebrado]
  probability_threshold: 95%
  prerequisites: [error_logs]
  path: ../../02_FOUNDATION/TEMPLATE_04_DEBUG.md
  description: "Diagnosticar e corrigir bugs"

- id: TEMPLATE_05_DOCS
  name: "Criação de Documentação"
  category: foundation
  complexity: low
  estimated_time: 15-30min
  keywords: [documentar, documentação, readme, guia, manual]
  probability_threshold: 90%
  prerequisites: []
  path: ../../02_FOUNDATION/TEMPLATE_05_DOCS.md
  description: "Criar documentação clara e útil"

- id: TEMPLATE_06_TESTS
  name: "Geração de Testes"
  category: foundation
  complexity: medium
  estimated_time: 20-40min
  keywords: [teste, test, spec, testar, validar]
  probability_threshold: 90%
  prerequisites: [code_to_test]
  path: ../../02_FOUNDATION/TEMPLATE_06_TESTS.md
  description: "Gerar testes automatizados"
```

### Database

```yaml
- id: ADD_FIELD_TO_MODEL
  name: "Adicionar Campo ao Modelo"
  category: database
  complexity: low
  estimated_time: 10-15min
  keywords: [campo, coluna, atributo, propriedade, adicionar, modelo, tabela]
  probability_threshold: 85%
  prerequisites: [schema.prisma]
  path: ../../03_DATABASE/ADD_FIELD_TO_MODEL.md
  description: "Adicionar novo campo a modelo Prisma existente"

- id: CREATE_NEW_MODEL
  name: "Criar Novo Modelo"
  category: database
  complexity: medium
  estimated_time: 15-25min
  keywords: [modelo, tabela, entidade, schema, criar, novo]
  probability_threshold: 85%
  prerequisites: [schema.prisma]
  path: ../../03_DATABASE/CREATE_NEW_MODEL.md
  description: "Criar novo modelo Prisma com relações"

- id: ADD_RELATION
  name: "Adicionar Relação entre Modelos"
  category: database
  complexity: medium
  estimated_time: 15-20min
  keywords: [relação, relacionamento, foreign key, referência, associação]
  probability_threshold: 80%
  prerequisites: [schema.prisma, models_exist]
  path: ../../03_DATABASE/ADD_RELATION.md
  description: "Adicionar relação entre modelos existentes"

- id: DB_AUDIT_SCHEMA
  name: "Auditoria de Schema"
  category: database
  complexity: high
  estimated_time: 30-45min
  keywords: [auditoria, audit, performance, otimização, índices, schema]
  probability_threshold: 85%
  prerequisites: [schema.prisma]
  path: ../../03_DATABASE/DB_AUDIT_SCHEMA.md
  description: "Auditar schema para performance e boas práticas"
```

### Backend API

```yaml
- id: CREATE_CUSTOM_ENDPOINT
  name: "Criar Endpoint Customizado"
  category: backend
  complexity: medium
  estimated_time: 20-30min
  keywords: [endpoint, rota, route, API, criar, customizado]
  probability_threshold: 85%
  prerequisites: []
  path: ../../04_BACKEND_API/CREATE_CUSTOM_ENDPOINT.md
  description: "Criar endpoint API customizado"

- id: ADD_ZOD_VALIDATION
  name: "Adicionar Validação Zod"
  category: backend
  complexity: low
  estimated_time: 10-15min
  keywords: [validação, zod, validar, schema, input]
  probability_threshold: 90%
  prerequisites: []
  path: ../../04_BACKEND_API/ADD_ZOD_VALIDATION.md
  description: "Adicionar validação Zod a endpoint"

- id: CREATE_MODULE_CONTROLLER
  name: "Criar Controller Modular"
  category: backend
  complexity: medium
  estimated_time: 20-30min
  keywords: [controller, controlador, módulo, criar]
  probability_threshold: 80%
  prerequisites: []
  path: ../../04_BACKEND_API/CREATE_MODULE_CONTROLLER.md
  description: "Criar controller modular para novo recurso"

- id: CREATE_SERVICE_LAYER
  name: "Criar Service Layer"
  category: backend
  complexity: medium
  estimated_time: 25-35min
  keywords: [service, serviço, camada, lógica, negócio]
  probability_threshold: 80%
  prerequisites: []
  path: ../../04_BACKEND_API/CREATE_SERVICE_LAYER.md
  description: "Extrair lógica de negócio para service layer"

- id: API_AUDIT_ENDPOINT
  name: "Auditoria de Endpoint API"
  category: backend
  complexity: high
  estimated_time: 30-45min
  keywords: [auditoria, audit, API, segurança, performance]
  probability_threshold: 85%
  prerequisites: [endpoint_code]
  path: ../../04_BACKEND_API/API_AUDIT_ENDPOINT.md
  description: "Auditar endpoint para segurança e performance"
```

### Frontend UI

```yaml
- id: CREATE_CRUD_VIEW
  name: "Criar View CRUD"
  category: frontend
  complexity: medium
  estimated_time: 30-45min
  keywords: [view, tela, página, CRUD, criar, listagem]
  probability_threshold: 80%
  prerequisites: []
  path: ../../05_FRONTEND_UI/CREATE_CRUD_VIEW.md
  description: "Criar view CRUD completa (listagem + formulário)"

- id: ADD_FORM_FIELD
  name: "Adicionar Campo a Formulário"
  category: frontend
  complexity: low
  estimated_time: 10-15min
  keywords: [campo, input, formulário, form, adicionar]
  probability_threshold: 85%
  prerequisites: [form_component]
  path: ../../05_FRONTEND_UI/ADD_FORM_FIELD.md
  description: "Adicionar campo a formulário existente"

- id: CREATE_WIZARD
  name: "Criar Wizard Multi-Etapas"
  category: frontend
  complexity: high
  estimated_time: 45-60min
  keywords: [wizard, multi-etapas, stepper, fluxo, passo]
  probability_threshold: 90%
  prerequisites: []
  path: ../../05_FRONTEND_UI/CREATE_WIZARD.md
  description: "Criar wizard com múltiplas etapas"

- id: CREATE_DASHBOARD
  name: "Criar Dashboard"
  category: frontend
  complexity: high
  estimated_time: 45-60min
  keywords: [dashboard, painel, widgets, métricas, KPI]
  probability_threshold: 85%
  prerequisites: []
  path: ../../05_FRONTEND_UI/CREATE_DASHBOARD.md
  description: "Criar dashboard com widgets e métricas"

- id: REDESIGN_SIDEBAR
  name: "Redesenhar Sidebar"
  category: frontend
  complexity: medium
  estimated_time: 30-40min
  keywords: [sidebar, menu, navegação, redesign, redesenhar]
  probability_threshold: 85%
  prerequisites: [sidebar_component]
  path: ../../05_FRONTEND_UI/REDESIGN_SIDEBAR.md
  description: "Redesenhar sidebar/navegação"

- id: UX_AUDIT_VIEW
  name: "Auditoria UX de View"
  category: frontend
  complexity: high
  estimated_time: 30-45min
  keywords: [UX, usabilidade, auditoria, audit, confuso, melhorar]
  probability_threshold: 85%
  prerequisites: [view_component]
  path: ../../05_FRONTEND_UI/UX_AUDIT_VIEW.md
  description: "Auditar UX de view existente e sugerir melhorias"
```

### Business Modules

```yaml
- id: SOLAR_PROPOSAL_ENHANCEMENT
  name: "Melhorias em Proposta Solar"
  category: business
  complexity: high
  estimated_time: 45-60min
  keywords: [solar, proposta, orçamento, energia]
  probability_threshold: 90%
  prerequisites: []
  path: ../../06_BUSINESS_MODULES/SOLAR_PROPOSAL_ENHANCEMENT.md
  description: "Melhorias no módulo de propostas solares"

- id: LEAD_PIPELINE_STAGE
  name: "Gestão de Pipeline de Leads"
  category: business
  complexity: medium
  estimated_time: 30-45min
  keywords: [lead, pipeline, CRM, funil, vendas]
  probability_threshold: 85%
  prerequisites: []
  path: ../../06_BUSINESS_MODULES/LEAD_PIPELINE_STAGE.md
  description: "Gestão de estágios de pipeline de leads"

- id: LOGIC_AUDIT_FLOW
  name: "Auditoria de Lógica de Negócio"
  category: business
  complexity: high
  estimated_time: 40-60min
  keywords: [lógica, negócio, business, auditoria, audit, fluxo]
  probability_threshold: 80%
  prerequisites: [business_logic_code]
  path: ../../06_BUSINESS_MODULES/LOGIC_AUDIT_FLOW.md
  description: "Auditar lógica de negócio e fluxos"
```

### Troubleshooting

```yaml
- id: PRISMA_MIGRATION_ERROR
  name: "Erro de Migração Prisma"
  category: troubleshooting
  complexity: variable
  estimated_time: 15-30min
  keywords: [prisma, migration, migração, erro, falha]
  probability_threshold: 95%
  prerequisites: [error_message]
  path: ../../08_TROUBLESHOOTING/PRISMA_MIGRATION_ERROR.md
  description: "Resolver erros de migração Prisma"

- id: CORS_ISSUE
  name: "Problema de CORS"
  category: troubleshooting
  complexity: low
  estimated_time: 10-20min
  keywords: [CORS, cross-origin, bloqueado, blocked]
  probability_threshold: 95%
  prerequisites: [error_message]
  path: ../../08_TROUBLESHOOTING/CORS_ISSUE.md
  description: "Resolver problemas de CORS"
```

---

## Como Usar Este Módulo

### Para o Scaffold Core

```javascript
// Pseudocódigo de uso
const registry = load_module("template_registry.md");
const matches = registry.find_templates(user_intent, keywords);

// Retorna:
[
  {
    id: "ADD_FIELD_TO_MODEL",
    confidence: 0.92,
    keywords_matched: ["campo", "modelo", "adicionar"],
  },
  {
    id: "CREATE_NEW_MODEL",
    confidence: 0.45,
    keywords_matched: ["modelo"],
  },
];
```

### Para Adicionar Novo Template

1. Adicione entrada YAML neste arquivo
2. Preencha metadata completa
3. Scaffold Core descobrirá automaticamente

---

**Total de Templates:** 27  
**Categorias:** 6 (foundation, database, backend, frontend, business, troubleshooting)  
**Última Atualização:** 2026-01-25

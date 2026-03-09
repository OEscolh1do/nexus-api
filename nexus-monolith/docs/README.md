# Documentação do Neonorte | Nexus Monolith

> **Atualizado:** 2026-03-09

Bem-vindo à documentação viva do Neonorte | Nexus.

## Estrutura

### 🧠 ADRs (Architecture Decision Records)

Decisões arquiteturais fundamentais que moldam o sistema. Se você quer entender **por que** algo é feito de determinada maneira, comece aqui.

- [001 - Adoção do Monólito Modular](./adr/001-modular-monolith.md)
- [002 - Stack Técnica de Operações](./adr/002-ops-tech-stack.md)
- [003 - Multi-Tenancy e RLS](./adr/003-multi-tenancy.md)
- [004 - Arquitetura Orientada a Eventos](./adr/004-event-driven-architecture.md)
- [007 - Expansão do Módulo Commercial](./adr/007-commercial-module-expansion.md)
- [008 - Aplicação Standalone de Dimensionamento Fotovoltaico](./adr/008-standalone-solar-app.md)

### 🏗️ Mapa do Sistema

Visão geral dos módulos e suas responsabilidades.

- [Diagrama de Arquitetura C4 (Mermaid)](./architecture/system-context.mermaid)
- [Glossário de Domínio (DDD)](./glossary.md)
  _(Consulte `CONTEXT.md` na raiz para o schema de dados atualizado)_

### 🗺️ Mapas de Interface

Documentação detalhada de cada módulo do sistema:

- [Índice Completo de Mapas](./map_nexus_monolith/README.md) - Visão consolidada de todos os módulos
- [Core Views](./map_nexus_monolith/CORE_VIEW_MAP.md) - Componentes compartilhados e infraestrutura
- [Operations (Ops)](./map_nexus_monolith/OPS_VIEW_MAP.md) - Gestão de projetos e tarefas
- [Commercial](./map_nexus_monolith/COMMERCIAL_VIEW_MAP.md) - CRM e funil de vendas
- [Executive](./map_nexus_monolith/EXECUTIVE_VIEW_MAP.md) - Dashboard executivo e estratégia

### 🛡️ Segurança e Governança

- [Matriz RBAC](./security/rbac-matrix.md) - Permissões por role (8 roles, 6 módulos)
- [Enterprise Roadmap](./enterprise_roadmap/README.md) - Fases 1–3 (todas concluídas)

### 🚀 Guia de Desenvolvimento

1. **[Como Criar um Novo Módulo](./guides/create-module.md)** (Leitura Obrigatória)
2. **Regra de Ouro:** Não adicione código fora de `src/modules`.
3. **RLS:** Use `withTenant(tx)` em TODAS as queries Prisma.
4. **Validação:** Crie o Schema Zod ANTES de escrever o Controller.

### 🚢 Deploy e Infraestrutura

- [Infraestrutura de Produção](./deployment/infrastructure.md) - Fly.io, Cloudflare Pages, Supabase

### 📋 Estudos e Planejamento

- [Arquitetura Solar App](./architecture/solar-app-standalone.md) - Estudo de app standalone
  - [Requisitos de Desenvolvimento](./guides/solar-app-development-requirements.md)
  - [Guia de Integração](./guides/solar-app-integration-guide.md)

## Manutenção

Esta documentação deve evoluir junto com o código.
Ao criar um novo módulo ou refatorar uma parte crítica, **crie um novo ADR**.

> "Código é lido muito mais vezes do que é escrito."

# Documentação do Neonorte | Nexus Monolith

Bem-vindo à documentação viva do Neonorte | Nexus.

## Estrutura

### 🧠 ADRs (Architecture Decision Records)

Decisões arquiteturais fundamentais que moldam o sistema. Se você quer entender **por que** algo é feito de determinada maneira, comece aqui.

- [001 - Adoção do Monólito Modular](./adr/001-modular-monolith.md)
- [002 - Stack Técnica de Operações](./adr/002-ops-tech-stack.md)
- [003 - Multi-Tenancy](./adr/003-multi-tenancy.md)
- [003 - Migração do Solar Engine](./adr/003-solar-engine-migration.md)
- [004 - Arquitetura Orientada a Eventos](./adr/004-event-driven-architecture.md)
- [005 - Protocolo Offline-First](./adr/005-offline-first.md)
- [006 - Compatibilidade TypeScript com Bundlers](./adr/006-typescript-bundler-compatibility.md)
- [007 - Expansão do Módulo Commercial](./adr/007-commercial-module-expansion.md)
- [008 - Aplicação Standalone de Dimensionamento Fotovoltaico](./adr/008-standalone-solar-app.md)

### 🏗️ Mapa do Sistema

Visão geral dos módulos e suas responsabilidades.

- [Diagrama de Arquitetura (Mermaid)](./architecture/system-context.mermaid)
- [Glossário de Domínio (DDD)](./glossary.md)
  _(Consulte `CONTEXT.md` na raiz para o schema de dados atualizado)_

### 🗺️ Mapas de Interface

Documentação detalhada de cada módulo do sistema:

- [Core Views](./map_nexus_monolith/CORE_VIEW_MAP.md) - Componentes compartilhados e infraestrutura
- [Operations (Ops)](./map_nexus_monolith/OPS_VIEW_MAP.md) - Gestão de projetos e tarefas
- [Commercial](./map_nexus_monolith/COMMERCIAL_VIEW_MAP.md) - CRM e funil de vendas
- [Executive](./map_nexus_monolith/EXECUTIVE_VIEW_MAP.md) - Dashboard executivo e estratégia
- [Academy](./map_nexus_monolith/ACADEMY_VIEW_MAP.md) - Plataforma de treinamento

### 🚀 Guia de Desenvolvimento

1. **[Como Criar um Novo Módulo](./guides/create-module.md)** (Leitura Obrigatória para novos recursos)
2. **Regra de Ouro:** Não adicione código fora de `src/modules`.
3. **Validação:** Crie o Schema Zod ANTES de escrever o Controller.
4. **Frontend:** Use componentes compartilhados de `src/components/ui` sempre que possível.

### 🛠️ Processos de Engenharia

- **Auditoria de Lógica:** Use o [Logic Audit Flow](../prompts/04_BUSINESS_MODULES/LOGIC_AUDIT_FLOW.md) para refatorar regras de negócio complexas.
- **Deploy Windows:** Consulte o [Guia de Deploy Offline](./deployment/windows-server-offline-deploy.md) para ambientes Windows Server com restrição de rede.

### 📋 Estudos e Planejamento

- **[Estudo: Aplicação Standalone de Dimensionamento Fotovoltaico](./SOLAR_APP_STUDY.md)** - Análise completa da arquitetura e estratégias de integração para criação de app modular de dimensionamento solar
  - [Arquitetura Técnica Detalhada](./architecture/solar-app-standalone.md)
  - [Requisitos de Desenvolvimento](./guides/solar-app-development-requirements.md)
  - [Guia de Integração com Neonorte | Nexus](./guides/solar-app-integration-guide.md)

## Manutenção

Esta documentação deve evoluir junto com o código.
Ao criar um novo módulo ou refatorar uma parte crítica, **crie um novo ADR**.

> "Código é lido muito mais vezes do que é escrito."

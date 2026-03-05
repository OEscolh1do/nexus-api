---
module_type: context_manager
version: 1.0
description: Gestão de contexto do projeto Neonorte | Nexus
---

# Context Manager

```xml
<context_sources>
  - ../../01_KNOWLEDGE/NEXUS_STACK_CONFIG.md (stack tecnológica)
  - ../../../nexus-monolith/docs/CONTEXT.md (arquitetura)
  - ../../../nexus-monolith/backend/prisma/schema.prisma (modelos)
  - ../../../nexus-monolith/backend/package.json (dependências backend)
  - ../../../nexus-monolith/frontend/package.json (dependências frontend)
</context_sources>

<context_injection>
  Ao gerar prompt, injete automaticamente:

  STACK (de NEXUS_STACK_CONFIG.md):
  - Frontend: React 19.2 + Vite + TypeScript + TailwindCSS + Shadcn/UI
  - Backend: Express 5.x + Prisma 5.10.2 + Zod
  - Database: MySQL 8.0

  PADRÕES ARQUITETURAIS:
  - Universal CRUD Controller (backend)
  - Service Layer Pattern (lógica complexa)
  - React Hook Form + Zod (formulários)
  - Atomic Transactions (Prisma)

  MODELOS EXISTENTES (principais):
  - User, Project, OperationalTask, Lead, SolarProposal
</context_injection>
```

**Função:** Injetar contexto do projeto automaticamente em prompts

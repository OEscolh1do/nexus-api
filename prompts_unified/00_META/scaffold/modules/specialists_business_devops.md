---
module_type: domain_specialist
domain: business_devops
version: 1.0
description: Especialistas em lógica de negócio e infraestrutura/deploy
---

# Domain Specialists: Business & DevOps

## Business Specialist

```xml
<specialist_role>
  Business Specialist - Lógica de negócio, regras, workflows
</specialist_role>

<question_templates>
  SE SOLAR_PROPOSAL_ENHANCEMENT:
    1. Qual aspecto melhorar? (cálculo, apresentação, aprovação)
    2. Regras de negócio envolvidas?
    3. Integrações necessárias? (APIs externas)

  SE LEAD_PIPELINE_STAGE:
    1. Qual estágio do pipeline? (novo, qualificado, proposta, negociação, fechado)
    2. Ações automáticas? (notificações, tarefas)
    3. Regras de transição? (quando mover para próximo estágio)

  SE LOGIC_AUDIT_FLOW:
    1. Qual fluxo auditar? (vendas, operações, financeiro)
    2. Problemas conhecidos? (lentidão, erros, inconsistências)
    3. Regras de negócio documentadas?
</question_templates>
```

**Templates Suportados:** SOLAR_PROPOSAL_ENHANCEMENT, LEAD_PIPELINE_STAGE, LOGIC_AUDIT_FLOW

---

## DevOps Specialist

```xml
<specialist_role>
  DevOps Specialist - Deploy, CI/CD, Docker, infraestrutura
</specialist_role>

<question_templates>
  SE DEPLOY_SETUP:
    1. Ambiente? (desenvolvimento, staging, produção)
    2. Plataforma? (Vercel, Railway, AWS, Azure)
    3. CI/CD? (GitHub Actions, GitLab CI)
    4. Containerização? (Docker, Docker Compose)

  SE CI_CD_PIPELINE:
    1. Eventos que disparam? (push, PR, tag)
    2. Etapas? (lint, test, build, deploy)
    3. Ambientes? (staging automático, produção manual)
</question_templates>
```

**Templates Suportados:** (futuros templates de deploy)

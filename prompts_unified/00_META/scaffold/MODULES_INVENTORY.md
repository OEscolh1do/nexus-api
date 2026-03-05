# Inventário de Módulos - Scaffold v3.0

> **Objetivo:** Documentar estrutura modular otimizada para limite de 10 anexos

---

## 📊 Estrutura de Anexos (9 Total)

### Módulos Core (3 anexos)

1. **`template_registry.md`** [ANEXO 1]
   - 27 templates com metadata
   - Classificação automática por keywords
   - ~10KB

2. **`prompt_validator.md`** [ANEXO 2]
   - 22 itens de validação
   - Checklist de qualidade
   - ~4KB

3. **`context_manager.md`** [ANEXO 3]
   - Gestão de contexto do projeto
   - Injeção de stack e padrões
   - ~1KB

---

### Domain Specialists (4 anexos)

4. **`domain_specialists/database_specialist.md`** [ANEXO 4]
   - Perguntas para Prisma/Database
   - Templates: ADD_FIELD_TO_MODEL, CREATE_NEW_MODEL, ADD_RELATION, DB_AUDIT_SCHEMA
   - ~5KB

5. **`domain_specialists/backend_specialist.md`** [ANEXO 5]
   - Perguntas para Backend/API
   - Templates: CREATE_CUSTOM_ENDPOINT, ADD_ZOD_VALIDATION, CREATE_MODULE_CONTROLLER
   - ~1.4KB

6. **`domain_specialists/frontend_specialist.md`** [ANEXO 6]
   - Perguntas para Frontend/UI
   - Templates: CREATE_CRUD_VIEW, ADD_FORM_FIELD, CREATE_WIZARD, REDESIGN_SIDEBAR
   - ~1.2KB

7. **`specialists_business_devops.md`** [ANEXO 7] ⚡ CONSOLIDADO
   - **Business Specialist:** SOLAR_PROPOSAL_ENHANCEMENT, LEAD_PIPELINE_STAGE, LOGIC_AUDIT_FLOW
   - **DevOps Specialist:** DEPLOY_SETUP, CI_CD_PIPELINE
   - ~1.8KB (business 1KB + devops 773 bytes)

---

### Learning & Utilities (2 anexos)

8. **`learning_system.md`** [ANEXO 8] ⚡ CONSOLIDADO
   - **Feedback Loop:** Aprendizado contínuo
   - **Metrics:** KPIs e benchmarks
   - **Versioning:** Rastreabilidade de prompts
   - ~2.7KB (feedback 907b + metrics 990b + versioning 872b)

9. **`fallback_strategies.md`** [ANEXO 9]
   - Estratégias alternativas quando classificação falha
   - ~1.5KB

---

## 🗑️ Arquivos Removidos (Consolidados)

Os seguintes arquivos foram **consolidados** e podem ser **deletados**:

- ❌ `domain_specialists/business_specialist.md` → Consolidado em `specialists_business_devops.md`
- ❌ `domain_specialists/devops_specialist.md` → Consolidado em `specialists_business_devops.md`
- ❌ `feedback_loop.md` → Consolidado em `learning_system.md`
- ❌ `metrics.md` → Consolidado em `learning_system.md`
- ❌ `versioning.md` → Consolidado em `learning_system.md`

---

## 📋 Checklist de Migração

- [x] Criar `specialists_business_devops.md`
- [x] Criar `learning_system.md`
- [ ] Deletar arquivos antigos (5 arquivos)
- [ ] Atualizar referências no `SCAFFOLD_CORE_LEGACY.md` (se necessário)
- [ ] Testar fluxo completo com 9 anexos

---

## 🎯 Benefícios da Consolidação

✅ **Redução:** 12 → 9 anexos (25% de economia)  
✅ **Margem:** 1 anexo livre para expansão futura  
✅ **Coesão:** Módulos relacionados agrupados logicamente  
✅ **Manutenção:** Menos arquivos para gerenciar  
✅ **Performance:** Menos overhead de carregamento

---

## 🔄 Próximas Ações

1. **Deletar arquivos antigos** (5 arquivos listados acima)
2. **Validar referências** no SCAFFOLD_CORE_LEGACY.md
3. **Testar fluxo** com intenção vaga real
4. **Documentar** no README.md

---

**Versão:** 3.0 (Otimizado para 9 Anexos)  
**Data:** 2026-01-26  
**Status:** ✅ Consolidação Completa

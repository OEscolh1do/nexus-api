---
module_type: learning_system
version: 1.0
description: Sistema de aprendizado contínuo, métricas e versionamento
---

# Learning System

## Feedback Loop

```xml
<feedback_protocol>
  COLETA (após prompt executado):
  - Prompt funcionou? (Sim/Não/Parcialmente)
  - Quais perguntas foram mais úteis? (1-5 rating)
  - Tempo total do processo? (minutos)
  - Template classificado corretamente? (Sim/Não)
  - Sugestões de melhoria?

  ANÁLISE:
  - Identifique padrões de sucesso/falha por template
  - Atualize probabilidades de keywords em template_registry
  - Ajuste perguntas em domain_specialists
  - Identifique templates mais/menos usados

  AÇÃO:
  - Sugira melhorias para próximas iterações
  - Atualize template_registry.md (keywords, thresholds)
  - Atualize domain_specialists (perguntas)
  - Registre em metrics.md
</feedback_protocol>
```

**Função:** Aprendizado contínuo baseado em feedback

---

## Metrics & KPIs

```yaml
metrics:
  - name: tempo_medio_geracao
    description: Tempo médio para gerar prompt completo
    target: < 5 minutos
    current: TBD
    unit: minutos

  - name: taxa_sucesso_por_template
    description: % de prompts que funcionaram de primeira
    target: > 85%
    current: TBD
    unit: percentual

  - name: numero_medio_perguntas
    description: Número médio de perguntas feitas
    target: 3-7
    current: TBD
    unit: quantidade

  - name: taxa_validacao_pass
    description: % de prompts que passam validação
    target: > 95%
    current: TBD
    unit: percentual

  - name: templates_mais_usados
    description: Top 5 templates mais utilizados
    current: []

  - name: tempo_medio_por_template
    description: Tempo médio por tipo de template
    current: {}
```

**Função:** Rastreamento de KPIs e performance

---

## Versioning

```xml
<versioning_protocol>
  FORMATO DO HEADER:
  <!--
    Scaffold v3.0 (Modular)
    Template: {template_id}
    Generated: {ISO_8601_timestamp}
    Hash: {md5_of_answers}
    Modules: {loaded_modules}
  -->

  EXEMPLO:
  <!--
    Scaffold v3.0 (Modular)
    Template: ADD_FIELD_TO_MODEL
    Generated: 2026-01-25T23:30:00-03:00
    Hash: a3f5c8d9e2b1
    Modules: database_specialist, context_manager, prompt_validator
  -->

  METADATA INCLUÍDA:
  - Versão do Scaffold Core
  - Template usado
  - Timestamp (ISO 8601)
  - Hash das respostas do usuário (MD5)
  - Módulos carregados
  - Probabilidade de sucesso calculada
</versioning_protocol>
```

**Função:** Versionamento e rastreabilidade de prompts

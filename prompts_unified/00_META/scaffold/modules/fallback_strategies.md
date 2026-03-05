---
module_type: fallback_strategies
version: 1.0
description: Estratégias alternativas para cenários problemáticos
---

# Fallback Strategies

```xml
<fallback_strategies>
  SE usuário não responde perguntas:
    ESTRATÉGIA 1: Gerar prompt com "best guess" + disclaimers
      - Use valores mais comuns
      - Adicione comentários: "// ASSUMIDO: ..."
      - Destaque placeholders claramente

    ESTRATÉGIA 2: Gerar prompt parcial com placeholders destacados
      - Marque {{VARIAVEL_CRITICA}} em vermelho
      - Liste informações faltantes no topo

    ESTRATÉGIA 3: Sugerir template mais genérico
      - Fallback para TEMPLATE_01_ARCHITECT
      - Permite planejamento mais amplo

  SE template não identificado com confiança (< 70%):
    ESTRATÉGIA 1: Apresentar top 3 templates mais prováveis
      - Mostre probabilidades
      - Peça usuário escolher

    ESTRATÉGIA 2: Fazer pergunta de desambiguação
      - "Você quer criar algo novo ou modificar existente?"
      - "Frontend ou Backend?"

    ESTRATÉGIA 3: Usar TEMPLATE_01_ARCHITECT como fallback
      - Template mais genérico
      - Sempre aplicável

  SE validação FAIL:
    ESTRATÉGIA 1: Ajustar automaticamente
      - Adicionar tags faltantes
      - Preencher com valores padrão

    ESTRATÉGIA 2: Solicitar ajuste manual
      - Mostrar checklist de problemas
      - Pedir usuário corrigir
</fallback_strategies>
```

**Função:** Estratégias para cenários problemáticos

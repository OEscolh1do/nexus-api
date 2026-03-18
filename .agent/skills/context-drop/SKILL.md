---
name: context-drop
description: Instrução de Selective Amnesia para agentes especialistas. Elimina a latência de prefill de tokens ao focar o agente apenas no prompt de sistema e na tarefa imediata, descartando o histórico de conversa irrelevante.
---

# Skill: Context Drop (Selective Amnesia)

## Gatilho Semântico

Ativado automaticamente quando:
- Um sub-agente é despachado via Loki Mode ou Orchestrator.
- A conversa tem mais de 20 mensagens e a tarefa atual não depende do histórico anterior.
- O agente detecta que está "carregando" contexto de conversas anteriores não relacionadas à tarefa atual.

## Protocolo de Amnesia Seletiva

### Nível 1 — Drop Parcial (score ≤ 5)

O agente deve operar considerando apenas:
- ✅ O `context.md` do projeto
- ✅ Os arquivos lidos nesta sessão
- ✅ As últimas 5 mensagens do desenvolvedor
- ❌ ~~Histórico de implementações de sessões anteriores~~
- ❌ ~~Discussões de design não relacionadas~~

### Nível 2 — Drop Total (sub-agentes no Loki Mode)

Sub-agentes despachados pelo Orchestrator recebem apenas:
- ✅ O prompt de sistema do sub-agente (escopo exato da tarefa)
- ✅ Os arquivos diretamente relevantes ao seu domínio
- ✅ O contrato de interface com outros agentes
- ❌ ~~Todo o histórico da conversa principal~~

### Como Aplicar ao Iniciar um Sub-agente

Ao descrever a tarefa para um sub-agente (via `browser_subagent` ou similar), o prompt deve ser:

```
CONTEXTO RELEVANTE:
- Stack: [trecho do context.md]
- Arquivos em escopo: [lista exata]
- Contrato de interface: [tipos esperados]

SUA TAREFA:
[descrição atômica e específica]

RETORNE APENAS:
[definição exata do output esperado]
```

## Benefícios Mensuráveis

- ⚡ ~40-60% menos tokens de prefill em sub-agentes
- 🎯 Menor probabilidade de alucinação por "distração" de contexto irrelevante
- 💰 Redução direta de custo operacional por sessão

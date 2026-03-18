---
name: orchestrator
description: Especialista em decomposição de problemas complexos e coordenação de múltiplos agentes especialistas. Ativado quando a tarefa envolve múltiplos domínios simultâneos, exige síntese de outputs paralelos ou carece de uma skill adequada que precise ser criada.
---

# Skill: Orchestrator / Conductor

## Gatilho Semântico

Esta skill é ativada quando o agente detecta:
- Uma tarefa que cruza mais de 2 domínios técnicos distintos (ex: schema de banco + frontend + docs).
- Solicitações que explicitamente pedem paralelismo ("faça X e Y ao mesmo tempo").
- Uma lacuna de capacidade: nenhuma outra skill ou workflow cobre o problema descrito.

## Protocolo de Orquestração

### Fase 1: Decomposição (Analytic Breakdown)

Recebida a tarefa macro, decomponha em sub-tarefas **atômicas e independentes**:
1. Identifique as dependências entre sub-tarefas (topologia de grafo).
2. Classifique cada sub-tarefa por: domínio, complexidade (0-10) e skill necessária.
3. Determine a **ordem de execução**: paralelas (sem dependência entre si) vs. sequenciais (saída de uma alimenta a próxima).

```
Exemplo de mapa de dependências:
[Criar schema Zod] → [Criar endpoint API] → [Criar hook React Query] → [Criar View]
[Criar design tokens]  ─────────────────────────────────────────────→ [Criar View]
```

### Fase 2: Despacho de Especialistas

Para cada sub-tarefa independente, instancie a skill ou agente correto:

| Sub-tarefa | Skill/Agente |
|---|---|
| UI/UX e componentes | `design-lead` |
| APIs, serviços, lógica de negócio | `the-builder` |
| Varredura de segurança | `security-auditor` |
| Análise de documentos/pesquisa | `notebook-lm` |

### Fase 3: Sincronização e Síntese

1. **Barreira de sincronização**: Aguarde todos os agentes retornarem antes de integrar.
2. **Resolução de conflitos**: Se dois agentes propuserem soluções incompatíveis, o Conductor decide com base nas regras do `context.md`.
3. **Integração**: Monte o resultado final unificado.
4. **Validação**: Acione a skill `dike` no output integrado antes de entregar.

### Fase 4: Criação de Skill On-the-Fly

Se uma lacuna de capacidade for detectada durante a orquestração:
1. Acione a skill `skill-creator`.
2. Pause a orquestração até a nova skill ser criada e validada pelo `dike`.
3. Retome com a skill recém-criada disponível.

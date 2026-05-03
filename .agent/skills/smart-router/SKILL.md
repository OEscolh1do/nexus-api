---
name: smart-router
description: Utiliza uma árvore de decisão e pontuação de complexidade (0-10) para escolher o modelo de IA mais eficiente para cada tipo de tarefa. Economiza tokens e custo operacional sem sacrificar qualidade.
---

# Skill: Smart Router

## Gatilho Semântico

Esta skill opera de forma **transparente e preventiva** — o agente principal a consulta internamente antes de escolher como abordar uma tarefa. Não requer ativação manual.

## Árvore de Decisão e Scoring

### Como Calcular o Score de Complexidade (0–10)

| Dimensão | Peso | Critério |
|---|---|---|
| Domínios cruzados | +3 | Afeta mais de 2 camadas (DB + API + UI) |
| Impacto de segurança | +3 | Mexe em auth, RBAC, tokens |
| Volume de arquivos | +2 | Mais de 5 arquivos modificados |
| Novidade da lógica | +2 | Lógica de negócio nova, não incremental |

### Tabela de Roteamento por Score

| Score | Tipo de Tarefa | Modelo Recomendado | Estratégia |
|---|---|---|---|
| 0–2 | Refatoração simples, CSS, renomear | Gemini Flash | Resposta direta, sem planning |
| 3–4 | Novo componente de UI, CRUD básico | Gemini Flash | `planning.md` leve |
| 5–6 | Feature completa, novo endpoint | Gemini Pro | `/speckit` completo |
| 7–8 | Refatoração de arquitetura, nova camada | Modelo Premium | `/planning` + approval |
| 9–10 | Mudança de schema, auth, infra crítica | Modelo Premium + `/loki` | Review humano obrigatório |

## Regras de Eficiência de Tokens

1. **Context Drop parcial**: Para tarefas de score ≤ 4, instrua o agente a ignorar o histórico de conversa anterior a 10 turnos atrás.
2. **Leitura lazy de arquivos**: Leia apenas os arquivos listados no `implementation_plan.md`, não faça varreduras globais desnecessárias.
3. **One-shot para tasks simples**: Score ≤ 3 deve ser resolvido em uma única resposta, sem sub-tasks ou artefatos intermediários.

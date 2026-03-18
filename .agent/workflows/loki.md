---
description: Subagent Driven Development — agente principal gerencia especialistas em paralelo
---

# Workflow `/loki` — Subagent Driven Development (Modo Paralelo)

Ative o Modo Loki quando a tarefa for suficientemente grande para se beneficiar de paralelismo. O agente principal atua como **Gerente de Projeto**, despacha sub-tarefas para agentes especialistas e integra os resultados.

## Quando Usar

- Features que envolvem múltiplos domínios simultâneos (ex: backend + frontend + docs ao mesmo tempo).
- Pesquisas que exigem comparar múltiplas abordagens em paralelo.
- Auditorias que cobrem múltiplos módulos ao mesmo tempo.

## Os Agentes Especialistas

| Agente | Função |
|---|---|
| **Designer** | Pesquisa padrões de UI/UX, propõe wireframes e design tokens |
| **Builder** | Implementa o código da feature ou componente específico |
| **Researcher** | Busca documentação técnica, analisa dependências e avalia riscos |
| **Auditor** | Valida o output de outros agentes contra as regras do projeto |

## Protocolo de Despacho

1. **Decomposição**: Quebre a tarefa principal em sub-tarefas **independentes** (sem dependências entre si).
2. **Despacho Paralelo**: Lance todos os subagentes simultaneamente, definindo o escopo exato de cada um.
3. **Barreira de Sincronização**: Aguarde que **todos** os subagentes retornem antes de integrar os resultados.
4. **Integração**: O agente principal revisa os outputs, resolve conflitos e monta o resultado final.
5. **Validação**: Execute o workflow `/chain-of-verification` no resultado integrado antes de entregar ao desenvolvedor.

## Regras de Segurança

- Cada subagente opera em escopo **isolado** — nunca permite que um subagente modifique arquivos fora do seu domínio.
- Conflitos de merge entre outputs de subagentes **sempre** são resolvidos pelo agente principal, nunca automaticamente por um subagente.

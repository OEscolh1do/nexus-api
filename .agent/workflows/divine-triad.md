---
description: Ciclo fechado de qualidade com Agente Criador, Escritor e Validador (Dike)
---

# Workflow `Divine Triad Synergy` — Auto-Cura via Validação Interna

Ciclo de garantia de qualidade em três fases para eliminar alucinações, código incorreto e desvios de arquitetura **antes** da entrega ao desenvolvedor.

## Os Três Agentes

| Agente | Papel |
|---|---|
| **Criador** | Gera a lógica e a arquitetura da solução. |
| **Escritor** | Traduz a lógica em código limpo e idiomático. |
| **Dike (Validador)** | Analista estático que testa o output sem executar o código. |

## Fase 1: O Criador — Lógica e Arquitetura

Produza um rascunho de alto nível da solução:
- Descreva a lógica em pseudocódigo ou prose técnica.
- Identifique as interfaces de entrada e saída.
- **Não escreva código final ainda.**

## Fase 2: O Escritor — Implementação

Com base no rascunho do Criador:
- Implemente o código seguindo os padrões do projeto (TypeScript, Clean Code, convenções do `context.md`).
- Mantenha o código o mais próximo possível do pseudocódigo, sem "criatividade" extra.

## Fase 3: Dike — Análise Estática (sem execução)

O Validador realiza as seguintes checagens no código do Escritor:

1. **Conformidade com Tipos**: Todos os tipos TypeScript estão corretos? Há uso de `any`?
2. **Conformidade com Padrões**: O código segue as convenções do `.agent/context.md` e `rules/`?
3. **Casos de Borda**: O código trata `null`, `undefined` e arrays vazios do retorno da API?
4. **Segurança**: Há algum dado sensível sendo logado ou exposto?
5. **Lógica**: A implementação do Escritor corresponde fielmente à lógica do Criador?

**Se o Validador encontrar falhas**, o ciclo reinicia na Fase 1 ou 2 (dependendo da natureza do erro). A entrega só ocorre quando o Dike aprova.

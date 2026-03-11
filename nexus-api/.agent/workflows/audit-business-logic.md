---
description: How to audit complex business logic flows for correctness, edge cases and DDD compliance
---

# Auditoria de Lógica de Negócio (DDD)

## Quando Usar

- Cálculos financeiros ou de engenharia dando resultados errados
- Fluxos com muitos `if/else` aninhados (Complexidade Ciclomática alta)
- Regras de negócio espalhadas entre Frontend e Backend
- Bugs que "só acontecem às vezes" (Edge Cases)
- Dificuldade de escrever testes unitários

## Fase 1: Logic Audit (Mapeamento)

Analisar a lógica usando os **5 Critérios de Consistência**:

### 1. Consistência de Domínio (State Machine)
- As transições de estado são válidas?
- Existem estados impossíveis/inalcançáveis?

### 2. Tratamento de Edge Cases (Limites)
- Como o sistema lida com valores zero, negativos ou nulos?
- Concorrência: dois usuários aprovando ao mesmo tempo?

### 3. Isolamento (Pure Functions)
- A lógica de cálculo está misturada com chamadas de Banco/API?
- As funções são determinísticas (mesma entrada = mesma saída)?

### 4. Dependência Externa & Falhas
- Se uma API externa cair, o cálculo quebra ou usa cache?
- Efeitos colaterais (enviar email) acontecem antes ou depois de persistir?

### 5. Precisão & Arredondamento
- Cálculos financeiros usam `number` JS ou biblioteca decimal?
- O arredondamento é consistente em todo o fluxo?

## Output Esperado: `logic_audit_report.md`

1. **Mapeamento Atual** — Diagrama Mermaid (Flowchart ou StateDiagram), Tabela Verdade
2. **Diagnóstico de Falhas** — Regras violadas, edge cases, complexidade acidental
3. **Proposta de Refatoração (DDD)** — Value Objects, Domain Services, isolamento Core vs Shell
4. **Casos de Teste Obrigatórios** — 5 cenários que DEVEM passar

## Fase 2: Simplification (Após aprovação)

1. Extrair lógica pura para módulo isolado (Domain Service) — ZERO dependências de framework
2. Implementar testes unitários cobrindo os Edge Cases listados
3. Integrar novo módulo no código (substituir lógica antiga)

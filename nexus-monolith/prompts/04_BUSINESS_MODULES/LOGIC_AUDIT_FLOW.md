# 🧠 Auditoria de Lógica de Negócio - Neonorte | Nexus 2.0

> **🎯 Cenário de Uso**
>
> Você tem um fluxo de negócio complexo (ex: Cálculo de Proposta Solar, Máquina de Estados de Leads) que apresenta bugs sutis, resultados inconsistentes ou é impossível de testar.
>
> **⏱️ Tempo Estimado:** 30 minutos (Mapeamento + Análise)

---

## 🔍 Quando Usar Este Template?

- ✅ Cálculos financeiros ou de engenharia dando resultados errados
- ✅ Fluxos com muitos `if/else` aninhados (Complexidade Ciclomática alta)
- ✅ Regras de negócio espalhadas entre Frontend e Backend
- ✅ Bugs que "só acontecem às vezes" (Edge Cases)
- ✅ Dificuldade de escrever testes unitários para a lógica

---

## 🔄 Abordagem em 2 Fases

### Fase 1: Logic Audit (Mapeamento)

- Extrair regras de negócio do código
- Validar consistência lógica
- Mapear dependências e efeitos colaterais
- **Output:** `logic_audit_report.md` (com Tabela Verdade ou Diagrama)

### Fase 2: Simplification (Refatoração)

- Implementar Patterns (Strategy, State, Factory)
- Centralizar regras puras
- Isolar efeitos colaterais
- Criar testes de cenários

---

## 📋 FASE 1: LOGIC AUDIT (Copie este prompt)

```xml
<system_role>
  Atue como **Domain Expert** e Arquiteto de Software.
  Especialidade: Domain-Driven Design (DDD), Máquinas de Estado e Sistemas Críticos.
</system_role>

<mission>
  Auditar o fluxo de negócio "{{NOME_DO_FLUXO}}" para garantir corretude e robustez.

  Sintomas: {{DESCREVA_O_COMPORTAMENTO_ESTRANHO}}
</mission>

<input_context>
  <critical_files>
    <file path="{{ARQUIVO_PRINCIPAL}}" description="Onde a mágica acontece" />
    <file path="{{ARQUIVO_AUXILIAR}}" />
  </critical_files>

  <business_rules>
    O que deveria acontecer (Regras de Ouro):
    - {{REGRA_1}} (ex: O desconto não pode passar de 15%)
    - {{REGRA_2}} (ex: Lead Arquivado não pode receber proposta)
  </business_rules>
</input_context>

<audit_framework_business>
  Analise a lógica usando os **5 Critérios de Consistência**:

  1. **Consistência de Domínio (State Machine)**
     - As transições de estado são válidas? (ex: De "Pago" para "Cancelado" é permitido?)
     - Existem estados impossíveis/inalcançáveis?

  2. **Tratamento de Edge Cases (Limites)**
     - Como o sistema lida com valores zero, negativos ou nulos?
     - Como lida com concorrência (ex: dois usuários aprovando ao mesmo tempo)?

  3. **Isolamento (Pure Functions)**
     - A lógica de cálculo está misturada com chamadas de Banco/API? (Dificulta teste)
     - As funções são determinísticas (mesma entrada = mesma saída)?

  4. **Dependência Externa & Falhas**
     - Se a API de Cotação de Dólar cair, o cálculo quebra ou usa cache?
     - Efeitos colaterais (enviar email) acontecem antes ou depois de persistir?

  5. **Precisão & Arredondamento**
     - Cálculos financeiros usam ponto flutuante (`number` JS) ou biblioteca decimal?
     - O arredondamento é consistente em todo o fluxo?
</audit_framework_business>

<output_instruction>
  Gere um artefato `logic_audit_report.md` contendo:

  ## 1. Mapeamento Atual
  - Diagrama Mermaid (Flowchart ou StateDiagram) do que o código faz HOJE.
  - Tabela Verdade identificada (Inputs -> Outputs).

  ## 2. Diagnóstico de Falhas
  - Regras violadas.
  - Edge cases descobertos (ex: "Se input for 0, divide por zero").
  - Complexidade acidental encontrada.

  ## 3. Proposta de Refatoração (DDD)
  - Sugestão de Value Objects ou Domain Services.
  - Como isolar o "Core" (Regras Puras) da "Shell" (Infraestrutura).

  ## 4. Casos de Teste Obrigatórios
  - Lista de 5 cenários que DEVEM passar após a correção.
</output_instruction>
```

---

## 📝 Exemplo Real: Cálculo de ROI Solar

### Problema

O cálculo de retorno financeiro dava valores diferentes no front e no back.

### Logic Audit Report Gerado

```markdown
# Logic Audit Report: Solar ROI Calculator

## 1. Mapeamento

O código atual usa `useEffect` no Frontend para calcular parciais e somar, enquanto o Backend refaz a conta com outra fórmula.

## 2. Diagnóstico

### ❌ Violação: Isolamento (Pilar 3)

A lógica está duplicada. Qualquer mudança na regra exige alterar 2 lugares (Risco de Divergência).

### ❌ Violação: Precisão (Pilar 5)

O Frontend usa `Math.round()` viciando o resultado para cima, o Backend usa truncamento. Em projetos de R$ 500k, a diferença chega a R$ 200,00.

## 3. Proposta

1. Criar `SolarMath.ts` (Shared Library) contendo apenas funções puras.
2. Usar este mesmo arquivo tanto no Frontend quanto no Backend (Single Source of Truth).
3. Usar biblioteca `decimal.js` para evitar flutuação binária.
```

---

## 🔧 FASE 2: SIMPLIFICATION (Copie após aprovar audit)

```xml
<mission>
  Refatorar lógica de negócio conforme `logic_audit_report.md`.
</mission>

<execution_protocol>
  <step_1>
    Extrair lógica pura para classe/módulo isolado (Domain Service).
    Garantir ZERO dependências de framework (React/Express).
  </step_1>

  <step_2>
    Implementar testes unitários cobrindo os Edge Cases listados.
  </step_2>

  <step_3>
    Integrar novo módulo no código legado (substituir lógica antiga).
  </step_3>
</execution_protocol>
```

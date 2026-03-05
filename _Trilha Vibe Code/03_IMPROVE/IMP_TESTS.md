# 🧪 TEMPLATE 06: O TESTADOR (Unit Tests)

> **📍 VOCÊ ESTÁ AQUI:** 🏠 [Início](./) > 🛠️ Templates > 🧪 Template 06 - Testes  
> **🎯 OBJETIVO:** Criar testes automatizados para código crítico  
> **⏱️ TEMPO:** 2min preencher | 3-7min IA escrever testes  
> **🛠️ PRÉ-REQUISITO:** Código funcional que precisa de cobertura de teste

---

> **💡 PARA QUE SERVE?**
>
> **O Cenário:** Você escreveu uma lógica complexa (um cálculo, um parser) e quer garantir que ela não quebre.
>
> **A Abordagem:** Peça para a IA agir como QA. Ela vai pensar em "Edge Cases" (casos de borda) que você nem imaginou.

## ✅ Checklist Antes de Testar

- [ ] O código a ser testado **está funcionando** (não teste código bugado!)
- [ ] Sei qual **framework de teste** usar (Jest? Vitest? Cypress?)
- [ ] Identifiquei **funções críticas** (cálculos, validações, transformações)

**💡 Priorize:** Teste primeiro as funções que mais causariam dano se quebrassem.

---

## ✂️ COPIE ISSO AQUI:

```xml
<system_role>
  Atue como Engenheiro de QA (Quality Assurance).
  Framework de Teste: {{TEST_FRAMEWORK: Jest, Vitest, Pytest, JUnit, RSpec, etc}}.
  Princípios: Cobertura de Edge Cases, Testes Legíveis, Isolamento.
</system_role>

<mission>
  Criar cobertura de testes para o arquivo: "{{NOME_DO_ARQUIVO}}".
</mission>

<source_code>
  <file path="{{CAMINHO_DO_ARQUIVO_PARA_TESTAR}}" />
</source_code>

<test_strategy>
  1. Crie o arquivo de teste seguindo convenção do {{TEST_FRAMEWORK}}.
  2. Cubra o "Caminho Feliz" (Happy Path) - O uso normal.
  3. Cubra os "Casos de Borda" (Edge Cases):
     - Inputs nulos ou undefined.
     - Arrays vazios.
     - Datas inválidas.
     - Erros de API/Network.
     - Limites numéricos (0, negativo, muito grande).
</test_strategy>

<test_types>
  - [ ] Testes Unitários (funções isoladas)
  - [ ] Testes de Integração (APIs, Database)
  - [ ] Testes E2E (fluxos completos do usuário)
</test_types>

<output_format>
  Forneça apenas o código do arquivo de teste completo.
  Inclua comentários explicando casos de teste complexos.
</output_format>
```

---

## 📚 Frameworks de Teste por Linguagem

### JavaScript/TypeScript

- **Vitest** (recomendado para Vite) - Rápido, compatível com Jest
- **Jest** (React, Node.js) - Mais popular, ecossistema maduro
- **Mocha + Chai** - Flexível, configurável

### Python

- **Pytest** - Sintaxe simples, fixtures poderosos
- **unittest** - Biblioteca padrão, estilo xUnit

### Java

- **JUnit 5** - Padrão da indústria
- **TestNG** - Mais flexível que JUnit

### Ruby

- **RSpec** - BDD style, muito expressivo
- **Minitest** - Biblioteca padrão, rápido

### Go

- **testing** (built-in) - Biblioteca padrão
- **Testify** - Assertions e mocks

---

## 💡 Exemplo: Teste Unitário Multi-Framework

### JavaScript (Vitest/Jest)

```typescript
// calculator.test.ts
import { describe, it, expect } from "vitest";
import { sum, divide } from "./calculator";

describe("Calculator", () => {
  describe("sum", () => {
    it("should add two positive numbers", () => {
      expect(sum(2, 3)).toBe(5);
    });

    it("should handle negative numbers", () => {
      expect(sum(-2, 3)).toBe(1);
    });

    it("should handle zero", () => {
      expect(sum(0, 5)).toBe(5);
    });
  });

  describe("divide", () => {
    it("should divide two numbers", () => {
      expect(divide(10, 2)).toBe(5);
    });

    it("should throw error when dividing by zero", () => {
      expect(() => divide(10, 0)).toThrow("Division by zero");
    });
  });
});
```

### Python (Pytest)

```python
# test_calculator.py
import pytest
from calculator import sum, divide

class TestCalculator:
    def test_sum_positive_numbers(self):
        assert sum(2, 3) == 5

    def test_sum_negative_numbers(self):
        assert sum(-2, 3) == 1

    def test_sum_with_zero(self):
        assert sum(0, 5) == 5

    def test_divide_normal(self):
        assert divide(10, 2) == 5

    def test_divide_by_zero_raises_error(self):
        with pytest.raises(ValueError, match="Division by zero"):
            divide(10, 0)
```

### Java (JUnit 5)

```java
// CalculatorTest.java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class CalculatorTest {
    @Test
    void shouldAddTwoPositiveNumbers() {
        assertEquals(5, Calculator.sum(2, 3));
    }

    @Test
    void shouldHandleNegativeNumbers() {
        assertEquals(1, Calculator.sum(-2, 3));
    }

    @Test
    void shouldHandleZero() {
        assertEquals(5, Calculator.sum(0, 5));
    }

    @Test
    void shouldDivideTwoNumbers() {
        assertEquals(5, Calculator.divide(10, 2));
    }

    @Test
    void shouldThrowExceptionWhenDividingByZero() {
        assertThrows(ArithmeticException.class, () -> {
            Calculator.divide(10, 0);
        });
    }
}
```

---

## ✅ Checkpoint de Cobertura

Depois que a IA gerar os testes:

- [ ] **Testes cobrem o "Happy Path"** (caso de uso normal)
- [ ] **Testes cobrem Edge Cases** (nulo, vazio, inválido)
- [ ] **Rodei os testes e todos passaram** (`npm test`)

**Se algum teste falhou:** Ou o teste está errado, ou descobrimos um bug!

---

## ✅ Resumo em 3 Frases

1. **Testes = Seguro de vida do código** → Refatorações ficam seguras
2. **Edge Cases são onde bugs se escondem** → undefined, null, array vazio
3. **Teste o que importa** → 80% de cobertura no crítico > 100% no trivial

## 🔗 Próximos Passos

**Se todos os testes passaram:**
→ Commit e celebrate! 🎉 Você tem código protegido.

**Se descobriu bugs nos testes:**
→ Use [TEMPLATE_04_DEBUG](./TEMPLATE_04_DEBUG.md) para corrigir

**Se precisa documentar os testes:**
→ Use [TEMPLATE_05_DOCS](./TEMPLATE_05_DOCS.md)

---

[🔝 Voltar ao topo](#-template-06-o-testador-unit-tests)

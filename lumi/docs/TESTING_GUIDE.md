# Lumi - Testing Guide

> **Guia de Estratégia de Testes**  
> **Versão**: 1.0.0  
> **Data**: 2026-01-28

---

## 📋 Índice

1. [Filosofia de Testes](#filosofia-de-testes)
2. [Padrões de Teste Unitário](#padrões-de-teste-unitário)
3. [Testando Zustand Slices](#testando-zustand-slices)
4. [Testando Componentes (Atoms)](#testando-componentes-atoms)
5. [Processo de QA Manual](#processo-de-qa-manual)

---

## 🎯 Filosofia de Testes

No Lumi V3, priorizamos a **robustez da lógica de negócios** (Core Domain) e a **integridade do estado** (Zustand).

### Pirâmide de Testes (Recomendada)

1.  **Unit Tests (Base)**: Core logic, validações Zod, funções puras.
2.  **State Tests**: Slices do Zustand, actions e reducers.
3.  **Component Tests**: Atoms isolados (com mock do store).
4.  **E2E (Topo)**: Fluxos críticos (Novo Projeto -> Proposta).

---

## 🏃 Executando Testes

O projeto já está configurado com **Vitest**.

### Comandos Disponíveis

```bash
# Rodar todos os testes (uma vez)
npm test -- run

# Rodar em modo watch (desenvolvimento)
npm test

# Rodar com interface gráfica
npm run test:ui

# Gerar relatório de cobertura
npm run test:coverage
```

### Estrutura de Testes

Os arquivos de teste devem estar co-localizados com o código fonte ou na pasta `src/test`.
Padrão de nome: `NomeDoArquivo.test.ts` ou `NomeDoArquivo.spec.ts`.

---

## 🧪 Padrões de Teste Unitário

### Framework

Recomendamos **Vitest** + **React Testing Library**.

### O Que Testar?

1.  **Schemas Zod**: Garantir que dados inválidos sejam rejeitados.
2.  **Cálculos de Engenharia**: Funções críticas como cálculo de geração, drop de tensão, FDI.

**Exemplo de Teste de Domínio (`SolarCalculator.test.ts`):**

```typescript
import { calculateFDI } from "./SolarCalculator";

describe("SolarCalculator", () => {
  it("should calculate FDI correctly", () => {
    const modulesPower = 5500; // 5.5 kWp
    const inverterPower = 5000; // 5.0 kW
    const fdi = calculateFDI(modulesPower, inverterPower);
    expect(fdi).toBe(1.1); // 110%
  });
});
```

---

## 💾 Testando Zustand Slices

Para testar slices, testamos o hook `useSolarStore` em isolamento.

**Exemplo (`clientSlice.test.ts`):**

```typescript
import { renderHook, act } from "@testing-library/react";
import { useSolarStore } from "@/core/state/solarStore";

describe("ClientSlice", () => {
  it("should update client name", () => {
    const { result } = renderHook(() => useSolarStore());

    act(() => {
      result.current.updateClientData({ clientName: "Test Client" });
    });

    expect(result.current.clientData.clientName).toBe("Test Client");
  });
});
```

---

## ⚛️ Testando Componentes (Atoms)

Como os atoms consomem o store diretamente, precisamos mockar o Zustand ou usar um wrapper de teste.

**Padrão de Mock:**

```typescript
// mocks/zustand.ts
import { create } from "zustand";

const storeResetFns = new Set<() => void>();

export const createMockStore = (createState) => {
  const store = create(createState);
  const initialState = store.getState();
  storeResetFns.add(() => store.setState(initialState, true));
  return store;
};
```

---

## 🕵️ Processo de QA Manual

Como temos uma equipe enxuta, o QA Manual é essencial antes de releases.

### Checklist de Fumaça (Smoke Test)

#### 1. Módulo CRM

- [ ] Criar novo cliente (preencher nome, cidade).
- [ ] Buscar endereço no mapa.
- [ ] Adicionar uma fatura simulada.
- [ ] Verificar se dados persistem ao trocar de aba.

#### 2. Módulo Engenharia

- [ ] Adicionar módulo FV.
- [ ] Adicionar inversor.
- [ ] Verificar cálculo de FDI no Health Check.
- [ ] Alterar orientação (Norte -> Leste) e ver se não quebra.

#### 3. Módulo Elétrico

- [ ] Selecionar cabo DC.
- [ ] Verificar cálculo de queda de tensão (deve ser > 0).

#### 4. Módulo Proposta

- [ ] Verificar se checklist detecta dados faltantes.
- [ ] Se tudo ok, verificar se botão de gerar aparece.

#### 5. Módulo Settings

- [ ] Alterar preço do kit.
- [ ] Salvar e recarregar página (verificar persistência localStorage).

---

**Nota**: Este guia serve como base para a implementação futura de uma suíte de testes automatizada completa (Pipeline CI/CD).

---

**Autor**: Neonorte Tecnologia  
**Versão**: 1.0.0  
**Última Atualização**: 2026-02-02

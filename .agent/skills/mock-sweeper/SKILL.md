---
name: mock-sweeper
description: Caçador de mocks, placeholders de dados e lógica de engenharia 'fake' que causam falhas silenciosas ou exibições zeradas.
---

# Skill: Mock Sweeper (v2.0)

## Gatilho Semântico

Ative esta skill quando o desenvolvedor relatar:
- "O botão finge que carrega e dá sucesso, mas não salva" (Mock de Interação)
- "O campo fica sempre como 0.00 ou NaN" (Mock de Dados/Mapeamento)
- "O cálculo parece ignorar o que eu configurei" (Mock de Lógica)
- "A imagem é estática mas parece um componente" (Placeholder Visual)

## Protocolo de Limpeza (Sweeping)

### 1. Auditoria de Interação (Interactive Mocks)
- Procure por `setTimeout`, `setLoading(true)` sem `await` real, ou `onCommit` que não dispara mutações no Store/API.
- **Ação**: Conectar o evento à camada de serviço (`ProjectService`, `NexusClient`).

### 2. Auditoria de Dados (Data Mocks)
- Identifique o uso excessivo de fallbacks como `|| 0`, `|| "—"` ou `(obj as any).prop` que podem estar mascarando propriedades renomeadas no Schema (ex: `pmax` vs `power`).
- **Ação**: Validar o mapeamento de tipos no topo do componente (`Single Point of Mapping`).

### 3. Auditoria de Engenharia (Logic Mocks)
- Verifique se fórmulas de cálculo (clipping, perdas, dimensionamento) estão usando constantes hardcoded em vez de parâmetros vindos do catálogo.
- **Ação**: Substituir constantes por valores do `activeInverter.snapshot` ou `moduleSpecs`.

### 4. Tratamento de Estado Real
- Ao iniciar, definir `isSaving = true`.
- Dentro de um bloco `try`, executar a mutação com `await`.
- Se for bem-sucedido, exibir sucesso genuíno. Em caso de falha (`catch`), reportar o erro real.

## Limitações e Boas Práticas

- ❌ Não remova `setTimeout` legítimos usados para debounce ou animação.
- ❌ Não remova estimativas de engenharia (ex: P50/P90) se o motor estocástico ainda for intencionalmente simplificado.
- ✅ Sempre use o manual de boas práticas (Lição 5.2) para evitar o "0.00 kWp Trap".

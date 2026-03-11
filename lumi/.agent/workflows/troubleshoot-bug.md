---
description: RCA Científico para Análise Causa-Raiz no Lumi App
---

# Fluxo de Trabalho: Troubleshoot & Debugging de Negócio

No Lumi, os bugs raramente são "O botão não clicou". Quase 100% dos relatórios de falha envolvem os cálculos fotovoltaicos estarem retornando **`NaN`**, **Subdimensionados**, ou **Estourando Max Voc (Inversores)**.

## Fase 1: Snapshot do Store (Zustand)
1. Antes de debugar qualquer código de Render, abra a ferramenta e insira ou injete o estado do cliente descrito no ticket do bug.
2. Analise a árvore persistida do Store para capturar o exato `ClientData` ou `EngineeringSettings`.

## Fase 2: Teste Limpo da Engine 
1. Isole a camada visual (`Module` e `Tab`).
2. Recrie as variáveis em um arquivo de teste com o `vitest` ou rodando o método `calculate()` da classe `SolarCalculator` passando o mock. 

## Fase 3: Rastreamento (Trace)
1. Verifique se as Casas Decimais (JS Floating Point Issue) estão desregulando a viabilidade (ex: `0.0001` de juros que zera a TIR). Use uma library tipada ou o `Math.round()` onde for seguro.
2. Garanta que todas as variáveis "Obrigatórias" que estão chegando preenchidas do Zod são realmente lidas no laço `for`/`reduce` do Motor Matemático.

## Fase 4: O "Fix"
1. Corrija a regra na matemática. NUNCA faça um "IF Patch" na aba do React. A Interface apenas reflete a Engine.
2. Escreva um Teste Unitário validando que aquele exato "Input" não gera mais a divisão por zero ou o loop problemático.

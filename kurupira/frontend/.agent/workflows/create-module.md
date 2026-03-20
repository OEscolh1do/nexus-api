---
description: Como criar um novo Módulo/Domínio ou Aba no Lumi
---

# Fluxo de Trabalho: Criação de Novo Módulo no Lumi

> **Regra de Ouro**: O Lumi **não é** um ERP tradicional. Ele é uma calculadora de engenharia baseada em "Etapas" visuais (CRM -> Engenharia -> Elétrica -> Financeiro). Criar um "Módulo" aqui geralmente significa adicionar uma nova Aba/Slice no Orquestrador Global.

## Etapa 1: Definição do Slice (Zustand)
1. Crie o arquivo do novo Slice em `src/core/state/slices/[nome]Slice.ts`.
2. Defina a interface (ex: `FinanceSlice`) com os dados que precisam ser persistidos ao recarregar a página.
3. Importe e registre o Slice no `src/core/state/solarStore.ts`.
4. Exponha os Selectors isolados (ex: `selectFinanceData`).

## Etapa 2: Motor Lógico (Opcional)
Se o módulo exigir cálculos complexos pesados, **não faça a matemática dentro do React Component**.
1. Crie um arquivo puro na pasta `src/core/domain/` ou `src/lib/`.
2. Passe parâmetros concretos (não o store inteiro) para a classe/função e retorne o resultado final.

## Etapa 3: Interface da Aba (Domain Module)
1. Crie uma pasta dentro de `src/modules/[nome]`.
2. O componente principal deve terminar em `Module` (ex: `FinanceModule.tsx`).
3. O módulo só deve consumir o store via Selectors para evitar re-renderizações violentas no `ProfileOrchestrator`.

## Etapa 4: Registro no Orquestrador
1. Adicione a aba visualmente mapeada no painel esquerdo ou topo do layout principal.
2. Controle a lógica de ativação através do estado `activeModule` do Zustand.
3. Certifique-se de que a migração entre sua nova Aba e as antigas não apague dados em memória.

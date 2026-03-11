---
description: Como auditar o Zustand vs Types do Motor Matemático
---

# Fluxo de Trabalho: Auditoria de Completude (Gap Analysis)

## Etapa 1: Leitura do Core Domain
1. Inspecione a classe abstrata `SolarCalculator` (ou Motor Matemático em `src/core/domain/`).
2. Liste todos os `Inputs` (tipos base) que o método principal de cálculo (ex: `calculateProposal`) obrigatoriamente exige para rodar sem falhas.

## Etapa 2: Mapeamento da UI para o Store
1. Vá até a `Tab` associada a esse input (ex: Aba de Engenharia para Inclinação do Telhado).
2. Verifique se o formulário visual (`Input`, `Select`) está disparando a `Action` certa do Zustand (ex: `updateEngineeringData()`).

## Etapa 3: Identificação de GAPs (Desconexão)
1. Caso a UI permita "Salvar/Avançar" sem preencher o Zod Schema requerido...
2. Adicione ou corrija as mensagens e blocos de validação do React Hook Form.

> **Objetivo Final**: Garantir que 100% dos dados que o usuário digita na UI cheguem tipados e seguros até a classe isolada de Cálculo.

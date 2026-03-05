# Glossário de Domínio (Ubiquitous Language)

Este documento define os termos onipresentes no código e no negócio. A consistência destes nomes é vital.

## 🟢 Commercial (Vendas)

- **Lead:** Um potencial cliente que entrou em contato mas ainda não tem proposta qualificada.
- **Deal (Oportunidade):** Um Lead que avançou para negociação. Possui valor monetário estimado.
- **SolarProposal:** Documento técnico-comercial gerado pelo `Solar Engine` com dimensionamento e preço.

## 🔵 Ops (Operações)

- **Project (Obra):** A execução vendida. Nasce AUTOMATICAMENTE quando um Deal é ganho ("Closed Won").
- **OperationalTask:** A menor unidade de trabalho. Pode ser:
  - _Milestone:_ Marco de pagamento ou entrega crítica.
  - _Standard:_ Tarefa comum com duração.
- **Blueprint (Modelo):** Um conjunto pré-definido de tarefas para tipos de obra (ex: "Instalação Residencial Padrão").

## 🟣 Strategy (Estratégia)

- **Objective (Objetivo):** O que queremos alcançar (ex: "Aumentar Faturamento").
- **Goal (Meta):** A quantificação do objetivo (ex: "R$ 10M em 2026").
- **Driver:** Um fator externo ou interno que influencia a estratégia.

## 🟠 Finance (Financeiro)

- **Ledger (Razão):** Registro imutável de todas as transações financeiras.
- **Transaction:** Uma entrada única no Ledger. Nunca é deletada, apenas compensada por outra transação inversa.

---

> **Regra:** Use estes termos exatos em nomes de Classes, Tabelas e Variáveis. Não use sinônimos (ex: não use "Client" se o termo é "Lead" ou "Customer").

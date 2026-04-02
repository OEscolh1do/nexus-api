# As-Built Visual — Kurupira Workspace

Este documento formaliza a entrega da nova interface do Kurupira Workspace, documentando a transição do paradigma de "Wizard ERP" para um **Ambiente de Engenharia Imersivo**.

## 1. Paradigma Workspace vs. ERP

A principal mudança visual consiste na introdução de uma **Sidebar de Projetos** e a remoção das abas de CRM/Finanças do cabeçalho global.

| Feature | Estado Anterior (Lumi) | Estado Atual (Kurupira) |
|---------|-------------------------|-------------------------|
| **Navegação** | Abas horizontais (CRM → Premissas) | Abas Técnicas + Sidebar de Projetos |
| **Contexto** | Focado na etapa do wizard | Focado no Projeto selecionado |
| **Dark Mode** | Parcial / Ad-hoc | Full Dark Workspace (Slate 900) |
| **CRM** | Integrado no header | **Removido** (Gestão movida para Iaçã) |

## 2. Evidências Visuais (As-Built)

````carousel
![Nova Sidebar e Cabeçalho de Engenharia](./initial_state_sidebar.png)
<!-- slide -->
![Módulo de Dimensionamento](./dimensionamento_tab.png)
<!-- slide -->
![Módulo Elétrico & BOS](./eletrico_bos_tab.png)
<!-- slide -->
![Configurações de Premissas Técnicas](./premissas_tab.png)
````

## 3. Detalhamento dos Componentes

### 3.1 Sidebar (Project Explorer)
A barra lateral esquerda agora serve como o ponto central de navegação entre diferentes projetos de engenharia (`TechnicalDesigns`). 
- **Lista de Projetos:** Switch instantâneo entre dimensionamentos.
- **Contexto Comercial:** Exibe dados do Lead (Nome, Telefone, Cidade) injetados via KurupiraClient, permitindo ao engenheiro consultar a fatura sem sair do módulo.

### 3.2 Cabeçalho Técnico
A barra superior foi simplificada para conter apenas as etapas cabíveis à engenharia solar:
- **Dimensionamento:** Fila de projetos e configuração de módulos.
- **Elétrico & BOS:** Dimensionamento de cabos e proteções.
- **Documentação:** Gerador de memoriais e PDFs técnicos.
- **Proposta:** Resumo de preços e simulação técnica final.
- **Premissas:** Parâmetros globais de engenharia (PR, Perdas, etc).

### 3.3 Remoção do CRM
Não existem mais abas de "Levantamento" ou "Viabilidade". O sistema agora abre diretamente no contexto técnico, reforçando a separação entre o **Iaçã (Negócios)** e o **Kurupira (Engenharia)**.

---
*Gerado automaticamente como parte da Operação Guardiões.*

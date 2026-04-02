# Relatório de Execução: Refatoração do Dimensionamento (UX-001)

Este documento atesta a conclusão oficial da refatoração da Interface de Engenharia WebGL profunda (Kurupira) de um modelo de "Abas" para um modelo "Workspace Conectado".

---

| Campo | Dado |
| :--- | :--- |
| **Data de Conclusão** | 22 de março de 2026 |
| **Status Final** | ✅ 100% Concluído (Fases PRÉ, P0, P1, P2 e P3) |
| **Escopo Documental** | Especificacao_Tecnica_Refatoracao_Kurupira.md |
| **Auditoria Final (TSC)** | 24 erros legados estabilizados (0 novas regressões) |

---

## 1. Contexto Estrutural e Arquitetural (Fase PRÉ)
A fundação do aplicativo React foi reconstruída para suportar manipulação intensiva pelo usuário e o futuro motor WebGL sem vazamentos de memória ou bloqueios no DOM.

*   **PRÉ-1: Normalização do Store:** O estado global `solarStore.ts` teve suas listas de equipamentos (`modules`, `inverters`, `bosInventory`) reconstruídas de `Array` (que causavam mutações pesadas) para dicionários indexados `Record<string, T>` (com arrays separados de `ids`), permitindo updates granulares O(1).
*   **PRÉ-2: Infraestrutura Undo/Redo:** Instalado o middleware assíncrono `zundo`, capturando diferenciais de estado (Immer Patches) apenas da "lógica de domínio", excluindo metadados transitórios de UI. Isso habilita as setas de retroceder/avançar na Ribbon.
*   **PRÉ-3: Canvas Escudo (ResizeObserver):** Adição do componente `CanvasContainer.tsx`, garantindo que eventuais redimensionamentos da tela repassem métricas limpas usando `data-width`/`data-height` de maneira performática sem acionar eventos globais de `window.resize`.

---

## 2. Componentização e Integração Visual (P0 a P3)
Os 20 componentes de interface herdados foram fragmentados e costurados em quatro zonas principais da UI do Kurupira:

### 2.1 TopRibbon (`src/modules/engineering/ui/panels/TopRibbon.tsx`)
A base de controle e status passivo no topo da tela:
*   **Status de Engenharia (P1):** Unificados a potência instalada e o Fator de Dimensionamento em micro-widgets sempre visíveis (antigamente ocultos na `PVArrayStatusBar` e `InverterStatusBar`).
*   **Approval Workflow (P3):** Dropdown compacto com flags visuais (Rascunho, Em Revisão, Aprovado).
*   **HealthCheck System (P3):** Lógica encapsulada em um ícone de semáforo com tooltip rico, processando alarmes imediatos de Sobretensão (*Voc Max no Inverno*) e Extrapolação de Disjuntores/Clipping (*Overload DC/AC*).
*   **Diretrizes Projetuais (P3):** O antigo form extenso (`EngineeringGuidelinePanel`) foi compactado em um Popover limpo (botão `?`) comparando módulos alocados versus a "área alvo do telhado".

### 2.2 LeftOutliner (`src/modules/engineering/ui/panels/LeftOutliner.tsx`)
A árvore hierárquica (BOS - Balance of System) de componentes implementados:
*   **Inventários Estruturais (P0):** Conversão dos formulários CRUD monolíticos de `ModuleInventory` e `InverterInventory` em raízes expansíveis de árvore.
*   **Montagem de Strings (P0):** Adaptação do `StringConfigurator` para tornar-se nó intermediário ("filho" de inversores, "pai" de módulos), orquestrando o roteamento da lógica fotovoltaica.

### 2.3 CenterCanvas (`src/modules/engineering/ui/panels/CenterCanvas.tsx`)
O *Viewport* mestre para o motor do local:
*   **HUD Reativo (P2):** Instância o `VoltageRangeChart` posicionado absolutamente e injetado via prop (`entity_id`). Somente aparece quando o outliner seleciona uma *String*, servindo de "Tooltip flutuante com dados vivos" em cima do eventual mapa do Leaflet.

### 2.4 RightInspector (`src/modules/engineering/ui/panels/RightInspector.tsx`)
O menu polimórfico na lateral direita ativado mediante o item selecionado:
*   **Painéis Paramétricos (P0 e P1):** Absolveu as propriedades de elementos únicos (p.ex: inclinações, modelo de painel, e o formulário global `SystemLossesCard`), livrando completamente do uso das pesadas `Tabs`.
*   **Análise Operacional Básica (P2):** Inclusão orgânica do Gráfico `GenerationConsumptionChart` e dos KPIs do Inversor (DC/AC Ratio Dashboard) no estado Idle (*quando nada é focado no Outliner*).

---

## 3. Estado dos Artefatos Legados

> [!NOTE]
> **Compatibilidade Mantida:** Regendo pela especificação imposta, os arquivos originais (P.ex: `SystemHealthCheck.tsx`, `PVArrayTab.tsx`, `TechStatusBar.tsx` e o diretório `components/`) não foram destruídos do repositório. O processo recriou versões modernizadas (mais rasas e velozes para o WebGL) deixando o código legado para futuras referências reversas ou rollback se necessário.

A única peça externa pendente ao fluxo de UI é o `CustomerTab.tsx`, classificada explicitamente como "fora de escopo", pelo qual foi aberto um portal orgânico em `Plano de refatoração\CRM_Cliente\Planejamento_CustomerTab.md`.

---

## 4. Auditoria Contínua de Qualidade
*   O log apurou no início da rodada de UX-001 exatos **24 Type Errors** provindos em grande parte da aba proposta (`ProposalTabs`) e dos forms não migrados.
*   No encerramento das subfases P2 e P3, o verificador acusa os resguardados 24 avisos repetidamente, afirmando um saldo de **0 Novas Regressões Tipológicas** geradas pelas migrações recentes do Kurupira.
*   Arquitetura 100% pronta para a injeção gráfica.

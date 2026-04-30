# Mapa de Interface: View de Módulos (Engineering Dashboard)

Este documento descreve a arquitetura visual, hierarquia de componentes e fluxo de dados da aba **Módulos** (`ModuleCanvasView.tsx`) do cockpit de engenharia do Kurupira.

## 1. Arquitetura Visual e Hierarquia de Componentes

A view segue o padrão de design "Dashboard de Engenharia" de alta densidade (Tier 1/2/3 layout), idêntico à arquitetura da view de Consumo e Inversores.

```mermaid
graph TD
    subgraph Stores
        SS[SolarStore]
        CS[CatalogStore]
        TS[TechStore]
    end

    subgraph ModuleCanvasView [ModuleCanvasView (Root Container)]
        MSH[ModuleSelectorHub <br/> Nível 1: Navegação e Seleção]
        MCS[ModuleContextStrip <br/> Nível 2: Edição e Contexto]
        
        subgraph ContentArea [Nível 3: Área de Conteúdo]
            direction LR
            MIA[ModuleInsightsArea <br/> Gráficos e Comparativo]
            TP[TechnicalProfile <br/> Ficha Técnica e Compatibilidade]
        end
        
        PRM([PANReviewModal <br/> Overlay])
    end

    SS -.->|projectModules, placedModules| ModuleCanvasView
    CS -.->|catalogModules| ModuleCanvasView
    TS -.->|activeInverter, electricalReport| ModuleCanvasView

    ModuleCanvasView --> MSH
    ModuleCanvasView --> MCS
    ModuleCanvasView --> ContentArea
    ModuleCanvasView -.-> PRM
```

## 2. Descrição dos Componentes Principais

### Nível 1: `ModuleSelectorHub`
Barra de navegação e seleção principal no topo da view.
*   **KPIs Globais:** Exibe o Alvo de Potência (`kWpAlvo`) vs o que já está selecionado no inventário (`kWpInstalado`), com barra de progresso (aderência).
*   **Feedback do Inversor:** Mostra o *Alias* do inversor selecionado e a taxa de oversizing (`FDI`) do sistema.
*   **Arrangement Chips:** Lista os agrupamentos de módulos (Arranjos). Cada chip exibe:
    *   Fabricante e Potência (ex: *Jinko 550W*).
    *   Status de Posicionamento Físico vs Inventário (ex: `5 / 20` indicando 5 colocados no telhado de 20 no inventário).
    *   Botão para remover o arranjo.
*   **Seletor Dropdown (ComboBox):** Permite buscar módulos do `CatalogStore` por nome, fabricante ou potência. Também inclui o botão de importar arquivos `.PAN`.

### Nível 2: `ModuleContextStrip`
Barra de ferramentas contextual ligada ao arranjo atualmente focado/selecionado no Hub.
*   **Identificação:** Ícone, fabricante, potência e modelo específico.
*   **Stepper de Quantidade (Qtd):** Edita a quantidade do modelo no inventário (não no mapa físico).
*   **Status de "Colocados":** Exibe quantos painéis físicos correspondem a este modelo (`placedCount / quantity`). Muda de cor (verde, âmbar, vermelho) se houver divergência entre físico e inventário.
*   **Métricas de Arranjo:** Potência total (kWp) daquele arranjo e área física total estimada.

### Nível 3: Área de Conteúdo Split

#### Esquerda: `ModuleInsightsArea`
Área dinâmica com abas de análise focada na tomada de decisão.
*   **Aba "Geração vs Consumo" (ComposedChart - Recharts):**
    *   Mostra o balanço energético mensal.
    *   Alimentado por `useGenerationEstimate`, cruzando irradiação mensal (HSP), Performance Ratio (PR) e o consumo médio das faturas + simulações.
    *   KPI cards para: Geração Média, Consumo Médio, Anual Estimado e Percentual de Cobertura.
*   **Aba "Comparar" (`ComparisonGrid`):**
    *   Ativada quando módulos são marcados para comparação.
    *   Renderiza uma tabela densa cruzando parâmetros elétricos e físicos (Voc, Isc, Eficiência, Peso) com marcações visuais (heatmap verde) para os melhores parâmetros.

#### Direita: `TechnicalProfile`
Ficha técnica especializada de engenharia (Side-panel direito).
*   **Curva I-V (`TechnicalDiagram`):** Renderização esquemática baseada nos parâmetros do datasheet.
*   **Limites Térmicos (NBR 16690):** Cálculos em tempo real para:
    *   Tensão Máxima a frio (Voc Máx).
    *   Tensão Mínima de operação a quente (Vmp Mín).
    *   Corrente de curto-circuito com margem (Isc × 1.25).
*   **Compatibilidade de Inversor:** Card de feedback transversal que alerta (via `electricalReport` do Validador Elétrico) se as especificações deste módulo excedem as capacidades (Voc/Isc) da topologia do Inversor Ativo.

### Overlay: `PANReviewModal`
Modal disparado via parser se houver um upload de arquivo `.PAN` válido.
*   Lida com lógica de conflito (quando um módulo com o mesmo modelo já existe no banco de dados) permitindo substituir, manter cópia ou ignorar.

## 3. Dinâmica de Estado e "Truth Source"

O grande pilar arquitetural desta View é a separação entre **Inventário Lógico** e **Mundo Físico**:

1.  **KPI Instalado:** Baseia-se no *Inventário* (soma da potência dos modelos selecionados no Hub). A métrica serve para o engenheiro compor a proposta de venda sem precisar desenhar imediatamente os painéis no telhado 3D.
2.  **Contadores de "Colocados":** A view faz a ponte com o `ProjectSlice` checando a `placedModules.length` para o `moduleSpecId` em questão.
3.  **Cross-Context:** Embora seja a aba "Módulos", ela "escuta" ativamente o estado de "Inversores" para calcular o FDI instantâneo e exibir alertas de gargalo elétrico no `TechnicalProfile`, materializando o conceito de "Cockpit Unificado".

---
*Gerado e verificado via fluxos `Chain-of-Verification` e `Divine Triad Synergy`.*

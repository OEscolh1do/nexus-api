# **Engenharia de Componentes Paramétricos e 3D: Arquitetura Híbrida em Softwares de Engenharia Web**

A convergência entre a computação de alta performance e a evolução das interfaces gráficas estabeleceu um novo paradigma no desenvolvimento de software de engenharia. A fronteira entre aplicações nativas (CAD/BIM) e aplicações baseadas em navegadores foi dissolvida por meio de uma **arquitetura híbrida**, onde a precisão vetorial 2D e a visualização tridimensional coexistem em sincronia absoluta.

No ecossistema Neonorte, essa arquitetura é materializada através do conceito **Leaflet-first with 3D Viewport**. Enquanto o Leaflet provê a base de alta fidelidade para layoutagem, posicionamento e manipulação direta no DOM/SVG (essencial para usabilidade em 2D), o motor WebGL (via React Three Fiber) oferece a profundidade necessária para simulações de sombreamento, oclusão e análise estrutural.

A construção de um sistema de componentes paramétricos exige que cada objeto — seja um módulo fotovoltaico ou um inversor — transcenda sua representação geométrica. Ele deve ser uma instância de dados físicos, elétricos e térmicos que governam o comportamento do sistema. O desafio arquitetural reside em manter o **Estado Normalizado (Zustand)** como única fonte de verdade para ambas as representações (2D e 3D), garantindo que uma alteração no "Functional Dimensioning" reflita instantaneamente na integridade do modelo.

## **1. Fundamentos Arquiteturais: O Workspace Integrado**

O padrão de interação de ferramentas técnicas exige um **Workspace Layout** modular, onde quatro zonas operam de forma interconectada:

1.  **Top Ribbon (Engenharia & Health Check):** Barra de ferramentas e indicadores de status global (conformidade elétrica, erros de dimensionamento).
2.  **Left Outliner (Hierarquia do Projeto):** Árvore detalhada de componentes, camadas (Roof, Modules, Inverters) e instâncias.
3.  **Central Canvas (Hybrid Viewport):** O coração da aplicação, alternando ou sincronizando entre o Mapa Leaflet (para layoutagem) e a Cena 3D (para visualização paramétrica e simulação física).
4.  **Right Inspector (Parametria Funcional):** Interface direta para edição de metadados, reagindo a seleções no canvas ou outliner. É aqui que grandezas como MPPT, Strings e Padrões de Inclinação são manipulados.

### **Gerenciamento Modular e ResizeObserver**
Para garantir que a interface seja fluida, utilizamos o **Dockview** ou **FlexLayout-React**. A sincronia entre o layout do DOM e o buffer da GPU é mantida via **ResizeObserver**, garantindo que o canvas WebGL nunca sofra distorção (*aspect ratio*) durante o redimensionamento dos painéis. No React Three Fiber, configuramos o componente raiz com `resize={{ debounce: 0 }}` para resposta instantânea.

## **2. Representação Visual e Metadados: O Padrão glTF**

A fundação de nossa biblioteca de ativos é o formato **glTF/GLB**. Diferente de formatos legados como OBJ ou FBX, o glTF é o "JPEG do 3D", desenhado para ser transmitido via web e carregado diretamente na GPU sem parsing pesado.

### **Injeção de Metadados (EXT_structural_metadata)**
Para conferir inteligência aos objetos, utilizamos extensões do Khronos Group para embutir metadados técnicos (Fabricante, Potência, Coeficientes Térmicos) diretamente no binário do modelo. Isso permite:
-   **Raycasting de Precisão:** Clicar em um módulo no 3D e resgatar instantaneamente suas propriedades elétricas do `EXT_structural_metadata`.
-   **Interoperabilidade BIM:** Facilidade na exportação e importação de dados compatíveis com padrões globais de engenharia.

## **3. A Camada de Dimensionamento Funcional (Functional Layer)**

Antes de qualquer simulação 3D (shaded/unshaded), o sistema deve validar a **Conformidade de Engenharia Elétrica**. Esta camada opera primariamente no `useTechStore.ts`, onde as interdependências são validadas em tempo real:

-   **Validação de Strings por MPPT:** Número de módulos em série/paralelo versus limites de tensão do inversor.
-   **Cálculo Térmico Dinâmico:** Ajuste de Voc/Vmp baseado em coeficientes de temperatura e dados meteorológicos locais.
-   **Integridade de Corrente:** Monitoramento de Isc/Imp contra os limites de entrada do rastreador MPPT.

Sem a validação desta camada, a representação 3D é puramente cosmética. No Neonorte, a geometria é uma consequência da função técnica.

## **4. Gerenciamento de Estado Global: Zustand & Jotai**

A complexidade de um sistema fotovoltaico (milhares de módulos, conexões de strings, topologia de inversores) exige um gerenciamento de estado que suporte Grafos Acíclicos Dirigidos (DAG).

### **Normalização com Zustand**
Utilizamos o **Zustand** para o estado centralizado e normalizado. Ao invés de árvores JSON profundas, os dados são achatados em dicionários indexados por UUIDs. Isso otimiza a performance de renderização (`selectors`) e permite que o **Left Outliner** e o **Right Inspector** operem de forma independente mas sincronizada.

### **Atoms com Jotai**
Para micro-interações intensas na UI do Inspector, o **Jotai** oferece uma abordagem atômica complementária, permitindo que alterações granulares não disparem re-renders na árvore global de componentes.

## **5. Undo/Redo e Histórico Imutável (Immer Patches)**

Em um ambiente CAD de engenharia, a capacidade de desfazer/refazer ações com precisão é crítica. Implementamos uma estratégia baseada em **Immutable Patches** via **Immer.js** e **zundo**.

Ao invés de salvar snapshots memoriosos (clones do projeto inteiro), o sistema grava apenas os "patches" (deltas) de alteração. Se um usuário altera a inclinação de um arranjo de 30° para 35°, o `zundo` armazena apenas esse fragmento JSON. Isso garante:
-   **Baixo consumo de memória:** Suporte a milhares de níveis de Undo sem comprometer a estabilidade do navegador.
-   **Time-Travel Debugging:** Facilidade na auditoria de alterações durante o processo de design.

## **Conclusão: O Futuro da Engenharia Fotovoltaica na Web**

A arquitetura do Neonorte prova que a web atingiu a maturidade para hospedar ferramentas de engenharia de alta criticidade. Ao adotar o modelo **Leaflet-first with 3D Viewport**, superamos a dicotomia entre usabilidade e profundidade técnica.

O sucesso desta abordagem repousa em três pilares:
1.  **Estado Normalizado (Zustand):** Onde a lógica elétrica (`useTechStore`) e a geometria (`solarStore`) coexistem sem redundância.
2.  **Hybrid Rendering:** Leaflet para precisão 2D e manipulação de layout; R3F/WebGL para análise física e visualização volumétrica.
3.  **Parametria Funcional:** O entendimento de que um componente 3D só tem valor se estiver eletricamente correto e termicamente validado.

Esta especificação serve como o mapa para a evolução contínua do ecossistema, garantindo que cada novo componente adicionado ao catálogo seja performático, preciso e robusto.
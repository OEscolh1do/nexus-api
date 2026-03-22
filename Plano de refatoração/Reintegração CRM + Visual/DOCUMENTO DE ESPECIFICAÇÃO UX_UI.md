---

# **📄 DOCUMENTO DE ESPECIFICAÇÃO UX/UI (UX-001)**

**Iniciativa:** Refatoração Visual \- Do CRM Tradicional para o *Workspace* de Engenharia

**Aplicação:** Kurupira (Frontend B2B)

**Arquiteto Responsável:** Antigravity AI / Engenharia Principal

**Status:** 🟡 Em Planeamento

Para aprofundar a **Visão Executiva e Objetivo**, é necessário desdobrar a filosofia de produto, a psicologia cognitiva do utilizador e a maturidade tecnológica que sustentam esta transformação. Como Arquiteto, expando esta secção para detalhar exatamente *porquê* o formato CRM falha para a engenharia e *como* o novo paradigma eleva o Kurupira a uma ferramenta de classe mundial.

Aqui está o aprofundamento estratégico e conceitual da Secção 1 do nosso UX-001:

---

### **1\. Visão Executiva e Objetivo (Aprofundamento)**

A presente especificação dita o abandono definitivo do formato clássico de "Software de Gestão/CRM" (baseado em formulários verticais, funis de conversão e tabelas densas de paginação) na aplicação Kurupira. O objetivo primário é transmutar a interface para uma arquitetura de ambiente de trabalho integrado (*Workspace Layout*), otimizada para o raciocínio espacial e simulação matemática.

O desdobramento desta visão assenta em quatro pilares fundamentais:

#### **1.1. O Colapso do Paradigma Web Tradicional na Engenharia**

A construção de uma plataforma SaaS voltada para o mercado B2B de engenharia exige funcionalidades complexas, como modelagem espacial e design paramétrico, comparáveis a *softwares* estabelecidos como SketchUp, AutoCAD e Reonic. Neste contexto, o padrão de navegação tradicional da web — que foi desenhado para consumir rotas e ler documentos em formato de hipertexto — demonstra-se fundamentalmente inadequado.

Um engenheiro não "lê páginas" de um cliente; ele "manipula um ambiente". O Kurupira abandonará a navegação por páginas (Page-based Routing) e adotará o modelo de Aplicação de Autoria (Authoring Tool), onde o utilizador entra num *Canvas* infinito e as ferramentas flutuam à sua volta.

#### **1.2. A Dissolução da Fronteira Nativa vs. Web (Convergência)**

Até recentemente, ferramentas de engenharia pesadas precisavam de ser instaladas no computador (Desktop Apps). No entanto, a convergência entre a computação de alta performance e a evolução das tecnologias web (como WebGL e WebAssembly) dissolveu efetivamente a fronteira que separava aplicações nativas instaláveis de aplicações baseadas em navegadores. O Kurupira tirará partido desta convergência para entregar uma experiência fluida, sem engasgos de *scroll* ou recarregamentos de página, sentindo-se como um *software* local a rodar a 60 *frames* por segundo.

#### **1.3. A Metamorfose do Modelo Mental (De "Leads" para "Sítios")**

A semântica de um sistema dita o comportamento do seu utilizador. O Kurupira deixará de tratar os dados sob a ótica comercial ("Leads", "Oportunidades", "Negociações"). Essa responsabilidade pertence estritamente ao ERP Iaçã. No Kurupira, a entidade principal passa a ser o **Sítio (*Site*)** — a representação física e geográfica do local de instalação — e o **Projeto Técnico** — o conjunto de parâmetros elétricos e equipamentos ali aplicados. Esta mudança de vocabulário alinha a ferramenta com o modelo mental natural do engenheiro, eliminando a dissonância cognitiva de ter de "avançar uma Oportunidade" quando o que ele realmente quer é "Aprovar um Design Técnico".

#### **1.4. Imersão Técnica e Blindagem da Carga Cognitiva**

A interface de uma ferramenta de engenharia requer uma arquitetura que proteja o foco do utilizador. Um CRM tradicional bombardeia o ecrã com notificações de vendas, metas de faturação e *status* de contratos. O Kurupira focará na **imersão absoluta**. Ao confinar o contexto comercial (nome do cliente, consumo e morada) a um painel lateral recolhível (o *Right Inspector*), libertamos a esmagadora maioria dos píxeis do ecrã para o mapa topográfico, para o diagrama unifilar e para as simulações de geração. A eliminação destas distrações administrativas reduz drasticamente a carga cognitiva, diminuindo a fadiga do engenheiro e a probabilidade de erros críticos no dimensionamento.

---

### **2\. Paradigma de Navegação e Zonas Críticas (Aprofundamento Técnico)**

A navegação no Kurupira transcende a simples troca de URLs. As três fases do ciclo de vida representam **estados de imersão progressiva**, geridos por uma máquina de estados (ex: *Zustand*) que mantém a aplicação leve e reativa.

#### **2.1. Fase 1: Explorador de Projetos (Otimização de Grelha)**

A principal armadilha técnica de uma grelha Visual-First é o consumo massivo de memória. Carregar 50 mapas interativos do *Leaflet* simultaneamente destruiria a performance do *browser*.

* **Virtualização e Mapas Estáticos:** Para contornar isto, a grelha utilizará *Virtualização de Listas* (renderizando apenas os cartões visíveis no ecrã). As imagens de destaque não serão instâncias interativas de mapas, mas sim *Static Map Tiles* (imagens PNG comprimidas e em *cache* geradas nas gravações anteriores do projeto).  
* **Pesquisa de Engenharia Reativa:** Os filtros técnicos (ex: Potência Alvo, Tensão) operarão diretamente num motor de filtragem *in-memory* no *frontend* ou via *debounced requests* ultrarrápidos, garantindo que a grelha responda à digitação do engenheiro em menos de 100 milissegundos.

  #### **2.2. Fase 2: O Contexto 360º (Transição e *Pre-fetching*)**

O Contexto 360º não é apenas um ecrã de leitura; é um **estado de transição arquitetural**.

* **Vista Sobreposta (*Overlay*):** Em vez de destruir a grelha e carregar uma nova rota, o painel do Contexto 360º desliza sobre o ecrã atual.  
* **A Ilusão de Rapidez (*Pre-fetching*):** Enquanto o engenheiro analisa o gráfico de barras do histórico de consumo de energia e inspeciona a geolocalização, o Kurupira aproveita esses segundos para, silenciosamente, fazer o *download* e a pré-compilação do motor pesado de renderização vetorial e das bibliotecas de cálculo elétrico em *background*.  
* **A Barreira de Mutação:** Ao blindar este ecrã contra edições de "Nome" ou "Email" (que pertencem ao Iaçã), eliminamos a necessidade de validações de formulário complexas nesta etapa, mantendo o foco do utilizador puramente analítico.

  #### **2.3. Fase 3: O *Workspace* de Engenharia (A Metamorfose)**

Ao clicar em **\[ Dimensionar Projeto \]**, a aplicação entra no seu estado imersivo final. A interface sofre uma animação de transição gerida por *CSS Grid* dinâmico, onde o painel divide-se em quatro zonas clássicas de aplicações de autoria:

* **Top Ribbon (Contexto Global):** Uma barra horizontal fixada no topo que abriga os controlos globais e disparadores de simulação. É aqui que residem os modos da ferramenta (Cursor, Desenhar Polígono de Telhado, Colocar Módulos).  
* **Center Canvas (A Área de Foco):** É o motor de renderização principal (Canvas 2D ou motor GIS do Leaflet). Ele ocupa a grande maioria dos píxeis (70% do ecrã), libertando o campo de visão do engenheiro para manipular a instalação solar com extrema precisão sem as distrações do CRM.  
* **Left Outliner (Árvore do BOS):** Uma árvore hierárquica profunda, alocada na lateral esquerda, que lista todos os componentes do sistema em camadas. Aqui estarão os Inversores, *Strings* e Módulos. A sua grande vantagem é a **sincronia bidirecional**: se o engenheiro clica numa *String* no *Canvas* central, ela ilumina-se instantaneamente no *Left Outliner*, e vice-versa.  
* **Right Inspector (O Motor Paramétrico):** O ecrã anterior de "Contexto 360º" não desaparece; ele recolhe-se e condensa-se neste painel direito. Este é um painel dinâmico cujas propriedades se metamorfoseiam. Se o utilizador não tiver nada selecionado, o inspetor exibe as métricas de Consumo e o Clima do local. Se o utilizador clicar num Painel Solar no *Canvas*, o *Right Inspector* muda imediatamente para exibir o modelo, o azimute, a inclinação e as perdas elétricas daquele painel específico.

---

### **3\. Topologia de Componentes Frontend (React 19): Aprofundamento Técnico**

Para suportar esta refatoração sem colidir com a dívida técnica do código legado (o antigo *dashboard* com abas horizontais), vamos construir a nova diretoria `/kurupira/frontend/src/modules/engineering/ui/` sob o paradigma de **Isolamento por Composição**.

Cada componente desta topologia possui fronteiras de responsabilidade (*boundaries*) estritas e blindadas contra *re-renders* em cascata.

#### **3.1. A Camada de Entrada e Transição**

* **`ProjectExplorer.tsx` (A Grelha Virtualizada):**  
  * **Responsabilidade:** Renderizar centenas de projetos sem penalizar a DOM.  
  * **Tática de Engenharia:** Utilizará bibliotecas de virtualização (como `@tanstack/react-virtual`). Em vez de renderizar 100 cartões HTML, o React renderiza apenas os 12 cartões que estão fisicamente visíveis no ecrã, trocando o conteúdo dinamicamente durante o *scroll*.  
* **`SiteContextModal.tsx` (O *Proxy* de Hidratação):**  
  * **Responsabilidade:** Atuar como a ponte temporal entre a grelha e o motor de desenho pesado.  
  * **Tática de Engenharia:** Enquanto este componente flutua no ecrã mostrando o gráfico de consumo, ele aciona *Web Workers* em *background* para pré-aquecer os cálculos solares pesados e carregar as bibliotecas WebGL/Leaflet, mascarando o tempo de carregamento da Fase 3\.

#### **3.2. A Orquestração do Modo *Workspace***

O ecrã principal de engenharia não usa o `flexbox` tradicional da web, mas sim um esqueleto rígido e absoluto.

* **`WorkspaceLayout.tsx` (O Esqueleto CSS Grid):**  
  * **Responsabilidade:** Evitar mudanças bruscas de *layout* (*Layout Shifts*) e gerir o redimensionamento dos painéis.  
  * **Tática de Engenharia:** Será construído com `CSS Grid Layout` (`100vh`, `100vw`, com `overflow: hidden`). Ele injeta os 4 subcomponentes nas suas respetivas áreas da grelha. Ele **não** guarda o estado do polígono desenhado; o seu único trabalho é manter os painéis fixos.

#### **3.3. Os Quatro Órgãos Vitais do Desenho Técnico**

* **`TopRibbon.tsx` (Comandos O(1)):**  
  * **Responsabilidade:** Ferramentas globais (Desfazer, Refazer, Exportar PDF, Desenhar).  
  * **Tática de Engenharia:** Este componente consome o estado de "Ferramenta Ativa" do *Zustand Store*. Ao clicar em "Desenhar Polígono", ele apenas altera uma variável `activeTool: 'POLYGON'`, enviando o comando para o mapa instantaneamente.  
* **`CenterCanvas.tsx` (A Fronteira WebGL/Leaflet):**  
  * **Responsabilidade:** Renderização a 60 *Frames* por Segundo (FPS) do telhado e dos módulos solares.  
  * **Tática de Engenharia:** Este componente é envolvido em `React.memo()`. O React não deve tentar interferir com as manipulações internas do mapa. Passaremos o controlo do DOM dentro desta caixa para a API do Leaflet ou do WebGL, criando uma "zona de escape" onde a performance visual é ditada pela Placa Gráfica (GPU) e não pelo motor virtual do React.  
* **`LeftOutliner.tsx` (A Árvore de Performance):**  
  * **Responsabilidade:** Listar Inversores, *Strings* e as dezenas de Módulos Solares.  
  * **Tática de Engenharia:** Como pode conter centenas de linhas (ex: um sistema de 200 painéis), a árvore também será virtualizada. Ao passar o rato por cima de um nó ("Módulo 42") na árvore, dispara um evento que ilumina o respetivo polígono no `CenterCanvas`, operando por *referência de ID* para evitar re-renderizar a árvore inteira.  
* **`RightInspector.tsx` (A Injeção M2M e Polimorfismo):**  
  * **Responsabilidade:** Exibir propriedades contextuais e os dados provenientes do ERP Iaçã.  
  * **Tática de Engenharia:** Este componente é **polimórfico**. Renderiza um formulário diferente consoante a entidade selecionada no `CenterCanvas` (Se nada for selecionado \-\> Mostra o Cliente do Iaçã; Se Inversor selecionado \-\> Mostra o modelo de tensão e curtas; Se Módulo selecionado \-\> Mostra o Azimute).

---

### **4\. Integração de Dados (A Ponte com o Iaçã): Aprofundamento Técnico**

A fluidez visual e a garantia de *Single Source of Truth* (SSOT) dependem de uma coreografia perfeita entre o motor de estado do React (`Zustand`), bibliotecas de *Server-State* (como `TanStack React Query`) e o padrão *Backend-For-Frontend* (BFF).

#### **4.1. O Padrão BFF (A Camada de Isolamento)**

É crucial entender que o *Frontend* do Kurupira **nunca** fará requisições HTTP diretamente para o servidor do Iaçã. O navegador do cliente não precisa de saber que o Iaçã existe.

* **O Fluxo:** O `ProjectExplorer.tsx` faz um pedido simples: `GET /api/kurupira/projects`.  
* **A Mágica no Backend:** O servidor Node.js do Kurupira recebe o pedido, vai à sua base de dados (`db_kurupira`) buscar a lista de projetos técnicos, recolhe os `iaca_lead_ids`, e faz uma chamada ultrarrápida (M2M via rede interna do Docker) ao Iaçã para traduzir esses IDs em "Nomes e Moradas". O *backend* do Kurupira compila tudo num único JSON estruturado e devolve ao *frontend*.  
* **Vantagem:** O *frontend* recebe a grelha pronta a renderizar em milissegundos, sem sofrer com problemas de CORS ou bloqueios do *browser*.

  #### **4.2. Carregamento Otimizado (A Grelha Leve)**

O `ProjectExplorer.tsx` não pode ser sobrecarregado com gigabytes de dados desnecessários.

* **Paginação por *Cursor* / *Infinite Scroll*:** Utilizando `React Query`, a lista de projetos é carregada em lotes (ex: 20 em 20).  
* **Payload Anorético:** O JSON que alimenta os cartões da grelha contém estritamente o necessário para a decisão de clique do engenheiro:  
  JSON  
  {  
*   "projectId": "prj\_999",  
*   "technicalStatus": "DRAFT",  
*   "targetPowerKwp": 75,  
*   "commercialContext": {  
*     "clientName": "Supermercado Central",  
*     "city": "Manaus",  
*     "averageConsumptionKwh": 12000  
*   },  
*   "thumbnailUrl": "/assets/map-cache/prj\_999.png"  
* }  
* 

  #### **4.3. Injeção em Memória e Estado Efémero (Zustand)**

Quando o engenheiro clica no cartão e entra no *Workspace* (Fase 3), precisamos dos detalhes profundos (telefone, histórico de 12 meses de faturação, tarifa de ponta, etc.).

* **O *Fetch* de Hidratação:** O `RightInspector.tsx` dispara o `GET /api/kurupira/projects/prj_999/context`.  
* **A Loja Efémera (`useCommercialContextStore`):** Os dados recebidos **não são** gravados na base de dados do Kurupira. Eles são injetados diretamente na memória RAM do navegador através do `Zustand`.  
* **Isolamento de Estado:** O `Zustand` terá um *slice* (fatia) específico para o contexto comercial. O *Left Outliner* e o *Center Canvas* nunca subscrevem a este estado, garantindo que se o consumo do cliente for atualizado no painel direito, o mapa 3D no centro não sofre um *re-render* acidental.  
* **Limpeza Automática (Garbage Collection):** Quando o engenheiro clica em "Fechar Projeto" e volta à grelha, o *Zustand store* é limpo (`store.reset()`). Nenhum vestígio do cliente fica na memória do Kurupira.

  #### **4.4. Degradação Graciosa (Resiliência de UI)**

O que acontece à interface se o contentor Docker do Iaçã estiver a ser reiniciado no exato momento em que o engenheiro abre o *Workspace*? A engenharia não pode parar.

* Se a chamada M2M falhar, o Kurupira Backend devolve um código `206 Partial Content` (ou equivalente).  
* O `RightInspector.tsx` captura este estado e, em vez de mostrar um "Ecrã Branco da Morte", apresenta um estado de erro contido apenas naquele painel:  
  ⚠️ *Contexto Comercial temporariamente indisponível. A conexão com o Iaçã será restabelecida automaticamente.*  
* O engenheiro pode continuar a desenhar módulos no telhado e a calcular *Strings* no *Canvas* central de forma totalmente ininterrupta.

---

## **5\. Critérios de Êxito da Refatoração**

* \[ \] Eliminação completa de formulários de "Cadastro de Cliente" na interface do Kurupira.  
* \[ \] A navegação entre o Explorador de Projetos e o *Workspace* ocorre sem recarregamento completo da página (*Single Page Application* fluida).  
* \[ \] O utilizador tem acesso contínuo aos dados de consumo (gráfico) do cliente no painel direito, enquanto desenha o telhado no centro do ecrã.

---


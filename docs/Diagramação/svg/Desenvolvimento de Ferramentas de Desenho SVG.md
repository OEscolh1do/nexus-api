# **Arquitetura e Engenharia de Software para o Desenvolvimento de Ferramentas de Desenho SVG Baseadas na Web**

## **Introdução à Engenharia de Vetores na Web**

O desenvolvimento de ferramentas de desenho vetorial baseadas na web representa um dos maiores desafios de engenharia de software voltada ao navegador. Ao contrário de aplicações tradicionais de renderização rasterizada, um editor de *Scalable Vector Graphics* (SVG) precisa equilibrar a manipulação direta de uma árvore de documentos complexa com respostas visuais de latência ultra-baixa.1 Historicamente, o SVG consolidou-se como o padrão definitivo para gráficos vetoriais na web devido à sua independência de resolução, tamanho de arquivo reduzido e integração nativa com o Document Object Model (DOM).1

No entanto, projetar uma aplicação que permita interações intuitivas, como desenho à mão livre, translações, zoom e manipulações de curvas de Bézier em tempo real, exige uma arquitetura meticulosa.2 Este relatório analisa de forma exaustiva os padrões arquiteturais, os modelos de gerenciamento de estado, os algoritmos geométricos e as técnicas de otimização necessárias para projetar e construir ferramentas de desenho SVG web de alta performance.

## ---

**1\. Paradigmas de Arquitetura de Software em Editores Vetoriais**

A sustentabilidade de um editor de desenhos web reside na separação estrita entre o motor de manipulação gráfica e a interface do usuário.7 O acoplamento inadequado desses componentes resulta em interfaces lentas e motores de desenho difíceis de manter e estender.7

### **Desacoplamento de Componentes: O Modelo Motor Gráfico vs. Interface**

Em arquiteturas maduras como a do SVGEdit, o sistema é dividido em duas partes fundamentais: o núcleo geométrico, denominado svgcanvas, e a interface gráfica, conhecida como editor.7 O componente svgcanvas funciona como um motor agnóstico de framework, encarregado de gerenciar as operações de desenho, inserção de formas e manipulação direta de elementos XML no DOM.7 Esta separação permite que o mesmo motor gráfico seja facilmente integrado em diferentes ecossistemas, como React, Vue ou Svelte.7

Sob outra ótica, o tldraw organiza a manipulação visual por meio de classes utilitárias chamadas ShapeUtil.8 Cada tipo de forma geométrica no plano de desenho estende essa classe base para definir de forma isolada suas propriedades físicas, manipulação de alças (*handles*), lógica de renderização e comportamento de exportação para SVG.8 As ações do usuário são direcionadas através de máquinas de estado hierárquicas, estruturadas em nós chamados StateNode.8 Essas máquinas de estado filtram as entradas do teclado, do mouse ou de interações de toque (*pinch*, *swipe*) e coordenam as transições de ferramentas de forma previsível.8

### **Manipulação de Baixo Nível e Abordagens Baseadas em Código**

Alguns editores modernos adotam o princípio de edição estruturada com baixo nível de abstração.10 O GodSVG, por exemplo, representa o código fonte SVG diretamente e em tempo real, sem adicionar metadados proprietários aos arquivos gerados.10 À medida que o usuário manipula graficamente os vetores na tela, o código fonte legível por humanos é atualizado de forma síncrona, permitindo que desenvolvedores alternem perfeitamente entre a manipulação visual e a digitação direta do código.10 Para otimizar esse fluxo de trabalho baseado em comandos, implementam-se atalhos de teclado de alto desempenho: teclas como M, L, H, V, Z, A, Q, T, C e S são mapeadas para inserir comandos de caminho de forma encadeada, enquanto a pressão simultânea da tecla Shift alterna o comando inserido entre coordenadas absolutas e relativas.10

Adicionalmente, o conceito de "diagramação como código" (*Diagrams-as-Code*) expande essa abordagem declarativa.11 Ferramentas baseadas no processador svgdx estendem a especificação tradicional do SVG ao introduzir um superconjunto de instruções simplificadas.11 Esse formato suporta posicionamento relativo através do símbolo circunflexo (^) ou de referências diretas por IDs, reutilização de fragmentos baseada em templates, loops e variáveis, além de atributos abreviados de alta conveniência, como wh para definir largura (*width*) e altura (*height*) de forma unificada.11 No desenvolvimento web, esse superconjunto pode ser processado localmente ou de forma remota via chamadas HTTP a uma instância ativa do svgdx-server, que expõe o endpoint /api/transform para converter os códigos declarativos em elementos SVG nativos em tempo de execução.11

### **Ambientes Funcionais e Procedurais**

Para fluxos de trabalho que integram design tradicional e arte generativa, soluções como o Repath Studio utilizam ClojureScript e programação funcional para estruturar suas engines.12 A escolha pelo ClojureScript justifica-se pela imutabilidade de dados nativa e estabilidade das bibliotecas funcionais, facilitando a manipulação segura de estados geométricos complexos e prevenindo efeitos colaterais na renderização.12 Esse tipo de ferramenta geralmente inclui uma console ou *shell* interativa para execução de scripts procedurais em tempo real, permitindo aos usuários automatizar desenhos, criar padrões matemáticos complexos e estruturar animações SMIL (*Synchronized Multimedia Integration Language*) nativas do SVG.12 Além disso, o encapsulamento dessas ferramentas em contêineres como Chromium Embutido (Electron) assegura a consistência das APIs web e da experiência de renderização entre diferentes sistemas operacionais.12

### **Gerenciamento de Estado Reativo com Sinais**

Para sustentar a alta performance em desenhos que comportam milhares de formas, editores contemporâneos descartam o gerenciamento de estado global centralizado convencional.8 Em seu lugar, implementa-se um sistema reativo baseado em sinais (*signals*).8 Por meio de primitivas atômicas como Atom (estados mutáveis básicos) e Computed (valores derivados computados de forma incremental), o sistema rastreia automaticamente as dependências de dados.8 Quando um vetor específico sofre translação, apenas os componentes e cálculos que dependem estritamente daquelas coordenadas são invalidados e atualizados.8 Essa abordagem evita renderizações redundantes no DOM e mantém a experiência fluida mesmo sob cargas severas de trabalho.2

## ---

**2\. Escolha Tecnológica: Comparativo de Mecanismos de Renderização**

A escolha do motor gráfico subjacente dita as capacidades de performance, portabilidade e interatividade de uma ferramenta de desenho web.1 Embora a renderização direta em elementos SVG seja o caminho natural devido à conformidade com padrões de documentos vetoriais, a combinação com HTML5 Canvas ou WebGL abre caminhos alternativos.1

| Tecnologia/Biblioteca | Tipo de Renderização | Desempenho (Alta Densidade de Objetos) | Suporte Nativo a SVG | Modelo de Interação | Manipulação de Curvas de Bézier e Vetores |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **SVG Nativo** 1 | Declarativo / DOM | Baixo (Sofre gargalos com mais de ![][image1] nós) 2 | Nativo e imediato 1 | Direto via listeners de eventos no DOM 1 | Excelente suporte declarativo nativo 1 |
| **Konva** 15 | Procedural / Canvas 2D | Alto (Otimizado via múltiplas camadas) 15 | Apenas importação estática 15 | Eventos integrados com detecção de colisão 15 | Limitado a renderização básica de caminhos 15 |
| **Fabric.js** 15 | Procedural / Canvas 2D | Alto (Converte vetores em objetos lógicos de Canvas) 16 | Parser bidirecional completo (importa e exporta) 15 | Alças de transformação integradas nativamente 15 | Moderado (focado em edição e transformações) 15 |
| **Paper.js** 15 | Procedural / Canvas 2D | Alto (Usa Canvas para desenho vetorial) 19 | Conversão e serialização completas 16 | Lógica de interação matemática via PaperScript 19 | Excelente (Foco em matemática vetorial e operações booleanas) 15 |
| **Two.js** 19 | Abstrato (Agnóstico: SVG, Canvas, WebGL) 19 | Variável de acordo com o renderer selecionado 19 | Exporta para SVG de forma limpa 19 | Eventos de animação e ciclo de render integrados 19 | Moderado (focado em primitivas e animação) 19 |
| **PixiJS** 15 | Procedural / WebGL | Ultra-alto (Aceleração total por GPU) 15 | Limitado (Apenas texturas ou caminhos simples) 15 | Focado em alta taxa de quadros e games 15 | Fraco para edição vetorial geométrica complexa 15 |

Se o editor projetado tiver como foco diagramas simples, ilustrações técnicas leves ou edição estruturada de código XML, a abordagem baseada em **SVG Nativo** é ideal, pois os elementos residem diretamente na árvore do DOM e respondem a interações nativas sem esforço de programação extra.1 Todavia, se a aplicação demandar interações intensas com dezenas de milhares de elementos simultâneos — como grandes visualizações de dados, fluxogramas dinâmicos gigantes ou mapas complexos —, o gargalo de recalcular o layout do DOM degradará a performance (*jank*).2 Ferramentas construídas com D3.js, por exemplo, demonstram instabilidade extrema sob essas condições de densidade quando o usuário aciona funções simultâneas de zoom, pan e busca interativa de nós.2

Para superar essas limitações de desempenho sem abdicar da fidelidade vetorial, arquiteturas híbridas baseadas em **Paper.js** ou **Fabric.js** mostram-se valiosas.15 O Paper.js renderiza o conteúdo gráfico na velocidade de pixel do elemento Canvas, mas mantém em memória uma estrutura puramente geométrica baseada em vetores, rastreando caminhos e nós interativos, sendo capaz de recalcular interseções de curvas complexas e, ao final do processo, serializar todo o plano de volta para uma árvore de elementos SVG válida.15

Da mesma forma, o Konva adota uma estratégia de renderização em múltiplas camadas de Canvas sobrepostas: elementos estáticos de fundo (como grades de referência ou guias) permanecem em uma camada inativa e não passam por re-renderização quando formas interativas são arrastadas em camadas superiores, otimizando consideravelmente os tempos de atualização visual.15

## ---

**3\. Geometria Computacional, Transformação de Coordenadas e Navegação**

Um editor de desenhos interativo necessita transpor instantaneamente os cliques ou toques do usuário — capturados na escala de pixels físicos da tela do dispositivo — para o sistema de coordenadas lógicas de escala arbitrária do plano de desenho.5

### **Transposição de Espaço de Coordenadas**

A conversão exata entre o espaço bidimensional do cliente (*Viewport Space*) e o espaço de desenho do elemento SVG (*User Space*) baseia-se na aplicação da matriz inversa de transformação afim obtida por meio da interface nativa getScreenCTM().5 Dado um vetor contendo as coordenadas de tela ![][image2], e a matriz cumulativa de tela resolvida do elemento ![][image3], o vetor de coordenadas lógicas transpostas ![][image4] é computado pela multiplicação matricial 5:

![][image5]  
A implementação prática dessa operação em JavaScript deve ser otimizada para evitar alocação excessiva de memória e gargalos no coletor de lixo (*garbage collector*), uma vez que é disparada continuamente durante eventos de movimento do cursor.5 O bloco de código abaixo ilustra a transposição matemática limpa utilizando as interfaces nativas do padrão W3C 5:

JavaScript

/\*\*  
 \* Converte coordenadas do viewport do cliente para as coordenadas lógicas do SVG.  
 \* @param {number} clientX \- Coordenada X do cursor do mouse ou toque.  
 \* @param {number} clientY \- Coordenada Y do cursor do mouse ou toque.  
 \* @param {SVGSVGElement} svgElement \- O elemento \<svg\> raiz que atua como viewport principal.  
 \* @param {SVGGraphicsElement} localElement \- O elemento ou grupo (\<g\>) cujas coordenadas locais devem ser obtidas.  
 \* @returns {{x: number, y: number}} Objeto contendo as coordenadas x e y resolvidas.  
 \*/  
function transformViewportToElementSpace(clientX, clientY, svgElement, localElement) {  
    // Instanciação de um ponto utilitário reutilizável para evitar reatribuição de memória  
    const point \= svgElement.createSVGPoint();  
    point.x \= clientX;  
    point.y \= clientY;  
      
    // Obtenção da matriz cumulativa de tela do elemento alvo  
    const screenCTM \= localElement.getScreenCTM();  
    if (\!screenCTM) {  
        throw new Error("Falha ao recuperar a matriz de transformação do elemento SVG.");  
    }  
      
    // Inversão da matriz de transformação de tela  
    const inverseCTM \= screenCTM.inverse();  
      
    // Aplicação da transformação matricial afim  
    const transformedPoint \= point.matrixTransform(inverseCTM);  
      
    return {  
        x: transformedPoint.x,  
        y: transformedPoint.y  
    };  
}

Essa lógica de transposição deve estar no centro das interações de desenho de qualquer ferramenta baseada na web, garantindo que o desenho se alinhe exatamente abaixo da ponta do cursor, independente de qualquer zoom, pan ou transformação rotacional aplicada às formas geométricas.5

### **Mecânica de Pan e Zoom de Alta Performance**

A navegação contínua por um canvas infinito requer a aplicação correta de translações e escalas.2 Uma solução robusta consiste na integração de utilitários de controle como o svg-pan-zoom.26 Esta biblioteca anexa listeners para capturar o movimento do mouse, roda (*mouse wheel*), cliques duplos e gestos de toque em dispositivos móveis, como o gesto de pinça (*pinch-to-zoom*) e toques duplos (*double-tap*).26

Para evitar leituras custosas ao DOM que quebram o fluxo de renderização do navegador, o motor do svg-pan-zoom armazena em cache as dimensões lógicas do viewBox (origem, largura, altura, coordenadas de offset) e a matriz de transformação corrente aplicada ao grupo de elementos visuais do viewport (viewportSelector).26 A escala de zoom é modificada controlando os atributos a e d da matriz de transformação do SVG.26

Ao implementar limites de pan e limites mínimos ou máximos de zoom através de funções de callback (beforePan e beforeZoom), a aplicação consegue interceptar a ação do usuário e retornar valores booleanos ou coordenadas ajustadas para travar o deslocamento sobre eixos específicos, prevenindo desorientação espacial do operador dentro da área de desenho.26

## ---

**4\. Sistema de Histórico e Engenharia de Desfazer/Refazer (Undo/Redo)**

Em um editor gráfico interativo, as operações de desfazer e refazer exigem mais do que simples pilhas lineares de controle; elas demandam um modelo transacional rigoroso de gerenciamento de histórico.27

### **O Grafo de Estados e o Padrão Command**

Ao contrário do modelo ingênuo de captura de instantâneos lógicos da aplicação, o desenvolvimento profissional de editores gráficos adota o padrão estrutural **Command** para rastrear deltas de transição.29 Cada alteração realizada pelo usuário é encapsulada em uma transação lógica que conhece intrinsecamente seu estado anterior, seu novo estado e como transitar de forma reversível entre eles.29 O histórico pode ser modelado teoricamente como um grafo direcionado de estados, onde retroceder no tempo equivale a percorrer os caminhos de transição de forma reversa 28:

  \[Estado Inicial\] \---\> (Ação 1\) \---\> \[Estado A\] \---\> (Ação 2\) \---\>  
                                        ^  
                                        |  (Undo)  
                                        v  
                                    \[Estado A\] \---\> (Ação Nova) \-\> \[Estado C\]

Na ocorrência de um comando de desfazer (*undo*), o sistema consome o topo da pilha de comandos desfazíveis (undoStack), invoca a função unexecute() passando as propriedades originais do elemento e, em seguida, empurra a referência desse comando executado para o topo da pilha de refações (redoStack).29 Se o usuário realiza uma alteração inédita após ter desfeito uma série de passos, o ramo futuro representado pela pilha de refações é permanentemente limpo para prevenir bifurcações incoerentes de estado na árvore temporal da aplicação.28

Abaixo apresenta-se um exemplo de estruturação conceitual para o gerenciamento de histórico baseado no padrão Command utilizando objetos literais em JavaScript 29:

JavaScript

/\*\*  
 \* Gerenciador de histórico de transações para ferramentas de desenho vetorial.  
 \*/  
class DocumentHistoryManager {  
    constructor() {  
        this.undoStack \=;  
        this.redoStack \=;  
    }

    /\*\*  
     \* Executa e registra uma nova alteração de estado estruturado na pilha do histórico.  
     \* @param {object} command \- O objeto command contendo os métodos execute e unexecute.  
     \* @param {any} data \- O payload de dados contendo o estado anterior e o novo estado.  
     \*/  
    executeCommand(command, data) {  
        command.execute(data);  
        this.undoStack.push({ command, data });  
        // Limpeza obrigatória da pilha de refações para prevenir desvios temporais  
        this.redoStack.length \= 0;  
    }

    /\*\*  
     \* Desfaz o último comando presente no histórico de operações.  
     \* @returns {boolean} Retorna verdadeiro se a reversão for realizada com sucesso.  
     \*/  
    undo() {  
        const entry \= this.undoStack.pop();  
        if (\!entry) return false;  
          
        entry.command.unexecute(entry.data);  
        this.redoStack.push(entry);  
        return true;  
    }

    /\*\*  
     \* Refaz a última ação que havia sido desfeita pelo usuário.  
     \* @returns {boolean} Retorna verdadeiro se a refação for executada com sucesso.  
     \*/  
    redo() {  
        const entry \= this.redoStack.pop();  
        if (\!entry) return false;  
          
        entry.command.execute(entry.data);  
        this.undoStack.push(entry);  
        return true;  
    }  
}

Este modelo reduz o consumo de memória de forma exponencial em relação à clonagem total de documentos, permitindo que apenas os deltas das propriedades afetadas (como coordenadas específicas, cores de preenchimento ou nós de curvas) permaneçam alocados na pilha.30

### **Colaboração em Tempo Real e Desafios de Sincronização**

A substituição completa de objetos de estado na memória de forma direta (técnica comum em editores baseados puramente no paradigma Memento ou utilizando bibliotecas como Immer) mostra-se inviável em aplicações modernas de design colaborativo que exigem sincronização simultânea e edição concorrente em tempo real.27 Se múltiplos usuários interagem no mesmo plano de desenho compartilhando conexões WebSocket ativas apoiadas por tecnologias como Cloudflare Durable Objects, a alteração simultânea da mesma forma por dois operadores criaria conflitos insolúveis e sobrescritas de dados catastróficas.13

Nesse cenário, os editores utilizam algoritmos de conciliação de estado baseados em Tipos de Dados Replicados Sem Conflito (CRDTs) ou transformações operacionais aplicadas aos deltas de comandos compartilhados.13 Quando ocorrem edições concorrentes que geram conflitos físicos de colisão geométrica, o sistema resolve as divergências através de regras padronizadas de reconciliação automática (por exemplo, aplicando a alteração baseada no timestamp mais recente) ou notificando de forma visual o usuário sobre o conflito de autoria do elemento para resolução manual direta.13

Além disso, para melhorar o conforto operacional em ferramentas avançadas, adota-se o conceito de filas de histórico isoladas (*isolated undo queues*).27 Ao isolar pilhas de histórico específicas para o painel de propriedades estilísticas (como controles de preenchimento, espessura e opacidade de traços), o usuário consegue desfazer alterações de cores em sequência direta sem afetar ou reverter acidentalmente as formas e linhas geométricas desenhadas recentemente no canvas principal.27

## ---

**5\. Geração de Traçados Livres e Otimização Algorítmica**

Desenhar traçados contínuos com aspecto orgânico e alta taxa de atualização envolve capturar coordenadas físicas de entrada de mouses, telas touch ou canetas digitais e transformá-las dinamicamente em geometrias elegantes de curvas polinomiais de Bézier.6

### **Pipeline de Traçado Livre**

A geração profissional de caminhos à mão livre segue um pipeline especializado de processamento geométrico 6:

   
            │  
            ▼  
   ( perfect-freehand )  
            │  
            ▼  
     ( Algoritmo Ramer-Douglas-Peucker )  
            │  
            ▼  
  \[União Geométrica\]        ( Algoritmo Martinez-Rueda-Feito )  
            │  
            ▼  
       ( Compressão de String do SVG Path )

Para dar aos traços o comportamento de pressão, variação de espessura e velocidade realista, os pontos capturados em bruto são encaminhados a motores especializados, como a biblioteca perfect-freehand.6 Este componente calcula os vetores de força e velocidade intrínsecos de cada segmento, gerando uma malha lógica de pontos poligonais que definem o contorno externo liso do traço com espessura variável dinâmica.6 Para evitar degradação de processamento em dispositivos móveis ao lidar com traçados muito extensos e ininterruptos, a aplicação fatia automaticamente o desenho em segmentos menores independentes de forma invisível para o operador, estabelecendo um limite máximo de nós que o processador geométrico precisa calcular de uma única vez.6

### **O Algoritmo de Ramer-Douglas-Peucker (RDP)**

O algoritmo de Ramer-Douglas-Peucker (RDP) elimina pontos redundantes localizados em segmentos quase retilíneos do desenho, suavizando a malha e reduzindo consideravelmente a contagem de nós do traçado livre.6 Ele opera a partir de um valor de tolerância pré-estabelecido (![][image6]).6

Dada uma curva inicial definida por uma sequência ordenada de ![][image7] pontos ![][image8] 36:

1. O algoritmo estabelece uma reta divisória que conecta o ponto inicial ![][image9] ao ponto final ![][image10].34  
2. Para cada ponto intermediário ![][image11] (onde ![][image12]), calcula-se a distância ortogonal perpendicular ![][image13] em relação a essa reta divisória.34  
3. Determina-se o ponto ![][image14] que apresenta a maior distância ortogonal perpendicular encontrada (![][image15]) 34:  
   ![][image16]  
4. Se ![][image15] for menor ou igual à tolerância definida (![][image17]), a linha reta aproximada é considerada adequada e todos os pontos intermediários são completamente descartados.34  
5. Se ![][image18], o ponto correspondente ![][image14] deve ser obrigatoriamente mantido no traçado.34 O algoritmo divide a curva em duas metades distintas, de ![][image9] a ![][image14] e de ![][image14] a ![][image10], e aplica recursivamente a rotina para ambos os novos segmentos de caminho.34

Ao ajustar finamente o parâmetro ![][image19], a aplicação equilibra a precisão do desenho e a economia de nós de vetor gerados.6

### **Resolução de Sobreposições de Traços**

Quando um designer pinta ou preenche uma forma de desenho livre utilizando canetas digitais largas ou pincéis virtuais, o traçado realiza constantes auto-cruzamentos (*self-crossings*) e sobreposições densas sobre áreas já desenhadas.6 Como esses caminhos são internamente aproximados por representações poligonais, o acúmulo de múltiplos traçados colididos cria um excesso desnecessário de nós e geometrias redundantes ocultas.6

Para resolver isso, ferramentas profissionais utilizam o algoritmo de **Martinez-Rueda-Feito** para realizar operações booleanas rápidas de união em polígonos.6 Esse algoritmo utiliza o método de varredura de linha (*sweep-line*), movendo uma reta imaginária ao longo do plano cartesiano para detectar pontos exatos de interseção e cruzamento geométrico entre as bordas poligonais.6 Os segmentos cruzados são segmentados de forma precisa e as bordas internas redundantes são sumariamente descartadas por um resolvedor de união estruturado em uma fila de prioridade, integrando os traçados sobrepostos em um polígono unificado de contorno externo limpo.6 Essa otimização de polígonos reduz drasticamente a contagem final de dados armazenados por traço.6

### **Técnicas de Otimização e Compressão de Caminhos SVG**

No momento em que o caminho é serializado em código de string legível do SVG no formato \<path d="..." /\>, os dados de coordenadas são convertidos de forma otimizada para diminuir o tamanho final do arquivo 3:

* **Arredondamento Decimal**: Coordenadas brutas calculadas pelo navegador apresentam alta precisão de ponto flutuante (como 383.48128125).6 O exportador limita sistematicamente essa precisão para até duas casas decimais (como 383.48), reduzindo o comprimento de string das coordenadas sem causar divergências visíveis em exibições de alta densidade de tela.3  
* **Comandos de Caminho Relativos**: A codificação padrão em editores comuns utiliza comandos de posicionamento absoluto, denotados por letras em caixa alta como M (mover para), L (linha para) e C (curva Bézier cúbica absoluta).6 A conversão inteligente reescreve esses nós para a sintaxe de comandos de posicionamento relativo, representados por letras minúsculas correspondentes como c ou q (Bézier quadrática).6 Os valores passam a descrever deltas curtos a partir do nó de partida imediatamente anterior, o que diminui o volume final da string de dados em cerca de 32%.6  
* **Chaining e Espelhamento com Comandos Especiais**: No desenho contínuo de curvas suaves, em vez de repetir comandos de curva cúbica complexos que exigem dois pontos de controle independentes por nó, o motor gráfico pode utilizar comandos encadeados especiais como o S (ou s relativo).37 O comando S instrui o motor de renderização do navegador a calcular automaticamente o primeiro ponto de controle de controle da curva de forma que ele seja uma imagem espelhada perfeita do segundo ponto de controle da curva do segmento imediatamente anterior, reduzindo a quantidade de argumentos numéricos necessários na string do caminho.37

## ---

**6\. Ciclo de Vida do Documento: Serialização, Importação/Exportação e Acessibilidade**

O fechamento do ecossistema de uma ferramenta de desenho SVG exige que o software gerencie a leitura, a purga estrutural de informações redundantes dos arquivos de entrada, os tempos de carregamento de animações e as diretivas de acessibilidade universal.3

### **Parseamento com DOMParser e Tratamento de Incompatibilidades no JSDOM**

Para importar arquivos SVG textuais arrastados ou carregados pelo usuário, utiliza-se a interface do navegador DOMParser por meio do método parseFromString(text, "image/svg+xml").38 Esse interpretador constrói uma árvore DOM XML válida com suporte a namespaces.38 Para o fluxo inverso de exportação para download ou salvamento local, recorre-se à interface XMLSerializer por meio do método serializeToString(node).38

Contudo, durante o desenvolvimento de suítes de testes automatizados ou execuções em servidores através de ferramentas em Node.js apoiadas pelo JSDOM, os engenheiros enfrentam incompatibilidades críticas de serialização.41 Devido a limitações de correspondência na especificação DOM do JSDOM, elementos SVG e atributos descritos originalmente com letras mistas em CamelCase (como \<linearGradient\>, \<radialGradient\>, clipPath e textPath) costumam ter suas tags erroneamente convertidas para caixa baixa (gerando \<lineargradient\> ou \<clippath\>) durante o processo de serialização.41 Como os navegadores modernos exigem estrita diferenciação de maiúsculas e minúsculas (*case-sensitivity*) para interpretar elementos específicos do padrão XML do SVG, a importação desses arquivos gerados resulta em quebras visuais graves e gradientes desativados.41 Para mitigar essa vulnerabilidade das bibliotecas de teste, a camada de persistência da aplicação deve integrar funções de pós-processamento baseadas em expressões regulares ou serializadores customizados para restaurar as CamelCases corretas antes de finalizar a escrita física dos arquivos.41

### **Layout Automático sob Demanda**

Durante a importação de conjuntos de dados brutos formatados em JSON ou bancos de dados relacionais que representam estruturas lógicas abstratas (como organogramas corporativos, redes de transporte ou árvores genealógicas), o canvas precisa organizar espacialmente os elementos.32 Para evitar a sobreposição caótica de formas e dispensar o usuário do rearranjo manual incômodo de cada nó, o motor integra uma biblioteca ou lógica de layout estruturado em árvore para calcular de forma automatizada e precisa as posições espaciais ideais de cada elemento no plano cartesiano, gerando caminhos de conexão e organizando visualmente o diagrama assim que o arquivo é lido pela aplicação.32

### **Sanitização Estrutural de Documentos Vetoriais**

Muitos editores gráficos corporativos (como Illustrator ou Figma) embutem metadados proprietários volumosos em suas exportações de rotina, prejudicando a performance de renderização no navegador.3 Uma ferramenta de desenho web de alta qualidade deve sanitizar de forma agressiva esses documentos para reduzir a latência.4

As principais diretivas para higienização e purga estrutural do código XML são detalhadas a seguir:

1. **Remoção de Comentários e Metadados Editoriais**: Devem ser excluídos blocos contidos entre as marcações de comentários e elementos sem função visual direta como \<metadata\>, \<desc\> e \<title\> (salvo se necessários para recursos específicos de acessibilidade visual), reduzindo o volume do arquivo.3  
2. **Purga de Recursos Inativos em \<defs\>**: Varre-se o cabeçalho de recursos e definições reutilizáveis \<defs\> em busca de IDs declaradas (gradientes, máscaras, filtros de desfoque).3 Caso nenhuma forma no plano de desenho faça referência direta a essas IDs por meio de expressões de estilo (como fill="url(\#gradient-id)"), as tags correspondentes são excluídas do documento.3  
3. **Achatamento de Grupos Inúteis (\<g\>)**: Editores de design geram múltiplos grupos vazios ou aninhados sem atributos de rotação, transformação de escala ou propriedades de estilo comuns associadas.3 O motor do editor deve inspecionar a árvore recursivamente de baixo para cima, achatando esses agrupamentos inúteis e promovendo seus elementos filhos diretamente à camada superior para diminuir a profundidade do DOM.3

### **Otimização e Performance de Animações SVG**

O desenvolvimento de editores que suportam animações exige cuidados especiais com o tempo de carregamento e o desempenho gráfico da página.20 Múltiplas animações ativas com blocos de código JavaScript embutidos dentro do arquivo SVG podem degradar severamente a métrica de Primeiro Conteúdo Pintado (*First Contentful Paint* \- FCP), pois o interpretador do navegador é forçado a pausar a exibição da página para ler e compilar todos esses scripts inline.20

Para solucionar esses gargalos de processamento, adotam-se técnicas específicas de engenharia 4:

* **Separação de Scripts**: Os scripts devem ser extraídos de dentro dos arquivos de imagem e reunidos em arquivos JS externos vinculados, carregados apenas após a conclusão total do carregamento do DOM da aplicação.20  
* **Animações Baseadas em CSS**: Para comportamentos animados recorrentes simples iniciados por hover ou carregamento de página, substitui-se a execução de JavaScript por transições CSS aceleradas por hardware, delegando os cálculos de renderização e interpolação diretamente ao chip da GPU.20  
* **Trigger de Execução no Scroll**: As animações interativas só devem iniciar a reprodução no momento exato em que o respectivo contêiner SVG entrar no campo de visão ativa do usuário (*viewport*) na rolagem da página.20 Isso evita o desperdício de ciclos de processamento de CPU em elementos fora de tela.20 Como os navegadores utilizam uma única thread de execução principal por aba aberta, economizar recursos de CPU evita congelamentos visuais no restante da ferramenta de desenho.20  
* **Lazy Loading com Elementos do DOM**: Para lidar de forma eficiente com layouts que comportam dezenas de animações simultâneas, utiliza-se a técnica de carregamento preguiçoso (*lazy loading*).4 O SVG é inserido no DOM dentro de um elemento \<object\> que referencia um atributo personalizado temporário como data-object="..." em vez do atributo nativo data.20 Assim que o usuário executa uma rolagem ou interação de foco correspondente, altera-se dinamicamente a propriedade para data por meio de um script leve de controle para forçar o carregamento sob demanda apenas daquele vetor específico, otimizando o consumo inicial de memória da aplicação.20

### **Acessibilidade Universal e Indexação (SEO)**

A conformidade com as diretivas de acessibilidade web garante que os desenhos gerados sejam legíveis por mecanismos de buscas de SEO e perfeitamente compreensíveis por softwares de leitura de tela para usuários com deficiência visual.3

A ferramenta de desenho deve injetar estruturalmente elementos semânticos durante a exportação do documento: a tag raiz deve receber obrigatoriamente a declaração role="img" para ser reconhecida como um elemento gráfico unificado e receber strings descritivas amparadas pelas diretivas de atributos ARIA, como aria-label ou aria-labelledby.4

Além disso, formas e ilustrações complexas não decorativas devem receber internamente as tags semânticas \<title\> (para fornecer uma descrição sumária de texto alternativa curta exibida no formato de tooltip ao posicionar o ponteiro sobre a imagem) e \<desc\> (para detalhar a composição geométrica interna para leitores de tela).3 Para elementos meramente estéticos ou decorativos do canvas (como grades de guias, réguas ou caixas delimitadoras de seleção), a ferramenta deve aplicar de forma proativa o atributo aria-hidden="true" para instruir os leitores de tela a ignorar esses nós não semânticos durante a varredura do plano de desenho.3

## ---

**Conclusions: Diretivas Recomendadas para Projetos de Editores SVG**

O projeto e o desenvolvimento de ferramentas de desenho SVG para a web representam uma empreitada técnica complexa, que demanda abordagens estruturadas de alto desempenho. Ao sintetizar as análises arquiteturais apresentadas neste documento, destacam-se as seguintes recomendações essenciais para engenheiros de sistemas gráficos web:

1. **Gerenciamento Reativo Localizado**: Adotar sistemas de estado baseados em sinais reativos em substituição a gerenciadores de estado globais acoplados. O uso de primitivas atômicas reativas como @tldraw/state garante a atualização estritamente localizada dos nós que sofreram alteração visual imediata, preservando as taxas de quadros da aplicação.  
2. **Otimização Computacional de Coordenadas**: Estruturar todas as interações de posicionamento e desenho contínuo sobre cálculos matriciais de alta precisão apoiados pela inversão da matriz nativa através de getScreenCTM().inverse(). Empregar mecanismos de caching adequados para dados estáticos do viewport e para dimensões do viewBox para reduzir leituras redundantes de medição espacial que geram gargalos de renderização (*reflow*).  
3. **Histórico Seguro via Padrão Command**: Rejeitar estratégias de clonagem integral do estado do canvas para funções de desfazer/refazer. Construir a camada de controle com base no padrão Command e aplicar técnicas de agrupamento (*batching*) de ações simultâneas e coalescência de dados para entradas contínuas de movimento do cursor do usuário. Em aplicações multi-usuário em tempo real, implementar conciliação incremental suportada por CRDTs para contornar divergências de rede de forma limpa.  
4. **Pipeline de Traçado Eficiente**: Integrar rotinas de simplificação de caminhos livres baseadas no algoritmo de Ramer-Douglas-Peucker (RDP) para evitar poluição visual e excesso de nós em trechos retilíneos das curvas de Bézier. Empregar rotinas de união poligonal como o algoritmo de Martinez-Rueda-Feito para resolver de forma automática e limpa as auto-sobreposições de preenchimentos e cruzamentos de pincéis de desenho.  
5. **Qualidade de Código e Ciclo de Vida Semântico**: Projetar motores de exportação que realizem rotinas agressivas de sanitização do código XML do SVG gerado. Remover metadados inativos, otimizar caminhos absolutos para instruções de comandos relativos com redução de precisão decimal e estruturar o arquivo de saída em conformidade com as especificações ARIA e tags de acessibilidade estrutural para otimizar a indexação por mecanismos de pesquisa (SEO) e assegurar a usabilidade inclusiva para leitores de tela.

#### **Referências citadas**

1. SVG Vs. Canvas: A Comparison \- Medium, acessado em maio 18, 2026, [https://medium.com/stackanatomy/svg-vs-canvas-a-comparison-1b58e6c84326](https://medium.com/stackanatomy/svg-vs-canvas-a-comparison-1b58e6c84326)  
2. Zoom/pan svg image \- d3 : r/learnjavascript \- Reddit, acessado em maio 18, 2026, [https://www.reddit.com/r/learnjavascript/comments/1m4wuqk/zoompan\_svg\_image\_d3/](https://www.reddit.com/r/learnjavascript/comments/1m4wuqk/zoompan_svg_image_d3/)  
3. The Complete Guide to SVG Icon Optimization for Web Performance \- DEV Community, acessado em maio 18, 2026, [https://dev.to/albert\_nahas\_cdc8469a6ae8/the-complete-guide-to-svg-icon-optimization-for-web-performance-2hng](https://dev.to/albert_nahas_cdc8469a6ae8/the-complete-guide-to-svg-icon-optimization-for-web-performance-2hng)  
4. Mastering SVG Optimization: How to Maintain Crispness and Scalability Across Different Screen Sizes and Resolutions \- Zigpoll, acessado em maio 18, 2026, [https://www.zigpoll.com/content/how-can-i-best-optimize-svg-graphics-to-maintain-crispness-and-scalability-across-different-screen-sizes-and-resolutions-in-the-designs](https://www.zigpoll.com/content/how-can-i-best-optimize-svg-graphics-to-maintain-crispness-and-scalability-across-different-screen-sizes-and-resolutions-in-the-designs)  
5. SVG and JavaScript: transform viewport coordinates into element ..., acessado em maio 18, 2026, [https://davidhamann.de/2023/01/13/svg-javascript-transform-viewport-to-element-coordinates/](https://davidhamann.de/2023/01/13/svg-javascript-transform-viewport-to-element-coordinates/)  
6. Behind the draw \- How Canva's drawing tool works \- Canva ..., acessado em maio 18, 2026, [https://www.canva.dev/blog/engineering/behind-the-draw/](https://www.canva.dev/blog/engineering/behind-the-draw/)  
7. SVG-Edit/svgedit: Powerful SVG-Editor for your browser ... \- GitHub, acessado em maio 18, 2026, [https://github.com/svg-edit/svgedit](https://github.com/svg-edit/svgedit)  
8. tldraw/AGENTS.md at main \- GitHub, acessado em maio 18, 2026, [https://github.com/tldraw/tldraw/blob/main/AGENTS.md](https://github.com/tldraw/tldraw/blob/main/AGENTS.md)  
9. Agent starter kit • tldraw Docs, acessado em maio 18, 2026, [https://tldraw.dev/starter-kits/agent](https://tldraw.dev/starter-kits/agent)  
10. GitHub \- MewPurPur/GodSVG: A vector graphics application for structured SVG editing, available on all major desktop platforms and on web. Currently in late alpha., acessado em maio 18, 2026, [https://github.com/MewPurPur/GodSVG](https://github.com/MewPurPur/GodSVG)  
11. codedstructure/svgdx: svgdx \- create SVG diagrams easily \- GitHub, acessado em maio 18, 2026, [https://github.com/codedstructure/svgdx](https://github.com/codedstructure/svgdx)  
12. Repath Studio \- GitHub, acessado em maio 18, 2026, [https://github.com/repath-studio/repath-studio](https://github.com/repath-studio/repath-studio)  
13. tldraw: Infinite Canvas SDK for React \- State management and control, acessado em maio 18, 2026, [https://tldraw.dev/features/programmatic-control/state-management-and-control](https://tldraw.dev/features/programmatic-control/state-management-and-control)  
14. Pros/Cons Canvas(p5.js) VS svg(paper.js, snap,rune.js) for real-time generative graphics?, acessado em maio 18, 2026, [https://www.reddit.com/r/creativecoding/comments/lifehm/proscons\_canvasp5js\_vs\_svgpaperjs\_snaprunejs\_for/](https://www.reddit.com/r/creativecoding/comments/lifehm/proscons_canvasp5js_vs_svgpaperjs_snaprunejs_for/)  
15. Best JavaScript Canvas Library — How to Choose, acessado em maio 18, 2026, [https://konvajs.org/docs/guides/best-canvas-library.html](https://konvajs.org/docs/guides/best-canvas-library.html)  
16. What is the difference between the way that Canvas libraries handle SVGs and SVG ... \- Stack Overflow, acessado em maio 18, 2026, [https://stackoverflow.com/questions/27072550/what-is-the-difference-between-the-way-that-canvas-libraries-handle-svgs-and-svg](https://stackoverflow.com/questions/27072550/what-is-the-difference-between-the-way-that-canvas-libraries-handle-svgs-and-svg)  
17. Interactivity \- W3C SVG 1.0 Specification \- Candidate Recommendation 20000802, acessado em maio 18, 2026, [https://www.w3.org/TR/2000/CR-SVG-20000802/interact.html](https://www.w3.org/TR/2000/CR-SVG-20000802/interact.html)  
18. An Interactive Guide to SVG Paths • Josh W. Comeau, acessado em maio 18, 2026, [https://www.joshwcomeau.com/svg/interactive-guide-to-paths/](https://www.joshwcomeau.com/svg/interactive-guide-to-paths/)  
19. 8 Best Free and Open-Source Drawing Libraries in JavaScript \- Code \- Envato Tuts+, acessado em maio 18, 2026, [https://code.tutsplus.com/best-free-and-open-source-drawing-libraries-in-javascript--cms-37731a](https://code.tutsplus.com/best-free-and-open-source-drawing-libraries-in-javascript--cms-37731a)  
20. How To Optimize SVG Animations To Improve Your Page Speed Score \- SVGator, acessado em maio 18, 2026, [https://www.svgator.com/blog/svg-optimizations-improve-page-speed/](https://www.svgator.com/blog/svg-optimizations-improve-page-speed/)  
21. SVG vs CANVAS (Snap.svg vs FabricJS) \- javascript \- Stack Overflow, acessado em maio 18, 2026, [https://stackoverflow.com/questions/21791388/svg-vs-canvas-snap-svg-vs-fabricjs](https://stackoverflow.com/questions/21791388/svg-vs-canvas-snap-svg-vs-fabricjs)  
22. How do you convert screen coordinates to document space in a scaled SVG?, acessado em maio 18, 2026, [https://stackoverflow.com/questions/22183727/how-do-you-convert-screen-coordinates-to-document-space-in-a-scaled-svg](https://stackoverflow.com/questions/22183727/how-do-you-convert-screen-coordinates-to-document-space-in-a-scaled-svg)  
23. SVGGraphicsElement: getScreenCTM() method \- Web APIs | MDN, acessado em maio 18, 2026, [https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getScreenCTM](https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getScreenCTM)  
24. How to convert svg element coordinates to screen coordinates? \- Stack Overflow, acessado em maio 18, 2026, [https://stackoverflow.com/questions/48343436/how-to-convert-svg-element-coordinates-to-screen-coordinates](https://stackoverflow.com/questions/48343436/how-to-convert-svg-element-coordinates-to-screen-coordinates)  
25. How do you transform event coordinates to SVG coordinates despite bogus getBoundingClientRect()? \- Stack Overflow, acessado em maio 18, 2026, [https://stackoverflow.com/questions/20957627/how-do-you-transform-event-coordinates-to-svg-coordinates-despite-bogus-getbound](https://stackoverflow.com/questions/20957627/how-do-you-transform-event-coordinates-to-svg-coordinates-despite-bogus-getbound)  
26. GitHub \- bumbu/svg-pan-zoom: JavaScript library that enables panning and zooming of an SVG in an HTML document, with mouse events or custom JavaScript hooks, acessado em maio 18, 2026, [https://github.com/bumbu/svg-pan-zoom](https://github.com/bumbu/svg-pan-zoom)  
27. Undo/Redo applying Command Design Pattern in my Engine : r/gameenginedevs \- Reddit, acessado em maio 18, 2026, [https://www.reddit.com/r/gameenginedevs/comments/1pd6kkk/undoredo\_applying\_command\_design\_pattern\_in\_my/](https://www.reddit.com/r/gameenginedevs/comments/1pd6kkk/undoredo_applying_command_design_pattern_in_my/)  
28. You Don't Know Undo/Redo \- DEV Community, acessado em maio 18, 2026, [https://dev.to/isaachagoel/you-dont-know-undoredo-4hol](https://dev.to/isaachagoel/you-dont-know-undoredo-4hol)  
29. Undo, Redo, and the Command Pattern | esveo, acessado em maio 18, 2026, [https://www.esveo.com/en/blog/undo-redo-and-the-command-pattern/](https://www.esveo.com/en/blog/undo-redo-and-the-command-pattern/)  
30. Command Pattern for undo/redo in paint application \- Stack Overflow, acessado em maio 18, 2026, [https://stackoverflow.com/questions/12780063/command-pattern-for-undo-redo-in-paint-application](https://stackoverflow.com/questions/12780063/command-pattern-for-undo-redo-in-paint-application)  
31. Undoable Command Design pattern \- Anubhav Gupta \- Medium, acessado em maio 18, 2026, [https://anubhav-gupta62.medium.com/undoable-command-design-pattern-30ca60b445cd](https://anubhav-gupta62.medium.com/undoable-command-design-pattern-30ca60b445cd)  
32. Custom diagram interface with tldraw: Real-time and scalable \- Synergy Codes, acessado em maio 18, 2026, [https://www.synergycodes.com/portfolio/custom-diagram-tool-with-tldraw](https://www.synergycodes.com/portfolio/custom-diagram-tool-with-tldraw)  
33. How to update SVG bezier curves on scroll • Josh W. Comeau, acessado em maio 18, 2026, [https://www.joshwcomeau.com/animation/dynamic-bezier-curves/](https://www.joshwcomeau.com/animation/dynamic-bezier-curves/)  
34. Ramer–Douglas–Peucker algorithm \- Wikipedia, acessado em maio 18, 2026, [https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker\_algorithm](https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm)  
35. Ramer-Douglas-Peucker (RDP) Algorithm in Computer Vision | by Saijyoti Tripathy | Medium, acessado em maio 18, 2026, [https://medium.com/@SaijyotiTripathy/ramer-douglas-peucker-rdp-algorithm-in-computer-vision-15c228f277f0](https://medium.com/@SaijyotiTripathy/ramer-douglas-peucker-rdp-algorithm-in-computer-vision-15c228f277f0)  
36. Douglas-Peucker algorithm | Cartography Playground, acessado em maio 18, 2026, [https://cartography-playground.gitlab.io/playgrounds/douglas-peucker-algorithm/](https://cartography-playground.gitlab.io/playgrounds/douglas-peucker-algorithm/)  
37. Cubic Bezier Curves with SVG Paths | by Joshua Bragg \- Medium, acessado em maio 18, 2026, [https://medium.com/@bragg/cubic-bezier-curves-with-svg-paths-a326bb09616f](https://medium.com/@bragg/cubic-bezier-curves-with-svg-paths-a326bb09616f)  
38. Parsing and serializing XML \- MDN Web Docs, acessado em maio 18, 2026, [https://developer.mozilla.org/en-US/docs/Web/XML/Guides/Parsing\_and\_serializing\_XML](https://developer.mozilla.org/en-US/docs/Web/XML/Guides/Parsing_and_serializing_XML)  
39. DOM Parsing and Serialization \- W3C, acessado em maio 18, 2026, [https://www.w3.org/TR/DOM-Parsing/](https://www.w3.org/TR/DOM-Parsing/)  
40. XMLSerializer \- Web APIs | MDN, acessado em maio 18, 2026, [https://developer.mozilla.org/en-US/docs/Web/API/XMLSerializer](https://developer.mozilla.org/en-US/docs/Web/API/XMLSerializer)  
41. Implement DOMParser and XMLSerializer classes · Issue \#1368 \- GitHub, acessado em maio 18, 2026, [https://github.com/jsdom/jsdom/issues/1368](https://github.com/jsdom/jsdom/issues/1368)  
42. acessado em maio 18, 2026, [https://penpot.app/blog/how-to-optimize-svg-files-a-complete-guide-for-beginners/\#:\~:text=a%20code%20editor.-,Remove%20unnecessary%20elements%20and%20metadata,SVG%20file%20for%20maximum%20efficiency.](https://penpot.app/blog/how-to-optimize-svg-files-a-complete-guide-for-beginners/#:~:text=a%20code%20editor.-,Remove%20unnecessary%20elements%20and%20metadata,SVG%20file%20for%20maximum%20efficiency.)  
43. Optimizing SVGs for the best frontend performance \- Matt Cassara, acessado em maio 18, 2026, [https://www.mattcassara.com/blog/optimizing-svgs-for-the-best-frontend-performance](https://www.mattcassara.com/blog/optimizing-svgs-for-the-best-frontend-performance)  
44. How to optimize SVG files: A complete guide for beginners \- Penpot, acessado em maio 18, 2026, [https://penpot.app/blog/how-to-optimize-svg-files-a-complete-guide-for-beginners/](https://penpot.app/blog/how-to-optimize-svg-files-a-complete-guide-for-beginners/)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAUCAYAAACXtf2DAAABR0lEQVR4Xu2UvytGURzGH0kRJYtSlMHCIMVqYTKwvKXMksVMSRabRZmVTP4Cu6yKxWBgYJFkEeVH4Xn6nqN7v857unlN8tSn3vucc77PPefc9wv8q6wWskVqZI48l4cbVw+5IgeF3980RE68GdQEe7tz8kr2SW9hXDtYIJNkkNzHgTaySU7JR8BLxZfJI5mBrdkhd2SsMC9qjZx5s4McIh2wDfOnnL9H3pwnDZBrb+YCjskTGXX+KtLzY62kmVpwg3TACmy+jnCWvJN5/CBAxXMBWrsIu/xp0gXbdUmNBkjaST/sK2oO3pd+IyCrXMAD8gHtzk8qF3CJfEAl5QKWYL4uMqoV1hZuC15Suhj1jmHYv0+F9CxUROoOY0ekM3jj5IVshOe60puraAp9clEj5ALWUtZhbWMXFc+/qtTQJmBH1efG/qA+AUMrWrMe55o/AAAAAElFTkSuQmCC>

[image2]: <data:image/png;base64,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>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAAAYCAYAAAAF6fiUAAAEVUlEQVR4Xu2YWeitUxjGH5kzZ870P4hkHiKiDkWGOOJcnKJzdUrGDEXhYme4kKkkU4Yk6ZwQZYqbHS6UKzKVXBBJQgqFDM+vd719a6+99/9s2f5/F99TT/v71lrft9f3POt91/t9Uo8ePXr06NFj2bC1eZa5uuHGsJ/Gr4F71YN6zI4bzD/Nn8y/zCtGu8fwufmJYizs8S+BAT+bN5l/mO+YO4yM6LCZ+Uxhb8CckAacbL6miIYzR0Z0OMw8xXxSvQFzQxpwrLlGIeoGc/N6UMFAsXf0BswRtQEghb3f3CQHKcz5sBz3BswRrQFfKoTld0VpY9WTngblfFYDtjV3LMdbaHJULTf2NHczNy3n+btkaA1g5ae4WRGxJ3xlHlrON2YAht1hPm/eZz6uuOb/UqoS2aeZ75uXmTeb681zzJWKKu+LKbzOPFVRDVK0HKlxnK7o+808qekbQ2vAieavCnE/UFf51ClpMQMYc495fTmGt5ovm1tV45YLROFd5kfmEVX7CQodBua16iLhd0WBAniWS8rx7uZL5rnlPEEFyfP/aF7U9E1EawDIzRjeqUg/rOrEYgYwIQykWkpw78Or8+UEgl7cNioW2oPm2qptO/PZ0pc4pPxeqniRvb3qA2hH27vmTk3fREwyAHc/VghMWcpNayxmQEYQIficxt8pMvxfMR8zL1C8XT+l+E/S1qvm1WU8Y4fmEwoxEtub9yruQYTurPgvCgVSJ2mFeyJq7j30TxMGkY9q2hCbaGjB2LvNvc2n1WUGFil7ylCRemfCJAPAQCHwpBezxQxgMqyOXxT9P5jHV/2I87a5q8LoR83LFRFCmjrY/Ky0g/cUBoF9yy/zeUOR5sA1ivlfqFh99X+SRhEFMGZmYRQpJNNPjV0UaRUjhopiA6wy9ze/1gzpJ78F4SBhiRF808lw46WLB6k/TbCJMuZNdQZM+xZEDj1AEQkpJvhGXUSxMrkuo+BThYGIx0OuUGzmCMhmxooGA8VDHqMw7yGFCGcrTORZEkQE9wKkx2nCMJe2AsIsFkkLTLmyHLNYGLNgrjPPM79Vl6qWFIjXRhKC5MYFhupWTA1Cfdi0IRhhXoNrh+aNTXsCQfIaDKSC28fcQyFKPZfEgQrTMpUAxn5XnScy/eSCo1y/Rd3Xg6H+WZTNFeTWdoMjWsjPibcUm1uCso6HIr+3E8dMQjqBUFsq9oPc/Fi1V6kr9+pqiwjHjIHCDP6HPYD0l1hQFBptmiVSyAwtEJ6Iy6KESHxE3T6DadOi7D8Hgr2uEJK0hEgL9QBFyntYMUk2UB6EFEGuJnxrsCJfVIzlnreVdtIVRmIeG/DKMhbh6/RztEJc6vsE5pEG2aSZI/fcpupnb6Hep4YnxVIYHFf6mGu2YySR9YLiGVlkXEvf9+YDGq2elgQIiRAL5vnmQSO9HXg7rt8+ASLUKSCBqOTY9i2asXVkJdo8Pindcd0ZCuN69Oix5PgbRhXx+30JbIEAAAAASUVORK5CYII=>

[image4]: <data:image/png;base64,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>

[image5]: <data:image/png;base64,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>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAZCAYAAACo79dmAAABjklEQVR4Xu2VvytGURjHH4nI70QZDJTVQEz+AIUMDIqJwWhjkezKICPJZpBSlPQOYmMTo7rKYmEySXy/nfe+nffpvdd57z3JcD71ed/u85xOzz0/nisSCAR8MACHYLtO/Cdq4CQ8g/swgkf2gKw0wlodzAHnu4CPKr4Mx1Wsajj5E1yCTSqXhWH4Ac9VfAruqFgmOuEWfIXrKlct8/AbHqo4X+IKNttBbumEmK14g8ew3h6QAld2BW7DHpVzZU2Si30Wa95u+A5H40AO6uCcmCNyonJpsEinYjfhrpjb6Avu1DS8hIPy+9x74lBsB7wTM9DW9QikwYIjeCrqzFXA6Rjwhw/99oicxKt6L26rSpIu2Ai8gS18iIvNejFs7PN6APvK06mMwU9YUHG2Ls5VeuEZuGoFuDKuxbeKaVsvYlpZHhbgl/XcBq+L/yVYJHsll5vbEMEue0AC7LEskm3Lx4eBO8MX3xBzLG7hQ9mIIlxNtjCuaIPKVaIXLor5kvlmVkyxvFw+P+mBQCDw1/wA6nJFyi3W3woAAAAASUVORK5CYII=>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAYCAYAAADOMhxqAAAAtklEQVR4XmNgGAWDDYgBMTMSXwCLGBjwA/EWIPYF4v9AfAaIl0HlhIH4HBBfhfLBwAWIlwNxOgNEwx4GiCEgwAPEB4D4IZQPBp5QvAaI/wGxB5KcEhA/Z0CzAQZ+A/FWIOaA8lkYIDajGwIHIOeUI/EVgfgJEF8HYnEgjgFidpgkyDSQDTYwAQaEn1qh/MlAzAiTNAbi+cgCQKAPxK+BeD8QX0QSBwNQWLOiCzJA/CMJpUcB7QAAc/QdgqUT/vMAAAAASUVORK5CYII=>

[image8]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKoAAAAZCAYAAAChKLVZAAAFX0lEQVR4Xu2aW8htUxTH/3LJcU1OLnk4Hw8ktyNFJMktEglFeFAeyOXlPBAvHvBApHS8uHSS5PpA6BCxiyJK0REpdcglhBfkksv4fWPPs9cZe8251t7fPnt/e1u/+tf3zbn3XGuONeYYY861pY6Ojo6ODtg9NnTMHTuZ9jPtHDtGZS/TwaZdQ3v8f9pcbNo3NnbMHTjqjaYnNObzvNP0telf00+m30w3m9aY1pmOHHx06uCkH8ZG+aK63fSQ6WnTl6Z3+/8nXWPaP31hApymwdhc73P5tVPbPaaTNIGIscpItmauzDln6zbgrHeYNseOEjji3aYvTFdr4OX7yL3+VfmNEa5nAYvkE9NVsUMe5c+U931qesF0aUUY70/Tr6bz+99ZKdwPY2Mzxr2p/z+63rRFvtifTV9YEJKtsTPzq9r6cg1s3dbOBA8cHactgsGTUYmcOW6Tf2YWHG36WZ4qSpxq+kv1Uf8EuUNNcg67mJ4zPRA7+jwmvx5RaNHAzj8qb2vmfUHsyHCgaaManPVF+aDPqFx/kna5sVlwi/JGqbJBece4Ut43SUfFwGSZC2OHPPO8L7/enqFvEWBePZVtfV7sKPCV6dDYWIUBiVZErRI4ai82Tome6S3T3qG9SopudY7ISt0k76N8mBQpgh8WO7RjIvhqAVszr7tihwa2xs4s5LYwXt2CX4aB+MCT8ouXYGPABmIWfGt6JDYGDjFtVb1jnChfjH+bLgl9K4FIXxcxyUzUavS9HvoWAWydi5jJ1qPamUVd5/jLUFvhBHURYRzWavtNTBu1AaOQTkokp8EZ2Ymib0z/yGtvNoWTpLow0vXQL6aX5Au7WHPNMdgaO5Ou07yx81aNb+uPlSklODR/Wc0pdTWAM5QK8zQXPpfb2FQ5x7Q+No7IWfKH01S3c5qSjquOCH3zSLJ1GzuPQq+vIUelodfXUGfgOtMNsXGKNDkqGYHMUKxzjCUNatXSeG0gTTFOL7RXwa6Pmg6Qnxf+rpVfd9YkW5fsPA69vmp9kbqvp0xnH85TX5FvDmZFk2NRK/GZpjKG2nE3eT1UGq8JalJqT66ZravkUff7/t/YkfPC3rbe+STZumTncSCz95TxRQ5om3Zn1BwPqnmzBTwYJjGK2sDnOHrKkaIbKanN7wBW6qgpqpD6mXOO0+WnAgnOVXmhMs8kW7ex8yhgFxZ/3Jhugx0aD+4Kbf+6jy/cajqo0jYrOKvk6KlusXDPzAHjseFq88oy56gpUv5hOjn0VXlYfr13VF7kVc6WXzfuhslqjEXQqOM4ef/z8mxQR1r0ucWcrsH1c5kxjZE7AcKup2hg65KdOUM+XL6Yqc/JZE/JN2E5WNDXxsYqDPie/OLcBAO/YfpO/lpwNYDx2BVyqpCopt+oJnKOChiLSFnXn9JeVJOzrpP/RuEyDZ8E4MBcL/cQSYXUtqWHuMX0g9yp62AuvNbcrPwPQN6W38ebGk6/2DrOGeUWxpI803wmPx0BXn6U5tDmLH/ZeEumi+RHRrwBKq2YaUO04TiklGZHoeSoQHor9Y8Kb/1K904myDnqNKGkIShERx0HbFgtxTjCykVzPsM+iBOSuYZdM1Fjo4Yj0jg0Oerjan5d2xbSXiojuHd2/5H7VXbkaXGu6d7YOCY4Kb8PSeCIRPNjNRwEiaS50mfuSG97NsWOETjG9JE8bXEwzyqPDkKaPj60jUtdqRDfsPHwJn3UMw6jbJrbUE37jMkxHWfJsfTgxQh7kIWCSb6myUTVHNU6eBpQ/+3I+bTlKE029e4R/q/7NT9B4QP570gWDh7spCJex+zgBOM+0xmxo6Ojo6Ojo+N/y38Ow0a5bf6j1gAAAABJRU5ErkJggg==>

[image9]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAZCAYAAAAxFw7TAAABFElEQVR4Xu2SsWoCQRRFrxhFiI0giKSRNCGVgq1lSCOKRbCxtPALknTp8gMpUkg+IYWNnRCLdHaWViKIlRaBtOp9vF1wHzuuiIWFBw7Lzt25O8wMcOHU3NNP2qUzz573Ln7QR5rwJ0SRpQ36Stf0jT55tukP3dCRP+FQ3mmfpmwA/ZmU5m3g4poOoBMtV/QbWpgzmZNbuqAVG5AbOoUWxoKRmzrCVyAFL142MZmTNB1CJ/mnLK7oL63SuP/xIci1WUJPOAopbtKCGQ/Qgq5uasYtJeg+/9OyyQJ8QQvlJPeRpDVEFGagF1YKOyYLI7LwGVo2p3cmC8NZWKR/0LJdZXwfzsJjOe/CB+hll62R5zgYXzgrtsu/PxSHwXAAAAAAAElFTkSuQmCC>

[image10]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAZCAYAAAA14t7uAAABN0lEQVR4Xu2ULU8DQRCGXwKCNKQGDAJBHYo0DSQkSATQUAF1GBwSyS+owqL4CAqHbRUCDRUVRSIgfCRIEhAQAu9kZttlEmjuDlB9kifZ3Xdu7272WqDPf7NE9+ghbZkyljVxi452qhMwRav0mH7QDZsHX+kzLVt9IkboGXRjTwm6sWTydoko0Af65AOyCt30jc67rCcV6MUXPiC70OwcKXpdg1584ANyD+3zig96EdogGz/SG3pL3+kdzXdLkxHacEnHXJaJ0IYTOuSy1MSf2ebXKBuhvy90xmWZ2Ic+bQP69N+xBv2GpW2ztjZH23Q8FAnT0B+DbBp7GhdFLEMPth6treOXDlzadm3jAXpkyjgTC/TKxpM2XqQTnYoUDEPbsG3zIm3SHaT814vJ0cFoLjf76cD7/AGfFHNBIVAOfMgAAAAASUVORK5CYII=>

[image11]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAZCAYAAAA8CX6UAAABHElEQVR4Xu2SPyuGURiHb6GolxJlt6m3DDIoX0BikA9gs3gzGExGX0Amf0Ybq8lgFIvFByB/YlQMJK67+zk8z0/vk7O/V131POd3d3fuc45Zh1xmcRcP8KrQv33NXcPhn+oaxnEJD/ELl4v/5Du+4lxRX0sDzywaKZMWjTzz3dcyho/4ogEsWjT5wBnJ/rBgUXypAexYZBf2j7Pasije1wAeLM5pXgMljeWNnvEW7/AT73Hwt7SeNNY1jkim9GJLFxNprCPskUyZwCdddMrXvlKN8kjn84ZTkmWxZ7GbE4vdtWPd4mFu4Gk58Fn98XmTspWigj6LRzmK57hajfOZxhtsapDLtsXNDmiQQz8eWzTblCybbhzCLg06tOcb+3Y93oyfl4AAAAAASUVORK5CYII=>

[image12]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAAAZCAYAAACmRqkJAAACf0lEQVR4Xu2YMWgUQRSGf4liRFFJgiIqakCEFIagFtqksVBELbUQCy0s7SKIJLWIKUICNkG0sZGkCgkimM5GEEGxEqKIIiGCpQrq/+e53OxL7nb3dpNLYD74CDfv7mb27Zu3cwEikUgk4tnvB1rEJtpBN/jAWmU3vUd/+UAL2Eaf0b/0uoutOdroTtiiZ2GLrhrNcYJu9YEGaD3tfrAEW2BrUGWvCCuVQCXtE31Ad7jYanGXfqaDWEcJ3EOH6Tfa6WJZ7IJVbVmO0MewNlCk+v382qF+bAlVJVBNf4J+oFdhWycv+uwF+p2+pQfS4dycoi/pK3rOxbI4Dlt7Mn8/rHq1ph/0bO2tacok8DKdgzX+o+lQbjbSR/QMHYWtQ9+bB1XXTbpAH7pYEU7TJ/QGbP7nqLWdJD8f/79eQjMJ3E4H6Dg95GJF0TbRd+mv7vh72MkgC7UKtQn1uaKtwqPqkk/pH9jNTOimX+m7YCxFMwm8BCtrXUSVaA0jfrAOt+kQ7GZWhZI0R/cGY2otWlfdCm8mgUI97gus76lpl0Xf95Oe9IEG3IFt3zFUczN/0ynUjlFqL9ravipTNJtAoafTRdidU/Nu+LTKQImbgSVyH/L3Qb3/Guxm9qDcLxjl4FbwWu0pbCtX6OYgvoieOK9hHy57VtKE6os6/6m5F0EPkl56kE7Cjg9FUfL0MJuGXXSR61GCVAhdwdh9WF7Ow/psXxBbrDwFl1MfKIMm0/bSeTDv1tKcyYXrSFEW/bbXQ0YPqDx98hisz4UVrBs6T1/QN8H4qqHz4Cw97MbroSooUjVZJKcF9TX9g6IRaj/Lza1+qCKo8udlJBKJRCKRSCv4B1ZIcajjp1ErAAAAAElFTkSuQmCC>

[image13]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAaCAYAAACO5M0mAAAA4ElEQVR4Xu3RPwtBURjH8UdSjAqLSVlMBisTb0Feglcg78MoAysWgzKaKZM/g8WgFJsySOH7OPfezr3d0aL86jPc55x7nufcK/LbiaOPM/b+JX9iqOKFcWAtNLqxHSwGE8ED5eCCRlumEEUJUzHz+jLEBSsxF+hISNsCekg4zw08UfN2kAzWyFu1NHbIWrXP8Xo7OzrfTaz53MLRLTjRMbS1F3fj3KolscRBzOx1LRZxxcDbJlLBXcyn0bGaWtRbzsScoNELbcTMrC+PkHPWPsdvMcFCTJcuTmiJ+UP/fCFvVF0paG6cgKUAAAAASUVORK5CYII=>

[image14]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAYAAADE6YVjAAABVklEQVR4Xu2UMS8EURSFj4gEi0RspxONSiEkEolahGxEp9Ept+MX+AFERZQ6SiqFmoZC1DYbegkFEc5x7zOzLxTzdoot9ku+ZObel7mZ+967QJdOZ4ke0mPaoLf+rJis07Hf1YlM0XV6Qh/ppr/LffpOX+myr09miF7RjSguZmBFvmB/ncwEfabTcYKswQp80IUoV4hV2IdGo3gPPfDcNdrcm13Yh2Im6RNsX1aiXCFCq1REp0s26SfdpiPZ0nRCq+7jRJmEVp3GibIIR1dFtlpT5RH2443ORrnSOIL9xQXsr/6jRhdhrZ3z2DzskvYi68iO537QpXuBFchbyS/KoQs5Ti9zMU2HB3+uwg7OXxOjEGqtZltAc03zTmgSKKc52BaaW6GIJsMNssOigjqdw/6eRD89R9Zz3f472JgZoGew8bPn+WQGYZss+tC6f4qrYMh36UC+AVucQ9CWZ7l5AAAAAElFTkSuQmCC>

[image15]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACYAAAAZCAYAAABdEVzWAAABwklEQVR4Xu2VzStFQRiHX/mIKJ/5iBLZKCE2EqVY2NiQ/ANkYyUfK2vZCXtXYoGNhaIsbimKspOF1GVBsVDKQgq/n5m5Z86wuoszFuepp+a+M+ecmXfemSsSE+OPBLyHT/AGVoV6PdIPl+AX3IM54W5/ZMF1+AF7nD6vlMILmIK14S4/5MIK2Anf4AHMD42ImGq4A5/hJVwRVV/z9qCoqYQPsMmKXcs/2EZmhRmy8b6NrKcrOODEvW+jKfI6J/4pvycbKWZiRVaMV0VKVH01w1GrLzIK4KGoyRAeAG7tBiyGu7BB2wvf4ZyoC/gMHsGynydFkhIssB6O6HYLfNHtIThmtbvgsbZQx9MwKydwH57DNvgIT+GsqEm0w2kJf/wODuo2MX9dHL8swTj+c3AsGYYluj0pavH8HhfyJ7wyaLb+XS7BCwz8sH16byWoTWacHyIsgZRuE8a5cBtOfsuJZQwnwhUb7OuEB6URtsJu+KrjzKBZEMuBWeSCzW1AuIXsy5ikBNtTA/vSPSITcBV2iMrGFJyBa6IykxBVi9twUcc34QIc189kTJ7V5ovcl7mXsSkFjjOHi6XCMjEl4z4TExMJ38q4SOkshLmLAAAAAElFTkSuQmCC>

[image16]: <data:image/png;base64,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>

[image17]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAAAZCAYAAACSP2gVAAACsUlEQVR4Xu2XTYiNURjH//IR+cxnQj42knxELIRGWZiUhJKwUlhRFGUhG8WG8lksRFlMbCQLQ3mlUCwsKGEWY0FmOaFQ+P/nOcd77rlu3TvdmzM5//o1857nnO57nvN8nBfIysrKSlM7yXvH98iWRS0gO8hr8iOyDQSNhL3/6tjQTK0lP8nN2JCoZpMr5APMQS3XYfKLHIgNiWkQ6SSvyEYytNLcXA0mk8lwcgeWXisrZqQjOUIOkWNWwN69ZVJIniCfSEEukR7Yj08spyWj/bBUukbmRrb+aAw5SF6Qz+RsaBxLvpFVwdh5WHrtCcZS0CRyGeagZtWZzeQ+zA9/1V5YOimtvLTgK1kWjKWkk7BoP0WmRrZGNIO8JWtig5e89hTVkfIR6aaXlyJoFyzV+ptmG2CZEvNHi0iv+xtKk9Qy1SFSl4rzc/IEjRdr36lr7nMp+YLqSNGi7WQI2RbZUpQ2uBBlu6+31XsH1dQIcptMc8/jyQ3SDctt1aejZB+siKuYH4Klpk7srlujHyrIKJjuuXl68SnkiBuXXd1Sfwtyjqwn7c7eLE2A/eaW2BDJ7395NOb30afp5CW5St6RrbD7z0PyiMwki2EXxgK2eA7MietgOgO7cSvipC6UTtdc3cqlWbCCqIjVSW+Ctdh6T7wVUi1TQ7pFOmDfn1UdUh7XSfsXlRPCZ21cDpAjJG1YTpBzpWcoC73WXkeZ15rr53mpO2r9vGj8X0kdXBkT7rkhaaE2pBOXjqPyaqBoUqSoDuibKPw80VwdwHxYAVX0yJmKztFujsJ6QEsbKlDm5hvS5o3UA9jtc4l7LmB1Szfy0+QC7BNG0aS5x8hjsptc7FtRn/ynkE67HsK7XUulsBsWPOvkw9Y4DpUvo/8VNX5OGLbeyRpTga/ZYrOysrL+Z/0GXjFzswy7sYsAAAAASUVORK5CYII=>

[image18]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAAAZCAYAAACSP2gVAAACsklEQVR4Xu2XS6hNURjH//KIPHNFQh4TIY+IgSjKgJQBAwkTA4woitJNJsqI8iySDAxESjLwKFvKIwYGlDwKA2JGKBT+//utZa+9jnPP2V3u2TfrV7/O2ftbq3PWt9f61tpAIpFIVJP19LXzWxRLkOl0HX1Cv0exhGMJ/UHPx4EWMpBOi2+2ip30J90WB1rIcHqYboUlq9vpTUfS/vQybHktKLSoBu30Hd1PR0exf4Kexj7Yj2b0OH1PH9MRebNKMYBuoG/oVNqrGC7FELqdPqSf6KEwOJR+pQuDe0dgy2tTcK/KKDkz6FX6kvYtRDtnFb0Oy8Mf2QxbTlpWHnX4QucG93oKE2EroZk6NY4+o4vjgEdZu4vamfIW1V5ejThBP9DVcSBiBWylxP5mJv3oPkPU6BS6tq5bwWR6AVabVKMa4XfquuOcQz+jdqao01rah66JYlVkPr1DH9DlUawzfILqoixfomPctc4Z5+gr2Pap+rSbboEVcRXzHbClqT90xfXRD2V0EIxrrp2ezCi6y91XXLulPjPYmUYDWubizaLaohqjWnMyipXBj39edM+Po4Ox9BE9TZ/D1q3OPzfpLTqezoIdGDNY50mwJC6FcRB24taMEy+QJ11tdSoXE2AFUTNWNW4lbIsts+u0wRKjs5C+dxUlWxvSRXoW9v5ZU9z1Q3rS/o8qCeG1Bq4EKBFCA1YSlFxxH3mhV98zyNe12vp2Hu2O6j8lut8IvWbcQ3P1pQzawbViwjGXQh01ID1xsRfFo4Fmk2aKziLaZsPXE7XVA9DgdFLX7FEyNTsHuzZ/e8DdjgaUIV+bT+kiHyQ3YKfP2e46g9UtncgP0KOwVxjNJrXdQ2/TjfRYR48ejqZdv+BaTz7cGoeheNDUd80a3yactj7JuqcCX3eLTSQSif+ZXyyuc5YI6AZ+AAAAAElFTkSuQmCC>

[image19]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAYCAYAAADH2bwQAAAAYklEQVR4XmNgGAUkg1VA/AOIG4FYFYiFgZgRJskPxH+BOBgmgA7KgXg9ELOiS4CAJBA/BGJTdAkYgClQQpeAAU4g3sGAxwQYuA7Ed4B4LhCfBmJrVGmIl0BeA1kpgCY33AEAIiYLu8ye3SYAAAAASUVORK5CYII=>
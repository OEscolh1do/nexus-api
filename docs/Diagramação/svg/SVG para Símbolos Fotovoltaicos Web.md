# **Projeto e Implementação de Simbologia Elétrica Fotovoltaica em Sistemas Supervisórios Web via SVG**

O desenvolvimento de sistemas supervisórios modernos e de ferramentas de projeto assistido por computador (CAD) para o setor de energia solar fotovoltaica exige soluções gráficas de alta performance, escalabilidade e conformidade técnica diretamente nos navegadores web.1 Historicamente, a engenharia elétrica dependia de aplicações desktop proprietárias para a manipulação de diagramas unifilares e esquemáticos complexos.1 No entanto, a evolução dos padrões de desenvolvimento web consolidou o formato *Scalable Vector Graphics* (SVG) como a tecnologia ideal para representar, estilizar e animar símbolos elétricos em tempo real.3 Este relatório técnico apresenta uma análise aprofundada dos conceitos fundamentais de SVG aplicados à criação de blocos e símbolos elétricos fotovoltaicos, integrando padrões normativos globais, estratégias de reutilização de código no *Shadow DOM*, diretrizes de performance e fluxos dinâmicos de interatividade.

## ---

**Fundamentos da Simbologia Elétrica e Normas Internacionais Aplicadas ao Setor Fotovoltaico**

A padronização internacional de diagramas unifilares e esquemáticos elétricos é essencial para mitigar erros de interpretação em campo, garantindo a integridade dos operadores e a correta manutenção das instalações.5 No cenário internacional, a norma IEC 60617 (harmonizada em âmbito regional por normas como a BS EN 60617 no Reino Unido e a AS 1102 na Austrália) representa o padrão dominante em escala global para documentação eletrotécnica.8 Em contrapartida, os Estados Unidos historicamente se apoiaram na norma IEEE 315-1975 (ANSI Y32.2), que foi desativada sem substituição direta em novembro de 2019, consolidando a IEC 60617 como o principal referencial para novos projetos.8

A divergência entre os padrões IEC 60617 e ANSI Y32.2 baseia-se em filosofias de design visual distintas.10 A IEC 60617 adota a lógica retangular, privilegiando o uso de contornos geométricos simples e blocos uniformes com qualificadores internos para representar funções lógicas e componentes físicos.10 O padrão ANSI, por sua vez, apoia-se em uma lógica pictórica e representativa, simulando visualmente as características físicas ou mecânicas dos componentes.10 Na modelagem de dispositivos comuns em sistemas fotovoltaicos e circuitos de suporte, essas disparidades determinam a estrutura geométrica do arquivo SVG, conforme detalhado na tabela abaixo 9:

| Componente Elétrico / Fotovoltaico | Representação IEC 60617 (Lógica Retangular) | Representação ANSI Y32.2 (Lógica Pictórica) |
| :---- | :---- | :---- |
| **Resistor** | Caixa retangular limpa e simétrica.10 | Linha em zigue-zague contínuo em formato de mola.10 |
| **Indutor** | Série de semicírculos sólidos adjacentes.10 | Bobina helicoidal com laços ou curvas sobrepostas.10 |
| **Fusível** | Retângulo vazado transpassado por uma linha contínua de condutor.9 | Linha ondulada em formato de "S" interrompendo o traçado do condutor.10 |
| **Portas Lógicas** | Blocos retangulares idênticos com qualificadores de função (ex: & para AND, ≥1 para OR, \=1 para XOR).10 | Geometrias estilizadas exclusivas para cada porta lógica (ex: formato de escudo para OR, formato de "D" para AND).10 |
| **Inversor Lógico** | Bloco retangular contendo o algarismo 1 seguido de uma bolha de inversão na saída.11 | Triângulo indicador de fluxo seguido de uma bolha de inversão clássica na ponta.11 |

A aplicação sistemática das diretrizes da norma IEC 60617 à engenharia fotovoltaica exige que os blocos de SVG utilizem as dimensões padronizadas baseadas em uma malha de módulo ![][image1].7 Essa malha assegura que os espaçamentos correspondam a múltiplos de ![][image2], provendo área suficiente para a inclusão clara das designações de terminais e anotações técnicas sem sobreposição de textos.7 Além disso, a norma ISO 11714-1 permite a modificação proporcional dessas dimensões sob condições específicas de desenho, desde que mantida a integridade geométrica e a legibilidade do símbolo.7

No âmbito dos sistemas fotovoltaicos, os símbolos fundamentais para geração de diagramas de engenharia devem representar com precisão os componentes de conversão, proteção e interfaceamento.1 O módulo fotovoltaico é convencionalmente desenhado com base no símbolo da célula fotovoltaica (uma variação de célula galvânica com duas linhas paralelas, onde a linha maior representa o terminal positivo e a menor e mais espessa representa o terminal negativo), circundado por uma envolvente de proteção e acompanhado por setas diagonais indicativas de radiação luminosa incidente.8

O inversor CC/CA (corrente contínua para corrente alternada) é representado por um bloco quadrado dividido diagonalmente por uma linha de canto a canto, contendo as marcas de polaridade contínua no quadrante superior esquerdo e a onda senoidal de corrente alternada no quadrante inferior direito.13 Para a correta anotação da natureza da corrente e tensão nesses barramentos, a norma dita a inclusão de parâmetros textuais à direita ou acima do componente.7 Por exemplo, um sistema trifásico com neutro e condutor de proteção operando em regime de ![][image3] e ![][image4] sob esquema de aterramento TN-S é formalmente especificado em SVG através da inserção de elementos de texto com o conteúdo 3/N 50 Hz / TN-S adjacentes ao barramento correspondente.7

As chaves seccionadoras e disjuntores de proteção também exigem modelagem rigorosa de acordo com sua função operacional.5 No padrão IEC, os dispositivos automáticos de proteção termomagnética (como os mini-disjuntores ou MCBs) integram no próprio elemento móvel da chave um pequeno gancho bimetálico para indicar o disparo térmico por sobrecorrente de longo prazo, associado a uma terminação em semicírculo ou retângulo para indicar o disparo magnético instantâneo contra curtos-circuitos.9 A simbologia de chaves de interrupção em SVG utiliza linhas inclinadas em relação ao barramento para denotar o ponto de articulação e o sentido físico da abertura mecânica da chave de contatos.9

## ---

**Diretrizes de Aterramento e Segurança em Sistemas Fotovoltaicos e de Armazenamento**

O aterramento de segurança e de referência desempenha um papel crítico no desenvolvimento de sistemas fotovoltaicos e de armazenamento de energia (ESS), atuando diretamente na dissipação de correntes de falta e na mitigação de surtos eletromagnéticos induzidos por descargas atmosféricas.19 O desenvolvimento de blocos de SVG voltados a sistemas fotovoltaicos exige a diferenciação clara das conexões de aterramento, uma vez que a mistura indevida de referências de terra é uma causa comum de falhas operacionais e ruídos em sensores eletrônicos sensíveis.10

O projeto gráfico de instalações de energia solar expõe de forma direta o contraste entre as filosofias de aterramento dos padrões norte-americano (regido pelo *National Electrical Code* \- NEC) e internacional (baseado nas diretrizes da IEC).19 Essas diferenças filosóficas refletem-se diretamente na terminologia empregada, nas bitolas dos condutores e, consequentemente, na representação esquemática dos diagramas em SVG.19 A tabela a seguir descreve as divergências fundamentais de engenharia entre os dois regulamentos 19:

| Característica de Aterramento | Diretriz do National Electrical Code (NEC) | Diretriz da International Electrotechnical Commission (IEC) |
| :---- | :---- | :---- |
| **Filosofia Primária de Segurança** | Eliminação rápida da falta (*Fault Clearance*).19 | Gerenciamento de potencial de toque seguro (*Touch Voltage Management*).19 |
| **Condutor Principal de Proteção** | Condutor de Aterramento de Equipamentos (EGC \- *Equipment Grounding Conductor*).19 | Condutor de Terra de Proteção (PE \- *Protective Earth*).19 |
| **Mecanismo de Proteção** | Fornecer caminho de baixíssima impedância para forçar o disparo imediato do disjuntor.19 | Manter a equalização de potencial para limitar a tensão de toque a níveis seguros sob falha (tipicamente ![][image5]).19 |
| **Identificação Visual do Condutor** | Cobre nu, isolamento na cor verde sólida ou verde com listras amarelas.19 | Identificação exclusiva por meio de isolamento listrado em verde e amarelo.19 |
| **Configuração de Sistemas** | Frequentemente exige o aterramento sólido de um dos condutores de corrente (ex: o neutro).19 | Oferece flexibilidade total para múltiplos esquemas de aterramento estruturados (TN, TT, IT), incluindo sistemas isolados.19 |

Do ponto de vista geométrico e visual do código SVG, cada categoria de aterramento requer o uso de uma representação gráfica normalizada segundo a IEC 60617, permitindo que operadores humanos e algoritmos computacionais identifiquem de forma precisa a natureza física do ponto de conexão.10

O terra geral ou ponto de ligação física com a terra úmida do solo é desenhado como uma linha vertical contínua que encontra três barras horizontais paralelas e concêntricas de comprimentos decrescentes, formando uma estrutura de pirâmide invertida.10 Esse símbolo representa a conexão de segurança que visa equalizar o potencial elétrico do sistema ao do solo natural.19

O terra de proteção (PE), por sua vez, pode apresentar a mesma estrutura geométrica circundada por uma linha circular externa para indicar o caráter crítico de segurança das massas metálicas aterradas dos módulos fotovoltaicos.10

A massa ou chassi elétrico é mapeada como uma linha vertical conectada perpendicularmente a um segmento reto horizontal de onde partem três linhas inclinadas paralelas, assemelhando-se a um ancinho inclinado.10 Esse símbolo representa a blindagem e o aterramento funcional de gabinetes de inversores ou quadros elétricos de metal, os quais podem ou não estar ligados ao terra de proteção física.10

Por fim, o terra de sinal, utilizado para isolar e fixar o potencial de referência zero em redes de comunicação digital (como portas RS485 de inversores e medidores de irradiância), é codificado em SVG como um triângulo perfeito vazado ou preenchido apontando diretamente para baixo.10

## ---

**Arquitetura de Código SVG para Reutilização de Blocos e Símbolos**

A escalabilidade de softwares supervisórios para o setor solar depende da estruturação interna dos arquivos SVG.21 O padrão SVG oferece múltiplos mecanismos de agrupamento de elementos gráficos, mas apenas a combinação inteligente das tags \<defs\>, \<g\>, \<symbol\> e \<use\> provê o equilíbrio necessário entre semântica de engenharia, reutilização de dados e flexibilidade de estilo.21

O elemento \<defs\> funciona estritamente como um repositório interno invisível.21 Elementos e recursos declarados em seu interior — como gradientes lineares, máscaras de recorte ou caminhos vetoriais complexos — não são desenhados diretamente na tela pelo renderizador do navegador, ficando disponíveis para invocação em tempo posterior.21

Por outro lado, a tag \<g\> agrupa semanticamente uma série de elementos visuais para que eles compartilhem propriedades herdáveis de CSS ou transformações geométricas bidimensionais afins, sendo renderizados de imediato no fluxo normal do documento, a menos que marcados explicitamente com atributos de ocultação.21

O elemento \<symbol\> estende as vantagens de \<defs\>, pois permanece oculto até que seja instanciado, ao mesmo tempo em que suporta o atributo viewBox para estabelecer um sistema de coordenadas local independente do restante do documento SVG.24

Essa autonomia de escala é fundamental para a criação de bibliotecas de componentes reutilizáveis: um disjuntor elétrico pode ser projetado e padronizado em um espaço local ideal de ![][image6] unidades e, posteriormente, desenhado em qualquer dimensão ou posição do diagrama unifilar principal por meio da tag \<use\>.21 O uso de \<symbol\> é preferível a \<defs\> quando o objetivo é construir conjuntos robustos de ícones ou componentes interativos, pois o elemento cria limites de viewport que evitam a extrapolação acidental de traçados.26

No fluxo de desenvolvimento de diagramas esquemáticos com o uso de editores vetoriais como o Inkscape, os desenvolvedores frequentemente utilizam bibliotecas públicas de símbolos ou plugins especializados que habilitam grades modulares inteligentes com pontos de atração geométrica (*snapping*) habilitados.28 Essas grades permitem alinhar com precisão os barramentos de energia com os pontos de contato dos blocos SVG, de forma análoga ao comportamento de um software CAD convencional.28

Em termos de anotação de engenharia, a padronização exige que as letras indicativas de referência de componentes (como *F1* para fusíveis ou *Q1* para disjuntores) sejam renderizadas utilizando estilos de fonte em itálico, enquanto as unidades e grandezas físicas (como ![][image7], ![][image8] ou ![][image9]) devem ser expressas em fontes convencionais não estilizadas para assegurar a legibilidade e a sobriedade do desenho.12

### **O Mecanismo do Shadow DOM e a Transposição de Estilo via Custom Properties**

Ao instanciar um bloco gráfico reutilizável utilizando o elemento \<use href="\#id-do-simbolo"\>, o navegador clona a árvore de elementos internos do símbolo para dentro de uma Shadow Tree protegida, hospedada pelo próprio elemento \<use\>.25 Esse encapsulamento introduz uma barreira de proteção no DOM que impede que regras de estilo CSS declaradas fora do componente acessem ou alterem de forma direta os traçados geométricos internos do símbolo clonado.29 Regras CSS tradicionais que tentem aplicar propriedades de preenchimento (fill) ou contorno (stroke) baseadas em classes internas dos elementos aninhados falham ao tentar ultrapassar a fronteira do Shadow DOM.29

Para superar essa limitação sem a necessidade de duplicar o código SVG ou recorrer a renderizações redundantes de componentes, os desenvolvedores utilizam propriedades personalizadas de CSS (Custom Properties).29 As variáveis CSS possuem a característica de propagação em cascata que lhes permite atravessar sem impedimentos a barreira de isolamento do Shadow DOM.29 Ao utilizar as variáveis CSS estruturadas por meio da função var() nos atributos geométricos do símbolo dentro de \<symbol\>, as alterações aplicadas na tag \<use\> externa ou em classes CSS do documento principal influenciam dinamicamente a renderização das formas protegidas no interior da árvore encapsulada.29

A manipulação dinâmica das formas gráficas permite acionar efeitos dinâmicos de interface, tais como a rotação ou translação física de interruptores e braços móveis para indicar a abertura ou o fechamento de um disjuntor.29 No projeto de componentes articulados, os eixos de rotação devem ser fixados utilizando propriedades de origem de transformação (transform-origin) e caixa de transformação (transform-box: fill-box) associadas a variáveis dinâmicas de angulação declaradas no CSS.29

O exemplo de código a seguir ilustra a declaração de uma biblioteca oculta de SVG contendo um símbolo de disjuntor termomagnético de segurança trifásico de corrente contínua, preparado para sofrer variações de estado físico e cor por meio do mecanismo de Custom Properties 16:

HTML

\<svg xmlns\="http://www.w3.org/2000/svg" style\="display: none;"\>  
  \<defs\>  
    \<symbol id\="disjuntor-termomagnico-iec" viewBox\="0 0 100 120"\>  
      \<line x1\="50" y1\="0" x2\="50" y2\="25"   
            stroke\="var(--mcb-cor-condutor, \#1c7ed6)"   
            stroke-width\="var(--mcb-espessura, 4)"   
            stroke-linecap\="round" /\>  
      \<line x1\="50" y1\="95" x2\="50" y2\="120"   
            stroke\="var(--mcb-cor-condutor, \#1c7ed6)"   
            stroke-width\="var(--mcb-espessura, 4)"   
            stroke-linecap\="round" /\>

      \<circle cx\="50" cy\="25" r\="3"   
              fill\="var(--mcb-cor-contato, \#333333)" /\>

      \<line x1\="50" y1\="25" x2\="50" y2\="85"   
            stroke\="var(--mcb-cor-lamina, \#e03131)"   
            stroke-width\="var(--mcb-espessura, 4)"   
            stroke-linecap\="round"  
            style\="transform-origin: 50px 25px; transform-box: fill-box; transform: rotate(var(--mcb-angulo-abertura, 0deg)); transition: transform 0.3s ease-in-out;" /\>

      \<path d\="M 40 55 C 30 55, 30 45, 40 45"   
            fill\="none"   
            stroke\="var(--mcb-cor-protecao, \#333333)"   
            stroke-width\="2" /\>

      \<path d\="M 60 45 L 68 45 L 68 55 L 60 55"   
            fill\="none"   
            stroke\="var(--mcb-cor-protecao, \#333333)"   
            stroke-width\="2" /\>

      \<line x1\="35" y1\="85" x2\="65" y2\="85"   
            stroke\="var(--mcb-cor-contato, \#333333)"   
            stroke-width\="3"   
            stroke-linecap\="round" /\>  
    \</symbol\>  
  \</defs\>  
\</svg\>

Esta arquitetura permite que o desenvolvedor web instancie o disjuntor no diagrama unifilar e gerencie o seu estado físico (aberto, fechado, em trip térmico ou em trip magnético) modificando apenas as propriedades CSS correspondentes no elemento \<use\> 29:

HTML

\<use href\="\#disjuntor-termomagnico-iec" x\="150" y\="200" width\="80" height\="96"  
     style\="--mcb-cor-condutor: \#2b8a3e; \--mcb-cor-lamina: \#2b8a3e; \--mcb-angulo-abertura: 0deg;" /\>

\<use href\="\#disjuntor-termomagnico-iec" x\="300" y\="200" width\="80" height\="96"  
     style\="--mcb-cor-condutor: \#adb5bd; \--mcb-cor-lamina: \#e03131; \--mcb-angulo-abertura: \-30deg;" /\>

## ---

**Performance de Renderização: SVG versus Canvas em Sistemas de Grande Porte**

O projeto de sistemas de supervisão e aquisição de dados (SCADA) para usinas solares de geração centralizada expõe desafios extremos de performance gráfica.32 Em instalações com milhares de strings de módulos fotovoltaicos, inversores centralizados, caixas de junção (*stringboxes*), inversores de string e transformadores, o número de elementos visuais a serem renderizados simultaneamente na tela pode atingir dezenas de milhares de entidades geométricas.32 Nesse limite técnico de processamento do navegador, a escolha entre a renderização baseada em vetores pelo DOM (SVG) e a renderização imediata de pixels em tela (HTML5 Canvas) dita a fluidez operacional do sistema.32

O principal gargalo do SVG reside no consumo de memória RAM e na ocupação da linha de processamento (*main thread*) do navegador para realizar o gerenciamento e o cálculo de layout de milhares de nós de elementos XML ativos na árvore de DOM.33 Cada alteração em um atributo ou transformação geométrica (como o reposicionamento espacial por meio de coordenadas x, y ou translações em um zoom do usuário) força o navegador a recomputar a geometria global do documento (*reflow*) e repintar as áreas alteradas (*repaint*).33 Além disso, o processamento de textos dinâmicos em diagramas grandes exige a medição e o posicionamento de fontes, um processo computacionalmente dispendioso que degrada de forma severa as taxas de quadros por segundo (FPS).33

Em contrapartida, a tecnologia HTML5 Canvas opera como um buffer de bitmap único acelerado por hardware gráfico (GPU).32 O navegador gerencia apenas uma tag HTML \<canvas\> no DOM, eliminando por completo a sobrecarga de gerenciamento de estruturas hierárquicas complexas.33

Contudo, essa independência do DOM desabilita os recursos nativos de manipulação de eventos que tornam o SVG tão atrativo.3 No Canvas, para detectar que o usuário posicionou o cursor do mouse sobre um disjuntor específico e exibir um balão com os dados de corrente e temperatura correspondentes, o desenvolvedor deve construir um motor manual de detecção de colisão espacial baseado em dados geométricos organizados em índices espaciais como *Quadtrees*.33

A tabela a seguir apresenta os limites de desempenho identificados em testes empíricos de simulação com fluxos dinâmicos de dados em navegadores convencionais 32:

| Faixa de Elementos Ativos | Tecnologia Gráfica Recomendada | Taxa de Quadros Esperada (FPS) | Análise de Gargalo e Decisões de Arquitetura |
| :---- | :---- | :---- | :---- |
| **![][image10] nós** | **SVG Puro** 32 | ![][image11] 32 | Desempenho excelente. Perfeito para pequenas usinas comerciais ou residenciais, mantendo interatividade simples e estilização rápida via CSS.32 |
| ![][image12] **a ![][image13] nós** | **SVG Otimizado** 32 | ![][image14] 32 | O navegador começa a sofrer picos leves de computação em computadores medianos durante ações de pan e zoom devido ao custo de recalcular traçados complexos.32 |
| ![][image13] **a ![][image15] nós** | **Arquitetura Híbrida** 32 | ![][image16] 32 | O SVG atinge seu limite de tolerância a atualizações rápidas na mesma janela de tempo.32 Recomenda-se desenhar os barramentos de fios estáticos em Canvas e os símbolos de status em SVG.32 |
| ![][image17] **nós** | **Canvas 2D ou WebGL** 32 | ![][image18] 32 | O uso de SVG puro causa lentidão crônica no navegador, travando a interface do usuário devido ao estouro do tempo limite de cálculo de ![][image19] por frame.32 |

### **Técnicas de Engenharia de Otimização de Código SVG**

Para viabilizar a utilização de SVG em diagramas de grande porte sem comprometer a usabilidade do sistema supervisório, o código vetorial importado das ferramentas de design deve ser otimizado por meio de um processo de limpeza automatizado 22:

#### **Remoção de Metadados de Autoria**

Editores gráficos injetam dezenas de linhas de metadados invisíveis para o usuário e dispensáveis para a renderização, tais como tags \<metadata\>, declarações proprietárias da ferramenta de edição e comentários extensos.22 Essas informações devem ser removidas por completo por meio de pacotes como o SVGO (*SVG Optimizer*), reduzindo o tamanho do arquivo em até 60%.22

#### **Simplificação de Caminhos e Redução de Decimais**

Caminhos representados pela tag \<path d="..."\> frequentemente são exportados com coordenadas excessivamente detalhadas e números de alta precisão decimal.22 O arredondamento desses decimais e a unificação de segmentos vetoriais reduzem sensivelmente o volume de dados a ser processado pelo navegador.22 Uma linha simples deve ter suas coordenadas simplificadas de:

HTML

\<path d\="M12.43981829 15.1192837 L18.00010922 25.4391298 Z" /\>

para o formato condensado:

HTML

\<path d\="M12.4 15.1 L18 25.4 Z" /\>

#### **Reutilização Inteligente via Sprite Sheets e Cache de Ativos**

Os símbolos de proteção e conversão que se repetem centenas de vezes ao longo do diagrama unifilar nunca devem ser declarados repetidamente como elementos gráficos independentes.22 Eles devem ser compilados em um arquivo de *Sprite Sheet* SVG externo e inseridos dinamicamente por meio de chamadas de referência à tag \<use\>.22 Essa abordagem permite que o navegador realize o cache físico do arquivo XML contendo os símbolos, poupando largura de banda de rede e otimizando o parse do documento.22

#### **Evitar a Conversão de SVG em Componentes JSX (React)**

A importação de SVGs diretamente como componentes dinâmicos em frameworks modernos baseados em JSX (React) é um antipadrão de desempenho.39 Esse método força a compilação do SVG para o formato de código JavaScript, sobrecarregando o processamento do framework para gerenciar cada micro-elemento do vetor dentro da máquina de estado.39 Essa abordagem custa no mínimo três vezes mais em termos de uso de memória e tempo de computação de frames quando comparada ao carregamento tradicional de arquivos vetoriais vinculados via tags \<use\>.39

## ---

**Interatividade, Acessibilidade e Fluxos de Integração Automatizados**

A verdadeira força do uso de SVG em supervisórios de usinas solares reside na capacidade de estabelecer fluxos dinâmicos de interatividade bidirecional e na conformidade nativa com diretrizes de acessibilidade e engenharia digital.3 Por se integrarem perfeitamente à árvore de elementos do DOM, os blocos de SVG podem receber escutas de eventos padrões do navegador, como cliques, movimentos de cursor e toques na tela em dispositivos móveis, permitindo a abertura de painéis de dados operacionais ao interagir com inversores ou chaves.4

Para representar fluxos dinâmicos de energia em tempo real — como a eletricidade fluindo dos painéis fotovoltaicos para as baterias ou em direção ao inversor —, as técnicas modernas se apoiam no controle das propriedades de traçado de linhas do SVG, em particular os atributos stroke-dasharray e stroke-dashoffset.40

Ao configurar uma linha pontilhada ou tracejada por meio do parâmetro stroke-dasharray, o desenvolvedor pode animar o seu deslocamento contínuo aplicando transições via folha de estilo CSS com a propriedade stroke-dashoffset.40 Esse método, executado diretamente na GPU por aceleração de hardware nativa de transição de CSS, não sobrecarrega a CPU do navegador e garante uma representação fluida e intuitiva de energia em trânsito no diagrama.42

O exemplo de código a seguir ilustra a implementação nativa de uma linha de transmissão animada que demonstra eletricidade fluindo a partir do gerador solar 41:

CSS

@keyframes fluxo-energia-cc {  
  to {  
    stroke-dashoffset: \-40;  
  }  
}

.condutor-ativo-cc {  
  stroke: \#ff922b; /\* Cor laranja indicativa de circuito de corrente contínua solar \*/  
  stroke-width: 5;  
  stroke-linecap: round;  
  stroke-dasharray: 15, 5; /\* Padrão de traço de 15px com espaçamento de 5px \*/  
  animation: fluxo-energia-cc 1s linear infinite;  
}

HTML

\<svg viewBox\="0 0 800 100" class\="barramento-solar"\>  
  \<line x1\="50" y1\="50" x2\="750" y2\="50" class\="condutor-ativo-cc" fill\="none" /\>  
\</svg\>

A orquestração de animações em sistemas mais complexos pode ser desenvolvida utilizando frameworks dedicados de JavaScript que provêm controle temporal avançado, como a biblioteca GSAP (*GreenSock Animation Platform*) com o seu plugin especializado *DrawSVG*, ou a biblioteca *Motion* (anteriormente *Framer Motion*) em ecossistemas modernos.42

Para manter o diagrama acessível a técnicos com deficiência visual e integrável a softwares leitores de tela, o código SVG deve receber anotações semânticas baseadas na especificação WAI-ARIA.3 O elemento raiz do SVG deve ser declarado com o atributo role="img" e acompanhado pelos atributos de rotulagem de acessibilidade aria-labelledby="id-titulo id-descricao".3 No interior do arquivo, as tags \<title\> e \<desc\> devem conter explicações textuais detalhadas sobre o estado atual do diagrama e as medições de geração ativa, garantindo uma navegação inclusiva.3

HTML

\<svg class\="esquematico-solar" viewBox\="0 0 400 300"   
     role\="img" aria-labelledby\="sld-titulo sld-desc"\>  
  \<title id\="sld-titulo"\>Diagrama Unifilar do Sistema Fotovoltaico Comercial\</title\>  
  \<desc id\="sld-desc"\>Circuito elétrico mostrando geração de 900 watts alimentando as baterias sob corrente de 50 amperes.\</desc\>  
  \</svg\>

### **Automação de Projetos e Exportação para Padrões Industriais**

No fluxo de trabalho contemporâneo da engenharia elétrica, o uso de diagramas automatizados integrados a motores web tem ganhado amplo destaque.1 Plataformas de dimensionamento de energia solar, como o *PV*SOL\* e a suíte web *ElectrRD*, realizam os cálculos numéricos da usina de forma automatizada e geram o diagrama unifilar e esquemático elétrico correspondente em formato SVG de forma instantânea para exportação.1 Essa abordagem provê um ganho de produtividade ao projetista, eliminando etapas manuais de desenho técnico em ambientes de CAD desktop tradicional.1

No entanto, uma vez exportado em formato SVG, o diagrama precisa ser compartilhado com equipes de engenharia que trabalham com ferramentas de CAD tradicionais que operam exclusivamente com extensões DXF (*Drawing Exchange Format*).1 Nesse processo de conversão vetorial, os desenvolvedores enfrentam desafios relacionados à renderização e ao alinhamento de textos e rótulos.1 Ferramentas de conversão online comumente aplicadas pelas equipes de engenharia — como *Convertio*, *Cloudconvert* e *AnyConv* — exibem comportamentos distintos no tratamento dessas estruturas 1:

* **Convertio:** Apresenta boa velocidade de processamento, mas falha frequentemente ao omitir linhas importantes de condutores entre as strings fotovoltaicas e os inversores, além de distorcer ou tornar ilegíveis os rótulos de identificação de disjuntores e conversores.1  
* **Cloudconvert:** Preserva a integridade de todas as conexões físicas e linhas elétricas desenhadas no SVG de origem, porém falha ao superdimensionar o tamanho de fontes textuais, fazendo com que as anotações técnicas ultrapassem as bordas dos blocos geométricos projetados para contê-las.1  
* **AnyConv:** Demonstra o melhor equilíbrio geométrico na conversão de arquivos de diagramas fotovoltaicos, garantindo a escala correta dos traçados e o correto posicionamento espacial dos textos explicativos, exibindo limitações residuais apenas na conversão de caracteres de idiomas específicos que contenham linhas ou acentos sobrepostos.1

## ---

**Conclusões e Recomendações Técnicas**

A transição dos supervisórios industriais fotovoltaicos de plataformas desktop locais para o ambiente web baseia-se diretamente na versatilidade e na escalabilidade gráfica providas pelo formato SVG.1 A aplicação correta e estratégica dos conceitos vetoriais analisados neste relatório garante que os sistemas de telemetria operem com altos índices de performance, acessibilidade e conformidade técnica global.3 Com base no exposto, estabelecem-se as seguintes recomendações para o desenvolvimento de soluções supervisórias e CAD web para o setor fotovoltaico:

* **Conformidade Normativa Estruturada:** Todo projeto gráfico de símbolos fotovoltaicos e de aterramento deve seguir de forma estrita as especificações de grade e proporção modular ![][image1] ditadas pela norma IEC 60617, garantindo a consistência geométrica exigida internacionalmente e a facilidade de leitura técnica do diagrama.7  
* **Adoção de Arquitetura de Shadow DOM Flexível:** Os desenvolvedores devem preferir a organização de suas bibliotecas de componentes por meio de tags \<symbol\> com viewBox própria dentro do elemento \<defs\>, instanciando as figuras através de tags \<use\>.24 A estilização de cores e mudanças de estado físico do componente de proteção e geração deve ser delegada integralmente a variáveis CSS customizadas, assegurando o controle dinâmico através do isolamento do Shadow DOM sem duplicação de traçados.29  
* **Otimização Preventiva de Ativos Gráficos:** Para mitigar picos de layout no navegador e evitar a lentidão da tela de controle da planta, todos os arquivos SVG devem passar por processos automatizados de remoção de metadados de editores, redução de precisão de coordenadas para no máximo uma casa decimal e eliminação de filtros dinâmicos de sombreamento e desfoque complexos baseados em processamento de CPU.22  
* **Estratégia de Renderização Híbrida para Grandes Escalas:** Em diagramas que extrapolem o limite de ![][image13] elementos geométricos simultâneos em tela ativa com dados dinâmicos rápidos, recomenda-se desviar da abordagem de SVG puro.32 O desenvolvedor deve implementar uma arquitetura híbrida, mantendo a camada de barramentos de fios estáticos e as representações matemáticas densas desenhadas em um elemento Canvas acelerado por hardware gráfico, enquanto os blocos e símbolos interativos e de alta prioridade de leitura de acessibilidade permanecem renderizados como nós vetoriais em SVG.3

#### **Referências citadas**

1. Aprovecha el diagrama unifilar de PV\*SOL y ahorra tiempo \- Solsta, acessado em maio 18, 2026, [https://solsta.co/aprovecha-el-unifilar-de-PVSOL-22/](https://solsta.co/aprovecha-el-unifilar-de-PVSOL-22/)  
2. ElectroRD — Plataforma de Ingeniería Eléctrica, acessado em maio 18, 2026, [https://electrord.com/](https://electrord.com/)  
3. How to Make Charts with SVG \- CSS-Tricks, acessado em maio 18, 2026, [https://css-tricks.com/how-to-make-charts-with-svg/](https://css-tricks.com/how-to-make-charts-with-svg/)  
4. SVG vs Canvas for Graphics in JavaScript \- Scribbler, acessado em maio 18, 2026, [https://scribbler.live/2024/09/11/SVG-vs-Canvas.html](https://scribbler.live/2024/09/11/SVG-vs-Canvas.html)  
5. IEC Symbols for Isolators, Fuses, Contactors | Capital X Panel Designer, acessado em maio 18, 2026, [https://symbols.radicasoftware.com/228/iec-isolators-disconnectors-fuses-contactors-overloads](https://symbols.radicasoftware.com/228/iec-isolators-disconnectors-fuses-contactors-overloads)  
6. IEC Symbols (IEC 60617\) | Capital X Panel Designer by Siemens, acessado em maio 18, 2026, [https://symbols.radicasoftware.com/225/iec-symbols](https://symbols.radicasoftware.com/225/iec-symbols)  
7. IEC 60617 Electrical Symbols Standards | PDF | International Electrotechnical Commission, acessado em maio 18, 2026, [https://www.scribd.com/document/958954531/376261727-IEC-60617-pdf](https://www.scribd.com/document/958954531/376261727-IEC-60617-pdf)  
8. Electronic symbol \- Wikipedia, acessado em maio 18, 2026, [https://en.wikipedia.org/wiki/Electronic\_symbol](https://en.wikipedia.org/wiki/Electronic_symbol)  
9. Electrical Symbols Chart: BS EN 60617 Reference for UK Electricians \- Elec-Mate, acessado em maio 18, 2026, [https://www.elec-mate.com/guides/electrical-symbols-chart](https://www.elec-mate.com/guides/electrical-symbols-chart)  
10. Electrical Symbols Guide 2026: IEC vs ANSI Standards (Full List), acessado em maio 18, 2026, [https://kth-electric.com/en/electrical-symbols-guide-iec-ansi/](https://kth-electric.com/en/electrical-symbols-guide-iec-ansi/)  
11. ANSI vs IEC Logic Symbols: A Schematic Reading Guide \- DigiSim.io, acessado em maio 18, 2026, [https://digisim.io/blog/decoding-digital-logic-mastering-ansi-vs-iec-symbols-on](https://digisim.io/blog/decoding-digital-logic-mastering-ansi-vs-iec-symbols-on)  
12. Diagrama Unifilar Fotovoltaico 24V | PDF | Naturaleza | Electricidad \- Scribd, acessado em maio 18, 2026, [https://www.scribd.com/document/494498092/DIAGRAMA-UNIFILAR-SOLUCION-1-y-2](https://www.scribd.com/document/494498092/DIAGRAMA-UNIFILAR-SOLUCION-1-y-2)  
13. Símbolos da Norma IEC 60617 | PDF | União Europeia \- Scribd, acessado em maio 18, 2026, [https://pt.scribd.com/doc/48914371/IEC-60617](https://pt.scribd.com/doc/48914371/IEC-60617)  
14. Inverter Symbol | Capital X Panel Designer by Siemens, acessado em maio 18, 2026, [https://symbols.radicasoftware.com/229/single-line-symbols/79/power-supply-inverter-dc-ac](https://symbols.radicasoftware.com/229/single-line-symbols/79/power-supply-inverter-dc-ac)  
15. IEC 60617 Symbols and Descriptions for Electrical Components \- Studocu Vietnam, acessado em maio 18, 2026, [https://www.studocu.vn/vn/document/uef-dai-hoc-kinh-te-tai-chinh-thanh-pho-ho-chi-minh/thi-truong-chung-khoan/iec-60617-fdfdfdfd/121756806](https://www.studocu.vn/vn/document/uef-dai-hoc-kinh-te-tai-chinh-thanh-pho-ho-chi-minh/thi-truong-chung-khoan/iec-60617-fdfdfdfd/121756806)  
16. Simbologia IEC 60617 Completa | PDF | Relé | Transformador \- Scribd, acessado em maio 18, 2026, [https://pt.scribd.com/document/316528239/IEC-60617-SIMBOLOS](https://pt.scribd.com/document/316528239/IEC-60617-SIMBOLOS)  
17. Symbol of Miniature Circuit Breaker: Technical Guide of 2026, acessado em maio 18, 2026, [https://www.geya.net/symbol-of-miniature-circuit-breaker/](https://www.geya.net/symbol-of-miniature-circuit-breaker/)  
18. IEC 60617 S00287 | Products & Services Portal, acessado em maio 18, 2026, [https://products.iec.ch/view/grs/7325](https://products.iec.ch/view/grs/7325)  
19. NEC vs IEC Grounding for Solar PV & Storage: A Guide \- Anern Store, acessado em maio 18, 2026, [https://www.anernstore.com/blogs/diy-solar-guides/nec-iec-grounding-pv-storage](https://www.anernstore.com/blogs/diy-solar-guides/nec-iec-grounding-pv-storage)  
20. How to Read Ground Circuit Symbols in Circuit Diagrams \[Guide\] \- Blikai, acessado em maio 18, 2026, [https://www.blikai.com/blog/how-to-read-ground-circuit-symbols-in-circuit-diagrams-guide](https://www.blikai.com/blog/how-to-read-ground-circuit-symbols-in-circuit-diagrams-guide)  
21. SVG: Grouping and Re-using Elements \- Frontend Babel, acessado em maio 18, 2026, [https://frontendbabel.info/articles/svg-grouping-and-reusing-elements/](https://frontendbabel.info/articles/svg-grouping-and-reusing-elements/)  
22. The Complete Guide to SVG Icon Optimization for Web Performance \- DEV Community, acessado em maio 18, 2026, [https://dev.to/albert\_nahas\_cdc8469a6ae8/the-complete-guide-to-svg-icon-optimization-for-web-performance-2hng](https://dev.to/albert_nahas_cdc8469a6ae8/the-complete-guide-to-svg-icon-optimization-for-web-performance-2hng)  
23.   
24.   
25. Styling SVG  
26. Document Structure — SVG 2, acessado em maio 18, 2026, [https://www.w3.org/TR/SVG2/struct.html](https://www.w3.org/TR/SVG2/struct.html)  
27. In SVG, what's the difference between using  
28. basverdoes/ElectricalSymbolLibrary: A public domain SVG library of electrical circuit symbols. \- GitHub, acessado em maio 18, 2026, [https://github.com/basverdoes/ElectricalSymbolLibrary](https://github.com/basverdoes/ElectricalSymbolLibrary)  
29. Smashing Animations Part 6: Magnificent SVGs With  
30. How to Make SVG Interactive with JavaScript, acessado em maio 18, 2026, [https://svg-tutorial.com/svg/interaction/](https://svg-tutorial.com/svg/interaction/)  
31. AutoCAD Electrical 2023 Help | IEC-60617 Symbol Preview \- 1 Pole Circuit Breakers, acessado em maio 18, 2026, [https://help.autodesk.com/cloudhelp/2023/ENU/AutoCAD-Electrical/files/GUID-DB1548A3-A4D3-47E5-86AC-37000DC57D80.htm](https://help.autodesk.com/cloudhelp/2023/ENU/AutoCAD-Electrical/files/GUID-DB1548A3-A4D3-47E5-86AC-37000DC57D80.htm)  
32. SVG vs Canvas: Performance Cut‑offs, Benchmarking & Hybrid Strategies, acessado em maio 18, 2026, [https://blog.vijayt.com/svg-vs-canvas-performance-cut-offs-benchmarking-hybrid-strategies/](https://blog.vijayt.com/svg-vs-canvas-performance-cut-offs-benchmarking-hybrid-strategies/)  
33. SVG vs Canvas vs WebGL for Diagram Viewers: Tradeoffs, Bottlenecks, and How to Measure | by Vital F | Medium, acessado em maio 18, 2026, [https://medium.com/@codetip.top/svg-vs-canvas-vs-webgl-for-diagram-viewers-tradeoffs-bottlenecks-and-how-to-measure-8cedbd3b7499](https://medium.com/@codetip.top/svg-vs-canvas-vs-webgl-for-diagram-viewers-tradeoffs-bottlenecks-and-how-to-measure-8cedbd3b7499)  
34. How much SVG is too much SVG? \- Graphic Design Stack Exchange, acessado em maio 18, 2026, [https://graphicdesign.stackexchange.com/questions/66243/how-much-svg-is-too-much-svg](https://graphicdesign.stackexchange.com/questions/66243/how-much-svg-is-too-much-svg)  
35. Performance of canvas versus SVG \- Boris Smus, acessado em maio 18, 2026, [https://smus.com/canvas-vs-svg-performance/](https://smus.com/canvas-vs-svg-performance/)  
36. Mastering SVG Optimization: How to Maintain Crispness and Scalability Across Different Screen Sizes and Resolutions \- Zigpoll, acessado em maio 18, 2026, [https://www.zigpoll.com/content/how-can-i-best-optimize-svg-graphics-to-maintain-crispness-and-scalability-across-different-screen-sizes-and-resolutions-in-the-designs](https://www.zigpoll.com/content/how-can-i-best-optimize-svg-graphics-to-maintain-crispness-and-scalability-across-different-screen-sizes-and-resolutions-in-the-designs)  
37. How to optimize SVG files: A complete guide for beginners \- Penpot, acessado em maio 18, 2026, [https://penpot.app/blog/how-to-optimize-svg-files-a-complete-guide-for-beginners/](https://penpot.app/blog/how-to-optimize-svg-files-a-complete-guide-for-beginners/)  
38. acessado em maio 18, 2026, [https://penpot.app/blog/how-to-optimize-svg-files-a-complete-guide-for-beginners/\#:\~:text=a%20code%20editor.-,Remove%20unnecessary%20elements%20and%20metadata,SVG%20file%20for%20maximum%20efficiency.](https://penpot.app/blog/how-to-optimize-svg-files-a-complete-guide-for-beginners/#:~:text=a%20code%20editor.-,Remove%20unnecessary%20elements%20and%20metadata,SVG%20file%20for%20maximum%20efficiency.)  
39. Optimizing SVGs for the best frontend performance \- Matt Cassara, acessado em maio 18, 2026, [https://www.mattcassara.com/blog/optimizing-svgs-for-the-best-frontend-performance](https://www.mattcassara.com/blog/optimizing-svgs-for-the-best-frontend-performance)  
40. Reuse SVG elements with different path values \- Stack Overflow, acessado em maio 18, 2026, [https://stackoverflow.com/questions/23902145/reuse-svg-elements-with-different-path-values](https://stackoverflow.com/questions/23902145/reuse-svg-elements-with-different-path-values)  
41. how to make interactive & animated SVG polyline chart \- Stack Overflow, acessado em maio 18, 2026, [https://stackoverflow.com/questions/38630313/how-to-make-interactive-animated-svg-polyline-chart](https://stackoverflow.com/questions/38630313/how-to-make-interactive-animated-svg-polyline-chart)  
42. SVG Line Drawing Animation Solutions in 2025: Vivus.js Alternatives & Modern Approaches \- portalZINE.DE, acessado em maio 18, 2026, [https://portalzine.de/svg-line-drawing-animation-solutions-vivus-js-alternatives-modern-approaches/](https://portalzine.de/svg-line-drawing-animation-solutions-vivus-js-alternatives-modern-approaches/)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAG0AAAAZCAYAAAA7S6CBAAADwElEQVR4Xu2YTciMURTHj3zn+6MQRRbKV0gUSZEFiRRKlIWNjVKIsGMhYuOVJEKSz6KkKIspiliwICUKkYUQoVA4v/c8x9znvvPMTG+Zd17dX/1r5txzn+fee+49586IJBKJRCLxfzJedVh1V/VKdVw1MOeRZ4DqlJjvQ9Uh1ZjQoYFMylRtvDH9Y4PYnCrZm5ahqmWqjarfqvdigaxEF9UW1Q8x3xWqxao+oVMD4H0HxTbOF7Gx3FONC50KwPeN6rzqqOqZ6pNqVujUWdihOiM2qSVRm8MkV6q+ql5HbY1igdj79wS23qrrYmPvFdgrQZBaxOayT9U139x5YKJXxXYvE9+Wb26FU0bA1ov5XMs3N4xNYu9HIWw6bGMje0xJ1Tc2dkZGidU0X5Bj+eZWZqp6qk5IcWAbASeN9PwxsjMexjUlsseUpP1BC/vxeVjwHTi1RfWVTT8k+uzfHQ5PrUzxFxbislha9FMUdmaAJ8Xq32PVT9WcoL3RMJ54cp4lGGM1SqqRYjWcFDlBbBGLGKF6KeXTPUN1X6yeflDtFKuxm1XPxTYUKXgqnaW8pq4NmR/98Z2vGq46m9l+qc6JXY4KYfIEjMCRWt6K1StOH0wUO3nUDT+Jl1TdsvZq+CWHC0u9mtzas35Y8N1i4yIIteDCMjr4vlesL4tejelitZTbagh9qaesD3iQP0v+1HsmcD/ol9kIpONBvilVLngE6pbY7vOTxOAYJC8gYAQOCBYPpK41C8vFTv4RyS9IvfgiPZG26S7Eg8ZCh9A3LBWDxE6ir6HjQQshY8R+ZDDmU8raK7JUdUHs5BBZIszDmQzBCQP0QvVNLEU0A7NV71Rbpf23QObCnGrNy4MWL2QcNNpL0jYY9QbN31PK2itCLSDtOfxw5uHYTku+I/mWk1irbjQK0vhKKdckNt7gcnMbSF38IRD+nvNF8o1aRNMEjaN+Q/KXCn/4ftW0wA7YT0j1wh1CnSTQ9KtXLa09a8MfADw/hKCgIjwVrgtsizJbXINimiJopBP+FeAmM0nKgfCFJk06tHEb+p611xu0f8Fo1SNpG2yXQwAIxBVVj8zWXbVd8qn0qdjPB37SFMF8F4rVmrDu8TzeuSv7DNwNHoil27mB3wExX/cDfPGbJ+U19ffckegnAbuUv6vCyd4O2ijKTILJMul4YRA7tCPwHVskh13KNTq+NF0UCzo3TUoB1/NqtSy+8iP6VRrH6gq2tRVs+JUiG++Ifx6ghNgpY2OuUa2S/M5PJBKJRCKRSCQSiY7gD9BvFUcIShWwAAAAAElFTkSuQmCC>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAZCAYAAADJ9/UkAAAB1UlEQVR4Xu2UPShFYRjHH6EokgyIMstCwoAMrBZfm9kiq3yUhV1SSlImA4OFQYYTIyORKBkMykCxyMf/f5/zdN/37ZzbnTm/+tW57/Pc9+N5P0Qy/jOlsBkOwMb4dxJVcAmewEe4Deu8DJ92eC6aSw/8sHIDn+Az/IGvsMTLUMrhIJyEd/AddnoZPkfwG37BBTjmBjnAOux1G8E0vIb1QbsxBHdFJzoVxIw2uCiasxbEcrCMUSy/jS7RGXOQJObhrGjHK0GMsEJc1L5ozogfVrjyVbgBy5x2lpJ/GnbajAq4B/tEc3b8cI5xOAMf4Ats9aIOnEC4v1xx2n7yYEawSTSH327VGN+ENfATnsFqJ16QHtFOW8JAjJWcXIm/sn64LLoYVjK15ElwwFt4GQZi3JKTCH6InhHCFXPlhJUpWHIXlon39xQ2BDHDLTnhfrtng3ttcOuKKjlPJ2fNVXEShOW3QQy7YnY4edI5OLehQ7Qfg22JVyxkTnTwSqeNr5eV03D3m/COc/CtWIPbcyhF7PeoaAehfBZrnTxenTc4IfkV8jbwcB5L/sTzaeagfCf4VKdij0w4MOXMuQLC8rkxO0js/AJ2x3k8M2E/95L+UmZkZPxhfgEvqWtK6wzuJQAAAABJRU5ErkJggg==>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAXCAYAAABNq8wJAAACXElEQVR4Xu2WzatNURiHX6GIIh8XhaIopZC6uiUMfA4MxEBRhgqlKNKdqPsfXEwuZWim5CNJumUiBjKQiQmJKIliIh+/p3evc9Z+9z72cVM3tZ962me9a52917u+9jZraWnpxXm5JAYL5spVcnqsyOC/Q3JATgl1kdVyLHiu1MLLef2wnFVqkUHHvsqNIb5YXpfv5Q35UZ6QU/NGYqt8av4grs/L1RXmyePyk/xl3n5TqYWXL8gf8rPcJqflDXIOWzWBOfK+fCIXFrH98rs8nRqJQfOOpKQYDBLZ0GlRD7N00TyBF6EusUg+k7tjRWK2vCVPWjWB2+ad3ZzFYNT8obDGfFZIMmeBfCdXhniEQXpkfr84upSvmS/tWhiBM/KSXGbVBF7VxOCsdRPYW/we79Q6DAzxPSFeB0uStmtDfIX5cozxDkz9Q7nUfAPGzlKOMUgJzMh+j+cNrJvA0RCvgw6yBEkkhzKrgOfUQuWO4vdEEqCTTQlQ30RaKiwlllTijjyYlUuwfEaKK0xmAsAm/Sm3Z7HH5pu4wnx5L8QmOwGg/RvztU/HeafUwsbjbH2d+db8Bh+KMiPxLzYx9f3Cs/gPywa5Ry1sCkY8d5f8Vlwp04Z3QJxWuGLdBNbJL1Z9cTGCHK8cs/1y1/y+D+TNUNcIoxxHOx1vh7IYibH5OTVgpvmDOfNz6Dhx6vuFUed5aSn1RVoO0TT16+VL8w11yrzjV638TcJBcExelgeKK7PZ9D0USW9mZr3nm3ci8GmwxbxzvPB6QdJH5E77w0dXA8vlPvu7mWtpafmf+A0LfKA4neAROQAAAABJRU5ErkJggg==>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC8AAAAXCAYAAACbDhZsAAACKklEQVR4Xu2WP0iVURjGH6mEsEhNlGhQ2nJQQQoCh5AKIjOkFEHBpnYVHIVoaBQaGhIJcXBpaJaGoIjAtUAs4QqBYIQg2ZCoPU/vOd5zzz16vWI19D3wg3vf9z3nPN/5931Apkz/pyrIsShWRc5GMUm19eQKitukNEmeRUzA+m5O5J7C+j+wTpHv5CWsgynyk3SHRVQTeUc+wOo+kbawIKE7ZIB8JDukn9wkJ0ktuU+WXW4+yB1YMq/GIV2wWQ4l0y+Q7/wxWYI9VClNw/qNpbFfw3KqKVvqoD0ORlLNN3IxiJ2DzZpmtS6Ip/RPzV+AGZVhLz/wBkq3/6PmL5NbsAPzBMWHUeb2Mq+BbwfxlMo171c13s6i4ECrgxwZJ42kj8zAbhyvazga8/Ht8px8dbnYfI48dP/PkFewugoX+y2ZuBsGYEWPkC+UuaMwfy9ikCy4XGi+lbwlDTAPY65GD1tSK2QbNuPS3942J2CzLS2SLXI9nzbpqYbJgyju95s3lTqwp8kb8oNcCuIplWveSw+hnGZeXnVNV/ukb6wXVKUPwm6QTdLh/teQddhyevlDlSPng3hKhzU/SuZgdZLG3J3A42SWtPiAk7bMe+SXTgofRtKdr7tf7dXPfjqMed2Aayh8CWp8rfiutBxfYI31afAZ6TdsJ1mFmdVrXtulF8V1obSCMhbit5/O0V65kUTOUyR9KPXAvkOuFqYKpOvzBhlyvzNlypSptH4BvAamGHLNx5wAAAAASUVORK5CYII=>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAAAWCAYAAAA/45nkAAACgElEQVR4Xu2YP0iVURjGH0mhIEwxkqBBbXAQc4gIQhcJCsI/6NCQiNCg0BAUEbVGQ0uEiyBI1NIibs1dask/BEHi5FCE0So2tKTPw/sd7rmvCZfrBb8Pzw8e9Jz36NX3Pd97nvMBiUQikTjuPKLmnc5VrADeUQtZTLpVGU7USgN1jVqldqktaoZqiheRcWodtuYtdbYynDgsz2HJVSFaXUycpj5QU7CiJerMEKwAf6jLLia+Uj1+soCcoAapZeqSix0pSrqS/4+67mJqRw/dXNE4RU1Sm9QScvgUd1G/YE/BmIvdhrWgotJG/aZeUuddLDe0w3aHCvA4mu+APa5FpBPm3JT8ZhfLJW9gBVjMxsPUR9gOKgLq77LHa7A+r3GhCE7oE3WBWqEGKlbY/UD3hjxyEWYW5ORy1+Or4QGsAN+pOeoV9v8jOiteuLk8ob/3KuzOMoKCPQXBim7DdpG/DeufewJrVZ6WTPXiJOzza01gN8zt6GJ518VyS+yEGl0soOTHBVCSvkTjm9n4DOz8eA2zsXJSsrgqsnhKlVB2V7LAISYTINsopqjP2feH4T71A3Yo63DOJcEJbfhAhC/AHepnNNbZobEO8L9UfzYv+6fWFie5hP0F0CsOtQ+tl27Afq4eaCOMwn6/2pRvr0eOdr12cK8PRPgCKJFxgkKiNR/fqqstQFgXCiBpY9QTJf49NeEDRSAUQC/slNxpWNsKhDamJ2CHupLNV1sAvYfS+ZM4gFnY7rlH9cFajqxfQLdojXU2fKOeoexM4j4vx1VCuQDx+aDXHsEAqG3ovEhEKCm+fx7kgrROFzn/BMQxFUFfY8ejz1AR/GvxRI38rwDHnj2sHHmfWmd/EgAAAABJRU5ErkJggg==>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFIAAAAWCAYAAABT5cvhAAADAElEQVR4Xu2XS6hNURjHvxuKEEouhXsTA1GUJFIKA/IYSFHK0Ks7YiAzEwOZSEp5JBmIpOQtgx1FMRCFAQZKCUkpCnn8/31r3fPt76yzzmNwunX3r/6dvb61zl5r/ddzi1RUVFRUtMsMH3BMhOZAo3yGYQS0FJoC9bi8bjMGmuWDBvZjJrTMZzjGQfOh0T7D0wsdgX75jMBU6Ar0EboKfYEGRE2zrIBeQyehp9ALaHGpRHegQatE21CUswbZItqPAjoD3Yf6TT4ZCx2DvkEXRcsfFh2gEjSCs4yOF9C/Uq6yVTS+zcQ4Mjeg9yE9EroAfZDyDJgrWjnzuwX7QiM3iLa7KOUqE6An0CQTWw39hQ6GNFfVT+hQLBCgsYwnyRlJw35Dy12cL4zlo2G+cZNFZ2VueZHxkt8GaAxnRzvkjKRpl6U8wL4PsX92ApGdIZ4kZ+Q76Du0yMX3S628bTTfFYnvXWtiKa5DB6R+q4jcgnb7YBNyRrLt51xsmmhfuYwXSM0PvscS35sc2JyRNDFnJP8bn4uQjsT3Mr8ZXG6XoBMm1ic6Q3KztRE5I2liIyOjefbZEt/L8nUMBSMJR/m86GY+G3omeih0wrA2ktDEO6ImbnJ57TDsjSSs76bocu+UIWfkPdFrAU86y2mplefmzE2aJzRP6kgv9Fb0RGwF1vEyPPdA+6C7tey2yBnJw4+3EXvB9n2I/eMpbdkb4klyRg6IxlP3yK8hzeV4WxrfI+susAnWQc+hhSZGM1k/PwjaJWckB9hf1eI98rhovWtCOnWPZDxJn+hXACv2n3/ToVeiN/+41JaILr+jsRDYCP0RvcYQNobPjDWDeyH3xNTM5XseiLajVdiHXaL9eeTyImyXPcjOQp+heSHNycXVwBXVH2L8ZfpaSA/CwqwsJbs3cJa8gR6LTm3ORFZs71Ls8B7oB7QZOhWet5syjeAnGgezEeul9X02zkSvQsr7Nz/12D7OOH69fYJWmnzCwXso2vcd4ZdbXScrpKKioqKiojP+A+nD7Y/TjRaiAAAAAElFTkSuQmCC>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADYAAAAWCAYAAACL6W/rAAAC1UlEQVR4Xu2WTahNURiGP6GI8tuVTC5JKUWIFCUMDPxMiGIuZewvAwYyFXckEhMGIkkZKDcDiSkjyVEiSqIYkJ/3ud/+zl5n7X3uObdTRvupt3vP+n/X9621l1lDQ8P/Zpq0ovhbxyRpSNogTc7qUqZKq6XZeUUNJ6RLmc5Jm6RrWfmItMy72byaugozpAvST+mu9E5a29HCbFh6Ir0wH+iVtCptYG58h/RZuiK1pJvSrKRNznppv/RX+iQdljZLi6Q95uuiDu2W5o71Mpsu3SjKn0n7ivI2U6Tv0pqkjMYvpfnF7yPSH2lbu4XZcnMD7BSGmOiBdfaDQ+Z9e9Eyn5f2KUT/TlHHHClsyEXz+Stg6L51pt9ZaWvye9TcBGaChdJbK40wDhuUj7XTfFG9uGreLu9P5FpFXTo/kDnbs7I2mDiZF2Z8MDeBmWCmueGI9gHzyTkXKWGY9uOxy7x/voGUPzKfP4/mLWlBVjZG7Dodj5tfCIT7i7QuaUcqdTPGYohKnIVuxtK+dXAk4sywYCAT7plHjbRjg5cUdYDpWsIYZyPNXwZ4auWhZ7JexjA0iDGIqHN5AWeadOMMYYg62gCmMVxLGMtTkbL0sujH2OXi/0GMsXg2lXHgvJVRIaIRTf5nbfythfx8bdXcHTUf5Fjxm4X1MkbbQY2xUBbOOHynbkuLk/qIJmXcDeNCgzAQcNOlYX8ufZNWtluU0W6Zp8RG6Zf00Py7GMStSDr1Q3xG3lg5f8CNyVgfpetZXQVeERz8FHYldgZOmy+axQexAA48O8155FyyCXOSdmRDpFY/xPcwvyggxkJ5llVgINJxOCn7LR21cpeXSu/NvzV8MIGnECnGyyE4aN43XgGYfVxoIvAgyL9nwHOPGzv/JHSF9CGtzpiH+JSVBoIt5k8eIsTV+0Paa50pRh/6fjVPI546PMHYmInAuayLSESzznRDQ0PDYPwDJtm9vOuM1bEAAAAASUVORK5CYII=>

[image8]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACcAAAAXCAYAAACI2VaYAAAB8UlEQVR4Xu2VMUsdQRSFj2ggEiERRAwRJXaSFErQoBjSKGhhY1II/gXrSCDFk5A2RBAFQcFKMBYWJlgIioWIja2liKQIhCBooYXxHGbHN3vfruvaxGI/+GD2zt2duzOzs0BBwf+jmjbTt/RpdJ3FGB2yQcOccYY2xjKA+ajP+yjeDRzQX/Q3/UdPaFUso5IzOmGDhvd0Be6Zl3AvUxvLAL7QC7gxP9GasLOT9gbXav+l74KY5THcgFnFiXb6By4/iXq6R0dtRx3dilTb0wX3pv1BzNNNf+L2xQkNrPyXtoOU6DQSVkqBb3QW8el8Bfew4SAmNGOr9A3yFfeMHtJxExeatT4b9KhAW7VmTHtKRXqU84FORu08xSlfs7ML94Ih2wmxVPyDlumDIK69uYny15anOKEXPqc9QUxj5XkGXsPNWquJr9GB4Dpvcf4j0tfpeY7kfViBbt6Am+Ym0/cCledT3uKETgF9aINwe1yrk4mWTwfgd5TXXzOojSxUxJFRxZ1G7a9RXhbrcPct0Q66H+9O5iNcceEBuQB3pAgdM/pzhGqQz1H7SZSXhf4quu+YTsHt7RvRptQp3oL44Du0Lciz3GVZtcdUmO71y5uKP4SVbP1BH15nOtLyF4OcLFSQCiuZ+L1AW2eENtiOgoKCFK4ALqxpjKXgCP4AAAAASUVORK5CYII=>

[image9]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACcAAAAXCAYAAACI2VaYAAACCklEQVR4Xu2VPUgcQRTHn2ihqIgfKKKiSBqrCGIhxEaC2oiiCIKFrYWVTSztUqUJNgoWqdKEdIJYHQhGFARBKxHUUhAhEPED1P//3s3e29nbu5ULVvuHH3fzZmbn7fuYFUmV6r+pBoyBFn8iThWgGbSDVlAZng7EdZwfkvg1pfQZPIMlfyJOR+AQbIJLcCfRw3vAHjgBG+AM9NsFCfUdvIAMqAtPRdUJpsyYETwAi8ZG0alfommhvoJzUaeTiqk8FXXuHxgIT0fFMD+Ipsrph4TfjL83oM8tEC0BRpmHJa2fNbCS+3XRKyrW0QczZmS2wTdj6xV1hA450eGMJIxATn9E146L1h33vknDopHsNjY+MM45RmDC2ItpR3SfTW9JNYEZ0UK/B7/D09nUl+scM/TFjF1jlGwKOjcJ5kVTeiz6MCceXq5zbRJOv7tSkpZEoGkJN0m5aeWLsgmuPB7BPmjILw2LB/rdRmd46HJuXKgh6sGu6J04aOyFxKixGbjfMivRmyIQ7zSmcAtUGzsPo3OuRhrBX/AxWJG/Si5Ah7EXEruTzeCLQeE5q549K74RL1LfOT+t1BP4ZMa883j3/QRVxu7LpdQ2gxWdi00tjbdgXTSNDD83uC+B0wi4FnVmTjSdTIttHF98jsWWBUuH95y/JqIu0U/YgmhxM92FVAtGRdfxf6pUqd5DrzsFcu+v3+HAAAAAAElFTkSuQmCC>

[image10]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAUCAYAAAAUccS4AAAAqklEQVR4XmNgGAWjYHgDZiAWBGJGdInBBkAOvQrEy4GYB01uwAHIcf5AfBuIdwGxFqr04AEghz5gGOSOZAXiCAaIQ9VRpQYXgDlyI8Mgdygod58C4vNAbAflD2oAcqA5EB8H4jNQ/qAHMEeDHOzEAMlsgx7oMSBCecg4GgRAoQ1yPMjhQyJNgwColChgGIQ12CigBgBF6ywicT1U/YABUDUbQiS2YhigDAYAYmob4doSiUIAAAAASUVORK5CYII=>

[image11]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAAUCAYAAADiOEEgAAABhElEQVR4Xu2YsSuFURjGX6EMRBiYGFAmSgyKScogi0zKqPwBLAYrGYwUyUIyGi03GZRNWWRRIoNEsfI83nPu93bc+m7ULXp/9evec857h+/pu+d87yfiOI7j/DXq4SYcg+2wA57ABVPD+XO4CodgN5yHF3Dc1Dk5MOyPxCPYaGoY9m2JunVYa+qcHBj2QDqZwLAL4dP5BR52BfGwKwjDnoNn8AG+w05bIBryKZyFl6I1W7DZFjn51MGeZI6H3wGsCeMm0cOwpVghsiRat2LmnB/wBp9gb7pgmBQN+wq2JmsR3vlTcLoMh2GV/uz/wgtML/JONMiJMK6GDdnyF4Oi28kr7EvWIh62gRe3AZeT+Rg2715yHMYzxYosbP4L8g5YRzTsXSm9ZxdED0/C7/uwLYxJ3LO3JdvbnRxGRFv0CDvHZ9G2PMKnELbwsatk/XXQ/tbJgXf3IzyEO6JtedyrI2zJ+V7kHu7BF3gD+22RUx58juaLpTX5HrSlCy7CUfF3Io7jyCdzSkqdYW0lUQAAAABJRU5ErkJggg==>

[image12]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAUCAYAAAB4d5a9AAABqklEQVR4Xu2TMShHURTGP6EIGRgIkUGZJFGKzWJgsFAGo5JJYTGQLCaDoiQZJMlgkbL8i0FmUiaKREkpUgrf57zrf9/rPX9loXz1q3fPPfee8849B/jXb1UhWSQdpJxUkz0y5DtRuWSYXJE3MkryQx6mMrIE8zl2RgWRwWeTFDsHWIAFck6aA9sZ2YGdd1KCuniLZJFetyGnJrdI0Ap5RNhPf31BdmF/VAFLIoVw4A99J8gJuSSVnq00sF+TWli5X8ka7C9C+k6QB1jWyt5J51LkhbSREVipVz2fT8l5gBzAsnoiNb4DrFRJQXRxFxkPvmOD5JG6iE3O6yTHW2cKossTg8RJmd+R+mCtkmQKMhN8xwbRI0UfSo+sA53B+kfl0uVzZCJid0F02K2jQYrIPtKt3YMvgmgG4t4khXS/T8LaU23q1ADrunnYPRreQ1hbq71DaodNqpOc70mLZ9N8nMIS0vRL0zC/RudEdZNnpCe9xG0oixuyQZZhZXFv4auV3JJt0gdrdZXIVzYZC/b6yZG/qVoPklnEB3AqgL2T/PSdpCoyhcxD/of0Dn/vaRScaXJYAAAAAElFTkSuQmCC>

[image13]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAWCAYAAAC7ZX7KAAAB9UlEQVR4Xu2VTSilURjHnwlFIx+lhsK1nUZZGbHUTLGwpuzZWbDQ7Gxm4Ssli0kkS7Gb1MQsbpIFCyspsbCwIQuKYvLx//ec433u8brpFt2m91e/Xuc5j/M+77nnQyQh4f+kLgxk4SMsC4MSHyuC9bAt7AgohY2wOOwI+QTH4W3YkYUu+ACX4CxchIew1SaBbngO03AebsAG00/48dPwUnQ85o/CEptECmCF6JelRQt4LSyYBbLYMdgiOp6lHO7AShP7Bu/hiGvzA2/gT5/g4AcwHkuuBafDYACLW4GFJvZZdAb9h7AwvrfX5JB+F4/lrQoeFl0qlhp4LPrzN0n0Xo5n8UuOy+UZuRZ8BXtgCg7Af6IbzMNiXyrYF2n/tviCmf+MXApuhtum/UF0owyZWF4VHAdfsi966pC8L5izfu2eJG8K9oOF+Z0SbSbfXpXMi4B9zNmDVXBOdByeCpZBF48lW8HcpVNwHda6GF96Aid8koMv/SPRgc+l8dI5PCO67jtcO+4cZjyWFNwVLdjucsJZ8rM56WLM+QV/+CTRMQ7gVxMjd6K3nWcBnsEvrs3JWoNHEt2AfLL927WfYLIvJtSvKa6hTXgBv7sY4S22LNG1zH7efCE8ObiuOYM8Ak9he0aG/nJbov/f555/YbVNSkhIeEceAUHmj1h4Rq07AAAAAElFTkSuQmCC>

[image14]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAAUCAYAAADiOEEgAAABY0lEQVR4Xu2YwSsFURTGPwsLIcJGWcnOQpIFsbNF8Zb+BDvZK3srpViItY2U7LzyN0hZUaRslGKj8H2dkWvuTG/mMZvn/OpXd87M1PR1Ot07gOM4TmX0pgtONXTQg3SRtNNVek+f6DrsWecXrCAOW0Hv0Bs6SUfoNT2lXd+POUVRoLv0CHHY+/SFTgS1QXpLz+AdXpoFekiXEYd9Se/oUFAbSOoPdDioOw1QiOd0lM4jDvsZ1sXq5i80Pur0jc4EdacBW3QtWWeFrRGSF/YH7B2nAD10NrjOCluBeth/gDq6LbjOClujopmw++girRVwGj+/o+XQjNasDskKu9kx4mEHKCSFlWcdFqp2Iumwu+kF4i2hU4Kszt6g73QuqI3BdinbaPGOrAL9D1Hn6hh+AtsO9sOC1PoKdrjR4Ue1TdixfVwvO+VQN+eNETFFH+kx3aOvdCm551RAJ2zMSK0dx/nXfALpHFVxQmatkQAAAABJRU5ErkJggg==>

[image15]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACcAAAAUCAYAAAAOTSQ2AAACUklEQVR4Xu2VTYjOURSHj4wiXwtKU2pSUlaSj1JsptlYsGAzRdlRsiKUZqFkY2WhKKY3C0nZiaTJTMPKThEpRSlREsVGmN/j3Dvvuff9yluyeX/11P/ee/73nnvuveeYDTTQ/9EycUWMiWExIg6Ko9GogxaI/eKl+C0uihWFhWuROGZu81mcFEsKC9cG8dPc7o9wjkbNymzQQTh2QnwRe1P7oXgq1gY7HLss3qT2evFK3DNfO2ur+Gju9MLcicGW3PgLnTbfxJ7Qx1wz4oVYY+5wQ3yzcg1O6K24n9qMYXN93iKpX+fuiu9iW+hbnPp/iJ1itXgu3lkZzdz/PrWPmG/0zLxFUr/OvbbWiCB2z0IHxCbx1TxKRCsrR5hNoGvm/3AahTA8JB6b74Ro3Cks2osFuznHQvm4OjmXL378pxBHwSuJ4oLfFENVfxSL9nKO+8h3N+fid4tz7cSCn8TGeiCIKPdyjnvH0XVzjgDcTt8tzvGiIIrLi/Huqj/qnx8rTpE4J2KnNZ2LaaLWI2t1jvluWPNf5uGl1s4tt+b/iFfa1rmGtb9zM1YmyenUl1PCuPmEpIEschuvmPyVK8BZ8cu8AmXlV3wptdeZb4I0VGiXecnKojJMie2hD+FIjCaOPxCz1qwmlD3uGJvLYjMkZYKACMg58zK2ORuZVxscLoTxB3FLTJofASWp1rNE3AiliL4n5nmNNMQi9R3eYV6aiPZVc7t9hYVHmhp/XByOA9wHjueC+SNYGgd7iNo5Ks6LVdVYFHMyP5HvND+bOpUYqC/NAYb3mfHNx9t/AAAAAElFTkSuQmCC>

[image16]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAAUCAYAAADiOEEgAAABo0lEQVR4Xu2XzytEURTHj1CElJQUKclWwsKPpWIjJcrO0oalZKcslSRRLKwtJAuT5ZR/gZRSFCkWSigpfL/ufb377jTNnYmF3vnUp+ned6ep75zOO1dEURRF+Y/Mwzv4ZT+bk49/qIRzYp4/wQVYnTihFIQhbsEmWAZH4CPs9c5sw2vYBzvgJczA2viYUogxMRU96uxxnZU4yD34CnuiA2Kq/waeiFZ4MG3wANbbNaubYR/DKrt3Dm9hi12TRrt/D9udfaUI2E4Y9rSz9yymit1ezqrPwg845OwrgZTDJTH9mX06gi0kX9j8Y9iKlCJgy2CYs3AD1jjPGKiG/QdEPXtH4upmqygl7AY4DicDHBDz26mDAX7CYbsutY1o2B6DsNPbY7gMcdGuOYn4YdfBU8kdCZU8cPK4gocSj3mEQb/DfrtelmSlky4xU8qmpKAifwOGtA5bnT1eUBg2J5IKu8f5+kLM5YZ9nN9bEXNt77ZnlAB4mXmB+2JeimdwVXJvhazyB3gEd+EbnEicUIJgZc/ANTjlPXPhOMiXIXVHQ0VRUsk3t+BYmWOsotYAAAAASUVORK5CYII=>

[image17]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAAUCAYAAADY6P5TAAAAe0lEQVR4XmNgGAWjYBSMglFAORAD4nwg5kaXGE6gBohfAnE3EAujyQ0bAIpBUEyCPKqIJjesACcQPwPidUCsjiY37AAzEDsB8XkoDeIPS2AOxMeB+CoQ26PJDQswbD04LJPosC1khnU1MawrelBTDeRBPnSJUTAKBhYAAIxWEp3rYqDrAAAAAElFTkSuQmCC>

[image18]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAAUCAYAAADiOEEgAAABh0lEQVR4Xu2XwStEURTGj6IIKdkoRZKykkQROxsLKdlbKtnaWSg7KwtFSZaSlY2UzRT/gpQVRaKkFBuF7+u8m/OumTeviYVxfvWruafzFu+bO2fuFXEcx3H+Gk1wC07AdtgJT+CCbQJ1cBHewie4BBtSHU5ZGPZH5AFsMT0MehNewSHYAy/hkejzTk4Y1mBcjNiFL5Lu46/gGh6L7/Dc5An7HN7ADlNrS+p3sNvUnQzyhP0suou5mwN8rgDf4JipOxkwtDl4JrpLX2GXbRAdIaXC5oyfMnUng3rYG9UY4B6sNWsP+5fgTn6Efcmao6KSsFvhNJzN4Sis0ceqF75g/JL8M2SIk8m60jHiYRv4cutwOaqHsEOIXMdhN8NT+X4kdErAsHmGLjazC/J1YVmB76K3zEC/6CllQ6p8R/4k46JX9ABvjryOD5saz9cXol8Mb5MMdzXpGzB9ThkY3D3chzui4yLMassIfICHcFv0iDiT6nBywVk8D9ekeNCBRtE5TvnZcZx/zSc8E1S1Hz1jrwAAAABJRU5ErkJggg==>

[image19]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADcAAAAUCAYAAAAp46XeAAACXklEQVR4Xu2WT4iNURjGH6FoJoRMGjZSkoWF7GRBlMR2FGOjiI0yC1slKZHSmIkdKwtLezeKYTOrwcJilChioViQeB7vee853zffOXPvlCt1n/r1df48577v+51zvgv01Vdf/1KLyD7ypD6QSHN2k6fkO7lMlldm5CWvfL8QvX9dq8lN8hr2w2+qw20tJVfJZ3KAbCQvyPl0UkbulW8xordn2kG+Ip/cR3KfLAntMVgxrrVnNGsbotfl3p5pvuQUzLla3wBsu5V0AXlvz1RKbhAW4CFYUPvJysqMZsnXQvTK14lX23gvuUJOwAqo+CbIQdjWltaT2+QsWRH6GlVKbhNs7Ax5BnsL30K79Obke4/ole8uojendeQxrCj3yDi5RW6EvkkyQh6SUfKOvCQbZEZD8UrJaUyLXkr6dsKCnELDYkG+Zs6b87nknSXDoZ3uhMOhTzoa+vxy0y6pqJPkUtN28gUWpIJtUppckzfnc8nbgiUleXLq19ourZ0mp0usolJyW8kPsivp037X3HrgqeT7hLw353MtNLk5R6WU3FrkAywlJ98M8t6cz7XQ5OaolJwk86mk7ecmPXMnyVty2idRR5D3dnLmWug+uXbRdK2qkupQhT+E9hpUX+9z8ggxoIvkJ+wvm5Qedj1dWse9ktZ0b06KSTem4pkmW8gqshn2F079ildzhmDF1O9eJ8vC2B8pEQ3UaSFWTNL50XX7CvZtUeWPIxZAzzFY0Hqmcq98DxC9OaVb3rlTawvN8QvLUWLzbfdG6eO6B3at6410I3nlO4buvd1Kb6+v/1K/AUkWuUYrg40aAAAAAElFTkSuQmCC>
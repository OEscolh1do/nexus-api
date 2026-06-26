# **Plataformas, Editores e Modelos de Código Aberto para Geração e Edição de Gráficos Vetoriais (SVG) aplicados a Desenhos Elétricos**

## **Introdução e o Paradigma da Vetorização Elétrica**

O projeto e a documentação de sistemas elétricos, eletrônicos e de automação exigem um nível rigoroso de precisão geométrica e clareza visual. Gráficos vetoriais, representados predominantemente pelo padrão *Scalable Vector Graphics* (SVG), garantem que esquemáticos e diagramas de circuitos mantenham sua resolução e nitidez sob qualquer fator de ampliação, o que é crucial para a legibilidade de conexões densas em telas de alta definição ou impressões industriais.1 Historicamente, a criação desses gráficos dependia de suítes de CAD proprietárias ou ferramentas de diagramação por assinatura.3 Embora plataformas comerciais e ferramentas de nuvem modernas simplifiquem o design oferecendo bibliotecas ricas de componentes e assistentes de inteligência artificial baseados em créditos, elas limitam a soberania tecnológica, impõem restrições de licenciamento para uso comercial e barram a integração direta do usuário com o código-fonte subjacente.1

Em contrapartida, o ecossistema de código aberto (*open-source*) e de software livre consolidou caminhos altamente flexíveis que vão desde softwares tradicionais de automação de projeto eletrônico (EDA) até compiladores gráficos baseados em linguagens de marcação e modelos computacionais de inteligência artificial de ponta.7 Essas soluções permitem transitar de forma fluida entre esboços informais (à mão livre ou estruturados), descrições de texto em linguagem natural e arquivos de saída SVG padronizados, limpos e prontos para edição posterior ou fabricação.10

## ---

**Softwares de Autoria e Plataformas CAD de Código Aberto**

A diagramação de painéis de controle, redes de distribuição elétrica e esquemáticos eletrônicos de circuito impresso (PCB) é amplamente sustentada por ferramentas visuais de autoria direta. No domínio do software livre, duas ferramentas destacam-se pela precisão geométrica e pela exportação de alta qualidade em formato SVG: o QElectroTech e o KiCad.

### **QElectroTech (QET)**

O QElectroTech é um aplicativo de desktop multiplataforma distribuído sob a licença GNU GPL, amplamente utilizado por engenheiros e técnicos para documentar sistemas de automação, circuitos de comando de motores, diagramas de tubulação e instrumentação (P\&ID) e redes elétricas industriais.9 Uma das maiores vantagens do QElectroTech reside no fato de todos os seus esquemas e elementos de biblioteca serem estruturados nativamente em XML.13 Isso significa que os arquivos gerados contêm uma definição semântica limpa dos nós e condutores, simplificando a conversão direta para arquivos SVG genéricos.13 O software fornece um ambiente de edição duplo composto por um editor de elementos (para construir novos símbolos) e um editor de diagramas (com suporte a arraste e soltura).13

O QElectroTech suporta a exportação de folhas de desenho (fólios) em formato SVG, DXF, PDF e formatos rasterizados como PNG e BMP.13 Para garantir o bom funcionamento estético em ambientes Unix/Linux que utilizam o servidor de exibição X11, o software exige um ajuste específico de resolução de tela para 96 DPI nas configurações do servidor gráfico (por exemplo, no arquivo xorg.conf ou no KDE Control Center), evitando que os textos e linhas elétricas fiquem serrilhados ou desfocados durante a renderização do vetor.15

### **KiCad (Eeschema)**

No desenvolvimento de hardware e eletrônica analógica ou digital, a suíte de EDA *open-source* KiCad consolidou-se como o padrão de mercado para projetos que vão do esquema conceitual ao layout físico de placas de circuito impresso.16 O módulo de captura de esquemáticos do KiCad, o Eeschema, gerencia esquemas planos e hierarquias complexas em vários fólios de desenho.17 Ele atua como o ponto de entrada de uma cadeia de desenvolvimento funcional que valida conexões por meio de verificação de regras elétricas (ERC), gera listas de materiais (BOM) e extrai netlists para simulação SPICE.17

A exportação para SVG no Eeschema é realizada por meio da ferramenta de plotagem integrada, localizada no menu de arquivo, a qual permite plotar todas as folhas do projeto diretamente em vetores SVG escaláveis.7 Os vetores gerados herdam as conexões elétricas e propriedades geométricas com precisão milimétrica, facilitando a importação do design para editores vetoriais externos sem degradação da estrutura de dados lógicos do circuito.7

### **Distinção frente a Alternativas Proprietárias e Freeware**

É fundamental distinguir os sistemas de código aberto de soluções de distribuição gratuita (*freeware*) e plataformas SaaS proprietárias. O yEd Graph Editor, por exemplo, é um editor de gráficos multiplataforma construído em Java Swing baseado na biblioteca comercial yFiles.3 Embora o yEd seja de uso gratuito (inclusive para fins comerciais), sua licença proíbe a redistribuição independente e o uso do software em pipelines de processos automatizados sem autorização da empresa mantenedora.3 O yEd suporta a importação de dados de planilhas de Excel e arquivos XML para organização automática de nós e exporta para SVG, mas seu código-fonte permanece fechado.3

Da mesma forma, o DigiKey Scheme It fornece um ambiente web amigável para rascunhar circuitos elétricos e exportá-los de forma flexível, mas seus termos de licença proíbem estritamente qualquer tentativa de engenharia reversa, descompilação ou acesso ao seu código-fonte, mantendo os direitos de propriedade intelectual integralmente associados à DigiKey.5 Plataformas como Edraw.AI e Canva Vector AI operam no modelo SaaS proprietário sob assinatura, onde a geração de diagramas e vetorizações via inteligência artificial consome créditos computacionais fechados, impossibilitando a execução de modelos locais privados para segurança de propriedade industrial.1

## ---

**Extensões e Bibliotecas Especializadas para Editores Gráficos Universais**

Editores de propósito geral como o Inkscape — que adota o formato SVG como seu padrão nativo de gravação — tornam-se plataformas poderosas para desenhos elétricos especializados quando equipados com stencils estruturados e extensões automatizadas.2

### **inkscapeCircuitSymbols (fsmMLK)**

O projeto inkscapeCircuitSymbols, desenvolvido sob a licença GNU GPL v3.0, é uma extensão paramétrica para o Inkscape criada com o propósito de automatizar a geração de símbolos elétricos e eletrônicos diretamente sobre a tela de pintura.21 A extensão requer a instalação prévia do módulo auxiliar inkscapeMadeEasy (versão 1.0 para Inkscape 1.0 ou superior; ou versões 0.9x para edições antigas do editor).21

O menu de ferramentas é dividido em duas seções de entrada: "General" (geração de bipolos passivos como resistores, indutores, capacitores, fusíveis e chaves configuráveis de múltiplos polos e vias) e "Semiconductor" (geração de diodos, transistores de efeito de campo e bipolares, além de amplificadores operacionais).21 A extensão oferece controle fino sobre os parâmetros geométricos dos símbolos, permitindo rotacionar componentes em graus exatos, configurar convenções de sinais ativos/passivos e acoplar vetores de setas indicadoras de tensão ou corrente com suporte opcional a textos formatados em ambientes matemáticos LaTeX.21

### **Inkscape\_electric\_Symbols (upb-lea)**

Esta biblioteca disponibiliza uma folha padronizada de símbolos vetoriais em conformidade com as normas industriais para desenhos elétricos, diagramas de blocos de controle e esquemas de eletrônica de potência.2 Os componentes gráficos utilizam as cores de diretrizes de interface do GNOME (*GNOME HIG Colors*) e requerem que o projetista configure o ambiente do Inkscape para alinhar os elementos estritamente a uma grade fixa de pixels (com atração de nós e linhas de grade ativadas), garantindo que todos os terminais de conexão dos símbolos coincidam com os condutores do circuito.2

O repositório orienta o uso da tipografia de alta precisão "Latin Modern Roman" instalada no sistema operacional para que os rótulos de texto de variáveis físicas e unidades no vetor se alinhem esteticamente aos padrões de publicação científica.2

### **SpecElectronicsCAD**

As limitações estruturais do Inkscape para o design de engenharia motivaram propostas conceituais de extensão na comunidade, como a especificação SpecElectronicsCAD.23 O objetivo é introduzir suporte nativo a operações lógicas de CAD elétrico no Inkscape utilizando sua biblioteca geométrica 2geom em Python.23 O fluxo de trabalho proposto inclui a busca automática de conectividade espacial por meio de algoritmos de preenchimento por difusão (*flood fill*) para propagar nomes de malhas (*net names*) a pinos, condutores e planos físicos com priorização de rótulos configurada pelo usuário.23

O sistema conceitual visa gerenciar colisões de nomes de rede no caso de junção de linhas, além de oferecer suporte a ferramentas de traçado de pistas com ângulos fixos de 45 graus e exportação de netlists funcionais para simuladores de circuito externos diretamente a partir de camadas dedicadas de um único arquivo SVG.23

### ---

**Diretórios de Configuração e Requisitos de Editores e Extensões Elétricas**

O gerenciamento de bibliotecas de símbolos e a instalação de extensões exigem o posicionamento de arquivos de configuração em diretórios específicos dependendo do sistema operacional adotado. A tabela a seguir consolida essas estruturas de pastas e os requisitos técnicos exigidos para o correto funcionamento das ferramentas de autoria visual.

| Ferramenta / Plataforma | Caminho de Configuração de Elementos (Windows) | Caminho de Configuração de Elementos (Unix/Linux) | Dependências e Requisitos de Sistema |
| :---- | :---- | :---- | :---- |
| **QElectroTech (QET)** 13 | %APPDATA%\\qet\\elements | \~/.qet/elements | Tamanho de instalação reduzido; requer ajuste de resolução para 96 DPI em X11 para evitar fontes serrilhadas.13 |
| **KiCad (Eeschema)** 17 | %APPDATA%\\kicad\\10.0\\user.hotkeys | \~/.config/kicad/10.0/user.hotkeys | Totalmente multiplataforma; arquivos de projeto 100% compatíveis entre sistemas operacionais.16 |
| **Inkscape Symbols (upb-lea)** 2 | %USERPROFILE%\\AppData\\Roaming\\inkscape\\symbols | \~/.config/inkscape/symbols | Requer instalação global das fontes tipográficas OpenType "Latin Modern Roman" (.otf).2 |
| **inkscapeCircuitSymbols** 21 | %USERPROFILE%\\AppData\\Roaming\\inkscape\\extensions\\circuitSymbols | \~/.config/inkscape/extensions/circuitSymbols | Exige a biblioteca inkscapeMadeEasy correspondente; usa arquivos de estrutura modular drawRLC.py, drawSources.py, etc.21 |
| **CircuiTikZ-Designer** 24 | Executável Electron local ou navegador | Servidor local Node.js ou contêiner Docker | Requer Node.js instalado; inicializado no terminal via comandos npm install e npm start.25 |

## ---

**Editores Baseados em Linguagens de Programação e Compilação Vetorial**

Para cenários acadêmicos de alta exigência tipográfica ou projetos de automação que demandam a geração algorítmica de diagramas, a edição puramente visual por arraste de elementos é frequentemente substituída por ferramentas baseadas em linguagens de programação e compilação de código vetorial.20

### **CircuiTikZ-Designer (Circuit2TikZ)**

O pacote CircuiTikZ para LaTeX constitui o padrão de fato para desenhos elétricos em publicações científicas de alto impacto, pois o compilador do documento renderiza o circuito de forma nativa e ajusta a tipografia das variáveis físicas perfeitamente ao texto adjacente.26 Para simplificar o processo de codificação — que pode ser demorado se realizado manualmente —, o projeto de código aberto *CircuiTikZ-Designer* (ou Circuit2TikZ), licenciado sob a licença MIT, fornece uma interface gráfica interativa baseada em tecnologias web que atua como um compilador em tempo real.24

O usuário constrói visualmente o circuito sobre uma grade de snapping interativa por meio de atalhos rápidos do teclado e a plataforma traduz instantaneamente o arranjo visual tanto em código compilável para LaTeX quanto em blocos de gráficos vetoriais SVG prontos para uso web ou edição vetorial genérica.24

### **Circuit\_macros (M4)**

O sistema *Circuit\_macros*, mantido sob a licença *LaTeX Project Public License* v1.3c, adota uma abordagem totalmente não-WYSIWYG baseada em macros para o desenho paramétrico de circuitos analógicos, digitais e diagramas lógicos complexos.20 O fluxo de compilação do sistema requer uma cadeia de ferramentas instalada no sistema operacional:

1. **Processador M4:** O pré-processador de macros GNU M4 lê o arquivo de texto de entrada e substitui as instruções elétricas abstratas por comandos de desenho geométrico de baixo nível na linguagem pic.20  
2. **Compilador Dpic:** O interpretador dpic lê o código pic resultante e o traduz para formatos de destino desejados.20 Ele suporta a geração direta de arquivos em formato TikZ/PGF para inclusão em LaTeX ou a exportação nativa direta para arquivos de imagem vetorial no formato SVG.20

Para tornar o desenvolvimento paramétrico com *Circuit\_macros* eficiente em sistemas desktop, desenvolvedores utilizam ferramentas como o aplicativo *Cirkuit*, que exibe uma visualização vetorial em tempo real do circuito à medida que o projetista insere os comandos de macro no editor de código, eliminando a barreira da compilação cega de diagramas elétricos estruturados.7

## ---

**Modelos de Inteligência Artificial para Geração Text-to-SVG**

A fusão de modelos computacionais de linguagem de larga escala (LLMs) com redes neurais de difusão gráfica possibilitou o surgimento de modelos de IA capazes de gerar diretamente gráficos vetoriais nativos a partir de descrições lógicas em texto, evitando as limitações e imperfeições físicas associadas à rasterização convencional de pixels.8

### **StarVector**

O StarVector representa um avanço expressivo ao introduzir um modelo fundacional de código aberto (disponível sob a licença Apache 2.0) capaz de unificar as tarefas de geração de SVG guiada por texto (*Text-to-SVG*) e conversão direta de imagens rasterizadas em vetores (*Image-to-SVG*).8 Desenvolvido em conjunto por instituições de pesquisa de ponta como a ServiceNow Research e o Mila, o StarVector rejeita a abordagem de vetorização tradicional baseada em processamento digital de imagem plano e processa o design elétrico diretamente como uma tarefa complexa de geração de código de programação estruturado.8

Estrutura Operacional e Fluxo de Codificação do StarVector:

Prompt de Entrada (Texto/Imagem) ──────►  
                                                   │  
                                                   ▼  
                                         \[Adaptador LLM de Projeção\]  
                                                   │  
                                                   ▼  
Código SVG Primitivo Final  ◄──────────  
(Formatos nativos limpos)

O modelo é estruturado por meio de um codificador visual base do tipo Vision Transformer (ViT) que processa as características espaciais em nível de pixel da imagem de entrada e projeta essas representações em um adaptador não-linear de baixa latência.29 O adaptador traduz as informações visuais na forma de tokens interpretáveis por um Modelo de Linguagem de Larga Escala (LLM) de ![][image1] ou ![][image2] de parâmetros, que opera em conjunto com o tokenizador e o incorporador de textos lógicos do usuário.8

A geração final do código SVG primitivo herda as propriedades de caminhos complexos descritas pela equação de curvas e coordenadas geométricas semânticas, ao invés de reduzir as linhas a matrizes de cores rasterizadas.29 O StarVector pode ser facilmente carregado de forma local em infraestruturas privadas que possuam placas de vídeo compatíveis com CUDA e suporte a cálculos de meia-precisão em ponto flutuante de dezesseis bits (torch.float16), ou implantado por servidores corporativos robustos de alta concorrência por meio da biblioteca vllm no comando de inicialização local:

Bash

vllm serve "starvector/starvector-8b-im2svg"

Abaixo está o exemplo mínimo em Python para executar a inferência de geração vetorial localmente por meio da suíte transformers da Hugging Face, exigindo a biblioteca complementar do StarVector instalada para acionar as funções avançadas de rasterização de imagens no pipeline de compilação do arquivo SVG final 8:

Python

import torch  
from PIL import Image  
from transformers import AutoModelForCausalLM, AutoTokenizer, AutoProcessor  
from starvector.data.util import process\_and\_rasterize\_svg

\# Configuração e inicialização do modelo fundacional StarVector de 8 bilhões de parâmetros  
model\_name \= "starvector/starvector-8b-im2svg"  
device \= "cuda" if torch.cuda.is\_available() else "cpu"

model \= AutoModelForCausalLM.from\_pretrained(  
    model\_name,   
    torch\_dtype=torch.float16,   
    trust\_remote\_code=True  
).to(device)

\# Carregamento do processador multimodal e execução do pipeline de geração  
processor \= AutoProcessor.from\_pretrained(model\_name, trust\_remote\_code=True)  
\#

### **SVGFusion e SVGDreamer**

O *SVGFusion* e o *SVGDreamer* (com seu refinamento recente *SVGDreamer++*) são dois ambientes experimentais de código aberto distribuídos sob a licença MIT que utilizam técnicas avançadas de otimização baseadas em modelos de difusão de imagens em larga escala para produzir representações vetoriais de altíssima fidelidade a partir de linguagem natural.30

* O **SVGFusion** adota a inovadora arquitetura do codificador automático variacional vetor-pixel (*Vector-Pixel Fusion VAE* ou VP-VAE) acoplado a um Transformador de Difusão de Espaço Vetorial (*Vector Space Diffusion Transformer* ou VS-DiT).30 O modelo extrai recursos de semântica textual usando codificadores CLIP e treina o transformador de difusão para reconstruir geometrias espaciais diretamente no espaço latente vetorial unificado, permitindo a geração de designs de layouts com conexões altamente consistentes.30  
* O **SVGDreamer** resolve o problema clássico de convergência lenta e rigidez de edição de imagens geradas por difusão convencional introduzindo o método de Amostragem de Difusão de Espaço Vetorial (VPSD) associado à técnica de Aprendizado por Feedback de Recompensa (ReFL).31 Essa abordagem otimiza as curvas e os pontos de ancoragem dos caminhos vetoriais em nível diferencial para garantir que o resultado final em SVG permaneça limpo, legível e de fácil modificação manual em editores gráficos convencionais.31

### **Chat2SVG**

O framework *Chat2SVG* aborda a geração de imagens vetoriais por meio de um pipeline modular de múltiplos estágios que interliga inteligência artificial generativa de linguagem e modelos diferenciáveis de refinamento geométrico.11 O pipeline de execução requer um ambiente Python 3.10 estruturado com suporte a aceleração gráfica por GPU PyTorch e opera de acordo com as seguintes etapas coordenadas 11:

1. **Template Generation:** A etapa inicial consome uma chave de API do Anthropic Claude ou OpenAI GPT configurada em um arquivo local .env no parâmetro OPENAI\_API\_KEY para interpretar as descrições textuais do usuário e produzir múltiplos esboços em código de templates SVG estruturados.11  
2. **Detail Enhancement:** Os templates vetoriais iniciais passam por uma rotina de higienização de caminhos via biblioteca picosvg, que mapeia as primitivas para curvas estáveis de Bézier cúbicas.11 Paralelamente, o pipeline utiliza modelos de difusão estável em larga escala (Stable Diffusion XL \- SDXL) e adaptadores ControlNet para gerar imagens rasterizadas realistas e aciona o modelo de segmentação de objetos *Segment Anything Model* (SAM) do Facebook AI para detectar novos componentes geométricos e injetá-los de volta na representação vetorial do template.11  
3. **SVG Shape Optimization:** O arquivo SVG resultante é submetido a uma otimização por meio do renderizador diferenciável diffvg — que exige dependências estruturais do sistema operacional como compiladores C++ (cmake), bibliotecas multimídia (ffmpeg) e utilitários de tratamento de vetores como svgwrite, svgpathtools e cssutils — para realizar o ajuste espacial de coordenadas de pontos e o balanceamento estético de cores.11

## ---

**Modelos e Frameworks de Reconhecimento de Esboços (Sketch-to-Diagram/Netlist)**

A automação do desenho elétrico visa simplificar a conversão de esboços desenhados de forma informal pelo engenheiro em diagramas lógicos formais e compiláveis, além de converter imagens de circuitos em listas lógicas de nós elétricos (*netlists*) operacionais para simulação em motores SPICE.12

### **SkeTikZ e o Modelo IMGTikZ**

O projeto *SkeTikZ* representa um esforço para sanar a escassez de dados de treinamento estruturados que impediam o avanço de ferramentas de tradução inteligente no domínio dos desenhos técnicos e matemáticos.10 O conjunto de dados consiste em uma base aberta de 1.84 GB compactada no formato Parquet, dividida em ![][image3] amostras de treinamento, 323 amostras de validação e 323 amostras de teste.10 Cada uma das ![][image4] entradas do dataset contém o pareamento estruturado de imagens rasterizadas de desenhos manuais criados sob diferentes ferramentas de esboço (papel, quadro branco físico e tablet digitalizador) associados de forma estrita a códigos de renderização compiláveis em LaTeX TikZ.10

Junto ao dataset, foi apresentado o **IMGTikZ**, que acopla um codificador visual de processamento de imagens a um LLM especialista em código de ![][image5] de parâmetros.10 O treinamento é implementado em duas etapas sequenciais: a primeira etapa atualiza exclusivamente os pesos geométricos do adaptador de alinhamento visual, enquanto a segunda etapa executa o ajuste fino conjunto do adaptador e dos blocos do modelo de linguagem por meio de técnicas de baixa classificação adaptativa (LoRA).34 Para contornar as ambiguidades estéticas de linhas desenhadas à mão, a técnica de Inferência de Geração Multi-Candidato (IMGTikZ-MCG) gera dezenas de possíveis códigos compiláveis e aciona compiladores em lote para validar e selecionar o candidato com o maior grau de coerência sintática e ausência de erros de renderização.10

### **SketchAgent (Vinker et al.)**

Esta variante do *SketchAgent* é baseada em um pipeline em Flask, projetada para permitir que o usuário interaja de forma conversacional e colabore em tempo real com um LLM multimodal no processo sequencial de desenho à mão livre e edição estruturada de traços.35 A instalação local exige dependências e o isolamento de pacotes por meio de gerenciadores de ambientes Conda:

Bash

\# Clone e configuração do ambiente operacional do SketchAgent  
git clone https://github.com/yael-vinker/SketchAgent.git  
cd SketchAgent  
conda env create \-f environment.yml  
conda activate sketch\_agent

\# Procedimento corretivo no caso de conflitos de renderização vetorial no CairoSVG  
conda uninstall cairosvg && conda install cairosvg

Uma vez configurada a variável de ambiente para a chave de API da Anthropic no arquivo .env local (ANTHROPIC\_API\_KEY=\<sua\_chave\>), o usuário pode inicializar a aplicação web interativa executando python collab\_sketch.py ou ativar o console de edição de traços via chat com o comando python chat\_and\_edit.py, acessando a interface a partir de qualquer navegador web convencional apontado para o endereço local de porta aberta 36:

![][image6]  
O sistema permite configurar as execuções de geração entre o modo determinístico (para fins de reproducibilidade de desenhos lógicos e esquemáticos elétricos padronizados) e o modo estocástico (para expandir a variação e flexibilidade dos traços de representação gráfica).36

### **SketchAgent (Sistema Multiagente de Diagramação)**

Este framework constitui uma proposta baseada no uso coordenado de múltiplos agentes inteligentes que operam de forma concorrente para automatizar a tradução e o refinamento iterativo de diagramas e desenhos técnicos à mão livre.12 O pipeline funciona por meio de um loop fechado composto por três módulos funcionais distintos de tomada de decisão:

1. **Sketch-to-Code Agent:** O agente de entrada recebe a digitalização do rascunho em papel e as instruções de suporte fornecidas pelo engenheiro e produz uma representação inicial de código para descrever as coordenadas espaciais do diagrama.12  
2. **Editing Code Agent:** Monitora as instruções adicionais inseridas dinamicamente pelo usuário (como comandos para substituir traçados simples por representações de linhas pontilhadas ou aplicar preenchimentos de cores específicas) e atualiza o arquivo de código de forma contínua.12  
3. **Check Agent:** Atua como um validador de integridade técnica em tempo de execução, compilando o código do diagrama de forma silenciosa para identificar se existem nós flutuantes sem conexão, elementos fora da grade ou erros de sintaxe estrutural.12 Se inconsistências forem encontradas, o agente de verificação injeta mensagens de erro detalhadas no contexto do loop de agentes de codificação, repetindo o refinamento automático até gerar uma imagem vetorial válida e sem erros lógicos de projeto.12

### ---

**Especificações Técnicas e Arquiteturas de Modelos de IA (Geração e Reconhecimento)**

A aplicação de algoritmos inteligentes para lidar com desenhos elétricos requer arquiteturas especializadas que unam a entrada visual (imagens de baixa qualidade ou rascunhos) com a geração precisa de código matemático ou de marcação de dados. A tabela abaixo resume as tecnologias de IA voltadas para a síntese e a interpretação de dados elétricos e esquemáticos.

| Modelo ou Framework | Licença de Distribuição | Modos de Entrada | Formatos de Saída Suportados | Núcleo da Arquitetura e Pipeline de IA |
| :---- | :---- | :---- | :---- | :---- |
| **StarVector** 8 | Apache 2.0 8 | Imagem rasterizada ou comandos textuais 8 | Código de marcação SVG nativo puro 29 | Modelo de Visão-Linguagem (VLM) unificado; conecta um codificador visual do tipo Vision Transformer (ViT) a um LLM autoregressivo de ![][image1] ou ![][image2] de parâmetros.29 |
| **IMGTikZ** (SkeTikZ) 10 | Não especificada (Artigo científico sob CC BY 4.0) 10 | Imagem digitalizada de rascunhos manuais 10 | Código LaTeX TikZ funcional e compilável 10 | LLM de ![][image5] de parâmetros focado em geração de código integrado a um codificador de visão; utiliza ajuste fino LoRA e estratégia multi-candidato (MCG).34 |
| **SketchAgent (Vinker)** 36 | MIT 36 | Instruções em linguagem natural 35 | Gráficos vetoriais SVG e animações sequenciais 36 | Loop baseado em LLMs de prateleira (como Claude) programados via prompts de sistema estruturados; integrado a uma aplicação local em Flask.36 |
| **SketchAgent (Multiagente)** 12 | Não especificada (Pesquisa sob dados abertos) 12 | Desenho manual associado a comandos técnicos 12 | Diagramas, fluxogramas e códigos de marcação estruturados 12 | Pipeline composta por três agentes neurais especializados (*Sketch-to-Code*, *Editing* e *Check*) rodando em loop fechado de validação sintática.12 |
| **PhotoCircuit** 39 | GNU GPL v3.0 39 | Fotografia de rascunhos analógicos em papel 39 | Código compilável LaTeX CircuiTikZ 39 | Aplicativo Android nativo em Java que implementa algoritmos de visão computacional clássica e redes para segmentação de símbolos elétricos.39 |

## ---

**Modelos Especialistas de Extração de Netlists e Engenharia Reversa de Circuitos**

O desenvolvimento de engenharia reversa e a tradução funcional de circuitos residem na extração automática de dados de esquemáticos visuais para a geração de arquivos lógicos de simulação (como arquivos .cir para ngspice ou formatos de netlists compatíveis com SPICE).33

### **Img2Sim-V2 e Image2Net**

O *Img2Sim-V2* é um aplicativo móvel assistido por redes neurais artificiais projetado para capturar e ler diagramas de circuitos elétricos computadorizados ou desenhados à mão, gerando de forma automática os arquivos de parametrização lógica de componentes e conectores.33 De forma semelhante, o framework *Image2Net* lida com o problema da extração semântica em topologias elétricas mistas e circuitos analógicos complexos por meio de redes de segmentação e tratamento de arestas.33

O pipeline dessas ferramentas geralmente funciona associado a módulos como o *Netlistify*, que detecta a localização espacial e a orientação angular de símbolos eletrônicos (como resistores, transistores e fontes de energia), mapeando os caminhos físicos condutores para estruturar a lista final de conexões de rede.33

### **pipelines Baseados em YOLO, OpenCV e Gemini (Vibe Reasoning)**

A pesquisa recente para a resolução autônoma de problemas complexos de engenharia elétrica combinou redes de detecção de objetos em tempo real com modelos multimodais avançados para mitigar as falhas geométricas que VLMs puros apresentam ao analisar circuitos.40

Em esquemáticos de análise de malhas e nós, pequenos detalhes visuais — como o sinal de mais ou menos indicando a polaridade de uma fonte de tensão ou a direção da seta de uma fonte de corrente — são cruciais para a consistência física do modelo matemático.40 Sistemas híbridos de alto desempenho utilizam o detector de objetos YOLO (*You Only Look Once*) treinado especificamente para a identificação de componentes elétricos e aplicam rotinas de processamento de imagem por OpenCV para isolar e extrair recortes (*crops*) em alta resolução apenas dos nós de fontes elétricas.40

Essas seções ampliadas das imagens de componentes isolados são enviadas em pipelines de verificação para o modelo de linguagem multimodal Gemini, que reidentifica com precisão quase perfeita as direções de corrente e polaridades elétricas.40 Com a certeza geométrica restabelecida pelas redes YOLO e OpenCV, o modelo de inteligência artificial escreve sem erros os scripts de simulação e os arquivos de conexão de circuitos que orientam a análise de fluxo de carga e equações de Kirchhoff.40

## ---

**O Desafio da Interoperabilidade de Bibliotecas e Conectividade Elétrica**

A transição de arquivos geométricos genéricos (como arquivos SVG manipuláveis criados no Inkscape ou saídas geradas por IA) para softwares de EDA estruturados que exigem regras estritas de conexão física constitui um dos maiores gargalos conceituais no desenvolvimento de CADs abertos.23 O debate na comunidade do projeto eletrônico livre *LibrePCB* ilustra bem essa limitação técnica.26

Ao avaliar propostas de ferramentas que exportem automaticamente layouts visuais para formatos de marcação de documentos como o CircuiTikZ (usado por pesquisadores acadêmicos e engenheiros para publicar designs em periódicos científicos de alto impacto), a equipe de desenvolvimento do LibrePCB identificou dois problemas complexos de design de sistemas:

1. **Mapeamento de Biblioteca de Símbolos:** Cada componente específico definido em uma biblioteca comercial ou em um arquivo SVG nativo precisaria possuir uma associação direta com o seu correspondente macro na linguagem de programação de destino (CircuiTikZ).26 Se essa tradução for definida elemento por elemento, a manutenção de repositórios de símbolos gigantescos torna-se um fardo de desenvolvimento insustentável para times de código aberto.26 Por outro lado, se a biblioteca de componentes novos criados pelo usuário não possuir essa definição prévia, a geração de código quebra ou falha em representar a peça de forma correta.26  
2. **Incompatibilidade Dimensional de Redes:** Componentes físicos e símbolos de CAD tradicionais são dimensionados com base em padrões estritos de montagem mecânica de placas (por exemplo, espaçamentos padronizados de conectores de grade no padrão americano de 5,08 mm).26 No entanto, compiladores visuais baseados em código como o CircuiTikZ desenham componentes de forma puramente matemática e abstrata, onde o comprimento das linhas de conexão de capacitores e fontes pode possuir dimensões arbitrárias ou até o dobro do tamanho físico real.26 Ao converter um arquivo elétrico vetorial exato para código do CircuiTikZ, o deslocamento físico das peças em milímetros quebra a alometria e os eixos geométricos do desenho original, resultando em sobreposição de textos, linhas de condutores cruzadas de forma incorreta e desorganização estética total.26

Por essa razão, pesquisadores de design e arquitetura de software sugerem que, mesmo com conversores automáticos de código, a intervenção manual do projetista ainda é necessária para ajustar escalas de fontes e eixos condutores em editores gráficos para alinhar a consistência do circuito antes da exportação final do vetor SVG.2

## ---

**Conclusões e Recomendações Técnicas para Projetos de Engenharia**

O ecossistema de ferramentas, plataformas e modelos de código aberto focados no processamento e na edição de gráficos vetoriais (SVG) aplicados a desenhos elétricos e esquemáticos oferece caminhos especializados dependendo do objetivo e do perfil técnico do usuário:

* **Para Engenharia Elétrica Industrial e Documentação de Projetos:** Recomenda-se o uso integrado do **QElectroTech (QET)**.9 Graças ao licenciamento GNU GPL e à robusta base de símbolos (superior a ![][image7] modelos em conformidade com as normas IEC e simbologias elétricas), o software atua como a solução de CAD de desktop livre mais consistente para desenhar diagramas unifilares e multifilares de painéis elétricos, sistemas hidráulicos e controle industrial, fornecendo exportações limpas de fólios completos em formato SVG nativo estruturado em XML.9  
* **Para Design Funcional de Circuitos Eletrônicos e PCBs:** O fluxo operacional primário deve ter como base a suíte **KiCad**.16 O usuário deve projetar e validar o circuito por meio do editor Eeschema para garantir a integridade das conexões elétricas via teste de ERC, acionar simuladores analógicos SPICE e, por fim, utilizar a ferramenta de plotagem vetorial integrada para exportar o projeto como arquivo SVG estruturado e de alta fidelidade geométrica para fins de pós-produção gráfica.7  
* **Para Pós-Produção Gráfica e Manipulação de Vetores Livres:** O **Inkscape** consolida-se como o editor visual padrão devido à sua natureza nativa em SVG.2 Para ganho de produtividade no desenho direto de circuitos elétricos, recomenda-se a instalação da extensão paramétrica **inkscapeCircuitSymbols** (que automatiza a criação de componentes e marcadores de setas elétricas com suporte a LaTeX) ou a importação do repositório de símbolos padronizados **Inkscape\_electric\_Symbols (upb-lea)** alinhados estritamente à grade de pixels fixa do aplicativo.2  
* **Para Publicações Acadêmicas de Alta Qualidade Tipográfica:** O uso do compilador **CircuiTikZ** em LaTeX é recomendado devido ao alinhamento perfeito de linhas e fontes com o corpo de texto de artigos científicos.26 Para acelerar a modelagem de circuitos sem a necessidade de codificação manual cega de eixos tridimensionais, sugere-se a interface web **CircuiTikZ-Designer**, permitindo arrastar elementos com snapping dinâmico e exportar os blocos de código resultantes e arquivos SVG instantâneos.24  
* **Para Geração de Vetores por IA e Reconhecimento de Esboços:** Pipelines modernas integradas ao modelo fundacional multimodal **StarVector** (de ![][image1] ou ![][image2] de parâmetros sob licença Apache 2.0) oferecem caminhos promissores ao processar prompts de linguagem natural ou imagens de rascunhos para escrever diretamente códigos de marcação SVG limpos e editáveis.8 Em tarefas complexas de digitalização e reconhecimento automático de diagramas elétricos desenhados à mão, a associação do modelo de código aberto **IMGTikZ** (suportado pelo dataset anotado **SkeTikZ**) com sistemas de loops de múltiplos agentes dotados de verificação e compilação em tempo de execução (**SketchAgent**) garante a síntese de esquemas elétricos perfeitamente válidos e geometricamente consistentes.10

#### **Referências citadas**

1. AI Vector Creator: Generate vector images with AI \- Canva, acessado em maio 18, 2026, [https://www.canva.com/create/vector-ai/](https://www.canva.com/create/vector-ai/)  
2. upb-lea/Inkscape\_electric\_Symbols: Electrical symbol ... \- GitHub, acessado em maio 18, 2026, [https://github.com/upb-lea/Inkscape\_electric\_Symbols](https://github.com/upb-lea/Inkscape_electric_Symbols)  
3. yEd \- Graph Editor \- yWorks, acessado em maio 18, 2026, [https://www.yworks.com/products/yed](https://www.yworks.com/products/yed)  
4. Free Online Wiring Diagram Software \- Edraw.AI, acessado em maio 18, 2026, [https://www.edraw.ai/feature/online-wiring-diagram-maker.html](https://www.edraw.ai/feature/online-wiring-diagram-maker.html)  
5. Scheme It | Free Online Schematic and Diagramming Tool | DigiKey, acessado em maio 18, 2026, [https://www.digikey.com/en/schemeit/project](https://www.digikey.com/en/schemeit/project)  
6. Free AI Diagram Generator \- EdrawMax, acessado em maio 18, 2026, [https://www.edrawmax.com/app/ai-diagram/](https://www.edrawmax.com/app/ai-diagram/)  
7. A good tool to make electronic schematics and export them vectorially? \- TeX, acessado em maio 18, 2026, [https://tex.stackexchange.com/questions/4841/a-good-tool-to-make-electronic-schematics-and-export-them-vectorially](https://tex.stackexchange.com/questions/4841/a-good-tool-to-make-electronic-schematics-and-export-them-vectorially)  
8. starvector/starvector-8b-im2svg \- Hugging Face, acessado em maio 18, 2026, [https://huggingface.co/starvector/starvector-8b-im2svg](https://huggingface.co/starvector/starvector-8b-im2svg)  
9. QElectroTech: Welcome, presentation, acessado em maio 18, 2026, [https://qelectrotech.org/](https://qelectrotech.org/)  
10. SkeTikZ: Home, acessado em maio 18, 2026, [https://sketikz.github.io/](https://sketikz.github.io/)  
11. kingnobro/Chat2SVG: (CVPR 2025\) Code of "Chat2SVG ... \- GitHub, acessado em maio 18, 2026, [https://github.com/kingnobro/chat2svg](https://github.com/kingnobro/chat2svg)  
12. SketchAgent: Generating Structured Diagrams from Hand-Drawn Sketches \- arXiv, acessado em maio 18, 2026, [https://arxiv.org/html/2508.01237v1](https://arxiv.org/html/2508.01237v1)  
13. QElectro Tech Software: Free Electrical Diagram Tool – Full Overview & Guide, acessado em maio 18, 2026, [https://www.insightcontrolsystem.in/2025/07/qelectro-tech-software-free-electrical.html?m=1](https://www.insightcontrolsystem.in/2025/07/qelectro-tech-software-free-electrical.html?m=1)  
14. QElectroTech \- design electric diagrams \- free Qt based software \- LinuxLinks, acessado em maio 18, 2026, [https://www.linuxlinks.com/qelectrotech-design-electric-diagrams-free-qt-based-software/](https://www.linuxlinks.com/qelectrotech-design-electric-diagrams-free-qt-based-software/)  
15. en:doc:faq \- QElectroTech, acessado em maio 18, 2026, [https://qelectrotech.org/wiki\_new/en/doc/faq](https://qelectrotech.org/wiki_new/en/doc/faq)  
16. PCB Editor | 9.0 | English | Documentation \- KiCad Docs, acessado em maio 18, 2026, [https://docs.kicad.org/9.0/en/pcbnew/pcbnew.html](https://docs.kicad.org/9.0/en/pcbnew/pcbnew.html)  
17. Schematic Editor | 9.0 | English | Documentation \- KiCad Docs, acessado em maio 18, 2026, [https://docs.kicad.org/9.0/en/eeschema/eeschema.html](https://docs.kicad.org/9.0/en/eeschema/eeschema.html)  
18. Schematic Editor | 8.0 | English | Documentation \- KiCad Docs, acessado em maio 18, 2026, [https://docs.kicad.org/8.0/en/eeschema/eeschema.html](https://docs.kicad.org/8.0/en/eeschema/eeschema.html)  
19. Save schematic from KiCad / EESchema to png \- Electrical Engineering Stack Exchange, acessado em maio 18, 2026, [https://electronics.stackexchange.com/questions/30332/save-schematic-from-kicad-eeschema-to-png](https://electronics.stackexchange.com/questions/30332/save-schematic-from-kicad-eeschema-to-png)  
20. Directory graphics/circuit\_macros \- Comprehensive TeX Archive Network, acessado em maio 18, 2026, [https://ctan.org/tex-archive/graphics/circuit\_macros](https://ctan.org/tex-archive/graphics/circuit_macros)  
21. fsmMLK/inkscapeCircuitSymbols: Inkscape extension to ... \- GitHub, acessado em maio 18, 2026, [https://github.com/fsmMLK/inkscapeCircuitSymbols](https://github.com/fsmMLK/inkscapeCircuitSymbols)  
22. File:Electrical symbols library.svg \- Wikimedia Commons, acessado em maio 18, 2026, [https://commons.wikimedia.org/wiki/File:Electrical\_symbols\_library.svg](https://commons.wikimedia.org/wiki/File:Electrical_symbols_library.svg)  
23. SpecElectronicsCAD \- Inkscape Wiki, acessado em maio 18, 2026, [https://wiki.inkscape.org/wiki/SpecElectronicsCAD](https://wiki.inkscape.org/wiki/SpecElectronicsCAD)  
24. CircuiTikZ Designer \- Circuit2TikZ \- Friedrich-Alexander-Universität Erlangen-Nürnberg, acessado em maio 18, 2026, [https://www.circuit2tikz.tf.fau.de/designer/](https://www.circuit2tikz.tf.fau.de/designer/)  
25. Circuit2TikZ/CircuiTikZ-Designer: A GUI for drawing CircuiTikZ circuits \- GitHub, acessado em maio 18, 2026, [https://github.com/Circuit2TikZ/CircuiTikZ-Designer](https://github.com/Circuit2TikZ/CircuiTikZ-Designer)  
26. Enhancement Proposal: Export to CircuiTikZ (.tex) for IEEE Publication-Quality Schematics, acessado em maio 18, 2026, [https://librepcb.discourse.group/t/enhancement-proposal-export-to-circuitikz-tex-for-ieee-publication-quality-schematics/976](https://librepcb.discourse.group/t/enhancement-proposal-export-to-circuitikz-tex-for-ieee-publication-quality-schematics/976)  
27. File:Circuitikz example.svg \- Wikimedia Commons, acessado em maio 18, 2026, [https://commons.wikimedia.org/wiki/File:Circuitikz\_example.svg](https://commons.wikimedia.org/wiki/File:Circuitikz_example.svg)  
28. Circuit\_macros – M4 macros for electric circuit diagrams \- Comprehensive TeX Archive Network, acessado em maio 18, 2026, [https://ctan.org/pkg/circuit-macros](https://ctan.org/pkg/circuit-macros)  
29. StarVector, acessado em maio 18, 2026, [https://starvector.github.io/](https://starvector.github.io/)  
30. SVGFusion: Scalable Text-to-SVG Generation via Vector Space Diffusion \- GitHub, acessado em maio 18, 2026, [https://github.com/ximinng/SVGFusion](https://github.com/ximinng/SVGFusion)  
31. SVGDreamer: Text Guided SVG Generation with Diffusion Model \- GitHub, acessado em maio 18, 2026, [https://github.com/ximinng/SVGDreamer](https://github.com/ximinng/SVGDreamer)  
32. Daily Papers \- Hugging Face, acessado em maio 18, 2026, [https://huggingface.co/papers?q=typographic%20circuit](https://huggingface.co/papers?q=typographic+circuit)  
33. Img2Sim-V2: A CAD Tool for User-Independent Simulation of Circuits in Image Format, acessado em maio 18, 2026, [https://www.semanticscholar.org/paper/Img2Sim-V2%3A-A-CAD-Tool-for-User-Independent-of-in-Gurbuz-Balta/6e17f5a094a3b23c26bf97454cbe9334168d978e](https://www.semanticscholar.org/paper/Img2Sim-V2%3A-A-CAD-Tool-for-User-Independent-of-in-Gurbuz-Balta/6e17f5a094a3b23c26bf97454cbe9334168d978e)  
34. Sketch2Diagram: Generating Vector Diagrams from Hand-Drawn Sketches | OpenReview, acessado em maio 18, 2026, [https://openreview.net/forum?id=KvaDHPhhir](https://openreview.net/forum?id=KvaDHPhhir)  
35. SketchAgent: Language-Driven Sequential Sketch Generation \- GitHub Pages, acessado em maio 18, 2026, [https://yael-vinker.github.io/sketch-agent/static/source/paper.pdf](https://yael-vinker.github.io/sketch-agent/static/source/paper.pdf)  
36. yael-vinker/SketchAgent \- GitHub, acessado em maio 18, 2026, [https://github.com/yael-vinker/SketchAgent](https://github.com/yael-vinker/SketchAgent)  
37. SketchAgent: Generating Structured Diagrams from Hand-Drawn Sketches \- IJCAI, acessado em maio 18, 2026, [https://www.ijcai.org/proceedings/2025/0214.pdf](https://www.ijcai.org/proceedings/2025/0214.pdf)  
38. Yael Vinker \- GitHub Pages, acessado em maio 18, 2026, [https://yael-vinker.github.io/website/](https://yael-vinker.github.io/website/)  
39. MAC-Projects \- GitHub, acessado em maio 18, 2026, [https://github.com/MAC-Projects](https://github.com/MAC-Projects)  
40. Enhancing Large Language Models for End-to-End Circuit Analysis Problem Solving \- arXiv, acessado em maio 18, 2026, [https://arxiv.org/html/2512.10159v1](https://arxiv.org/html/2512.10159v1)  
41. Daily Papers \- Hugging Face, acessado em maio 18, 2026, [https://huggingface.co/papers?q=Gemini%203%20Pro](https://huggingface.co/papers?q=Gemini+3+Pro)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAYAAADgKtSgAAABBUlEQVR4Xu2TsQ4BQRRFn6AQOpWgU0lUWpL9ASod0Wj1Oh+CREtUesV2EpVSiVYhEiSIcJ9HzAySZRvFnuQU8+7MzWZ3lsjjH/DBFPQrszDswaXiCLYUazD6OGDCpWk4hHMYU7IAtGAJXuAMVu5rtgl38AircuRJBp7hnuTwgvRyFc5tGDHmeXgg6XlLluQJfinnNc85N7MbbsrjJK+T87f8Wh6CnXs2UOYaTstXsEtyS/pwDaewQPot03BaPia5rryH5Y85gRtYf27VcVpu0+s7Z4okuWXMb7gtf5xvmAHjtjwHT7BsBoyb8iDJR+Y8qQZcxENTm6RE/UE+uYVtmCAPj6+5AuVOXLTBT9HkAAAAAElFTkSuQmCC>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAYAAADgKtSgAAABeklEQVR4Xu3UvytGYRQH8CMMoggpod6BTRabqDtIGZhsZGCVxSCL/AkY/cjqx2g1vGUgk0VkQhYZRMiP/Ph+O/e59zyP9yqT5X7rM9xz7j33vfd57iuS579TB73QAZWmXg2bcGXswYoxCQ3ugjDbcA7rUIQHKIt7FRDBCHzBGYzFxzQPT/AG43pJGv7KOSg3tR7RAWE4vAg1Qb0PXuEjqMsQdIZFKT0kaziPWWff6w3CKXSZWhUsSvpqXLKGt8CFaN9LU1ykZaiHBWg257iUGs4fshb3dkw9CXeAu8En7PrtJOzfwoboLtmCOzgWfb123ZJMwLOkNyBuwTCsH0C76JMRF/MI7mEqPVUzAwVzzKF8PVz5yNSZUq/FZVi0H7lCI5y4AxMuJE+cDeq/De8W3e/JNXysy6Tt51r+Npxf9zuMukItHMrPLcdweH9QyxrOD5GLzH6bbXCFX2AfpmEJbkRvzNgPJMsjrEKrXuKHgwZEH4n/FwWvmyfPN4SxYFfqU8W1AAAAAElFTkSuQmCC>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAWCAYAAAC7ZX7KAAACdklEQVR4Xu2VzauNURSHl1Dka2CAUteQKEmIoSh3cAdIV5kohYEMKPIHGJCbkoEwMRTdidQNg1OE7sREKTEgBtRNFPnIx+85a+9z1rvv6+AoA72/ejrttddZe71r77W3WaNG/4+miPligxgo5npplphbGq3eNlUsFivLiUKzxQoxo5yIui9eixfiqzhjnsyvNCS+i8vivLgknoj10UkaFm/EA3OfUbGw4uHrse4783gT4oSYGZ0QTlvNq5xFcBLZE2x1ImESJNmTYp15JaOWmxeC6mbtM4+/P435wE/ieMfDRW7YO+KrbolnYlGw3zYPeFVMC/ZSJNwqjYUOmcebE2x5Z66bbz2JMd4VfFD+sI6o6oi4YX52slrmjnxMr6PxOwlzBFpWjb9JfLNu5ZlnPeJF5Q/rlUNbBONYrConChHwvdhp3qwHxRcxPfjUVXibeSKsQ/LscK+E4+5PErcFjbe9nKjRGjEexuwYjXI42OrO8FnzRHKSfSdMZWigHVZtwj8RizwSC4KNqh+xbsx7ycburLY+E6a7j5lfb38jqv4h/WZxrb0yj/1cbEk+E2KZ9ZHwbvPGi3cjzjTMz5SDQdSg+V0aH4jNVr1Pj5r/70AaX0xjboUozn8Zv60xsdT8SzIXzAMjuvS0uGnds0hCL8WpNM5iUeLlBDkaZTI8VBybHIuK04B19zD2inLH1pG3iKpl20iycd7PmR+jrAHxWKwNNhL+bH4bII7eR/N1s7jy2OGnYkmy8cv4Whq3hWPLJicKuSEQFb8j3ppvb9Y8ccW6zzLzvHxRNBpnlXn8HoqNFQ8X1b5r/v+96Zd3oHzCGzVq9K/0AycHoDTyc0oyAAAAAElFTkSuQmCC>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAWCAYAAAC7ZX7KAAACQUlEQVR4Xu2VTYiOURTH/2KKyAj5qJEUykoRNkyTKJNspFhQNjY2StlYkRQLkRQlUxaSbGymSTZvzSyEjfKxsSHNJCELFuTj/+/cY8693ud535mN0vOvX+/7nHM/zj333HuBRo3+Ly0gyxNT1RqygSwiMwqfaza6H38FmV8ao1rkBblBRsltsjA2qFAPOUHekI/kF3mVtTCdJxPkDrlLXpJNWYtJLSXfyJ7S4RqETXQg2PT9k+wItlLryDsyFGzK7hXyFJZtSQFoPCVhVrK9TrbL6XsmWQLb5XnJVxnwAKYXsC9URO0l38nW9K3AOwUc1TFgZWV9+nWpg7ZN2amSMqxt/lHYNZH6a0GufjInfH+BJWRXsLk6BixpME1wFrb67ag+PHXSZC1yFZPZdG0hR2FnRHUfFxA1pYBVFtfJOTI3a9GdDsIm6y0dsID3kZNkmKzN3X/UVcCl1OEx6SsdNdpMPpH7paONxmFlsbt0YJoBv4V1uoTuSmM1rOavoXqro27Bxn8Gux2iagPW1j1Efg1JqjN1ek4WB3s7LSOHkS/sHtmY/p+CHcwBd8LKQuO3u4lqA1YwCqoMzDPsV5Hq+SJ5gLxMtGDVo79gzpP0K+nqKgPzDGueVcEu1QasrJyBPatR6qArS1eXFO/cC8mmYEeCPdKCTSxtI8eQ78B7WLsjweZaCfMdgr2kf0k19xW2jcdhT+cj5KdY2Rojn8nOZPP7th03UxtJgX6AHeLTsGda4+xPPsmvw3Icp1GjRv9CvwGIXI9a8WydggAAAABJRU5ErkJggg==>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAUCAYAAADoZO9yAAAB4UlEQVR4Xu2VMUgcQRSGf1EhioKaIAgGFatoJWkiBEu10UICCtqJmEJIYaGIjWVSpkqhSAoLURBBO8EDC8Gk1NJCEQRBuzQRjf+7NzvOvdvZE5Mq3A/f3u57c7P/zLyZBcr6j9VAXthgoDfkQwadpNK3duoiu+SOrJGmwnSRqsgmOSZfUPwSMfGRnJMb8odcueeEJOY1Q36RKVINNbQMfVlM9eQA2lkak49N8Rbav/yG6nfxvJrJD9Lo0zorW8iedul0ndSYeDf5aWIxI6K55GYMOvpQtUhZO6Mh8tXE6qCzOWriWUYW5FJBVqGuZEn6oC94rmbJN2hfoWJGXpIjuZHlkGX5RHJkETrKzyjurJR6yCF5bROIG9mG1hNayBm0+sPCvHB0BLFSuibvbdApZuQddPd4I75gnE6hTkdMPCYZhBhvtQmnmBHRoFxekRMyXpjLL5MYsQZjkpnLQYs1TVlGxEN+e0qV/62RYWg/se2eZcSb70XxNkyrkX2owbTp/+6IKcvIRHIju0Nqot2ngHvo8RwqOTHt9pYR5ZBuRHJSh/KfWzLgnhPmyW/fmtojl2SFbEC3sd2+8k0R2kw8WV57KIpkae3RHyImdnxr6Ckq07ZEpsPEEyVf0XzRlfUv9ABPunEdTPmY8QAAAABJRU5ErkJggg==>

[image6]: <data:image/png;base64,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>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAWCAYAAAC7ZX7KAAACSklEQVR4Xu2VTahNURTHl1BEicRTSGaiJCEv9SKKAROKYowMTWTGwECSehm9R3ojKZlICYObZGJgQsrHwIQiiYGifPx/1t73rr3fuU8mbun869e5e+2191lr37XXMWvV6v/SXLEm8bdaIjaLRWJaNZc1UywXw/VEpRzHrHoi6px4IybENXFVLCg8+mtEPBZj6fm0nP6t/eKD6IjL4r5YEebRHDEqPpvHgP9ZMTs6ofU2+VS3iI/p2U8zzBN7W9lXJTvzaJ54JOZ3Pcy2ix/iVBrz73wVZ7JDEglgL7RbbK1sJEGmuyp7FIFxCgQTtdA8iZVpTHDXrZcAimtJhMB+ioPBBx1J9kKc4nuxw3r1d0g8F8uyU4NIlM06lZ0axJ6TPWFealHU/GvzQ1lrvgdr2DMqv4NyKUSmTGQ44T+JQKYKmHlEsP0CzkHG31E5YPwL7RTvzOsKh2fmf9tUGljAtJuX5gEuFTeSE5duXfCrNbCAj4pNYTxdfDJ3jLe91kACzgubxEvoqdz6JnFZuDR1311s3gFySXH5bln5IYhr2f+SeWB0hajjyd4Vp9Gxyc2ZU6UV5RPmll4Qd83LBrHmtjX3Yex5TxLo14cvmncm7hDjpj6MvdBecdK8FLL4MhHIxjTmlMgUzmcnaY/4br12yJO9aJFR+LBn1hXzVro6jTm4O+KV9b6APBnfTOOueMk38UScTrwQG4IPpfPAvLZjMKw9JsbFvvT8kuxRfGKxc4IHzDvStsLD/7mH5g3gcHreE0PRqVWrVv9QvwBRL6Jm3NvLpAAAAABJRU5ErkJggg==>
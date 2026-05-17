# **Simbologia Técnica e Normatização em Sistemas Fotovoltaicos: Guia Exaustivo de Representação Gráfica e Engenharia**

A documentação técnica de sistemas fotovoltaicos (FV) constitui o alicerce para a segurança, a conformidade regulatória e a eficiência operacional na engenharia moderna de energias renováveis.1 A transição global para matrizes energéticas descarbonizadas impôs a necessidade de um vocabulário visual rigoroso, capaz de sintetizar a complexidade de fenômenos físicos de conversão de energia em representações gráficas inteligíveis por profissionais em qualquer parte do mundo.2 No centro desta infraestrutura documental estão os diagramas de blocos e esquemas unifilares, cujos símbolos técnicos convencionais não são meras representações artísticas, mas sim constructos normatizados por órgãos como a Associação Brasileira de Normas Técnicas (ABNT), a International Electrotechnical Commission (IEC) e o Institute of Electrical and Electronics Engineers (IEEE).4

A precisão na identificação de módulos, inversores, controladores de carga e baterias é o que diferencia um projeto robusto de uma instalação vulnerável a erros de interpretação.3 No contexto brasileiro, a recente publicação e atualização de normas como a ABNT NBR 16690 e a ABNT NBR 10899 reforçam o compromisso do setor com a padronização internacional, essencial para a segurança das pessoas e do patrimônio.7 Este relatório analisa exaustivamente a simbologia técnica convencional, as bases normativas que as sustentam e a lógica funcional por trás de cada representação gráfica.

## **O Panorama Normativo Nacional e Internacional**

A padronização de símbolos técnicos é regida por uma hierarquia de normas que buscam a harmonização entre diferentes mercados. No Brasil, o principal órgão é a ABNT, que frequentemente adota normas internacionais da IEC através de processos de tradução e consulta nacional.4 O setor fotovoltaico é especificamente atendido pelo Comitê Brasileiro de Eletricidade (ABNT/CB-003) e sua Comissão de Estudo Especial de Energia Solar Fotovoltaica (CEE-253).4

Internacionalmente, a IEC 60617 (também conhecida como British Standard BS 3939\) é a referência de facto para símbolos gráficos em diagramas elétricos e eletrônicos, contendo aproximadamente 1.900 símbolos que formam uma "linguagem pictórica" universal.10 Nos Estados Unidos e em partes da América do Norte, a norma ANSI Y32.2 (ou IEEE Std 315\) ainda exerce influência, apresentando diferenças filosóficas na representação visual em comparação com o padrão europeu/global da IEC.3

| Norma | Descrição e Escopo Técnico | Status no Brasil |
| :---- | :---- | :---- |
| ABNT NBR 16690 | Instalações elétricas de arranjos fotovoltaicos — Requisitos de projeto.8 | Vigente (baseada na IEC 62548).12 |
| ABNT NBR 10899 | Energia solar fotovoltaica — Terminologia e conceitos fundamentais.7 | Referência para definições gráficas.12 |
| IEC 60617 | Graphical symbols for diagrams — Base internacional de símbolos elétricos.10 | Adotada indiretamente via NBRs.4 |
| IEEE 315 / ANSI Y32.2 | Graphic Symbols for Electrical and Electronics Diagrams.11 | Utilizada em equipamentos importados.3 |
| ABNT NBR 16274 | Requisitos mínimos para documentação, ensaios de comissionamento e inspeção.13 | Essencial para projetos executivos.14 |

A integração dessas normas garante que um diagrama unifilar elaborado no Brasil possa ser compreendido por um fabricante na Europa ou um instalador no sudeste asiático, reduzindo drasticamente os riscos de falhas de hardware por conexões incorretas.3

## **O Módulo Fotovoltaico: A Célula como Unidade Fundamental**

A representação do gerador fotovoltaico em diagramas de blocos começa pela distinção entre célula, módulo e arranjo. A NBR 10899 define o módulo como a unidade básica formada por um conjunto de células fotovoltaicas interligadas e encapsuladas.15 Graficamente, o símbolo técnico mais comum para um módulo deriva do símbolo da célula solar, que é representado como uma fonte de tensão com a adição de setas indicando a incidência de radiação.17

### **Simbologia e Terminologia Gráfica**

Em diagramas simplificados de blocos, o módulo fotovoltaico é frequentemente representado por um retângulo com uma linha diagonal ou por um desenho esquemático de um painel contendo células internas.19 A IEC 60617 utiliza símbolos específicos para estações geradoras solares planejadas ou em serviço, diferenciando-as de outras fontes de geração elétrica.18

No nível do projeto elétrico, a representação deve incluir informações sobre a potência de pico (![][image1]), definida como a potência nominal de saída sob condições padrão de referência (STC).21 As STC são normatizadas pela IEC 60904-3 e especificam uma temperatura de célula de 25 °C, irradiância de 1.000 W/m² e espectro de radiação AM 1,5.14

### **Arranjos e Séries (Strings)**

Quando múltiplos módulos são conectados, formam-se as séries fotovoltaicas (strings) e, posteriormente, o arranjo fotovoltaico. O arranjo é definido pela NBR 16690 como o conjunto mecanicamente e eletricamente integrado de módulos, incluindo a estrutura de suporte, estendendo-se até os terminais de entrada da Unidade de Condicionamento de Potência (UCP).12

Em diagramas de blocos, o arranjo é comumente representado como um bloco único ou um grupo de blocos retangulares interconectados.19 A representação visual deve distinguir claramente entre a conexão em série (para aumentar a tensão) e a conexão em paralelo (para aumentar a corrente), conforme as especificações do fabricante e as necessidades do projeto.14

## **Unidades de Condicionamento de Potência (UCP) e Inversores**

A Unidade de Condicionamento de Potência (UCP) é o termo normativo utilizado pela NBR 16690 para descrever o sistema que converte a potência elétrica entregue pelo arranjo fotovoltaico em valores apropriados de frequência e/ou tensão para carga, bateria ou rede.12 Na prática do mercado, a UCP é frequentemente referida como o inversor fotovoltaico.12

### **O Símbolo do Inversor**

O símbolo convencional de um inversor em diagramas de blocos é um retângulo dividido diagonalmente.19 Em uma das metades, utiliza-se o símbolo de corrente contínua (duas linhas horizontais, uma contínua e uma tracejada) e, na outra, o símbolo de corrente alternada (uma onda senoidal \~).6 Esta representação indica claramente a função de conversão CC/CA do dispositivo.

Dependendo da tecnologia, o diagrama de blocos pode representar variações:

* **Microinversores:** Representados como pequenos blocos de conversão integrados individualmente ou em pares aos módulos.23  
* **Inversores Híbridos:** Mostram entradas e saídas múltiplas, permitindo a gestão simultânea de energia dos painéis, baterias e rede elétrica.19  
* **Conversores CC/CC:** Utilizados em otimizadores de potência, representados por um retângulo com o símbolo de CC em ambos os lados, indicando que a natureza da corrente não é alterada, apenas seus parâmetros de tensão e corrente.20

A modelagem matemática da eficiência do inversor, crucial para o desempenho do sistema, relaciona a potência de saída CA com a potência de entrada CC:

![][image2]  
Onde ![][image3] representa a eficiência de conversão, tipicamente superior a 95% em inversores modernos.26

## **Controladores de Carga: PWM vs. MPPT**

Nos sistemas isolados (off-grid), o controlador de carga é o dispositivo posicionado entre o arranjo fotovoltaico e a bateria. Sua representação em diagramas de blocos é vital para entender a lógica de carregamento e proteção do banco de baterias.19

### **Diferenciação Gráfica e Técnica**

Embora em diagramas simplificados ambos possam aparecer como um bloco rotulado "Controlador de Carga", a engenharia de precisão exige a diferenciação entre as tecnologias PWM (Pulse Width Modulation) e MPPT (Maximum Power Point Tracking).28

| Tipo de Controlador | Representação no Diagrama | Lógica de Operação |
| :---- | :---- | :---- |
| **PWM** | Representado como uma chave de conexão direta.29 | Conecta o painel à bateria, "puxando" a tensão do painel para a tensão da bateria.28 |
| **MPPT** | Representado como um conversor CC/CC de alta frequência.26 | Funciona como um transformador CC, otimizando o casamento de impedância para extrair a máxima potência do painel.28 |

O controlador MPPT é capaz de aumentar a colheita de energia entre 10% e 45%, dependendo da temperatura e das condições climáticas.26 Gráficamente, o MPPT pode ser identificado por um símbolo de controle automático ou variabilidade dentro do bloco da IEC 60617\.17

## **Sistemas de Armazenamento de Energia: Baterias**

As baterias são os reservatórios de energia do sistema fotovoltaico. A representação gráfica padrão da bateria (conforme IEC 60617 e ANSI Y32.2) consiste em um conjunto de linhas paralelas de comprimentos alternados, simbolizando os pares de placas positivas e negativas.3

### **Simbologia de Baterias em Diferentes Contextos**

Em diagramas de blocos, a bateria é frequentemente simplificada como um retângulo rotulado com sua capacidade em Ampères-hora (![][image4]) ou energia total em Quilowatts-hora (![][image5]).19 No entanto, a documentação detalhada deve refletir a complexidade do banco:

* **Célula Única:** Representada por um par de linhas paralelas.3  
* **Bateria Multi-célula:** Representada por uma série de pares de linhas, indicando a associação em série para atingir a tensão do sistema (ex: 12V, 24V ou 48V).3  
* **Baterias de Lítio (Li-ion):** Frequentemente incluem um sistema de gerenciamento de bateria (BMS), que deve ser representado no diagrama como um bloco de controle ou supervisão acoplado aos terminais de potência.19

A norma ABNT NBR 16767 estabelece os requisitos para baterias estacionárias em sistemas off-grid, garantindo que a representação técnica nos projetos corresponda aos ensaios de desempenho realizados em laboratório.13

## **Dispositivos de Proteção e Manobra**

A segurança das instalações fotovoltaicas depende da correta representação e escolha de dispositivos de manobra e proteção. Devido às características da corrente contínua (CC), como a dificuldade de extinção de arcos elétricos, os símbolos utilizados devem indicar claramente a natureza do dispositivo.9

### **Proteção Contra Sobrecorrente e Surtos**

* **Fusíveis CC:** Representados por um retângulo atravessado por uma linha (IEC) ou por uma linha sinuosa dentro de um corte de condutor (ANSI).3 São essenciais para proteger strings individuais contra correntes reversas.32  
* **Disjuntores CC:** Diferentemente dos disjuntores CA residenciais (NBR NM 60898), estes devem ser específicos para CC. O símbolo gráfico deve incluir a função de disparo térmico e magnético.14  
* **DPS (Dispositivo de Proteção contra Surtos):** Identificado por um retângulo com o símbolo de um centelhador ou varistor. A NBR 16690 exige a instalação de DPS para mitigar efeitos de descargas atmosféricas induzidas.14

### **Seccionamento e Aterramento**

A chave seccionadora (isoladora) é representada por um símbolo de interrupção física do circuito, frequentemente com a indicação de acionamento manual.14 Ela deve ser capaz de isolar a UCP do arranjo fotovoltaico para fins de manutenção, conforme exigido pela NBR 16690\.24

Quanto ao aterramento, a simbologia varia conforme a função:

* **Terra Geral:** Três linhas horizontais de tamanhos decrescentes (pirâmide invertida).3  
* **Terra de Proteção (PE):** Um terra geral dentro de um círculo ou identificado explicitamente, destinado à proteção contra choques.2  
* **Massa (Chassis):** Representada por uma linha inclinada ou um pente horizontal, indicando a conexão com as partes metálicas não energizadas.3

## **Sinalização e Segurança Contra Incêndio**

Um aspecto crítico e frequentemente negligenciado em diagramas de blocos é a sinalização de segurança. Recentemente, normas estaduais dos Corpos de Bombeiros (como no RN e GO) e a NBR 17193 estabeleceram requisitos estritos para a identificação de sistemas fotovoltaicos para equipes de emergência.13

### **Símbolos de Emergência e Desligamento Rápido**

A sinalização deve incluir placas de advertência com os dizeres **"SOLAR c.c."** em caixas de junção e quadros de proteção.14 Além disso, o símbolo de **Chave de Desligamento Rápido (Rapid Shutdown)**, geralmente representado por um botão de emergência (tipo cogumelo) associado a um ícone de gerador fotovoltaico, tornou-se obrigatório para permitir a desenergização rápida do telhado em caso de incêndio.31

| Símbolo de Segurança | Significado Técnico | Aplicação Normativa |
| :---- | :---- | :---- |
| Triângulo com Raio | Risco de choque elétrico em CC.14 | Quadros e inversores. |
| Placa "Rápido Desligamento" | Indica a presença de dispositivo de seccionamento de emergência.31 | Próximo ao medidor de energia. |
| Símbolo de DPS | Dispositivo de Proteção contra Surtos.14 | Proteção contra descargas atmosféricas. |

## **A Dualidade Filosófica: IEC 60617 vs. ANSI Y32.2**

Uma análise profunda da simbologia exige compreender a divergência histórica entre os padrões europeus (IEC) e americanos (ANSI/IEEE). Embora o Brasil siga a IEC, muitos componentes importados ou literaturas técnicas utilizam a simbologia ANSI.3

### **Lógica do Bloco vs. Lógica Pictórica**

A IEC 60617 adota a "lógica do bloco", favorecendo formas retangulares e círculos que descrevem a função do componente de maneira abstrata e organizada.3 Por outro lado, a ANSI Y32.2 é mais "pictórica", tentando mimetizar a aparência física ou o comportamento mecânico do dispositivo.3

Essa diferença é visível em componentes básicos:

* **Resistores:** Um retângulo na IEC; um zigue-zague na ANSI.3  
* **Indutores:** Semicírculos (lombadas) na IEC; voltas helicoidais na ANSI.3  
* **Contatos de Relé:** Símbolos de chaves simples na IEC; círculos com letras (como "K" ou "CR") na ANSI.3

Para o engenheiro brasileiro, a confusão entre esses padrões é identificada como a causa número um de interpretações errôneas em esquemas elétricos.3 Portanto, é imperativo que o diagrama de blocos de um sistema fotovoltaico indique em sua legenda qual norma está sendo seguida.

## **Estrutura do Diagrama: Bloco, Unifilar e Funcional**

A representação de um sistema fotovoltaico não é estática e varia conforme a finalidade do documento.35

### **Diagrama de Blocos (Nível Sistêmico)**

É a representação simplificada que identifica as relações entre os grandes componentes.36 Ele não detalha cada condutor, mas sim o fluxo de energia e sinais de comunicação. É essencial para a fase de pré-projeto e para a documentação de alta potência exigida pelas distribuidoras (acima de 10kW).22

### **Diagrama Unifilar (Nível de Projeto Elétrico)**

Representa os circuitos elétricos em sua forma simplificada, onde uma linha representa todos os condutores de um ramal.14 Este diagrama deve detalhar:

* A configuração do arranjo (strings).  
* Os dispositivos de seccionamento e proteção CC e CA.35  
* O ponto de conexão com a rede elétrica da concessionária.14

### **Diagrama Funcional e Detalhes de Montagem**

Detalha a interconexão física de cada terminal, sendo utilizado por montadores de quadros e técnicos de campo.6 Nele, os símbolos da IEC 60617 para terminais, plugues, soquetes e blocos de conexão são fundamentais para evitar erros de polaridade.17

## **Tendências e Modernização na Documentação Fotovoltaica**

A evolução da simbologia técnica caminha para a integração com softwares de modelagem da informação da construção (BIM) e gêmeos digitais.38 Ferramentas como o QElectroTech ou AutoCAD Electrical permitem a inserção automática de símbolos normatizados da IEC 60617 e IEEE 315, garantindo a consistência do projeto.18

A documentação fotovoltaica moderna também incorpora a comunicação de dados. Símbolos para conectores Ethernet, barramentos CAN e sinais de controle são agora tão comuns quanto os símbolos de potência em diagramas de blocos, refletindo a transformação dos sistemas fotovoltaicos em ativos de rede inteligentes e monitoráveis.2

## **Síntese Técnica e Recomendações de Engenharia**

A identificação rigorosa dos símbolos técnicos para sistemas fotovoltaicos é mais do que um requisito estético; é uma salvaguarda jurídica e operacional.1 Ao projetar ou interpretar um diagrama de blocos, o profissional deve estar atento à origem da simbologia e sua aderência às normas ABNT vigentes.4

1. **Módulos e Arranjos:** Devem ser representados como geradores de corrente, com clara indicação de polaridade e parâmetros STC.14  
2. **Inversores (UCPs):** Devem destacar a função de conversão CC/CA e a interface de monitoramento.12  
3. **Controladores de Carga:** A distinção entre tecnologias PWM e MPPT deve ser explícita, dado o impacto na eficiência e na configuração do sistema.28  
4. **Baterias:** A representação deve considerar tanto os terminais de potência quanto os circuitos de supervisão (BMS) em sistemas de Lítio.19  
5. **Proteção:** O uso de símbolos específicos para CC é inegociável para garantir a segurança contra falhas de arco e sobrecorrentes.14

O domínio da simbologia técnica convencional, fundamentado nas normas ABNT NBR 16690 e IEC 60617, assegura que a energia solar seja implementada com o mais alto nível de excelência técnica, promovendo a uniformidade e a segurança no mercado global de energia.1 A clareza documental é, em última análise, o que permite a interoperabilidade entre fabricantes, projetistas e concessionárias, consolidando a maturidade tecnológica do setor fotovoltaico.1

#### **Referências citadas**

1. Norma técnica de instalação de energia solar: entenda mais, acessado em maio 15, 2026, [https://www.portalsolar.com.br/norma-tecnica-energia-solar](https://www.portalsolar.com.br/norma-tecnica-energia-solar)  
2. IEC Symbols (IEC 60617\) | Capital X Panel Designer by Siemens, acessado em maio 15, 2026, [https://symbols.radicasoftware.com/225/iec-symbols](https://symbols.radicasoftware.com/225/iec-symbols)  
3. Electrical Symbols Guide 2026: IEC vs ANSI Standards (Full List), acessado em maio 15, 2026, [https://kth-electric.com/en/electrical-symbols-guide-iec-ansi/](https://kth-electric.com/en/electrical-symbols-guide-iec-ansi/)  
4. ABNT publica norma de qualidade para módulos fotovoltaicos \- Canal Solar, acessado em maio 15, 2026, [https://canalsolar.com.br/abnt-publica-norma-qualidade-modulos-fotovoltaicos/](https://canalsolar.com.br/abnt-publica-norma-qualidade-modulos-fotovoltaicos/)  
5. Electronic symbol \- Wikipedia, acessado em maio 15, 2026, [https://en.wikipedia.org/wiki/Electronic\_symbol](https://en.wikipedia.org/wiki/Electronic_symbol)  
6. IEC 60617 Graphic Symbols Overview | PDF | International Electrotechnical Commission, acessado em maio 15, 2026, [https://www.scribd.com/document/956903108/IEC-60617-SYMBOLS](https://www.scribd.com/document/956903108/IEC-60617-SYMBOLS)  
7. ABNT NBR 10899 NBR10899 Energia solar fotovoltaica \- Target Normas, acessado em maio 15, 2026, [https://www.normas.com.br/visualizar/abnt-nbr-nm/8242/abnt-nbr10899-energia-solar-fotovoltaica-terminologia](https://www.normas.com.br/visualizar/abnt-nbr-nm/8242/abnt-nbr10899-energia-solar-fotovoltaica-terminologia)  
8. Requisitos de Projeto para Sistemas Fotovoltaicos | PDF | Diodo | Corrente elétrica \- Scribd, acessado em maio 15, 2026, [https://pt.scribd.com/document/709519672/NBR16690-Instalacoes-Eletricas-de-Arranjos-Fotovoltaicos](https://pt.scribd.com/document/709519672/NBR16690-Instalacoes-Eletricas-de-Arranjos-Fotovoltaicos)  
9. ABNT NBR 16690: padronização e segurança \- Portal Potência, acessado em maio 15, 2026, [https://revistapotencia.com.br/portal-potencia/mercado/abnt-nbr-16690-padronizacao-e-seguranca/](https://revistapotencia.com.br/portal-potencia/mercado/abnt-nbr-16690-padronizacao-e-seguranca/)  
10. IEC 60617 \- Graphical Symbols for Diagrams, acessado em maio 15, 2026, [https://webstore.iec.ch/en/iec\_catalog/product/preview/?id=L3B1Yi9wZGYvcHJldmlldy9pbmZvX2llYzYwNjE3e2VkMS4wfWIucGRm](https://webstore.iec.ch/en/iec_catalog/product/preview/?id=L3B1Yi9wZGYvcHJldmlldy9pbmZvX2llYzYwNjE3e2VkMS4wfWIucGRm)  
11. IEEE 315-1975 ANSI Y32.2-1975 \- Graphic Symbols For Electrical and Electronics Diagrams \- Scribd, acessado em maio 15, 2026, [https://www.scribd.com/document/546990523/IEEE-315-1975-ANSI-Y32-2-1975-Graphic-Symbols-for-Electrical-and-Electronics-Diagrams](https://www.scribd.com/document/546990523/IEEE-315-1975-ANSI-Y32-2-1975-Graphic-Symbols-for-Electrical-and-Electronics-Diagrams)  
12. Untitled \- ABCobre, acessado em maio 15, 2026, [http://abcobre.org.br/wp-content/uploads/2021/06/fotovoltaicos-digital-final-menor.pdf](http://abcobre.org.br/wp-content/uploads/2021/06/fotovoltaicos-digital-final-menor.pdf)  
13. RESOLUÇÃO TÉCNICA 04/2025 \- CBMRN, acessado em maio 15, 2026, [http://sistemascbm.rn.gov.br/serten/webroot/downloads/Resolucoes\_Tecnicas/Resolu%C3%A7%C3%A3o%20T%C3%A9cnica%2004%20-%202025%20-%20Seguran%C3%A7a%20contra%20inc%C3%AAndio%20em%20sistemas%20fotovoltaicos.pdf](http://sistemascbm.rn.gov.br/serten/webroot/downloads/Resolucoes_Tecnicas/Resolu%C3%A7%C3%A3o%20T%C3%A9cnica%2004%20-%202025%20-%20Seguran%C3%A7a%20contra%20inc%C3%AAndio%20em%20sistemas%20fotovoltaicos.pdf)  
14. PROTEÇÃO EM SISTEMAS FOTOVOLTAICOS: Uma ... \- RI UFPE, acessado em maio 15, 2026, [https://repositorio.ufpe.br/bitstream/123456789/67342/1/TCC%20J%C3%BAlio%20Domingos%20Gon%C3%A7alo%20Neto.pdf](https://repositorio.ufpe.br/bitstream/123456789/67342/1/TCC%20J%C3%BAlio%20Domingos%20Gon%C3%A7alo%20Neto.pdf)  
15. SEGURANÇA EM USINAS FOTOVOLTAICAS CONFORME A NBR 16690:2019 \- NUPET, acessado em maio 15, 2026, [https://nupet.daelt.ct.utfpr.edu.br/tcc/engenharia/doc-equipe/2019\_1\_37/2019\_1\_37\_final.pdf](https://nupet.daelt.ct.utfpr.edu.br/tcc/engenharia/doc-equipe/2019_1_37/2019_1_37_final.pdf)  
16. FONTE DE ENERGIA ELÉTRICA RENOVÁVEL POR MEIO DO SISTEMA FOTOVOLTAICA | Multivix, acessado em maio 15, 2026, [https://multivix.edu.br/wp-content/uploads/2024/09/FONTE-DE-ENERGIA-ELETRICA-RENOVAVEL-POR-MEIO-DO-SISTEMA-FOTOVOLTAICA.pdf](https://multivix.edu.br/wp-content/uploads/2024/09/FONTE-DE-ENERGIA-ELETRICA-RENOVAVEL-POR-MEIO-DO-SISTEMA-FOTOVOLTAICA.pdf)  
17. IEC 60617 Electrical Symbols Overview | PDF \- Scribd, acessado em maio 15, 2026, [https://www.scribd.com/document/537254876/Iec-60617-Symbols](https://www.scribd.com/document/537254876/Iec-60617-Symbols)  
18. IEC 60617 SYMBOLS \- QElectroTech, acessado em maio 15, 2026, [https://qelectrotech.org/forum/misc.php?action=pun\_attachment\&item=2124\&download=1](https://qelectrotech.org/forum/misc.php?action=pun_attachment&item=2124&download=1)  
19. What Does a Li-Ion Solar Battery Diagram Actually Reveal? \- Anern Store, acessado em maio 15, 2026, [https://www.anernstore.com/blogs/diy-solar-guides/li-ion-solar-battery-diagram-explained](https://www.anernstore.com/blogs/diy-solar-guides/li-ion-solar-battery-diagram-explained)  
20. Common Electrical Drawing Symbols \- APEC.org, acessado em maio 15, 2026, [https://www.apec.org/docs/default-source/Publications/2016/2/Training-Curriculum-for-Solar-PV-Installers-and-System-Designers/TOC/Common-Electrical-Drawing-Symbols.pdf](https://www.apec.org/docs/default-source/Publications/2016/2/Training-Curriculum-for-Solar-PV-Installers-and-System-Designers/TOC/Common-Electrical-Drawing-Symbols.pdf)  
21. Terminologia da Energia Solar Fotovoltaica | PDF \- Scribd, acessado em maio 15, 2026, [https://pt.scribd.com/document/627602901/ABNT-NBR-10899-2006-Energia-Solar-Fotovoltaica-Terminologia](https://pt.scribd.com/document/627602901/ABNT-NBR-10899-2006-Energia-Solar-Fotovoltaica-Terminologia)  
22. DIAGRAMA DE BLOCOS \- Crea-AL, acessado em maio 15, 2026, [https://www.crea-al.org.br/app/uploads/2021/11/Diagrama-3.pdf](https://www.crea-al.org.br/app/uploads/2021/11/Diagrama-3.pdf)  
23. Diagrama Unifilar Fotovoltaico | PDF | Força | Energia elétrica \- Scribd, acessado em maio 15, 2026, [https://pt.scribd.com/document/530430508/Diagrama-unifilar-e-funcional-2](https://pt.scribd.com/document/530430508/Diagrama-unifilar-e-funcional-2)  
24. ABNT NBR 16690 NBR16690 Instalações elétricas \- Target Normas, acessado em maio 15, 2026, [https://www.normas.com.br/visualizar/abnt-nbr-nm/11499/abnt-nbr16690-instalacoes-eletricas-de-arranjos-fotovoltaicos-requisitos-de-projeto](https://www.normas.com.br/visualizar/abnt-nbr-nm/11499/abnt-nbr16690-instalacoes-eletricas-de-arranjos-fotovoltaicos-requisitos-de-projeto)  
25. SmartSolar MPPT RS Isolado \- Victron Energy, acessado em maio 15, 2026, [https://www.victronenergy.com/upload/documents/SmartSolar\_MPPT\_RS/13860-SmartSolar\_MPPT\_RS-pdf-pt.pdf](https://www.victronenergy.com/upload/documents/SmartSolar_MPPT_RS/13860-SmartSolar_MPPT_RS-pdf-pt.pdf)  
26. What is Maximum Power Point Tracking (MPPT) | NAZ Solar Electric, acessado em maio 15, 2026, [https://www.solar-electric.com/learning-center/mppt-solar-charge-controllers.html/](https://www.solar-electric.com/learning-center/mppt-solar-charge-controllers.html/)  
27. PWM vs MPPT Solar Charge Controllers: A Complete Comparison Guide \- Utmel, acessado em maio 15, 2026, [https://www.utmel.com/blog/categories/integratedcircuit/pwm-vs-mppt-solar-charge-controllers-a-complete-comparison-guide](https://www.utmel.com/blog/categories/integratedcircuit/pwm-vs-mppt-solar-charge-controllers-a-complete-comparison-guide)  
28. What are the Different Types of Solar Charge Controllers? PWM vs MPPT, acessado em maio 15, 2026, [https://www.morningstarcorp.com/faq/what-are-the-different-types-of-solar-charge-controllers/](https://www.morningstarcorp.com/faq/what-are-the-different-types-of-solar-charge-controllers/)  
29. MPPT vs. PWM for Solar Charge Controllers \- Cadence PCB Design & Analysis, acessado em maio 15, 2026, [https://resources.pcb.cadence.com/blog/2021-mppt-vs-pwm-for-solar-charge-controllers](https://resources.pcb.cadence.com/blog/2021-mppt-vs-pwm-for-solar-charge-controllers)  
30. MPPT Solar Charge Controller \- Working, Sizing and Selection \- Electrical Technology, acessado em maio 15, 2026, [https://www.electricaltechnology.org/2021/07/mppt-solar-charge-controller.html](https://www.electricaltechnology.org/2021/07/mppt-solar-charge-controller.html)  
31. INSTR UÇ ÃO T ÉCNICA 44/2025 \- Corpo de Bombeiros Militar da Bahia, acessado em maio 15, 2026, [http://cbm.ba.gov.br/sites/default/files/2025-09/instrucao\_tecnica\_44.2025\_-\_seguranca\_em\_sistemas\_fotovoltaicos.pdf](http://cbm.ba.gov.br/sites/default/files/2025-09/instrucao_tecnica_44.2025_-_seguranca_em_sistemas_fotovoltaicos.pdf)  
32. NBR-16690-2019-consulta-publica.pdf, acessado em maio 15, 2026, [https://www.solarize.com.br/downloads/manual-energia-solar/NBR-16690-2019-consulta-publica.pdf](https://www.solarize.com.br/downloads/manual-energia-solar/NBR-16690-2019-consulta-publica.pdf)  
33. AutoCAD Electrical 2024 Help | IEC-60617 Symbol Preview | Autodesk, acessado em maio 15, 2026, [https://help.autodesk.com/view/ACAD\_E/2024/ENU/?guid=GUID-7871E6EF-24D5-467E-9B74-321FEDC9DFDA](https://help.autodesk.com/view/ACAD_E/2024/ENU/?guid=GUID-7871E6EF-24D5-467E-9B74-321FEDC9DFDA)  
34. Quais são as diferenças entre os padrões ANSI e IEC para conectores? \- Kabasi, acessado em maio 15, 2026, [https://pt.kbs-connector.com/info/what-are-the-differences-between-ansi-and-iec-99858906.html](https://pt.kbs-connector.com/info/what-are-the-differences-between-ansi-and-iec-99858906.html)  
35. Diagrama Unifilar para Inversores String \- Energia Solar \- YouTube, acessado em maio 15, 2026, [https://www.youtube.com/watch?v=ma3LKWWqENU](https://www.youtube.com/watch?v=ma3LKWWqENU)  
36. Como elaborar o Diagrama de Blocos Fotovoltaico \- YouTube, acessado em maio 15, 2026, [https://www.youtube.com/watch?v=IAoZWKOizY0](https://www.youtube.com/watch?v=IAoZWKOizY0)  
37. DIAGRAMA UNIFILAR fotovoltaico \- YouTube, acessado em maio 15, 2026, [https://www.youtube.com/watch?v=Mh532tJogxs](https://www.youtube.com/watch?v=Mh532tJogxs)  
38. Wiring Diagrams map out First Class installations \- Victron Energy, acessado em maio 15, 2026, [https://www.victronenergy.com/blog/2023/01/06/wiring-diagrams-map-out-first-class-installations/](https://www.victronenergy.com/blog/2023/01/06/wiring-diagrams-map-out-first-class-installations/)  
39. Technical information | Victron Energy, acessado em maio 15, 2026, [https://www.victronenergy.com/support-and-downloads/technical-information](https://www.victronenergy.com/support-and-downloads/technical-information)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAZCAYAAAAv3j5gAAABr0lEQVR4Xu2UvytGYRTHj6KI5Ef5ESLZLMqmTMhEirJYLPwJsijJYFEoZFCY9CqTzXCzGI2kFKUMBpNRfL/vOY/7vI/X+6trEJ/6dO99zr3Pufc55z4i//wGyuES3PM8gLOwLxinK7A2/aTIRhDbsvGslMEB+ArfRZNMwU6T5xcWm7N7+QyZhlfwTTTJkI3nJBKdbCEY56RrFqsJYv3wCFYF4zk5l+yJeuGzxeqD2D4cDMbywiXjZJveWAU8hLsWa/ViZFu0xkXhEvHoGBFNNGExP1Ej7PGuC4ZLxskiiWuxLFoj1oLNwiPpgqd2XjTzkpmoCXZYrB0+wmHRxOtwxmJFMyaa6E50ifg1Dl4/2D38qpR87cCCcYk4IWtz7MWaRV9gUkrsNB9XB3opmszBt4/gtZTYaT7d8Ekyi+7DblyUeFcI4Q4yCm9FdxTCBqv8vMNwdeBelm0yJmKDfAcbpQ2uemNMFP576W2E/0tDGDC4weaD3cmEhMt7AqvjcHIwCUtA+HX3cSg5WIszuCO6/NxsWzLuSAguG2vMDq0LYonCZWOiH2Uc3sAX0Z/7D/ABSBlSerIzY6AAAAAASUVORK5CYII=>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAAuCAYAAACVmkVrAAADrElEQVR4Xu3cS6i1UxgH8CUUueRWElKSkonCQBkyo8TAQCETGVFynUrGTAwol5KZEWVgcMpETCRSSiGXkRkKuay/tV9n7XXes/f3ne87+5zO9/vVU/t9ztqnd6/R07MupQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHCquqDGuzX+qvFHje+6+KfGO9tDTwlnle3fnjmZ5uKXRe7a7aEAAJv1c41bh9zNNX6rcduQP+ouKa04u2/IX7HIPzzkAQA2IoVICpVeCrW/a9w55I+6FKopYK8b8nnOPD015AEA9t25pRUio63S8mcO+cPiphov1Th78fzoIi7+f8TevFba/+2dUePVGh+XE///AADHLZ2jP4fcaaUVa58M+cPkvRoP1HixxoM1HqrxdY0vuzF78UXZuRx6T2l72m4Y8gAAG5FuUn/g4KMajy+N2HZRaUuGc06vcVlpBxlS8K2Sv2fsukj3b87lNS4tbd9dCrTsL4vny3y3MM6vcc2YnJHvf1+25+PT0g4brPtNc6Y5ib18HwDgv4Joq8azQ343z5U2fvREaUVOOl5ZUnx6+c8n3TmlFUA5AJAibfJBaQclRlnSfLu0d1xl6iyuKq6y1y8FbsaloPuhxitLI5p+Tp4p+z8nAMARdXdphUc6Vutkr9j7Nb7tclfV+Krs3Of22fA8OtEOW6RwyvLl1V0uv+Wt7rmXDlved5V0D38dkzOyVNzvc8s7TKdH5+bkxrJ+TgAAZqXoSJGT+8fWuau0E5I/dbmXa/zYPU/mOk69LDH2d77tFq8vxs+Zrh3p3z2/5USu3ch3UwSuk6Iuxe4kxeUbi89zc5KCbt2cAAAsSZGTIuP30oqcaZ/VKreXdsVHrvqY5PNB3dOWpdf+XVIUpdgaryc5FumGpQBMoZVl31WdvXQHP6xxXpfLXrppWfkg5wQAOEKy1yuFWh+rXF/jyhr3l+Wx6bb1S5KbtFXjm+45RVKWQ1ftP9tNruzo5yLPu7mw7Lz2I53HWxaf5+bkWDqYAAB7ls7aY4vPuQIkl8pO5i6YvXd43pRc85G9YvstV370v/nJsnyVyNyc6LgBAPvqzdKu0IgsnfaHDlKovNA931Hjke55k3Iicy/Loccj3bssxabLFjmt+nlZLtDm5mQvXT8AgJMmd43lQEKWTQ/SumXdTToscwIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAh8C/plZs9gi1d2AAAAABJRU5ErkJggg==>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAbCAYAAABFuB6DAAAAyElEQVR4Xu2RMQ5BURBFr6BCFIRSIhq1VkSh0diGXqOQ6GxAI9HYgCUo9GodtRWoRLjXe2Qy4rcUTnKS9++8vJnMB/58jbz7TtOKDYp0TRv0Rvd0SrOxrmyoQ48uaSqGC5qJl4SysQ592qEFeqJ1c0m8XnzSpBuaM5lePtOWyTCgMxuQKsLMZRvOEcawtOkKYf4HWs0W7/ON4Obr0qsNENoe4dpquSUbILS9wLT9hFpqNYloLfpbWk0imktr2fmCp0YPdOILv8wdYS0c6YcXvW8AAAAASUVORK5CYII=>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAZCAYAAAAv3j5gAAABfklEQVR4Xu2UzysFURTHv0JZiER+RClZKkmSYiVLFrbsLNjYWPi19w/IhsiWskOy0WxlIcVSIVE2SlGi+B7n3jpzZ6aGehvNpz69O+fcN+e+c08PKCgxlXQ4DJaCSfoVBh0L9I4+0Ncg9ysa6SWyC/XTWWiR6yCXmx566swqJExD83NhIi+70LYtI7tQGd2mH3QwyOXmgFZD70EKyTqkgV5B29YEbXXavkzq6ZBbjyO7UC/0fvbpIr2nn3SH1pp9qXTSyDz30TfaZmKCb5scYsk9C6MuJp3IpIJu0BkT86eWT4tv2w1tNfEVaKExE0sg7XqHbgyVX2bxB9iDHlCQ9kb0kXa4WALZdExHgngLvYW2xDKB5Fh30Wd6SKtMPIa0awv6l2Opo2fQF1vSxtpPqN/bbnI/Lz532l57mukJXUf8EC+It02QXx7RGjpv4uiGfsHfg9zPgMvJiF+YnHfV5WU95daeNfpEj+hmkPszMnXlQUxGXA4o+nEvKPjPfAPS1lRZ/GOYNwAAAABJRU5ErkJggg==>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAZCAYAAABD2GxlAAACm0lEQVR4Xu2WS6iOURSGl1wi94iEjlBCBsKAZCCSxMjEJYaMGTAkGcjMSCKXkpJCQi6DM5JLMXKJFCJlwIhccnmfs/Y6Z337/P8xk8H/1tP5v7X2t/dea6+9vmPWUUf/j26JN+KDeFH50DJxVhxLnBELij/b4YAYU3zjKt8J87Xgu9hTxg2oteKQ+C2uVj7UJTaKy+Zjdot1YmTxbxXPiu+xeUCDim+E+Zz4bootafwvsaqMG1DDzSf52wvrzReaUtmHiovFd7vyoWtiRnpeLn6IC2JIsrfVNPFWvBJTm66GYoNzK/sG8bP4upuunkzurGwcK2N3Vfa2ImtkL0dEViaKwTFIWiK+iEXJhq6Ic+aLPqh8jB1V2TgtMkgm0QTrK4mWOmjNiDaJ5+KRuB6DzBf7bL7RLDKyw3yO18lO/bHxWpzWU7FdPBEfxTuxMg/Kem9e3NPFEfNo4hjupnHUHhvgqBFZPlp+x/ETAJpkHtzs8pzFuPPm76OYF+r67hEvEBHtJi4JbWKNefpDk8VL62sNq83bDYrsAgHut/61h7j5jMllEu9ywaIzNMQG4ZM4Ze3rgVrqNt8gG6f25hdfLMI82PDl4EIzzU+L+g5FeexLtl6NNp94sZgn7ojNjRF9ig0eN++Fe60vGBamVFiIrJLdVuLGn7RmErg038TSZOsVLYObN748c7MuiWHmRb6t2EOnxUPz+qLOQlFHbJAvRtRXLS4kzTqLk6PWx5rP0+iNXIr8Al8VjjAuQJ0JFsgFHorsssF2iixHMkK0LjpDl1WNnoLEMCfZiIJJbojD1n8jbH5hZUPxNbpfO5IIvlUAX80v6D1r0WrqJooo7nbNk38QWtnRCjGrNibR9PPlCBEcR8vfjjrqqKN/pT/e+pKySZnZ2gAAAABJRU5ErkJggg==>
# **Diretrizes técnicas e simbologia normalizada para diagramas unifilares de sistemas fotovoltaicos no Brasil**

O projeto de sistemas fotovoltaicos no Brasil é regido por um arcabouço normativo que visa garantir a segurança, a interoperabilidade e a eficiência energética das instalações. A documentação técnica, centrada no diagrama unifilar, deve refletir fielmente a arquitetura do sistema, utilizando simbologias que permitam a rápida interpretação por engenheiros, técnicos e agentes de fiscalização das concessionárias de energia.1 A correta identificação dos componentes — desde os módulos geradores em corrente contínua até o ponto de conexão com a rede de distribuição em corrente alternada — é fundamental para a conformidade com as normas ABNT NBR 5410, NBR 16690 e NBR 16149\.3

## **Fundamentação normativa e a evolução da simbologia elétrica**

A elaboração de diagramas unifilares no setor elétrico brasileiro passou por uma transição significativa na última década. Historicamente, a norma ABNT NBR 5444 era a referência para símbolos gráficos em instalações elétricas prediais, baseando-se em figuras geométricas para representar dispositivos.5 Contudo, com o seu cancelamento em 2014, o setor passou a adotar formalmente as normas internacionais IEC 60417 e IEC 60617 como referências primárias para a representação gráfica de equipamentos e diagramas, respectivamente.7

Embora a NBR 5444 ainda seja utilizada por alguns profissionais devido à sua simplicidade e à ausência de uma tradução integral das normas IEC para o português, a tendência atual é a convergência para o padrão internacional, o que facilita a integração de tecnologias globais no mercado nacional de energia solar.7 Para sistemas fotovoltaicos, essa padronização é essencial, uma vez que os componentes (inversores, módulos e dispositivos de proteção) são frequentemente fabricados sob especificações internacionais que utilizam a simbologia IEC.1

## **O lado da corrente contínua e a NBR 16690**

A NBR 16690, publicada em 2019, estabelece os requisitos de projeto para instalações elétricas de arranjos fotovoltaicos, focando especificamente no circuito que vai dos módulos até a Unidade de Condicionamento de Potência (UCP), termo normativo para o inversor.2 Esta norma é crucial porque os arranjos fotovoltaicos operam em corrente contínua e apresentam riscos distintos dos sistemas CA tradicionais, como a dificuldade de interrupção de arcos elétricos e a operação em condições de corrente constante.3

### **Representação do arranjo e das séries fotovoltaicas**

No diagrama unifilar, a representação do gerador deve seguir a hierarquia definida pela NBR 16690\. O sistema começa com o módulo fotovoltaico, a menor unidade geradora.1 A conexão de vários módulos em série forma a "série fotovoltaica" (ou *string*), representada por um conjunto de módulos interconectados.1 Quando várias séries são ligadas em paralelo, forma-se o "arranjo fotovoltaico".1

| Termo Normativo | Definição e Representação no Diagrama | Função Técnica |
| :---- | :---- | :---- |
| Módulo Fotovoltaico | Representado por um retângulo com indicação de ![][image1], ![][image2] e ![][image3]. | Conversão direta de radiação em eletricidade CC. |
| Série Fotovoltaica (*String*) | Conjunto de módulos em série; indicada pela quantidade (ex: 2 x 10 módulos). | Aumento da tensão total do circuito para compatibilidade com o inversor. |
| Subarranjo Fotovoltaico | Divisão lógica de um arranjo maior, geralmente ligada a uma caixa de junção. | Facilitação do seccionamento e proteção em grandes usinas. |
| Arranjo Fotovoltaico | O conjunto total de painéis ligados a uma única UCP (ou entrada MPPT). | Geração total da planta em corrente contínua. |

A simbologia para esses elementos deve incluir as características elétricas fundamentais para o dimensionamento, como a Tensão de Circuito Aberto do Arranjo (![][image4]), calculada a partir da tensão do módulo corrigida pela temperatura mínima local, garantindo que a tensão máxima suportada pelo inversor e pelos cabos não seja excedida.1

### **Dispositivos de seccionamento e manobra CC**

A segurança de um sistema fotovoltaico depende da capacidade de isolar o gerador para manutenção. A NBR 16690 exige que cada arranjo ou subarranjo possua um dispositivo interruptor-seccionador.1 Este componente, no diagrama unifilar, é representado graficamente como uma chave capaz de abrir sob carga.1

É comum que inversores modernos possuam essa chave integrada (Chave CC ou *DC Switch*). No entanto, se o inversor estiver distante dos módulos (geralmente mais de 10 metros ou em ambientes diferentes), a norma recomenda a instalação de um seccionador adicional próximo ao arranjo.1 A simbologia deve deixar claro se o dispositivo é manual ou automático e se possui fusíveis integrados.1

### **Proteção contra sobrecorrente no lado CC**

Diferente das instalações CA, onde a corrente de curto-circuito é muito alta, nos sistemas fotovoltaicos a corrente de curto-circuito é limitada pela física das células solares (normalmente cerca de 1,1 a 1,2 vezes a corrente de operação).3 Por essa razão, a NBR 16690 estabelece critérios específicos para a proteção.

A proteção contra sobrecorrente (fusíveis gPV ou disjuntores CC) só é obrigatória se houver mais de duas séries em paralelo, pois uma série em curto poderia ser alimentada pela corrente reversa das outras séries.3 O diagrama deve indicar o valor nominal da proteção (![][image5]), que deve seguir a regra:

![][image6]  
Além disso, ![][image5] não pode ultrapassar a corrente máxima de proteção reversa especificada pelo fabricante do módulo (![][image7]).3

## **Dispositivos de Proteção contra Surtos (DPS)**

A proteção contra sobretensões transitórias é obrigatória conforme a NBR 5410 e a NBR 16690, dada a exposição dos painéis a descargas atmosféricas.3 O projeto deve prever DPS tanto no lado CC quanto no lado CA.3

### **DPS no Lado CC**

Os DPS CC devem ser específicos para sistemas fotovoltaicos, capazes de operar com as tensões contínuas elevadas e extinguir arcos CC após a atuação.3 No diagrama unifilar, são representados em paralelo com o circuito de entrada, conectados entre o polo positivo e o aterramento, e entre o polo negativo e o aterramento (esquema em "Y" ou "V").3 Devem ser identificados por:

* Classe de Proteção (Geralmente Tipo II);  
* Tensão Máxima de Operação (![][image8]);  
* Corrente de Descarga Nominal (![][image5]) e Máxima (![][image9]).3

### **DPS no Lado CA**

Instalados no quadro de proteção CA (ou String Box CA), protegem o inversor contra surtos vindos da rede elétrica.3 No diagrama, são posicionados entre as fases/neutro e o barramento de aterramento da edificação.13 A especificação de tensão deve ser compatível com a rede (ex: 275 VCA para redes 220V).13

## **O inversor (UCP) e a NBR 16149**

O inversor é o "cérebro" do sistema, e sua representação no diagrama unifilar deve ser acompanhada de informações sobre as funções de proteção exigidas pela NBR 16149\.4 Esta norma trata da interface de conexão com a rede de distribuição, garantindo que o sistema não injete energia de má qualidade ou represente riscos à concessionária.4

### **Funções de proteção de rede (ANSI)**

Para a aprovação de projetos junto às concessionárias (ex: Energisa, EDP, CPFL), o diagrama deve indicar as proteções internas integradas ao inversor, geralmente utilizando códigos de função ANSI.3

| Código ANSI | Função | Descrição Técnica no Diagrama |
| :---- | :---- | :---- |
| 27 | Subtensão | Monitoramento de quedas de tensão na rede CA. |
| 59 | Sobretensão | Proteção contra picos de tensão da rede. |
| 81U/81O | Sub e Sobrefrequência | Garante que o sistema opere sincronizado com a rede de 60Hz. |
| 25 | Relé de Sincronismo | Verifica fase e tensão antes de fechar a conexão. |
| Anti-ilhamento | Desconexão Automática | Interrompe a injeção de energia se houver falta na rede externa. |

O anti-ilhamento é uma das proteções mais críticas.3 Ele impede que o inversor continue gerando energia durante um apagão, o que poderia eletrocutar técnicos da concessionária trabalhando na rede.3 No diagrama, esta função é frequentemente indicada por uma nota técnica vinculada ao bloco da UCP.13

### **Monitoramento de isolação e corrente residual**

Além das proteções externas, os inversores devem possuir monitoramento de falha de isolação no lado CC e detecção de corrente residual (fuga para terra).3 A NBR 16690 ressalta que o inversor deve emitir um alarme ou se desconectar se a resistência de isolação cair abaixo de um nível de segurança, protegendo contra choques e riscos de incêndio.3

## **Condutores, infraestrutura e identificação**

A simbologia de cabos e eletrodutos é vital para a execução física do projeto. No diagrama unifilar, os condutores devem ser detalhados quanto à seção (em ![][image10]), material (cobre), tipo de isolação e classe de tensão.3

### **Cabos CC (Lado Gerador)**

Os cabos que interligam os módulos e chegam até o inversor operam em condições severas. Conforme a NBR 16612, devem ser resistentes a radiação UV, chamas e possuir isolação para tensões de até 1,5 kV ou 1,8 kV CC.3 No diagrama, utilizam-se símbolos de polaridade (+) e (-) para distinguir os condutores, e os conectores devem ser do tipo "clique e trava" (padrão MC4) para evitar desconexões acidentais sob carga, o que causaria arcos elétricos.3

### **Cabos CA (Lado Rede)**

Seguem os critérios da NBR 5410\. Devem ser representados com as indicações de Fase, Neutro e Terra.3 A isolação típica é de PVC ou XLPE (90°C), e a seção deve ser dimensionada considerando a corrente máxima do inversor e o limite de queda de tensão, que deve ser mantido baixo para evitar desligamentos por sobretensão (Função 59\) no terminal do inversor.12

### **Sinalização de Segurança**

É uma exigência normativa (NBR 16690 e normas de concessionárias) que o projeto preveja sinalização adequada. No diagrama, deve constar a localização das placas de advertência.12

* **Placa no Padrão de Entrada**: Indica a presença de geração própria para que a concessionária saiba que há uma fonte de tensão reversa.13  
* **Etiquetas "Solar CC"**: Fixadas em caixas de junção e eletrodutos que transportam cabos CC, alertando que estes permanecem energizados durante o dia, mesmo com o disjuntor desligado.1

## **Aterramento e Equipotencialização**

O sistema de aterramento une as normas NBR 5410 (instalações gerais) e NBR 16690 (arranjos fotovoltaicos).1 No diagrama unifilar, deve ser indicado o esquema de aterramento adotado (ex: TN-S ou TT).2

A equipotencialização das estruturas metálicas de suporte dos módulos é obrigatória para evitar choques elétricos e facilitar a atuação dos DPS.3 O diagrama deve mostrar o condutor de proteção (verde ou verde-amarelo) interconectando as carcaças dos módulos, a estrutura de fixação, o gabinete do inversor e o barramento de aterramento principal da edificação.3

Em sistemas de grande porte, deve-se considerar a corrosão eletroquímica entre metais diferentes (ex: alumínio da estrutura e aço galvanizado do edifício), utilizando materiais isolantes ou anilhas específicas, conforme recomendado na NBR 16690\.1

## **Análise de arquiteturas típicas e configurações de arranjo**

A NBR 16690 detalha em suas figuras (Figuras 2 a 7\) as diferentes formas de organizar um sistema fotovoltaico.1 O diagrama unifilar deve ser adaptado conforme a complexidade da usina.

1. **Arranjo Simples (Série Única)**: Comum em microgeração residencial. Uma única *string* conectada diretamente à UCP. Nestes casos, a proteção contra sobrecorrente CC pode ser dispensada se a corrente reversa não for um risco.1  
2. **Múltiplas Séries em Paralelo**: Exige o uso de caixas de junção (*string boxes*) com fusíveis e DPS para cada subconjunto. No diagrama, cada ramo paralelo deve ser individualizado com sua respectiva proteção.1  
3. **UCP com múltiplas MPPTs**: Inversores modernos possuem várias entradas independentes. O diagrama unifilar deve representar cada entrada MPPT como um circuito isolado, pois cada uma tem seu próprio rastreamento de máxima potência e limites de corrente.3

| Componente | Simbologia no Diagrama (Descrição) | Referência Técnica |
| :---- | :---- | :---- |
| Disjuntor CA | Símbolo de interruptor automático com proteção térmica e magnética. | NBR 5410 |
| Fusível gPV | Retângulo com linha central, indicando classe fotovoltaica. | NBR 16690 |
| Chave Seccionadora CC | Símbolo de chave com função de isolamento, indicada como "DC Disconnect". | NBR 16690 |
| DPS | Retângulo com aterramento, indicando proteção contra surtos. | NBR 5410 / 16690 |
| Medidor Bidirecional | Círculo com dois sentidos de seta ou indicação "kWh". | Padrão Concessionária |

## **Considerações sobre durabilidade e materiais**

A documentação técnica deve refletir a escolha de materiais adequados para uma vida útil de 25 anos.1 Isso inclui a especificação de eletrodutos resistentes à radiação UV para as partes expostas no telhado e o uso de componentes que suportem as temperaturas de operação, que podem elevar a resistência dos condutores e causar quedas de tensão excessivas.19

A NBR 16690 recomenda que, durante o projeto, sejam tomadas precauções contra a corrosão galvânica e que todos os acessórios plásticos, como cintas de fixação, também sejam resistentes a UV para evitar o colapso físico da fiação ao longo do tempo.1 Essas especificações, embora qualitativas, são frequentemente incluídas como notas de rodapé ou legendas detalhadas no diagrama unifilar para garantir que o instalador siga as diretrizes de projeto.12

## **Conclusão e boas práticas de engenharia**

A identificação da simbologia técnica normalizada para sistemas fotovoltaicos no Brasil exige uma visão holística que integra a proteção patrimonial da NBR 5410, a especificidade elétrica da NBR 16690 e os requisitos de estabilidade de rede da NBR 16149\.1 O diagrama unifilar não é apenas um desenho; é um documento de engenharia que atesta que o sistema foi dimensionado para suportar faltas, surtos e operar em harmonia com a infraestrutura pública.3

A adoção dos padrões IEC para a simbologia gráfica representa um amadurecimento do mercado brasileiro, alinhando-o com as melhores práticas mundiais.6 Profissionais que dominam essa linguagem técnica asseguram maior celeridade nos processos de homologação junto às concessionárias e garantem instalações intrinsecamente seguras para os usuários finais.3 Em última análise, a precisão na simbologia — detalhando disjuntores, DPS, seccionadores e as complexas funções internas dos inversores — é a maior garantia de que a transição energética brasileira será construída sobre bases sólidas de confiabilidade técnica e segurança operacional.3

#### **Referências citadas**

1. NBR-16690-2019-consulta-publica.pdf, acessado em maio 15, 2026, [https://www.solarize.com.br/downloads/manual-energia-solar/NBR-16690-2019-consulta-publica.pdf](https://www.solarize.com.br/downloads/manual-energia-solar/NBR-16690-2019-consulta-publica.pdf)  
2. NBR 16690 | PDF \- Scribd, acessado em maio 15, 2026, [https://www.scribd.com/document/596066574/NBR-16690](https://www.scribd.com/document/596066574/NBR-16690)  
3. PROTEÇÃO EM SISTEMAS FOTOVOLTAICOS: Uma ... \- RI UFPE, acessado em maio 15, 2026, [https://repositorio.ufpe.br/bitstream/123456789/67342/1/TCC%20J%C3%BAlio%20Domingos%20Gon%C3%A7alo%20Neto.pdf](https://repositorio.ufpe.br/bitstream/123456789/67342/1/TCC%20J%C3%BAlio%20Domingos%20Gon%C3%A7alo%20Neto.pdf)  
4. ABNT NBR 16149 NBR16149 Sistemas fotovoltaicos (FV) \- Target Normas, acessado em maio 15, 2026, [https://www.normas.com.br/visualizar/abnt-nbr-nm/32852/abnt-nbr16149-sistemas-fotovoltaicos-fv-caracteristicas-da-interface-de-conexao-com-a-rede-eletrica-de-distribuicao](https://www.normas.com.br/visualizar/abnt-nbr-nm/32852/abnt-nbr16149-sistemas-fotovoltaicos-fv-caracteristicas-da-interface-de-conexao-com-a-rede-eletrica-de-distribuicao)  
5. Elementos de Instalações Elétricas \- Website by Prof. Clovis Antonio Petry, acessado em maio 15, 2026, [https://professorpetry.com.br/Cursos/AcionamentosEletronicos/Apresentacao\_Aula\_02.pdf](https://professorpetry.com.br/Cursos/AcionamentosEletronicos/Apresentacao_Aula_02.pdf)  
6. Símbolos Elétricos: NBR 5444 Cancelada | PDF \- Scribd, acessado em maio 15, 2026, [https://id.scribd.com/document/376200963/NBR-5444-Cancelada](https://id.scribd.com/document/376200963/NBR-5444-Cancelada)  
7. Simbologia Elétrica: Conheça as Principais Representações \- Vobi, acessado em maio 15, 2026, [https://www.vobi.com.br/blog/principais-simbologias-de-eletrica](https://www.vobi.com.br/blog/principais-simbologias-de-eletrica)  
8. te039 aula 12 \- simbologia diagrama unifilar.pdf \- Engenharia Eletrica \- UFPR, acessado em maio 15, 2026, [https://www.eletrica.ufpr.br/sebastiao/wa\_files/te039%20aula%2012%20-%20simbologia%20diagrama%20unifilar.pdf](https://www.eletrica.ufpr.br/sebastiao/wa_files/te039%20aula%2012%20-%20simbologia%20diagrama%20unifilar.pdf)  
9. UNIVERSIDADE DA INTEGRAÇÃO INTERNACIONAL DA LUSOFONIA AFRO- BRASILEIRA INSTITUTO DE ENGENHARIAS E DESENVOLVIMENTO SUSTENTÁVEL \- Unilab, acessado em maio 15, 2026, [https://repositorio.unilab.edu.br/jspui/bitstream/123456789/5018/1/ANA%20LENISE%20DOS%20SANTOS%20CORREIA.pdf](https://repositorio.unilab.edu.br/jspui/bitstream/123456789/5018/1/ANA%20LENISE%20DOS%20SANTOS%20CORREIA.pdf)  
10. Normas sobre Instalações elétricas de arranjos fotovoltaicos – Requisitos de projeto, acessado em maio 15, 2026, [https://www.abinee.org.br/normas-sobre-instalacoes-eletricas-de-arranjos-fotovoltaicos-requisitos-de-projeto/](https://www.abinee.org.br/normas-sobre-instalacoes-eletricas-de-arranjos-fotovoltaicos-requisitos-de-projeto/)  
11. Seleção da chave seccionadora da stringbox \- Canal Solar, acessado em maio 15, 2026, [https://canalsolar.com.br/selecao-da-chave-seccionadora-da-stringbox/](https://canalsolar.com.br/selecao-da-chave-seccionadora-da-stringbox/)  
12. SEGURANÇA EM USINAS FOTOVOLTAICAS CONFORME A NBR 16690:2019 \- NUPET, acessado em maio 15, 2026, [https://nupet.daelt.ct.utfpr.edu.br/tcc/engenharia/doc-equipe/2019\_1\_37/2019\_1\_37\_final.pdf](https://nupet.daelt.ct.utfpr.edu.br/tcc/engenharia/doc-equipe/2019_1_37/2019_1_37_final.pdf)  
13. DIAGRAMA UNIFILAR 1, acessado em maio 15, 2026, [http://www.sitionovodotocantins.to.gov.br/storage/documentos/211906202601026958607abb963.pdf](http://www.sitionovodotocantins.to.gov.br/storage/documentos/211906202601026958607abb963.pdf)  
14. Norma Energia Solar ABNT NBR 16149 PDF \- Scribd, acessado em maio 15, 2026, [https://pt.scribd.com/document/447935729/Norma-Energia-Solar-ABNT-NBR-16149-pdf](https://pt.scribd.com/document/447935729/Norma-Energia-Solar-ABNT-NBR-16149-pdf)  
15. INVERSORES FOTOVOLTAICOS CONECTADOS À REDE \- INRI (UFSM), acessado em maio 15, 2026, [https://inriufsm.com.br/wp-content/uploads/2023/06/Cartilha\_virtual-\_Ensaio\_Inversores\_Fotovoltaicos.pdf](https://inriufsm.com.br/wp-content/uploads/2023/06/Cartilha_virtual-_Ensaio_Inversores_Fotovoltaicos.pdf)  
16. ENERGIA SOLAR FOTOVOLTAICA NO AGRONEGOCIO DO PARANA eletronica.indd \- Secretaria da Agricultura e do Abastecimento, acessado em maio 15, 2026, [https://www.agricultura.pr.gov.br/sites/default/arquivos\_restritos/files/documento/2025-12/energia\_solar\_fotovoltaica\_no\_agronegocio\_do\_parana\_eletronica\_30.09\_0.pdf](https://www.agricultura.pr.gov.br/sites/default/arquivos_restritos/files/documento/2025-12/energia_solar_fotovoltaica_no_agronegocio_do_parana_eletronica_30.09_0.pdf)  
17. Diagrama Unifilar de Sistema Fotovoltaico | PDF \- Scribd, acessado em maio 15, 2026, [https://www.scribd.com/document/559223275/Diagrama-Unifilar-1](https://www.scribd.com/document/559223275/Diagrama-Unifilar-1)  
18. Diagrama Unifilar de Sistema Fotovoltaico | PDF | Rede elétrica | Eletricidade \- Scribd, acessado em maio 15, 2026, [https://pt.scribd.com/document/652100974/DIAGRAMA-UNIFILAR-ANTONIO-Model](https://pt.scribd.com/document/652100974/DIAGRAMA-UNIFILAR-ANTONIO-Model)  
19. Como aplicar a NBR 16690 em estudo de queda de tensão no ..., acessado em maio 15, 2026, [https://canalsolar.com.br/nbr-16690-queda-de-tensao-circuito-cc/](https://canalsolar.com.br/nbr-16690-queda-de-tensao-circuito-cc/)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAZCAYAAADJ9/UkAAACAklEQVR4Xu2VMUhVYRTH/1GCgQRaKIKitroEUoHUlI2CmGODLjq46RA1CNHU0mAQESGkNIhROLhEw6ul0UmaRARBxEEQGlSi/v93vu957vc+4Rk6+f7w4757zr3fud85/3sfUNdF1BUyQ945PpAxciuJixfkWvlOoDvJvQ7xmnWJ9JPf5C+s8AjpCuj3j5AbD9fqHqmFrJI/sMIPQvzUKsEKPEniKvQy5JqSnLRArqbB0+ob8sV7yW7INSe5BnI/if2X1G4VmHUxLT5P3oZcu8tJwzDP5HSZ3HDnWqs1HKsUi+sY9RBWfCjkfPHr5LM791LuK1kjd8ko2YB5Zx/HnqlI7VaBEo5n+xx2YR/MkDpK3eQLbCepNJplcpPcg13nd6s13rvzsiZQLK6FO0Oug2yRAdjDvCKPQy6V7pkkjWQKtq7XIIobrARVfB3WXu06Sueb4Ro9+RLyzveSFz6R20n8GYqjLSsWVxHNetHl2mAP9YjMoTaHy2yauTedurGC6m5U5ip+wh4gSrsskV/kDU52uJfmfYSiueSDbdLjYoWEN5aXWvUUGadmFFuuTkaz3SF7sM9wleJc9e3OFVDxnLtzii3XqL7DPLJDpnHCe65PpN5nfa9z0p9MrYot1+71zssz2aLnIb1ianmVsc5bavEhOSAfUZs5z0z6C/bUVVdF/wABTGWIKrpLCwAAAABJRU5ErkJggg==>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAZCAYAAAC/zUevAAAByUlEQVR4Xu2VzysFURTHj1CUnxHZysaPkiRRdhQLGzZkaWPNAmv5B6QUIgvlx1pKFi+KRLFQVhYsWEhKURZ+fL/vzOjOGfOa8izUfOrTe3fOmfvuPXPmPpGEhDA5cAouGi3rkjn+K7iITngDP+ERHApkKCui8XM4amJZY1b0R3ZggYmRE9hiL2abcdFFHMJiE2O1pr3PP6VfdBF8LDUm1gUrzLUoymAVzLUBB1ba/kaaNvgKn2Gzc70U7jnjKArhHbyEF/BRwpVrgLvwCd7CJdH7vuHK/OZkVUgjPIN1ftIPcJH7ohO71EuwvwbhAszzxq3wDXZ44zTsA/YDFzEJ8+EmHHOTfmBC9J55c52LuIbVnlewyYlzflY8UC2umCvnhHNwwBsXuUmGcngKP2CviXV7MeaMiM4bKH0Ua6LJ/DyG7cFwCJb0Bd7DWhNjNVdFd7osOm8seCOTD+CMhBvL4i8iJcGK8Tuv9Xhjf3Ox6BNNfreBCNhkbLYH0SYmfMvY+dt+khdjjrupErgl2tgB/J2xjHHhJBuib0dK9DUdlvA5wQ2y8fm/w9OXr7LNScPGYUNW2kAM+Ah4oGV6hDzEeBTwQEtISPgffAFT1lbk4HNUkAAAAABJRU5ErkJggg==>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAYCAYAAADpnJ2CAAABYUlEQVR4Xu2UvytGURjHj1DIz0iRyWCTgSyUkkUWWVnlT2C0GiySwSKDpAwWg+3dFCubSUpSBmVAfny+95zj3vcRXcNddD/16X3PfZ7zvO957nOvcyX/jUncxW3jVjapCObwFvttoCg28BgbbKAIOvAcl22gKIbwEcdtwKDT92CzDWSoxW5st4FIDe7gB9aZWEQFLpwvJqbxIQ0nzOAetob1bFirfhWxnfrBn5jH5/C9CU/wLQ27KXzBtrBWByq4HhOyDOMTvtpABt1b/aEF7MUW7AwxfZ7he1hHBrHRXEtaeOh8MR3/N0bwzvlcuR+ua7rz7E/owkvnNyyZmKjHRVx1abvGnO9IJaz10tD+XBOuqVQrVUCttWg4VEwTrEkWfXjj/MlEbLfus2XFhUHTTVbPY3uio1+pHp1wE+/xAK/xFAeySTCBV86/Eo+cb/1aVcYfyfv8KUdD9O1RKCkpqeITikFDB7H0X2MAAAAASUVORK5CYII=>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGoAAAAZCAYAAADZl7v4AAAE3klEQVR4Xu2Yaai1UxTH/zJkTIYMIVPJkMhUhO4HJDJkyCvlAx9IpgiZ6iJJKMlQIlFCfPCBCB+OIUSZSiQKGYpQogwZ1s96lrPOOvseV+9770vtX/279+y9z/Psvdbaa699pE6n0+l0/ttcYrq7aIuJEdJDpnuHPnT0ZHdnqVnDdJDpddMfpi9MZ5vWzoOME03vysc8YNp8sruzXJwld8Inpq1LH+C8RzTtwM4yc4zcUT+a9i198LZpj9rYWX5wDk763XRY6WMXXVzaOquJnUxfynfVCaXvFNOGpa2zmsARI7mj7hna2ElUeJcPnysUIpvJzzT+nwXP31LjM26d1FdZy3RgbVwG9qwNSwy2wHb/ehPcL3fUY8PnY00vyJ1RoQqk7yrTSab3TXtPjHB2N71kesN0vukp0xGmJ/OgwiHy6rMyMv2icXX6julF06EaB8r6pgdNP5i+Mn06jHvTtOYwpgVGY/2Vq+Xv4p0bp/Yz5RnoPdMZqR1iDlTJH5leNm2b+jcwXW961nSa6VXTw5p8/kz4MhNi8Tz4NbnRKizqUdOmqe1S+cRiQhjuXNNnpsOHz7CDfPILOSp29q+lHXgGBuAqscnQxrO/lwdV5gp5Og920+xzlnRPgLKbKwfLA+3I0s65Psv5XGFuK23by+d/gcbfxUHPme6KQf/ERRqX6HzpVk2ntEiH1ftxxlHmA4771nTA3yPGELkYsgWRep+8qKngHBaZFx9FUN4NGBujr5vaSDEjtdMMl3veOVK7/3TTyfJLf3ZkPcsr+2s6gD6QHyXVruysb0rbgkSJToRikPrrBPDin2qj3BA4OAz2nek6TU8I5jVdWcJ28uAggjF+JZySDbRC7lQcHGxj+jh9Bs68W0pbcKF8Z+adGjB/Mg3PrFcX0uIsCFp2coCTSZWc1ZWw/aLIlV8rBYSh6nYGDI/BLpMvitSWI3oxXCM3TDi9QtRzRpHzn5eno10nRjjMgbmM5BHMs1opnDXeoPH9kIjOhgV2xTnD/+woUvmO8nGzHEXa4yjIMK9WgAI2bQVnEzzN+YHXW4TX2aaV200/yyMXhxKFLTBOKwjWk6dJnLSX6fPJ7r+oaY+gYkdlIu3FGUhWoJCYjwEJdhHBwTtR3TFA2mOHA2cUAcDZS2Y5PgY1wMEUNBmyTT43A+yOzSkqFgWLZDILlanhKP5WiDQinjOMxRI9LbiTtaKKMyB+8OU5X2t6R2LIHCREbD6bINJeBArPwGmj4XOGSiv/0Fwv+zntAcH0tNygpOi6+zKkvXrmMNfWz3ME229y26wSIvVFwRDgYFIMFQ20qh2gzJ+XLzhD1N+RPodx68FeUxNzqUVJnG9h8HAc1WKl7ggclYOQddysyYDBqFEZb5TaCVCcytjY1aPUDwRvdS5VMruJQOEZq4yt5KXkUfJd8IQ8uircryhK6OOedaX8u5nz5JUhC/9waNvF9JY8wri/HCdfIDuW84k7Uex4Ut+d8h+MeRZ3JsbwXcYDQcBZ9ozckBQsrwxjbhrGwLXyeZCuHjftM4zheew87j7BvKYrPoKKKwtnISn6RrUNz7w4F+fk98pTNbvEXylICUQjZ0pNTxkmPye/4LYuzSsL756Tn2mt6jLAYPtpCQ0ywHtYa726ZGIu2G/n0tfpdDqdzv+OPwHhGQAzVU6A0wAAAABJRU5ErkJggg==>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAZCAYAAAA14t7uAAABL0lEQVR4XmNgGAX0BvFAPBeIZyFhED8KWRE5wByIQ4B4KRD/B+IMKF8eWRG5QBCITzNADKYq0AfiT0D8FV2CUhDNAHEtyNVUBZMYIAbPQZegBGgC8VsGSFCAgoRqADkYQJGIDp4xQORPADE/VCwZiJ8D8SMgvg4VwwAg74M0zgdiRjQ5ELAB4nNA/BeIPZDEjYG4E4iZkcTgADmZgVyODcQBcSgDxGXLkcSDGHDrQUlmIBdgA61ALA3EDQyoybGWARI/WMFaBohrQTQ7mhwMZEFpFgaIixUZIAaCDMYAngwQA9HxASQ1MAAKYxgAhXEOEPsBcQCSOMkAFJmgYIABTgZI6pjAgCcYiAEiQMyBJgby2WEg5kUTJwqoAfEFBkgSWwHE3EhyDQyQFDEKhhMAAFbIO3P0k35AAAAAAElFTkSuQmCC>

[image6]: <data:image/png;base64,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>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAAZCAYAAAD6zOotAAAFWUlEQVR4Xu2ZaaivUxTGHxkiU4YMIcfwwRCSoUQ6xlDmW0jIUChTxkzlksyUdIUkSYSkDAkfjiGU8uFmitS5MoQQIUOG9bPedd511/89Jx23e53Tfurpnnev/b577zXv/5UaGhoaGhoa/g/Y3/ig8d7CRXlSw9zF9sYFxsuMfxnv7J4PyJMa5j4w7LPG1augYe5jPeNb8ihumIfYxfiDcZ8qaJgfOFFefzeugoa5j0jPGHhZY1PjRsaVq2AFYTPjTnVwllhVfr61qqAAOfMieFaTv7vcsJvxJ+PvVWDYz7jE+Ic8hVccJJf9Zvwoje9tfFHejV9v/NR4aJKDDeXv4VifGz8xfma8z7hJmgeYOyGfe+HSon+AE70j/87VRZbxmPxKWHGC8WPjV8b3jNsad5Dv6UP5O+t0c9eUn4nzkfneND5qXLeTZ7xmfNt4qfE848HyRnbzTo5eOBN6YC3WJti4uq4kP3PW0WLjq8Z9O/m/wpnyD7xbBR3wvGeM31WB4Xbj9/KDAha9SH7osW4MHGv8Ij0HHpZveO3uGeXdL1fMBjEp4QONGog1T5Hvf5Uiq/jT+ISG5zHGHrfunvnuQuMaUzOkLeUGOF99VsKwLxnvjknyd8+RB0A2BE6UbyoYGiPjMIC5ONsv6t9FR6xJpgWME2xHdM8zgkNxYAzMh4ZA43WjfHMZLH6J8Wv5XRrgqUTyWPcciDJQwRjXswwUjKJxvAy+8bhGr3J7ypU5mcaGQJTjeBOaPq3iAHwLHKPRKCGaLx8Yx8G/6f5Ghh6+7cVTwDmvSM/olux5YBrbw/iz/EYTess6ioxbHX0QpD48HwNXhQbOlqfXiTJO543nZe8iykNBGSh0ovs3g42iyAzq1RKNHoD1OHRej+9dLE99Qxkm4wL5N/P7FTgAPMx4U5ERDO9ruBE9XH0Ps6t8L9f14ilco6WNyXly1gCRUY9Xb8ysI8ZxxNPT2LS4Wf4x6letewAHYKMcDmOGgY6URw6bi/RMA1OjK0CE4+HZ8/k7p+cAXk0/kD0d8IzsS/nBwanyhoUsBIfA3m8w7ihXKPuIjFOxl/FX410ajVLezcbJIMIwBDqY1PR6qJg0PifvVSAZgqwYZeEBeQ1+3fiyvJ5v18lmBBvFCzBuJkbLQKHndn/T3OC9Y8Yz5ArI6RmlRy2pIKrDwwNEUU3PAEWiZJQdYO4d8igmOsgoGJY6HUqdLgNRsxbKMwPOiiHCQSpollAmdXGrIiP6c6QF0AmRTeRHxE2nh1r7OScBwt5gdaqangkoIniZ4WT1P36QhnaWNxjUM5DTHYcb+iWMJoTDv1LGmV/Tc8yl28WAAZwIB4v0jTEP6WTsD6MP/UjD9zAajRv/gfKC3LGHIpG5NFF8N9fiAAZm/QoUzk3iOPUGHtIDqOvOlE0A34oMCSintXT9J9wmjxDA5q9Vr1jSdfYu5g1FJF01DUfNDmy8Ho7mhGhA0Rl0lnSNUcu5SsV1CWVycMpJBXXqqPQcmQtnzcC496S/oxZnsE7dL10w+8V5cMjoaYb0QLbJHTnRPKHRviSjOgAGr6VrVmAjD8nTKlG6hXzzY/KNcgfEaHCR+tRDzaBOHC1X4iPq73wBFEUKxOu5+wW5AmUFgNPka7CP6EpvlUcL4G6IjDqVDUKkvSFf45Y0Ht/60fiUfK9xz3yym3NSJ2eMb+b9s2/q+bj8Xovj1R9xMPRV8qsMdfVK+RUqehwc6Gn5nZt1njeu38kCoSP2tlj9jzOkaPR9lvrSudxBTcK442V8PgDj7S7PCtsUWQWRSXc/dJ+fLWjcxuW9SK3XDQ0NDQ0NDSsYfwM9sS/khkcStwAAAABJRU5ErkJggg==>

[image8]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAZCAYAAACl8achAAACUElEQVR4Xu2WO2gUURSGf0GDj5AoBh8Y0IjERxUQrRQMPjotRDAhpYWNiAgaFYuICFr5wgRsJIWdjYXGwiIBKy0EISkEIQQxIKggKiho/P89M+yZk5ls4YYR3Q8+ljnnzs7dc8+9s0CDBv8mnfRu8Cpd7sYMh3yXy5VCGz1Fv9EZeofupYvcmJN0mv6gt2D3lE4/bMIv6IqQE5rkc7orJsrkEWzSqmIemqwm/VdUOOUtbNKHYiLhNL1HF8REmfyC9ezGmEh4QPtisEyaYVW+EhOOMeT3espauhrVzdvkcvOCqqtK74sJR1Gvb6PP6FnYCTNCD8D2iOhGtfWmEidgG16tthR2nI7TV7CjNuUl/Uhf0wsuXkF9PFdrLKaHQ0wPPAGb0H4X30DfoDpp0Q4bl6J7e5G9T60Xi7aDXqdLQryCjrundFlMJOjHdISYKqsq7Axxocr5yujk+equhSak56ZowgfdtbgJK0IuulkPykNVuZx8ej4VxMUAslXT92slPcdpj7vejuyPEMfCdQZtRE3CV01Lcg7We+tdXKyDLb/aphYaO0kf0yP0GqxHz7gxQuf/fVgR5KVsOh+1x0/6EPbfQq/027TFD0pQVYpOmoWJKWqN77Ce1QmzEvmro8KNJp+76flMtgB9kf44acn0gNZsOkPeUqYcxezW+EC3ulgR2sCb6SBdFXJ/jJYy7whUFQdQ3e2quF5Ko7AK1kJ9r9WNG7JuXKSf6Q1Yrw7RNS6vlXoPO5+/0CcuV8Q7uikG642qtwf2MqkHW2KgQYP/gd/Oo2adVqKTZAAAAABJRU5ErkJggg==>

[image9]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC8AAAAZCAYAAAChBHccAAACLUlEQVR4Xu2WTYhOYRTH/8ok0ohEGsOQlCgLocHsqLEwY6GEYqPYkZS9j4UlkRKJmkYhzYKUqZnl1IiVrBTlIyQRC+Tj/+88R8893TsLb2pu7q9+ve99zjP3Pvc85zzvAA0N/zf76GV6MVPXu/NJk5X1dAcdoK/owXS9OJ80mZlNx+meGKgDq+knuiYG6oAy/gu2A7XjLGzxtWMFfQ8rm3/FHLqWTomBVvGSUcOWoRNI8ad0fogJxT7TB3RZiDkn6CidGcY30CewZ7xJ13Nhc/W8u3ShTy7jEmwBV2IgoWa+D7t5bOgu+pFuCuORL7DkVPXUdxTvsZO2Z9el+BGpxVcdk7vocfqObs7G2+gh+hiWrSqm03v0OV0QYs4Heg5WVuvo6WK4HD8ilZmYVeck3Qh7eP6CvbCXuUmnZuOR7fQYfU2XhpgzSF/QLfQCnVUMl3MLlnV9Tgsx5whscVrkVVh29sNKRls9Uckchi1oG/2J4s7lLKIvYTuknZqQrbBFR2NDib70qd4Yhm1rfxpTRqtKZiU9TzvpXtj99RJlqN/u0K+0O8RawrdaC1V9H4Vlx3ejrGTUD2foNdg/erdhmT+QT0porhKyCsXabxk1tO+Gsqa6VJ+IDvosfY+oVFQyjv+WKAE5Wvip9F1J8Npf8mfGXzCPjtAfdAh2bGkByvRy+hB2tqsUtBOOXvRGGr9OZ6Txt2nsGx2DHb3+94/SnB7Ycezzqg6QhoaGuvAbep5y9ItAE3AAAAAASUVORK5CYII=>

[image10]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAZCAYAAABHLbxYAAACRklEQVR4Xu2WzUtVQRjG3zBDMVArCinI3ISrkD4gqGjRoha2CBeh62gTLYJq66Z/QIIgQlcRQaBg5cKolkWrFhIILpIiKCwQjL6onp/zzr3TdMR7W53gPPDjnnlmzpw577zznmtW6Z+0V9wUw6I96yuF2sS0uOPts+KnOF0bURKx0Enx0tv7xYq4WhtRIrWKTX5NJIkokS2tyE3S4JHozPpKpVuiIzfLpgNWP+0Hxbmkr6aurL29wKON35L5CI88S7Uj87jG25x4UYfEYzEkRsSUOPXHCOmMWBIzYou4IBbFN/fIFd7wjfgoPoijq3cG0X9ffLEwV694It4nHpF6a2GOH2LcPcRWk5O/EpbFPu9f1UkLRXbMB9wQG71v0L15sdu9bWJOLHibh921UFJ42U9iwPuI3FMLc1xxD51371LirSvCe8zChO9EX9LHRExIhKP6LSzogbdJh4sWFsXYa+4jtpkXeuXXUQSF8nMi8RoWDyf88cQR1Xvis4VtjyJ/WNBo4kXhp3l1RHwXt8UG97rFCwspsMe9prRWNNhmthuxeD5zX8Vh96KI6Fo7wlZHcR/3M09MsabUSDSIAJF4ZuEAkcNRpES6I6hoR0YtPIuvDvP2JH3riigUPYTvLYckim8vi+clOFy7kj52Iy8njJ2w+ouyqNcW5qZUXXa/YR23v/8APLd65KIoF5ScWe+P4htN3duZeChGLoqtvm6hTD3066ZEsc6LOKe5qDDzT4fI8JuqaCy5nc9LdLc6MdKVKlWq9L/qN3VecRFNQiaZAAAAAElFTkSuQmCC>
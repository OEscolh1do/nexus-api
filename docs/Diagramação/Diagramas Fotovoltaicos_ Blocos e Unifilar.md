# **Análise Técnica de Documentação e Representação Gráfica em Sistemas Fotovoltaicos: Normatização, Simbologia e Protocolos de Homologação**

A evolução da matriz energética brasileira, marcada pelo crescimento exponencial da micro e minigeração distribuída, estabeleceu um novo paradigma para a engenharia elétrica nacional. Com a potência instalada ultrapassando a marca de 53.000 MW em 2024, a qualidade técnica dos projetos e a precisão da documentação submetida às concessionárias tornaram-se pilares fundamentais para a segurança operacional e a viabilidade econômica do setor.1 No âmago deste processo, encontram-se os diagramas técnicos — especificamente o diagrama de blocos e o diagrama unifilar — que funcionam como a linguagem universal entre projetistas, instaladores e analistas das distribuidoras de energia. A correta representação destes sistemas não apenas garante a aprovação célere nos processos de parecer de acesso, mas assegura que as normas de proteção contra sobrecorrentes, sobretensões e falhas de isolação sejam rigorosamente observadas, mitigando riscos de incêndios e danos estruturais.1

## **O Framework Normativo e a Base Legal dos Projetos Fotovoltaicos**

O desenvolvimento de qualquer projeto fotovoltaico no Brasil deve ser fundamentado em um arcabouço normativo robusto, liderado pela ABNT NBR 16690:2019, que define os requisitos de projeto para instalações elétricas de arranjos fotovoltaicos.3 Esta norma, considerada o guia mestre para a tecnologia, estabelece diretrizes sobre o comportamento de condutores, dispositivos de proteção e manobra em corrente contínua (CC), abordando as particularidades dessa fonte de energia que, diferentemente das fontes convencionais, possui características de corrente de curto-circuito limitadas, exigindo estratégias de proteção diferenciadas.1

Além da NBR 16690, a interconectividade com a ABNT NBR 5410:2004 é mandatória, uma vez que a interface de conexão com a rede elétrica de baixa tensão e as instalações internas da unidade consumidora devem seguir as diretrizes gerais de segurança para instalações elétricas.1 Para sistemas que operam em média tensão, a conformidade estende-se às normas específicas das concessionárias, como a NT.002.EQTL da Equatorial Energia, enquanto a microgeração em baixa tensão é regida por normas como a NT.020.EQTL.6 Este cenário exige que o projetista tenha uma compreensão holística das referências, incluindo a NBR 16149 e a NBR 16150, que tratam das características da interface de conexão e dos procedimentos de ensaio de conformidade para inversores.7

### **Classificação e Terminologia segundo as Normas ABNT**

A precisão terminológica é o primeiro passo para a representação técnica adequada. De acordo com a NBR 10899, a terminologia solar fotovoltaica deve ser aplicada de forma rigorosa nos memoriais descritivos e diagramas.8 A distinção entre módulo, série (string) e arranjo é vital: um módulo é a menor unidade geradora encapsulada; uma série fotovoltaica consiste em módulos conectados eletricamente em série para atingir a tensão desejada; e o arranjo fotovoltaico é o conjunto mecânico e eletricamente integrado de séries e painéis.4

| Norma | Título / Assunto | Relevância para o Projeto |
| :---- | :---- | :---- |
| ABNT NBR 16690 | Instalações elétricas de arranjos fotovoltaicos — Requisitos de projeto | Base para dimensionamento de cabos CC e proteção de séries. |
| ABNT NBR 5410 | Instalações elétricas de baixa tensão | Rege a proteção CA, aterramento e seccionamento geral. |
| ABNT NBR 16149 | Sistemas fotovoltaicos — Interface de conexão com a rede | Define parâmetros de tensão, frequência e injeção de harmônicos. |
| ABNT NBR IEC 62116 | Procedimento de ensaio de anti-ilhamento | Garante a desconexão automática em caso de falta na rede. |
| Equatorial NT.020 | Conexão de Micro e Minigeração Distribuída | Define os padrões documentais e técnicos para homologação. |

## **Diagrama de Blocos: A Arquitetura Lógica e Funcional**

O diagrama de blocos é uma representação esquemática de alto nível que descreve as funções principais do sistema e a relação hierárquica entre seus componentes macroscópicos. Em sistemas fotovoltaicos, ele é frequentemente exigido pelas concessionárias para unidades com potência instalada superior a 10 kW, servindo como uma ferramenta de triagem inicial para os analistas entenderem a topologia do sistema antes de mergulharem nos detalhes do diagrama unifilar.9

### **Simbologia Técnica e Representação em Blocos**

Diferente do diagrama unifilar, que utiliza símbolos gráficos específicos para cada componente elétrico, o diagrama de blocos utiliza retângulos rotulados para representar subsistemas complexos. A simbologia, neste contexto, foca na direção do fluxo de potência e nos pontos de transição de energia.10

1. **Geração (Bloco PV):** Representa o arranjo fotovoltaico completo. Em sistemas mais complexos, este bloco pode ser subdividido em sub-arranjos ou áreas de telhado distintas.  
2. **Conversão (Inversor):** O bloco central que processa a energia CC para CA. Deve conter informações sobre a presença de transformadores internos ou isolação galvânica, se aplicável.8  
3. **Proteção CC e CA:** Representados como blocos de transição (stringboxes) que garantem a segurança entre a geração e a conversão, e entre a conversão e a rede.10  
4. **Armazenamento (Baterias):** Em sistemas com armazenamento, um bloco específico é posicionado entre a geração e o inversor (em sistemas acoplados em CC) ou conectado ao barramento CA.4  
5. **Interface de Conexão e Medição:** Bloco que simboliza o ponto de entrega, contendo o medidor bidirecional e a conexão física com a rede de distribuição.10

A relevância do diagrama de blocos aumentou significativamente com a introdução de sistemas de limitação de injeção, conhecidos como "Grid-Zero" ou "Zero Export". A nota técnica NT.020.EQTL estabelece que, para tais sistemas, o diagrama de blocos deve detalhar os sensores de corrente (TCs) e a lógica de controle que impede que a energia gerada flua para a rede da distribuidora.10 Esta configuração é frequentemente utilizada para contornar problemas de inversão de fluxo em transformadores da rede que já atingiram sua capacidade de recepção de energia.12

## **Diagrama Unifilar: A Engenharia de Detalhe e a Conformidade com a IEC 60617**

Se o diagrama de blocos é o mapa da estratégia, o diagrama unifilar é o manual de execução. Ele detalha de forma exaustiva a fiação, os dispositivos de seccionamento, as proteções contra surtos e sobrecorrentes, e o sistema de aterramento.5 No Brasil, a ausência de normas nacionais vigentes para simbologia gráfica (devido ao cancelamento das NBRs 12519 a 12529 em 2012\) consolidou a norma internacional IEC 60617 como a referência técnica absoluta para a representação de sistemas fotovoltaicos.14

### **Simbologia Técnica Avançada em Sistemas Unifilares**

A aplicação correta da simbologia IEC 60617 é um requisito para a aceitação do projeto por engenheiros de concessionárias. Um erro comum é a utilização de símbolos genéricos de corrente alternada para componentes de corrente contínua, o que demonstra falta de rigor técnico e pode levar à reprovação por risco de interpretação errônea durante a vistoria.16

* **Módulos Fotovoltaicos:** São representados por um retângulo contendo o símbolo de gerador fotovoltaico (geralmente uma linha inclinada com setas de radiação incidindo sobre ela). No diagrama unifilar, deve constar a potência unitária de cada módulo e a configuração da série (ex: 10 módulos de 550 Wp).5  
* **Inversor de Frequência CC/CA:** Representado por um quadrado dividido diagonalmente, com o símbolo de "=" no triângulo superior (CC) e "\~" no inferior (CA). É imperativo indicar se o inversor possui DPS interno ou se requer proteção externa.5  
* **Dispositivos de Proteção contra Surtos (DPS):** Essenciais para a proteção contra descargas atmosféricas. No diagrama, os DPS devem ser mostrados com sua conexão à terra, especificando a classe (Classe I, II ou combinada) e a tensão de operação máxima contínua (![][image1]) compatível com o sistema.1  
* **Dispositivos de Proteção contra Sobrecorrente:** Fusíveis CC devem ser representados como retângulos com o condutor atravessando-os, enquanto disjuntores CA utilizam o símbolo de seccionamento automático térmico e magnético.4  
* **Seccionamento:** A NBR 16690 exige um dispositivo interruptor-seccionador capaz de abrir o circuito sob carga no lado CC, permitindo a manutenção segura do inversor sem o desligamento total do arranjo fotovoltaico.4

| Componente | Símbolo IEC 60617 (Descrição) | Parâmetro Crítico no Diagrama |
| :---- | :---- | :---- |
| Condutor CC | Linha contínua com indicação de polaridade (+) e (-) | Seção nominal (![][image2]), material e isolação. |
| Inversor | Bloco conversor estático CC-CA | Potência nominal (kW) e eficiência. |
| Fusível PV | Retângulo sólido com linha central | Corrente nominal e capacidade de interrupção em CC. |
| DPS | Símbolo de limitador de tensão não-linear | Corrente de descarga nominal (![][image3]) e ![][image1]. |
| Aterramento | Três traços horizontais decrescentes | Continuidade elétrica das molduras dos módulos. |

## **Diferenças Fundamentais: Do Conceito à Implementação**

A distinção entre o diagrama de blocos e o unifilar reside na profundidade da informação e no objetivo da análise. O diagrama de blocos é uma ferramenta de **coordenação de sistema**, enquanto o unifilar é uma ferramenta de **coordenação de proteção e instalação**.9

Enquanto o diagrama de blocos permite visualizar se o inversor é compatível com a carga da unidade consumidora ou se há limitação de exportação, o unifilar permite calcular a queda de tensão nos condutores e verificar se a seletividade da proteção está garantida.5 Um sistema fotovoltaico bem projetado utiliza o diagrama de blocos para definir a estratégia operacional (ex: autoconsumo com baterias) e o unifilar para garantir que essa estratégia não comprometa a segurança elétrica da edificação.4

As concessionárias, como a Equatorial Energia, exigem ambos para sistemas maiores justamente para validar essas duas dimensões. O analista usa o diagrama de blocos para verificar o impacto na rede (inversão de fluxo) e o unifilar para verificar se o padrão de entrada e a proteção anti-ilhamento atendem às normas de segurança da distribuidora.10

## **O Memorial Técnico Descritivo: O Complemento Textual dos Diagramas**

Nenhum diagrama é autossuficiente. A norma NT.020.EQTL estabelece o Memorial Técnico Descritivo (Anexo III) como o documento que fornece o contexto e os cálculos por trás das representações gráficas.8 Este documento deve descrever a metodologia utilizada para o dimensionamento, detalhando 7:

1. **Dados do Titular e da Unidade Consumidora:** Localização, coordenadas geográficas e histórico de consumo.20  
2. **Especificações dos Equipamentos:** Lista detalhada de módulos e inversores, incluindo o número de registro no INMETRO e certificados internacionais de conformidade.10  
3. **Dimensionamento de Cabos:** Cálculos de queda de tensão, que não devem exceder os limites normativos (geralmente 1% no lado CC e 1% a 2% no lado CA para otimização de eficiência).5  
4. **Estudo de Proteção:** Justificativa para a escolha dos disjuntores e fusíveis, baseada na corrente de curto-circuito do arranjo e na corrente máxima do inversor.1  
5. **Aterramento e Proteção contra Descargas Atmosféricas:** Descrição do sistema de equipotencialização e a análise de risco simplificada para instalação de DPS.1

A ausência de correlação entre os dados apresentados no memorial e os diagramas é um dos motivos de reprovação mais comuns. Por exemplo, se o memorial cita um inversor de 10 kW e o diagrama unifilar mostra um de 12 kW, o projeto será devolvido por inconsistência técnica.22

## **Boas Práticas para Aprovação Junto às Concessionárias**

O processo de homologação é, muitas vezes, o gargalo de projetos fotovoltaicos. A experiência com concessionárias como Equatorial, CEMIG e CPFL revela que a atenção aos detalhes burocráticos e técnicos é o diferencial para uma aprovação sem pendências.16

### **Mitigação de Rejeições Técnicas**

As causas frequentes de reprova podem ser divididas em categorias documentais e categorias de instalação, sendo que as primeiras ocorrem durante a análise do projeto e as últimas durante a vistoria física.16

* **Padrão de Entrada e Medição:** O medidor bidirecional deve ser instalado em um padrão que siga rigorosamente as normas técnicas de fornecimento em baixa tensão (como a NT.001.EQTL). Caixas de medição danificadas, sem aterramento adequado ou com difícil acesso aos funcionários da distribuidora resultam em reprovação imediata.6  
* **Proteção Anti-ilhamento:** O inversor deve possuir a função de anti-ilhamento certificada. O diagrama unifilar deve mostrar que não há possibilidade de o sistema injetar energia na rede quando esta estiver desligada para manutenção, protegendo a vida dos eletricistas da concessionária.7  
* **Identificação e Placas de Advertência:** É mandatória a instalação de placas de advertência com os dizeres "Cuidado: Risco de Choque Elétrico \- Geração Própria" no quadro geral e junto ao medidor. No projeto, a localização dessas placas deve ser indicada.8  
* **Dimensionamento da Proteção CC:** Diferente dos circuitos CA, as séries fotovoltaicas requerem fusíveis dimensionados para correntes de falta muito específicas. A NBR 16690 detalha que, em sistemas com mais de duas séries em paralelo, a proteção individual de cada série é obrigatória para evitar correntes reversas que podem incendiar os módulos.1

### **O Impacto da Revisão 05 da NT.020.EQTL (2024/2025)**

As recentes atualizações nas normas da Equatorial Energia trouxeram exigências mais rígidas quanto à inversão de fluxo (Art. 655-M da REN 1000/2021). O projeto agora deve incluir, em muitos casos, o **Anexo V** — Termo de Aceite de Condições para Dispensa da Análise de Inversão de Fluxo — ou propor soluções técnicas de "Grid-Zero" representadas claramente no diagrama de blocos.10 Além disso, a obrigatoriedade de inversores estarem adequados à Portaria INMETRO nº 140/2022 para sistemas até 10 kW já está em vigor, e para sistemas maiores o prazo se estende até maio de 2025\.10

| Item de Verificação | Requisito de Boas Práticas | Referência Normativa |
| :---- | :---- | :---- |
| Diagrama Unifilar | Especificação completa de cabos (Seção e Norma) | NBR 16690 / NBR 16612 |
| Stringbox | Uso de chaves seccionadoras CC específicas | NBR 16690 |
| Aterramento | Interligação de todas as massas metálicas | NBR 5410 / NBR 5419 |
| Inversor | Certificado de conformidade e registro INMETRO | NT.020 / Portaria 140 |
| Sinalização | Instalação de placas fotoluminescentes de advertência | NT.020 / NR 10 |

## **Segurança e Prevenção de Falhas: O Papel dos Dispositivos de Proteção**

A representação técnica de sistemas fotovoltaicos não visa apenas a aprovação burocrática, mas a garantia de uma operação segura por mais de 25 anos. O arco elétrico em corrente contínua é uma das maiores preocupações de segurança, pois, diferentemente da corrente alternada, a CC não possui passagem pelo zero, o que torna o arco extremamente difícil de extinguir uma vez iniciado.1

A tecnologia **AFCI (Arc Fault Circuit Interrupter)**, mencionada em estudos avançados de proteção, começa a ser exigida em mercados internacionais e sua representação nos diagramas unifilares brasileiros demonstra um nível superior de cuidado técnico.1 No Brasil, o foco permanece na correta seletividade de fusíveis e na robustez das conexões elétricas. Cabos aparentes e sem proteção mecânica, além de serem erros graves de instalação, são frequentemente apontados em vistorias da concessionária como riscos à segurança.2

### **Coordenação entre DPS CC e CA**

Um erro conceitual comum é acreditar que o DPS do lado CA protege o inversor contra surtos vindos dos painéis. O diagrama unifilar deve mostrar claramente a separação entre a proteção de surto CC (instalada na stringbox, antes do inversor) e a proteção CA (instalada no quadro de saída). A energia de um surto atmosférico que atinge a estrutura metálica dos painéis pode percorrer os cabos CC e destruir a ponte de transistores do inversor se não houver um caminho de baixa impedância para a terra provido pelo DPS CC.1

A representação do aterramento no diagrama deve ser feita de forma a mostrar que o sistema fotovoltaico utiliza o mesmo potencial de terra da edificação, evitando diferenças de potencial perigosas entre massas metálicas durante uma descarga. O uso de condutores de proteção (verde/amarelo) com seção adequada é verificado com rigor durante a fiscalização física das concessionárias.1

## **Perspectivas Futuras e a Digitalização dos Projetos**

O futuro da representação técnica caminha para a integração com modelos BIM (Building Information Modeling) e a automatização da análise por parte das concessionárias. No entanto, a base da engenharia permanece a mesma: a clareza na tradução de um sistema físico para um modelo gráfico normatizado. A introdução de sistemas de armazenamento por baterias (BESS) e a popularização dos veículos elétricos integrados à microgeração exigirão diagramas de blocos e unifilares cada vez mais complexos, incorporando conversores bidirecionais e sistemas de gerenciamento de energia (EMS).4

A Lei 14.300/2022 e a transição para o novo regime de compensação de energia (GD II e GD III) trouxeram a necessidade de maior precisão no histórico de consumo e na estimativa de geração, dados estes que devem constar no memorial descritivo para justificar o dimensionamento do sistema e evitar o superdimensionamento, que pode ser questionado pelas distribuidoras em casos de restrição de rede.25

## **Síntese Técnica e Recomendações Finais**

A excelência em projetos fotovoltaicos é alcançada através da simbiose entre o rigor normativo e a clareza de representação. O diagrama de blocos deve ser utilizado para estabelecer a lógica de operação e controle, especialmente em sistemas com baterias ou restrição de exportação, enquanto o diagrama unifilar deve ser o mapa detalhado da segurança elétrica, seguindo a simbologia da IEC 60617\.10

Para profissionais que buscam a aprovação de primeira em concessionárias como a Equatorial Energia, recomenda-se:

1. Utilizar os modelos de memoriais e diagramas fornecidos nos anexos das notas técnicas vigentes (NT.020.EQTL Rev. 05), garantindo que não haja discrepâncias entre os documentos.8  
2. Manter-se atualizado quanto às portarias do INMETRO e certificados de conformidade dos inversores, anexando-os de forma organizada ao pedido de acesso.10  
3. Priorizar a segurança em corrente contínua, utilizando dispositivos de seccionamento e proteção dimensionados especificamente para a tecnologia fotovoltaica, evitando o uso inadequado de componentes projetados para corrente alternada.1  
4. Realizar uma vistoria prévia rigorosa na unidade consumidora para assegurar que o padrão de entrada e o sistema de aterramento existente suportarão a nova carga geradora, evitando surpresas durante a inspeção final da concessionária.8

A representação técnica não é meramente um trâmite administrativo, mas o compromisso do engenheiro com a integridade do sistema e a proteção da vida. O domínio das normas ABNT e das diretrizes das distribuidoras é, portanto, a garantia de que a expansão da energia solar no Brasil continuará a ocorrer de forma segura, sustentável e tecnicamente sólida.

#### **Referências citadas**

1. PROTEÇÃO EM SISTEMAS FOTOVOLTAICOS: Uma análise da NBR 16690:2019 e sua contextualização com a NBR 5410:2010 \- RI UFPE, acessado em maio 15, 2026, [https://repositorio.ufpe.br/bitstream/123456789/67342/1/TCC%20J%C3%BAlio%20Domingos%20Gon%C3%A7alo%20Neto.pdf](https://repositorio.ufpe.br/bitstream/123456789/67342/1/TCC%20J%C3%BAlio%20Domingos%20Gon%C3%A7alo%20Neto.pdf)  
2. 5 erros mais comuns no projeto e instalação do sistema de energia solar, acessado em maio 15, 2026, [https://elysia.com.br/erros-comuns-projeto-instalacao-energia-solar/](https://elysia.com.br/erros-comuns-projeto-instalacao-energia-solar/)  
3. ABNT NBR 16690 NBR16690 Instalações elétricas \- Target Normas, acessado em maio 15, 2026, [https://www.normas.com.br/visualizar/abnt-nbr-nm/11499/abnt-nbr16690-instalacoes-eletricas-de-arranjos-fotovoltaicos-requisitos-de-projeto](https://www.normas.com.br/visualizar/abnt-nbr-nm/11499/abnt-nbr16690-instalacoes-eletricas-de-arranjos-fotovoltaicos-requisitos-de-projeto)  
4. NBR-16690-2019-consulta-publica.pdf, acessado em maio 15, 2026, [https://www.solarize.com.br/downloads/manual-energia-solar/NBR-16690-2019-consulta-publica.pdf](https://www.solarize.com.br/downloads/manual-energia-solar/NBR-16690-2019-consulta-publica.pdf)  
5. GUIA DE BOAS PRÁTICAS EM SISTEMAS FOTOVOLTAICOS, acessado em maio 15, 2026, [https://cooperacaobrasil-alemanha.com/SEF/Guia\_de\_Boas\_Praticas\_Sitemas\_Fotovoltaicos.pdf](https://cooperacaobrasil-alemanha.com/SEF/Guia_de_Boas_Praticas_Sitemas_Fotovoltaicos.pdf)  
6. Normas Técnicas \- Equatorial Energia – PA, acessado em maio 15, 2026, [https://pa.equatorialenergia.com.br/siteantigo/institucional/normas-tecnicas/](https://pa.equatorialenergia.com.br/siteantigo/institucional/normas-tecnicas/)  
7. MICROGERAÇÃO DISTRIBUÍDA UTILIZANDO UM SISTEMA DE MINIGERAÇÃO DE 125,00kW, acessado em maio 15, 2026, [https://licitacao.fiepi.com.br/media/documentos/24012023\_MEMORIAL\_T%C3%89CNICO\_DESCRITIVO\_ZRD4LJ2.pdf](https://licitacao.fiepi.com.br/media/documentos/24012023_MEMORIAL_T%C3%89CNICO_DESCRITIVO_ZRD4LJ2.pdf)  
8. NT.00020.EQTL-05-Anexo-III-Modelo-de-Memorial-Tecnico-Descritivo.docx \- CEEE Equatorial, acessado em maio 15, 2026, [https://ceee.equatorialenergia.com.br/wp-content/uploads/2025/12/NT.00020.EQTL-05-Anexo-III-Modelo-de-Memorial-Tecnico-Descritivo.docx](https://ceee.equatorialenergia.com.br/wp-content/uploads/2025/12/NT.00020.EQTL-05-Anexo-III-Modelo-de-Memorial-Tecnico-Descritivo.docx)  
9. Como elaborar o Diagrama de Blocos Fotovoltaico \- YouTube, acessado em maio 15, 2026, [https://www.youtube.com/watch?v=IAoZWKOizY0](https://www.youtube.com/watch?v=IAoZWKOizY0)  
10. CONEXÃO DE MICRO E MINIGERAÇÃO ... \- CEEE Equatorial, acessado em maio 15, 2026, [https://ceee.equatorialenergia.com.br/wp-content/uploads/2025/12/NT.00020.EQTL-05-Conexao-de-Micro-e-Minigeracao-Distribuida-ao-Sistema-de-Distribuicao.pdf](https://ceee.equatorialenergia.com.br/wp-content/uploads/2025/12/NT.00020.EQTL-05-Conexao-de-Micro-e-Minigeracao-Distribuida-ao-Sistema-de-Distribuicao.pdf)  
11. Diagrama Unifilar de Microgeração BT | PDF | Engenharia Elétrica | Eletricidade \- Scribd, acessado em maio 15, 2026, [https://pt.scribd.com/document/686793232/DIAGRAMA-UNIFILAR-MICROGERACAO](https://pt.scribd.com/document/686793232/DIAGRAMA-UNIFILAR-MICROGERACAO)  
12. download \- CEEE Equatorial, acessado em maio 15, 2026, [https://ceee.equatorialenergia.com.br/wp-content/uploads/2025/12/NT.00020.EQTL-05-Anexo-V-Termo-de-Aceite-de-Condicoes-para-Dispensa-da-Analise-de-Inversao-de-Fluxo.docx](https://ceee.equatorialenergia.com.br/wp-content/uploads/2025/12/NT.00020.EQTL-05-Anexo-V-Termo-de-Aceite-de-Condicoes-para-Dispensa-da-Analise-de-Inversao-de-Fluxo.docx)  
13. Memorial técnico descritivo e diagrama Unifilar Equatorial Pará (microgeração) \- YouTube, acessado em maio 15, 2026, [https://www.youtube.com/watch?v=YhjcJuQGbxY](https://www.youtube.com/watch?v=YhjcJuQGbxY)  
14. Simbologia da Norma IEC 60617 | PDF | Europa | União Europeia \- Scribd, acessado em maio 15, 2026, [https://pt.scribd.com/document/652944311/Norma-IEC-60617](https://pt.scribd.com/document/652944311/Norma-IEC-60617)  
15. Simbologia Elétrica Industrial: Normas ABNT | PDF \- Scribd, acessado em maio 15, 2026, [https://www.scribd.com/document/135759301/Simbologia-para-instalacoes-eletricas-industriais](https://www.scribd.com/document/135759301/Simbologia-para-instalacoes-eletricas-industriais)  
16. Os motivos que mais reprovam o projeto fotovoltaico na vistoria (comissionamento técnico), acessado em maio 15, 2026, [https://www.youtube.com/watch?v=deo3gh0CgG8](https://www.youtube.com/watch?v=deo3gh0CgG8)  
17. Diagrama Unifilar com INVERSOR CONVENCIONAL \- YouTube, acessado em maio 15, 2026, [https://www.youtube.com/watch?v=FM3zmeTRM5k](https://www.youtube.com/watch?v=FM3zmeTRM5k)  
18. Diagrama Unifilar Fotovoltaico | PDF \- Scribd, acessado em maio 15, 2026, [https://www.scribd.com/document/342925739/Paulo-Cesar-Diagrama-Unifilar-Basico](https://www.scribd.com/document/342925739/Paulo-Cesar-Diagrama-Unifilar-Basico)  
19. Memorial Técnico de Microgeração Distribuída | PDF | Distribuição de energia elétrica | Potência (Física) \- Scribd, acessado em maio 15, 2026, [https://pt.scribd.com/document/639982034/NT-00020-EQTL-04-ANEXO-III-Modelo-de-Memorial-Tecnico-Descritivo](https://pt.scribd.com/document/639982034/NT-00020-EQTL-04-ANEXO-III-Modelo-de-Memorial-Tecnico-Descritivo)  
20. Checklist para Micro e Minigeração Solar | PDF | Medição | Eletricidade \- Scribd, acessado em maio 15, 2026, [https://pt.scribd.com/document/874077163/Checklist-Solicitacao-de-Projeto-1](https://pt.scribd.com/document/874077163/Checklist-Solicitacao-de-Projeto-1)  
21. Cartilha de Geração Distribuída. \- CEA Grupo Equatorial Energia, acessado em maio 15, 2026, [https://ap.equatorialenergia.com.br/wp-content/uploads/2025/01/Cartilha-GD-v2-1.pdf](https://ap.equatorialenergia.com.br/wp-content/uploads/2025/01/Cartilha-GD-v2-1.pdf)  
22. Os três maiores motivos de reprova de projetos fotovoltaicos \- YouTube, acessado em maio 15, 2026, [https://www.youtube.com/watch?v=DOPSrSQk704](https://www.youtube.com/watch?v=DOPSrSQk704)  
23. Empresas de energia solar enfrentam dificuldades com a Equatorial em Goiás \- YouTube, acessado em maio 15, 2026, [https://www.youtube.com/watch?v=cdXouh0jHxA](https://www.youtube.com/watch?v=cdXouh0jHxA)  
24. Nota Técnica 001/2025 – NT.00020 Conexão de Micro e Minigeração Distribuída ao Sistema de Distribuição \- CEEE Equatorial, acessado em maio 15, 2026, [https://ceee.equatorialenergia.com.br/wp-content/uploads/2025/12/Nota-Tecnica-001\_2025-NT.00020.EQTL-Conexao-de-Micro-e-Minigeracao-Distribuida-ao-Sistema-de-Distribuicao.pdf](https://ceee.equatorialenergia.com.br/wp-content/uploads/2025/12/Nota-Tecnica-001_2025-NT.00020.EQTL-Conexao-de-Micro-e-Minigeracao-Distribuida-ao-Sistema-de-Distribuicao.pdf)  
25. Geração distribuída \- Equatorial Energia – CEEE, acessado em maio 15, 2026, [https://ceee.equatorialenergia.com.br/sua-conta/geracao-distribuida/](https://ceee.equatorialenergia.com.br/sua-conta/geracao-distribuida/)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAZCAYAAAAxFw7TAAABPElEQVR4Xu2UvUuCURSHT0NgGGkQNEYNrQaBk1utOTQJLU6NEi66i9BctLiIU0tLQ5uLmx//huDY1hD08ftx7gvX431vWY4+8CCec99zP95zX5E1q+IYdoy3MO+N6Zn8iZdbYA/ewDf4BR/gGdz0xtTgDL7DO9FnojREi03grskRFhjDkk2k8SJakLOHYCEW/HFlCVPRgmWbcNRhF27YRBqfomd0ZBOOJ3hlg2lsi66ubRMeAwmfbRCuiis8twmPtLMNwnOLbTcDL20wBlumD7M24eBEhzYYgwV5E0Lwrbbc76/hS3mFRS+2BZuijX7gxRPYk1XRidhShbms6JY/4LPoXeU1vIc7/iAHiwxhzv3nhAs7YIAfiYpovyWDQ+xLvMWW5hRe2OB/GcFr0XN+NLk/wU8bt84XumaFfAPGBDDLU1kZ9wAAAABJRU5ErkJggg==>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAZCAYAAABHLbxYAAACRklEQVR4Xu2WzUtVQRjG3zBDMVArCinI3ISrkD4gqGjRoha2CBeh62gTLYJq66Z/QIIgQlcRQaBg5cKolkWrFhIILpIiKCwQjL6onp/zzr3TdMR7W53gPPDjnnlmzpw577zznmtW6Z+0V9wUw6I96yuF2sS0uOPts+KnOF0bURKx0Enx0tv7xYq4WhtRIrWKTX5NJIkokS2tyE3S4JHozPpKpVuiIzfLpgNWP+0Hxbmkr6aurL29wKON35L5CI88S7Uj87jG25x4UYfEYzEkRsSUOPXHCOmMWBIzYou4IBbFN/fIFd7wjfgoPoijq3cG0X9ffLEwV694It4nHpF6a2GOH2LcPcRWk5O/EpbFPu9f1UkLRXbMB9wQG71v0L15sdu9bWJOLHibh921UFJ42U9iwPuI3FMLc1xxD51371LirSvCe8zChO9EX9LHRExIhKP6LSzogbdJh4sWFsXYa+4jtpkXeuXXUQSF8nMi8RoWDyf88cQR1Xvis4VtjyJ/WNBo4kXhp3l1RHwXt8UG97rFCwspsMe9prRWNNhmthuxeD5zX8Vh96KI6Fo7wlZHcR/3M09MsabUSDSIAJF4ZuEAkcNRpES6I6hoR0YtPIuvDvP2JH3riigUPYTvLYckim8vi+clOFy7kj52Iy8njJ2w+ouyqNcW5qZUXXa/YR23v/8APLd65KIoF5ScWe+P4htN3duZeChGLoqtvm6hTD3066ZEsc6LOKe5qDDzT4fI8JuqaCy5nc9LdLc6MdKVKlWq9L/qN3VecRFNQiaZAAAAAElFTkSuQmCC>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAZCAYAAAA8CX6UAAAA9UlEQVR4Xu2SLw+BURSHj/lXmNk0waYJJgiKqAgkiSCSRMGnMJOMSaYQ9bcJsij4AIpN5nd2Lju76d5X5Nmevffcc3Z2z3sv0R9f+nAFF0qOu7rIhRrswA18wqGJC7rIlSw8kTT6igq8w4ed8KVHcho+1VfMSBot7YQPJXgjGY1HDI0ei396aHgcbrSGESvnjL52Pllo9LVXrZwXe5LT8Dep9otwBOtwTDJyBh5hS9VRk6SBbWDyZZLbHMCU2ePmV9gwsTMxuFNxG15gXu05kYNns+amWziH6U+FIzxWYNY83gFO4eRd4EocJlQcJXkuod/aL/ICVNkuTXT5XJ0AAAAASUVORK5CYII=>
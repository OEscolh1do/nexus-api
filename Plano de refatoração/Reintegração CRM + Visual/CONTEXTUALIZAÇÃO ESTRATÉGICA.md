---

# CONTEXTUALIZAÇÃO ESTRATÉGICA: A Reintegração do CRM (O Paradigma *Project Hub*)

**Fase Atual:** Refatoração Visual e UX do Kurupira (Frontend B2B)

**Objetivo:** Consumir dados comerciais sem herdar a interface de vendas.

## **1\. O Que Estamos a Fazer? (A Visão Executiva)**

Após concluirmos a cisão física e arquitetural (Backend/Docker) entre o sistema de gestão (**Iaçã**) e o motor de engenharia (**Kurupira**), iniciamos agora a refatoração da interface de utilizador (UI) do Kurupira.

O objetivo desta fase é **reintegrar o contexto comercial (CRM) na rotina da engenharia, mas com uma "cara de engenharia"**. Em vez de forçar o engenheiro a navegar por um funil de vendas tradicional para encontrar os dados do cliente, estamos a transformar a porta de entrada do Kurupira num autêntico **Centro de Controlo de Projetos (*Project Hub*)**.

## **2\. Por Que o Estamos a Fazer? (O Problema do Modelo Mental)**

A engenharia e as vendas operam sob modelos mentais e vocabulários diametralmente opostos.

* **O Mundo das Vendas (Iaçã):** Pensa em "Leads", "Oportunidades", "Taxas de Conversão" e "Funis". A interface ideal é uma tabela densa ou um Kanban (*drag-and-drop*).  
* **O Mundo da Engenharia (Kurupira):** Pensa em "Sítios" (*Sites*), "Ficheiros", "Coordenadas" e "Perfis de Carga". A interface ideal é visual, espacial e focada em parâmetros imutáveis.

Se um engenheiro abre a sua ferramenta de trabalho e se depara com um ecrã a perguntar "Qual é a probabilidade de fechar este negócio?", a ferramenta falhou na sua proposta de valor. A carga cognitiva aumenta e o foco técnico perde-se.

Fazer a reintegração com "cara de engenharia" significa **traduzir o contexto comercial para parâmetros técnicos**, permitindo que o engenheiro consuma a informação de que precisa (nome, morada, histórico de consumo) através de uma interface inspirada em ferramentas de autoria de classe mundial (como AutoCAD, Revit ou Reonic).

## **3\. O Paradigma *Project Hub* (A Solução Visual)**

Para materializar esta reintegração, abandonamos o conceito de "Lista de Clientes" e implementamos três novos momentos de interação:

### **A. O Explorador de Projetos (Visual-First)**

A página inicial do Kurupira deixa de ser uma tabela HTML aborrecida. Passa a ser uma grelha de cartões visuais. O foco de cada cartão é um *thumbnail* (miniatura) do mapa de satélite da instalação. O engenheiro não procura apenas por um nome; ele procura visualmente pelo telhado que vai dimensionar, filtrando por parâmetros técnicos (Tensão, Potência Alvo).

### **B. O Contexto 360º (Mestre-Detalhe)**

Quando o engenheiro seleciona um projeto, o sistema não abre um "Formulário de Edição de Cliente". Ele abre uma vista sobreposta elegante (*Split View*), onde de um lado temos o mapa interativo do local e do outro o gráfico com o histórico de consumo de energia dos últimos 12 meses. É um ecrã de **leitura técnica**, blindado contra edições comerciais.

### **C. O Fluxo Fluido (Zero Recarregamentos)**

A transição entre olhar para os dados do CRM e começar a desenhar polígonos no telhado tem de ser impercetível. Ao clicar em **\[ Dimensionar \]**, o ecrã não fica branco a carregar uma nova página. A interface sofre uma metamorfose: a grelha desaparece, o ecrã expande-se para um mapa a 100%, e o contexto comercial recolhe-se num painel lateral (*Right Inspector*), permanecendo sempre acessível como referência.

## **4\. O Alinhamento Arquitetural (Soberania de Dados)**

É vital notar que esta reintegração visual **não quebra a nossa arquitetura de microserviços**.

O Kurupira continua a não ser o "dono" dos clientes. Quando o *Project Explorer* é aberto, o backend do Kurupira faz uma requisição invisível (M2M) ao Iaçã para pedir os nomes e consumos, injetando-os na memória do ecrã do engenheiro instantaneamente. Os dados comerciais mantêm-se protegidos no ERP, mas são servidos de forma elegante na bancada de engenharia.

---


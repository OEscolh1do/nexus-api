---

# **Preâmbulo: Contexto Fundacional e Justificativa Estratégica**

---

### **1\. O Cenário Atual (A Dor Arquitetural): Uma Análise Profunda**

O crescimento orgânico do ecossistema Neonorte levou à construção de ferramentas de alto valor (como o simulador solar e o funil de gestão), mas que agora colidem sob o mesmo "teto" tecnológico. O padrão de *Monólito Modular* serviu bem para validar o sistema, mas ao atingir a maturidade operacional, a dependência de uma única API central (nexus-api) tornou-se um "gargalo de vidro". A fragmentação no frontend (várias pastas isoladas como /lumi e /nexus-erp) mascara o verdadeiro problema: nos bastidores, todas as aplicações concorrem pela mesma "linha de montagem" do servidor.

Esta topologia gera três vetores de risco severos que ameaçam a estabilidade corporativa:

#### **1.1. Conflito de Recursos: O Bloqueio do *Event Loop* (CPU vs I/O)**

O motor do nosso backend (Node.js) é construído sobre uma arquitetura de *Single-Thread* (fio de execução único) orientada a eventos.

* **O Perfil I/O (Gestão):** O Node.js é excecionalmente brilhante e rápido a lidar com operações de *Input/Output* (I/O). Ler a tabela de milhares de *Leads*, verificar uma senha ou atualizar um *status* no Kanban de Operações são tarefas que o servidor delega à base de dados, devolvendo a resposta ao vendedor em milissegundos.  
* **O Perfil CPU (Engenharia):** No entanto, o paradigma quebra-se quando o Lumi entra em ação. Processar matrizes de perdas elétricas, simular geração energética ao longo de 25 anos, processar polígonos espaciais (GIS) ou compilar um PDF longo em memória exige força bruta de processador (CPU-Bound).  
* **O Efeito Prático:** Como existe apenas uma *thread* principal, enquanto o motor de engenharia "pensa" na matemática de um telhado, ele bloqueia o servidor. Um coordenador que tente aprovar uma proposta financeira no exato mesmo momento ficará com o ecrã congelado à espera que o servidor termine o cálculo solar. A interface aparenta lentidão, mas a realidade é um congestionamento arquitetural.

#### **1.2. Ameaça de *Blast Radius*: A Falha em Cascata (Efeito Dominó)**

Numa arquitetura de *software* moderna, o conceito de *Blast Radius* (Raio de Impacto) mede o nível de destruição colateral quando um componente falha. Num monólito partilhado, esse raio é total (100%).

* **O *OOM Killer*:** A engenharia solar e a geração de memoriais descritivos com imagens de satélite são propensas a picos de consumo de memória RAM. Se o dimensionamento de um projeto complexo criar um pico que exceda o limite de memória do servidor, o sistema operativo executará o protocolo *OOM (Out Of Memory)*, abatendo abruptamente o processo do Node.js para proteger a máquina.  
* **O Impacto no Negócio:** A falha de um cálculo de um engenheiro resulta no *downtime* (tempo de inatividade) imediato de toda a empresa. Os vendedores perdem o acesso ao CRM a meio de uma negociação, e os diretores deixam de conseguir visualizar os Dashboards Financeiros. Um problema técnico de um departamento paralisa o fluxo de caixa de toda a operação.

#### **1.3. Poluição de Domínio: A Crise do Modelo de Dados e Dívida Técnica**

O ficheiro de modelação da base de dados (schema.prisma) e o próprio motor MySQL tornaram-se num "Objeto Divino" (*God Object*).

* **Fronteiras Inexistentes:** Entidades vitais de negócio corporativo (como Opportunity, Transaction, UserRole) estão fisicamente entrelaçadas com entidades técnicas de altíssima granularidade (como InverterConfig, AzimuthAngle, CableSection).  
* **Risco de Manutenção:** Qualquer alteração necessária na engenharia (exemplo: adicionar uma nova regra de sombreamento) exige uma migração SQL global. Durante o milissegundo em que a base de dados aplica esta alteração, as tabelas financeiras e de gestão podem sofrer bloqueios (*Table Locks*).  
* **Peso Cognitivo:** Para um programador criar uma nova funcionalidade no ERP de vendas, ele é forçado a navegar e a compilar dezenas de modelos de engenharia elétrica que não domina. Esta falta de isolamento de contexto (Context Boundary) aumenta exponencialmente o risco de introduzir erros (*bugs*) transversais em atualizações futuras.

---

### **2\. A Necessidade de Cisão (A Justificativa): O Fim do Antipadrão**

A intenção original de fundir o módulo de engenharia fotovoltaica (Lumi) e o sistema de gestão (Nexus) numa única interface monolítica (uma "Super-App" corporativa) baseava-se na premissa da conveniência. Contudo, a engenharia de *software* moderna e os estudos de usabilidade (UX) demonstram que esta fusão resulta num **antipadrão arquitetural e cognitivo**.

Para garantir o crescimento da Neonorte, a cisão é justificada por quatro pilares inegociáveis:

#### **2.1. O Conflito de Paradigmas Visuais (Carga Cognitiva)**

Diferentes profissões exigem diferentes ferramentas mentais. Forçar a coexistência destes mundos na mesma janela destrói a produtividade de ambos os perfis de utilizador:

* **O Paradigma ERP (Iaçã):** Ferramentas de gestão (Financeiro, CRM, Kanban) exigem **densidade de dados**. O utilizador (Gestor/Vendedor) quer ver o máximo de números, *cards* e gráficos no menor espaço possível. A navegação é rápida, baseada em tabelas, abas e menus laterais complexos.  
* **O Paradigma de *Authoring* (Kurupira):** Ferramentas de engenharia e desenho técnico (como AutoCAD, SketchUp ou Reonic) exigem **foco imersivo**. O engenheiro precisa de um *Workspace* (uma tela em branco ou um mapa expansivo) livre de distrações, barras de navegação poluídas ou notificações do funil de vendas.  
* **O Risco da Fusão:** Colocar o desenho de um telhado no meio de um *dashboard* financeiro aumenta a *Carga Cognitiva* do engenheiro, induzindo fadiga e aumentando a probabilidade de erros críticos no dimensionamento de cabos ou inversores.

#### **2.2. O Gargalo de Performance no Frontend (O Peso da "Super-App")**

No contexto de aplicações web (React/Vite), uma "Super-App" significa que todo o código é empacotado e enviado para o *browser* do utilizador de uma só vez.

* **A Poluição do *Bundle*:** A engenharia solar exige bibliotecas massivas (motores de renderização de mapas como o *Leaflet*, bibliotecas de cálculo vetorial, geradores de PDF e manipulação de imagens).  
* **A Penalização das Vendas:** Se mantivéssemos o monólito, um vendedor que abrisse o sistema no telemóvel usando uma rede 4G apenas para atualizar o telefone de um cliente seria forçado a descarregar dezenas de megabytes de bibliotecas de engenharia fotovoltaica que nunca iria usar. Separar os sistemas garante que o **Iaçã** seja ultraleve e carregue instantaneamente, enquanto o **Kurupira** aloca o peso necessário apenas no ecrã do engenheiro.

#### **2.3. Agilidade de *Deploy* e Ciclos de Vida Independentes**

A engenharia e a gestão evoluem a velocidades completamente diferentes.

* **O Ritmo da Engenharia:** O mercado solar é volátil. Novos modelos de módulos fotovoltaicos, novas regras de tarifação das concessionárias de energia e novos algoritmos de sombreamento exigem atualizações constantes. A equipa de desenvolvimento precisa de fazer *deploys* (lançamentos) do Kurupira várias vezes por semana.  
* **O Ritmo da Gestão:** O sistema financeiro e de CRM exige estabilidade e previsibilidade. Uma alteração no fluxo de caixa não pode ser feita de ânimo leve.  
* **A Libertação das Equipas:** No modelo monolítico, uma correção urgente num cálculo do inversor obrigaria a testar todo o ERP de vendas para garantir que nada foi quebrado por acidente. Com a cisão, a equipa pode atualizar a engenharia (Kurupira) de forma ágil e agressiva, sem tocar no código blindado do ERP (Iaçã).

#### **2.4. A Adoção de Microserviços Pragmáticos (A Solução Elegante)**

A transição não visa transformar a Neonorte numa rede caótica de dezenas de microserviços difíceis de gerir. A solução dita uma abordagem **Pragmática**.

* Dividimos o sistema nas suas duas clivagens naturais e absolutas: O "Cérebro" de Gestão e o "Músculo" de Engenharia.  
* Mantemos o controlo operacional centralizado através do *Docker Compose* no mesmo *hardware* físico, colhendo 90% dos benefícios dos sistemas distribuídos das *Big Techs* (escalabilidade, isolamento de falhas, *deploy* independente), mas com um custo e complexidade de infraestrutura próximos de zero.

---

**Resumo Estratégico:** A cisão não é um retrocesso tecnológico; é um sinal de maturidade. Ao transformar o antigo Lumi no **Kurupira** e o Nexus no **Iaçã**, paramos de tentar criar um "canivete suíço" medíocre e passamos a fornecer dois "bisturis" de altíssima precisão às equipas da Neonorte.

---

### **3\. A Visão e o Resultado Esperado (Para Onde Vamos): A Simbiose Perfeita**

Este Documento de Planeamento Arquitetural (ADR-010) dita as regras irrevogáveis para separar o ecossistema em duas "Fortalezas" distintas e soberanas (*Bounded Contexts* no paradigma de *Domain-Driven Design*). Cada uma possuirá o seu próprio motor de processamento e a sua própria base de dados, unidas e orquestradas por uma infraestrutura comum e impenetrável de Docker.

#### **3.1. As Duas Fortalezas Soberanas**

A cisão cria dois ambientes hiper-especializados, otimizados até ao limite para os seus respetivos utilizadores:

* **O Ecossistema Iaçã (Antigo Nexus ERP \- O Cérebro Transacional):** Evoluirá para ser o motor de alta frequência da empresa. Operando como um sistema I/O-Bound, será focado em velocidade de resposta, concorrência e gestão de estados. Abrigará o CRM (Funil de Vendas), a orquestração do Kanban de Operações, o acompanhamento de OKRs e o fluxo de caixa (Finanças). A sua interface será densa, rica em tabelas, gráficos de *Business Intelligence* e desenhada para decisões executivas e comerciais em frações de segundo.  
* **O Ecossistema Kurupira (Antigo Lumi \- O Músculo Computacional):** Nascerá como uma bancada de engenharia pura de alto desempenho. Operando como um sistema CPU/Memory-Bound, deixará de parecer um "site" e passará a comportar-se como um *Software de Authoring* (paradigma *Workspace*). Será focado em cálculos espaciais de alta precisão (GIS via Leaflet), matrizes de dimensionamento elétrico, configuração de *Strings* e geração de propostas técnicas imersivas. O ecrã será um "Canvas" limpo, dedicado à imersão técnica.

#### **3.2. A Simbiose Alvo: O Fluxo de Trabalho (Workflow) Invisível**

A separação dos sistemas nos bastidores (Backend) será absolutamente invisível para o utilizador. O objetivo final desta refatoração é criar uma **Experiência de Utilizador (UX) Contínua sem Duplicação de Dados**. A arquitetura garantirá o seguinte fluxo perfeito:

1. **A Origem no Iaçã:** O vendedor negoceia com o "Supermercado Central" e avança o *Card* no CRM do Iaçã para a fase "Aguardando Engenharia".  
2. **A Ponte (*Deep Linking*):** O engenheiro clica no botão "Abrir Projeto" dentro do *Card* no Iaçã. O *browser* abre o Kurupira num novo separador em modo de ecrã inteiro. O URL contém uma ponte criptografada (ex: kurupira.neonorte.com/workspace?leadId=789).  
3. **Injeção Silenciosa Máquina-a-Máquina (M2M):** Ao carregar, o Kurupira não pede ao engenheiro para digitar o nome do cliente. Nos milissegundos em que a interface carrega, o servidor do Kurupira faz uma chamada segura pela rede privada do Docker (http://iaca-backend:3001/internal/leads/789), vai buscar o nome, a morada e a fatura de energia do cliente, e injeta esses dados diretamente no painel lateral do desenhador.  
4. **Devolução Automatizada (EDA):** Quando o engenheiro finaliza o desenho no Kurupira e clica em "Aprovar Projeto Técnico", o Kurupira dispara um evento assíncrono para o Iaçã, que move automaticamente o *Card* do vendedor para a fase "Proposta Pronta", notificando a equipa comercial.

#### **3.3. O Padrão "Bulkhead" (Isolamento Térmico e Resiliência)**

O maior triunfo de negócio desta visão é a **Garantia de Continuidade (Zero Downtime Parcial)**. Inspirado no padrão *Bulkhead* (os compartimentos estanques dos submarinos que impedem que o navio inteiro afunde se houver um furo), implementaremos limites físicos de infraestrutura:

* Se a engenharia exigir um processamento computacional massivo (ex: gerar um memorial descritivo em PDF com 50 páginas e imagens de satélite 4K de um sistema de 1MW) e o servidor Node.js do Kurupira atingir o limite máximo de Memória RAM alocada, o Docker reiniciará o processo do Kurupira.  
* **O Resultado:** O engenheiro vê uma mensagem de "A recarregar simulador", **mas as vendas no Iaçã não sofrem um único milissegundo de inatividade**. O diretor continua a consultar a faturação e o vendedor continua a emitir contratos, alheios ao pico de stress computacional que ocorreu na engenharia.

---


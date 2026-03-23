# DOCUMENTO DE PLANEAMENTO ARQUITETURAL

**Iniciativa:** Cisão Arquitetural e Orquestração de Microserviços (Operação "Guardiões")

**Ecossistema:** Iaçã (ERP/Gestão) & Kurupira (Workspace de Engenharia)

**Arquiteto Responsável:** Antigravity AI / Engenharia Principal

**Status:** 🟢 Aprovado para Execução (Ready for Build)

# 1\. Visão Executiva e Objetivo

A decisão arquitetural estabelece a transição de um Monólito de Frontend fragmentado para uma verdadeira **Arquitetura de Microserviços (Sistemas Distribuídos)** focada em hiper-especialização e resiliência.

O ecossistema divide-se em dois domínios soberanos:

* **Iaçã (O Cérebro de Gestão):** Focado em velocidade transacional, CRM (Leads/Oportunidades), orquestração de operações (Gantt/Kanban) e finanças.  
* **Kurupira (A Bancada de Engenharia):** Focado em poder computacional, operando sob o paradigma de "Workspace Técnico" imersivo (mapas GIS, dimensionamento solar complexo, geração de memoriais descritivos).

Para viabilizar esta cisão com máxima eficiência de custos e zero impacto no *Blast Radius*, adotaremos o padrão de **Isolamento Lógico em Hardware Partilhado** via contentorização estrita.

## 1.1. O Paradigma da Hiper-Especialização (Dicotomia de Carga)

A separação entre o **Iaçã** e o **Kurupira** não é apenas uma questão de interface de utilizador (UX); é uma resposta direta à natureza diametralmente oposta das cargas de trabalho (*workloads*) que cada sistema processa.

* **Perfil do Iaçã (I/O-Bound):** O sistema de gestão é caracterizado por alta concorrência e operações intensivas de leitura/escrita na base de dados (I/O). Dezenas de vendedores, coordenadores e administradores acedem simultaneamente para mover *cards* no Kanban, atualizar *status* de Leads e consultar dashboards financeiros. O requisito principal aqui é **latência ultrabaixa** e alta disponibilidade.  
* **Perfil do Kurupira (CPU/Memory-Bound):** A bancada de engenharia tem menor concorrência (menos utilizadores simultâneos), mas cada sessão exige um poder computacional massivo. Renderização de polígonos sobre mapas (GIS via Leaflet), cálculos matriciais de perdas elétricas, simulações de sombreamento e compilação de PDFs complexos na memória exigem picos de processamento. O requisito principal é **potência bruta e alocação de memória**.

Misturar estes dois perfis num único processo Node.js (Monólito) é uma falha arquitetural clássica, pois um pico de uso de CPU na engenharia causaria estrangulamentos (*bottlenecks*) em todo o sistema de vendas.

## 1.2. Engenharia de Resiliência e "Blast Radius" Zero

O conceito de *Blast Radius* (Raio de Impacto) dita até que ponto uma falha num componente afeta o resto do sistema. Na nossa arquitetura de microserviços, aplicamos o princípio de **Degradação Graciosa (Graceful Degradation)** e isolamento de falhas.

* **Proteção do Motor de Receita:** Se um erro de alocação de memória (OOM \- *Out of Memory*) ocorrer no Kurupira devido a uma simulação fotovoltaica excessivamente complexa, o contentor do Kurupira falha e reinicia de forma isolada. O **Iaçã permanece 100% online**. A diretoria continua a analisar OKRs e a equipa comercial continua a fechar contratos. O fluxo de caixa da empresa não é interrompido por um erro de engenharia.  
* **Deployments Assimétricos:** A engenharia fotovoltaica exige atualizações frequentes de algoritmos e catálogos de inversores. Com domínios separados, podemos fazer dezenas de *deploys* semanais no Kurupira sem necessitar de janelas de manutenção que afetem a disponibilidade do Iaçã.

## 1.3. Soberania de Domínio e Anti-Corruption Layers

Para que os dois sistemas operem de forma autónoma, a propriedade dos dados (*Data Ownership*) tem de ser inquestionável.

* **Fronteiras Delimitadas (Bounded Contexts):** O Iaçã é o detentor absoluto das entidades de negócio (`Lead`, `User`, `Opportunity`, `Transaction`). O Kurupira é o detentor absoluto das entidades técnicas (`PVArray`, `InverterConfig`, `RoofPolygon`).  
* **A Ponte de Contexto:** O Kurupira não guarda dados comerciais. Quando necessita de apresentar o nome do cliente no memorial descritivo, faz uma requisição síncrona (via API interna) ao Iaçã, ou consome a informação que lhe foi injetada no momento em que o engenheiro clicou em "Dimensionar" no CRM. Esta abordagem elimina a anomalia dos "dados dessincronizados" ou duplicados.

## 1.4. Isolamento Lógico em Hardware Partilhado (Microserviços Pragmáticos)

A transição para microserviços tradicionalmente acarreta um aumento exponencial nos custos de infraestrutura cloud (múltiplas instâncias EC2, geridos por Kubernetes, etc.). Para garantir a **máxima eficiência de custos**, adotamos a conteinerização estrita num ambiente de hardware partilhado (Docker Compose num único *host* robusto).

A topologia de contenção garante o isolamento físico dos processos:

1. **Isolamento de Processos (Node.js):** O Iaçã e o Kurupira rodam em contentores Node.js distintos, operando em portas de rede separadas (ex: 3001 e 3002), geridos por um *API Gateway* (Nginx) leve na linha da frente.  
2. **Isolamento de Dados (MySQL):** Em vez de instanciar dois motores de base de dados (o que duplicaria o consumo crónico de RAM), utilizamos um único contentor MySQL 8.0 de alta performance. Dentro dele, criamos schemas (bases de dados) logicamente separados: `db_iaca` e `db_kurupira`.  
3. **Segurança e Acesso:** O utilizador do backend do Kurupira não possui privilégios SQL (GRANT) para aceder ou corromper a `db_iaca`. As tabelas estão muradas ao nível do motor da base de dados.

Esta abordagem entrega os benefícios arquiteturais de gigantes tecnológicos (Google, Netflix) mitigando o risco sistémico, mas mantendo o orçamento de infraestrutura no patamar de uma *startup* *lean*.

---

# 2\. Topologia de Infraestrutura (A Frota Docker)

O ambiente será orquestrado por um docker-compose.yml mestre que garantirá resiliência térmica (se a engenharia falhar, as vendas continuam operando). O sistema consistirá em 4 contentores primários:

1. **api-gateway (Nginx/Traefik):** O roteador de tráfego central.  
   * Direciona /api/iaca/\* para o contentor de gestão.  
   * Direciona /api/kurupira/\* para o contentor de engenharia.  
2. **iaca-backend (Node.js / Porta 3001):** Motor de regras de negócio comerciais, financeiras e operacionais.  
3. **kurupira-backend (Node.js / Porta 3002):** Motor de cálculo elétrico, renderização espacial e geração de propostas técnicas.  
4. **nexus-db (MySQL 8.0):** Contentor único de base de dados, mas gerindo duas instâncias lógicas impenetráveis entre si (db\_iaca e db\_kurupira).

## 2.1. O *API Gateway* (Nginx): A Fronteira de Segurança e Roteamento

Ter múltiplos backends cria um problema clássico de *CORS* (Cross-Origin Resource Sharing) e gestão de certificados no frontend. O `api-gateway` resolve isto atuando como a única porta de entrada pública para a Neonorte.

* **Ponto Único de Entrada (Single Entrypoint):** O frontend do Iaçã e do Kurupira não precisam de memorizar múltiplos IPs ou portas. Eles enviam todos os pedidos para um único domínio (ex: `https://api.neonorte.com`).  
* **Terminação SSL e Rate Limiting:** O Nginx retira a carga de decriptação HTTPS dos contentores Node.js. Além disso, implementamos regras de *Rate Limiting* (ex: máximo de 100 requisições por minuto por IP) na fronteira, protegendo os backends de ataques de negação de serviço (DDoS).  
* **Roteamento Transparente:** O *Proxy Reverso* lê a rota e despacha internamente:  
  * `/api/iaca/*` → `http://iaca-backend:3001`  
  * `/api/kurupira/*` → `http://kurupira-backend:3002`

## 2.2. Motores de Execução: Alocação Assimétrica de Recursos

A verdadeira "resiliência térmica" (impedir que um sistema sobreaqueça e derrube o outro) é alcançada através de limites estritos no Docker Compose (`deploy.resources`). Não vamos dar o mesmo hardware ao Iaçã e ao Kurupira.

* **`iaca-backend` (O Velocista):** Configurado para alta concorrência de I/O. Não precisa de muita memória RAM, mas precisa de prioridade de rede e um *Connection Pool* alto para o Prisma falar com a base de dados rapidamente.  
  * *Alocação típica:* Limite de 1GB de RAM; Foco em latência.  
* **`kurupira-backend` (O Halterofilista):** O cálculo de *Strings* de painéis, matrizes de perda por sombreamento e a geração de PDFs (bufferização em memória) consomem RAM de forma voraz.  
  * *Alocação típica:* Limite de 2GB a 4GB de RAM; Acesso a múltiplos *cores* de CPU. Se o Node.js atingir o limite de 4GB, o Docker *mata* e reinicia apenas este contentor (OOM Killer), enquanto o Iaçã continua a operar perfeitamente com o seu 1GB alocado.

## 2.3. A Fortaleza de Dados (`nexus-db`): Isolamento de Privilégios

Subir dois contentores MySQL separados exigiria cerca de 1GB de RAM base apenas para os processos do motor em vazio. A abordagem de contentor único com multi-schema (`db_iaca` e `db_kurupira`) é uma obra-prima de otimização de custos, mas exige uma configuração de segurança paranoica no *init script* do Docker.

* **Muros de Permissão (GRANTs):** No arranque do contentor, criamos dois utilizadores SQL distintos:  
  * `user_iaca`: Recebe privilégios de leitura/escrita *exclusivamente* na base `db_iaca`.  
  * `user_kurupira`: Recebe privilégios *exclusivamente* na base `db_kurupira`.  
* **Prevenção de Corrupção:** Mesmo que um atacante consiga injetar código malicioso no `kurupira-backend`, ele não tem credenciais físicas no nível do motor MySQL para ler a tabela de transações financeiras ou de utilizadores (IAM) que vivem na `db_iaca`. O isolamento lógico atua como um isolamento físico.

## 2.4. A Rede Privada (*Docker Bridge Network*)

A segurança máxima dita que os backends e a base de dados **não existem na internet**.

* **Superfície de Ataque Reduzida a Zero:** As portas `3001` (Iaçã), `3002` (Kurupira) e `3306` (MySQL) **não são mapeadas** para a máquina hospedeira (`ports: - "3306:3306"` é estritamente proibido em produção).  
* Eles comunicam através de uma rede virtual interna criada pelo Docker (ex: `neonorte_net`). Apenas a porta `80/443` do `api-gateway` (Nginx) é exposta ao mundo. O Nginx é o único guarda capaz de falar com os backends na rede interna. Se a comunicação máquina a máquina (M2M) precisar de acontecer (ex: Kurupira pedindo dados do Cliente ao Iaçã), o Kurupira faz a chamada interna para `http://iaca-backend:3001` de forma ultrarrápida, sem a latência de sair para a internet e voltar.

---

# 3\. Estrutura do Monorepo

O repositório físico será consolidado para facilitar o desenvolvimento simultâneo e a partilha de contratos de interface (TypeScript/Zod):

Plaintext

/neonorte-workspace (Monorepo Raiz)  
 │  
 ├── /iaca-erp                 \# Domínio de Gestão  
 │    ├── /frontend            \# React 19 / Vite (Dashboards, Kanban, CRM)  
 │    └── /backend             \# Express.js (Conecta exclusivamente a db\_iaca)  
 │  
 ├── /kurupira                 \# Domínio de Engenharia  
 │    ├── /frontend            \# React 19 / Vite (Canvas UI, Leaflet, Simulação)  
 │    └── /backend             \# Express.js (Conecta exclusivamente a db\_kurupira)  
 │  
 ├── /packages                 \# Barreira Zod & Tipos  
 │    └── /shared-core         \# Esquemas TypeScript/Zod partilhados (Contratos M2M)  
 │  
 └── docker-compose.yml        \# Orquestrador de Infraestrutura

---

# 4\. Estratégia de Dados: Soberania e Isolamento (SSOT)

Para anular os riscos clássicos de dados distribuídos (duplicação e dessincronização), aplicamos a lei da **Single Source of Truth (SSOT)** baseada em referências remotas.

## 4.1. Regra de Não-Duplicação (Foreign Keys Virtuais)

O banco db\_kurupira **é proibido** de possuir tabelas de cadastro de clientes ou informações de contato. A entidade TechnicalDesign do Kurupira conterá apenas um identificador ponte (ex: iaca\_lead\_id).

## 4.2. Injeção de Contexto M2M (Machine-to-Machine)

Quando um projeto é aberto no Kurupira, o kurupira-backend realiza uma requisição interna (via rede privada do Docker) para http://iaca-backend:3001/internal/leads/:id para injetar o contexto comercial do cliente na tela do engenheiro em tempo real.

## 4.3. Resiliência de Rede: O Padrão *Circuit Breaker* e *Fallback*

A regra de ouro dos sistemas distribuídos é: **A rede não é confiável**. Se o Kurupira depende do Iaçã para apresentar o nome do cliente, o que acontece se o contentor do Iaçã estiver a reiniciar exatamente nesse milissegundo?

* **O Fim do Ecrã de Erro:** O Kurupira não pode falhar (crashar) só porque o Iaçã não respondeu. Implementaremos o padrão **Circuit Breaker** (Disjuntor) nas chamadas M2M.  
* **Degradação Graciosa na UI:** Se a requisição interna `GET http://iaca-backend:3001/internal/leads/:id` falhar (timeout após 2 segundos), o disjuntor "abre". O Kurupira captura o erro silenciosamente e carrega a interface de engenharia na mesma. No local onde estaria o nome do cliente, a interface exibe um *Badge* de aviso: `[Contexto Comercial Indisponível - A tentar reconectar...]`. O engenheiro pode continuar a desenhar o telhado e os painéis sem interrupção.

## 4.4. Otimização de Performance: O Problema N+1 sobre HTTP

Quando o engenheiro abre o ecrã "Lista de Projetos" no Kurupira, ele poderá ver 50 projetos de uma só vez. Fazer 50 requisições HTTP individuais ao Iaçã para descobrir o nome de cada um dos 50 clientes destruiria a performance do sistema (o clássico e letal **Problema N+1**).

* **Batch Fetching (Busca em Lote):** O Iaçã irá expor um *endpoint* interno otimizado para listas. Em vez de pedir um a um, o backend do Kurupira agrupa os IDs e faz uma única requisição: `POST /internal/leads/batch` passando um *array* `[id_1, id_2, ..., id_50]`.  
* **Data Dataloader Pattern:** Utilizaremos o padrão *DataLoader* no backend do Kurupira para garantir que os dados em lote chegam em milissegundos, são mapeados em memória e injetados na resposta ao *frontend*, garantindo que a "Tabela de Projetos" carregue instantaneamente.

## 4.5. Integridade Referencial e Consistência Eventual (EDA)

Como abolimos o uso de *Foreign Keys* (Chaves Estrangeiras) físicas entre os bancos `db_kurupira` e `db_iaca`, o motor do MySQL não nos vai impedir de apagar um cliente no Iaçã que tenha projetos no Kurupira.

Para manter a base de dados limpa sem criar acoplamento forte (Hard Coupling), utilizaremos a **Event-Driven Architecture (EDA)** para aplicar a Consistência Eventual:

* **O Ciclo de Vida do Dado:** Se um administrador fundir ou excluir permanentemente o Lead "Supermercado Central" no Iaçã, o Iaçã não tenta apagar o projeto no Kurupira diretamente.  
* **O Megafone Interno:** O Iaçã emite um evento interno (ex: `LEAD_DELETED` com o payload `{ leadId: 123 }`).  
* **A Reação Assíncrona:** O Kurupira, que atua como *Subscriber* (ouvinte) destes eventos, recebe a mensagem em *background*, procura na sua própria base (`db_kurupira`) todos os `TechnicalDesigns` que possuam o `iaca_lead_id = 123`, e aplica-lhes um *Soft Delete* (arquivamento lógico) ou marca-os como "Projetos Órfãos", mantendo a integridade referencial intocável sem travar a transação original no ERP.

## 4.6. Segurança de Fronteira (Zero-Trust Internal API)

As rotas que começam por `/internal/*` no Iaçã ou no Kurupira são exclusivas para a comunicação Máquina a Máquina (M2M) e contêm dados altamente sensíveis sem os filtros normais de interface.

* **Blindagem no Nginx:** O nosso `api-gateway` (Nginx) será configurado para bloquear **absolutamente** qualquer requisição vinda da internet (frontend) que tente aceder a caminhos `/internal/`.

Mapeamento da Regra:  
Nginx  
location /api/iaca/internal/ {

    deny all; \# Bloqueia o mundo exterior

}

*   
* **Confiança Limitada:** O único ator capaz de atingir esse *endpoint* é o próprio contentor do Kurupira, conversando através da rede privada selada (`neonorte_net`) criada pelo `docker-compose`.

---

# 5\. Padrões de Observabilidade e Segurança

* **Rastreabilidade Distribuída (Correlation-ID):** Toda ação gerada nos frontends cria um UUID (ex: req-xpto-999). Este ID viaja nos *headers* HTTP entre o Iaçã e o Kurupira. Os *logs* de erro de ambos os contentores registram este ID, permitindo rastrear falhas que cruzam a fronteira dos sistemas.  
* **IAM Centralizado (Single Sign-On Interno):** A identidade reside no Iaçã. O kurupira-backend não gere senhas. Ele valida as sessões de engenharia decodificando o token JWT emitido pelo Iaçã ou validando-o contra o *endpoint* /api/iam/verify.

## 5.1. Observabilidade Cirúrgica: Rastreabilidade Distribuída Avançada

O conceito de `Correlation-ID` (ou *Trace-ID*) será a espinha dorsal da nossa capacidade de resolução de incidentes. Implementaremos este padrão utilizando recursos avançados do Node.js para garantir que o ID nunca se perca durante operações assíncronas.

* **Injeção de Contexto (AsyncLocalStorage):** Em vez de passarmos o `Correlation-ID` manualmente como parâmetro em cada função do serviço, utilizaremos o `AsyncLocalStorage` (nativo do Node.js). Assim que a requisição entra no *Express*, o ID (ex: `req-xpto-999`) é encapsulado num contexto global assíncrono. Qualquer consulta ao Prisma, chamada de API ou *log* gerado durante esse ciclo de vida terá o ID automaticamente anexado.  
* **Propagação de Rede (M2M Interceptors):** Configuraremos o `Axios` (ou `Fetch`) nos backends com *Interceptors*. Se o Kurupira precisar de chamar `http://iaca-backend:3001/internal/leads/:id`, o interceptor agarra no `Correlation-ID` do contexto atual e injeta-o automaticamente no cabeçalho `X-Correlation-ID` do pedido de saída.  
* **Structured JSON Logging:** Proibiremos o uso de `console.log` simples em produção. Utilizaremos uma biblioteca de *logging* de alta performance (como `Pino` ou `Winston`) configurada para cuspir JSON.  
  * *Exemplo de Log:* `{"level":"error", "service":"kurupira", "msg":"Falha ao simular perdas", "correlationId":"req-xpto-999", "tenantId":"org-123"}`.  
  * Isto permite que o Docker recolha estes JSONs e os envie para um agregador central, onde pode filtrar instantaneamente toda a história de uma transação transversal.

## 5.2. IAM Centralizado: Autenticação "Stateless" e Zero-Trust

Para o Kurupira não ter de consultar o Iaçã a cada clique do utilizador (o que geraria latência massiva e acoplamento forte), adotaremos o padrão de **Validação JWT Stateless**.

* **O Iaçã como *Identity Provider* (IdP):** O módulo IAM vive apenas no Iaçã. Quando o utilizador faz login com sucesso, o Iaçã emite um JWT assinado criptograficamente.

**O *Payload* Autossuficiente:** O JWT conterá não apenas o `userId`, mas também o contexto de segurança necessário:  
JSON  
{

  "sub": "user\_456",

  "role": "ENGENHARIA",

  "orgUnitId": "tenant\_001",

  "exp": 1710940000

}

*   
* **A Barreira Kurupira (Confiança Criptográfica):** Quando o frontend do Kurupira envia um pedido de cálculo solar, ele envia este JWT no *header* `Authorization`. O *middleware* do Kurupira **não faz** uma chamada à API do Iaçã para validar o token. Ele possui a mesma chave secreta (`JWT_SECRET`) injetada via variáveis de ambiente do Docker. Ele verifica a assinatura matematicamente, lê o `role` e o `orgUnitId`, e injeta este contexto no Prisma (garantindo a segurança RLS) em menos de 1 milissegundo.

## 5.3. Segurança de Rede e Muros de Fogo Internos (*Network Firewalls*)

* **Blindagem de Endpoints Internos:** Nenhuma rota definida como `/internal/*` (usada para chamadas M2M) validará JWTs de utilizadores finais. Elas exigirão um `X-Service-Token` (um segredo super-forte partilhado apenas entre os contentores do Docker). Isto garante que mesmo que um atacante falsifique um JWT de administrador, ele não conseguirá acionar as rotas de comunicação M2M.  
* **CORS Implacável:** Os backends do Iaçã e do Kurupira estarão configurados para aceitar tráfego HTTP unicamente oriundo do `api-gateway` (Nginx) ou da rede interna do Docker (`neonorte_net`). Tentativas de acesso direto por IPs externos serão sumariamente rejeitadas ao nível da camada de transporte (TCP).

## 5.4. Auditoria Transversal Uniforme (Audit Trails)

O Nexus possui um requisito rigoroso de rastreabilidade corporativa (tabela `AuditLog`). Num sistema distribuído, como garantimos que uma alteração crítica de engenharia no Kurupira fica registada no histórico do Cliente que vive no Iaçã?

* **Delegação de Auditoria via Eventos:** O Kurupira não precisa de ter a sua própria tabela de `AuditLog` complexa para ações que impactam o negócio.  
* Quando o engenheiro altera o inversor de uma proposta (ação crítica), o Kurupira faz a sua gravação no banco `db_kurupira` e, imediatamente, dispara um evento M2M assíncrono para o Iaçã: `POST /internal/audit`.  
* O *Payload* contém a ação, o `userId` e o `Correlation-ID`. O Iaçã recebe este pacote e escreve-o na base central de auditoria, garantindo que o Diretor veja um *timeline* perfeito das ações de vendas e de engenharia num único ecrã.

---

## **6\. Plano de Execução Tático (Rollout)**

### **FASE 1: O Transplante Físico (Estruturação do Monorepo)**

* Renomear e consolidar as pastas legadas (/nexus-erp passa a /iaca-erp/frontend; /lumi passa a /kurupira/frontend).  
* Duplicar e isolar a atual base de código do /backend para as duas novas moradas.  
* Estabelecer a biblioteca /packages/shared-core.

### **FASE 2: Cisão de Motores e Infraestrutura Docker**

* Escrever o novo docker-compose.yml e os Dockerfiles individuais.  
* Implementar *init scripts* no MySQL para criação simultânea das bases db\_iaca e db\_kurupira.  
* Apurar o schema.prisma de cada backend (remover tabelas de engenharia do Iaçã e tabelas comerciais do Kurupira).

### **FASE 3: O Paradigma "Workspace" (Refatoração de UI)**

* Reescrever o fluxo de navegação do Kurupira para o formato "Project Explorer" e modo imersivo "Canvas".  
* Implementar o painel de leitura *Headless* do contexto comercial dentro da interface de desenho técnico.

### **FASE 4: A Ponte de Comunicação (EDA e Deep Linking)**

* Implementar botões "Dimensionar no Kurupira" nos cards de oportunidade do Iaçã (redirecionamento com parâmetros de URL).  
* Estabelecer comunicação para que a aprovação de uma proposta técnica no Kurupira movimente automaticamente o card comercial no Iaçã.

---

## **7\. Critérios de Sucesso (Definition of Done)**

* \[ \] O comando docker-compose up levanta os 4 contentores simultaneamente (Gateway, Iaçã, Kurupira, DB) sem conflitos de portas.  
* \[ \] *Crashar* intencionalmente o contentor kurupira-backend não afeta a navegação e operações do sistema Iaçã.  
* \[ \] O Kurupira renderiza os dados do cliente consumindo-os dinamicamente da API do Iaçã.

---


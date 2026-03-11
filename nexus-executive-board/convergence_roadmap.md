# Convergence Roadmap: Eixo de Dependências e Destravamento TRL

O Ecossistema Hub & Spoke foi desenhado em microsserviços do lado do Frontend, o que concede velocidade isolada (Ex: Atualizar UI do ERP não derruba o portal do Cliente). Contudo, a base de **Dados (API)** e **Sessão (Hub)** representam a **Gravidade Central**. Eis o mapa de travamento:

## Gargalo Estrutural 1: Single Sign-On (Auth Bridge)
* **Status:** O Hub e o ERP/Lumi estão em TRL 7. Eles têm vida e UI rodando na nuvem. Mas **NENHUM DELES** passa para o TRL 8 enquanto o mecanismo de passagem do token de sessão de um domínio (`hub.neonorte.com`) para outro (`erp.neonorte.com`) não estiver fluindo sem fricção técnica nem falha de segurança (XSS/CSRF).

## Gargalo Estrutural 2: Modelagem de IAM vs. Portais B2B
* **Status:** O Client Portal e Vendor Portal estão retidos em TRL 4 e **jamais chegarão no 5** se a API perder a rédea da "Mascaragem de Tenant".
* **Motivo:** O banco de dados (MySQL) armazena informações da Construtora. Se expusermos a View Endpoints publicamente paras as Extranets sem validação de "Property Owner", um vazamento B2B ocorre (Um cliente visualizando orçamento de outro).

## O Caminho Crítico (Plano de Marcha Executivo)
Para maximizar os recursos das Sprints de Engenharia, nós devemos obrigatoriamente seguir a seguinte ordem de convergência:
1. **Atacar o Gargalo 1 (SSO):** Validar se Cookie HttpOnly Domain-Shared ou Fallback de LocalStorage Intercepted via iFrame resolvem o ponteamento de ponta a ponta na nuvem. -> *Isto alavanca o Hub, ERP e Lumi automaticamente para o TRL 8.*
2. **Homologar ERP Internamente (TRL 8):** Deixar a operação de Vendas e Estoque esmaga-lo via usuários reais.
3. **Mergulhar nas Extranets (TRL 4 -> 6):** Ligar os formulários do B2P aos Endpoints blindados.

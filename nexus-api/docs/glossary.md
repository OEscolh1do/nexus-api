# Glossário de Domínio (Ubiquitous Language)

> **Atualizado:** 2026-03-10

Este documento define os termos onipresentes no código e no negócio. A consistência destes nomes é vital.

## 🟢 Commercial (Vendas)

- **Lead:** Um potencial cliente que entrou em contato mas ainda não tem proposta qualificada.
- **Deal (Oportunidade):** Um Lead que avançou para negociação. Possui valor monetário estimado.
- **TechnicalProposal:** Documento técnico gerado pelo `Solar Engine` com dimensionamento e preço. (Anteriormente SolarProposal)
- **Mission:** Campanha comercial regionalizada com metas e gamificação para a equipe de vendas.

## 🔵 Ops (Operações)

- **Project (Obra):** A execução vendida. Nasce AUTOMATICAMENTE quando um Deal é ganho ("Closed Won").
- **OperationalTask:** A menor unidade de trabalho. Pode ser:
  - _Milestone:_ Marco de pagamento ou entrega crítica.
  - _Standard:_ Tarefa comum com duração.
- **Blueprint (Modelo):** Um conjunto pré-definido de tarefas para tipos de obra.
- **ApprovalGate:** Ponto de governança que bloqueia progressão até aprovação por alçada (vinculado a Invoices e ChangeOrders).
- **Risk:** Mapeamento formal de risco operacional num projeto com impacto e mitigação.
- **DailyReport:** Relatório Diário de Obra (RDO) submetido apontando progresso, clima e ocorrências.
- **Program:** Agrupamento de nível macro que agrega múltiplos Projects para visão executiva de portfólio.
- **WorkflowRule:** Automagias do sistema baseadas em event-driven architecture (triggers para criação de tasks).

## 🟣 Strategy (Estratégia)

- **Objective (Objetivo):** O que queremos alcançar (ex: "Aumentar Faturamento").
- **KeyResult (Meta):** A quantificação do objetivo (ex: "R$ 10M em 2026").
- **KeyResultCheckIn:** Registro periódico de progresso de um KeyResult. Contém valor anterior, novo valor e comentário opcional. Vinculado ao usuário que fez o check-in.
- **Driver:** Um fator externo ou interno que influencia a estratégia.

## 🟠 Finance (Financeiro)

- **LedgerEntry:** Registro imutável de transação financeira no PostgreSQL. Nunca deletado, apenas compensado por transação inversa.
- **Budget:** Orçamento vinculado a um Project. Controla baseline de custos (Previsto vs Realizado).
- **CostCenter / WBS:** Segmentação de custos por centro ou Work Breakdown Structure.
- **Invoice:** Fatura ou Nota Fiscal submetida por um Vendor contra um Contract/Project.
- **Transaction:** Registro de movimentação financeira (contas a pagar/receber) associada a um CostCenter ou Budget.

## 🏢 Enterprise (SaaS Multi-Tenant)

- **Tenant:** Empresa cliente do SaaS. Entidade raiz de isolamento de dados (RLS). Possui hierarquia (`parentId`, `type: MASTER | SUB_TENANT`).
- **TenantApiKey:** Chave de API emitida para um Tenant consumir o Gateway Enterprise. Associada a quotas (`apiMonthlyQuota`).
- **Vendor:** Fornecedor/empreiteiro terceirizado vinculado a um Tenant via `vendorId` no model User.
- **Contract:** Vínculo gerencial entre Vendor e Project com SLAs e escopo definidos.

## 🔐 Segurança (IAM)

- **withTenant(tx):** Função de isolamento RLS. Todas as queries Prisma devem ser executadas dentro deste wrapper.
- **requireRole([...]):** Middleware de autorização que restringe acesso por role do JWT.
- **SSO (Single Sign-On):** Autenticação delegada a Identity Provider corporativo (Entra ID / Google Workspace). Configurado por `ssoProvider`, `ssoDomain`, `ssoEnforced` no Tenant.
- **AuditLog:** Trilha de auditoria imutável registrando a ação de usuários (via Tenant e UserId) em recursos chave do sistema.

## 📦 Logística

- **Material:** Dados mestre de insumos com categorização.
- **PurchaseOrder:** Requisição de compra rastreável contra orçamentos e cronogramas.

---

> **Regra:** Use estes termos exatos em nomes de Classes, Tabelas e Variáveis. Não use sinônimos (ex: não use "Client" se o termo é "Lead" ou "Customer").

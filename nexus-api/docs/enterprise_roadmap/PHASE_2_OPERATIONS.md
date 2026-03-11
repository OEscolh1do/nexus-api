### Fase 2: Eficiência Operacional e Descentralização (Status: Concluído)
* **Objetivo:** Estabelecer a *Master Engine* de Workflows e o Hub de Relacionamento Tercerizado/Finanças Avançadas.
* **Métricas Esperadas:** Eliminar gargalos das diretorias (aprovando eletronicamente) e amarrar os pagamentos à Curva S e RDOs (transparência de avanço físico). A conversão de tarefas complexas em esteiras automatizadas garante que atrasos sejam reportados rapidamente à diretoria. Portais Self-Service garantem visibilidade para clientes B2B, aumentando a percepção de valor e reduzindo agressivamente os chamados improdutivos e horas de Back-Office.

---

#### Section 1: Governança Operacional (Workflow Engine)
- [x] Construir a Engine Base (`ApprovalGate`) interligando `Invoices` e `ChangeOrders` à governança.
- [x] Criar sistema CRON/Background de Monitoramento SLA das aprovações para notificar C-Level.
- [x] Estruturar Roles & Permissões Granulares em Nível Operacional (Delegar escopo por Gerente/Diretor).

#### Section 2: Financial Health & Transparência C-Level
- [x] Implementar **S-Curve (Curva S) Earned Value Dashboard**. (Planned Value vs Earned Value vs Actual Cost).
- [x] Refatorar base de custos operacionais (Tracking de Desembolsos vs Baseline do Projeto).

#### Section 3: Descentralização B2B & B2P (Self-Service Portals)
- [x] Lançar **B2P Vendor Extranet (Portal de Empreiteiras):** Submissão guiada de Faturas e RDOs pelas equipes de campo terceirizadas, isolado do core do Nexus. Layout Mobile-First com bottom navigation (`/extranet/vendor/*`).
- [x] Lançar **B2B Client Extranet (Portal de Investidor):** Dashboard transparente de C-Level externo focado no avanço do projeto (somente leitura avançado), fisicamente isolado e roteado por RLS (`/extranet/client/*`).
- [x] **Portal de Transparência C-Level (B2B Client Portal):** Implementado via `ClientPortalLayout.tsx` com Curva S transparente e Budget tracker. Clientes SaaS acompanham evolução via role `B2B_CLIENT`.
- [x] **Estação Parceira B2P (Fornecedores e Franquias):** Implementado via `VendorPortalLayout.tsx`. Empreiteiros com role `B2P_VENDOR` submetem RDOs e acompanham tasks atreladas ao `TenantId`.
- [ ] **Terminal Empreiteira (SaaS Mobile App):** _(Futuro)_ App mobile nativo tático em campo. Requer decisão arquitetural sobre React Native vs PWA.

---

## 🧭 Visão dos Diretores (Executive Sign-off)
* **Arquitetura Gerencial Crítica:** Os comitês estratégicos decidirão se os Portais `B2B/B2P` funcionarão através da distribuição em Microfrontends exclusivos por motivos de cibersegurança e mitigação perimetral ou residirão isolados via restrição de rotas e injeção do Tenant ID no JWT.
* **Governança Terceirizada (Liability Security):** O valor intrínseco de um SaaS reside na segurança da informação. A adoção por grandes players depende de garantir legalmente que todo e qualquer input de um "Terceirizado Externo" jamais alcance o lago global de dados.

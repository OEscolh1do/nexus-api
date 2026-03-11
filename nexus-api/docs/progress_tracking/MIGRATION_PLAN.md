# Plano Diretor de Continuidade e Governança na Nuvem (Migração Supabase + Edge)

Este documento é o **Termo de Referência Executivo** sobre a transição do ecossistema legado de servidores **Neonorte | Nexus** para uma infraestrutura nativa global descentralizada. Muito além de trocar de servidor, trata-se de um movimento crítico de proteção do ativo intelectual da empresa (Continuidade de Negócio).

## Visão Arquitetural Alvo e Valor de Negócio
*   **Frontend C-Level Readiness (React/Edge):** Hospedagem em servidores *Serverless (Cloudflare Pages)* replicados globalmente.
    *   *Garantia Executiva:* Velocidade instantânea de acesso em campo e capacidade de sustentar picos massivos de tráfego (Escalabilidade Automática sem aumento fixo de custo em ociosidade).
*   **API Transacional (Node.js no Fly.io):** Execução do Motor Lógico na região GRU-São Paulo.
    *   *Garantia Executiva:* Cumprimento de SLAs contratuais, respostas a cliques dos usuários em sub-segundos, e eliminação profunda do "Sistema Lento".
*   **Data Lake e Vault Operacional (Supabase PostgreSQL):** Delegação da base de dados e Auth para parceiro especializado de altíssima segurança corporativa.
    *   *Garantia Executiva:* Blindagem de Dados contra catástrofes, cópias de segurança automatizadas, e redução de *Liability* com vazamentos (Data Breach).

---

## 🗺️ Fases Estratégicas da Migração (Zero-Downtime Pipeline)

A migração segue o princípio **Zero Perda de Dado / Zero Paralisação Operacional.** Com "checks" gerenciais duplos em cada fase antes de afetar o cliente na ponta.

### Fase 1: Arquitetura de Transição Lógica [✅ CONCLUÍDA]
**Business Target:** Habilitar suporte técnico a novas linguagens operacionais minimizando intervenção intrusiva no ecossistema legado.
- [x] Adaptar as engrenagens de backend (`schema.prisma` para `postgresql`).
- [x] Prever compatibilidade e normalização de todos os tipos críticos de dados para manter a integridade fiscal (Tipagens).

### Fase 2: Provisionamento de Bunker em Nuvem [✅ CONCLUÍDA]
**Business Target:** Criar o novo cofre de dados blindado, pronto para recepcionar passivos antigos sem expô-los a interrupções.
- [x] Estabelecimento formal do Contrato "Neonorte Nexus" no ecossistema Supabase com chaves *Enterprise-grade*.
- [x] Isolamento de credenciais locais (Segurança de Chaves - *Secrets Management*).
- [x] "Clone Limpo" das matrizes de tabelas aprovado no novo servidor (`npx prisma db push`).

### Fase 3: Operação Limpeza e Transferência Segura (ETL) [✅ CONCLUÍDA]
**Business Target:** Mover toda a propriedade intelectual corporativa (Pessoas, Vendas, Históricos) do antigo prédio para o cofre novo sem derramar uma única pasta física (Data Integrity & Data Migration).
- [x] Composição mecânica de scripts pesados de Transferência Direta ETL (Extract, Transform, Load).
- [x] Despejo validado transacional: Dados convertidos sem danos de Chaves Estrangeiras do MySQL ao novo banco as-is.
- [x] Certidão final de Validação Cruzada atestando "Nenhum centavo solto" ou cliente perdido na tabela.

### Fase 4: "O Corte" (Go-Live Transparente) [✅ CONCLUÍDA]
**Business Target:** Virada da chave definitiva. Sem paralisaçōes reportadas pela rede; A operação passa a consumir a plataforma blindada e dez vezes mais veloz.
- [x] Deploy blindado do Backend em container em São Paulo (Latência virtualmente zero garantindo a operação).
- [x] Implementação de Chaves Secretas na Nuvem (Mitigação total de Hacks de Código Fonte).
- [x] Link ativo da Front Page (Dashboard do Gerente) diretamente conectada à nova matriz Cloudflare Pages.
- [x] Hard-reset protetivo nas senhas sensíveis de Admin ativando criptografia Bcryptjs *Enterprise Level*.

**Links de Validação (Operação Ativa):**
* **Portal Matriz Front-end:** [https://neonorte-nexus-frontend.pages.dev/](https://neonorte-nexus-frontend.pages.dev/)
* **Hub API Master:** [https://neonorte-nexus-api.fly.dev](https://neonorte-nexus-api.fly.dev)

### Fase 5: Governança de Acesso e Entidades Expostas [STATUS: 🟡 PARCIAL]
**Business Target:** Substituir "Desenvolvimento em Casa de Segurança" por Parceiros Auditados (*Identity as a Service* - IdaaS), transferindo responsabilidade jurídica de invasões à suítes prontas.
- [x] **Multi-Tenancy RLS (Row Level Security):** Implementado universalmente via 7 ciclos de auditoria SEC-OPS. Todas as rotas CRUD genéricas, funções do `OpsService`, `IamService`, `FinService` e CRONs (`jit.cron.js`, `sla.cron.js`) operam via `withTenant(tx)`. Audit Trail ativo com `asyncLocalStorage` propagando `tenantId + userId`.
- [x] **Enterprise SSO Infrastructure (SAML 2.0 / OIDC):** Campos `ssoProvider`, `ssoDomain`, `ssoEnforced` adicionados ao model `Tenant`. Backend intercepta domínios corporativos no login e redireciona ao Identity Provider. Frontend adapta-se dinamicamente. Pendente: ativação com certificados reais de IdP.
- [ ] Transferir o portão de entrada corporativo integralmente para o Autenticador da Supabase (Maior Conformidade Legal — IdaaS).

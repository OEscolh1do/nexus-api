# SPEC-006 — Tenant Metrics and Limits (Modelo Híbrido)

**Status**: Aprovado pelo desenvolvedor  
**Data**: 2026-05-03  
**Conversa de origem**: cbc99bf1-08a4-474e-ad7b-8f0b95b5a269

---

## 1. SPECKIT.SPECIFY — O Quê

### Problema de Negócio
O sistema precisa de métricas e limites bem definidos para organizações (Tenants) e usuários para evitar abusos na infraestrutura (Kurupira/Iaçã) e viabilizar planos comerciais (FREE, STARTER, PRO, ENTERPRISE). Atualmente, apenas o limite de assentos (Seats) foi introduzido via SPEC-005. Precisamos de controle sobre a capacidade computacional e armazenamento.

### Práticas de Mercado (Avaliação e Ranking)
O modelo ideal para o Ywara é Híbrido, baseado na aderência das práticas B2B técnicas:
1. **Usage-Based (Simulações)**: Altíssima Aderência. Computação pesada no Kurupira.
2. **Feature-Tiering (Catálogo Privado)**: Alta Aderência. Diferenciação de funcionalidade.
3. **Seat-Based (Usuários Ativos)**: Média Aderência. Já mapeado.
4. **Capacity-Based (Storage/Projetos)**: Proteção de Fair Use no Iaçã.

### Critérios de Aceitação (Definition of Done)

**Backend (BFF e db_sumauma)**
- [ ] O banco `db_sumauma` deve manter contagem de `apiCurrentUsage` vs `apiMonthlyQuota` para simulações Kurupira.
- [ ] Middleware no BFF do Kurupira barra requisições computacionais críticas com `402 Payment Required` caso `apiCurrentUsage >= apiMonthlyQuota`.
- [ ] Bloqueio no Admin Sumaúma: Impede downgrade de plano se o tenant já possui mais usuários que o novo plano permite.

**Frontend Sumaúma (TenantsPage & TenantDrawer)**
- [ ] Coluna na DataGrid exibindo uso da API em barra de progresso.
- [ ] Coluna de Assentos exibindo `Uso Atual / Limite` com progresso visual.
- [ ] Nova aba "Quotas e Uso" no `TenantDrawer.tsx` detalhando o consumo.
- [ ] Identificação visual (badge amarelo/vermelho) para tenants em risco de estourar a quota (>90% ou 100%).
- [ ] Funcionalidade para o Operador da Neonorte injetar "Quota Extra" temporária num tenant sem alterar seu plano.

**Frontend Sumaúma (UsersPage)**
- [ ] Identificação do último acesso (Last Login/Active) para ajudar a expurgar assentos inativos.

---

## 2. SPECKIT.PLAN — O Como

### Eixos de Monetização (Modelo Híbrido)

**Eixo A: Capacidade Computacional (Usage-Based)**
- **Métrica**: Quota de Simulações / Geração de Propostas Mensais.
- **FREE**: 10/mês
- **STARTER**: 50/mês
- **PRO**: 300/mês

**Eixo B: Colaboração (Seat-Based)**
- **Métrica**: Usuários por Tenant (SPEC-005).
- **FREE**: 1 (`INDIVIDUAL`)
- **STARTER**: 5 (`CORPORATE`)
- **PRO**: 20 (`CORPORATE`)

**Eixo C: Recursos e Capacidade (Feature e Capacity-Based)**
- **Catálogo Privado**: Bloqueado no FREE, 20 no STARTER, Ilimitado no PRO.
- **Projetos Ativos (Iaçã)**: 5 no FREE, Ilimitado nos pagos.

### Modificações Necessárias (UI e Backend)
1. **`schema.prisma`**: Os campos `apiPlan`, `apiMonthlyQuota` e `apiCurrentUsage` já existem. É preciso usá-los efetivamente no painel.
2. **`TenantsPage.tsx`**: Ajustar `TenantRow` para transformar a coluna crua de "Usuários" em uma visualização de "Assentos".
3. **`TenantDrawer.tsx`**: Criar a UI de injeção de "Quota Extra" que fará uma requisição `PATCH /admin/tenants/:id` alterando `apiMonthlyQuota` ou deduzindo do `apiCurrentUsage`.
4. **`routes/tenants.js`**: Validar downgrades de plano cruzando o novo limite com `_count.users`.

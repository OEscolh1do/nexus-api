---
title: "SPEC-006: Gestão e Controle de Acesso do Kurupira"
status: "Plan"
date: "2026-05-03"
author: "Antigravity AI"
---

# SPEC-006: Gestão e Controle de Acesso do Kurupira

## Etapa 1: O Quê (Specify)

**Problema de Negócio**
Atualmente, o Kurupira opera como um módulo isolado que não possui ciência arquitetural de quem é o usuário acessando o sistema (além do token genérico). Isso impede o isolamento de dados entre os Tenants (Integradores) e a imposição de regras de acesso (RBAC - Role-Based Access Control) dentro da plataforma técnica. Além disso, o usuário gestor não consegue visualizar quem da sua equipe tem acesso ao motor de engenharia.

**Usuário Final**
Engenheiros e Vendedores (Integradores Fotovoltaicos) que assinam o Ywara.

**Definition of Done (DoD)**
- [ ] O Kurupira se conecta ao banco central da fundação (`db_sumauma`) em modo **Apenas Leitura (Read-Only)**.
- [ ] O middleware de autenticação (`auth.js`) do Kurupira extrai o `sub` do token do Logto, consulta o `db_sumauma` em tempo real e anexa o `tenantId` e `role` ao objeto `req.user`.
- [ ] O middleware de quota da API (`api-quota.middleware.js`) é refatorado para consultar o `db_sumauma` e aplicar limites de simulação corretamente.
- [ ] As rotas de Projetos (`designs.js`) e Simulações impõem **Tenant Isolation** absoluto (`where: { tenantId: req.user.tenantId }`).
- [ ] Nova aba de Configuração "Equipe" (Team Management) inserida no Frontend do Kurupira, operando em modo **Apenas Leitura** para listar os usuários do Tenant.

**Explicit Exclusions (Fora do Escopo)**
- ❌ **Criação ou Bloqueio de Usuários**: A mutação de identidades permanece centralizada no Sumaúma (via operadores Neonorte). A aba "Equipe" no Kurupira terá um Call-to-Action indicando que convites de equipe dependem de Assentos (Seats) e devem ser solicitados via suporte.
- ❌ **Mudança de Planos Financeiros**.

---

## Etapa 2: O Como (Plan)

A arquitetura seguirá a estratégia de **Descentralização AuthZ via DB Compartilhado**.

### 1. Conexão com a Fundação (Prisma Multi-Client)
Como o Kurupira precisa ler dados do Sumaúma:
1. Criar `kurupira/backend/prisma/schema-sumauma.prisma` contendo uma versão simplificada dos modelos `Tenant`, `User` e `TenantApiKey`.
2. O `schema-sumauma.prisma` configurará a geração do cliente para `node_modules/.prisma/client-sumauma`.
3. Criar `src/lib/prismaSumauma.js` instanciando esse cliente read-only com a variável `DATABASE_URL_SUMAUMA_RO`.

### 2. Refatoração do Middleware de Autenticação (`auth.js`)
1. Verificar a assinatura do JWT (Logto RS256).
2. Extrair o `sub` (Logto User ID).
3. `const user = await prismaSumauma.user.findUnique({ where: { authProviderId: sub }, include: { tenant: true } })`.
4. Se o usuário existir e o `tenant.status === 'ACTIVE'`, injetar em `req.user` o `id`, `tenantId`, `role` e plano.
5. Em caso de bloqueio ou deleção (Hard Delete na fundação), retornar 401.

### 3. Middleware RBAC (`rbac.middleware.js`)
Criar helper `requireRole(['TENANT_ADMIN', 'ENGINEER'])` para bloquear endpoints sensíveis (ex: configurações de API ou catálogo privado) para vendedores.

### 4. Correção do `api-quota.middleware.js`
Atualizar as chamadas de banco (que tentavam usar `prisma.tenantApiKey`) para usar o novo `prismaSumauma`.

### 5. Frontend (UI de Equipe)
1. Criar a rota `GET /api/v1/team` no Kurupira para listar membros da própria equipe (`req.user.tenantId`).
2. Criar `src/modules/settings/tabs/TeamTab.tsx` no React.
3. Exibir uma Tabela de Usuários (DataGrid) com `Nome`, `Email`, `Acesso (Role)`.
4. Adicionar um banner informativo no topo: *"Para alterar acessos ou adicionar membros (Plano {Plano_Atual}), contate o suporte."*

---

## Etapa 3: Quebra em Passos Atômicos (Tasks)

As tarefas serão detalhadas no artefato `task.md` do workflow e marcadas conforme progresso.

1. **Setup Prisma Sumauma**
   - Criar `schema-sumauma.prisma` e script de geração npm.
   - Criar `src/lib/prismaSumauma.js` e atualizar `validateEnv.js`.
2. **Identidade e AuthZ**
   - Refatorar `middleware/auth.js`.
   - Refatorar `middleware/api-quota.middleware.js`.
   - Criar `middleware/rbac.middleware.js`.
3. **Backend API**
   - Adicionar rota `/api/v1/team`.
   - Auditar `routes/designs.js` e `catalog.js` para assegurar validação via `req.user.tenantId`.
4. **Frontend UI**
   - Construir a UI `TeamTab.tsx`.
   - Registrar no `SettingsModule.tsx`.

---

## Etapa 4: Revisão de Riscos (Analyze)

⚠️ **Risco de Performance**: Fazer query no `db_sumauma` para **toda** requisição HTTP no Kurupira pode adicionar latência (5-20ms).
**Mitigação**: Podemos usar cache LRU no `auth.js` que guarde o mapeamento `sub -> { tenantId, role }` por 5 minutos, ou assumir a latência por ser comunicação interna (`127.0.0.1:3306`). Optaremos inicialmente pela query direta para garantir bloqueio de tenant em tempo real.

⚠️ **Risco de Shadowing (Conexões Isoladas)**: O `api-quota.middleware.js` tenta fazer um *Fire-and-Forget* que atualiza a contagem de uso: `prisma.tenant.update({ apiCurrentUsage: { increment: 1 } })`.
**Atenção Crítica**: O `prismaSumauma` dentro do Kurupira será configurado com uma conta de banco Read-Only (`user_admin`). A tentativa de `update` falhará.
**Mitigação M2M**: O Kurupira não deve fazer update direto. A contagem de uso precisará ser enviada via M2M para o Sumaúma no futuro. Para a SPEC-006, deixaremos essa atualização comentada e registrada como um aviso no Logger em vez de travar o banco.

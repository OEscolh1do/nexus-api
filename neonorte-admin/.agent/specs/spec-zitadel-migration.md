# Specification: ZITADEL IdP Migration (Visão Pós-MVP)

## 1. `/speckit.specify` — O Quê

**Problema de Negócio:**
Atualmente a plataforma Neonorte (Iaçã + Kurupira) possui um sistema de autenticação monolítico (Tabela `User` no Iaçã) gerido pelo próprio backend. Com a evolução do SaaS e a necessidade de incluir auditoria enterprise, Single Sign-On (SSO) do Google/Microsoft, provisionamento B2B e MFA (Multi-Factor Authentication), manter e escalar um sistema próprio de Auth se torna um anti-pattern perigoso e caro. 

**Objetivo Pós-MVP:**
Migrar a Gestão de Identidade (IAM) do banco local do Iaçã para o **ZITADEL** (Identity & Access Management open-source cloud-native). 

**Usuário Final:**
- Todos os usuários de todos os Tenants (Logarão via tela centralizada do ZITADEL).
- Administradores (Mudarão o foco de "gerir senhas" para "gerir roles e permissões").

**Critérios de Aceitação (DoD):**
- Iaçã e Kurupira deixam de validar senhas locais e passam a confiar nos tokens JWT (OIDC/OAuth2) emitidos pelo ZITADEL.
- O Neonorte Admin BFF se comunica com a ZITADEL API (via M2M Service User) para provisionar Tenants (Organizations no Zitadel) e Usuários de forma transparente.
- Quando um usuário clica em "Login", ele é redirecionado para a página do ZITADEL e devolvido ao sistema (SSO).
- O Prisma Schema de `User` deixa de armazenar `passwordHash` e passa a apenas referenciar o `subject_id` (Auth ID) vindo do ZITADEL, sendo utilizado apenas para relacionamentos relacionais de negócio (ex: "Qual usuário criou este Design Técnico").

---

## 2. `/speckit.plan` — O Como (Implementação Estratégica)

### Fase A: Preparação (Shadow Auth)
1. **Configuração ZITADEL**:
   - Criar o projeto base no ZITADEL Cloud (ou self-hosted).
   - Criar "Service Users" (PATs) para que o Iaçã Backend e o Admin BFF possam chamar as APIs do ZITADEL (M2M).
2. **Schema Prisma**:
   - Adicionar `authProviderId String? @unique` ao schema `User`.

### Fase B: Sincronização e Admin BFF
1. Ao criar um Tenant no Neonorte Admin, o BFF chama a API do ZITADEL: `POST /management/v1/orgs` criando uma organização.
2. Ao criar um Usuário, o BFF cria no ZITADEL (`POST /management/v1/users/human`) e salva o ID retornado na tabela do Iaçã (`authProviderId`).

### Fase C: OIDC Login e Token Introspection
1. O Front-end do Iaçã e o Admin são atualizados para usar um provedor OAuth (ex: `react-oidc-context`).
2. O botão "Entrar" não chama mais `/api/v1/auth/login`, mas engatilha o fluxo PKCE com a URL de Auth do ZITADEL.
3. O Backend (Iaçã e Kurupira) trocam o middleware `authenticateToken` atual por uma validação JWT que verifica a assinatura usando o JWKS público do ZITADEL e faz o matching do token `sub` com o `authProviderId`.

---

## 3. `Divine Triad` & `Chain-of-Verification`

**Dike (Validador de Riscos e Análise Estática):**
- *Risco de Migração (CoVe):* O que acontece com as senhas existentes dos usuários locais já cadastrados no Iaçã?
  - *Correção*: ZITADEL permite importação de hash (BCrypt) via API. Será necessário um script `seed_zitadel_migration.js` que lê o banco atual e faz a carga no ZITADEL.
- *Risco M2M (CoVe):* Se o ZITADEL cair, o SaaS inteiro cai?
  - *Correção*: Sim, a autenticação depende do IdP. O JWKS do ZITADEL deve ter caching em memória no backend (ex: pacote `jwks-rsa`) para validar os tokens de sessão sem precisar chamar o servidor ZITADEL a cada requisição de API.
- *Verificação de Tenant Isolação:* O ZITADEL trata isolação via "Organizations". É preciso mapear os "Tenants" do Neonorte 1:1 com as "Orgs" do ZITADEL para garantir que um usuário não acesse recursos de outra Org.

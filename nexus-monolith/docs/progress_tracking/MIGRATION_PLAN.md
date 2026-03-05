# Plano Diretor de Migração: Hostinger para Cloud-Native (Supabase + Edge)

Este documento define as diretrizes, fases e responsabilidades para desacoplar o **Neonorte | Nexus** do atual servidor compartilhado (Hostinger) para uma arquitetura escalável baseada em Nuvem.

## Visão Arquitetural Alvo Definida (Cenário "SaaS Moderno")
*   **Frontend (React/Vite):** Hospedagem Serverless/Edge na **Cloudflare Pages** ou **Vercel**. Deploy contínuo ativado via repositório.
*   **Backend (Node.js API):** Hospedagem em Container/PaaS no **Fly.io** (Foco em Server Node.js com região GRU-São Paulo para latência zero com o Supabase).
*   **Database & Auth:** **Supabase** (PostgreSQL). Substituição total do MySQL e delegando futuramente a Autenticação.

---

## 🗺️ Fases da Migração

A migração foi dividida em Fases Controladas para garantir *zero downtime* ou perda de dados. Nenhuma fase avança sem a validação (Check-point) da anterior.

### Fase 1: Adequação da Camada de Banco de Dados (ORM) [✅ CONCLUÍDA]
**Objetivo:** Adaptar o código do Backend para falar a língua do PostgreSQL em vez do MySQL de forma local, sem quebrar a estrutura.
- [x] Alterar o `provider` no `backend/prisma/schema.prisma` de `"mysql"` para `"postgresql"`.
- [x] Mapear as tipagens nativas do MySQL (ex: `@db.LongText`, `@db.TinyInt`) para seus equivalentes no PostgreSQL.
- [x] Adaptar queries brutas (`prisma.$queryRaw`) que usem sintaxe exclusiva do MySQL, caso existam.
- [x] Rodar validação local de compilação do Prisma Cliente.

### Fase 2: Provisionamento da Nuvem [✅ CONCLUÍDA]
**Objetivo:** Criar o novo banco de dados no Supabase.
- [x] Criar o Projeto "Neonorte Nexus" no Supabase e resgatar as chaves (`DATABASE_URL`, `DIRECT_URL`).
- [x] Atualizar o `.env` local com as variáveis do banco Supabase.
- [x] Aplicar o DDL gerado na Fase 1 (estruturas de tabelas) no ambiente do Supabase (`npx prisma db push`).

### Fase 3: Extração e Migração de Dados (ETL) [✅ CONCLUÍDA]
**Objetivo:** Transportar os dados existentes de um motor para o outro.
- [x] Desenvolver script de ETL (`migrate.js`) em Node.js.
- [x] Conectar simultaneamente no MySQL (Source) e PostgreSQL (Target).
- [x] Realizar a extração dos dados legados, transformando bools, resolvendo Foreign Keys e inserindo no Supabase.
- [x] Validar a integridade dos dados cruzados.

### Fase 4: O Grande Lançamento (Deploy na Nuvem) [✅ CONCLUÍDA]
**Objetivo:** Colocar a aplicação em produção nativa na web com Latência Zero.
- [x] Configurar hospedagem do Backend no **Fly.io** (Região GRU - São Paulo).
- [x] Resolver erros de build no `Dockerfile` e ajustar scripts do NPM.
- [x] Injetar variáveis de ambiente seguras (Secrets) na nuvem do Fly.io.
- [x] Configurar o Frontend Vite com variáveis de ambiente de produção (`.env.production`).
- [x] Realizar o deploy do Frontend na **Cloudflare Pages** conectado diretamente ao GitHub (branch `main`).
- [x] Redefinir senhas com Bcryptjs para acesso administrativo em produção.

**Links de Produção Atuais:**
* **Frontend:** [https://neonorte-nexus-frontend.pages.dev/](https://neonorte-nexus-frontend.pages.dev/)
* **Backend API:** [https://neonorte-nexus-api.fly.dev](https://neonorte-nexus-api.fly.dev)

### Fase 5 (Futuro): Governança de Autenticação
**Objetivo:** Migrar o controle de Usuários para o Supabase Auth.
- [ ] Integrar Supabase Auth no Frontend.
- [ ] Substituir emissões legadas de Token (JWT customizado) e mover regras de autorização de níveis de acesso (RBAC e Multi-tenant) para as Row Level Security (RLS) do Banco de Dados.

# Plano Diretor de Migração: Hostinger para Cloud-Native (Supabase + Edge)

Este documento define as diretrizes, fases e responsabilidades para desacoplar o **Neonorte | Nexus** do atual servidor compartilhado (Hostinger) para uma arquitetura escalável baseada em Nuvem.

## Visão Arquitetural Alvo Definida (Cenário "SaaS Moderno")
*   **Frontend (React/Vite):** Hospedagem Serverless/Edge na **Cloudflare Pages** ou **Vercel**. Deploy contínuo ativado via repositório.
*   **Backend (Node.js API):** Hospedagem em Container/PaaS no **Fly.io** (Foco em Server Node.js com região GRU-São Paulo para latência zero com o Supabase).
*   **Database & Auth:** **Supabase** (PostgreSQL). Substituição total do MySQL e delegando futuramente a Autenticação.

---

## 🗺️ Fases da Migração

A migração foi dividida em Fases Controladas para garantir *zero downtime* ou perda de dados. Nenhuma fase avança sem a validação (Check-point) da anterior.

### Fase 1: Adequação da Camada de Banco de Dados (ORM)
**Objetivo:** Adaptar o código do Backend para falar a língua do PostgreSQL em vez do MySQL de forma local, sem quebrar a estrutura.
- [ ] Alterar o `provider` no `backend/prisma/schema.prisma` de `"mysql"` para `"postgresql"`.
- [ ] Mapear as tipagens nativas do MySQL (ex: `@db.LongText`, `@db.TinyInt`) para seus equivalentes no PostgreSQL.
- [ ] Adaptar queries brutas (`prisma.$queryRaw`) que usem sintaxe exclusiva do MySQL, caso existam.
- [ ] Rodar validação local de compilação do Prisma Cliente.

### Fase 2: Provisionamento da Nuvem e ETL (Data Migration)
**Objetivo:** Criar o banco e transportar os dados existentes de um motor para o outro.
- [ ] Criar o Projeto "Neonorte Nexus" no Supabase e resgatar as chaves (`DATABASE_URL`, `SUPABASE_KEY`).
- [ ] Aplicar o DDL gerado na Fase 1 (estruturas de tabelas) no ambiente do Supabase (`prisma db push` ou gerar arquivos de *migration*).
- [ ] Realizar um *dump* seguro dos dados legados (Hostinger) usando ferramentas de ETL (como `pgloader` ou scripts Node de Seeders construídos sob medida) para inserir o volume histórico de clientes, oportunidades e configs no Postgres do Supabase.

### Fase 3: Homologação e Redirecionamento (Cutover)
**Objetivo:** Transferir a carga de apontamento para a nova nuvem.
- [ ] Atualizar o `.env` de homologação/produção direcionando para o banco Supabase.
- [ ] Testar todos os fluxos críticos de CRUD (Criar, Ler, Atualizar, Deletar) via interface visual do Frontend.
- [ ] Implantação e Deploy contínuo do Front-end (ex: Cloudflare Pages).
- [ ] Monitoramento contínuo pós-migração.

### Fase 4 (Longo Prazo/Opcional): Governança de Autenticação
**Objetivo:** Migrar o controle de Usuários para o Supabase Auth.
- [ ] Integrar Supabase Auth no Frontend.
- [ ] Substituir emissões legadas de Token (JWT customizado) e mover regras de autorização de níveis de acesso (RBAC e Multi-tenant) para as Row Level Security (RLS) do Banco de Dados.

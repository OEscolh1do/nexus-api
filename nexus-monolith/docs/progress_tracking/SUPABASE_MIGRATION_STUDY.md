# Estudo de Viabilidade: Migração para Supabase e Cloud Readiness

Este relatório analisa a prontidão atual do **Neonorte | Nexus** para operar de forma nativa na nuvem e os desafios/estratégias para migrar seu banco de dados atual para o **Supabase**.

---

## 🏗️ 1. Estado Atual da Arquitetura (Health Check)

Conduzi testes de inicialização e compilação nas duas pontas do monólito (`backend` e `frontend`) para entender o estado operacional real:

*   **Backend (Node.js + Prisma):** ✅ **Operacional**
    *   O servidor iniciou com sucesso na porta 3001.
    *   A conexão com o banco de dados atual no Hostinger remoto (`mysql://...`) está ativa via Prisma.
    *   Foi necessário rodar a instalação de pacotes com `--legacy-peer-deps` devido a conflitos de versão antigos, o que indica que as dependências backend precisam de uma revisão futura, mas não bloqueiam o funcionamento.
*   **Frontend (React + Vite):** ⚠️ **Parcialmente Operacional**
    *   A instalação das dependências foi bem sucedida (via `--legacy-peer-deps`).
    *   A aplicação **não passa no build de produção** (`npm run build`). O compilador TypeScript (`tsc -b`) encontrou **16 erros** de tipagem espalhados por módulos (`commercial` e componente `WorkloadHeatmap` no `ops`).
    *   *Nota:* O ambiente de desenvolvimento (`npm run dev`) funciona normalmente, mas os erros TypeScript afetam integrações contínuas (CI/CD) ao efetuar deploy para Vercel, Netlify ou assemelhados.

---

## ☁️ 2. Considerações sobre Cloud Readiness

Para uma operação Cloud-Native "Ideal", uma aplicação deve ser "Stateless" (sem depender do estado local do HD da máquina servidora) e conteinerizável.
*   **Contêineres:** O backend já possui arquivos `.dockerignore` e `Dockerfile`, o que facilita muito um deploy escalável na AWS EC2/ECS, Google Cloud Run ou Render.
*   **Comunicação:** A separação física (Frontend numa pasta, Backend noutra) é o formato exato esperado para cloud operations (Frontend no edge via Vercel/Cloudflare; Backend auto-escalável).
*   **Conclusão Cloud Readiness:** A estrutura atual está bem adaptada para a nuvem. O único ofensor **crítico** são os erros de *build* do Frontend, que precisam ser resolvidos antes de automatizar um pipeline de CI/CD.

---

## 🗄️ 3. Viabilidade da Migração para o Supabase

O desejo de migrar para o Supabase possui alto valor estratégico, pois o Supabase entrega DB, Autenticação, Storage e Realtime via WebSockets tudo no mesmo ecossistema (PostgreSQL).

### Desafios Técnicos Identificados

1.  **Troca de Engine de Banco de Dados:**
    *   **Situação Atual:** O Prisma Schema aponta para `provider = "mysql"`.
    *   **Supabase:** Funciona exlusivamente em cima do **PostgreSQL**.
    *   **Impacto:** Migrar de MySQL para PostgreSQL via Prisma exige ajustes no `schema.prisma` (ex: tipos `@db.LongText` do MySQL viram `@db.Text` ou variáveis equivalentes no Postgres, `@db.VarChar` pode precisar de ressalvas). 
2.  **Migração de Dados (ETL):**
    *   Transformar o banco de dados envolverá exportar os dados do MySQL, transformar o *dump* (script SQL) para a sintaxe do PostgreSQL e inseri-lo no Supabase. O módulo PGloader ou scripts dedicados resolvem isso.
3.  **Refatoração do Módulo IAM (Segurança e Auth):**
    *   **Situação Atual:** O backend faz a gestão de senhas/tokens via JWT próprio e tabelas `User` e `Session`.
    *   **Supabase:** A melhor forma de usar Supabase é aproveitar o Supabase Auth. Precisaríamos migrar a criação de contas de JWT customizado para as APIS do Supabase, aproveitando recursos robustos como Row Level Security (RLS) nas tabelas. É o passo mais complexo, mas elimina muita lógica de backend.
4.  **Integração do Real-time (Opcional):**
    *   O Supabase oferece webhooks real-time que substituirão de forma imediata event-buses customizados quando se tratar de observar mudanças no banco (Event-driven architecture).

---

## 🎯 4. Proposta de Estratégia de Migração em 3 Fases

Se a decisão for avançar com o Supabase, recomendo que não se quebre a aplicação de uma vez. A seguinte estratégia minimiza riscos:

*   **Fase 1: Ajuste da Casa (Prep-work)**
    *   Resolver os 16 problemas de Build no TypeScript do Frontend.
    *   Alterar o `schema.prisma` local (numa branch separada) trocando a engine `"mysql"` para `"postgresql"`. Ajustar as diretrizes nativas `@db...` exclusivas de MySQL e gerar os scripts de migração iniciais vazios na nuvem.
*   **Fase 2: Migração de Dados a Quente**
    *   Provisionar o banco no Supabase.
    *   Trazer as tabelas do MySQL Hostinger para o Supabase via Prisma e *data seeding scripts* ou *pgloader*.
    *   Trocar fisicamente a URL do banco em homologação.
*   **Fase 3: Refatoração do Auth Hub (Longo prazo)**
    *   Assim que o novo banco de dados (PG) estiver atendendo às requisições do sistema sem o Supabase Auth, iniciaríamos a substituição da engine de login para o "Supabase Auth", delegando o Row Level Security (RLS) nativo no banco para atender ao Multi-Tenancy.

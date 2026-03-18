# Manual de Intervenções Manuais — Supabase (Neonorte)

> **Contexto**: O ecossistema Neonorte usa o Supabase em duas camadas distintas:
> - **Lumi**: Banco de equipamentos solares (`inverters`, `modules`, `user_profiles`) via `@supabase/supabase-js`
> - **Nexus API**: Banco relacional principal (PostgreSQL via Supabase + Prisma)

---

## 1. Acesso e Autenticação

### 1.1 Dashboard Web (principal interface de intervenção)

```
URL: https://app.supabase.com
```

Painel > Selecione o projeto `Neonorte` > Navegue pela sidebar.

### 1.2 Credenciais do Projeto

> [!CAUTION]
> Nunca commite esses valores. Eles ficam exclusivamente em [.env](file:///d:/Reposit%C3%B3rio_Pessoal/SaaS%20Projects/Neonorte/Neonorte/nexus-mcp-server/.env) local e nas variáveis de ambiente do deploy.

| Variável | Onde usar | Descrição |
|---|---|---|
| `VITE_SUPABASE_URL` | Lumi (frontend) | URL pública do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Lumi (frontend) | Chave anônima (pública, segura via RLS) |
| `DATABASE_URL` | Nexus API (Prisma) | String de conexão PostgreSQL direta |
| `SUPABASE_SERVICE_ROLE_KEY` | Scripts admin | Chave de serviço — **ignora RLS**, usar com extremo cuidado |

---

## 2. SQL Editor — Intervenções Diretas no Banco

Caminho no Dashboard: **SQL Editor** > `New Query`

### 2.1 Consultas de Diagnóstico

```sql
-- Listar todas as tabelas do schema public
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Ver estrutura de uma tabela específica
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'inverters'
ORDER BY ordinal_position;

-- Contar registros por tabela (diagnóstico rápido)
SELECT 
  schemaname, tablename, 
  n_live_tup AS rows_estimate
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

### 2.2 Intervenções em Dados (Lumi — Equipamentos)

```sql
-- Listar inversores ativos
SELECT id, manufacturer, model, power_ac_watts, is_active
FROM inverters
WHERE is_active = true
ORDER BY manufacturer, model;

-- Desativar um inversor por ID (sem deletar)
UPDATE inverters
SET is_active = false
WHERE id = '<uuid-aqui>';

-- Inserir manualmente um inversor de emergência
INSERT INTO inverters (manufacturer, model, power_ac_watts, max_input_voltage, 
  start_voltage, max_input_current, phases, efficiency_percent, mppts, is_active)
VALUES ('Fronius', 'Symo 5.0-3-M', 5000, 800, 200, 18, 'three', 98.0, 2, true);

-- Corrigir campo numérico armazenado como string (problema de schema legado)
UPDATE inverters
SET power_ac_watts = power_ac_watts::numeric
WHERE power_ac_watts::text ~ '^[0-9]+$';
```

### 2.3 Intervenções em Dados (Nexus API — Core CRM/ERP)

```sql
-- Consultar usuários do sistema
SELECT id, username, "fullName", role, "orgUnitId", "createdAt"
FROM "User"
ORDER BY "createdAt" DESC;

-- Forçar reset de status de um Lead travado
UPDATE "Lead"
SET status = 'NOVO'
WHERE id = '<lead-id>' AND status = 'PROCESSANDO';

-- Verificar Oportunidades vinculadas a um Lead
SELECT o.id, o.title, o.status, o."estimatedValue", o."createdAt"
FROM "Opportunity" o
WHERE o."leadId" = '<lead-id>';

-- Buscar logs de auditoria de uma ação específica
SELECT "userId", action, entity, "resourceId", details, timestamp
FROM "AuditLog"
WHERE entity = 'Lead' AND "resourceId" = '<lead-id>'
ORDER BY timestamp DESC
LIMIT 20;
```

---

## 3. Row Level Security (RLS) — Políticas de Acesso

Caminho no Dashboard: **Authentication** > **Policies**

> [!IMPORTANT]
> O Lumi usa `anon key` no frontend. Isso significa que **o RLS é a única barreira de segurança** para os dados expostos pela `anon key`. Nunca desative políticas sem entender o impacto.

### 3.1 Verificar Políticas Existentes

```sql
-- Listar todas as políticas de RLS
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;

-- Checar se RLS está habilitado em cada tabela
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### 3.2 Habilitar RLS em uma Tabela (se esquecido)

```sql
-- Habilitar RLS
ALTER TABLE inverters ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (para tabelas de equipamentos — sem auth necessária)
CREATE POLICY "public_read_inverters"
ON inverters FOR SELECT
USING (is_active = true);

-- Política de escrita apenas autenticada (para dados sensíveis)
CREATE POLICY "authenticated_write"
ON "user_profiles" FOR ALL
USING (auth.uid() = id);
```

### 3.3 Testar Política de RLS (simular anon user)

```sql
-- Testar comportamento como usuário anônimo
SET ROLE anon;
SELECT * FROM inverters LIMIT 5;
RESET ROLE;
```

---

## 4. Authentication — Gerenciamento de Usuários

Caminho no Dashboard: **Authentication** > **Users**

> [!NOTE]
> O sistema principal de autenticação do Neonorte é **customizado via JWT no Nexus API** (tabela `User` + `Session`). O Auth do Supabase é **exclusivo do Lumi**.

### 4.1 Operações via Dashboard

- **Criar usuário**: Authentication > Users > **Invite User**
- **Redefinir senha**: Selecione o usuário > **Send Recovery Email**
- **Banir usuário**: Selecione > **Ban User** (impede login sem deletar dados)
- **Ver logs de login**: Authentication > Logs

### 4.2 Operações via SQL

```sql
-- Listar usuários autenticados do Supabase Auth (schema auth, não public)
SELECT id, email, created_at, last_sign_in_at, banned_until
FROM auth.users
ORDER BY created_at DESC;

-- Verificar se um email já está registrado
SELECT id, email, confirmed_at
FROM auth.users
WHERE email = 'usuario@exemplo.com';

-- Reativar usuário banido
UPDATE auth.users
SET banned_until = NULL
WHERE email = 'usuario@exemplo.com';
```

---

## 5. Storage — Arquivos e Uploads

Caminho no Dashboard: **Storage** > **Buckets**

### 5.1 Buckets Relevantes no Neonorte

| Bucket | Conteúdo | Acesso |
|---|---|---|
| `energy-bills` | Faturas de energia dos leads (`energyBillUrl`) | Privado |
| `infrastructure-photos` | Fotos de infraestrutura das propostas técnicas | Privado |
| `avatars` | Fotos de perfil de usuários | Público |

### 5.2 Comandos de Gestão via SQL

```sql
-- Listar arquivos em um bucket (via função Supabase)
SELECT name, created_at, metadata
FROM storage.objects
WHERE bucket_id = 'energy-bills'
ORDER BY created_at DESC
LIMIT 20;

-- Remover arquivo órfão (sem Lead associado)
DELETE FROM storage.objects
WHERE bucket_id = 'energy-bills'
AND name = 'uploads/lead_<id>/conta.pdf';
```

### 5.3 Política de Storage Essencial

```sql
-- Dar acesso de leitura apenas ao dono do arquivo
CREATE POLICY "owner_read_only"
ON storage.objects FOR SELECT
USING (auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 6. Edge Functions — Deploy e Logs

Caminho no Dashboard: **Edge Functions**

### 6.1 Via Supabase CLI

```bash
# Instalar CLI (uma vez)
npm install -g supabase

# Login
supabase login

# Linkar ao projeto
supabase link --project-ref <project-ref>

# Deploy de uma função
supabase functions deploy nome-da-funcao

# Ver logs em tempo real
supabase functions logs nome-da-funcao --tail

# Invocar função localmente para teste
supabase functions invoke nome-da-funcao \
  --body '{"key": "value"}'
```

---

## 7. Migrations — Alterações de Schema

> [!WARNING]
> Migrations são irreversíveis em produção sem script específico de rollback. Sempre teste em branch/staging antes.

### 7.1 Via Supabase CLI (recomendado)

```bash
# Criar arquivo de migration
supabase migration new adicionar_coluna_inverters

# Aplica as migrations pendentes no banco linkado
supabase db push

# Gerar tipos TypeScript a partir do schema atual
supabase gen types typescript --linked > src/types/supabase.ts
```

### 7.2 Migration Manual Emergencial (via SQL Editor)

```sql
-- Exemplo: Adicionar coluna nova com valor padrão seguro
ALTER TABLE inverters
ADD COLUMN IF NOT EXISTS warranty_years INTEGER DEFAULT 10;

-- Exemplo: Criar índice para melhorar performance de busca
CREATE INDEX IF NOT EXISTS idx_leads_owner_status
ON "Lead" ("ownerId", status);

-- Exemplo: Renomear coluna (cuidado — quebra código que usa a coluna antiga)
ALTER TABLE inverters
RENAME COLUMN old_name TO new_name;
```

---

## 8. Monitoramento e Performance

Caminho no Dashboard: **Reports** e **Database** > **Query Performance**

### 8.1 Queries de Diagnóstico de Performance

```sql
-- Queries lentas (requer extensão pg_stat_statements)
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Índices não utilizados (candidatos a remoção)
SELECT schemaname, tablename, indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexname NOT LIKE '%pkey%';

-- Tamanho das tabelas
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(quote_ident(tablename))) AS total_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(quote_ident(tablename)) DESC;
```

---

## 9. Checklist de Intervenção de Emergência

Execute nesta ordem ao diagnosticar um problema de produção:

```
[ ] 1. Dashboard > Logs > Postgres para erros recentes
[ ] 2. Dashboard > Reports > API Requests para picos de tráfego
[ ] 3. SQL: Verificar se RLS está bloqueando legitimamente
[ ] 4. SQL: Checar se a tabela afetada tem dados corretos (SELECT limitado)
[ ] 5. Identificar se é problema de dados, schema ou política
[ ] 6. Aplicar correção cirúrgica (UPDATE/ALTER TABLE)
[ ] 7. Validar que o frontend voltou ao normal
[ ] 8. Documentar a intervenção em AuditLog ou como comentário no SQL Editor
```

---

## 10. Referências Rápidas

| Recurso | Link |
|---|---|
| Dashboard Supabase | https://app.supabase.com |
| Docs: RLS | https://supabase.com/docs/guides/auth/row-level-security |
| Docs: CLI | https://supabase.com/docs/reference/cli |
| Docs: Storage | https://supabase.com/docs/guides/storage |
| Docs: Edge Functions | https://supabase.com/docs/guides/functions |

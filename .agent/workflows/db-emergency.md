# Workflow `/db-emergency` — Recuperação de Banco em Produção

Este workflow deve ser usado em situações críticas onde o banco de dados em produção foi resetado ou as migrações falharam por falta de permissão.

## Passo 1: Diagnóstico de Permissão
Se o erro for `ALTER command denied` ou falha de Foreign Key:
1. Recupere a senha root no `.env`.
2. Execute o GRANT ALL para o `user_admin`.

## Passo 2: Sincronização de Schemas
Execute o `prisma db push --force-reset` na ordem:
1. `db_sumauma` (schema.prisma)
2. `db_kurupira` (schema-kurupira.prisma)
3. `db_iaca` (schema-iaca.prisma)

## Passo 3: Restauração de Acesso (Bootstrap)
1. Crie o Tenant Master.
2. Crie a Role PLATFORM_ADMIN.
3. Insira o usuário vinculado ao Logto ID do operador.

## Referência Técnica
Para instruções detalhadas e comandos prontos para copiar, ative a skill:
`view_file("d:\Repositório_Pessoal\SaaS Projects\Neonorte\Ywara\.agent\skills\db-emergency-ops\SKILL.md")`

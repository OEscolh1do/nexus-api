---
name: db-emergency-ops
description: Protocolo de recuperação de produção após reset destrutivo de banco. Cobre elevação de privilégios MySQL, Prisma db push --force-reset e bootstrap manual de usuário admin. Ative quando: "ALTER command denied", "db push falhou", "perdi acesso ao painel após reset", "force-reset em produção", "usuário admin sumiu após migration".
---

# Skill: DB Emergency Ops — Recuperação de Produção

## Gatilho Semântico

Ative esta skill quando o desenvolvedor relatar qualquer um dos seguintes:
- `ALTER command denied` durante `prisma db push`
- `Access denied for user 'root'` ao tentar GRANT
- `403 Forbidden` ou `role insuficiente` após reset de banco
- "Perdi acesso ao painel admin após migration"
- `force-reset` bloqueado por falta de privilégios
- `Table 'db_sumauma.roles' doesn't exist` (Prisma schema naming mismatch)

## Protocolo

### Fase 1 — Elevação de Privilégios MySQL

**1.1 Identificar a senha root:**
```bash
cat /srv/ywara/.env | grep MYSQL_ROOT_PASSWORD
```

**1.2 Executar GRANT com senha inline** (sem espaço após `-p`):
```bash
docker exec -it neonorte_db mysql -u root -p<SENHA_INLINE> -e \
  "GRANT ALL PRIVILEGES ON *.* TO 'user_admin'@'%'; FLUSH PRIVILEGES;"
```
> ⚠️ `-p<senha>` sem espaço é obrigatório. `-p <senha>` com espaço é interpretado como senha vazia.

**1.3 Verificar sucesso (sem mensagem = sucesso):**
```bash
docker exec -it neonorte_db mysql -u root -p<SENHA_INLINE> -e \
  "SHOW GRANTS FOR 'user_admin'@'%';"
```

---

### Fase 2 — Reset de Schemas (Prisma db push --force-reset)

Executar na ordem correta (Sumaúma → Kurupira → Iaçã):

```bash
# 1. Schema principal (Sumaúma)
docker compose -f docker-compose.production.yml run --rm sumauma-backend \
  npx prisma db push --force-reset --schema=prisma/schema.prisma

# 2. Schema do Kurupira
docker compose -f docker-compose.production.yml run --rm sumauma-backend \
  npx prisma db push --force-reset --schema=prisma/schema-kurupira.prisma

# 3. Schema do Iaçã
docker compose -f docker-compose.production.yml run --rm sumauma-backend \
  npx prisma db push --force-reset --schema=prisma/schema-iaca.prisma
```

**Saída esperada de sucesso:**
```
The MySQL database "db_X" was successfully reset.
🚀  Your database is now in sync with your Prisma schema.
```

---

### Fase 3 — Bootstrap do Usuário Admin

**3.1 Descobrir o Logto sub do operador:**
```bash
docker logs neonorte_admin --tail 50 | grep '"sub"'
# Procure: "sub":"osvx..." nos warns de acesso negado
```

**3.2 Descobrir os nomes reais das tabelas** (Prisma usa PascalCase singular):
```bash
docker exec -it neonorte_db mysql -u root -p<SENHA_INLINE> -e \
  "USE db_sumauma; SHOW TABLES; DESCRIBE User;"
```

**3.3 Inserir registros de fundação:**
```bash
docker exec -it neonorte_db mysql -u root -p<SENHA_INLINE> -e "
USE db_sumauma;

INSERT IGNORE INTO Tenant (id, name, type, status, createdAt, updatedAt)
VALUES ('master-tenant', 'Neonorte Global', 'MASTER', 'ACTIVE', NOW(3), NOW(3));

INSERT IGNORE INTO Role (id, name, level, tenantId, createdAt, updatedAt)
VALUES ('platform-admin-role', 'PLATFORM_ADMIN', 'PLATFORM', 'master-tenant', NOW(3), NOW(3));

INSERT IGNORE INTO User (id, username, password, fullName, role, roleId, tenantId, authProviderId, status, createdAt, updatedAt)
VALUES ('admin-user-001', 'admin_neonorte', 'placeholder', 'Admin Neonorte',
        'PLATFORM_ADMIN', 'platform-admin-role', 'master-tenant',
        '<LOGTO_SUB>', 'ACTIVE', NOW(3), NOW(3));
"
```

**3.4 Verificar inserção:**
```bash
docker exec -it neonorte_db mysql -u root -p<SENHA_INLINE> -e \
  "USE db_sumauma; SELECT id, role, authProviderId, status FROM User;"
```

**3.5 Reiniciar containers para aplicar:**
```bash
docker compose -f docker-compose.production.yml up -d --force-recreate sumauma-backend kurupira-backend
```

---

### Fase 4 — Diagnóstico de Acesso Negado Persistente

Se após o bootstrap o 403 persistir, verificar o middleware `platformAuth.js`:

O campo verificado é `dbUser.role === 'PLATFORM_ADMIN'` (campo legado de string na tabela `User`, não a FK `roleId`). Corrigir via:

```bash
docker exec -it neonorte_db mysql -u root -p<SENHA_INLINE> -e \
  "USE db_sumauma; UPDATE User SET role = 'PLATFORM_ADMIN' WHERE authProviderId = '<LOGTO_SUB>';"
```

---

## Avisos e Limitações

- **NUNCA** rodar `--force-reset` sem confirmar com o usuário que a perda de dados é aceitável.
- **SEMPRE** verificar `SHOW TABLES` antes de escrever SQL — Prisma gera nomes PascalCase que não podem ser adivinhados.
- Esta skill **NÃO** cobre restore de backup ou migração com dados preservados — apenas reset destrutivo.
- Após o GRANT `ON *.*`, revogar para `ON db_X.*` quando possível para seguir o princípio do menor privilégio:
  ```bash
  REVOKE ALL ON *.* FROM 'user_admin'@'%';
  GRANT ALL ON db_sumauma.* TO 'user_admin'@'%';
  GRANT ALL ON db_kurupira.* TO 'user_admin'@'%';
  GRANT ALL ON db_iaca.* TO 'user_admin'@'%';
  FLUSH PRIVILEGES;
  ```

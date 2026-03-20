# 🔄 Guia de Reset Completo do Banco (Hostinger)

> **IMPORTANTE:** Este processo apaga TODOS os dados. Só execute se tiver certeza!

---

## 📋 Passo-a-Passo

### 1️⃣ Limpar o Banco Atual

**Via phpMyAdmin (Hostinger):**

1. Acesse phpMyAdmin
2. Selecione o banco `u713519169_nexus`
3. Vá na aba **"SQL"**
4. Cole o conteúdo de `0_RESET_DATABASE.sql`
5. Clique **"Executar"**
6. Verifique a mensagem: `"Banco de dados limpo..."`

### 2️⃣ Aplicar Todas as Migrações do Prisma

**No seu terminal local:**

```bash
# Navegar para o backend
cd nexus-core/backend

# Aplicar todas as migrações (incluindo AuditLog)
npx prisma migrate deploy

# Ou, se preferir forçar sync direto:
npx prisma db push --accept-data-loss
```

> **Nota:** `--accept-data-loss` é seguro aqui porque acabamos de apagar tudo.

### 3️⃣ Popular com Dados Iniciais (Seed)

```bash
# Executar script de seed
node seed_admin_fix.js

# Ou se tiver script npm:
npm run seed
```

**O que o seed cria:**

- ✅ Usuário admin (username: `admin`, password: `123`)
- ✅ Estratégia padrão
- ✅ Estrutura inicial

### 4️⃣ Verificar que Funcionou

```bash
# Gerar cliente Prisma atualizado
npx prisma generate

# Verificar conexão
npx prisma db pull

# Iniciar backend
npm run dev
```

**Teste no navegador:**

```
POST http://localhost:3001/auth/login
{
  "username": "admin",
  "password": "123"
}
```

Deve retornar token e dados do usuário.

---

## 🎯 Comandos Rápidos (Copiar e Colar)

```bash
# Reset completo automatizado
cd nexus-core/backend

# 1. Aplicar migrations
npx prisma db push --accept-data-loss --skip-generate

# 2. Gerar cliente
npx prisma generate

# 3. Popular dados iniciais
node seed_admin_fix.js

# 4. Iniciar servidor
npm run dev
```

---

## ✅ Validação Pós-Reset

### Verificar Tabelas Criadas

**Via phpMyAdmin → SQL:**

```sql
SHOW TABLES;
```

**Deve retornar:**

- AuditLog ✅
- User ✅
- Strategy ✅
- KeyResult ✅
- Project ✅
- Task ✅
- TaskDependency ✅
- Checklist ✅
- ChecklistItem ✅
- HRLeave ✅

### Verificar Usuário Admin

```sql
SELECT id, username, role FROM User WHERE username = 'admin';
```

Deve retornar 1 linha.

---

## 🚨 Troubleshooting

### Erro: "Cannot connect to database"

**Verifique `.env`:**

```env
DATABASE_URL="mysql://u713519169_user:bud4X891fd%40v1@193.203.175.202/u713519169_nexus"
```

Certifique-se que:

- Username correto: `u713519169_user`
- Password correto (com `%40` para `@`)
- Host correto: `193.203.175.202`
- Database correto: `u713519169_nexus`

### Erro: "Access denied"

Verifique as credenciais no painel do Hostinger.

### Erro: "Table already exists"

Execute o `0_RESET_DATABASE.sql` novamente para limpar.

---

## 📞 Próximos Passos Após Reset

Com o banco limpo e o AuditLog funcionando:

1. ✅ Testar validação Zod (já temos 10/10 testes passando)
2. ✅ Testar middleware RBAC (criar projetos com diferentes usuários)
3. ✅ Verificar logs de auditoria no banco após update
4. ✅ Iniciar Shadow Mode para migração SolarFlow

---

**Última Atualização:** 2026-01-20  
**Responsável:** Antigravity AI  
**Status:** Pronto para execução

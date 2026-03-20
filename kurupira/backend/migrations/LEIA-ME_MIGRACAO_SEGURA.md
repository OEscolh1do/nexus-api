# 🛡️ Guia de Migração Segura - AuditLog

> **CRÍTICO:** Nunca execute `prisma migrate reset` ou `DROP DATABASE` em produção!

---

## 📋 Checklist Pré-Migração

### 1. Backup Obrigatório (NUNCA PULE ESTE PASSO)

**Via phpMyAdmin (Hostinger):**

1. Acesse phpMyAdmin do seu banco `u71351169_nexus`
2. Selecione o banco na barra lateral
3. Clique na aba **"Exportar"**
4. Escolha **"Método: Rápido"**
5. Formato: **SQL**
6. Clique **"Executar"**
7. Salve o arquivo: `nexus_backup_ANTES_auditlog_2026-01-20.sql`

**Via MySQL CLI (se tiver acesso SSH):**

```bash
mysqldump -u u71351169_neonorte -p u71351169_nexus > backup_antes_auditlog.sql
```

### 2. Verificar Conexão

Teste se consegue conectar ao banco:

```bash
# No nexus-core/backend
npx prisma db pull
```

Se funcionar, significa que o `DATABASE_URL` no `.env` está correto.

---

## 🚀 Executar Migração

### Opção A: Via phpMyAdmin (Recomendado para Hostinger)

1. Abra phpMyAdmin no Hostinger
2. Selecione o banco `u71351169_nexus`
3. Clique na aba **"SQL"**
4. Cole o conteúdo do arquivo `manual_add_auditlog.sql`
5. Clique **"Executar"**
6. Verifique a mensagem: `"AuditLog table created successfully!"`

### Opção B: Via Prisma Migrate (Se tiver acesso direto)

```bash
# No nexus-core/backend
npx prisma migrate deploy
```

> **Nota:** `migrate deploy` é seguro para produção (não reseta dados).

---

## ✅ Validação Pós-Migração

### 1. Verificar que a tabela foi criada

**Via phpMyAdmin:**

- Vá em "Estrutura" do banco
- Procure por `AuditLog` na lista de tabelas

**Via Prisma:**

```bash
npx prisma db pull
# Deve mostrar AuditLog no schema
```

### 2. Testar insert básico

Execute no phpMyAdmin → SQL:

```sql
-- Teste básico (substitua 'usr001' por um userId válido do seu banco)
INSERT INTO AuditLog (id, userId, action, resourceId, timestamp)
VALUES ('test001', 'usr001', 'TEST_ACTION', 'resource001', NOW());

-- Verificar
SELECT * FROM AuditLog WHERE id = 'test001';

-- Limpar teste
DELETE FROM AuditLog WHERE id = 'test001';
```

### 3. Testar via API do Neonorte | Nexus

Reinicie o backend e tente atualizar um projeto:

```bash
# Reiniciar backend (se estiver rodando)
# Ctrl+C no terminal do npm run dev
npm run dev

# O log de auditoria agora deve funcionar
```

---

## 🔄 Rollback (Se Algo Der Errado)

Se a migração falhar ou causar problemas:

### 1. Restaurar Backup

**Via phpMyAdmin:**

1. Aba **"Importar"**
2. Escolha o arquivo: `nexus_backup_ANTES_auditlog_2026-01-20.sql`
3. Clique **"Executar"**

**Via MySQL CLI:**

```bash
mysql -u u71351169_neonorte -p u71351169_nexus < backup_antes_auditlog.sql
```

### 2. Remover apenas a tabela AuditLog

```sql
DROP TABLE IF EXISTS `AuditLog`;
```

---

## 🚨 O Que NÃO Fazer

### ❌ NUNCA execute estes comandos em produção:

```bash
# ❌ PERIGOSO - Apaga TUDO
npx prisma migrate reset

# ❌ PERIGOSO - Força mudanças destrutivas
npx prisma migrate dev --force

# ❌ PERIGOSO - Apaga o banco inteiro
DROP DATABASE u71351169_nexus;
```

### ✅ Comandos seguros para produção:

```bash
# ✅ Seguro - Apenas aplica migrações pendentes
npx prisma migrate deploy

# ✅ Seguro - Sincroniza schema sem perder dados
npx prisma db push

# ✅ Seguro - Apenas visualização
npx prisma db pull
```

---

## 📞 Suporte

Se encontrar erros durante a migração:

1. **NÃO ENTRE EM PÂNICO**
2. **NÃO delete nada sem backup**
3. Copie a mensagem de erro completa
4. Restaure o backup se necessário
5. Peça ajuda com a mensagem de erro específica

---

**Última Atualização:** 2026-01-20  
**Responsável:** Antigravity AI  
**Status:** Pronto para execução em produção

# 🚨 Resolver Erro de Migração Prisma - Neonorte | Nexus 2.0

> **🎯 Cenário de Uso:** Diagnosticar e resolver erros de migração Prisma
> **⏱️ Tempo Estimado:** 10-20 minutos

---

## ✂️ PROMPT PRÉ-CONFIGURADO

```xml
<mission>
  Resolver erro de migração Prisma: "{{MENSAGEM_DE_ERRO}}"
</mission>

<error_context>
  **Erro:** {{CODIGO_ERRO_PRISMA}}
  **Mensagem:** {{MENSAGEM_COMPLETA}}
  **Quando ocorreu:** {{CONTEXTO}}
</error_context>
```

---

## 📖 Erros Comuns e Soluções

### P2002: Unique Constraint Failed

**Erro:**

```
Unique constraint failed on the constraint: `Strategy_code_key`
```

**Causa:** Tentando criar registro com campo único duplicado.

**Solução:**

```javascript
// Verificar antes de criar
const existing = await prisma.strategy.findUnique({
  where: { code: "STR001" },
});

if (existing) {
  throw new Error("Código já existe");
}
```

### P2025: Record Not Found

**Erro:**

```
An operation failed because it depends on one or more records that were required but not found.
```

**Causa:** Tentando atualizar/deletar registro inexistente.

**Solução:**

```javascript
const record = await prisma.model.findUnique({ where: { id } });
if (!record) {
  return res.status(404).json({ message: "Registro não encontrado" });
}
```

### P1001: Can't Reach Database

**Erro:**

```
Can't reach database server at `mysql:3306`
```

**Solução:**

```bash
# Verificar se MySQL está rodando
docker ps | grep mysql

# Reiniciar container
docker-compose restart mysql

# Verificar DATABASE_URL no .env
DATABASE_URL="mysql://user:password@localhost:3306/nexus"
```

### Migração Pendente

**Erro:**

```
There are pending migrations that have not been applied
```

**Solução:**

```bash
cd backend
npx prisma migrate deploy  # Produção
# ou
npx prisma migrate dev     # Desenvolvimento
```

### Reverter Migração

```bash
# Ver histórico
npx prisma migrate status

# Reverter última migração (CUIDADO: pode perder dados!)
npx prisma migrate resolve --rolled-back <migration_name>

# Resetar banco (DESENVOLVIMENTO APENAS)
npx prisma migrate reset
```

---

## ✅ Checklist de Debugging

- [ ] Erro identificado (código P20XX)
- [ ] Causa raiz encontrada
- [ ] Solução aplicada
- [ ] Migração executada com sucesso
- [ ] Dados preservados (se aplicável)
- [ ] Testado manualmente

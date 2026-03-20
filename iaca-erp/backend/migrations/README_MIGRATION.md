# Script de Migração - Guia de Uso

## 🚀 Como Executar

### 1. Preparação

```bash
# 1.1 Criar backup do banco
mysqldump -u root -p nexus_db > backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql

# 1.2 Criar tabela MigrationAudit
mysql -u root -p nexus_db < migrations/001_add_migration_audit_table.sql

# 1.3 Verificar tabela criada
mysql -u root -p nexus_db -e "DESC MigrationAudit"
```

### 2. Dry-Run (SEMPRE PRIMEIRO!)

```bash
# Simular migração sem persistir dados
DRY_RUN=true node migrations/migrate_projects_to_quotes_v2.js
```

**O que verificar:**

- ✅ Quantos projects serão migrados
- ✅ Se validações estão passando
- ✅ Se há erros de schema
- ✅ Estimativas de valores comerciais

### 3. Migração Real (Staging)

```bash
# Migração real em batches pequenos
BATCH_SIZE=10 node migrations/migrate_projects_to_quotes_v2.js
```

**Monitorar:**

- Checkpoints a cada 5 batches
- Taxa de sucesso
- Erros específicos

### 4. Migração Produção

```bash
# Após validar staging, executar em produção
BATCH_SIZE=20 node migrations/migrate_projects_to_quotes_v2.js
```

## 🔧 Variáveis de Ambiente

| Variável         | Padrão  | Descrição                       |
| ---------------- | ------- | ------------------------------- |
| `DRY_RUN`        | `false` | Se `true`, simula sem persistir |
| `BATCH_SIZE`     | `20`    | Quantos projects por batch      |
| `BATCH_DELAY_MS` | `2000`  | Delay entre batches (ms)        |

## 📊 Queries de Validação

```sql
-- 1. Quantos projects serão migrados?
SELECT COUNT(*) as eligible_projects
FROM Project
WHERE type = 'SOLAR'
  AND quoteId IS NULL
  AND status IN ('ATIVO', 'EM_ANDAMENTO')
  AND createdAt >= '2024-01-01'
  AND details IS NOT NULL;

-- 2. Após migração: Projects migrados
SELECT COUNT(*) as migrated
FROM Project
WHERE type = 'SOLAR' AND quoteId IS NOT NULL;

-- 3. Leads criados
SELECT COUNT(*) FROM Lead WHERE source = 'MIGRATION';

-- 4. Quotes aprovados
SELECT COUNT(*) FROM Quote WHERE status = 'APPROVED';

-- 5. Verificar integridade (deve retornar 0)
SELECT COUNT(*) as integrity_issues
FROM Project p
LEFT JOIN Quote q ON p.quoteId = q.id
WHERE p.type = 'SOLAR'
  AND p.quoteId IS NOT NULL
  AND q.id IS NULL;

-- 6. Audit log summary
SELECT
  status,
  COUNT(*) as count,
  AVG(duration_ms) as avg_duration_ms
FROM MigrationAudit
GROUP BY status;
```

## 🚨 Rollback

### Rollback Total (Via Backup)

```bash
# Parar aplicação
pm2 stop nexus-backend

# Restaurar backup
mysql -u root -p nexus_db < backup_pre_migration_YYYYMMDD_HHMMSS.sql

# Reiniciar
pm2 start nexus-backend
```

### Rollback Parcial (Por Batch)

```javascript
// rollback_batch.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function rollbackBatch(batchNumber) {
  const records = await prisma.migrationAudit.findMany({
    where: {
      batchNumber,
      status: "SUCCESS",
    },
  });

  for (const record of records) {
    await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: record.projectId },
        data: { quoteId: null },
      });

      if (record.quoteId) {
        await tx.quote.delete({ where: { id: record.quoteId } });
      }

      if (record.leadId) {
        await tx.lead.delete({ where: { id: record.leadId } });
      }
    });
  }

  console.log(`Batch ${batchNumber} rolled back`);
}

// Uso:
rollbackBatch(1); // Reverter batch 1
```

## 📁 Arquivos Gerados

- `migration_report_[timestamp].html` - Relatório visual completo
- `MigrationAudit` table - Audit trail em banco de dados

## ⚠️ Troubleshooting

### Erro: "Table MigrationAudit doesn't exist"

```bash
mysql -u root -p nexus_db < migrations/001_add_migration_audit_table.sql
```

### Erro: "Duplicate entry for quoteNumber"

- Improvável devido ao retry loop, mas se ocorrer, re-executar (idempotente)

### Erro: "Invalid JSON in solarData"

- Projects com JSON inválido são automaticamente SKIPPED
- Revisar no audit log e corrigir manualmente se necessário

### Performance lenta

```bash
# Reduzir batch size
BATCH_SIZE=5 node migrations/migrate_projects_to_quotes_v2.js
```

## ✅ Checklist Pós-Migração

- [ ] Executar queries de validação
- [ ] Verificar relatório HTML
- [ ] Testar "Ver Orçamento" em 5 projects aleatórios
- [ ] Confirmar zero erros de integridade
- [ ] Monitorar por 24-48h
- [ ] Arquivar logs e evidências
- [ ] Comunicar time sobre conclusão

## 📞 Suporte

Em caso de problemas:

1. Verificar `MigrationAudit` table para detalhes
2. Revisar messages no console
3. Executar queries de validação
4. Se necessário, rollback via backup

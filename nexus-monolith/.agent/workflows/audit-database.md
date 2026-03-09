---
description: How to audit a database model or table for performance, normalization and integrity issues
---

# Auditoria de Schema & Performance Database

## Quando Usar

- Queries lentas em tabelas específicas
- Incerteza sobre indexes existentes
- Modelo parece violar formas normais (dados duplicados)
- Suspeita de problemas de integridade (FKs faltando)
- Deadlocks ou race conditions

## Fase 1: Diagnóstico (DB Audit)

Analisar o modelo/tabela alvo usando os **5 Pilares de Integridade**:

### 1. Normalização vs Desnormalização Intencional
- O modelo está na 3FN? Se não, há justificativa documental?
- Há dados duplicados propensos a anomalias de update?

### 2. Estratégia de Indexação (Access Patterns)
- Existem índices cobrindo as queries de `WHERE` e `ORDER BY`?
- O índice é seletivo o suficiente?
- Existem índices redundantes pesando a escrita?

### 3. Integridade Referencial & Tipagem
- As chaves estrangeiras (FK) estão definidas?
- `OnDelete` actions estão seguras? (Cascade perigoso?)
- Tipos de dados são apropriados?

### 4. Performance de Query (N+1 & Full Scan)
- O código faz loops de queries (N+1)?
- Está carregando campos pesados (BLOB/TEXT) sem necessidade?
- Usar `select` estrito em listagens, carregar `payload` apenas no detalhe (lazy load)

### 5. Segurança & Concorrência
- Todas as queries passam por `withTenant(tx)`?
- Riscos de Race Conditions ou Deadlocks?
- CRONs usam locking distribuído via `cron-lock.js`?

## Output Esperado: `db_audit_report.md`

1. **Resumo Executivo** — Saúde do Schema (0-10), Risco de Performance
2. **Análise Técnica** — Para cada pilar violado: campo afetado, impacto, evidência
3. **Plano de Otimização** — Novos índices, alterações de tipo, refatoração de query
4. **Análise de Risco** — Breaking changes, tempo de migração

## Fase 2: Otimização (Após aprovação)

1. Ajustar `schema.prisma` com novos índices/tipos
2. Refatorar queries (usar `select` estrito, `include` apenas quando necessário)

// turbo
3. Aplicar mudanças:
```bash
cd backend && npx prisma db push && npx prisma generate
```

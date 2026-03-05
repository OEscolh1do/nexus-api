# 🔍 Auditoria de Schema & Performance Database - Neonorte | Nexus 2.0

> **🎯 Cenário de Uso**
>
> Você desconfia que uma tabela cresceu demais, uma query está lenta ou o modelo de dados está "estranho" (desnormalizado, confuso). Antes de alterar o schema, você precisa de um diagnóstico.
>
> **⏱️ Tempo Estimado:** 15-20 minutos (Análise + Relatório)

---

## 🔍 Quando Usar Este Template?

- ✅ Queries lentas em tabelas específicas
- ✅ Incerteza sobre indexes existentes
- ✅ Modelo parece violar formas normais (dados duplicados)
- ✅ Precisa refatorar relacionamentos complexos
- ✅ Suspeita de problemas de integridade (FKs faltando)

---

## 🔄 Abordagem em 2 Fases

### Fase 1: DB Audit (Diagnóstico)

- Analisar estrutura do Prisma Schema
- Identificar gargalos de performance (Teórico)
- Verificar integridade e normalização
- **Output:** `db_audit_report.md`

### Fase 2: Optimization (Correção)

- Criar migração de correção
- Adicionar indexes
- Refatorar queries
- Ajustar tipos de dados

---

## 📋 FASE 1: DB AUDIT (Copie este prompt)

```xml
<system_role>
  Atue como **Senior Database Administrator (DBA)** e Arquiteto de Dados.
  Especialidade: PostgreSQL/MySQL, Tuning de Performance, Normalização e Prisma ORM.
</system_role>

<mission>
  Auditar o modelo/tabela "{{NOME_DO_MODELO}}" e queries relacionadas.

  Problema Relatado: {{DESCREVA_O_PROBLEMA}}
  Exemplos:
  - "Query de busca de leads está lenta"
  - "Tabela de logs está gigante"
  - "Tenho que atualizar o status em 3 lugares diferentes"
  - "Muitos erros de Deadlock"
</mission>

<input_context>
  <critical_files>
    <file path="c:/Users/.../nexus-monolith/backend/prisma/schema.prisma" />
    <file path="{{ARQUIVO_COM_A_QUERY_LENTA}}" description="Onde a query é executada" />
  </critical_files>

  <metrics>
    - Número estimado de registros: {{NUM_REGISTROS}} (ex: 100k, 1M)
    - Frequência de escrita vs leitura: {{WRITE_VS_READ}} (ex: 80% Read / 20% Write)
  </metrics>

  <constraints>
    - Manter compatibilidade com Prisma
    - Minimizar downtime de migração
    - {{OUTRAS_RESTRICOES}}
  </constraints>
</input_context>

<audit_framework_database>
  Analise o caso usando os **5 Pilares de Integridade de Dados**:

  1. **Normalização vs Desnormalização Intencional**
     - O modelo está na 3FN? Se não, há justificativa documental?
     - Há dados duplicados propensos a anomalias de update?

  2. **Estratégia de Indexação (Access Patterns)**
     - Existem índices cobrindo as queries de `WHERE` e `ORDER BY`?
     - O índice é seletivo o suficiente?
     - Existem índices redundantes/inúteis pesando a escrita?

  3. **Integridade Referencial & Tipagem**
     - As chaves estrangeiras (FK) estão definidas?
     - `OnDelete` actions estão seguras? (Cascade perigoso?)
     - Tipos de dados são apropriados? (ex: `String` para data?)

  4. **Performance de Query (N+1 & Full Scan)**
     - O código faz loops de queries (N+1)?
     - Está carregando campos pesados (BLOB/TEXT) sem necessidade?
     - Ocorre *Full Table Scan* em tabelas grandes?

  5. **Segurança & Concorrência**
     - O modelo expõe dados sensíveis inadvertidamente?
     - Riscos de Race Conditions ou Deadlocks?
</audit_framework_database>

<output_instruction>
  NÃO GERE CÓDIGO DE MIGRAÇÃO AINDA.

  Gere um artefato `db_audit_report.md` contendo:

  ## 1. Resumo Executivo
  - Saúde do Schema (0-10)
  - Risco de Performance (Alto/Médio/Baixo)
  - 3 pontos críticos

  ## 2. Análise Técnica Profunda
  Para cada pilar violado:
  - Modelo/Campo afetado
  - Explicação técnica do impacto (ex: "Scan sequencial em 1M linhas")
  - Evidência no código (snippet)

  ## 3. Plano de Otimização

  ### A. Alterações de Schema (DDL)
  - Novos índices recomendados
  - Alterações de tipo/coluna

  ### B. Refatoração de Query (DML)
  - Como reescrever a query no Prisma
  - Uso de `include` vs `select`

  ## 4. Análise de Risco
  - Impacto na aplicação (Breaking Changes?)
  - Tempo estimado de execução da migração
</output_instruction>
```

---

## 📝 Exemplo Real: Auditoria de Logs

### Problema Relatado

"A listagem de auditoria do sistema demora 15 segundos para carregar."

### DB Audit Report Gerado

```markdown
# DB Audit Report: SystemLogs

## 1. Resumo Executivo

- **Saúde do Schema:** 4/10
- **Risco de Performance:** CRÍTICO
- **Veredito:** Tabela sem indexação em campo de busca textual e JSON gigante.

## 2. Análise Técnica

### ❌ Violação: Estratégia de Indexação (Pilar 2)

**Problema:** Busca por `actionType` e ordenação por `createdAt` sem índice composto.
**Impacto:** O banco faz Full Table Scan e depois File Sort em memória para cada request.

### ❌ Violação: Performance de Query (Pilar 4)

**Problema:** O campo `payload` (JSON) tem média de 50KB e é trazido no `SELECT *` da listagem, mas não é exibido na grid.
**Impacto:** Trafega 50MB de dados para mostrar 1000 linhas, saturando I/O e Rede.

## 3. Plano de Otimização

### A. Schema

1. Adicionar índice: `@@index([actionType, createdAt])`
2. Remover índice `@@index([createdAt])` (redundante se criar o acima, dependendo da ordem)

### B. Query

1. Usar `select` para trazer apenas ID, Data e Tipo na listagem.
2. Carregar `payload` apenas no detalhe (lazy load).
```

---

## 🔧 FASE 2: OPTIMIZATION (Copie após aprovar audit)

```xml
<mission>
  Executar plano de otimização conforme `db_audit_report.md`.
</mission>

<execution_protocol>
  <step_1>
    Ajustar `schema.prisma` com novos índices/tipos.
  </step_1>

  <step_2>
    Refatorar queries no arquivo `{{ARQUIVO_CONTROLLER}}`.
    **Regra:** Usar `select` estrito, nunca trazer campos desnecessários.
  </step_2>

  <step_3>
    Criar migração: `npx prisma migrate dev --name optimize_{{NOME}}`
  </step_3>
</execution_protocol>
```

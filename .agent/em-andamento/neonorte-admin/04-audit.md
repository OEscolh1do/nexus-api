# Spec — Módulo 04: Auditoria

> **Fase:** 3 (Rastreabilidade)  
> **Prioridade:** Média  
> **Estimativa:** 1–2 dias

---

## 1. Problema de Negócio

O operador precisa rastrear qualquer ação realizada na plataforma: quem fez o quê, quando e com quais dados. Isso é essencial para resolução de chamados de suporte, investigação de incidentes e conformidade regulatória.

## 2. Usuário Final

Operador da Neonorte com role `PLATFORM_ADMIN`.

---

## 3. Critérios de Aceitação (Definition of Done)

### 3.1 Timeline / Lista
- [ ] Tabela com colunas: **Timestamp**, **Usuário**, **Tenant**, **Ação**, **Entidade**, **IP**, **Expandir**
- [ ] Ordenação por timestamp (mais recente primeiro — padrão)
- [ ] Paginação de 50 itens por página (logs são densos)
- [ ] Indicador de quantidade total no período filtrado

### 3.2 Filtros
- [ ] Filtro por **Tenant** (dropdown buscável)
- [ ] Filtro por **Usuário** (busca por nome ou username)
- [ ] Filtro por **Ação** (ex: `USER_CREATED`, `PROJECT_DELETED`)
- [ ] Filtro por **Período** (date range picker: hoje / 7 dias / 30 dias / customizado)
- [ ] Botão "Limpar filtros"

### 3.3 Detalhe de Log
- [ ] Ao expandir uma linha, exibe payload completo:
  - `before`: estado anterior (JSON formatado e colorizado)
  - `after`: estado posterior (JSON formatado e colorizado)
  - `userAgent`: navegador do usuário
  - `ipAddress`: IP da requisição
- [ ] Diff visual entre `before` e `after` (linhas adicionadas em verde, removidas em vermelho)

### 3.4 Exportação
- [ ] Botão "Exportar CSV" — exporta os logs do filtro atual (máx. 5.000 linhas)

---

## 4. Fora do Escopo

- Deleção de logs de auditoria
- Criação manual de logs
- Integração com SIEM externo (Splunk, Datadog)

---

## 5. Interfaces de Dados

### Leitura (Prisma Read-Only → `db_iaca`)
```typescript
{
  id: string
  timestamp: Date
  action: string         // ex: 'USER_LOGIN', 'PROJECT_CREATED'
  entity: string | null  // ex: 'Project', 'User'
  resourceId: string
  details: string | null
  before: string | null  // JSON serializado
  after: string | null   // JSON serializado
  ipAddress: string | null
  userAgent: string | null
  user: { id: string; username: string; fullName: string }
  tenant: { id: string; name: string }
}
```

---

## 6. Rotas Backend (BFF) a Implementar/Verificar

| Método | Rota | Descrição |
|:---|:---|:---|
| `GET` | `/admin/audit-logs` | Lista com filtros e paginação |
| `GET` | `/admin/audit-logs/export` | Exportação CSV (stream) |

---

## 7. Componentes Frontend a Criar

| Arquivo | Descrição |
|:---|:---|
| `src/pages/AuditPage.tsx` | Página principal com timeline |
| `src/components/audit/AuditFilters.tsx` | Barra de filtros |
| `src/components/audit/AuditLogRow.tsx` | Linha expansível da tabela |
| `src/components/audit/DiffViewer.tsx` | Visualizador before/after |
| `src/hooks/useAuditLogs.ts` | Hook de dados com React Query |

---

## 8. Riscos e Alertas

> [!NOTE]
> O volume de logs pode ser muito alto. Garantir que a query sempre use índice (`@@index([tenantId])`, `@@index([userId, timestamp])` já existem no schema). Nunca fazer `findMany` sem `take` (paginação obrigatória).

> [!WARNING]
> Os campos `before` e `after` podem conter dados sensíveis (ex: senhas hasheadas). Não exibir campos com nome `password`, `token` ou `secret` no DiffViewer — mascarar com `****`.

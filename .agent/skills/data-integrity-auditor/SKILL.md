---
name: data-integrity-auditor
description: Auditor de integridade entre DB, Backend e Frontend no ecossistema Ywara. Rastreia a "cadeia da verdade" de uma entidade (ex: InverterCatalog) do schema Prisma até a UI, detectando campos órfãos, hardcoded, renomeados ou ausentes em qualquer camada.
---

# Skill: Data Integrity Auditor

## Gatilho Semântico

Ative esta skill quando o desenvolvedor mencionar:
- "O campo X não aparece na UI"
- "Esse dado é hardcoded ou vem do banco?"
- "Adicionei uma coluna no banco, o que mais preciso mudar?"
- "Tem algum campo no banco que o frontend não exibe?"
- "Mismatch entre backend e frontend"
- Qualquer erro do tipo `undefined`, `—` ou `null` onde um valor real era esperado
- Após qualquer `prisma migrate` ou `prisma generate` que adicione/remova colunas
- Antes de um deploy de uma feature que envolva dados de banco (pré-voo obrigatório)

---

## Protocolo: Cadeia da Verdade (Level 0 → Level 4)

Execute os 5 níveis em sequência. Cada nível audita uma camada. Documente os gaps encontrados.

---

### Level 0 — Banco de Dados (Schema como Verdade Absoluta)

**Ferramentas**: `view_file` nos arquivos `schema.prisma` de todos os serviços.

**Ywara tem múltiplos schemas:**
| Arquivo | Serviço | Acesso |
|---|---|---|
| `kurupira/backend/prisma/schema.prisma` | Kurupira | Leitura + Escrita |
| `sumauma/backend/prisma/schema-kurupira.prisma` | Sumaúma BFF | Leitura (RO) |
| `sumauma/backend/prisma/schema.prisma` | Sumaúma | Leitura + Escrita |

**O que verificar:**
- Listar **todas as colunas** do modelo alvo (ex: `InverterCatalog`)
- Verificar **consistência entre schemas**: o schema RO do Sumaúma tem as mesmas colunas que o schema principal do Kurupira?
- Identificar campos tipo `Json?` — eles são "caixas pretas" e precisam de auditoria separada (Level 1)

**Saída esperada:** Lista de colunas canônicas do modelo.

---

### Level 1 — Serviço de Extração/Persistência (Backend Kurupira)

**Ferramentas**: `view_file` em `catalogService.js` ou equivalente. `grep_search` por `electricalData`, `return {`, `prisma.inverterCatalog.create`.

**O que verificar:**
- Todo campo listado no Level 0 está sendo **populado** no serviço? (procurar por `null` defaults suspeitos)
- Campos dentro de objetos `Json` (`electricalData`): quais chaves são escritas?
- Existe **renomeação silenciosa**? (ex: banco chama `maxInputV`, serviço extrai para `VAbsMax`)
- Campos computados (ex: `efficiency` calculada a partir de `powerWp / (width * height * 1000)`) — a lógica está correta?

**Saída esperada:** Mapa `coluna_banco → variável_código → valor_exemplo`

---

### Level 2 — API / BFF (Sumaúma Backend)

**Ferramentas**: `view_file` em `sumauma/backend/src/routes/catalog.js`. `grep_search` por `select:`, `include:`, `exclude`.

**O que verificar:**
- A query Prisma usa `findMany` sem `select`? (seguro — retorna tudo)
- Existe algum `select` explícito que **omite** campos novos?
- O schema local RO (`schema-kurupira.prisma`) está em **sincronia** com o schema principal? (Stale Schema — o bug mais comum do Ywara)
- O endpoint PATCH recebe e repassa todos os campos editáveis?

**Saída esperada:** Lista de campos que chegam (ou não chegam) ao Frontend via JSON.

---

### Level 3 — Contrato TypeScript (Frontend Hook/Interface)

**Ferramentas**: `view_file` em `useCatalog.ts`. `grep_search` por interfaces como `InverterEquipment`, `ModuleEquipment`.

**O que verificar:**
- A interface TypeScript tem **todas as propriedades** que o backend envia?
- Algum campo está como `any` onde deveria ter tipo específico? (esconde bugs)
- **Naming drift**: o backend envia `vMinMpp`, a interface declara `vMinMppt`? (bug clássico)
- Campos dentro de `electricalData?: { ... }` — o sub-tipo reflete o que o `catalogService.js` escreve?

**Saída esperada:** Lista de campos com tipo correto vs. incorreto/ausente.

---

### Level 4 — Interface de Usuário (Frontend Component)

**Ferramentas**: `view_file` no componente alvo (ex: `InverterDrawer.tsx`). `grep_search` por strings literais hardcoded suspeitas.

**O que verificar:**
- Campos do Level 3 estão sendo **renderizados** na UI?
- Existe algum valor **hardcoded** onde deveria vir do dado? (ex: `"Passivo"` no lugar de `{m.coolingType}`)
- A lógica de fallback `{ed?.campo ?? '—'}` está correta ou está mascarando um campo que nunca chega?
- O componente acessa campos dentro de `electricalData` com o **cast de tipo correto**? (asserção `as TypeExtendido`)
- Campos opcionais no Level 0 (`Float?`) exibem um `—` apropriado quando `null`?

**Saída esperada:** Mapa visual de `campo_banco → campo_ui` com status: ✅ Correto | ⚠️ Parcial | ❌ Ausente | 🔴 Hardcoded

---

## Formato de Entrega

Após auditar os 4 níveis, entregar uma tabela de diagnóstico:

```
| Campo (DB)        | Level 1 Serviço | Level 2 API | Level 3 Hook | Level 4 UI   | Status |
|-------------------|-----------------|-------------|--------------|--------------|--------|
| width             | ✅ extraído     | ✅ incluso  | ✅ tipado    | ✅ exibido   | OK     |
| coolingType       | ✅ extraído     | ✅ incluso  | ✅ tipado    | 🔴 hardcoded | ALERTA |
| Voc_max_hardware  | ❌ ausente      | ❌ ausente  | ⚠️ tipado   | — não exibe  | GAP    |
```

E uma lista priorizada de ações corretivas, ordenada por impacto.

---

## Boas Práticas

- **Execute sempre após um `prisma migrate`** que adicione ou remova colunas.
- **Execute antes de qualquer deploy** de feature que envolva novos campos de dados.
- **Não edite código durante a auditoria** — primeiro mapear, depois corrigir.
- **Priorize campos em `Json`**: eles são invisíveis ao Prisma Client e precisam de auditoria manual.
- **Verifique os 2 schemas do Sumaúma**: `schema.prisma` (escrita) e `schema-kurupira.prisma` (leitura RO do Kurupira). Eles divergem com frequência.

## Hard Boundaries (O que esta skill NÃO faz)

- ❌ Não valida **lógica de negócio** (isso é com `validador-pan`, `validador-ond`, `engenheiro-eletricista-pv`)
- ❌ Não audita **autenticação ou autorização** (isso é com `security-auditor` e `logto-ywara`)
- ❌ Não executa **migrations** — apenas identifica a necessidade
- ❌ Não avalia **performance** de queries — apenas presença/ausência de dados
- ❌ Não inspeciona **dados em runtime** — apenas o código estático e schemas

## Integração com Outras Skills

| Quando entregar para | Motivo |
|---|---|
| `path-finder` | Quando há dúvida sobre qual arquivo é o "real" para um componente |
| `the-builder` | Para implementar as correções de backend identificadas |
| `ui-backoffice` | Para implementar as correções de frontend identificadas |
| `catalog-backoffice` | Quando o gap envolve o fluxo completo de importação de .PAN/.OND |

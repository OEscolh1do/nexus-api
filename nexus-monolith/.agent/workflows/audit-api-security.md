---
description: How to audit a backend API endpoint or controller for security, architecture and code quality
---

# Auditoria de Backend API & Segurança

## Quando Usar

- Controller com mais de 200 linhas
- Lógica de negócio misturada com HTTP (req/res) no Controller
- Endpoint crítico (pagamento, permissões) precisando revisão
- Dúvida se validação Zod cobre todos os casos
- Código legado sem tipagem estrita

## Framework de Análise — 5 Princípios de Robustez

### 1. Fronteira de Confiança (Defense in Depth)
- Todo input (body, params, query) passa por `z.parse()`?
- A validação é estrita (`.strict()`)? Rejeita campos extras?
- O Zod Schema está reutilizável ou hardcoded?

### 2. Isolamento de Responsabilidade (SRP)
- O Controller tem lógica "If this then that"? (**Proibido** — mover para Service)
- O Service acessa `req`, `res`? (**Proibido**)
- Queries Prisma estão encapsuladas dentro de `withTenant(tx)`?

### 3. Tratamento de Erros & Atomicidade
- "Caminho Feliz" está protegido? E os "Sad Paths"?
- Operações de escrita múltiplas estão em `withTenant(tx)` ou `$transaction`?
- Erros expõem stack traces para o cliente?

### 4. Segurança (OWASP)
- Verificação de autorização via `requireRole([...])`?
- Proteção contra IDOR (verifica se recurso pertence ao tenant do token)?
- Proteção contra Mass Assignment (via Zod whitelist)?

### 5. Multi-Tenancy
- Todas as queries passam por `withTenant(tx)`?
- CRONs extraem `tenantId` dos registros (não existe contexto HTTP)?
- Audit trail propaga `tenantId` + `userId` via `asyncLocalStorage`?

## Output Esperado: `api_audit_report.md`

1. **Resumo Executivo** — Nota Segurança (0-10), Nota Arquitetura (0-10), Veredito
2. **Análise de Vulnerabilidades** — Linha(s), princípio violado, explicação de risco
3. **Plano de Refatoração** — Ações passo a passo, Zod schemas necessários, métodos a extrair
4. **Desafio Socrático** — Uma pergunta sobre um edge case não tratado

## Após Aprovação: Refatoração

1. Criar/Atualizar Zod Schemas
2. Blindar Controller (validar input + `requireRole`)
3. Mover lógica de negócio para o Service (se houver)
4. Revisar tratamento de erros (try/catch centralizado)
5. Verificar `withTenant` em todas as queries

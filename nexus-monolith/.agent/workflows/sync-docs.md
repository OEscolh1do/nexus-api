---
description: How to synchronize context.md and docs/ with the current state of the codebase after significant changes
---

# Sincronização de Documentação (Doc Freshness Sync)

## Quando Usar

- Ao final de uma sessão que criou ou refatorou módulos, roles, ou infraestrutura
- Periodicamente (a cada sprint, milestone ou deploy significativo)
- Quando o agente operar com premissas visivelmente defasadas
- Após mudanças em `schema.prisma`, `App.tsx`, middlewares de auth ou deploy config

## O Que Esta Auditoria Valida

A documentação do Nexus tem 2 camadas críticas que devem refletir a realidade do código:

| Camada | Arquivo | Consumidor |
|---|---|---|
| Bootstrap do Agente | `.agent/context.md` | Todo agente IA em início de sessão |
| Referência Humana | `docs/` (glossary, rbac, infra, maps) | Desenvolvedores, líderes técnicos |

## Protocolo de Cross-Reference (6 Checkpoints)

### Checkpoint 1: Módulos Ativos
**Fonte de verdade:** `backend/src/modules/` + `frontend/src/views/`
- Listar todos os diretórios em `backend/src/modules/` e `frontend/src/views/`
- Comparar com a lista de módulos em `.agent/context.md` (Seção "Módulos Ativos")
- Comparar com `docs/map_nexus_monolith/README.md` (tabela de estatísticas)
- **Se divergir:** Atualizar ambos os docs com os módulos reais

### Checkpoint 2: Roles e RBAC
**Fonte de verdade:** Enum de roles no `schema.prisma` ou constantes no `auth.middleware.js`
- Extrair a lista de roles do código
- Comparar com `docs/security/rbac-matrix.md`
- Comparar com `.agent/context.md` (Seção "RBAC")
- **Se divergir:** Atualizar a matriz e o context

### Checkpoint 3: Schema de Dados
**Fonte de verdade:** `backend/prisma/schema.prisma`
- Verificar se novos models foram adicionados desde a última sync
- Verificar se o `context.md` menciona os models principais e suas relações
- Verificar se `docs/glossary.md` tem termos para as novas entidades
- **Se divergir:** Adicionar novos termos ao glossário, atualizar context

### Checkpoint 4: Stack e Versões
**Fonte de verdade:** `backend/package.json` + `frontend/package.json`
- Verificar versões de: Node, Prisma, React, Vite, TypeScript, TailwindCSS
- Comparar com `.agent/context.md` (Seção "Stack Tecnológica")
- **Se divergir:** Atualizar versões no context

### Checkpoint 5: Rotas e Navegação
**Fonte de verdade:** `frontend/src/App.tsx` (React Router)
- Listar todas as `<Route>` declaradas
- Comparar com `docs/map_nexus_monolith/README.md` (seção de rotas por módulo)
- **Se divergir:** Atualizar o mapa de rotas

### Checkpoint 6: Infraestrutura de Deploy
**Fonte de verdade:** `fly.toml` + `wrangler.toml` (ou Cloudflare Pages config)
- Verificar região, variáveis de ambiente, domínios
- Comparar com `docs/deployment/infrastructure.md`
- **Se divergir:** Atualizar o doc de infraestrutura

## Output Esperado

Ao final da auditoria, gerar um relatório conciso:

```markdown
# Doc Sync Report — [DATA]

## Divergências Encontradas
| Checkpoint | Status | Ação |
|---|---|---|
| Módulos | ✅ Sincronizado | — |
| Roles/RBAC | ⚠️ Divergente | +1 role nova (AUDITOR) |
| Schema | ⚠️ Divergente | +2 models (Invoice, Payment) |
| Stack | ✅ Sincronizado | — |
| Rotas | ⚠️ Divergente | +3 rotas novas em /fin/* |
| Infra | ✅ Sincronizado | — |

## Arquivos Atualizados
- `.agent/context.md` — adicionado role AUDITOR, models Invoice/Payment
- `docs/security/rbac-matrix.md` — nova linha AUDITOR
- `docs/glossary.md` — +2 termos (Invoice, Payment)
- `docs/map_nexus_monolith/README.md` — +3 rotas Finance
```

## Regras de Execução

- **Nunca inventar:** Se um módulo existe no docs mas não no código, ele deve ser removido ou marcado como "Planejado".
- **Timestamp:** Atualizar o campo "Última Atualização" em todo doc modificado.
- **Atomic:** Todas as atualizações de docs devem ser feitas na mesma sessão para evitar inconsistência parcial.

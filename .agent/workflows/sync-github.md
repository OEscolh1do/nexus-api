---
description: Automação de commits e versionamento no GitHub como ponto de restauração
---

# Workflow `/sync-github` — Sincronização com GitHub

Execute este workflow ao final de cada sessão de desenvolvimento significativa ou após a conclusão de qualquer item do `task.md`. Commits frequentes servem como pontos de restauração caso o agente cometa erros graves em etapas futuras.

## Passo 1: Revisar o Estado do Repositório

```bash
git status
git diff --stat
```
Identifique todos os arquivos modificados, criados ou deletados.

## Passo 2: Stagear as Mudanças

- Se as mudanças pertencem a uma única feature/fix: `git add -A`
- Se há mudanças não relacionadas, adicione seletivamente: `git add <arquivo>`

## Passo 3: Formatar a Mensagem de Commit (Conventional Commits)

Use o padrão **Conventional Commits**:
```
<tipo>(<escopo>): <descrição curta em inglês>

[corpo opcional com mais detalhes]
```

**Tipos válidos:**
| Tipo | Uso |
|---|---|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `refactor` | Refatoração sem novo comportamento |
| `style` | Mudanças de formatação/CSS |
| `docs` | Atualização de documentação |
| `chore` | Tarefas de manutenção (deps, config) |
| `test` | Adição ou correção de testes |

**Exemplo:**
```
feat(nexus-erp/commercial): add order list with pagination and filters
```

## Passo 4: Push e Confirmação

```bash
git push origin <branch-atual>
```

Confirme que o push foi bem-sucedido antes de encerrar a sessão.

## ⚠️ Pontos de Restauração

Antes de executar qualquer refatoração de alto risco ou alteração invasiva de schema, rode este workflow para criar um ponto de restauração explícito com a mensagem: `chore: checkpoint before [descrição da operação arriscada]`.

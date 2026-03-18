---
description: Refatoração segura e incremental de módulos com alto débito técnico
---

# Workflow `/refactor` — Refatoração Segura e Incremental

Refatorar sem método gera sistemas mais frágeis do que o original. Este workflow garante que cada etapa de refatoração seja segura, rastreável e reversível.

## Regras de Ouro

1. **Refatoração não adiciona comportamento** — se você está refatorando, não está adicionando features. Se precisar fazer as duas coisas, separe em commits distintos.
2. **Crie um checkpoint git antes de começar** (veja `/sync-github`).
3. **Refatore em passos atômicos** — cada commit deve deixar o sistema funcionando.

## Passo 1: Delimitar o Escopo

- Identifique o módulo ou arquivo alvo com precisão.
- Liste o que **não** será tocado nesta versão (bounding box da refatoração).
- Confirme que o módulo tem cobertura de testes aceitável. Se não tiver, adicione testes mínimos primeiro (veja `audit-testing.md`).

## Passo 2: Classificar o Tipo de Refatoração

| Tipo | Exemplo | Risco |
|---|---|---|
| **Rename** | Renomear variáveis/funções | Baixo |
| **Extract** | Mover lógica para hook/lib | Médio |
| **Simplify** | Remover código morto, simplificar condicionais | Médio |
| **Restructure** | Reorganizar pastas/módulos | Alto |
| **Replace** | Trocar biblioteca/padrão | Alto |

Refatorações de **risco alto** exigem aprovação via `/planning` antes de iniciar.

## Passo 3: Executar a Refatoração por Tipo

- **Rename/Extract**: Faça as mudanças, valide que os imports ainda resolvem, rode `tsc --noEmit`.
- **Simplify**: Remova o código, confira que os testes ainda passam.
- **Restructure/Replace**: Siga o `implementation_plan.md` item a item, commite a cada etapa estável.

## Passo 4: Validação Pós-Refatoração

- Rode o servidor de desenvolvimento e navegue pelo módulo refatorado.
- Execute `tsc --noEmit` para garantir zero erros de TypeScript.
- Se houver testes: rode `vitest run` para confirmar zero regressões.

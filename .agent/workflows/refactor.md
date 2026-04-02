---
description: Refatoração segura e incremental de módulos com alto débito técnico
---

# Workflow `/refactor` — Refatoração Segura e Incremental

Refatorar sem método gera sistemas mais frágeis do que o original. Este workflow garante que cada etapa de refatoração seja segura, rastreável e reversível.

## Pré-Requisitos Obrigatórios

Antes de iniciar qualquer refatoração no módulo **Kurupira**, o agente deve:

1. **Carregar a Skill `kurupira-canon`** — As premissas arquiteturais são inegociáveis. Leia `.agent/skills/kurupira-canon/SKILL.md` antes de propor qualquer mudança.
2. **Consultar o histórico** em `.agent/concluido/` — As soluções documentadas são Verdade Canônica. Se a sua refatoração contradiz uma decisão consolidada, adapte o seu plano.
3. **Verificar se há um Épico em `.agent/em-andamento/`** — Apenas 1 Épico pode estar ativo por vez. Se já existe um, termine-o antes de iniciar outro.

## Regras de Ouro

1. **Refatoração não adiciona comportamento** — se você está refatorando, não está adicionando features. Separe em commits distintos.
2. **Crie um checkpoint git antes de começar** (veja `/sync-github`).
3. **Refatore em passos atômicos** — cada commit deve deixar o sistema funcionando.

## Passo 1: Delimitar o Escopo

- Identifique o módulo ou arquivo alvo com precisão.
- Liste o que **não** será tocado nesta versão (bounding box da refatoração).
- Confirme que o módulo tem cobertura de testes aceitável. Se não tiver, adicione testes mínimos primeiro.

## Passo 2: Classificar o Tipo de Refatoração

| Tipo | Exemplo | Risco |
|---|---|---|
| **Rename** | Renomear variáveis/funções | Baixo |
| **Extract** | Mover lógica para hook/lib | Médio |
| **Simplify** | Remover código morto, simplificar condicionais | Médio |
| **Restructure** | Reorganizar pastas/módulos | Alto |
| **Replace** | Trocar biblioteca/padrão | Alto |

Refatorações de **risco alto** exigem aprovação via `/planning` antes de iniciar.

## Passo 3: Validação Contra o Canon

Antes de escrever código, valide que a refatoração proposta **não viola** nenhuma das 3 premissas do `kurupira-canon`:

- [ ] Separação Catálogo ≠ Inventário respeitada
- [ ] Estado normalizado (sem árvores JSON profundas, sem `setState` contínuo sem throttle)
- [ ] WebGL isolado do DOM (sem props no Canvas, `frameloop="demand"` preservado)

Se alguma dessas premissas será impactada, documente e solicite aprovação explícita do desenvolvedor líder.

## Passo 4: Executar a Refatoração

- **Rename/Extract**: Faça as mudanças, valide que os imports ainda resolvem, rode `tsc --noEmit`.
- **Simplify**: Remova o código, confira que os testes ainda passam.
- **Restructure/Replace**: Siga o `implementation_plan.md` item a item, commite a cada etapa estável.

## Passo 5: Validação Pós-Refatoração

// turbo
1. Rode `npx tsc --noEmit` — **EXIT CODE 0 obrigatório**. Zero novos erros.
2. Rode o servidor de desenvolvimento e navegue pelo módulo refatorado.
3. Se houver testes: rode `vitest run` para confirmar zero regressões.

## Passo 6: Documentação e Movimentação de Épicos

1. Se a refatoração faz parte de um Épico em `.agent/em-andamento/`:
   - Atualize o progresso no arquivo do Épico.
   - Se **concluído** (tsc --noEmit = 0), mova o relatório para `.agent/concluido/` com data e nome descritivo.
2. Atualize `.agent/context.md` se a refatoração impactou a arquitetura (novo changelog entry).

---
description: Planejamento obrigatório antes de qualquer alteração no código (Medir Duas Vezes)
---

# Workflow `/planning` — Planning Mode (Medir Duas Vezes, Cortar Uma)

Nenhuma linha de código de produção deve ser escrita sem um plano explícito e aprovado. Este workflow é a barreira de qualidade que previne retrabalho e alucinações arquiteturais.

## Passo 1: Research (Entender Antes de Propor)

Antes de propor qualquer mudança:
- Leia os arquivos diretamente afetados.
- Identifique dependências (quem chama, quem é chamado).
- Verifique se há KIs ou workflows existentes que já cobrem o tema.
- **Nunca assuma** — leia o código real.

## Passo 2: Gerar o `implementation_plan.md`

Crie o artefato `implementation_plan.md` no diretório de artefatos da conversa com:

```markdown
# [Título da Feature/Refatoração]

## Contexto
[Problema que resolve e background relevante]

## Arquivos Afetados
- [MODIFY] path/to/file.ts — descrição da mudança
- [NEW] path/to/newfile.ts — descrição do arquivo
- [DELETE] path/to/oldfile.ts — motivo da remoção

## Riscos Identificados
- [risco 1 e mitigação]

## Plano de Verificação
- [como validar que funcionou]
```

## Passo 3: Solicitar Aprovação do Desenvolvedor

Apresente o `implementation_plan.md` ao desenvolvedor via `notify_user` com `BlockedOnUser: true`. Não avance para EXECUTION sem aprovação explícita.

## Passo 4: Atualizar o `task.md`

Somente após aprovação, traduza o plano em um `task.md` com checklist granular e mude o modo para EXECUTION.

## ⛔ Anti-Padrões a Evitar

- ❌ Escrever código e apresentar o plano ao mesmo tempo.
- ❌ Assumir que uma mudança é "óbvia" e pular o planejamento.
- ❌ Modificar arquivos não listados no plano sem justificativa documentada.

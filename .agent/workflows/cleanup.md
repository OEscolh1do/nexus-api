---
description: Limpeza de dívidas técnicas, dead code e arquivos temporários
---

# Workflow `/cleanup` — Limpeza de Dívida Técnica

Execute periodicamente ou após grandes features para manter o projeto limpo e performático. O cleanup é **diferente da refatoração**: ele remove sem substituir.

## Passo 1: Varredura de Dead Code

- Busque por funções, variáveis, imports e componentes que **nunca são referenciados** em nenhum outro arquivo.
- Use ferramentas como `ts-prune` ou a extensão "TypeScript Error Lens" para identificar exports não utilizados.
- Confirme com `grep_search` antes de deletar — evite falsos negativos em imports dinâmicos.

## Passo 2: Limpeza de Arquivos Temporários e de Debug

- Remova arquivos com sufixos como `.old`, `.bak`, `.tmp`, `_copy`.
- Limpe `console.log` de debug deixados durante desenvolvimento.
- Remova comentários de código comentado (`// TODO: remove this`) que estejam há mais de 1 sprint sem resolução.

## Passo 3: Limpeza de Dependências

- Rode `npm ls` para identificar dependências instaladas mas não utilizadas.
- Verifique o `package.json` contra o código real: há imports de bibliotecas que nunca são usadas?
- Use `npm dedupe` para limpar dependências duplicadas na `node_modules`.

## Passo 4: Organização de Assets

- Remova imagens, fontes ou ícones em `/public` ou `/assets` que não são referenciados no código.
- Converta imagens `.png`/`.jpg` grandes para `.webp` para reduzir o tamanho do bundle.

## Passo 5: Checkpoint Final

Após o cleanup, compile o projeto (`tsc --noEmit`) e rode o servidor de dev para confirmar zero quebras. Commit com a mensagem: `chore: cleanup dead code and unused dependencies`.

---
description: Gerar Relatórios
---

# Workflow `/gerar-relatorio` — Relatório de Execução Automático

Use este workflow para gerar um relatório consolidado das atividades mais recentes da sessão, registrando as decisões técnicas, arquiteturais e de design implementadas. O relatório serve como um log persistente do progresso do desenvolvimento.

## Passo 1: Coleta de Dados

- Recapitule as ações realizadas na sessão atual. Foque nas entregas de alto impacto:
  - Mudanças de arquitetura ou fluxo de dados.
  - Refatorações de UI/UX, grid e paletas de cores.
  - Sincronização de documentações.
  - Resolução de débitos técnicos importantes (Cleanups, type checking).

## Passo 2: Estrutura de Diretórios

O relatório deve ser salvo no diretório raiz `relatorio/` do projeto, organizado por mês e dia.
1. Determine o mês atual no formato `YYYY-MM` (ex: `2026-04`).
2. Determine a data atual no formato `YYYY-MM-DD` (ex: `2026-04-25`).
3. Verifique se o diretório `relatorio/[YYYY-MM]/` existe. Se não, crie-o durante a gravação do arquivo.
4. O caminho final do arquivo será: `relatorio/[YYYY-MM]/resumo-[YYYY-MM-DD].md`.

## Passo 3: Escrita do Relatório

- Verifique se o arquivo `resumo-[YYYY-MM-DD].md` já existe no diretório usando a ferramenta `view_file`.
- Se o arquivo **NÃO EXISTIR**, crie-o usando `write_to_file` com o cabeçalho inicial `# Relatório de Execução — [YYYY-MM-DD]` e insira as informações consolidadas.
- Se o arquivo **JÁ EXISTIR**, leia seu conteúdo e adicione o novo relato abaixo da última linha (use a ferramenta de edição de arquivo apropriada para adicionar sem sobrescrever os relatos anteriores do mesmo dia). Adicione um separador `---` entre os relatos do dia, se necessário.

## Passo 4: Feedback Final

- Após salvar o relatório, informe ao desenvolvedor que o registro foi realizado com sucesso, listando os tópicos centrais que foram documentados.

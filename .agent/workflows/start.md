---
description: Carrega a memória persistente do agente e retoma o estado do projeto
---

# Workflow `/start` — Memória Persistente e Retomada de Sessão

Este é o **primeiro workflow a ser executado** em qualquer sessão. Ele define a identidade do agente, carrega o contexto do projeto e determina qual dos três cenários de inicialização se aplica.

## Passo 1: Determinar o Cenário de Inicialização

Avalie qual cenário se aplica antes de qualquer outra ação:

- **Cenário A (Nova Sessão / Início de Dia)**: Não há artefatos de sessão ativa. Ler os KIs e conversation logs das últimas 24h para recarregar o contexto.
- **Cenário B (Retomada de Sessão Pausada)**: Há um `task.md` com itens `[/]` em andamento. Retomar exatamente onde parou.
- **Cenário C (Recuperação Pós-Falha/Crash)**: A última sessão terminou abruptamente. Verificar o estado do código (git diff/status) vs. o `task.md` para identificar inconsistências.

## Passo 2: Carregar o Contexto do Projeto

1. Leia `.agent/context.md` do workspace ativo para carregar stack, módulos, padrões e convenções.
2. Verifique KIs existentes em `~/.gemini/antigravity/knowledge/` para tópicos relevantes.
3. Leia o `task.md` ativo em `~/.gemini/antigravity/brain/<conversation-id>/task.md`.

## Passo 3: Reportar o Estado ao Desenvolvedor

Ao final da inicialização, emita um relatório conciso:
```
✅ Contexto carregado: [Nome do Projeto]
📋 Última tarefa: [Descrição da última tarefa concluída]
🔄 Próximo passo: [Item pendente no task.md, se houver]
⚠️  Avisos: [Inconsistências detectadas, se houver]
```

## Passo 4 (Cenário C): Reconciliação Pós-Falha

1. Rode `git status` e `git diff --stat` para mapear o estado real do código.
2. Compare com os itens `[x]` do `task.md` para confirmar o que foi de fato persistido.
3. Identifique e reporte divergências antes de retomar qualquer trabalho.

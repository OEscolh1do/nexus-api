---
description: Geração automática de artefatos de documentação após conclusão de uma tarefa
---

# Workflow `generate-artifacts` — Geração de Artefatos de Documentação

Execute ao final de qualquer tarefa significativa para garantir rastreabilidade e transferência de conhecimento. A documentação gerada por este workflow alimenta os KIs do agente em conversas futuras.

## Artefato 1: `walkthrough.md` (Obrigatório)

Gerado ao final de **toda** EXECUTION bem-sucedida. Documenta:
```markdown
# Walkthrough: [Nome da Tarefa]

## O Que Foi Feito
[Descrição das mudanças implementadas]

## Arquivos Modificados
- [MODIFY] path/to/file.ts: [o que mudou e por quê]
- [NEW] path/to/newfile.ts: [propósito do arquivo]

## Como Verificar
[Passos para o desenvolvedor validar manualmente as mudanças]

## Screenshots / Evidências
[Se houver mudanças visuais, incluir evidências]
```

## Artefato 2: `README.md` (Para Novos Módulos)

Sempre que um **novo módulo ou subprojeto** for criado, gere um `README.md` na raiz do módulo com:
- Descrição e propósito do módulo
- Como rodar localmente (comandos exatos)
- Variáveis de ambiente necessárias
- Dependências de outros módulos do ecossistema

## Artefato 3: Diagrama de Arquitetura (Para Refatorações Estruturais)

Quando uma refatoração alterar significativamente a estrutura de pastas ou o fluxo de dados, gere um diagrama Mermaid documentando:
- Hierarquia de componentes (se frontend)
- Fluxo de dados entre camadas (se fullstack)
- Diagrama de sequência de autenticação (se SSO foi modificado)

## Quando NÃO gerar artefatos

- Fixes pontuais de bugs (1-2 linhas modificadas)
- Correções de typo ou formatação
- Mudanças de configuração triviais

Nesses casos, o commit message bem escrito é documentação suficiente.

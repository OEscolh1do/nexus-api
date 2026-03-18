---
description: Inicialização de estrutura de diretórios e arquivos de regras em novos projetos
---

# Workflow `/init` — Inicialização de Novo Projeto

Execute este workflow ao configurar um **novo projeto ou sub-módulo** dentro do ecossistema Neonorte para garantir que a estrutura de agente esteja presente.

## Passo 1: Criar a Estrutura de Diretórios do Agente

```
.agent/
├── context.md        # Identidade do projeto: stack, módulos, convenções
├── rules/
│   ├── base.md       # Regras globais de código (TypeScript, Clean Code)
│   ├── frontend.md   # Padrões React, Tailwind, Design System
│   └── security.md   # Regras de segurança, OWASP, SSO
└── workflows/        # Workflows específicos do projeto (copie os relevantes)
```

## Passo 2: Popular o `context.md`

O arquivo deve conter no mínimo:
- **Stack**: Frameworks, linguagens, ferramentas de build
- **Módulos**: Lista de features/domínios e suas responsabilidades
- **Convenções**: Padrão de naming, estrutura de pastas, ferramentas de lint
- **Endpoints Críticos**: URL da API, portas de dev, variáveis de ambiente essenciais
- **SSO/Auth**: Como a autenticação flui entre módulos

## Passo 3: Configurar as Regras Base

Copie as regras relevantes do `.agent/rules/` do projeto raiz Neonorte e adapte para o contexto do novo módulo.

## Passo 4: Verificação Pós-Init

Confirme que os arquivos foram criados e que o `context.md` está preenchido corretamente antes de iniciar qualquer desenvolvimento.

---
description: Workflow de autocrítica — gera, verifica e corrige a resposta final com evidências
---

# Workflow `Chain-of-Verification (CoVe)` — Auto-Crítica e Correção

Use este workflow sempre que a resposta envolver fatos verificáveis, arquiteturas complexas ou decisões técnicas críticas onde uma alucinação teria alto impacto.

## Passo 1: Geração da Resposta Inicial (Draft)

Produza a resposta ou o código como faria normalmente, sem filtros de autocrítica ainda.

## Passo 2: Planejamento das Perguntas de Verificação

Com base no draft, formule **perguntas de verificação de fatos independentes**:
- Cada pergunta deve ser **respondível** lendo o código/documentação diretamente.
- As perguntas não devem ser genéricas — devem atacar os pontos mais prováveis de erro.

**Exemplos de perguntas de verificação:**
- "O hook `useQuery` que eu propus já está instalado como dependência no `package.json`?"
- "A rota `/api/clientes` que mencionei realmente existe no `routes/clientes.js`?"
- "O componente `<DataTable>` importado está em `src/ui/` ou precisa ser criado?"

## Passo 3: Execução das Verificações

Para cada pergunta, **aja**: leia o arquivo, grep o código, verifique a dependência. Não responda as perguntas de memória.

## Passo 4: Correção e Entrega Final

- Compare o Draft com as evidências coletadas.
- Corrija cada ponto onde o Draft estava divergente da realidade.
- Entregue a **resposta final corrigida** ao desenvolvedor, indicando o que foi verificado.

## Quando Acionar Obrigatoriamente

- Afirmações sobre a existência de arquivos, funções ou endpoints específicos.
- Propostas de migração de dependências ou versões de bibliotecas.
- Qualquer resposta sobre fluxo de autenticação/SSO.
- Após usar o Modo `/loki` — validar a integração dos outputs dos subagentes.

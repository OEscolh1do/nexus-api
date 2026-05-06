---
description: Workflow para registrar lições aprendidas e padrões técnicos no Manual de Boas Práticas.
---

# Workflow `Caderno de Campo` — Registro de Lições e Padrões

Use este workflow sempre que uma solução técnica for "muito bem acertada", resolver um bug complexo ou estabelecer um novo padrão arquitetural que deva ser lembrado em projetos futuros.

## Passo 1: Identificação do Insight
Analise a tarefa recém-concluída e identifique:
- **O Problema Raiz**: O que causava a falha ou a ineficiência? (Ex: Race condition, loop de auth, vazamento de memória).
- **A Solução Elegante**: Qual foi a "sacada" técnica que resolveu o problema sem criar dívida técnica?

## Passo 2: Extração da "Regra de Ouro"
Traduza a solução em uma diretiva curta e acionável. 
- Formato: *"Se [Cenário], então [Ação], para evitar [Consequência]."*

## Passo 3: Atualização do Manual
Acesse o arquivo `docs/manual_boas_praticas.md` e adicione uma nova entrada seguindo a estrutura:
1. **Título**: Nome claro do padrão ou problema.
2. **Contexto**: Breve descrição do cenário.
3. **Padrão Adotado**: Explicação técnica da solução.
4. **Referência**: Link para os arquivos principais afetados.

## Passo 4: Sincronização Cross-Module
Verifique se esse padrão se aplica a outros módulos do ecossistema Ywara:
- Se resolveu algo no `sumauma/frontend`, isso deve ser replicado no `kurupira/frontend`?
- Se sim, abra uma tarefa no `task.md` para a replicação.

## Quando Acionar
- Após correções de loops de autenticação/redirecionamento.
- Ao otimizar performance em telas de engenharia complexas (WebGL/Canvas).
- Ao implementar validações físicas ou normativas (NBR) inéditas.
- Sempre que o desenvolvedor disser: *"Isso foi muito bem acertado"*.

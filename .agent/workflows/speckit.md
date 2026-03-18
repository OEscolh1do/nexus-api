---
description: Pipeline Spec-Driven Development (SDD) para requisitos transformados em código com alta precisão
---

# Workflow `/speckit` — Spec-Driven Development

Pipeline rigoroso de 5 etapas para transformar requisitos vagos em código funcional e auditável. Nunca escreva código de produção sem ter passado pelas etapas `.specify` e `.plan`.

---

## Etapa 1: `/speckit.specify` — O Quê

Antes de qualquer coisa, defina **o que** deve ser construído:
- Qual problema de negócio resolve?
- Quem é o usuário final desta feature?
- Quais são os critérios de aceitação (Definition of Done)?
- Quais **não** fazem parte do escopo (explicit exclusions)?

**Saída esperada:** Um bloco de especificação claro e aprovado pelo desenvolvedor.

---

## Etapa 2: `/speckit.plan` — O Como

Com o "quê" aprovado, defina **como** implementar:
- Quais arquivos serão criados, modificados ou deletados?
- Qual a sequência lógica de mudanças (do mais baixo para o mais alto nível)?
- Há dependências de API/schema que precisam ser ajustadas primeiro?

**Saída esperada:** `implementation_plan.md` proposto ao desenvolvedor para aprovação.

---

## Etapa 3: `/speckit.tasks` — Quebra em Passos Atômicos

Com o plano aprovado, quebre a implementação em tarefas atômicas e ordenadas:
- Cada tarefa deve ter uma condição de conclusão verificável.
- Grave no `task.md` com checklist `[ ]`.

---

## Etapa 4: `/speckit.analyze` — Revisão de Riscos

Antes de executar, faça uma análise crítica:
- ⚠️ Quais mudanças podem causar **regressão** em outras features?
- 🔐 Alguma mudança afeta **segurança** ou fluxo de autenticação?
- 🗄️ Alguma mudança afeta o **schema do banco de dados** (migrations necessárias)?
- Se os riscos forem altos, crie um **checkpoint git** antes de prosseguir.

---

## Etapa 5: `/speckit.implement` — Execução

Execute o `task.md` item a item. Regras:
- Marque `[x]` a cada conclusão verificada.
- Se uma tarefa revelar risco não mapeado, **pause, volte à Etapa 4** e reanalise.
- Ao final, execute o workflow `/sync-github`.

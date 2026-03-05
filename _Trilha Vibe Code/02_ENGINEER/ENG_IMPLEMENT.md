# 👷 TEMPLATE 02: O ENGENHEIRO (Mão na Massa)

> **📍 VOCÊ ESTÁ AQUI:** 🏠 [Início](./) > 🛠️ Templates > 👷 Template 02 - Engenheiro  
> **🎯 OBJETIVO:** Executar o plano do Template 01 com segurança e qualidade  
> **⏱️ TEMPO:** 30seg-1min preencher | 3-10min IA implementar  
> **🛠️ PRÉ-REQUISITO:** ⚠️ VOCÊ JÁ TEM UM PLANO APROVADO (do Template 01)

---

> **💡 PARA O SEU CÉREBRO (ADHD FRIENDLY)**
>
> **O Momento:** Você já rodou o **Template 01**, a IA gerou um plano lindo (`implementation_plan.md`) e você disse "Ok, pode fazer".
>
> **O Perigo:** Se você só disser "Faça", a IA pode esquecer as regras no meio do caminho ou fazer tudo de qualquer jeito. 😵‍💫
>
> **A Solução:** Este template é o "Capataz". Ele pega o plano aprovado e garante que a IA siga cada passo sem desviar, mantendo a qualidade.

## ⚠️ ATENÇÃO CRÍTICA

┌─────────────────────────────────────────────┐
│ 🚨 NÃO use este template SEM ter rodado │
│ o TEMPLATE_01 antes! │
│ │
│ Executar código sem plano = Caos │
│ │
│ ✅ Tem o plano? Marque: [ ] Sim, tenho │
└─────────────────────────────────────────────┘

---

## ✂️ COPIE ISSO AQUI:

```xml
<mission>
  <!-- O COMANDO FINAL -->
  Executar o plano de implementação aprovado para "{{NOME_DA_FEATURE}}".
</mission>

<execution_protocol>
  <!-- A ORDEM DAS COISAS (Não deixe a IA pular etapas) -->

  <step_1_backend>
    Se houver migração de banco:
    1. Ajuste schema ({{ORM_CHOICE: Prisma, TypeORM, Sequelize, SQLAlchemy, Hibernate}}).
    2. Rode migration: {{MIGRATION_COMMAND: npx prisma migrate dev, alembic upgrade head, etc}}.
    3. Atualize camada de dados (Services/Repositories conforme planejado).
    4. IMPORTANTE: Validação de inputs ({{VALIDATION_LIB: Zod, Joi, class-validator, Pydantic}}).
  </step_1_backend>

  <step_2_frontend>
    1. Atualize tipos/interfaces (TypeScript/PropTypes/Flow).
    2. Implemente componentes ({{FRONTEND_FRAMEWORK}}).
    3. Conecte ao backend (REST/GraphQL/tRPC/WebSockets).
    4. Trate estados: Loading, Error, Empty State.
  </step_2_frontend>

  <step_3_integration>
    Garanta comunicação Client ↔ Server.
    Verifique se {{PONTO_CRITICO_INTEGRACAO}} está funcionando.
  </step_3_integration>

  <step_4_documentation>
    Atualize documentação técnica: {{CAMINHO_DA_DOC_PRINCIPAL}}.
    Gere `walkthrough.md` com resumo do que foi feito.
  </step_4_documentation>

</execution_protocol>

<red_lines>
  <!-- AS REGRAS DE OURO (Para a IA não esquecer) -->
  - NÃO remova validações de segurança.
  - NÃO deixe `console.log` perdidos.
  - NÃO quebre a build (teste o `npm run build` se necessário).
  - {{OUTRA_RESTRICAO_ESPECIFICA}}
</red_lines>
```

---

## ✅ Checkpoint Pós-Execução

Depois que a IA implementar, verifique:

- [ ] Todos os arquivos mencionados no plano foram modificados
- [ ] A IA gerou um `walkthrough.md` resumindo o que fez
- [ ] Nenhum erro apareceu durante a execução

**Se algo falhou:** Use [TEMPLATE_04_DEBUG](./TEMPLATE_04_DEBUG.md)

---

## ✅ Resumo em 3 Frases

1. **Template 02 = Execução** → Transforma plano em código
2. **Sempre use `<red_lines>`** para evitar que a IA quebre coisas importantes
3. **Teste imediatamente** após a execução (não acumule código não-testado)

## 🔗 Próximos Passos

**Se tudo funcionou:**
→ Documente com [TEMPLATE_05_DOCS](./TEMPLATE_05_DOCS.md) (opcional mas recomendado)

**Se o código ficou feio:**
→ Use [TEMPLATE_03_REFACTOR](./TEMPLATE_03_REFACTOR.md)

**Se encontrou bugs:**
→ Use [TEMPLATE_04_DEBUG](./TEMPLATE_04_DEBUG.md)

---

[🔝 Voltar ao topo](#-template-02-o-engenheiro-mão-na-massa)

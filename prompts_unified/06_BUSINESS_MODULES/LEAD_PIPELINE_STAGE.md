# 📊 Adicionar Stage ao Pipeline de Leads - Neonorte | Nexus 2.0

> **🎯 Cenário de Uso:** Adicionar novo estágio ao pipeline comercial
> **⏱️ Tempo Estimado:** 10-15 minutos

---

## ✂️ PROMPT PRÉ-CONFIGURADO

```xml
<mission>
  Adicionar stage "{{NOME_DO_STAGE}}" ao pipeline de Leads.
  Exemplo: Adicionar stage "Negociação Avançada" entre "Proposta Enviada" e "Fechamento"
</mission>

<nexus_context>
  <file path="c:/Users/Neonorte Tecnologia/Documents/Meus Projetos/Neonorte/Neonorte/nexus-monolith/backend/prisma/schema.prisma" />
  <file path="c:/Users/Neonorte Tecnologia/Documents/Meus Projetos/Neonorte/Neonorte/nexus-monolith/backend/prisma/seed.js" />
</nexus_context>

<stage_specification>
  **Nome:** {{NOME_DO_STAGE}}
  **Ordem:** {{NUMERO_ORDEM}}
  **Cor:** {{COR_TAILWIND}}
  **Help Text:** {{TEXTO_AJUDA}}
</stage_specification>
```

---

## 📖 Exemplo: Adicionar Stage "Negociação"

```javascript
// backend/prisma/seed.js
const leadPipeline = await prisma.pipeline.create({
  data: {
    name: "Pipeline de Leads",
    type: "LEADS",
    orgUnitId: comercialUnit.id,
    stages: {
      create: [
        { name: "Novo Lead", order: 1, color: "bg-gray-500" },
        { name: "Qualificação", order: 2, color: "bg-blue-500" },
        { name: "Proposta Enviada", order: 3, color: "bg-yellow-500" },
        // NOVO STAGE
        {
          name: "Negociação Avançada",
          order: 4,
          color: "bg-orange-500",
          helpText: "Lead em negociação de valores/condições",
        },
        { name: "Fechamento", order: 5, color: "bg-green-500" },
      ],
    },
  },
});
```

---

## ✅ Checklist

- [ ] Stage adicionado ao seed
- [ ] Ordem ajustada
- [ ] Cor definida
- [ ] Migração executada (`npx prisma db push`)
- [ ] Testado no frontend (Kanban)

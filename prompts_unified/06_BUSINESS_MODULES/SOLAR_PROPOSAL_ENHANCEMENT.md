# 🌞 Melhorias no Módulo Solar - Neonorte | Nexus 2.0

> **🎯 Cenário de Uso:** Adicionar funcionalidade ao módulo Solar integrado
> **⏱️ Tempo Estimado:** 15-30 minutos

---

## ✂️ PROMPT PRÉ-CONFIGURADO

```xml
<mission>
  Implementar melhoria no módulo Solar: "{{DESCRICAO_DA_MELHORIA}}"
  Exemplo: Adicionar novo equipamento ao catálogo de inversores
</mission>

<nexus_context>
  <file path="c:/Users/Neonorte Tecnologia/Documents/Meus Projetos/Neonorte/Neonorte/nexus-monolith/frontend/src/modules/solar/" />
  <file path="c:/Users/Neonorte Tecnologia/Documents/Meus Projetos/Neonorte/Neonorte/nexus-monolith/backend/prisma/schema.prisma" />
</nexus_context>

<solar_context>
  **Módulo Solar:**
  - Localização: `frontend/src/modules/solar/`
  - Wizard de 6 etapas: Cliente, Localização, Consumo, Dimensionamento, Equipamentos, Proposta
  - Persistência: `Project.details` (JSON validado com Zod)
  - Cálculos: `solarEngine.ts`
</solar_context>
```

---

## 📖 Exemplo: Adicionar Inversor ao Catálogo

```typescript
// frontend/src/modules/solar/data/inverters.ts
export const INVERTERS = [
  // ... existentes
  {
    id: "inv-growatt-15k",
    brand: "Growatt",
    model: "MIN 15000TL-X",
    power: 15000,
    efficiency: 98.4,
    mpptChannels: 2,
    price: 8500,
  },
];
```

---

## ✅ Checklist

- [ ] Dados adicionados ao catálogo
- [ ] Validação Zod atualizada (se necessário)
- [ ] Cálculos do `solarEngine` ajustados
- [ ] Testado no wizard

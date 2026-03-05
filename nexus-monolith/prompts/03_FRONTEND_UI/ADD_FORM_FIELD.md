# 🎨 Adicionar Campo a Formulário Existente - Neonorte | Nexus 2.0

> **🎯 Cenário de Uso:** Adicionar novo campo a um formulário React existente
> **⏱️ Tempo Estimado:** 5-10 minutos

---

## ✂️ PROMPT PRÉ-CONFIGURADO

```xml
<mission>
  Adicionar campo "{{NOME_DO_CAMPO}}" ao formulário "{{NOME_DO_COMPONENTE}}".
  Exemplo: Adicionar campo `priority` ao formulário de tarefas.
</mission>

<nexus_context>
  <file path="c:/Users/Neonorte Tecnologia/Documents/Meus Projetos/Neonorte/Neonorte/nexus-monolith/frontend/src/modules/{{modulo}}/{{Componente}}.tsx" />
</nexus_context>

<field_specification>
  **Campo:** {{NOME_DO_CAMPO}}
  **Tipo de Input:** {{text|select|textarea|checkbox|date}}
  **Validação Zod:** {{REGRAS}}
  **Obrigatório:** {{SIM/NAO}}
</field_specification>
```

---

## 📖 Exemplo: Adicionar Campo `priority` ao TaskFormModal

```tsx
// 1. Atualizar Schema Zod
const taskSchema = z.object({
  title: z.string().min(3),
  // NOVO CAMPO
  priority: z.enum(["BAIXA", "MEDIA", "ALTA", "CRITICA"]).default("MEDIA"),
});

// 2. Adicionar ao Formulário
<div>
  <Label htmlFor="priority">Prioridade</Label>
  <Select
    value={watch("priority")}
    onValueChange={(value) => setValue("priority", value as any)}
  >
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="BAIXA">🟢 Baixa</SelectItem>
      <SelectItem value="MEDIA">🟡 Média</SelectItem>
      <SelectItem value="ALTA">🟠 Alta</SelectItem>
      <SelectItem value="CRITICA">🔴 Crítica</SelectItem>
    </SelectContent>
  </Select>
</div>;
```

---

## ✅ Checklist

- [ ] Schema Zod atualizado
- [ ] Campo adicionado ao JSX
- [ ] Validação funciona
- [ ] Valor padrão definido (se aplicável)

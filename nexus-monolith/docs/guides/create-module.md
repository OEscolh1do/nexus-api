# Guia: Como Criar um Novo Módulo (Padrão Enterprise)

Este guia define o padrão "Gold Standard" para módulos do Neonorte | Nexus Monolith, alinhado com a estratégia SaaS 2026.
**O não cumprimento destes padrões resultará em reprovação no Code Review.**

## 1. Estrutura de Pastas

Mantenha o isolamento. Nada vaza.

```bash
src/modules/meu-modulo/
├── controllers/    # API REST
├── services/       # Regras de Negócio (Pure JS)
├── schemas/        # Zod Validation
├── events/         # (Novo) Listeners e Emitters
└── types/          # TS Interfaces
```

## 2. Definir o Schema (SaaS Ready)

**Regra Crítica:** Todo dado pertence a um Tenant.

_Arquivo: `src/modules/meu-modulo/schemas/item.schema.js`_

```javascript
import { z } from "zod";

export const CreateItemSchema = z.object({
  name: z.string().min(3),
  // tenantId é injetado pelo Controller via contexto, nunca pelo usuário
});
```

## 3. Implementar o Service (Multi-tenant & Event Driven)

_Arquivo: `src/modules/meu-modulo/services/item.service.js`_

```javascript
import prisma from "../../../lib/prisma";
import { events } from "../../../core/events"; // Event Bus

export const ItemService = {
  // Recebe 'ctx' com tenantId obrigatório
  async create(data, ctx) {
    // 1. Persistência Isolada
    const item = await prisma.item.create({
      data: {
        ...data,
        tenantId: ctx.user.tenantId, // 🔒 SAAS ENFORCEMENT
      },
    });

    // 2. Sinergia (Emitir Evento)
    // "O Software é o Chefe": Avisa outros módulos
    events.emit("meu-modulo.item.created", item);

    return item;
  },

  async list(filters, ctx) {
    return prisma.item.findMany({
      where: {
        ...filters,
        tenantId: ctx.user.tenantId, // 🔒 SAAS ENFORCEMENT
      },
    });
  },
};
```

## 4. Implementar o Controller (RACI Guard)

O Controller aplica as permissões granulares.

```javascript
export const ItemController = {
  async create(req, res) {
    try {
      // 1. RACI Check (Quem pode criar?)
      // Ex: Apenas MANAGER pode criar Itens
      if (!req.user.roles.includes("MANAGER")) {
        throw new ForbiddenError(
          "Apenas Gestores podem criar itens (RACI: Accountable)",
        );
      }

      const data = CreateItemSchema.parse(req.body);

      // Injeta Contexto Seguro
      const result = await ItemService.create(data, { user: req.user });

      res.status(201).json(result);
    } catch (error) {
      // ...Error Handling
    }
  },
};
```

## 5. Event Listeners (Reação)

Se seu módulo precisa reagir a outros:

_Arquivo: `src/modules/meu-modulo/events/listeners.js`_

```javascript
import { events } from "../../../core/events";
import { ItemService } from "../services/item.service";

export function registerListeners() {
  events.on("commercial.deal.won", async (payload) => {
    // Ex: Criar Item automaticamente quando venda fecha
    await ItemService.createFromDeal(payload);
  });
}
```

## ⚔️ Checklist de Qualidade Enterprise

- [ ] **SaaS:** Todas as queries Prisma filtram por `tenantId`?
- [ ] **Eventos:** O módulo notifica o sistema sobre mudanças de estado importantes?
- [ ] **RACI:** As permissões refletem a matriz de responsabilidades, não apenas "Admin/User"?
- [ ] **Offline:** Se for endpoint operacional, suporta sincronização ou idempotência?

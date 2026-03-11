---
description: How to create a new module following the Enterprise Gold Standard pattern
---

# Criar Novo Módulo — Padrão Enterprise

## Pré-requisitos
- Ler `.agent/context.md` para contexto completo
- Ler `docs/guides/create-module.md` para regras de ouro

## Passos

### 1. Schema Prisma (Database First)

Adicionar model ao `backend/prisma/schema.prisma`:

```prisma
model NomeDoModelo {
  id        String   @id @default(cuid())
  tenantId  String                          // 🔒 OBRIGATÓRIO
  // ... campos do domínio
  createdAt DateTime @default(now())
  updatedAt DateTime @default(now()) @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id])
  // ... relações

  @@index([tenantId])                       // 🔒 OBRIGATÓRIO
  @@index([tenantId, createdAt])
}
```

// turbo
```bash
cd backend && npx prisma db push && npx prisma generate
```

### 2. Zod Schema (Validação)

Criar `backend/src/modules/<modulo>/schemas/<recurso>.schema.js`:

```javascript
const { z } = require('zod');

const createSchema = z.object({
  // campos do domínio — tenantId é injetado pelo controller via ctx
});

const updateSchema = createSchema.partial();

module.exports = { createSchema, updateSchema };
```

### 3. Service Layer (Lógica de Negócio)

Criar `backend/src/modules/<modulo>/services/<recurso>.service.js`:

```javascript
const { withTenant } = require('../../../lib/prisma');
const { events } = require('../../../core/events');

const Service = {
  async create(data, ctx) {
    const item = await withTenant(ctx.user.tenantId, async (tx) => {
      return tx.<modelo>.create({ data });
    });
    events.emit('<modulo>.<recurso>.created', item);
    return item;
  },

  async list(filters, ctx) {
    return withTenant(ctx.user.tenantId, async (tx) => {
      return tx.<modelo>.findMany({ where: filters });
    });
  },
};

module.exports = { Service };
```

### 4. Controller (HTTP Magro)

Criar `backend/src/modules/<modulo>/controllers/<recurso>.controller.js`:

- Validar com Zod ANTES de tocar no service
- Usar `requireRole([...])` para RBAC
- Nunca colocar lógica de negócio aqui

### 5. Event Listeners (se cross-module)

Criar `backend/src/modules/<modulo>/events/listeners.js` se o módulo reage a eventos de outros módulos.

### 6. Registrar Rotas

Adicionar em `backend/src/server.js`:
```javascript
app.use('/api/v2/<modulo>', authenticateToken, require('./modules/<modulo>/routes'));
```

## Checklist Final

- [ ] Todas as queries usam `withTenant(tx)` (nunca `prisma.model.*` direto)
- [ ] Schema Zod criado ANTES do controller
- [ ] Permissões via `requireRole()` refletem a matriz RBAC
- [ ] Eventos emitidos para mudanças de estado cross-module
- [ ] Frontend compila sem erros (`npm run build`)
- [ ] Backend inicia sem erros (`npm start`)

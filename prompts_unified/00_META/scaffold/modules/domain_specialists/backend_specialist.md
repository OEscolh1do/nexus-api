---
module_type: domain_specialist
domain: backend
version: 1.0
description: Especialista em backend, APIs, autenticação e services
---

# Backend Specialist

```xml
<specialist_role>
  Backend Specialist - APIs, autenticação, validação Zod, Service Layer
</specialist_role>

<question_templates>
  SE CREATE_CUSTOM_ENDPOINT:
    1. Método HTTP? (GET, POST, PUT, DELETE, PATCH)
    2. Path da rota? (ex: /api/users/:id, /api/projects/:projectId/tasks)
    3. Parâmetros? (body, query, params)
    4. Resposta esperada? (formato JSON, status codes)
    5. Precisa autenticação? (JWT middleware)
    6. Validação Zod? (schema de input)
    7. Lógica complexa? (usar Service Layer)
    8. Transação Prisma? (multi-tabela)

  SE ADD_ZOD_VALIDATION:
    1. Qual endpoint validar?
    2. Campos a validar? (nome, tipo, regras)
    3. Validações customizadas? (regex, min/max, email, etc.)
    4. Mensagens de erro customizadas?

  SE CREATE_SERVICE_LAYER:
    1. Nome do service? (ex: UserService, ProjectService)
    2. Métodos principais? (create, update, delete, etc.)
    3. Lógica de negócio? (regras específicas)
    4. Transações necessárias?
</question_templates>
```

**Templates Suportados:** CREATE_CUSTOM_ENDPOINT, ADD_ZOD_VALIDATION, CREATE_MODULE_CONTROLLER, CREATE_SERVICE_LAYER, API_AUDIT_ENDPOINT

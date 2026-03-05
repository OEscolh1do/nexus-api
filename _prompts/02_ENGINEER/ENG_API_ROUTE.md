# 📡 TEMPLATE: ENG_API_ROUTE (O Backend Dev)

> **💡 PARA QUE SERVE?**
>
> **O Cenário:** Você já tem o banco pronto e agora precisa de uma API funcional (Endpoint + Controller + Service + Validação).
>
> **A Abordagem:** Foca em criar uma rota robusta, seguindo o padrão do projeto e garantindo segurança (Zod/JWT).

---

## ✂️ COPIE ISSO AQUI:

```xml
<system_role>
  Atue como Senior Backend Engineer (Node.js/Express).
  Stack: Prisma, Zod, JWT.
</system_role>

<mission>
  Criar/Atualizar a rota de API: "{{MÉTODO}} {{URL}}".
</mission>

<context>
  <!-- Liste os arquivos de base para a IA seguir o padrão -->
  <existing_service path="{{CAMINHO_DE_OUTRO_SERVICE_EXEMPLO}}" />
  <target_schema path="backend/prisma/schema.prisma" />
</context>

<backend_requirements>
  - [ ] Implementar Schema de Validação (Zod).
  - [ ] Criar método no Service com tratamento de erros (Try/Catch).
  - [ ] Configurar Controller para retornar status HTTP corretos (201, 400, 404, 500).
</backend_requirements>

<red_lines>
  - NUNCA retorne erros brutos do banco para o cliente.
  - Siga rigorosamente o padrão de nomes existente no projeto.
</red_lines>

<output_instruction>
  Forneça os códigos separados para:
  1. `ops.schema.js` (ou equivalente).
  2. `ops.service.js` (ou equivalente).
  3. `ops.controller.js` (ou equivalente).
</output_instruction>
```

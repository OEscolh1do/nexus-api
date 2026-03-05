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
  Atue como Senior Backend Engineer.
  Stack: {{BACKEND_FRAMEWORK}}, {{ORM_CHOICE}}, {{VALIDATION_LIBRARY}}.
  Princípios: Validação rigorosa, Tratamento de erros, Segurança.
</system_role>

<mission>
  Criar/Atualizar a rota de API: "{{MÉTODO}} {{URL}}".
</mission>

<context>
  <!-- Liste os arquivos de base para a IA seguir o padrão -->
  <existing_service path="{{CAMINHO_DE_OUTRO_SERVICE_EXEMPLO}}" />
  <target_schema path="{{CAMINHO_DO_SCHEMA_DB}}" />
</context>

<backend_requirements>
  - [ ] Implementar Schema de Validação ({{VALIDATION_LIBRARY: Zod, Joi, class-validator, Pydantic}}).
  - [ ] Criar método no Service com tratamento de erros (Try/Catch).
  - [ ] Configurar Controller para retornar status HTTP corretos (201, 400, 404, 500).
  - [ ] Adicionar autenticação/autorização se necessário (JWT, OAuth, etc).
</backend_requirements>

<red_lines>
  - NUNCA retorne erros brutos do banco para o cliente.
  - Siga rigorosamente o padrão de nomes existente no projeto.
  - Valide TODOS os inputs antes de processar.
</red_lines>

<output_instruction>
  Forneça os códigos separados seguindo a arquitetura do {{BACKEND_FRAMEWORK}}:
  1. Schema de Validação
  2. Service Layer (Lógica de negócio)
  3. Controller/Route Handler
</output_instruction>
```

---

## 📚 Exemplos Multi-Framework

### Node.js + Express + Prisma

```javascript
// validation.schema.js
import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
});

// user.service.js
export class UserService {
  async createUser(data) {
    try {
      return await prisma.user.create({ data });
    } catch (error) {
      throw new Error("Falha ao criar usuário");
    }
  }
}

// user.controller.js
router.post("/api/users", async (req, res) => {
  const validated = createUserSchema.parse(req.body);
  const user = await userService.createUser(validated);
  res.status(201).json(user);
});
```

### Python + FastAPI + SQLAlchemy

```python
# schemas.py
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    name: str
    email: EmailStr

# services.py
class UserService:
    def create_user(self, data: UserCreate):
        try:
            user = User(**data.dict())
            db.add(user)
            db.commit()
            return user
        except Exception as e:
            raise HTTPException(status_code=500, detail="Falha ao criar usuário")

# routes.py
@app.post("/api/users", status_code=201)
async def create_user(data: UserCreate):
    return user_service.create_user(data)
```

### Java + Spring Boot + JPA

```java
// UserDTO.java
@Data
public class UserDTO {
    @NotBlank
    @Size(min = 3)
    private String name;

    @Email
    private String email;
}

// UserService.java
@Service
public class UserService {
    public User createUser(UserDTO dto) {
        try {
            User user = new User();
            user.setName(dto.getName());
            user.setEmail(dto.getEmail());
            return userRepository.save(user);
        } catch (Exception e) {
            throw new RuntimeException("Falha ao criar usuário");
        }
    }
}

// UserController.java
@RestController
@RequestMapping("/api/users")
public class UserController {
    @PostMapping
    public ResponseEntity<User> create(@Valid @RequestBody UserDTO dto) {
        User user = userService.createUser(dto);
        return ResponseEntity.status(201).body(user);
    }
}
```

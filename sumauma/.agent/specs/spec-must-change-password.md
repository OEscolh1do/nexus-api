# Specification: Force Password Change (mustChangePassword)

## 1. `/speckit.specify` — O Quê

**Problema de Negócio:**
Atualmente, quando um administrador cria um usuário no painel `neonorte-admin`, a senha é gerada no lado do cliente ou definida manualmente e o usuário acessa com essa senha padrão. Para garantir a segurança (conformidade básica), novos usuários ou usuários com senhas resetadas pelo administrador precisam ser forçados a alterar a senha no primeiro login.

**Usuário Final:**
- Usuários do Iaçã (Engenheiros, Vendedores, etc).
- Administradores do Tenant (garantem a segurança da conta).

**Critérios de Aceitação (DoD):**
- O schema `User` do Prisma (`db_iaca`) deve possuir a flag `mustChangePassword` (boolean, default: `false`).
- Ao criar um usuário ou realizar o "Reset de Senha" no Admin, a flag deve ser setada para `true`.
- No login (`POST /api/v1/auth/login` no Iaçã), se a flag for `true`, o backend emite um token provisório ou retorna um status `403 Password Change Required`.
- O frontend do Iaçã detecta essa resposta e redireciona para uma tela de `ForceChangePassword`.
- Uma nova rota `/api/v1/auth/force-change-password` atualiza a senha e muda a flag para `false`, retornando o token JWT final.

**Out of Scope (Exclusions):**
- Políticas de complexidade avançada de senha (além do mínimo de 8 caracteres atual).
- Envio de e-mail de "Boas vindas" com link mágico (o foco é apenas a flag no login atual).

---

## 2. `/speckit.plan` — O Como (Implementação)

### Alterações no Banco de Dados (`schema-iaca.prisma`)
1. **Model `User`**: Adicionar `mustChangePassword Boolean @default(false)`.
2. Executar `npx prisma migrate dev --name add_must_change_password`.

### Alterações no Iaçã Backend
1. **Rota de Login (`auth.service.js`)**:
   - Modificar a verificação de login: se `validPassword` for true mas `mustChangePassword` for `true`, retornar `{ success: false, requirePasswordChange: true, tempToken: <jwt-curto> }`.
2. **Nova Rota (`PATCH /auth/force-change-password`)**:
   - Middleware valida `tempToken` ou exige login ativo bloqueado.
   - Atualiza o hash da senha usando `bcrypt`.
   - `mustChangePassword = false`.
   - Gera o JWT normal e o cookie `nexus_session`.

### Alterações no Neonorte Admin BFF
1. **Rota de Criação/Reset (`users.js`)**:
   - Sempre que o BFF usar M2M para criar um usuário ou "resetar senha", forçar `mustChangePassword: true` no payload enviado para a API do Iaçã.

### Alterações no Frontend (Iaçã)
1. **`LoginView.tsx`**: Interceptar a flag `requirePasswordChange` na resposta de sucesso. Redirecionar para `/force-change-password`.
2. **`ForceChangePassword.tsx`**: Formulário de 2 campos (Nova Senha, Confirmar Nova Senha). 

---

## 3. `Divine Triad` & `Chain-of-Verification`

**Dike (Validador de Riscos e Análise Estática):**
- *Risco de Autenticação:* Se o `tempToken` der acesso total às rotas privadas antes de trocar a senha, a segurança falha.
- *Correção CoVe:* O `tempToken` deve ter uma payload restrita (ex: `{ id, role, isTemp: true }`) e o `authenticateToken` do Iaçã deve rejeitar se `isTemp === true`, forçando o usuário a usar apenas a rota de `force-change-password`.
- *Verificação de Schema:* Ao rodar o Prisma, verificar se a ausência do campo nos registros antigos quebrará logins existentes. (Um `@default(false)` no Prisma resolve isso na migration).

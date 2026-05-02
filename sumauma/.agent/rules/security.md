# Regras de Segurança — Neonorte Admin

## Autenticação

1. **JWT com role PLATFORM_ADMIN**: Toda rota `/admin/*` exige JWT válido com `role === 'PLATFORM_ADMIN'`.
2. **Sem self-registration**: Operadores são criados via seed ou por outro operador autenticado.
3. **Token expiration**: JWT expira em 8h. Refresh token não implementado — operador refaz login.
4. **Password hashing**: bcrypt com salt rounds = 12.

## M2M (Machine to Machine)

1. **M2M Token NUNCA exposto ao frontend**. Vive exclusivamente como env var no backend.
2. **Header padrão**: `X-Service-Token` para comunicação interna entre serviços.
3. **Validação bidirecional**: O Iaçã e o Kurupira devem validar o M2M Token em rotas `/internal/*`.

## Acesso a Dados

1. **User MySQL read-only** (`user_admin`): Apenas `SELECT`. Nunca INSERT/UPDATE/DELETE direto.
2. **Sem acesso cruzado de escrita**: O Admin BFF NUNCA escreve diretamente em `db_iaca` ou `db_kurupira`.
3. **Prisma Client read-only**: Configurado sem `create`, `update`, `delete` em nível de código.

## OWASP Top 10

1. **Injection**: Usar Prisma (parameterized queries). Nunca concatenar strings SQL.
2. **XSS**: React escapa por padrão. Nunca usar `dangerouslySetInnerHTML`.
3. **CSRF**: Não aplicável (JWT em header, não cookie).
4. **Rate Limiting**: `express-rate-limit` em todas as rotas. Limite: 100 req/min por IP.
5. **CORS**: Restrito à origem do Admin Frontend (`http://localhost:5175` em dev).
6. **Headers de segurança**: Helmet.js para `X-Content-Type-Options`, `X-Frame-Options`, etc.

## Audit Trail

1. **Toda ação administrativa gera AuditLog** com prefixo `ADMIN_` (ex: `ADMIN_BLOCK_TENANT`).
2. **Campos obrigatórios**: `operatorId`, `action`, `targetResource`, `timestamp`, `ipAddress`.
3. **AuditLogs são imutáveis**: Append-only. Nunca UPDATE ou DELETE.

## Proteções Específicas

1. **Tenant MASTER protegido**: O tenant com `type: MASTER` NUNCA pode ser bloqueado ou excluído.
2. **Confirmação para ações destrutivas**: Operador deve digitar o nome do recurso para confirmar.
3. **Timeout em M2M**: 10s para Iaçã, 15s para Kurupira (parsing pesado).

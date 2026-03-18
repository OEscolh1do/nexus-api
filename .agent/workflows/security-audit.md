---
description: Scan de vulnerabilidades OWASP no código gerado (XSS, Injection, Auth)
---

# Workflow `Security Audit` — Varredura OWASP

Execute este workflow antes de qualquer deploy em staging ou produção, e sempre que código relacionado à autenticação, inputs de usuário ou comunicação com APIs externas for modificado.

## Passo 1: Varredura de Injeção (OWASP A03)

- Busque por queries SQL construídas com concatenação de string (ex: `"SELECT * FROM " + tableName`).
  - **Solução**: Use Prepared Statements ou ORMs com query builders parametrizados (ex: Prisma, Knex).
- No frontend, busque uso de `dangerouslySetInnerHTML` com dados não sanitizados.
  - **Solução**: Nunca use `dangerouslySetInnerHTML` com dados vindos da API. Use bibliotecas como `DOMPurify` se necessário.

## Passo 2: Varredura de Autenticação Quebrada (OWASP A07)

- Confirme que **todos** os endpoints críticos da API verificam o token JWT antes de processar a requisição.
- Verifique se tokens estão sendo armazenados em `HttpOnly Cookies` (seguro) e **não** em `localStorage` (inseguro contra XSS).
- Confirme que o fluxo SSO entre módulos (Nexus Hub → Nexus ERP) usa o parâmetro `?session=TOKEN` envelopado e não tokens em query strings expostas.

## Passo 3: Varredura de Exposição de Dados Sensíveis (OWASP A02)

- Busque por `console.log` em código de produção que possa imprimir tokens, senhas ou dados de usuário.
- Verifique se variáveis de `.env` sensíveis (ex: `DB_PASSWORD`, `JWT_SECRET`) estão no `.gitignore` e nunca commitadas.
- Confirme que as respostas da API não retornam campos desnecessários (ex: hash de senha no payload de `GET /users`).

## Passo 4: Varredura de Controle de Acesso Quebrado (OWASP A01)

- Verifique se o RBAC (Role-Based Access Control) está sendo aplicado **no backend**, e não apenas no frontend (ocultação de botões não é segurança).
- Confirme que um usuário com role `VIEWER` não consegue acessar endpoints que exigem role `ADMIN` mesmo manipulando a requisição diretamente.

## Passo 5: Relatório de Auditoria

Documente os achados em um relatório com severidade:
- 🔴 **Crítico**: Vulnerabilidade ativa explorável imediatamente.
- 🟠 **Alto**: Risco significativo que deve ser corrigido antes do deploy.
- 🟡 **Médio**: Melhoria de segurança recomendada.
- 🟢 **Informativo**: Boas práticas sugeridas sem risco imediato.

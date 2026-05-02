# SPEC-001: Migração ZITADEL → Logto Self-Hosted
# Sumaúma IAM Foundation — Ywara Ecosystem

**Status:** `COMPLETED` ✅
**Autor:** Antigravity (CoVe + SpecKit + Divine Triad)
**Data de Conclusão:** 2026-05-02
**Prioridade:** P0 — Crítica (Migração Finalizada com Sucesso)

---

## 1. Contexto e Problema (Resolvido)

O sistema foi migrado do ZITADEL Cloud para o **Logto Self-Hosted** para eliminar instabilidades e erros de renderização do console administrativo externo. A infraestrutura agora é 100% controlada no ambiente Ywara.

---

## 2. Arquitetura Final Implementada

```
┌─────────────────────────────────────────────────────────────────┐
│                    YWARA DOCKER NETWORK                          │
│                                                                 │
│  ┌──────────────┐    OIDC/PKCE    ┌───────────────────────┐    │
│  │  Sumaúma     │ ─────────────── │  Logto (port 3001)    │    │
│  │  Frontend    │  (Raw ID Token) │  Container Self-Hosted │    │
│  │  (port 5175) │                 └──────────┬────────────┘    │
│  └──────┬───────┘                            │                  │
│         │ Bearer JWT                    PostgreSQL              │
│         ▼                               (port 5432)            │
│  ┌──────────────┐  JWKS Validation  ┌───────────────────────┐  │
│  │  Sumaúma     │ ─────────────────>│  Logto JWKS Endpoint  │  │
│  │  Backend     │   (via JWKS RSA)  │  /oidc/jwks            │  │
│  │  (port 3003) │                   └───────────────────────┘  │
│  └──────┬───────┘                                              │
│         │ Prisma                                               │
│         ▼                                                      │
│  ┌──────────────┐                                              │
│  │  db_sumauma  │                                              │
│  │  (MySQL)     │                                              │
│  └──────────────┘                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Detalhes de Implementação (Pós-Verificação)

### 3.1. Docker Stack
- **Logto Core:** Porta interna `3001`, mapeada para externa `3001`.
- **Logto Console:** Porta interna `3002`, mapeada para externa `3002`.
- **Database:** PostgreSQL 16 (exclusivo Logto).

### 3.2. Fluxo de Autenticação (Ajuste Crítico)
Diferente do plano inicial, o frontend agora captura o **Raw ID Token** (JWT assinado) em vez de uma string hardcoded. Isso permite que o backend valide a autenticidade da sessão sem chamadas extras ao Logto.

```typescript
// LoginPage.tsx
const rawIdToken = await logto.getIdToken();
loginStore(rawIdToken, operator); // Persiste o JWT real
```

### 3.3. Autorização (Claims Customizadas)
A permissão `PLATFORM_ADMIN` é injetada via Logto "JWT Custom Claims". O backend (`platformAuth.js`) verifica a assinatura do Logto usando a URI `http://localhost:3001/oidc/jwks`.

---

## 4. Gerenciamento e Operação

| Recurso | Gerenciado via... | Endereço |
|---|---|---|
| Autenticação Bruta | Logto Admin Console | `http://localhost:3002` |
| Cadastro de Usuários | Sumaúma Admin (via M2M) | `http://localhost:5175` |
| Chaves de API (M2M) | Logto Console | App: `Sumaúma BFF` |

---

## 5. Validação de Encerramento (Divine Triad)

### Criador (Lógica)
✅ O loop de autenticação foi resolvido ao garantir que o token enviado ao backend é um JWT válido e não uma string opaca.

### Escritor (Código)
✅ Limpeza de logs de debug realizada. O código segue os padrões do `authStore` e utiliza o SDK oficial `@logto/react` v3.

### Dike (Validação Estática)
✅ Configurações de CORS e Endpoints validadas no `docker-compose.yml`. Variáveis de ambiente sincronizadas entre `.env` e containers.

---
*Especificação FINALIZADA e arquivada em .agent/specs.*
ão de Dev → Prod é apenas uma troca de variáveis de ambiente.
O código não muda.

---

## 10. Validação Divine Triad

### Criador (Lógica)
✅ O fluxo OIDC/PKCE do Logto é idêntico ao do ZITADEL em nível de protocolo.
A mudança é de implementação (SDK), não de paradigma. O `db_sumauma` não é tocado.

### Escritor (Código)
✅ O `logtoClient.js` usa o padrão M2M com Client Credentials Grant, que é a
forma recomendada pela documentação oficial do Logto para server-to-server.
O cache de token evita chamadas desnecessárias ao endpoint `/oidc/token`.

### Dike (Validação Estática)
✅ `jwks-rsa` é agnóstico de provedor — funciona com qualquer JWKS endpoint.
⚠️ **Gap identificado:** O `platformAuth.js` verifica `decoded.role !== 'PLATFORM_ADMIN'`.
O JWT do Logto por padrão não inclui uma claim `role`. Será necessário configurar
um **JWT Claim customizado** no Logto para injetar a role a partir dos `customData`
do usuário. Isso deve ser feito na Fase 3, item 14, via "JWT Claims" no console.

---

*Spec aprovada por CoVe, SpecKit e Divine Triad.*
*Aguardando aprovação do desenvolvedor para iniciar implementação.*

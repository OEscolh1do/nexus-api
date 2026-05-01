# Neonorte Admin Backend — Conceitos Fundamentais

> **Documento:** Referência técnica para o módulo `neonorte-admin/backend/`
> **Público-alvo:** Desenvolvedor responsável pela implementação do Backoffice do Operador
> **Última atualização:** 2026-04-30

---

## 1. BFF — Backend for Frontend

### O que é

**BFF** (Backend for Frontend) é um servidor que existe exclusivamente para servir um único frontend específico. Ele não é um serviço de domínio genérico — ele é um **adaptador sob medida** entre a interface visual e os dados que ela precisa.

Pense assim: o frontend do Admin tem necessidades muito diferentes do frontend do Kurupira ou do Iaçã. O painel administrativo precisa de visões cross-tenant, dados consolidados de múltiplos serviços e operações que nenhum dos backends de produto foi projetado para expor. O BFF existe para resolver exatamente isso, sem obrigar os backends de produto a se adaptarem.

### Por que usar um BFF no neonorte-admin

O Admin Backend **não é** uma API de produto. Ele não gerencia projetos solares nem leads de CRM. Sua função é orquestrar: recebe uma requisição do frontend do Admin, decide de onde buscar os dados (banco direto, Iaçã, Kurupira), agrega, formata e devolve exatamente o que a tela precisa.

```
Sem BFF (o problema):
   Admin Frontend → Iaçã API       (busca tenants)
   Admin Frontend → Kurupira API   (busca catálogo)
   Admin Frontend → Iaçã API       (busca audit logs)
   Admin Frontend → faz os JOINs e formatações por conta própria
   → Lógica de negócio vaza para o frontend
   → Frontend vira um orquestrador — papel que não é dele

Com BFF (a solução):
   Admin Frontend → Admin BFF
   Admin BFF      → Iaçã API       (busca tenants)
   Admin BFF      → Kurupira API   (busca catálogo)
   Admin BFF      → db_iaca (read) (busca audit logs)
   Admin BFF      → agrega, formata, responde UMA vez
   → Frontend recebe exatamente o shape que precisa
```

### O que o neonorte-admin-backend faz na prática

| Responsabilidade | Exemplo |
|:---|:---|
| **Autenticação do operador** | Valida JWT com role `PLATFORM_ADMIN` em cada requisição |
| **Agregação de dados** | Cruzar dados de `db_iaca` e `db_kurupira` numa query única |
| **Orquestração de mutações** | Repassar a criação de um usuário para o Iaçã via HTTP, preservando o hash de senha e as validações de negócio do serviço dono |
| **Transformação de dados** | Formatar um `AuditLog` bruto do banco em um evento legível para a timeline do Admin |
| **Proxy de operações sensíveis** | Upload de arquivo `.pan` para o Kurupira processar e validar |

---

## 2. Endpoint

### O que é

Um **endpoint** é um endereço HTTP exposto por um servidor que representa uma operação específica. É a "porta" que o frontend bate para acessar uma funcionalidade.

Um endpoint é definido pela combinação de dois elementos:
- **Método HTTP**: Define a intenção da operação.
- **Rota (path)**: Define o recurso ou ação alvo.

### Métodos HTTP e suas intenções

| Método | Intenção | Analogia |
|:---|:---|:---|
| `GET` | Buscar/ler dados | Abrir uma gaveta e olhar o conteúdo |
| `POST` | Criar um novo recurso | Colocar um novo arquivo na gaveta |
| `PUT` | Substituir/atualizar um recurso | Pegar o arquivo e reescrever do zero |
| `PATCH` | Atualizar parcialmente | Riscar uma linha e escrever uma nova |
| `DELETE` | Remover um recurso | Jogar o arquivo fora |

### Endpoints do neonorte-admin-backend

Abaixo estão os endpoints planejados para o BFF do Admin, explicando o que cada um faz e de onde os dados vêm:

```
GET  /admin/tenants
     → Lê db_iaca diretamente (user_admin READ-ONLY)
     → Retorna lista de todos os Tenants (organizações clientes)

PUT  /admin/tenants/:id
     → Repassa para Iaçã API via M2M
     → Ex: bloquear tenant, alterar plano de assinatura

GET  /admin/users
     → Lê db_iaca diretamente (user_admin READ-ONLY)
     → Retorna todos os Users de todos os tenants

PUT  /admin/users/:id
     → Repassa para Iaçã API via M2M
     → Ex: redefinir senha, alterar role, desativar conta

DELETE /admin/users/:id
     → Repassa para Iaçã API via M2M
     → Iaçã executa soft-delete ou hard-delete com suas regras

GET  /admin/catalog/modules
     → Lê db_kurupira diretamente (user_admin READ-ONLY)
     → Retorna todos os ModuleCatalog (módulos FV)

POST /admin/catalog/modules
     → Repassa para Kurupira API via M2M
     → Kurupira valida os parâmetros elétricos do .pan antes de salvar

GET  /admin/catalog/inverters
     → Lê db_kurupira diretamente (user_admin READ-ONLY)
     → Retorna todos os InverterCatalog

POST /admin/catalog/inverters
     → Repassa para Kurupira API via M2M
     → Kurupira valida o .ond antes de salvar

GET  /admin/audit-logs
     → Lê db_iaca diretamente (user_admin READ-ONLY)
     → Suporta filtros: tenantId, userId, ação, período
     → JOINs com User para enriquecer o log com nome/username

GET  /admin/system/health
     → HTTP probe para /health dos serviços Iaçã (3001) e Kurupira (3002)
     → Retorna status consolidado dos dois sistemas
```

### Anatomia de uma requisição do Admin

```
1. Admin Frontend envia:
   GET /admin/tenants?status=active&limit=50
   Authorization: Bearer <jwt_platform_admin>

2. Admin BFF recebe, valida o JWT e extrai role = PLATFORM_ADMIN

3. BFF executa query READ-ONLY no db_iaca:
   SELECT id, name, type, apiPlan, createdAt
   FROM Tenant
   WHERE ... (filtros)
   LIMIT 50

4. BFF formata e responde:
   {
     "tenants": [...],
     "total": 42,
     "page": 1
   }

5. Admin Frontend renderiza a DataGrid de organizações
```

---

## 3. M2M Token — Machine to Machine

### O que é

**M2M** (Machine to Machine) é um padrão de autenticação usado quando dois **servidores** precisam se comunicar entre si, sem que haja um humano envolvido na sessão.

Em autenticação humana, o fluxo é:
```
Humano → preenche login/senha → recebe JWT com sua identidade
```

Em M2M, o fluxo é:
```
Servidor A → apresenta um segredo compartilhado → Servidor B confia e responde
```

O segredo compartilhado é chamado de **M2M Token** (ou Service Token, ou API Key interna). Ele fica armazenado como variável de ambiente e nunca é exposto para o frontend ou para o usuário final.

### Por que o Admin BFF precisa de um M2M Token

Quando o operador bloqueia um tenant pelo painel Admin, o fluxo é:

```
Operador (humano)
    ↓  clica em "Bloquear Tenant"
Admin Frontend
    ↓  PUT /admin/tenants/xyz  + JWT do operador
Admin BFF
    ↓  valida JWT do operador, confirma que é PLATFORM_ADMIN
    ↓  precisa chamar o Iaçã para executar o bloqueio
    ↓  mas o JWT do operador não é válido no Iaçã!
    ↓  usa o M2M Token para se identificar como "serviço confiável"
Iaçã API
    ↓  recebe a requisição, vê o M2M Token, confia no Admin BFF
    ↓  executa o bloqueio com suas próprias regras de negócio
    ↓  retorna 200 OK
Admin BFF
    ↓  propaga o sucesso para o Admin Frontend
```

O M2M Token diz ao Iaçã: **"quem faz esta requisição é o Admin BFF, um serviço interno confiável — não um usuário externo"**.

### Como o M2M Token está configurado no ecossistema Neonorte

No `docker-compose.yml` atual, todos os serviços já compartilham o mesmo segredo:

```yaml
# Iaçã Backend
environment:
  M2M_SERVICE_TOKEN: "m2m_guardioes_secret_2026!"

# Kurupira Backend
environment:
  M2M_SERVICE_TOKEN: "m2m_guardioes_secret_2026!"
```

Cada backend valida requisições internas verificando se o header `X-Service-Token` (ou similar) bate com seu próprio `M2M_SERVICE_TOKEN`. Se bater, trata como uma chamada interna privilegiada.

O Admin BFF precisará da mesma variável para se apresentar aos serviços irmãos:

```yaml
# neonorte-admin-backend (a adicionar)
environment:
  M2M_SERVICE_TOKEN: "m2m_guardioes_secret_2026!"
  IACA_INTERNAL_URL: "http://iaca-backend:3001"
  KURUPIRA_INTERNAL_URL: "http://kurupira-backend:3002"
```

### Como o M2M Token é usado no código do Admin BFF

```javascript
// neonorte-admin/backend/src/lib/m2mClient.js

const axios = require('axios');

const iacaClient = axios.create({
  baseURL: process.env.IACA_INTERNAL_URL,
  headers: {
    'X-Service-Token': process.env.M2M_SERVICE_TOKEN,
    'Content-Type': 'application/json',
  },
});

const kurupiraClient = axios.create({
  baseURL: process.env.KURUPIRA_INTERNAL_URL,
  headers: {
    'X-Service-Token': process.env.M2M_SERVICE_TOKEN,
    'Content-Type': 'application/json',
  },
});

module.exports = { iacaClient, kurupiraClient };
```

```javascript
// Exemplo de uso: bloquear um tenant
async function blockTenant(tenantId) {
  // O Admin BFF chama o Iaçã como serviço interno
  const response = await iacaClient.put(`/internal/tenants/${tenantId}`, {
    status: 'BLOCKED',
  });
  return response.data;
}
```

---

## 4. Como Tudo se Correlaciona

O diagrama abaixo mostra o fluxo completo de uma operação típica no Backoffice — neste caso, o operador adicionando um novo módulo FV ao catálogo global via upload de arquivo `.pan`:

```
┌─────────────────────────────────────────────────────────────┐
│                    OPERADOR (Humano)                        │
│              Faz login com credencial PLATFORM_ADMIN        │
└─────────────────────────┬───────────────────────────────────┘
                          │ Sessão autenticada (JWT)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│               ADMIN FRONTEND (Vite + React)                 │
│         Tela: "Catálogo > Módulos > Adicionar"              │
│         Usuário faz upload do arquivo BiFacial_550W.pan     │
└─────────────────────────┬───────────────────────────────────┘
                          │ POST /admin/catalog/modules
                          │ Authorization: Bearer <JWT_PLATFORM_ADMIN>
                          │ Body: { arquivo: BiFacial_550W.pan }
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              ADMIN BFF  (neonorte-admin/backend)            │
│                                                             │
│  1. Valida JWT → confirma role = PLATFORM_ADMIN             │
│  2. Não salva nada por conta própria no banco               │
│  3. Usa o M2M Token para chamar o Kurupira como serviço     │
└─────────────────────────┬───────────────────────────────────┘
                          │ POST /internal/catalog/modules
                          │ X-Service-Token: m2m_guardioes_secret_2026!
                          │ Body: { arquivo: BiFacial_550W.pan }
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              KURUPIRA BACKEND                               │
│                                                             │
│  1. Valida X-Service-Token → confia no Admin BFF            │
│  2. Faz o parse do arquivo .pan                             │
│  3. Valida parâmetros elétricos (Pmpp, Voc, Isc...)         │
│  4. Salva no ModuleCatalog do db_kurupira                   │
│  5. Retorna 201 Created                                     │
└─────────────────────────┬───────────────────────────────────┘
                          │ { id: "...", model: "BiFacial 550W", ... }
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              ADMIN BFF  (retorno)                           │
│  Propaga o sucesso para o frontend                          │
└─────────────────────────┬───────────────────────────────────┘
                          │ 201 Created
                          ▼
┌─────────────────────────────────────────────────────────────┐
│               ADMIN FRONTEND                                │
│  Exibe toast: "Módulo adicionado ao catálogo global"        │
│  Atualiza a DataGrid com o novo item                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Resumo em Uma Linha

| Conceito | Resumo |
|:---|:---|
| **BFF** | O Admin Backend existe para servir APENAS o Admin Frontend — agrega, formata e orquestra dados de múltiplas fontes |
| **Endpoint** | O endereço HTTP que o frontend chama para executar uma operação (ex: `GET /admin/tenants`) |
| **M2M Token** | O "crachá" que o Admin BFF apresenta ao Iaçã e ao Kurupira para provar que é um serviço interno confiável, não um usuário externo |
| **Correlação** | O frontend chama um endpoint do BFF → o BFF usa o M2M Token para chamar os serviços donos dos dados → os serviços respondem → o BFF agrega e devolve ao frontend |

---

## 6. Referências

- [Plano de Implementação do Neonorte Admin](./../.agent/brain/dbbeb7ef-7637-4208-9a4b-7a2223b8143d/implementation_plan.md)
- [docker-compose.yml](./../docker-compose.yml)
- [Schema Iaçã — Tenant e User](./../iaca-erp/backend/prisma/schema.prisma)
- [Schema Kurupira — ModuleCatalog e InverterCatalog](./../kurupira/backend/prisma/schema.prisma)

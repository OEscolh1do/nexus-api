---
name: local-dev-bootstrap
description: Bootstrap e troubleshooting do ambiente de desenvolvimento local do Ywara. Ative quando qualquer backend falhar ao subir com P1001, MODULE_NOT_FOUND no Prisma, ou quando o desenvolvedor iniciar uma nova sessão de trabalho após reiniciar o computador.
---

# Skill: Local Dev Bootstrap — Ambiente Ywara

## Gatilho Semântico

Ativado quando:
- Erro `P1001: Can't reach database server` no Prisma
- Erro `MODULE_NOT_FOUND` em `node_modules/.prisma/client-sumauma`
- `ECONNREFUSED 127.0.0.1:3306` em qualquer backend
- Desenvolvedor diz: "backend não sobe", "erro de banco local", "reiniciei o PC"
- Primeira sessão do dia ou após reinicialização do Docker Desktop

## Arquitetura do Ambiente Local

O Ywara usa **MySQL via Docker** mesmo em desenvolvimento local. Não há MySQL nativo instalado no Windows.

```
Windows Host
├── Docker Desktop
│   └── nexus-db (mysql:8.0) → porta 3306 mapeada para 0.0.0.0:3306
├── sumauma/backend → npm run dev (porta 3003) → conecta em 127.0.0.1:3306
├── kurupira/backend → npm run dev (porta 3002) → conecta em 127.0.0.1:3306
├── iaca/backend → npm run dev (porta 3001) → conecta em 127.0.0.1:3306
└── frontends (Vite) → portas 5173-5175
```

> ⚠️ **Armadilha crítica**: O Sumaúma backend NÃO valida a conexão com o banco no startup
> (lazy loading). Ele aparece como "rodando" mesmo sem banco. O Kurupira, ao contrário,
> executa um `warmUpCache()` no startup e revela imediatamente qualquer falha de conexão.

## Protocolo de Bootstrap (Início de Sessão)

### Passo 1: Garantir que o banco está rodando

```powershell
# Na raiz do projeto (\Ywara)
docker compose up -d nexus-db

# Verificar se subiu saudável
docker ps --filter name=neonorte_db
# Esperado: STATUS = "Up X seconds (healthy)", PORTS = "0.0.0.0:3306->3306/tcp"
```

### Passo 2: Verificar os Prisma Clients do Kurupira

O Kurupira possui **dois** schemas Prisma que precisam de clients separados:

| Schema | Output | Propósito |
|---|---|---|
| `prisma/schema.prisma` | `node_modules/@prisma/client` | Banco principal `db_kurupira` |
| `prisma/schema-sumauma.prisma` | `node_modules/.prisma/client-sumauma` | Leitura RO de `db_sumauma` (AuthZ) |

O Sumaúma possui **dois** schemas Prisma:

| Schema | Output | Propósito |
|---|---|---|
| `prisma/schema.prisma` | `node_modules/@prisma/client` | Banco principal `db_sumauma` |
| `prisma/schema-kurupira.prisma` | `node_modules/.prisma/client-kurupira` | Leitura RO de `db_kurupira` (Catálogo) |

Se a pasta `node_modules/.prisma/client-kurupira` não existir ou estiver desatualizada:

```powershell
# ⚠️ WINDOWS: Pare o servidor (npm run dev) ANTES de executar este comando
# Em sumauma/backend:
npx prisma generate --schema=./prisma/schema-kurupira.prisma
```

> ⚠️ **Armadilha no Windows**: `prisma generate` falha com `EPERM: operation not permitted` se o servidor `nodemon` estiver rodando, pois o arquivo binário `.dll.node` fica bloqueado. Pare o servidor (`Ctrl+C`), gere o client e reinicie.

### Passo 3: Subir os backends

```powershell
# Em cada pasta de backend (sumauma/backend, kurupira/backend, iaca/backend)
npm run dev
```

## Diagnóstico de P1001 — Árvore de Decisão

```
P1001: Can't reach database server
│
├── netstat -ano | findstr :3306 (retorna vazio?)
│   └── SIM → Banco desligado
│       └── Executar: docker compose up -d nexus-db
│
├── docker ps | grep neonorte_db (STATUS = Restarting?)
│   └── SIM → Container crashando
│       └── docker logs neonorte_db --tail 50
│
└── Porta aberta mas P1001 persiste?
    ├── Verificar aspas no .env → remover aspas de DATABASE_URL
    ├── URL-encode caracteres especiais na senha: ! → %21
    └── Trocar localhost por 127.0.0.1 (ou vice-versa) para forçar IPv4
```

## Sequência Completa de Regeneração Pós-Migration (Ywara Multi-Schema)

Após qualquer `prisma migrate dev` no Kurupira, **dois** serviços precisam ser atualizados:

```powershell
# PASSO 1: No Kurupira — a migration já regenera o client principal automaticamente
cd <raiz>/kurupira/backend
npx prisma migrate dev --name <descricao>

# PASSO 2: No Sumaúma — regenerar o client RO manualmente
# (Windows: pare o servidor sumauma ANTES)
cd <raiz>/sumauma/backend
npx prisma generate --schema ./prisma/schema-kurupira.prisma
# Reiniciar: npm run dev
```

| Serviço | Schema RO | Quando Regenerar |
|---|---|---|
| `kurupira/backend` | `schema-sumauma.prisma` | Mudanças em `User` / `Tenant` |
| `sumauma/backend` | `schema-kurupira.prisma` | Mudanças em `InverterCatalog` / `ModuleCatalog` |

## Diagnóstico de MODULE_NOT_FOUND no client-sumauma (Kurupira)

## Checklist de Saúde do Ambiente

Execute para validar o ambiente completo antes de começar a trabalhar:

```powershell
# 1. Banco rodando?
docker ps --filter name=neonorte_db --format "{{.Status}}"
# Esperado: "Up X minutes (healthy)"

# 2. Porta respondendo?
Test-NetConnection -ComputerName 127.0.0.1 -Port 3306
# Esperado: TcpTestSucceeded = True

# 3. Conexão Node.js funcional? (opcional — usar o script de diagnóstico)
node scratch/test-db.js
# Esperado: "✅ Conexão bem-sucedida via mysql2!"
```

## Script de Diagnóstico Rápido

Salve em `kurupira/backend/scratch/test-db.js` quando necessário:

```javascript
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  const url = process.env.DATABASE_URL;
  console.log('Testando conexão com:', url);
  try {
    const connection = await mysql.createConnection(url);
    console.log('✅ Conexão bem-sucedida via mysql2!');
    await connection.end();
  } catch (err) {
    console.error('❌ Falha na conexão via mysql2:', err.message);
  }
}

testConnection();
```

## Portas Padrão do Ecossistema Ywara

| Serviço | Porta |
|---|---|
| `nexus-db` (MySQL Docker) | 3306 |
| `iaca/backend` | 3001 |
| `kurupira/backend` | 3002 |
| `sumauma/backend` | 3003 |
| Kurupira Frontend (Vite) | 5173 |
| Sumaúma Frontend (Vite) | 5175 |

## Regras de Ouro do .env Local

1. **Sem aspas** nos valores de variáveis de ambiente. O Prisma no Windows interpreta aspas como parte do valor.
2. **Encode de caracteres especiais** na URL de conexão: `!` → `%21`, `@` → `%40`.
3. **Usar `127.0.0.1`** em vez de `localhost` para forçar IPv4 (Windows pode resolver `localhost` como `::1`).

## Hard Boundaries (O que esta skill NÃO faz)

- Não cobre deploys ou ambiente de produção no VPS → use `vps-deploy` ou `vps-debug`
- Não cobre conflitos de porta entre processos → use `server-slayer`
- Não cobre migrações de schema quebradas em produção → use `vps-debug` seção "Falha de Migração Prisma"

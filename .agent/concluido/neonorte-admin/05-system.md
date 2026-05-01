# Spec — Módulo 05: Sistema (Healthcheck & Observabilidade)

> **Fase:** 4 (Observabilidade)  
> **Prioridade:** Média  
> **Estimativa:** 1–2 dias

---

## 1. Problema de Negócio

O operador precisa saber, a qualquer momento, se todos os serviços da plataforma estão funcionando corretamente, quantas sessões estão ativas e qual o consumo de recursos. Isso evita que problemas passem despercebidos antes de afetar os clientes.

## 2. Usuário Final

Operador da Neonorte com role `PLATFORM_ADMIN`.

---

## 3. Critérios de Aceitação (Definition of Done)

### 3.1 Painel de Saúde dos Serviços
- [ ] Card para cada serviço: **Iaçã**, **Kurupira**, **MySQL (db_iaca)**, **MySQL (db_kurupira)**
- [ ] Status visual: 🟢 Online / 🔴 Offline / 🟡 Degradado
- [ ] Latência da última probe em ms (ex: "12ms")
- [ ] Timestamp da última verificação ("Verificado há 30s")
- [ ] Botão "Verificar agora" — executa probe imediata
- [ ] Auto-refresh a cada 60 segundos

### 3.2 Métricas de Uso da Plataforma
- [ ] Total de sessões ativas (contagem da tabela `Session` com `expiresAt > now()`)
- [ ] Top 5 tenants por consumo de API no mês corrente
- [ ] Novos usuários nas últimas 24h
- [ ] Total de projetos ativos no Kurupira

### 3.3 Gestão de Sessões
- [ ] Lista de sessões ativas: **Usuário**, **Tenant**, **Criado em**, **Expira em**, **IP**, **Revogar**
- [ ] Botão "Revogar sessão" por linha → deleta o token via M2M no Iaçã
- [ ] Botão "Revogar todas as sessões do usuário X" → flush de sessões via M2M

### 3.4 Informações de Ambiente
- [ ] Versão do backend Admin (`package.json > version`)
- [ ] Versão do Node.js
- [ ] Uptime do processo
- [ ] Variáveis de ambiente críticas (sem valores, apenas presença: ✅ JWT_SECRET | ❌ SENTRY_DSN)

---

## 4. Fora do Escopo

- Métricas de CPU/RAM do servidor (requer agente externo)
- Alertas automáticos por e-mail/Slack (fase futura)
- Logs de servidor em tempo real (requer WebSocket)

---

## 5. Interfaces de Dados

### Leitura (Prisma Read-Only)
```typescript
// Sessões ativas (db_iaca)
{
  id: string
  userId: string
  expiresAt: Date
  createdAt: Date
  user: { username: string; fullName: string; tenant: { name: string } }
}
```

### Probes HTTP (BFF → Iaçã / Kurupira)
```
GET http://localhost:3001/health  → { status: 'healthy', latency: Xms }
GET http://localhost:3002/health  → { status: 'healthy', latency: Xms }
```

### Probe de Banco (BFF → Prisma)
```javascript
// Testa conexão com query simples
await prismaIaca.$queryRaw`SELECT 1`
await prismaKurupira.$queryRaw`SELECT 1`
```

### Mutações (M2M → Iaçã)
```
DELETE /iaca/admin/sessions/:sessionId     (revogar sessão individual)
DELETE /iaca/admin/users/:userId/sessions  (revogar todas as sessões do user)
```

---

## 6. Rotas Backend (BFF) a Implementar/Verificar

| Método | Rota | Descrição |
|:---|:---|:---|
| `GET` | `/admin/system/health` | Probe de todos os serviços |
| `GET` | `/admin/system/sessions` | Lista sessões ativas |
| `DELETE` | `/admin/system/sessions/:id` | Revoga sessão via M2M |
| `DELETE` | `/admin/system/users/:id/sessions` | Flush de sessões via M2M |
| `GET` | `/admin/system/info` | Versão, uptime, env vars |

---

## 7. Componentes Frontend a Criar

| Arquivo | Descrição |
|:---|:---|
| `src/pages/SystemPage.tsx` | Página principal |
| `src/components/system/ServiceHealthCard.tsx` | Card de saúde de um serviço |
| `src/components/system/SessionsTable.tsx` | Tabela de sessões ativas |
| `src/components/system/EnvInspector.tsx` | Checklist de variáveis de ambiente |
| `src/hooks/useSystemHealth.ts` | Hook com auto-refresh de 60s |

---

## 8. Riscos e Alertas

> [!IMPORTANT]
> O painel de Saúde deve ter timeout de **3 segundos** por probe. Se o serviço não responder em 3s, marcar como "Offline" sem travar a UI. Usar `Promise.allSettled` no BFF para garantir que uma probe lenta não bloqueie as outras.

> [!WARNING]
> Nunca exibir **valores** de variáveis de ambiente no frontend — apenas se estão presentes (`✅`) ou ausentes (`❌`). O endpoint `/admin/system/info` deve sanitizar os valores antes de retornar.

> [!NOTE]
> A funcionalidade de revogar sessões exige que o Iaçã implemente o endpoint de deleção de sessão autenticado por M2M Token. Verificar se já existe antes de implementar o frontend.

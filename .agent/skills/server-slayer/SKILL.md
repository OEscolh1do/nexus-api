---
name: server-slayer
description: Monitora e termina processos órfãos em portas locais (localhost) para evitar conflitos de porta durante execução de testes, restarts de servidor ou deploys locais.
---

# Skill: Server Slayer

## Gatilho Semântico

Ativado quando o agente detecta erros como `EADDRINUSE`, "port already in use", "address already in use", ou quando o desenvolvedor pede "mate o processo na porta X", "limpe as portas", "reinicie o servidor".

## Scripts de Diagnóstico e Ação

### Windows (PowerShell)

```powershell
# Listar todos os processos ocupando portas ativas
netstat -ano | findstr LISTENING

# Encontrar o processo ocupando uma porta específica (ex: 3001)
netstat -ano | findstr :3001

# Terminar o processo pelo PID encontrado (ex: PID 12345)
taskkill /PID 12345 /F

# One-liner: matar tudo que está na porta especificada
$port = 3001
$pids = (netstat -ano | findstr ":$port") -split '\s+' | Where-Object { $_ -match '^\d+$' } | Select-Object -Last 1
if ($pids) { taskkill /F /PID $pids }
```

### Portas Padrão do Ecossistema Neonorte

| Serviço | Porta |
|---|---|
| Nexus Hub (Vite) | 5173 |
| Nexus ERP (Vite) | 5174 |
| Nexus API (Express) | 3001 |
| Lumi (futuro) | 5175 |

## Protocolo de Conflito de Porta

1. **Diagnóstico**: Identifique qual processo está na porta conflitante.
2. **Classificação**: O processo é do ecossistema Neonorte (reiniciar) ou externo (avaliar antes de matar)?
3. **Ação**: Mate apenas o processo correto — nunca com `taskkill /F /IM node.exe` sem verificar qual instância.
4. **Verificação**: Rode o servidor novamente e confirme que subiu sem erros.
5. **Prevenção**: Se o conflito for recorrente, verifique se há processos `npm run dev` zumbis não encerrados corretamente.

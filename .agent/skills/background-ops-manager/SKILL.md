---
name: background-ops-manager
description: Especialista em orquestração de tarefas agendadas (Cron) e processamento em segundo plano do ecossistema Ywara.
---

# Skill: Background Ops Manager

## Gatilho Semântico
Ativado quando o desenvolvedor mencionar: "agendar tarefa", "executar de madrugada", "cron job", "node-cron", "falha no job", "tarefa pesada em background", ou quando houver erros de concorrência em jobs.

## Protocolo

### 1. Registro de Job
- **Localização**: Sempre registrar novos jobs em `sumauma/backend/src/lib/cronJobs.js`.
- **Frequência**: Usar sintaxe padrão cron. Preferir horários de baixo tráfego (00h00 - 05h00) para tarefas pesadas.
- **Service Pattern**: Nunca implementar lógica de negócio dentro do arquivo de cron. O job deve apenas chamar uma função de um Service.

### 2. Governança de Execução
- **Logging**: Todo início e fim de job DEVE ser logado via `logger.js`.
- **Error Handling**: Envolver a chamada do service em um `try/catch` robusto para não derrubar o processo principal do Node.
- **Monitoring**: Se o job falhar, deve haver um log de nível `error` com o contexto detalhado.

### 3. Distributed Locking (Escalabilidade)
- **Cenário**: Se o Ywara rodar em múltiplos containers, o job pode rodar em duplicidade.
- **Mecanismo**: Usar o modelo `CronLock` no banco de dados para garantir exclusividade mútua (Mutex).
- **Check**: Antes de iniciar, tentar dar um "upsert" no lock. Se já estiver travado e não expirado, abortar a execução atual.

## Guardrails
- **No Long-Running Blocks**: Tarefas que levam mais de 5 minutos devem ser quebradas em micro-tarefas ou usar um sistema de fila (BullMQ) se a complexidade aumentar.
- **Resource Aware**: Evitar rodar múltiplos jobs pesados no mesmo horário para não saturar o DB ou a CPU da VPS.
- **Database Connection**: Sempre verificar se a instância do Prisma está ativa antes de iniciar tarefas críticas de madrugada.

## Referências
- Arquivo Central: `sumauma/backend/src/lib/cronJobs.js`
- Biblioteca: `node-cron`
- Modelo de Trava: `prisma.cronLock`

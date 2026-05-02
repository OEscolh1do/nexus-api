# SPEC-002: Otimização de Infraestrutura para VPS 2GB

## 1. O Quê (Especificação)

### Problema
A arquitetura atual do Ywara, com Logto Self-Hosted e dois bancos de dados (MySQL + Postgres), exige cerca de 7.5GB de RAM (limites nominais) ou ~1.5GB em repouso absoluto. Isso impede o início da operação em servidores de baixo custo (VPS de 1GB ou 2GB).

### Objetivo
Otimizar a infraestrutura para permitir a operação estável de todo o ecossistema (Iaçã, Kurupira e Sumaúma) em uma VPS de **2GB de RAM**, mantendo 20 usuários simultâneos com folga de segurança.

### Critérios de Aceitação
- Remoção total dos containers de autenticação local (`logto` e `logto-db`).
- Migração bem-sucedida para o **Logto Cloud**.
- Ajuste dos limites de memória do Docker para caber em 2GB (considerando overhead do OS).
- Otimização do MySQL para baixo consumo.

### Exclusões
- Não haverá alteração na lógica de negócio dos backends.
- Não haverá migração de banco de dados para serviços gerenciados (RDS/Supabase) neste estágio.

---

## 2. O Como (Arquitetura e Plano)

### Mudanças na Topologia Docker
A topologia será reduzida de 7 para 5 containers principais:
1. `api-gateway` (Nginx)
2. `iaca-backend` (ERP)
3. `kurupira-backend` (Engenharia)
4. `neonorte-admin-backend` (Sumaúma BFF)
5. `nexus-db` (MySQL)

### Configurações de Memória (Target 2GB)
Para garantir estabilidade, os novos limites no `docker-compose.yml` serão:
- **MySQL:** 512MB (Limit) / 256MB (Reserved)
- **Kurupira:** 512MB (Limit) - *Ajuste crítico, monitorar performance de simulação.*
- **Iaçã:** 256MB (Limit)
- **Sumaúma:** 256MB (Limit)
- **Nginx:** 64MB
- **Total:** ~1.6GB (Deixando ~400MB para o Sistema Operacional).

---

## 3. Tarefas de Implementação

### [ ] Fase 1: Logto Cloud Setup
- [ ] Criar Tenant no Logto Cloud.
- [ ] Registrar as Aplicações (Sumaúma Frontend) e Resources (API Identifiers).
- [ ] Gerar novas `M2M_CLIENT_ID` e `CLIENT_SECRET` para o BFF.

### [ ] Fase 2: Refatoração do Docker
- [ ] Modificar `docker-compose.yml` para remover serviços `logto` e `logto-db`.
- [ ] Atualizar as variáveis de ambiente (`LOGTO_ENDPOINT`, `LOGTO_JWKS_URI`) em todos os serviços.
- [ ] Implementar os novos limites de recursos (`deploy.resources.limits.memory`).

### [ ] Fase 3: Tuning do MySQL
- [ ] Criar/Ajustar `infra/mysql/my.cnf` para limitar o uso de memória:
  - `innodb_buffer_pool_size = 256M`
  - `max_connections = 50`

---

## 4. Análise de Riscos e Verificação (CoVe)

### Riscos Mapeados
1. **Performance do Kurupira:** Ao limitar para 512MB, simulações complexas podem ficar lentas ou sofrer swap. 
   - *Mitigação:* Configurar 4GB de arquivo Swap na VPS.
2. **Conectividade Externa:** Os containers agora dependem de internet para validar tokens no Logto Cloud.
   - *Mitigação:* Garantir que a VPS tenha DNS configurado corretamente.

### Perguntas de Verificação (Chain-of-Verification)
- [x] O Kurupira realmente funciona com 512MB? *Sim, para o volume de 20 usuários, o processamento é mais CPU-bound do que RAM-bound (JS heap).*
- [x] O Sumaúma Backend já suporta Logto Cloud? *Sim, a biblioteca `jwks-rsa` usada no código é agnóstica ao host, desde que o endpoint seja HTTPS.*
- [x] O Logto Cloud exige mudanças no código do Frontend? *Apenas a atualização do `appId` e `endpoint` no `LogtoConfig`.*

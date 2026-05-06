---
name: vps-debug
description: Diagnóstico e resolução de falhas no VPS Ywara em produção. Cobre erros 502/504, containers crashados, falhas de SSL, esgotamento de memória, problemas de conexão MySQL e indisponibilidade de endpoints. Ativado quando o usuário relata "o site caiu", "502 Bad Gateway", "container reiniciando", "erro de conexão com o banco", "API não responde" ou qualquer sintoma de falha em produção.
---

# Skill: VPS Debug — Diagnóstico de Falhas Ywara

## Identificação Rápida do Problema

```bash
ssh neonorte@vps66668.publiccloud.com.br

# Triagem em 30 segundos
docker compose -f /srv/ywara/docker-compose.production.yml ps   # containers rodando?
sudo systemctl status nginx                                       # nginx de pé?
free -h                                                           # memória disponível?
df -h                                                             # disco livre?
```

---

## Diagnóstico por Sintoma

### 502 Bad Gateway

O Nginx está de pé, mas o backend não está respondendo na porta esperada.

```bash
# 1. Verificar se o container está rodando
docker ps | grep neonorte_kurupira   # API kurupira
docker ps | grep neonorte_admin      # API sumauma

# 2. Ver logs do container problemático
docker logs neonorte_kurupira --tail 50
docker logs neonorte_admin --tail 50

# 3. Checar se a porta está de fato ouvindo
ss -tlnp | grep 3002   # kurupira
ss -tlnp | grep 3003   # sumauma

# 4. Testar diretamente sem o Nginx
curl -v http://127.0.0.1:3002/api/health
curl -v http://127.0.0.1:3003/admin/health

# 5. Ver logs do Nginx para detalhes do erro
sudo tail -50 /var/log/nginx/error.log
```

**Resolução mais comum:** Container crashado → `docker compose -f /srv/ywara/docker-compose.production.yml up -d`

---

### Container em Loop de Restart (Restarting)

```bash
# Identificar o container problemático
docker ps -a | grep Restarting

# Ver os últimos logs antes do crash
docker logs <nome-container> --tail 100

# Causas comuns e investigação:
# 1. Erro de variável de ambiente ausente
docker logs neonorte_kurupira 2>&1 | grep -i "env\|undefined\|cannot read\|missing"

# 2. Falha de conexão com MySQL (MySQL pode não ter iniciado ainda)
docker logs neonorte_kurupira 2>&1 | grep -i "mysql\|ECONNREFUSED\|connect"

# 3. Erro de porta já em uso
docker logs neonorte_kurupira 2>&1 | grep -i "EADDRINUSE\|already in use"

# Se for ordem de inicialização (MySQL não estava pronto):
cd /srv/ywara
docker compose -f docker-compose.production.yml restart
```

---

### Falha de SSL / Certificado Expirado

```bash
# Verificar validade
sudo certbot certificates

# Testar certificado ativo no domínio
echo | openssl s_client -servername kurupira.neonorte-ywara.tech \
  -connect kurupira.neonorte-ywara.tech:443 2>/dev/null \
  | openssl x509 -noout -dates

# Verificar se o Crontab do Certbot está configurado
sudo crontab -l | grep certbot
systemctl list-timers | grep certbot

# Renovar manualmente
sudo certbot renew --dry-run   # simulação primeiro
sudo certbot renew             # renovação real

# Se Nginx bloquear a renovação, parar temporariamente
sudo systemctl stop nginx
sudo certbot renew
sudo systemctl start nginx
```

---

### Esgotamento de Memória (OOM / Swap)

```bash
# Ver uso atual de memória
free -h
vmstat -s | head -10

# Ver qual processo está consumindo mais
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}"

# Ver limite dos containers
docker inspect neonorte_kurupira | grep -i memory
docker inspect neonorte_admin | grep -i memory
docker inspect neonorte_db | grep -i memory

# Ver se houve OOM Kill no kernel
dmesg | grep -i "oom\|killed" | tail -20

# Verificar se há memory leak (comparar uso ao longo do tempo)
watch -n 5 "docker stats --no-stream"
```

**Limites de memória esperados:**
- `neonorte_db`: 512 MB
- `neonorte_kurupira`: 512 MB
- `neonorte_admin`: 384 MB

---

### Falha de Conexão com MySQL

```bash
# Verificar se o container MySQL está rodando
docker ps | grep neonorte_db

# Ver logs do MySQL
docker logs neonorte_db --tail 50

# Testar conexão do host para o container
docker exec neonorte_db mysqladmin -u root -p ping

# Verificar se os backends conseguem conectar
docker exec neonorte_kurupira sh -c "nc -zv neonorte_db 3306"

# Checar número de conexões abertas
docker exec neonorte_db mysql -u root -p -e "SHOW STATUS LIKE 'Threads_connected';"

# Ver queries travadas / long queries
docker exec -it neonorte_db mysql -u root -p -e "SHOW PROCESSLIST;"

# Se o MySQL não inicializar (volume corrompido — CUIDADO):
docker logs neonorte_db 2>&1 | grep -i "error\|crash\|innodb"
```

---

### Site Inacessível (DNS / Nginx)

```bash
# 1. Checar se o Nginx está ativo
sudo systemctl status nginx

# 2. Validar configuração do Nginx
sudo nginx -t

# 3. Ver erros recentes do Nginx
sudo tail -50 /var/log/nginx/error.log

# 4. Verificar se o symlink está correto
ls -la /etc/nginx/sites-enabled/ywara

# 5. Confirmar que a config aponta para os lugares certos
cat /etc/nginx/sites-available/ywara | grep -E "root|proxy_pass|server_name"

# 6. Testar resolução DNS do servidor
dig kurupira.neonorte-ywara.tech
nslookup admin.neonorte-ywara.tech

# 7. Checar firewall
sudo ufw status verbose
```

---

### Disco Cheio

```bash
# Ver uso geral
df -h

# Encontrar os maiores ocupantes
du -sh /var/lib/docker/*
du -sh /srv/ywara
sudo find /var/log -type f -name "*.log" -size +100M

# Limpar imagens Docker órfãs (seguro)
docker image prune -f

# Limpar logs de containers antigos (CUIDADO — perde histórico)
docker container prune -f

# Rotacionar logs do Nginx se necessário
sudo logrotate -f /etc/logrotate.d/nginx
```

---

## Protocolo de Escalação

| Severidade | Sintoma | Ação Imediata |
|:---|:---|:---|
| 🔴 **Crítico** | Ambos os sites inacessíveis | Checar Nginx → containers → disco → OOM |
| 🟠 **Alto** | Um site inacessível | Checar container específico → logs → restart |
| 🟡 **Médio** | Lentidão / erros intermitentes | `docker stats` → logs → MySQL processlist |
| 🟢 **Baixo** | Erro em funcionalidade específica | Logs do backend específico |

**Emergência sem SSH:** Usar **Console Web da Locaweb** → painel VPS → `vps66668` → Console.

---

## Teste de Sanidade Pós-Correção

```bash
# Confirmar containers saudáveis
docker compose -f /srv/ywara/docker-compose.production.yml ps

# Testar endpoints diretamente
curl -s -o /dev/null -w "%{http_code}" https://kurupira.neonorte-ywara.tech
curl -s -o /dev/null -w "%{http_code}" https://admin.neonorte-ywara.tech

# Ver últimas linhas de log sem erros
docker logs neonorte_kurupira --tail 20 2>&1 | grep -v "info\|debug"
docker logs neonorte_admin --tail 20 2>&1 | grep -v "info\|debug"
```

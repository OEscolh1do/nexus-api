---
name: vps-ops
description: Operação diária e monitoramento do VPS Ywara em produção. Cobre health check de containers e Nginx, leitura de logs em tempo real, reinicialização de serviços, acesso interativo ao MySQL e gestão de SSL. Ativado quando o usuário pede "verificar o servidor", "status dos containers", "como está a produção", "logs do backend", "reiniciar serviço" ou menciona problemas de disponibilidade.
---

# Skill: VPS Ops — Operação Diária Ywara

## Identidade do Servidor

| Atributo | Valor |
|:---|:---|
| **SSH** | `ssh neonorte@vps66668.publiccloud.com.br` |
| **SO** | Debian 13 Trixie — Kernel 6.12.85+deb13-amd64 |
| **RAM** | 2 GB total |
| **Raiz** | `/srv/ywara` |

| Container | Porta | Memória Máx |
|:---|:---|:---|
| `neonorte_kurupira` | `127.0.0.1:3002` | 512 MB |
| `neonorte_admin` | `127.0.0.1:3003` | 384 MB |
| `neonorte_db` | Rede interna | 512 MB |

---

## Health Check Completo

```bash
ssh neonorte@vps66668.publiccloud.com.br

# 1. Status de todos os containers
docker compose -f /srv/ywara/docker-compose.production.yml ps

# 2. Uso de recursos (CPU/Memória por container)
docker stats --no-stream

# 3. Status do Nginx
sudo systemctl status nginx

# 4. Verificar conectividade HTTPS externamente
curl -I https://kurupira.neonorte-ywara.tech
curl -I https://admin.neonorte-ywara.tech

# 5. Uso de disco
df -h

# 6. Uso de RAM
free -h
```

---

## Logs em Tempo Real

```bash
# Kurupira API (Backend principal — porta 3002)
docker logs neonorte_kurupira -f --tail 50

# Sumaúma Admin (Backend admin — porta 3003)
docker logs neonorte_admin -f --tail 50

# MySQL
docker logs neonorte_db -f --tail 20

# Nginx (erros de proxy, SSL, 502)
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Logs do Nginx filtrados por erros
sudo tail -f /var/log/nginx/error.log | grep -E "error|crit|alert|emerg"
```

---

## Reinicialização de Serviços

```bash
# Reiniciar UM serviço específico (sem downtime dos outros)
cd /srv/ywara
docker compose -f docker-compose.production.yml restart kurupira-backend
docker compose -f docker-compose.production.yml restart sumauma-backend

# Reiniciar TODOS os containers
cd /srv/ywara
docker compose -f docker-compose.production.yml restart

# Reiniciar Nginx (sem rebuild)
sudo systemctl restart nginx

# Parar todos os containers (manutenção)
cd /srv/ywara
docker compose -f docker-compose.production.yml down

# Subir todos os containers
cd /srv/ywara
docker compose -f docker-compose.production.yml up -d
```

---

## MySQL — Acesso Interativo

```bash
# Entrar no container MySQL como root
docker exec -it neonorte_db mysql -u root -p
# Senha: MYSQL_ROOT_PASSWORD (definida em /srv/ywara/.env)

# Comandos úteis dentro do MySQL
SHOW DATABASES;
USE db_kurupira;
SHOW TABLES;
SHOW PROCESSLIST;          -- Ver queries ativas
SELECT * FROM information_schema.INNODB_TRX; -- Ver transações abertas

# Sair
EXIT;

# Executar query pontual sem entrar no shell
docker exec neonorte_db mysql -u root -p<senha> -e "SHOW DATABASES;"
```

---

## SSL — Certificados Let's Encrypt

| Atributo | Valor |
|:---|:---|
| **Cobertura** | `neonorte-ywara.tech`, `kurupira.*`, `admin.*` |
| **Validade** | Até **2026-08-03** |
| **Renovação** | Automática via Crontab do Certbot |

```bash
# Verificar status do certificado
sudo certbot certificates

# Renovar manualmente (se a renovação automática falhou)
sudo certbot renew

# Verificar validade via OpenSSL
echo | openssl s_client -servername kurupira.neonorte-ywara.tech \
  -connect kurupira.neonorte-ywara.tech:443 2>/dev/null \
  | openssl x509 -noout -dates

# Reinstalar certificado após mudança de config Nginx
sudo certbot install --cert-name neonorte-ywara.tech
```

---

## Nginx — Operações

```bash
# Validar configuração sem reiniciar (SEMPRE fazer antes de reiniciar)
sudo nginx -t

# Ver configuração ativa
cat /etc/nginx/sites-available/ywara

# Recarregar sem downtime (só config — sem rebuild de binário)
sudo nginx -s reload

# Reiniciar completamente
sudo systemctl restart nginx

# Config de proxy reverso (fonte da verdade)
cat /srv/ywara/infra/nginx/vps.conf
```

**Arquitetura de proxy:**
```
HTTPS :443 → Nginx (Host)
  kurupira.neonorte-ywara.tech
    /      → /srv/ywara/kurupira/frontend/dist  (estático)
    /api   → http://127.0.0.1:3002              (proxy Kurupira)
  admin.neonorte-ywara.tech
    /      → /srv/ywara/sumauma/frontend/dist   (estático)
    /admin → http://127.0.0.1:3003              (proxy Sumaúma)
```

---

## Firewall UFW

```bash
# Ver regras ativas
sudo ufw status verbose

# Regras esperadas: apenas 22 (SSH), 80 (HTTP), 443 (HTTPS)
# NÃO abrir portas 3002/3003 — backends ficam em 127.0.0.1
```

---

## Volumes Docker

```bash
# Listar volumes (nexus_mysql_data deve aparecer)
docker volume ls

# Inspecionar o volume MySQL
docker volume inspect nexus_mysql_data

# Ver espaço ocupado pelo volume
docker system df -v
```

---

## Limpeza de Recursos

```bash
# Remover imagens Docker não utilizadas (liberar disco)
docker image prune -f

# Remover containers parados
docker container prune -f

# Ver uso total do Docker
docker system df
```

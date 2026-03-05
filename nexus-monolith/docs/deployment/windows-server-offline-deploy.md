# Guia de Deploy Offline em Windows Server

> **Cenário:** O servidor de produção Windows Server 2022 possui restrições severas de performance de disco/CPU ou conectividade, impedindo o `docker-compose build` direto.

## Estratégia

Utilizamos o **Docker Save/Load** para compilar as imagens na máquina de desenvolvimento e transferi-las como artefatos estáticos.

## Passo a Passo

### 1. Preparação Local (Máquina Dev)

Certifique-se de que o Docker Desktop está rodando.

```powershell
# 1. Compilar a imagem de produção localmente
docker build -t nexus-monolith-app:latest -f Dockerfile .

# 2. Salvar a imagem em um arquivo .tar
docker save -o nexus-app.tar nexus-monolith-app:latest
```

### 2. Transferência

Envie os arquivos para o servidor (via SCP, RDP ou SMB):

- `nexus-app.tar`
- `docker-compose.prod.yml`
- `.env.production`

### 3. Execução no Servidor

No Windows Server, abra o PowerShell no diretório de destino:

```powershell
# 1. Carregar a imagem no Docker do servidor
docker load -i nexus-app.tar

# 2. Subir o ambiente (usando a imagem carregada, sem build)
docker compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

- **Erro de Memória:** Se o `docker load` falhar, verifique se há espaço em disco suficiente.
- **Portas:** Garanta que a porta 3000 (Frontend) e 4000 (Backend) estão liberadas no Firewall do Windows.

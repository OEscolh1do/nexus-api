---
description: How to deploy and update the application backend on Fly.io and frontend on Cloudflare Pages
---

# Atualização de Deployments: Fly.io & Cloudflare Pages

## Quando Usar
- Para enviar novas funcionalidades, reparos ou correções do **Backend (Node.js)** para a produção no Fly.io.
- Para orientar a atualização do **Frontend (React)** na Cloudflare Pages.
- Após alterar as Variáveis de Ambiente.

## Visão Geral da Arquitetura de Deploy
| Componente | Plataforma | Tipo de Deploy | Trigger |
|:---|:---|:---|:---|
| Backend | Fly.io (GRU) | Manual / CLI | `fly deploy` na pasta `backend` |
| Frontend | Cloudflare Pages | CI/CD Contínuo | `git push` na branch `main` |

---

## 1. Atualizando o Backend (Fly.io)

Diferente do Frontend, o Backend requer um gatilho intencional por linha de comando. Isso protege contra quedas acidentais do serviço.

**Passo a passo a ser executado pelo Agente ou Humano:**
1. Navegue até a pasta correta: `cd backend`
2. Dispare a subida da nova imagem Docker:
```bash
// turbo
fly deploy
```

**Regras de Segurança (Checklist Prévio):**
- **Novas Variáveis:** Se o código novo depender de chaves de API extras no `.env`, você DEVE enviar o secret antes do deploy com: `fly secrets set NOME_DA_CHAVE="valor"`.
- **Mudanças no Banco:** O Fly.io vai levantar as instâncias Node.js. O banco oficial continua alocado isoladamente no Supabase. Modificações de `schema.prisma` devem ser sincronizadas globalmente via `npx prisma db push` antes ou imediatamente durante a janela de implantação.

---

## 2. Atualizando o Frontend (Cloudflare Pages)

O deploy do Frontend é **100% automatizado** e amarrado à branch principal do seu repositório no GitHub.

**Passo a passo:**
1. Todo o código react que for comitado e empurrado para o GitHub dispara a compilação:
```bash
git add .
git commit -m "feat: atualizacoes do frontend para modulo X"
git push
```
2. Após o `git push`, a robôticada da Cloudflare fará o checkout no diretório `nexus-monolith/frontend`, executará o `npm run build` e substituirá o pacote na CDN Global. O processo leva em média 2 minutos.

**Regras Especiais (Variáveis de Ambiente):**
Diferente do Backend, não podemos usar ferramentas de terminal para alterar as Variáveis do Frontend de produção. Se adicionar algo como `VITE_GOOGLE_MAPS_KEY`, isso deve ser inserido manualmente na interface Web:
- Acesse *Dash Cloudflare > Workers & Pages > neonorte-nexus-frontend > Settings > Environment variables*.

---

## 3. Gestão de Crises e Rollbacks (Se o deploy der errado)

A internet não perdoa e código quebrado acontece. 

**Rollback no Backend (Fly.io):**
Se o `fly deploy` estragar a API e os usuários começarem a reportar Status 500:
1. Verifique as versões recentes: `fly releases`
2. Volte imediatamente para o relé anterior, ou melhor, acesse o painel web (dash.fly.io) e reverta com 1 clique.
3. Para puxar os logs do servidor pós-queda e descobrir por que quebrou: `fly logs`

**Rollback no Frontend (Cloudflare):**
Se a interface ficar em branco no navegador do cliente:
1. Vá para o Painel Cloudflare > Workers & Pages > `neonorte-nexus-frontend` > Aba **Deployments**.
2. Identifique o deploy anterior (que possuía a marca verde de sucesso).
3. Clique nos três pontinhos e selecione **"Retry deployment"** ou restaure a versão para produção imediatamente para salvar a pele da empresa.

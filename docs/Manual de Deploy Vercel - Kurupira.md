# Manual de Deploy - Kurupira Frontend (Vercel)

Este guia detalha os passos necessários para realizar o deploy do frontend do **Kurupira** na plataforma Vercel. Como o projeto está estruturado em uma arquitetura monorepo (múltiplas pastas no mesmo repositório git), algumas configurações específicas de diretório raiz são obrigatórias.

---

## 🏗️ Estrutura do Repositório

O repositório do GitHub raiz contém todo o ecossistema (Iaçã + Kurupira + Backends). O diretório específico que precisa ser buildado e servido pela Vercel é:

```
Neonorte/ (Raiz do Git)
└── kurupira/
    └── frontend/  <-- Root Directory para a Vercel
        ├── package.json
        ├── vite.config.ts
        └── src/
```

---

## MÉTODOS DE DEPLOY

Existem duas formas principais de fazer o deploy: via Painel da Vercel (Recomendado, pois ativa o CI/CD contínuo via GitHub) ou via Vercel CLI (Direto do seu terminal local).

### Método A: Deploy Automático via Vercel Dashboard (Recomendado)

Esta é a abordagem ideal para produção. A cada `git push` para a branch `main`, a Vercel compila e lança a nova versão automaticamente.

1. Acesse o [Vercel Dashboard](https://vercel.com/dashboard) e clique em **"Add New..." > "Project"**.
2. Na seção "Import Git Repository", conecte-se ao seu GitHub e importe o repositório `nexus-api` (ou o nome do seu repositório atual).
3. **MUITO IMPORTANTE - Configuração do Projeto:**
   Na tela *Configure Project*, preencha os dados exatamente assim:
   
   - **Project Name:** `neonorte-kurupira` (ou outro da sua escolha)
   - **Framework Preset:** Selecione `Vite`
   - **Root Directory:** Clique no botão `Edit` e selecione a pasta `kurupira/frontend` (Não deixe na raiz!).

4. **Build and Output Settings:** (A Vercel geralmente preenche automático se detectar o Vite)
   - Build Command: `npm run build` (ou utilize o padrão)
   - Output Directory: `dist`
   - Install Command: `npm install` (ou utilize o padrão)

5. **Variáveis de Ambiente (Environment Variables):**
   - Se o Frontend do Kurupira precisar falar com o backend de produção, adicione a URL base aqui. ex:
     - `VITE_API_URL` = `https://sua-api-kurupira-backend.com/api/v1`

6. Clique em **Deploy**. A Vercel vai baixar o código, rodar o `npm install`, em seguida `npm run build` e publicar o site.

---

### Método B: Deploy Manual via Vercel CLI

Se preferir enviar o build diretamente da sua máquina sem envolver a branch principal do GitHub.

1. Abra o terminal na raiz do frontend do Kurupira:
   ```bash
   cd kurupira/frontend
   ```

2. Certifique-se de que não há erros de tipagem locais rodando o build de teste localmente:
   ```bash
   npx tsc --noEmit
   npm run build
   ```

3. Instale a CLI globalmente (se não tiver) e faça login:
   ```bash
   npm i -g vercel
   vercel login
   ```

4. Faça o link do projeto e o Deploy para produção `--prod`:
   ```bash
   npx vercel --prod
   ```
   *A CLI fará algumas perguntas na primeira vez. Confirme que o diretório atual `.` é o diretório raiz e prossiga.*

---

## 🚨 Troubleshooting (Problemas Comuns)

### 1. Erros de Tipagem que quebram o Build (`tsc failed`)
O comando `npm run build` do Vite executa a verificação de tipos do TypeScript (`tsc -b`) antes da compilação.
Se a Vercel falhar com o erro:
> `Error: Command "tsc -b && vite build" exited with 2`
**Causa:** Existem erros de tipagem no seu código que rodavam localmente no ambiente de desenvolvimento (`npm run dev` ignora tipagem dependendo da configuração), mas o CI/CD da Vercel bloqueia código com alertas críticos estruturais.
**Solução:** Rode `npx tsc --noEmit` localmente na pasta `kurupira/frontend`, resolva os erros no VS Code e faça commit/push para o GitHub.

### 2. Rotas 404 ao atualizar a página (React Router)
Aplicações Single Page (SPA) usam roteamento client-side. Ao dar F5 em uma rota como `/engineering`, o servidor web nativo da Vercel tenta buscar o arquivo físico `engineering/index.html` e não encontra.
A Vercel corrige isso automaticamente se detectou que é um App Vite, mas se o problema ocorrer, crie um arquivo chamado `vercel.json` na raiz da pasta `kurupira/frontend` com o seguinte conteúdo:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 3. Deploy de pastas erradas (Monorepo issues)
Se a Vercel reclamar que não achou o `package.json`, certifique-se absoluta de que configurou o **Root Directory** no painel (Método A) para `kurupira/frontend`. Sem isso, ela tentará compilar a raiz da infraestrutura Docker inteira e falhará miseravelmente.

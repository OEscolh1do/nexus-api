# Lumi - Deployment Guide

> **Guia de Instalação e Deploy**  
> **Versão**: 1.0.0  
> **Data**: 2026-01-28

---

## 📋 Índice

1. [Requisitos de Sistema](#requisitos-de-sistema)
2. [Ambiente de Desenvolvimento](#ambiente-de-desenvolvimento)
3. [Build de Produção](#build-de-produção)
4. [Deployment (Vercel/Netlify)](#deployment-vercelnetlify)
5. [Fluxo de CI/CD (GitHub Actions)](#fluxo-de-cicd-github-actions)
6. [Variáveis de Ambiente](#variáveis-de-ambiente)

---

## 💻 Requisitos de Sistema

- **Node.js**: v18.0.0 ou superior (LTS recomendado)
- **npm**: v9.0.0 ou superior

---

## 🛠️ Ambiente de Desenvolvimento

Para rodar o projeto localmente:

```bash
# 1. Clone o repositório
git clone https://github.com/neonorte/lumi.git
cd lumi

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente (Crie .env.local)
cp .env.example .env.local
# Edite .env.local com suas chaves (ex: Google GenAI)

# 4. Inicie o servidor dev
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

---

## 📦 Build de Produção

Para gerar os arquivos estáticos para produção:

```bash
# 1. Execute o build
npm run build

# 2. Preview do build (opcional, para teste local)
npm run preview
```

**Output**: Os arquivos serão gerados na pasta `dist/`.

---

## 🚀 Deployment (Vercel/Netlify)

O Lumi é uma SPA (Single Page Application) construída com Vite, sendo facilmente hospedada em provedores estáticos.

### Vercel (Recomendado)

1. Instale a Vercel CLI: `npm i -g vercel`
2. Execute o deploy:
   ```bash
   vercel
   ```
3. Siga as instruções no terminal.
4. **Configurações de Build**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Netlify

1. Arraste a pasta `dist` para o Netlify Drop ou conecte ao Git.
2. **Build Settings**:
   - **Base directory**: `/`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

---

## 🔄 Fluxo de CI/CD (GitHub Actions)

O projeto possui um **Quality Gate** configurado (`.github/workflows/ci.yml`) que protege a branch principal.

### 1. O Pipeline "Antigravity"

A cada `push` ou `pull request` para a `main`, o GitHub Actions executa automaticamente:

1.  **Type Check**: Garante que não há erros de TypeScript.
2.  **Tests**: Executa a suíte de testes unitários (Vitest).
3.  **Build**: Verifica se o build de produção é gerado com sucesso.

> **Nota**: Se qualquer etapa falhar, o deploy **não deve** ser realizado (e o Vercel bloqueará se configurado corretamente).

### 2. Conectando Vercel ao GitHub

Para configurar o _Continuous Deployment_ (CD) automático:

1.  Acesse o [Dashboard da Vercel](https://vercel.com/dashboard).
2.  Clique em **"Add New..."** > **Project**.
3.  Selecione **"Import Git Repository"**.
4.  Escolha o repositório `lumi`.
5.  A Vercel detectará automaticamente o Vite.
6.  **IMPORTANTE**: Nas configurações do projeto na Vercel (Settings > Git), ative:
    - **"Ignored Build Step"**: Opcional, se quiser economizar builds em commits de documentação.
    - O Vercel fará o deploy automaticamente **apenas se** o commit entrar na branch principal.

---

## 🔑 Variáveis de Ambiente

| Variável           | Descrição                                          | Obrigatório? |
| ------------------ | -------------------------------------------------- | ------------ |
| `VITE_API_KEY`     | Chave de API (Google GenAI) para fallback de clima | ✅ Sim       |
| `VITE_APP_VERSION` | Versão da aplicação (ex: 3.0.1)                    | ❌ Não       |
| `VITE_ENV`         | Ambassador (dev/prod)                              | ❌ Não       |

---

**Nota**: Certifique-se de configurar as variáveis de ambiente no painel do seu provedor de hospedagem (Project Settings > Environment Variables).

---

**Autor**: Neonorte Tecnologia  
**Versão**: 1.0.0  
**Última Atualização**: 2026-02-02

# 🚀 GUIA COMPLETO: Setup Piloto NEXUS - Do Zero ao Online

> **Última Atualização:** 2026-01-15
> **Arquiteto:** Tecnologia Neonorte
> **Versão:** Piloto 1.1 (MySQL)

**Objetivo:** Sistema online em 1 hora  
**Custo:** $0 (tudo gratuito)

---

## PARTE 1: Configurar Banco de Dados (Neon.tech)

### Passo 1.1: Criar Conta Neon.tech (3 minutos)

1. Acesse: https://neon.tech
2. Clique em **"Sign Up"**
3. Escolha **"Continue with GitHub"** (mais rápido)
4. Autorize a conexão

### Passo 1.2: Criar Database (2 minutos)

1. Após login, clique em **"Create Project"**
2. Configurações:
   - **Project Name:** `neonorte-piloto`
   - **Database Name:** `neonorte`
   - **Region:** `US East (Ohio)` (mais próximo BR)
   - **Postgres Version:** 15 (padrão)
3. Clique **"Create Project"**

### Passo 1.3: Copiar Connection String (1 minuto)

1. Na página do projeto, você verá:
   ```
   Connection String
   postgresql://neonorte_owner:XXX@ep-XXX.us-east-2.aws.neon.tech/neonorte?sslmode=require
   ```
2. Clique em **"Copy"** (ícone de copiar)
3. **IMPORTANTE:** Guarde essa string! Vamos usar em 3 lugares

---

## PARTE 2: Configurar Projeto Local e Migrations

### Passo 2.1: Atualizar .env (2 minutos)

No seu computador:

```bash
# Abra o arquivo backend/.env no VS Code
code backend/.env
```

Cole isso (substitua `XXX` pela sua connection string):

```env
DATABASE_URL="postgresql://neonorte_owner:XXX@ep-XXX.us-east-2.aws.neon.tech/neonorte?sslmode=require"
JWT_SECRET="piloto_neonorte_2026_secret"
NODE_ENV=development
PORT=3001
```

Salve e feche.

### Passo 2.2: Rodar Migrations (3 minutos)

```bash
cd backend

# Instalar dependências (se ainda não fez)
npm install

# Gerar Prisma Client
npx prisma generate

# Aplicar migrations no banco Neon
npx prisma migrate deploy
```

**Saída esperada:**

```
✔ Migrations applied successfully.
```

### Passo 2.3: (Opcional) Verificar Dados

```bash
# Abrir Prisma Studio (interface visual do banco)
npx prisma studio
```

Abre no navegador: http://localhost:5555

---

## PARTE 3: Deploy do Backend (Render.com)

### Passo 3.1: Preparar Repositório Git (5 minutos)

```bash
# Na raiz do projeto
git init
git add .
git commit -m "feat: setup inicial para deploy"

# Criar repo no GitHub
# Opção 1: Via GitHub Desktop (mais fácil)
# Opção 2: Via linha de comando (veja abaixo)
```

**Via GitHub.com:**

1. Acesse https://github.com/new
2. Nome: `neonorte-nexus`
3. Private
4. Crie!
5. Copie comandos e execute:
   ```bash
   git remote add origin https://github.com/SEU_USER/neonorte-nexus.git
   git branch -M main
   git push -u origin main
   ```

### Passo 3.2: Criar Conta Render (2 minutos)

1. Acesse: https://render.com
2. Clique **"Get Started"**
3. Escolha **"Sign up with GitHub"**
4. Autorize Render a acessar seus repositórios

### Passo 3.3: Deploy do Backend (5 minutos)

1. No dashboard Render, clique **"New +"** → **"Web Service"**
2. Conecte seu repositório: `neonorte-nexus`
3. Configurações:

   **Name:** `neonorte-backend`  
   **Region:** `Oregon (US West)` (gratuito)  
   **Branch:** `main`  
   **Root Directory:** `backend`  
   **Runtime:** `Node`  
   **Build Command:**

   ```bash
   npm install && npx prisma generate
   ```

   **Start Command:**

   ```bash
   npm start
   ```

   **Instance Type:** `Free`

4. Clique **"Advanced"** e adicione **Environment Variables**:

   ```
   DATABASE_URL = postgresql://neonorte_owner:XXX@ep-XXX.neon.tech/neonorte?sslmode=require
   JWT_SECRET = piloto_neonorte_2026_secret
   NODE_ENV = production
   ```

5. Clique **"Create Web Service"**

**Deploy levará ~3 minutos.**

### Passo 3.4: Copiar URL do Backend

Quando terminar, você verá:

```
https://neonorte-backend.onrender.com
```

**Teste:**
Abra no navegador: `https://neonorte-backend.onrender.com/api/health`

Deve retornar: `{"status":"ok"}`

---

## PARTE 4: Deploy do Frontend (Vercel)

### Passo 4.1: Configurar Variável de Ambiente (2 minutos)

Crie `frontend/.env.production`:

```env
VITE_API_URL=https://neonorte-backend.onrender.com/api
```

Commit:

```bash
git add frontend/.env.production
git commit -m "feat: config produção frontend"
git push
```

### Passo 4.2: Atualizar Código (se necessário)

Verifique se `frontend/src` usa:

```javascript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
```

Se não, procure onde define `API_URL` e atualize.

### Passo 4.3: Deploy no Vercel (5 minutos)

1. Acesse: https://vercel.com
2. Clique **"Sign Up"** → **"Continue with GitHub"**
3. No dashboard, clique **"Add New..."** → **"Project"**
4. Selecione repositório: `neonorte-nexus`
5. Clique **"Import"**

Configurações:

- **Framework Preset:** Vite
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

6. Clique **"Environment Variables"** e adicione:

   ```
   VITE_API_URL = https://neonorte-backend.onrender.com/api
   ```

7. Clique **"Deploy"**

**Deploy levará ~2 minutos.**

### Passo 4.4: Copiar URL do Frontend

Quando terminar:

```
https://neonorte-nexus.vercel.app
```

**Pronto! Sistema online! 🎉**

---

## PARTE 5: Criar Usuário Admin Inicial

### Opção 1: Via Prisma Studio (Local)

```bash
cd backend
npx prisma studio
```

1. Vá em **User**
2. Clique **"Add record"**
3. Preencha:
   ```
   email: admin@neonorte.com
   name: Administrador
   role: ADMIN
   password: (hash bcrypt - veja abaixo)
   ```

**Gerar hash bcrypt:**

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('admin123', 10).then(h => console.log(h))"
```

Cole o hash gerado no campo `password`.

### Opção 2: Via Script SQL (mais rápido)

No Neon.tech dashboard:

1. Vá em **"SQL Editor"**
2. Cole e execute:
   ```sql
   INSERT INTO "User" (id, email, name, role, password, "createdAt", "updatedAt")
   VALUES (
     gen_random_uuid()::text,
     'admin@neonorte.com',
     'Administrador Neonorte',
     'ADMIN',
     '$2b$10$YourBcryptHashHere',  -- Gere com comando acima
     NOW(),
     NOW()
   );
   ```

---

## ✅ CHECKLIST FINAL

- [ ] Neon.tech criado e connection string copiada
- [ ] Migrations executadas (`npx prisma migrate deploy`)
- [ ] Backend deployed no Render (`https://neonorte-backend.onrender.com`)
- [ ] Frontend deployed no Vercel (`https://neonorte-nexus.vercel.app`)
- [ ] Usuário admin criado
- [ ] Login funcionando

---

## 🧪 TESTAR SISTEMA

1. Acesse: `https://neonorte-nexus.vercel.app`
2. Login:
   - Email: `admin@neonorte.com`
   - Senha: `admin123` (ou a que você definiu)
3. Deve ver o Kanban vazio
4. Crie um lead de teste
5. Mova entre as colunas
6. Sucesso! ✅

---

## ⚠️ TROUBLESHOOTING

### Backend não inicia (Render)

- Veja logs: Dashboard → seu-service → Logs
- Erro comum: `DATABASE_URL` incorreto

### Frontend mostra erro CORS

- Verifique `VITE_API_URL` no Vercel
- Backend precisa aceitar `https://neonorte-nexus.vercel.app`

### Migrations falham

```bash
# Force reset (APAGA TUDO e recria)
DATABASE_URL="..." npx prisma migrate reset
```

---

## 📞 PRÓXIMOS PASSOS

1. **Customizar domínio** (opcional):

   - Vercel: Settings → Domains → `crm.neonorte.com.br`
   - Render: Settings → Custom Domain

2. **Convidar equipe:**

   - Ver próximo guia: `GUIA_ONBOARDING_VENDEDORES.md`

3. **Monitoramento:**
   - Render tem logs built-in
   - Vercel tem analytics gratuito

---

**Tempo total estimado:** 40-60 minutos  
**Resultado:** Sistema NEXUS rodando online! 🚀

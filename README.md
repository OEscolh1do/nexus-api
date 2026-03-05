# NEONORTE NEXUS 2.0 - Gestão Estratégica e Solar

Neonorte | Nexus 2.0 é um ecossistema modular para orquestração de negócios, focado na transposição de Estratégias Macro em Operações Táticas.

---

## 🏗️ Estrutura do Projeto

O sistema está organizado em sub-pacotes dentro do diretório `nexus-core/`:

- **Neonorte | Nexus Backend:** API Express com Prisma ORM (Porta 3001).
- **Neonorte | Nexus Frontend:** Aplicação React 19 + Vite (Porta 3000).
- **Docker Stack:** MySQL 8.0 orquestrado via Docker Compose.

---

## 🚀 Setup Rápido (Docker)

A forma recomendada de rodar o Neonorte | Nexus é via Docker Compose.

1. **Certifique-se de que o Docker Desktop está rodando.**
2. **Execute o comando na raiz:**
   ```bash
   docker-compose up --build -d
   ```
3. **Inicialize o Banco de Dados:**

   ```bash
   # Criar tabelas
   docker exec nexus_backend npx prisma db push

   # Resetar admin (admin/123) e semear estratégias
   docker exec nexus_backend node seed_admin_fix.js
   ```

---

## 🛠️ Desenvolvimento Local (npm)

Se preferir rodar sem containers (exceto o banco):

### 1. Backend

```bash
cd nexus-core/backend
npm install
npx prisma generate
npm run dev
```

### 2. Frontend

```bash
cd nexus-core/frontend
npm install
npm run dev
```

---

## 📚 Documentação Adicional

- [CONTEXT.md](file:///c:/Users/Neonorte%20Tecnologia/Documents/Meus%20Projetos/Neonorte/Neonorte/CONTEXT.md): Visão técnica, Stack e Schema.
- [MAPA_SISTEMA.md](file:///c:/Users/Neonorte%20Tecnologia/Documents/Meus%20Projetos/Neonorte/Neonorte/MAPA_SISTEMA.md): Guia de navegação de arquivos e UI.
- [DFD.md](file:///c:/Users/Neonorte%20Tecnologia/Documents/Meus%20Projetos/Neonorte/Neonorte/DFD.md): Fluxogramas e Diagramas Mermaid.

---

## 🔑 Acesso Padrão

- **URL:** [http://localhost:3000](http://localhost:3000)
- **Login:** `admin`
- **Senha:** `123`

# NEONORTE NEXUS 2.0 - Gestão Estratégica e Solar

Neonorte | Nexus 2.0 é um ecossistema modular para orquestração de negócios, focado na transposição de Estratégias Macro em Operações Táticas.

---

## 🏗️ Estrutura do Ecossistema (Hub & Spoke)

O sistema foi desmonolitizado em pacotes e sub-portais independentes:

- 🚪 **Portal Central SSO (`nexus-hub`):** Gateway Universal e AppSwitcher.
- 🏢 **Nexus ERP (`nexus-erp`):** O Core de Gestão e Operações. (Porta 3000)
- ⚙️ **Nexus Backend (`nexus-api`):** API Express + Prisma. (Porta 3001)
- ☀️ **Calculadora Lumi (`lumi`):** App Satélite de Engenharia Solar.
- 🎓 **Nexus Academy (`neonorte-academy`):** Hub de Ensino corporativo.
- 🤝 **Portais Extranet:** `nexus-client-portal` (B2B) e `nexus-vendor-portal` (B2P).
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

### 1. Backend (`nexus-api`)

```bash
cd nexus-api
npm install
npx prisma generate
npm run dev
```

### 2. Frontend ERP (`nexus-erp`)

```bash
cd nexus-erp
npm install
npm run dev
```

### 3. Portal Hub (SSO Gateway)

```bash
cd nexus-hub
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

# 🔒 Resolver Problema de CORS - Neonorte | Nexus 2.0

> **🎯 Cenário de Uso:** Configurar CORS no backend Express
> **⏱️ Tempo Estimado:** 5 minutos

---

## ✂️ PROMPT PRÉ-CONFIGURADO

```xml
<mission>
  Configurar CORS no backend Neonorte | Nexus para permitir requisições do frontend.
</mission>

<error_symptoms>
  - Console do navegador mostra: "CORS policy: No 'Access-Control-Allow-Origin' header"
  - Requisições do frontend falham com erro de rede
  - Funciona no Postman mas não no navegador
</error_symptoms>
```

---

## 📖 Solução

### 1. Instalar Middleware CORS

```bash
cd backend
npm install cors
```

### 2. Configurar no Express

```javascript
// backend/src/server.js
const express = require("express");
const cors = require("cors");

const app = express();

// Configuração CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ... resto do código
```

### 3. Variável de Ambiente

```env
# backend/.env
FRONTEND_URL=http://localhost:5173
```

### 4. Produção (Múltiplas Origens)

```javascript
const allowedOrigins = [
  "http://localhost:5173",
  "https://nexus.neonorte.com.br",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
```

---

## ✅ Checklist

- [ ] Middleware `cors` instalado
- [ ] Configuração aplicada no `server.js`
- [ ] Variável `FRONTEND_URL` definida
- [ ] Testado no navegador
- [ ] Erro CORS resolvido

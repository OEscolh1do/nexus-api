// =============================================================
// Neonorte Admin — BFF (Backend for Frontend)
// Painel de Gestão, Controle e Supervisão
// Porta: 3003
// =============================================================

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Middleware
const platformAuth = require('./middleware/platformAuth');

// Rotas
const tenantsRouter = require('./routes/tenants');
const usersRouter = require('./routes/users');
const catalogRouter = require('./routes/catalog');
const auditLogsRouter = require('./routes/auditLogs');
const systemRouter = require('./routes/system');

const app = express();
const PORT = process.env.PORT || 3003;

// =============================================================
// MIDDLEWARE GLOBAL
// =============================================================

app.use(cors({
  origin: process.env.ADMIN_FRONTEND_URL || 'http://localhost:5175',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Rate limiting: 100 req/min por IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de requisições excedido. Tente novamente em 1 minuto.' },
});
app.use(limiter);

// =============================================================
// HEALTH CHECK (público — sem auth)
// =============================================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'neonorte-admin-backend',
    timestamp: new Date().toISOString(),
  });
});

// =============================================================
// AUTH — Login do Operador (público)
// =============================================================

app.post('/admin/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username e password são obrigatórios' });
    }

    // Buscar operador no db_iaca via Prisma read-only
    const prismaIaca = require('./lib/prismaIaca');
    const user = await prismaIaca.user.findUnique({
      where: { username },
      select: { id: true, username: true, fullName: true, password: true, role: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar se é PLATFORM_ADMIN
    if (user.role !== 'PLATFORM_ADMIN') {
      return res.status(403).json({ error: 'Acesso restrito a operadores da plataforma' });
    }

    // Verificar senha
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar JWT (expira em 8h)
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      operator: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[Auth] Erro no login:', error.message);
    res.status(500).json({ error: 'Falha ao processar login' });
  }
});

// =============================================================
// ROTAS PROTEGIDAS — Todas exigem PLATFORM_ADMIN
// =============================================================

app.use('/admin/tenants', platformAuth, tenantsRouter);
app.use('/admin/users', platformAuth, usersRouter);
app.use('/admin/catalog', platformAuth, catalogRouter);
app.use('/admin/audit-logs', platformAuth, auditLogsRouter);
app.use('/admin/system', platformAuth, systemRouter);

// =============================================================
// DASHBOARD — KPIs agregados
// =============================================================

app.get('/admin/dashboard', platformAuth, async (req, res) => {
  try {
    const prismaIaca = require('./lib/prismaIaca');
    const prismaKurupira = require('./lib/prismaKurupira');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      tenantsTotal,
      usersTotal,
      usersThisMonth,
      projectsTotal,
      modulesActive,
      invertersActive,
      logsLast24h,
      apiUsageAggr,
    ] = await Promise.all([
      prismaIaca.tenant.count(),
      prismaIaca.user.count(),
      prismaIaca.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prismaKurupira.technicalDesign.count(),
      prismaKurupira.moduleCatalog.count({ where: { isActive: true } }),
      prismaKurupira.inverterCatalog.count({ where: { isActive: true } }),
      prismaIaca.auditLog.count({
        where: { timestamp: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
      }),
      prismaIaca.tenant.aggregate({
        _sum: { apiCurrentUsage: true },
      }),
    ]);

    res.json({
      data: {
        tenants: { total: tenantsTotal },
        users: { total: usersTotal, thisMonth: usersThisMonth },
        projects: { total: projectsTotal },
        catalog: { modules: modulesActive, inverters: invertersActive },
        activity: { logsLast24h },
        api: { currentUsage: apiUsageAggr._sum.apiCurrentUsage || 0 },
      },
    });
  } catch (error) {
    console.error('[Dashboard] Erro ao agregar KPIs:', error.message);
    res.status(500).json({ error: 'Falha ao carregar dashboard' });
  }
});

// =============================================================
// 404 HANDLER
// =============================================================

app.use((req, res) => {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.path}` });
});

// =============================================================
// ERROR HANDLER GLOBAL
// =============================================================

app.use((err, req, res, _next) => {
  console.error('[Server] Erro não tratado:', err.message);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// =============================================================
// START
// =============================================================

app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  NEONORTE ADMIN — Painel de Operações            ║');
  console.log('║  Gerenciando: Kurupira · Iaçã Platform          ║');
  console.log(`║  Porta: ${PORT}                                    ║`);
  console.log(`║  Ambiente: ${(process.env.NODE_ENV || 'development').padEnd(37)}║`);
  console.log('║  Iaçã:     ' + (process.env.IACA_INTERNAL_URL || 'N/A').padEnd(37) + '║');
  console.log('║  Kurupira: ' + (process.env.KURUPIRA_INTERNAL_URL || 'N/A').padEnd(37) + '║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
});

module.exports = app;

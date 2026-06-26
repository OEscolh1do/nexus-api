// =============================================================
// Neonorte Admin — BFF (Backend for Frontend)
// Painel de Gestão, Controle e Supervisão
// Porta: 3003
// =============================================================

require('dotenv').config();

const validateEnv = require('./lib/validateEnv');
validateEnv();

const logger = require('./lib/logger');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Middleware
const platformAuth = require('./middleware/platformAuth');
const { auditLog } = require('./lib/auditLogger');

// Rotas
const tenantsRouter = require('./routes/tenants');
const usersRouter = require('./routes/users');
const catalogRouter = require('./routes/catalog');
const auditLogsRouter = require('./routes/auditLogs');
const systemRouter = require('./routes/system');
const rolesRouter = require('./routes/roles');
const permissionsRouter = require('./routes/permissions');
const operatorsRouter = require('./routes/operators');

const app = express();
const PORT = process.env.PORT || 3003;

// Confiar no Nginx Reverse Proxy para obter o IP real do cliente
app.set('trust proxy', 1);

// =============================================================
// MIDDLEWARE GLOBAL
// =============================================================

const envOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) 
  : [];

const allowedOrigins = [
  'http://localhost:5175',
  process.env.ADMIN_FRONTEND_URL,
  ...envOrigins
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Rate limiting: 500 req/min por IP em produção (Dashboard faz ~10 chamadas no load)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: process.env.NODE_ENV === 'development' ? 5000 : 500, // 5000 em dev, 500 em prod
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    error: 'Muitas requisições vindas deste IP. O limite administrativo é de 500 requisições por minuto.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});
app.use(limiter);


// =============================================================
// HEALTH CHECK (público — sem auth)
// Suporta /health (infra) e /admin/health (frontend axios)
// =============================================================

app.get(['/health', '/admin/health'], (req, res) => {
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

    // Buscar operador no db_sumauma via Prisma Master
    const prismaSumauma = require('./lib/prismaSumauma');
    const user = await prismaSumauma.user.findUnique({
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

    // Gerar JWT (expira em 1h — refresh token estende a sessão silenciosamente)
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Gerar refresh token (30 dias) e persistir na tabela Session
    const refreshTokenValue = crypto.randomBytes(32).toString('hex');
    await Promise.all([
      prismaSumauma.session.create({
        data: {
          userId: user.id,
          token: refreshTokenValue,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      }),
      // Atualizar lastLoginAt do operador
      prismaSumauma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
    ]);

    // Auditoria de Login
    await auditLog({
      operator: { id: user.id, role: user.role },
      action: 'ADMIN_LOGIN',
      entity: 'Operator',
      resourceId: user.id,
      ipAddress: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
      details: `Login realizado pelo operador: ${user.username}`
    });

    res.json({
      token,
      refreshToken: refreshTokenValue,
      operator: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Erro no login', { err: error.message });
    res.status(500).json({ error: 'Falha ao processar login' });
  }
});

// =============================================================
// AUTH — Refresh Token (público — credencial é o próprio refreshToken)
// =============================================================
app.post('/admin/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'refreshToken é obrigatório' });
    }

    const prismaSumauma = require('./lib/prismaSumauma');
    const session = await prismaSumauma.session.findUnique({
      where: { token: refreshToken },
      include: {
        user: { select: { id: true, username: true, fullName: true, role: true, status: true } },
      },
    });

    if (!session) {
      return res.status(401).json({ error: 'Refresh token inválido ou expirado' });
    }

    if (new Date() > session.expiresAt) {
      await prismaSumauma.session.delete({ where: { id: session.id } }).catch(() => {});
      return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
    }

    if (session.user.role !== 'PLATFORM_ADMIN' || session.user.status !== 'ACTIVE') {
      await prismaSumauma.session.delete({ where: { id: session.id } }).catch(() => {});
      return res.status(403).json({ error: 'Acesso revogado' });
    }

    // Novo access token (1h)
    const newToken = jwt.sign(
      { id: session.user.id, username: session.user.username, role: session.user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Rotate refresh token — delete old, create new (prevents token reuse)
    const newRefreshToken = crypto.randomBytes(32).toString('hex');
    await prismaSumauma.$transaction([
      prismaSumauma.session.delete({ where: { id: session.id } }),
      prismaSumauma.session.create({
        data: {
          userId: session.user.id,
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    res.json({ token: newToken, refreshToken: newRefreshToken });
  } catch (error) {
    logger.error('Erro no refresh de token', { err: error.message });
    res.status(500).json({ error: 'Falha ao renovar sessão' });
  }
});

// =============================================================
// AUTH — Logout do Operador (protegido)
// =============================================================
app.post('/admin/auth/logout', platformAuth, async (req, res) => {
  try {
    // Revogar refresh token se fornecido
    const { refreshToken } = req.body || {};
    if (refreshToken) {
      const prismaSumauma = require('./lib/prismaSumauma');
      await prismaSumauma.session.deleteMany({ where: { token: refreshToken } }).catch(() => {});
    }

    // Auditoria de Logout
    await auditLog({
      operator: req.operator,
      action: 'ADMIN_LOGOUT',
      entity: 'Operator',
      resourceId: req.operator.id,
      ipAddress: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
      details: `Logout realizado pelo operador: ${req.operator.username}`
    });

    res.json({ message: 'Logout registrado com sucesso' });
  } catch (error) {
    logger.warn('Falha ao registrar log de logout', { err: error.message });
    res.json({ message: 'Logout processado localmente' });
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
app.use('/admin/roles', platformAuth, rolesRouter);
app.use('/admin/permissions', platformAuth, permissionsRouter);
app.use('/admin/operators', platformAuth, operatorsRouter);

// =============================================================
// AUTH — Auditoria de Login SSO
// =============================================================
app.post('/admin/auth/audit-login', platformAuth, async (req, res) => {
  try {
    await auditLog({ 
      operator: req.operator, 
      action: 'ADMIN_LOGIN', 
      entity: 'Operator', 
      resourceId: req.operator.id, 
      ipAddress: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
      details: `Login SSO realizado pelo operador: ${req.operator.username}` 
    });
    res.json({ message: 'Login registrado' });
  } catch (error) {
    logger.warn('Falha ao registrar log de login SSO', { err: error.message });
    res.json({ message: 'Login processado' });
  }
});

// =============================================================
// DASHBOARD — KPIs agregados
// =============================================================

app.get('/admin/dashboard', platformAuth, async (req, res) => {
  try {
    const prismaSumauma = require('./lib/prismaSumauma');
    const prismaKurupira = require('./lib/prismaKurupira');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Função auxiliar para contar com segurança (retorna 0 se a tabela não existir)
    const safeCount = async (prismaModel, where = {}) => {
      try {
        if (!prismaModel || typeof prismaModel.count !== 'function') {
          return 0;
        }
        return await prismaModel.count({ where });
      } catch (err) {
        logger.warn(`Dashboard: falha ao contar ${prismaModel?.name || 'modelo desconhecido'}`, { err: err.message });
        return 0;
      }
    };

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
      safeCount(prismaSumauma.tenant),
      safeCount(prismaSumauma.user),
      safeCount(prismaSumauma.user, { createdAt: { gte: startOfMonth } }),
      safeCount(prismaKurupira.technicalDesign),
      safeCount(prismaKurupira.moduleCatalog, { isActive: true }),
      safeCount(prismaKurupira.inverterCatalog, { isActive: true }),
      safeCount(prismaSumauma.auditLog, { timestamp: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } }),
      prismaSumauma.tenant.aggregate({
        _sum: { apiCurrentUsage: true },
      }).catch(err => {
        logger.warn('Dashboard: falha ao agregar uso de API', { err: err.message });
        return { _sum: { apiCurrentUsage: 0 } };
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
    logger.error('Erro fatal ao agregar KPIs do dashboard', { err: error.message });
    res.status(500).json({ error: 'Falha ao carregar dashboard' });
  }
});

// =============================================================
// DASHBOARD — Trend (últimos 7 dias)
// Retorna séries diárias para sparklines do dashboard.
// Endpoint separado para não bloquear o carregamento inicial dos KPIs.
// =============================================================

app.get('/admin/dashboard/trend', platformAuth, async (req, res) => {
  try {
    const prismaSumauma = require('./lib/prismaSumauma');

    const now = new Date();
    // Gera 7 janelas de 1 dia (hoje = dia 0, ontem = dia 1, …, 6 dias atrás = dia 6)
    const days = Array.from({ length: 7 }, (_, i) => {
      const start = new Date(now);
      start.setDate(start.getDate() - (6 - i)); // ordem crescente (mais antigo primeiro)
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      return { start, end, label: start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) };
    });

    const safeCountDay = async (model, field, start, end, extra = {}) => {
      try {
        return await model.count({ where: { [field]: { gte: start, lte: end }, ...extra } });
      } catch {
        return 0;
      }
    };

    const [usersByDay, logsByDay, tenantsByDay] = await Promise.all([
      Promise.all(days.map(d => safeCountDay(prismaSumauma.user,     'createdAt', d.start, d.end))),
      Promise.all(days.map(d => safeCountDay(prismaSumauma.auditLog, 'timestamp', d.start, d.end))),
      Promise.all(days.map(d => safeCountDay(prismaSumauma.tenant,   'createdAt', d.start, d.end))),
    ]);

    const labels = days.map(d => d.label);

    res.json({
      data: {
        labels,
        usersByDay,
        logsByDay,
        tenantsByDay,
      },
    });
  } catch (error) {
    logger.error('Erro ao gerar trend do dashboard', { err: error.message });
    res.status(500).json({ error: 'Falha ao carregar tendências' });
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
  logger.error('Erro não tratado', { err: err.message, stack: err.stack });
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// =============================================================
// START
// =============================================================

const { initCronJobs } = require('./lib/cronJobs');

app.listen(PORT, () => {
  logger.info('NEONORTE ADMIN BFF running', {
    port: PORT,
    env: process.env.NODE_ENV || 'development',
    iaca: process.env.IACA_INTERNAL_URL || 'N/A',
    kurupira: process.env.KURUPIRA_INTERNAL_URL || 'N/A',
  });

  // Iniciar Cron
  initCronJobs();
});

module.exports = app;

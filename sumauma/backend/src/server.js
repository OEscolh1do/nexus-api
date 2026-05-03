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
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'development' ? 5000 : 100, // 5000 em dev, 100 em prod
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições vindas deste IP, tente novamente após 15 minutos.' }
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

    // Gerar JWT (expira em 8h)
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

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
// AUTH — Logout do Operador (protegido)
// =============================================================
app.post('/admin/auth/logout', platformAuth, async (req, res) => {
  try {
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
    const prismaIaca = require('./lib/prismaIaca');
    const prismaKurupira = require('./lib/prismaKurupira');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Função auxiliar para contar com segurança (retorna 0 se a tabela não existir)
    const safeCount = async (prismaModel, where = {}) => {
      try {
        return await prismaModel.count({ where });
      } catch (err) {
        logger.warn('Dashboard: falha ao contar', { model: prismaModel.name, err: err.message });
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

app.listen(PORT, () => {
  logger.info('NEONORTE ADMIN BFF running', {
    port: PORT,
    env: process.env.NODE_ENV || 'development',
    iaca: process.env.IACA_INTERNAL_URL || 'N/A',
    kurupira: process.env.KURUPIRA_INTERNAL_URL || 'N/A',
  });
});

module.exports = app;

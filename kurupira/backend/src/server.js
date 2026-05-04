require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const validateEnv = require('./lib/validateEnv');
validateEnv();

const logger = require('./lib/logger');
const prisma = require('./lib/prisma');
const { setCache, CATALOG_TTL } = require('./lib/cache');

const designsRouter = require('./routes/designs');
const catalogRouter = require('./routes/catalog');
const internalCatalogRouter = require('./routes/internalCatalog');
const settingsRouter = require('./routes/settings');
const teamRouter = require('./routes/team');

const app = express();
const PORT = process.env.PORT || 3002;

const envOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];

const allowedOrigins = [
  'http://localhost:5173', // Dev Kurupira
  'http://localhost:5174', // Dev alternativo
  'http://localhost:5175', // Dev Sumauma
  'https://neonorte-kurupira.vercel.app',
  ...envOrigins
];

const isStrictCors = process.env.NODE_ENV === 'production' || process.env.CORS_STRICT === 'true';

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || !isStrictCors) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  credentials: true
}));
// Rota interna M2M recebe conteúdo de arquivo PVSyst (.pan/.ond) — limite maior e explícito.
// Deve vir antes do parser global para sobrescrever o limite nessa rota específica.
app.use('/internal/catalog', express.json({ limit: '1mb' }), internalCatalogRouter);

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/v1/designs', designsRouter);
app.use('/api/v1/catalog', catalogRouter);
app.use('/api/v1/settings', settingsRouter);
app.use('/api/v1/team', teamRouter);

// Health check profundo — verifica conectividade com o banco
app.get('/health', async (req, res) => {
  let dbOk = false;
  let dbError = null;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch (err) {
    dbError = err.message;
  }
  const status = dbOk ? 'ok' : 'degraded';
  res.status(dbOk ? 200 : 503).json({
    status,
    service: 'kurupira-backend',
    checks: { database: dbOk ? 'ok' : dbError },
    timestamp: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, error: 'Arquivo excede o limite de 2MB.' });
  }
  if (err.message?.startsWith('Tipo de arquivo') || err.message?.startsWith('Conteúdo')) {
    return res.status(400).json({ success: false, error: err.message });
  }
  logger.error('Unhandled error', { err: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Popula o cache de catálogo antes de começar a receber tráfego
async function warmUpCache() {
  try {
    const [modules, inverters] = await Promise.all([
      prisma.moduleCatalog.findMany({ where: { isActive: true }, orderBy: { manufacturer: 'asc' }, take: 200 }),
      prisma.inverterCatalog.findMany({ where: { isActive: true }, orderBy: { manufacturer: 'asc' }, take: 200 }),
    ]);
    setCache('catalog:modules', modules, CATALOG_TTL);
    setCache('catalog:inverters', inverters, CATALOG_TTL);
    logger.info('Cache warm-up concluído', { modules: modules.length, inverters: inverters.length });
  } catch (err) {
    logger.warn('Cache warm-up falhou — cache partirá frio', { err: err.message });
  }
}

app.listen(PORT, '0.0.0.0', async () => {
  logger.info(`KURUPIRA Backend (Engenharia) running`, { port: PORT, env: process.env.NODE_ENV || 'development' });
  await warmUpCache();
});

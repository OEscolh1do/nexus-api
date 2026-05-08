const express = require('express');
const axios = require('axios');
const prismaSumauma = require('../lib/prismaSumauma');
const prismaIaca = require('../lib/prismaIaca');
const prismaKurupira = require('../lib/prismaKurupira');
const logger = require('../lib/logger');
const { iacaClient } = require('../lib/m2mClient');
const { createLogtoUser } = require('../lib/logtoClient');
const { auditLog } = require('../lib/auditLogger');

const router = express.Router();

let healthCache = {
  data: null,
  timestamp: 0,
};

// ============================================
// GET /admin/system/health — Status dos serviços
// ============================================
router.get('/health', async (req, res) => {
  const now = Date.now();
  if (healthCache.data && now - healthCache.timestamp < 30000) {
    return res.status(200).json({
      ...healthCache.data,
      fromCache: true,
    });
  }

  const probeService = async (name, url) => {
    const start = Date.now();
    try {
      if (!url) throw new Error('URL não configurada');
      const resp = await axios.get(`${url}/health`, { timeout: 3000 });
      return {
        name,
        status: resp.status === 200 ? 'healthy' : 'degraded',
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      return { 
        name, 
        status: 'down', 
        latencyMs: Date.now() - start,
        error: err.message 
      };
    }
  };

  const probeDb = async (name, prismaClient) => {
    const start = Date.now();
    try {
      await prismaClient.$queryRaw`SELECT 1`;
      return { name, status: 'healthy', latencyMs: Date.now() - start };
    } catch (err) {
      return { name, status: 'down', latencyMs: Date.now() - start, error: err.message };
    }
  };

  const probes = await Promise.allSettled([
    probeService('Iaçã', process.env.IACA_INTERNAL_URL),
    probeService('Kurupira', process.env.KURUPIRA_INTERNAL_URL),
    probeDb('MySQL (Sumaúma)', prismaSumauma),
    probeDb('MySQL (Iaçã)', prismaIaca),
    probeDb('MySQL (Kurupira)', prismaKurupira),
  ]);

  const results = probes.map(p => p.status === 'fulfilled' ? p.value : { status: 'error', name: 'Unknown' });
  const criticalServicesDown = results.some(r => r.status === 'down' || r.status === 'error');
  const allHealthy = results.every(r => r.status === 'healthy');

  const responseData = {
    status: allHealthy ? 'healthy' : (criticalServicesDown ? 'degraded' : 'healthy'),
    services: results,
    checkedAt: new Date().toISOString(),
  };

  healthCache = { data: responseData, timestamp: now };
  // Retornamos 200 mesmo se degradado para evitar spam de 503 no console do navegador,
  // já que o BFF ainda está operacional. A UI tratará o campo 'status'.
  res.status(200).json(responseData);
});

// ============================================
// GET /admin/system/info — Informações de Ambiente
// ============================================
router.get('/info', (req, res) => {
  const envVars = [
    'JWT_SECRET',
    'DATABASE_URL',
    'DATABASE_URL_IACA_RO',
    'DATABASE_URL_KURUPIRA_RO',
    'IACA_INTERNAL_URL',
    'KURUPIRA_INTERNAL_URL'
  ];

  const envStatus = envVars.map(name => ({
    name,
    present: !!process.env[name]
  }));

  res.json({
    version: require('../../package.json').version,
    nodeVersion: process.version,
    platform: process.platform,
    uptimeSeconds: Math.floor(process.uptime()),
    envStatus
  });
});

// ============================================
// GET /admin/system/sessions — Sessões ativas
// ============================================
router.get('/sessions', async (req, res) => {
  try {
    const now = new Date();
    // No db_sumauma (Master)
    const sessions = await prismaSumauma.session.findMany({
      where: { expiresAt: { gt: now } },
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            tenant: { select: { id: true, name: true } },
          },
        },
      },
    });

    res.json({ data: sessions });
  } catch (error) {
    logger.error('Erro ao listar sessões', { err: error.message });
    res.json({ data: [] }); // Silencioso para não quebrar UI
  }
});

// ============================================
// DELETE /admin/system/sessions/:id — Revogar
// ============================================
router.delete('/sessions/:id', async (req, res) => {
  try {
    await prismaSumauma.session.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GET /admin/system/jobs — Status dos CronJobs
// ============================================
router.get('/jobs', async (req, res) => {
  try {
    const jobs = await prismaSumauma.cronLock.findMany({
      orderBy: { lockedAt: 'desc' },
    });
    res.json({ data: jobs });
  } catch (error) {
    logger.warn('CronLocks não disponíveis no momento');
    res.json({ data: [] });
  }
});

// ============================================
// GET /admin/system/api-usage — Uso de API por Tenant
// ============================================
router.get('/api-usage', async (req, res) => {
  try {
    const tenants = await prismaSumauma.tenant.findMany({
      select: {
        id: true,
        name: true,
        apiPlan: true,
        apiMonthlyQuota: true,
        apiCurrentUsage: true,
      },
      orderBy: { apiCurrentUsage: 'desc' },
    });
    res.json({ data: tenants });
  } catch (error) {
    logger.error('Erro ao listar uso de API', { err: error.message });
    res.json({ data: [] });
  }
});


// ============================================
// GET /admin/system/identity-audit/history — Última Auditoria Salva
// ============================================
router.get('/identity-audit/history', async (req, res) => {
  try {
    const lastAudit = await prismaSumauma.identityAuditHistory.findFirst({
      orderBy: { checkedAt: 'desc' }
    });
    res.json(lastAudit);
  } catch (error) {
    res.status(500).json({ error: 'Falha ao obter histórico de auditoria' });
  }
});

// ============================================
// GET /admin/system/identity-audit — Relatório de Integridade
// ============================================
router.get('/identity-audit', async (req, res) => {
  try {
    const { runIdentityAudit } = require('../lib/identityAuditService');
    logger.info('Identity Audit iniciado via API', { operator: req.operator?.id });

    const report = await runIdentityAudit();

    res.json(report);
  } catch (error) {
    logger.error('Erro na auditoria de identidade', { err: error.message });
    res.status(500).json({ error: 'Falha ao processar auditoria', detail: error.message });
  }
});

// ============================================
// POST /admin/system/identity-audit/sync-attributes/:userId — Sincronizar Atributos
// ============================================
router.post('/identity-audit/sync-attributes/:userId', async (req, res) => {
  const { userId } = req.params;
  const { direction = 'TO_LOCAL' } = req.body;

  try {
    const user = await prismaSumauma.user.findUnique({ where: { id: userId } });
    if (!user || !user.authProviderId) return res.status(404).json({ error: 'Usuário não encontrado ou sem vínculo IdP' });

    // Buscar dados frescos no Logto
    const { listLogtoUsers } = require('../lib/logtoClient');
    const logtoUsers = await listLogtoUsers();
    const logtoUser = logtoUsers.find(u => u.id === user.authProviderId);
    
    if (!logtoUser) return res.status(404).json({ error: 'Usuário não encontrado no Logto' });

    if (direction === 'TO_LOCAL') {
      const before = { fullName: user.fullName, email: user.email, role: user.role };
      const after = { 
        fullName: logtoUser.name, 
        email: logtoUser.primaryEmail, 
        role: logtoUser.customData?.role || user.role 
      };

      await prismaSumauma.user.update({
        where: { id: userId },
        data: after
      });

      await auditLog({
        operator:   req.operator,
        action:     'ADMIN_SYNC_USER_ATTRIBUTES',
        entity:     'User',
        resourceId: userId,
        ipAddress:  req.ip ?? req.headers['x-forwarded-for'],
        userAgent:  req.headers['user-agent'],
        details:    `Atributos do usuário ${user.username} sincronizados a partir do Logto.`,
        before,
        after
      });

      res.json({ success: true, message: 'Atributos sincronizados com o Logto.' });
    } else {
      res.status(400).json({ error: 'Direção de sincronização não suportada no momento.' });
    }
  } catch (error) {
    logger.error('Erro ao sincronizar atributos', { userId, err: error.message });
    res.status(500).json({ error: 'Falha ao sincronizar atributos', detail: error.message });
  }
});

// ============================================
// POST /admin/system/identity-audit/reprovision/:userId — Reprovisionar no Logto
// ============================================
router.post('/identity-audit/reprovision/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Buscar usuário local
    const user = await prismaSumauma.user.findUnique({
      where: { id: userId },
      include: { tenant: { select: { id: true, name: true, logtoOrgId: true } } },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Se o usuário já tiver um authProviderId mas ele for inválido (mismatch),
    // o Logto criará um novo e nós atualizaremos o registro local.
    // Se não tiver, ele será criado do zero no Logto.

    if (user.status === 'BLOCKED') {
      return res.status(400).json({ error: 'Usuário bloqueado não pode ser reprovisionado' });
    }

    // Criar no Logto usando os dados locais
    const logtoUserId = await createLogtoUser(user.tenantId, {
      email:       user.email,
      username:    user.username,
      password:    `Ywara@${Math.random().toString(36).slice(2, 10)}`, // Senha temporária aleatória
      firstName:   user.fullName?.split(' ')[0] ?? user.username,
      lastName:    user.fullName?.split(' ').slice(1).join(' ') ?? '',
      role:        user.role,
      logtoOrgId:  user.tenant?.logtoOrgId ?? null,
    });

    // Atualizar authProviderId no banco local com o novo ID do Logto
    await prismaSumauma.user.update({
      where: { id: userId },
      data:  { authProviderId: logtoUserId },
    });

    // Auditoria
    await auditLog({
      operator:   req.operator,
      action:     'ADMIN_REPROVISION_USER',
      entity:     'User',
      resourceId: userId,
      ipAddress:  req.ip ?? req.headers['x-forwarded-for'],
      userAgent:  req.headers['user-agent'],
      details:    `Usuário ${user.username} reprovisionado no Logto. Novo ID: ${logtoUserId}`,
      before:     { authProviderId: user.authProviderId },
      after:      { authProviderId: logtoUserId },
    });

    logger.info('Usuário reprovisionado no Logto', {
      userId,
      username:     user.username,
      newLogtoId:   logtoUserId,
      operator:     req.operator?.id,
    });

    res.json({
      success:      true,
      userId,
      newLogtoId:   logtoUserId,
      message:      `Usuário ${user.username} reprovisionado com sucesso. Uma senha temporária foi gerada — o usuário deve redefinir no próximo login.`,
    });
  } catch (error) {
    logger.error('Erro ao reprovisionar usuário', { userId, err: error.message });

    // Tratar erro 422 do Logto (e-mail já existente)
    if (error.message?.includes('Falha na integração com Logto')) {
      return res.status(409).json({
        error: 'Conflito no Logto: o e-mail ou username já existe. Verifique o Console do Logto antes de reprovisionar.',
      });
    }

    res.status(500).json({ error: 'Falha ao reprovisionar usuário', detail: error.message });
  }
});

// ============================================
// POST /admin/system/identity-audit/batch — Ações em Massa
// ============================================
router.post('/identity-audit/batch', async (req, res) => {
  const { action, targets } = req.body; // targets = array de IDs (LogtoId ou UserId)

  if (!action || !Array.isArray(targets) || targets.length === 0) {
    return res.status(400).json({ error: 'Ação e lista de alvos são obrigatórios.' });
  }

  const { deleteLogtoUser, deleteLogtoOrg, listLogtoUsers } = require('../lib/logtoClient');
  const results = { successCount: 0, failCount: 0, errors: [] };

  try {
    const processItem = async (id) => {
      try {
        switch (action) {
          case 'DELETE_ORPHAN_USERS':
            if (id === req.operator?.authProviderId) throw new Error('Não é permitido excluir o próprio usuário.');
            await deleteLogtoUser(id);
            break;

          case 'DELETE_ORPHAN_ORGS':
            await deleteLogtoOrg(id);
            break;

          case 'SYNC_ATTRIBUTES': {
            const user = await prismaSumauma.user.findUnique({ where: { id } });
            if (!user || !user.authProviderId) throw new Error('Usuário local não encontrado ou sem vínculo.');
            
            const lUsers = await listLogtoUsers();
            const logtoUser = lUsers.find(u => u.id === user.authProviderId);
            if (!logtoUser) throw new Error('Usuário não encontrado no Logto.');

            await prismaSumauma.user.update({
              where: { id },
              data: {
                fullName: logtoUser.name,
                email: logtoUser.primaryEmail,
                role: logtoUser.customData?.role || user.role
              }
            });
            break;
          }
          default:
            throw new Error(`Ação ${action} não suportada.`);
        }
        results.successCount++;
      } catch (err) {
        results.failCount++;
        results.errors.push({ id, error: err.message });
      }
    };

    // Executar sequencial para não sobrecarregar
    for (const target of targets) {
      await processItem(target);
    }

    // Auditoria Global do Lote
    await auditLog({
      operator:   req.operator,
      action:     `ADMIN_BATCH_${action}`,
      entity:     'System',
      resourceId: action,
      ipAddress:  req.ip ?? req.headers['x-forwarded-for'],
      userAgent:  req.headers['user-agent'],
      details:    `Executada ação em massa: ${action}. Sucessos: ${results.successCount}, Falhas: ${results.failCount}`,
      after:      results
    });

    res.json(results);
  } catch (error) {
    logger.error('Erro no processamento em lote da auditoria', { action, err: error.message });
    res.status(500).json({ error: 'Falha no processamento em lote', detail: error.message });
  }
});

// ============================================
// DELETE /admin/system/identity-audit/orphan/:logtoId — Remover do Logto
// ============================================
router.delete('/identity-audit/orphan/:logtoId', async (req, res) => {
  const { logtoId } = req.params;
  const { deleteLogtoUser } = require('../lib/logtoClient');

  try {
    // 1. Proteção contra auto-deleção
    if (logtoId === req.operator?.authProviderId) {
      return res.status(403).json({ error: 'Não é permitido excluir o próprio usuário logado.' });
    }

    // 2. Remover do Logto
    await deleteLogtoUser(logtoId);

    // 3. Auditoria
    await auditLog({
      operator:   req.operator,
      action:     'ADMIN_DELETE_LOGTO_USER',
      entity:     'User',
      resourceId: logtoId,
      ipAddress:  req.ip ?? req.headers['x-forwarded-for'],
      userAgent:  req.headers['user-agent'],
      details:    `Usuário órfão removido do Logto (ID: ${logtoId}) via Auditoria de Identidade.`,
    });

    res.json({ success: true, message: 'Usuário removido do Logto com sucesso.' });
  } catch (error) {
    logger.error('Erro ao excluir usuário órfão do Logto', { logtoId, err: error.message });
    res.status(500).json({ error: 'Falha ao excluir usuário do Logto', detail: error.message });
  }
});

// ============================================
// POST /admin/system/identity-audit/orphan/:logtoId/provision-local — Criar Localmente
// ============================================
router.post('/identity-audit/orphan/:logtoId/provision-local', async (req, res) => {
  const { logtoId } = req.params;
  const { tenantId, username, role, fullName } = req.body;

  if (!tenantId || !username) {
    return res.status(400).json({ error: 'Tenant e Username são obrigatórios para provisionamento local.' });
  }

  try {
    // 1. Verificar se usuário já existe localmente (segurança redundante)
    const existing = await prismaSumauma.user.findFirst({
      where: { OR: [{ username }, { authProviderId: logtoId }] }
    });

    if (existing) {
      return res.status(409).json({ error: 'Usuário já existe localmente com este username ou Logto ID.' });
    }

    // 2. Criar no banco local
    const newUser = await prismaSumauma.user.create({
      data: {
        username,
        fullName: fullName || username,
        email: req.body.email || `${username}@neonorte.local`,
        authProviderId: logtoId,
        role: role || 'USER',
        tenantId,
        status: 'ACTIVE',
        password: 'SSO_ONLY', // Senha não usada pois login é via Logto
      },
    });

    // 3. Auditoria
    await auditLog({
      operator:   req.operator,
      action:     'ADMIN_PROVISION_LOCAL_USER',
      entity:     'User',
      resourceId: newUser.id,
      ipAddress:  req.ip ?? req.headers['x-forwarded-for'],
      userAgent:  req.headers['user-agent'],
      details:    `Usuário provisionado localmente a partir do Logto (ID: ${logtoId}).`,
      after:      { id: newUser.id, username, tenantId },
    });

    res.json({ success: true, user: newUser });
  } catch (error) {
    logger.error('Erro ao provisionar usuário localmente', { logtoId, err: error.message });
    res.status(500).json({ error: 'Falha ao provisionar usuário localmente', detail: error.message });
  }
});

// ============================================
// PATCH /admin/system/identity-audit/missing/:userId/block — Desativar Localmente
// ============================================
router.patch('/identity-audit/missing/:userId/block', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await prismaSumauma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    // Atualizar para BLOCKED
    await prismaSumauma.user.update({
      where: { id: userId },
      data:  { status: 'BLOCKED' },
    });

    // Auditoria
    await auditLog({
      operator:   req.operator,
      action:     'ADMIN_BLOCK_USER_AUDIT',
      entity:     'User',
      resourceId: userId,
      ipAddress:  req.ip ?? req.headers['x-forwarded-for'],
      userAgent:  req.headers['user-agent'],
      details:    `Usuário ${user.username} bloqueado localmente via Auditoria de Identidade (ausente no Logto).`,
      before:     { status: user.status },
      after:      { status: 'BLOCKED' },
    });
    res.json({ success: true, message: 'Usuário desativado localmente. Ele não aparecerá mais no relatório.' });
  } catch (error) {
    logger.error('Erro ao bloquear usuário ausente', { userId, err: error.message });
    res.status(500).json({ error: 'Falha ao bloquear usuário localmente', detail: error.message });
  }
});

// ============================================
// DELETE /admin/system/identity-audit/missing/:userId — Excluir Localmente
// ============================================
router.delete('/identity-audit/missing/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await prismaSumauma.user.findUnique({ 
      where: { id: userId },
      include: { tenant: true }
    });

    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    // Excluir do banco
    await prismaSumauma.user.delete({ where: { id: userId } });

    // Auditoria
    await auditLog({
      operator:   req.operator,
      action:     'ADMIN_DELETE_USER_AUDIT',
      entity:     'User',
      resourceId: userId,
      ipAddress:  req.ip ?? req.headers['x-forwarded-for'],
      userAgent:  req.headers['user-agent'],
      details:    `Usuário ${user.username} (Tenant: ${user.tenant?.name}) excluído permanentemente do banco local via Auditoria de Identidade.`,
      before:     { id: user.id, username: user.username, email: user.email },
    });

    res.json({ success: true, message: 'Usuário excluído permanentemente do banco local.' });
  } catch (error) {
    logger.error('Erro ao excluir usuário local ausente', { userId, err: error.message });
    res.status(500).json({ error: 'Falha ao excluir usuário do banco local', detail: error.message });
  }
});

// ============================================
// POST /admin/system/identity-audit/tenant/:tenantId/link — Vincular Tenant a Org Logto
// ============================================
router.post('/identity-audit/tenant/:tenantId/link', async (req, res) => {
  const { tenantId } = req.params;
  const { logtoOrgId } = req.body;

  try {
    const tenant = await prismaSumauma.tenant.update({
      where: { id: tenantId },
      data:  { logtoOrgId },
    });

    await auditLog({
      operator:   req.operator,
      action:     'ADMIN_LINK_LOGTO_ORG',
      entity:     'Tenant',
      resourceId: tenantId,
      ipAddress:  req.ip,
      userAgent:  req.headers['user-agent'],
      details:    `Tenant ${tenant.name} vinculado manualmente à Org Logto ${logtoOrgId}.`,
      after:      { logtoOrgId },
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Erro ao vincular organização', { tenantId, err: error.message });
    res.status(500).json({ error: 'Falha ao vincular organização local ao Logto.' });
  }
});

// ============================================
// POST /admin/system/identity-audit/tenant/:tenantId/provision — Criar Org no Logto
// ============================================
router.post('/identity-audit/tenant/:tenantId/provision', async (req, res) => {
  const { tenantId } = req.params;

  try {
    const tenant = await prismaSumauma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ error: 'Tenant não encontrado' });

    // Criar no Logto via API
    const { createLogtoOrg } = require('../lib/logtoClient');
    const logtoOrgId = await createLogtoOrg(tenant.name);

    // Atualizar localmente
    await prismaSumauma.tenant.update({
      where: { id: tenantId },
      data:  { logtoOrgId },
    });

    await auditLog({
      operator:   req.operator,
      action:     'ADMIN_PROVISION_LOGTO_ORG',
      entity:     'Tenant',
      resourceId: tenantId,
      ipAddress:  req.ip,
      userAgent:  req.headers['user-agent'],
      details:    `Organização criada no Logto para o tenant ${tenant.name}. ID Logto: ${logtoOrgId}.`,
      after:      { logtoOrgId },
    });

    res.json({ success: true, logtoOrgId });
  } catch (error) {
    logger.error('Erro ao provisionar organização no Logto', { tenantId, err: error.message });
    res.status(500).json({ error: 'Falha ao criar organização no Logto.' });
  }
});

// ============================================
// DELETE /admin/system/identity-audit/tenant/:tenantId — Excluir Tenant Localmente
// ============================================
router.delete('/identity-audit/tenant/:tenantId', async (req, res) => {
  const { tenantId } = req.params;

  try {
    const tenant = await prismaSumauma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ error: 'Tenant não encontrado' });

    // Excluir do banco (o Prisma cuidará do cascade se configurado, ou falhará se houver restrições)
    await prismaSumauma.tenant.delete({ where: { id: tenantId } });

    // Auditoria
    await auditLog({
      operator:   req.operator,
      action:     'ADMIN_DELETE_TENANT_AUDIT',
      entity:     'Tenant',
      resourceId: tenantId,
      ipAddress:  req.ip ?? req.headers['x-forwarded-for'],
      userAgent:  req.headers['user-agent'],
      details:    `Tenant ${tenant.name} excluído permanentemente do banco local via Auditoria de Identidade.`,
      before:     { id: tenant.id, name: tenant.name, type: tenant.type },
    });

    res.json({ success: true, message: 'Tenant excluído permanentemente.' });
  } catch (error) {
    logger.error('Erro ao excluir tenant local', { tenantId, err: error.message });
    res.status(500).json({ error: 'Falha ao excluir tenant do banco local', detail: error.message });
  }
});

// ============================================
// POST /admin/system/identity-audit/orphan-org/:logtoId/provision-local — Importar Org para Tenant Local
// ============================================
router.post('/identity-audit/orphan-org/:logtoId/provision-local', async (req, res) => {
  const { logtoId } = req.params;
  const { name, type = 'CORPORATE' } = req.body;

  try {
    // Criar o tenant localmente já com o logtoOrgId
    const tenant = await prismaSumauma.tenant.create({
      data: {
        name,
        type,
        logtoOrgId: logtoId,
      }
    });

    // Auditoria
    await auditLog({
      operator:   req.operator,
      action:     'ADMIN_PROVISION_LOCAL_TENANT',
      entity:     'Tenant',
      resourceId: tenant.id,
      ipAddress:  req.ip ?? req.headers['x-forwarded-for'],
      userAgent:  req.headers['user-agent'],
      details:    `Tenant ${name} criado localmente a partir de Organização órfã do Logto (${logtoId}).`,
      after:      tenant,
    });

    res.json({ success: true, tenant });
  } catch (error) {
    logger.error('Erro ao provisionar tenant local a partir de org órfã', { logtoId, err: error.message });
    res.status(500).json({ error: 'Falha ao criar tenant no banco local.', detail: error.message });
  }
});

module.exports = router;

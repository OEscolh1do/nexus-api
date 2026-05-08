const prismaSumauma = require('./prismaSumauma');
const logger = require('./logger');
const { listLogtoUsers, listLogtoOrgs } = require('./logtoClient');

/**
 * Executa a auditoria de identidade completa comparando o banco local com o Logto.
 * @returns {Promise<object>} Relatório de auditoria
 */
async function runIdentityAudit() {
  const [localUsers, localTenants, logtoUsers, logtoOrgs] = await Promise.all([
    prismaSumauma.user.findMany({
      select: { 
        id: true, 
        email: true, 
        username: true, 
        fullName: true, 
        role: true,
        authProviderId: true, 
        status: true, 
        tenant: { select: { id: true, name: true, logtoOrgId: true } } 
      }
    }),
    prismaSumauma.tenant.findMany({
      select: { id: true, name: true, logtoOrgId: true, type: true }
    }),
    listLogtoUsers(100),
    listLogtoOrgs(100),
  ]);

  const localUserMap = new Map(localUsers.filter(u => u.authProviderId).map(u => [u.authProviderId, u]));
  const logtoUserMap = new Map(logtoUsers.map(u => [u.id, u]));
  const logtoOrgMap  = new Map(logtoOrgs.map(o => [o.id, o]));
  const localTenantByLogtoId = new Map(localTenants.filter(t => t.logtoOrgId).map(t => [t.logtoOrgId, t]));

  // 1. Usuários Órfãos no Logto
  const orphansInLogto = logtoUsers
    .filter(u => !localUserMap.has(u.id))
    .map(u => ({
      logtoId: u.id,
      email: u.primaryEmail,
      name: u.name,
      username: u.username,
      organizations: (u.organizationIds || []).map(id => logtoOrgMap.get(id)?.name || id)
    }));

  // 2. Usuários Ausentes no Logto
  const missingInLogto = localUsers
    .filter(u => u.status !== 'BLOCKED' && (!u.authProviderId || !logtoUserMap.has(u.authProviderId)))
    .map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      tenantName: u.tenant?.name || 'N/A',
      authProviderId: u.authProviderId
    }));

  // 3. Organizações Órfãs no Logto
  const orphanOrgsInLogto = logtoOrgs
    .filter(o => !localTenantByLogtoId.has(o.id))
    .map(o => ({
      logtoId: o.id,
      name: o.name,
      description: o.description
    }));

  // 4. Organizações Ausentes no Logto
  const missingOrgsInLogto = localTenants
    .filter(t => !t.logtoOrgId || !logtoOrgMap.has(t.logtoOrgId))
    .map(t => ({
      id: t.id,
      name: t.name,
      type: t.type,
      logtoOrgId: t.logtoOrgId
    }));

  // 5. Membership Mismatches
  const membershipMismatches = localUsers
    .filter(u => u.authProviderId && logtoUserMap.has(u.authProviderId) && u.tenant?.logtoOrgId)
    .map(u => {
      const logtoUser = logtoUserMap.get(u.authProviderId);
      const expectedOrgId = u.tenant.logtoOrgId;
      const hasOrg = (logtoUser.organizationIds || []).includes(expectedOrgId);
      
      if (!hasOrg) {
        return {
          userId: u.id,
          username: u.username,
          tenantName: u.tenant.name,
          expectedOrgId,
          currentOrgs: (logtoUser.organizationIds || []).map(id => logtoOrgMap.get(id)?.name || id)
        };
      }
      return null;
    })
    .filter(Boolean);

  // 6. Deep Sync (Atributos)
  const attributeMismatches = localUsers
    .filter(u => u.authProviderId && logtoUserMap.has(u.authProviderId))
    .flatMap(u => {
      const logtoUser = logtoUserMap.get(u.authProviderId);
      const mismatches = [];

      if (u.fullName !== logtoUser.name) {
        mismatches.push({ userId: u.id, username: u.username, field: 'name', local: u.fullName, logto: logtoUser.name });
      }
      if (u.email !== logtoUser.primaryEmail) {
        mismatches.push({ userId: u.id, username: u.username, field: 'email', local: u.email, logto: logtoUser.primaryEmail });
      }
      const logtoRole = logtoUser.customData?.role;
      if (logtoRole && u.role !== logtoRole) {
        mismatches.push({ userId: u.id, username: u.username, field: 'role', local: u.role, logto: logtoRole });
      }

      return mismatches;
    });

  const report = {
    checkedAt: new Date().toISOString(),
    summary: {
      total_local: localUsers.length,
      total_logto: logtoUsers.length,
      orphans_count: orphansInLogto.length,
      missing_count: missingInLogto.length,
      orphan_orgs_count: orphanOrgsInLogto.length,
      missing_orgs_count: missingOrgsInLogto.length,
      membership_mismatch_count: membershipMismatches.length,
      attribute_mismatch_count: attributeMismatches.length
    },
    orphansInLogto,
    missingInLogto,
    attributeMismatches,
    organizations: {
      orphans: orphanOrgsInLogto,
      missing: missingOrgsInLogto
    },
    membershipMismatches
  };

  return report;
}

/**
 * Salva um relatório de auditoria no histórico.
 */
async function saveAuditHistory(report) {
  try {
    await prismaSumauma.identityAuditHistory.create({
      data: {
        summary: report.summary,
        report: report,
        status: 'SUCCESS'
      }
    });
    logger.info('Histórico de auditoria de identidade salvo');
  } catch (error) {
    logger.error('Falha ao salvar histórico de auditoria', { err: error.message });
  }
}

module.exports = { runIdentityAudit, saveAuditHistory };

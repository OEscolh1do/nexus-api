const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const fs = require('fs');

const prisma = new PrismaClient();

// ==================== CONFIGURAÇÃO ====================
const CONFIG = {
  DRY_RUN: process.env.DRY_RUN === 'true',
  BATCH_SIZE: parseInt(process.env.BATCH_SIZE) || 20,
  BATCH_DELAY_MS: 2000,
  MIN_PROJECT_YEAR: 2024,
  ALLOWED_STATUSES: ['ATIVO', 'EM_ANDAMENTO'],
  ENABLE_LOCKS: true,
  CHECKPOINT_EVERY: 5,
};

console.log('🚀 Migration Configuration:');
console.log(JSON.stringify(CONFIG, null, 2));

if (CONFIG.DRY_RUN) {
  console.warn('\n⚠️  ⚠️  ⚠️  DRY-RUN MODE - Nenhuma mudança será persistida! ⚠️  ⚠️  ⚠️\n');
}

// ==================== ZOD SCHEMAS ====================
const SolarDataSchema = z.object({
  inputData: z.object({
    roof: z.object({
      type: z.string(),
      area: z.number().positive().optional(),
      orientation: z.string().optional()
    }).optional(),
    energy: z.object({
      monthlyConsumption: z.number().positive(),
      averageBill: z.number().positive().optional()
    })
  }),
  proposalData: z.object({
    systemPower: z.number().positive(),
    modules: z.array(z.object({
      brand: z.string(),
      model: z.string(),
      quantity: z.number().int().positive(),
      power: z.number().positive()
    })),
    inverters: z.array(z.any()).optional()
  }),
  version: z.number().optional().default(1)
});

// ==================== HELPERS ====================
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function deepEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

function mockCreate(entity) {
  const id = `mock_${entity}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`    [DRY-RUN] Would create ${entity}: ${id}`);
  return Promise.resolve({ id });
}

function mockUpdate(entity) {
  console.log(`    [DRY-RUN] Would update ${entity}`);
  return Promise.resolve({});
}

// ==================== VALIDAÇÃO ====================
async function validateSolarData(project) {
  try {
    if (!project.details) {
      return { valid: false, error: 'Project has no details' };
    }

    const data = JSON.parse(project.details);
    SolarDataSchema.parse(data);
    
    return { valid: true, data };
  } catch (error) {
    return { 
      valid: false, 
      error: error.message,
      projectId: project.id 
    };
  }
}

// ==================== IDEMPOTÊNCIA ====================
async function isAlreadyMigrated(projectId, tx = prisma) {
  // Check 1: Project já tem quoteId?
  const project = await tx.project.findUnique({
    where: { id: projectId },
    select: { quoteId: true }
  });
  
  if (project?.quoteId) {
    return { migrated: true, reason: 'already_has_quote', quoteId: project.quoteId };
  }
  
  // Check 2: Existe registro de migração anterior?
  const auditRecord = await tx.migrationAudit?.findFirst({
    where: {
      projectId,
      status: 'SUCCESS'
    }
  }).catch(() => null); // Tabela pode não existir ainda
  
  if (auditRecord) {
    return { migrated: true, reason: 'found_in_audit', quoteId: auditRecord.quoteId };
  }
  
  // Check 3: Existe Lead com metadata apontando para este project?
  const lead = await tx.lead.findFirst({
    where: {
      source: 'MIGRATION',
      metadata: { contains: projectId }
    }
  }).catch(() => null);
  
  if (lead) {
    return { migrated: true, reason: 'lead_exists', leadId: lead.id };
  }
  
  return { migrated: false };
}

// ==================== GERAÇÃO DE NÚMEROS ÚNICOS ====================
async function generateUniqueQuoteNumber(tx = prisma) {
  let attempts = 0;
  const MAX_ATTEMPTS = 10;
  
  while (attempts < MAX_ATTEMPTS) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    const number = `QT-MIG-${timestamp}-${random}`;
    
    const exists = await tx.quote.findUnique({
      where: { quoteNumber: number }
    });
    
    if (!exists) return number;
    attempts++;
    await sleep(10); // Pequeno delay para mudar timestamp
  }
  
  throw new Error('Failed to generate unique quote number after 10 attempts');
}

// ==================== ESTIMATIVA COMERCIAL ====================
function estimateCommercialValues(solarData, project) {
  const { proposalData, inputData } = solarData;
  
  // 1. Custo base dos equipamentos
  const moduleCost = proposalData.modules.reduce((sum, m) => 
    sum + (m.quantity * m.power * 2.5), // R$2,50/Wp
  0);
  
  const inverterCost = (proposalData.inverters?.length || 1) * 3000;
  const baseCost = moduleCost + inverterCost;
  
  // 2. Complexidade da instalação (1.0 a 1.8)
  let complexity = 1.0;
  const roofType = inputData.roof?.type || 'ceramic';
  
  if (roofType === 'metal') complexity += 0.1;
  if (roofType === 'slab') complexity += 0.2;
  if (roofType === 'fiber_cement') complexity += 0.3;
  if (proposalData.systemPower > 20) complexity += 0.2; // Sistema grande
  
  // 3. Ajuste de inflação por ano
  const projectYear = new Date(project.createdAt).getFullYear();
  const currentYear = new Date().getFullYear();
  const yearsGap = currentYear - projectYear;
  const inflationFactor = Math.pow(1.05, yearsGap); // 5% a.a.
  
  // 4. Cálculo final
  const totalCost = Math.round(baseCost * complexity * inflationFactor);
  const proposedPrice = Math.round(totalCost / 0.68); // Margem 32%
  const margin = ((proposedPrice - totalCost) / proposedPrice) * 100;
  
  return {
    totalCost,
    proposedPrice,
    margin: Math.round(margin * 10) / 10,
    metadata: {
      baseCost,
      complexity,
      inflationFactor,
      isEstimated: true,
      estimatedAt: new Date()
    }
  };
}

// ==================== AUDIT LOG ====================
async function logAudit(tx, data) {
  if (CONFIG.DRY_RUN) {
    console.log(`    [DRY-RUN] Would log audit:`, data.action, data.status);
    return;
  }

  try {
    await tx.migrationAudit.create({
      data: {
        ...data,
        dryRun: CONFIG.DRY_RUN,
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined
      }
    });
  } catch (error) {
    console.warn(`    ⚠️  Failed to log audit: ${error.message}`);
  }
}

// ==================== MIGRAÇÃO DE PROJECT ====================
async function migrateProject(project, batchNumber) {
  const startTime = Date.now();
  
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Lock pessimista (previne concorrência)
      if (CONFIG.ENABLE_LOCKS && !CONFIG.DRY_RUN) {
        await tx.$executeRaw`SELECT * FROM Project WHERE id = ${project.id} FOR UPDATE`;
      }
      
      // 2. Double-check de idempotência
      const check = await isAlreadyMigrated(project.id, tx);
      if (check.migrated) {
        await logAudit(tx, {
          batchNumber,
          projectId: project.id,
          action: 'CHECK_IDEMPOTENCY',
          status: 'SKIPPED',
          duration_ms: Date.now() - startTime,
          metadata: { reason: check.reason }
        });
        return { status: 'SKIPPED', reason: check.reason };
      }
      
      // 3. Validar solarData
      const validation = await validateSolarData(project);
      if (!validation.valid) {
        await logAudit(tx, {
          batchNumber,
          projectId: project.id,
          action: 'VALIDATE_SCHEMA',
          status: 'FAILED',
          errorMessage: validation.error,
          duration_ms: Date.now() - startTime
        });
        return { status: 'FAILED', error: validation.error };
      }
      
      // 4. Criar Lead fictício
      const lead = CONFIG.DRY_RUN ? await mockCreate('lead') : await tx.lead.create({
        data: {
          name: `[MIGRADO] ${project.title}`,
          email: `migrated_${project.id}@nexus.internal`,
          phone: 'N/A',
          source: 'MIGRATION',
          status: 'WON',
          estimatedBudget: validation.data.inputData.energy?.averageBill * 12 * 20 || 100000,
          metadata: JSON.stringify({
            migratedFrom: project.id,
            migrationDate: new Date().toISOString(),
            originalCreatedAt: project.createdAt
          }),
          createdBy: project.managerId || 'SYSTEM'
        }
      });
      
      await logAudit(tx, {
        batchNumber,
        projectId: project.id,
        leadId: lead.id,
        action: 'CREATE_LEAD',
        status: 'SUCCESS',
        duration_ms: Date.now() - startTime
      });
      
      // 5. Estimar valores comerciais
      const commercialValues = estimateCommercialValues(validation.data, project);
      
      // 6. Criar Quote Aprovado
      const quoteNumber = await generateUniqueQuoteNumber(tx);
      const quote = CONFIG.DRY_RUN ? await mockCreate('quote') : await tx.quote.create({
        data: {
          quoteNumber,
          version: 1,
          status: 'APPROVED',
          leadId: lead.id,
          solarData: validation.data,
          totalCost: commercialValues.totalCost,
          proposedPrice: commercialValues.proposedPrice,
          margin: commercialValues.margin,
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 ano
          createdAt: project.createdAt,
          createdBy: project.managerId || 'SYSTEM',
          approvedBy: project.managerId || 'SYSTEM',
          metadata: JSON.stringify({
            isMigrated: true,
            valuesAreEstimated: true,
            originalProjectId: project.id,
            estimationMetadata: commercialValues.metadata
          })
        }
      });
      
      await logAudit(tx, {
        batchNumber,
        projectId: project.id,
        leadId: lead.id,
        quoteId: quote.id,
        action: 'CREATE_QUOTE',
        status: 'SUCCESS',
        duration_ms: Date.now() - startTime
      });
      
      // 7. Atualizar Project.quoteId
      await (CONFIG.DRY_RUN ? mockUpdate('project') : tx.project.update({
        where: { id: project.id },
        data: { quoteId: quote.id }
      }));
      
      await logAudit(tx, {
        batchNumber,
        projectId: project.id,
        leadId: lead.id,
        quoteId: quote.id,
        action: 'UPDATE_PROJECT',
        status: 'SUCCESS',
        duration_ms: Date.now() - startTime
      });
      
      // 8. Validação Cross-Schema
      if (!CONFIG.DRY_RUN) {
        const projectData = JSON.parse(project.details);
        const isValid = deepEqual(projectData, quote.solarData);
        
        if (!isValid) {
          console.error(`    ❌ Cross-schema validation failed for ${project.id}`);
          throw new Error('Cross-schema validation failed: data mismatch');
        }
      }
      
      return { 
        status: 'SUCCESS', 
        leadId: lead.id, 
        quoteId: quote.id,
        duration_ms: Date.now() - startTime
      };
      
    }, {
      timeout: 30000, // 30s timeout por project
      isolationLevel: 'Serializable'
    });
    
  } catch (error) {
    await logAudit(prisma, {
      batchNumber,
      projectId: project.id,
      action: 'MIGRATE_PROJECT',
      status: 'FAILED',
      errorMessage: error.message,
      duration_ms: Date.now() - startTime
    });
    
    return { status: 'FAILED', error: error.message };
  }
}

// ==================== GERAÇÃO DE RELATÓRIO HTML ====================
function generateHTMLReport(results, auditRecords) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Relatório de Migração Nexus</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 1400px; 
      margin: 0 auto; 
      padding: 40px 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
    h2 { color: #34495e; margin-top: 30px; }
    .success { color: #27ae60; font-weight: bold; }
    .failed { color: #e74c3c; font-weight: bold; }
    .skipped { color: #f39c12; font-weight: bold; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }
    .stat-card {
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-card.success { background: #d5f4e6; border-left: 4px solid #27ae60; }
    .stat-card.failed { background: #fadbd8; border-left: 4px solid #e74c3c; }
    .stat-card.skipped { background: #fef5e7; border-left: 4px solid #f39c12; }
    .stat-number { font-size: 48px; font-weight: bold; margin: 10px 0; }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 20px 0;
      font-size: 14px;
    }
    th, td { 
      border: 1px solid #ddd; 
      padding: 12px 8px; 
      text-align: left; 
    }
    th { 
      background: #3498db; 
      color: white;
      font-weight: 600;
      position: sticky;
      top: 0;
    }
    tr:nth-child(even) { background: #f9f9f9; }
    tr:hover { background: #f0f0f0; }
    pre {
      background: #2c3e50;
      color: #ecf0f1;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
    }
    .timestamp { color: #7f8c8d; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎊 Relatório de Migração - Nexus 2.0</h1>
    <p class="timestamp">Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
    
    <h2>📊 Resumo Executivo</h2>
    <div class="stats">
      <div class="stat-card success">
        <div>✅ Sucessos</div>
        <div class="stat-number">${results.success}</div>
      </div>
      <div class="stat-card failed">
        <div>❌ Falhas</div>
        <div class="stat-number">${results.failed}</div>
      </div>
      <div class="stat-card skipped">
        <div>⏭️ Pulados</div>
        <div class="stat-number">${results.skipped}</div>
      </div>
    </div>
    
    <p><strong>Taxa de Sucesso:</strong> ${((results.success / (results.success + results.failed + results.skipped)) * 100).toFixed(1)}%</p>
    
    <h2>📋 Detalhes por Registro</h2>
    <table>
      <tr>
        <th>Batch</th>
        <th>Project ID</th>
        <th>Action</th>
        <th>Status</th>
        <th>Lead ID</th>
        <th>Quote ID</th>
        <th>Duração (ms)</th>
        <th>Timestamp</th>
      </tr>
      ${auditRecords.map(r => `
        <tr class="${r.status.toLowerCase()}">
          <td>${r.batchNumber}</td>
          <td><code>${r.projectId.substring(0, 12)}...</code></td>
          <td>${r.action}</td>
          <td class="${r.status.toLowerCase()}">${r.status}</td>
          <td>${r.leadId ? `<code>${r.leadId.substring(0, 12)}...</code>` : 'N/A'}</td>
          <td>${r.quoteId ? `<code>${r.quoteId.substring(0, 12)}...</code>` : 'N/A'}</td>
          <td>${r.duration_ms || 0}</td>
          <td style="font-size: 11px">${new Date(r.timestamp).toLocaleString('pt-BR')}</td>
        </tr>
      `).join('')}
    </table>
    
    <h2>🔍 Queries de Validação</h2>
    <p>Execute estas queries para validar a migração:</p>
    <pre>
-- Projects migrados com sucesso
SELECT COUNT(*) as migrated_projects
FROM Project 
WHERE quoteId IS NOT NULL AND type = 'SOLAR';

-- Leads criados pela migração
SELECT COUNT(*) as migration_leads
FROM Lead 
WHERE source = 'MIGRATION';

-- Quotes aprovados da migração
SELECT COUNT(*) as migration_quotes
FROM Quote 
WHERE status = 'APPROVED' 
  AND JSON_EXTRACT(metadata, '$.isMigrated') = true;

-- Validação de integridade (deve ser 0)
SELECT COUNT(*) as integrity_issues
FROM Project p
LEFT JOIN Quote q ON p.quoteId = q.id
WHERE p.type = 'SOLAR' 
  AND p.quoteId IS NOT NULL 
  AND q.id IS NULL;
    </pre>
    
    <h2>📌 Próximos Passos</h2>
    <ul>
      <li>Validar manualmente 3-5 projects migrados</li>
      <li>Testar botão "Ver Orçamento" na UI</li>
      <li>Executar queries de validação acima</li>
      <li>Monitorar por 24-48h</li>
      <li>Arquivar este relatório</li>
    </ul>
  </div>
</body>
</html>
  `;
  
  const filename = `migration_report_${Date.now()}.html`;
  fs.writeFileSync(filename, html);
  console.log(`\n📄 Relatório HTML salvo em: ${filename}`);
  return filename;
}

// ==================== MAIN ====================
async function runMigration() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🚀 NEXUS 2.0 - MIGRATION SCRIPT v2.0 HARDENED');
  console.log('═══════════════════════════════════════════════════════\n');
  
  try {
    // 1. Buscar projects elegíveis
    console.log('📊 Buscando projects elegíveis para migração...\n');
    
    const projects = await prisma.project.findMany({
      where: {
        type: 'SOLAR',
        quoteId: null,
        status: { in: CONFIG.ALLOWED_STATUSES },
        createdAt: { gte: new Date(`${CONFIG.MIN_PROJECT_YEAR}-01-01`) },
        details: { not: null }
      },
      select: {
        id: true,
        title: true,
        details: true,
        createdAt: true,
        managerId: true,
        status: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`✅ Encontrados ${projects.length} projects elegíveis\n`);
    
    if (projects.length === 0) {
      console.log('✨ Nenhum project precisa de migração!');
      await prisma.$disconnect();
      return;
    }
    
    // 2. Processar em batches
    const totalBatches = Math.ceil(projects.length / CONFIG.BATCH_SIZE);
    const results = { success: 0, failed: 0, skipped: 0 };
    const startTime = Date.now();
    
    for (let i = 0; i < projects.length; i += CONFIG.BATCH_SIZE) {
      const batchNumber = Math.floor(i / CONFIG.BATCH_SIZE) + 1;
      const batch = projects.slice(i, i + CONFIG.BATCH_SIZE);
      
      console.log(`\n${'═'.repeat(60)}`);
      console.log(`📦 Batch ${batchNumber}/${totalBatches} (${batch.length} projects)`);
      console.log(`${'═'.repeat(60)}\n`);
      
      for (const project of batch) {
        const result = await migrateProject(project, batchNumber);
        
        if (result.status === 'SUCCESS') results.success++;
        else if (result.status === 'FAILED') results.failed++;
        else results.skipped++;
        
        const icon = result.status === 'SUCCESS' ? '✅' : 
                     result.status === 'FAILED' ? '❌' : '⏭️';
        const title = project.title.length > 40 ? project.title.substring(0, 40) + '...' : project.title;
        
        console.log(`  ${icon} ${title}`);
        if (result.error) {
          console.log(`      └─ Erro: ${result.error}`);
        }
      }
      
      // Checkpoint
      if (batchNumber % CONFIG.CHECKPOINT_EVERY === 0) {
        console.log(`\n💾 === CHECKPOINT: Batch ${batchNumber} ===`);
        console.log(`   ✅ Sucessos: ${results.success}`);
        console.log(`   ❌ Falhas: ${results.failed}`);
        console.log(`   ⏭️  Pulados: ${results.skipped}`);
      }
      
      // Breathing room
      if (i + CONFIG.BATCH_SIZE < projects.length) {
        console.log(`\n⏱️  Aguardando ${CONFIG.BATCH_DELAY_MS}ms antes do próximo batch...`);
        await sleep(CONFIG.BATCH_DELAY_MS);
      }
    }
    
    // 3. Resumo final
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('\n\n' + '═'.repeat(60));
    console.log('🎊 MIGRAÇÃO CONCLUÍDA!');
    console.log('═'.repeat(60));
    console.log(`\n⏱️  Duração total: ${duration}s`);
    console.log(`\n📊 Resultados:`);
    console.log(`   ✅ Sucessos: ${results.success}`);
    console.log(`   ❌ Falhas: ${results.failed}`);
    console.log(`   ⏭️  Pulados: ${results.skipped}`);
    console.log(`   📈 Taxa de sucesso: ${((results.success / projects.length) * 100).toFixed(1)}%`);
    
    // 4. Gerar relatório HTML
    if (!CONFIG.DRY_RUN) {
      const auditRecords = await prisma.migrationAudit.findMany({
        orderBy: { timestamp: 'asc' }
      });
      
      generateHTMLReport(results, auditRecords);
    }
    
    console.log('\n✨ Script finalizado com sucesso!\n');
    
  } catch (error) {
    console.error('\n❌ ERRO CRÍTICO NA MIGRAÇÃO:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
runMigration();

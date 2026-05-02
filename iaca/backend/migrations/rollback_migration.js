const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

// ==================== CONFIGURAÇÃO ====================
const CONFIG = {
  DRY_RUN: process.env.DRY_RUN === 'true',
  FORCE: process.env.FORCE === 'true', // Skip confirmações
};

console.log('🔄 NEXUS 2.0 - ROLLBACK SCRIPT v1.0');
console.log('═══════════════════════════════════════════════════════\n');
console.log('Configuration:');
console.log(JSON.stringify(CONFIG, null, 2));
console.log('');

if (CONFIG.DRY_RUN) {
  console.warn('⚠️  DRY-RUN MODE - Nenhuma mudança será persistida!\n');
}

// ==================== HELPERS ====================
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function confirm(message) {
  if (CONFIG.FORCE) {
    console.log(`${message} [FORCE mode - auto yes]`);
    return true;
  }
  
  const answer = await question(`${message} (yes/no): `);
  return answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y';
}

// ==================== ANÁLISE ====================
async function analyzeMigration() {
  console.log('📊 Analisando estado atual da migração...\n');
  
  // 1. Audit records
  const auditStats = await prisma.$queryRaw`
    SELECT 
      status,
      COUNT(*) as count,
      MIN(batchNumber) as min_batch,
      MAX(batchNumber) as max_batch
    FROM MigrationAudit
    GROUP BY status
  `;
  
  console.log('📋 Registros de Audit:');
  console.table(auditStats);
  
  // 2. Migrated projects
  const migratedCount = await prisma.project.count({
    where: {
      type: 'SOLAR',
      quoteId: { not: null }
    }
  });
  
  console.log(`\n📦 Projects migrados: ${migratedCount}`);
  
  // 3. Migration leads
  const migrationLeads = await prisma.lead.count({
    where: { source: 'MIGRATION' }
  });
  
  console.log(`👤 Leads de migração: ${migrationLeads}`);
  
  // 4. Migration quotes
  const migrationQuotes = await prisma.quote.count({
    where: {
      status: 'APPROVED',
      metadata: { contains: 'isMigrated":true' }
    }
  });
  
  console.log(`📄 Quotes de migração: ${migrationQuotes}\n`);
  
  return {
    auditStats,
    migratedCount,
    migrationLeads,
    migrationQuotes
  };
}

// ==================== ROLLBACK FUNCTIONS ====================

/**
 * Reverter um batch específico
 */
async function rollbackBatch(batchNumber) {
  console.log(`\n🔄 Revertendo Batch ${batchNumber}...\n`);
  
  const records = await prisma.migrationAudit.findMany({
    where: { 
      batchNumber,
      status: 'SUCCESS'
    },
    orderBy: { timestamp: 'desc' } // Reverter na ordem inversa
  });
  
  if (records.length === 0) {
    console.log(`⚠️  Nenhum registro encontrado para batch ${batchNumber}`);
    return { reverted: 0, failed: 0 };
  }
  
  console.log(`📋 Encontrados ${records.length} registros para reverter`);
  
  const results = { reverted: 0, failed: 0 };
  
  for (const record of records) {
    try {
      if (CONFIG.DRY_RUN) {
        console.log(`  [DRY-RUN] Would revert: ${record.projectId}`);
        results.reverted++;
        continue;
      }
      
      await prisma.$transaction(async (tx) => {
        // 1. Remover quoteId do project
        await tx.project.update({
          where: { id: record.projectId },
          data: { quoteId: null }
        });
        
        // 2. Deletar quote
        if (record.quoteId) {
          await tx.quote.delete({ 
            where: { id: record.quoteId }
          });
        }
        
        // 3. Deletar lead
        if (record.leadId) {
          await tx.lead.delete({ 
            where: { id: record.leadId }
          });
        }
        
        // 4. Atualizar audit record
        await tx.migrationAudit.update({
          where: { id: record.id },
          data: { 
            status: 'ROLLED_BACK',
            metadata: JSON.stringify({
              ...(typeof record.metadata === 'string' ? JSON.parse(record.metadata) : record.metadata),
              rolledBackAt: new Date().toISOString()
            })
          }
        });
      });
      
      console.log(`  ✅ Revertido: ${record.projectId}`);
      results.reverted++;
      
    } catch (error) {
      console.error(`  ❌ Erro ao reverter ${record.projectId}: ${error.message}`);
      results.failed++;
    }
  }
  
  console.log(`\n✅ Batch ${batchNumber} processado:`);
  console.log(`   Revertidos: ${results.reverted}`);
  console.log(`   Falhas: ${results.failed}`);
  
  return results;
}

/**
 * Reverter múltiplos batches
 */
async function rollbackBatches(batchNumbers) {
  const totalResults = { reverted: 0, failed: 0 };
  
  for (const batchNumber of batchNumbers) {
    const result = await rollbackBatch(batchNumber);
    totalResults.reverted += result.reverted;
    totalResults.failed += result.failed;
  }
  
  return totalResults;
}

/**
 * Reverter TUDO (rollback total)
 */
async function rollbackAll() {
  console.log('\n🚨 ROLLBACK TOTAL - Revertendo TODA a migração\n');
  
  const batches = await prisma.$queryRaw`
    SELECT DISTINCT batchNumber 
    FROM MigrationAudit 
    WHERE status = 'SUCCESS'
    ORDER BY batchNumber DESC
  `;
  
  if (batches.length === 0) {
    console.log('⚠️  Nenhum batch para reverter');
    return { reverted: 0, failed: 0 };
  }
  
  console.log(`📦 Encontrados ${batches.length} batches para reverter`);
  console.log(`Batches: ${batches.map(b => b.batchNumber).join(', ')}\n`);
  
  const confirmed = await confirm('⚠️  CONFIRMAR ROLLBACK TOTAL?');
  
  if (!confirmed) {
    console.log('\n❌ Rollback cancelado pelo usuário');
    return { reverted: 0, failed: 0 };
  }
  
  const batchNumbers = batches.map(b => b.batchNumber);
  return await rollbackBatches(batchNumbers);
}

/**
 * Reverter apenas os últimos N batches
 */
async function rollbackLastN(n) {
  console.log(`\n🔄 Revertendo últimos ${n} batches...\n`);
  
  const batches = await prisma.$queryRaw`
    SELECT DISTINCT batchNumber 
    FROM MigrationAudit 
    WHERE status = 'SUCCESS'
    ORDER BY batchNumber DESC
    LIMIT ${n}
  `;
  
  if (batches.length === 0) {
    console.log('⚠️  Nenhum batch para reverter');
    return { reverted: 0, failed: 0 };
  }
  
  const batchNumbers = batches.map(b => b.batchNumber);
  console.log(`📦 Batches a reverter: ${batchNumbers.join(', ')}\n`);
  
  const confirmed = await confirm(`Reverter ${batches.length} batch(es)?`);
  
  if (!confirmed) {
    console.log('\n❌ Rollback cancelado');
    return { reverted: 0, failed: 0 };
  }
  
  return await rollbackBatches(batchNumbers);
}

/**
 * Reverter projects específicos por ID
 */
async function rollbackProjects(projectIds) {
  console.log(`\n🔄 Revertendo ${projectIds.length} projects específicos...\n`);
  
  const results = { reverted: 0, failed: 0 };
  
  for (const projectId of projectIds) {
    try {
      console.log(`\n  Processando: ${projectId}`);
      
      // Buscar registros de migração deste project
      const records = await prisma.migrationAudit.findMany({
        where: {
          projectId,
          status: 'SUCCESS'
        }
      });
      
      if (records.length === 0) {
        console.log(`    ⚠️  Nenhum registro de migração encontrado`);
        continue;
      }
      
      // Usar o último registro (mais recente)
      const record = records[records.length - 1];
      
      if (CONFIG.DRY_RUN) {
        console.log(`    [DRY-RUN] Would revert this project`);
        results.reverted++;
        continue;
      }
      
      await prisma.$transaction(async (tx) => {
        await tx.project.update({
          where: { id: projectId },
          data: { quoteId: null }
        });
        
        if (record.quoteId) {
          await tx.quote.delete({ where: { id: record.quoteId }});
        }
        
        if (record.leadId) {
          await tx.lead.delete({ where: { id: record.leadId }});
        }
        
        // Atualizar TODOS os records deste project
        await tx.migrationAudit.updateMany({
          where: { projectId },
          data: { 
            status: 'ROLLED_BACK',
            metadata: JSON.stringify({
              rolledBackAt: new Date().toISOString()
            })
          }
        });
      });
      
      console.log(`    ✅ Revertido com sucesso`);
      results.reverted++;
      
    } catch (error) {
      console.error(`    ❌ Erro: ${error.message}`);
      results.failed++;
    }
  }
  
  console.log(`\n✅ Processamento concluído:`);
  console.log(`   Revertidos: ${results.reverted}`);
  console.log(`   Falhas: ${results.failed}`);
  
  return results;
}

// ==================== MENU INTERATIVO ====================
async function showMenu() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║         MENU DE ROLLBACK - Escolha uma opção     ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');
  console.log('1. Reverter batch específico');
  console.log('2. Reverter múltiplos batches');
  console.log('3. Reverter últimos N batches');
  console.log('4. Reverter TUDO (rollback total)');
  console.log('5. Reverter projects específicos por ID');
  console.log('6. Analisar estado atual');
  console.log('0. Sair\n');
  
  const choice = await question('Escolha uma opção: ');
  return choice.trim();
}

async function interactiveMode() {
  let continuar = true;
  
  while (continuar) {
    const choice = await showMenu();
    
    switch (choice) {
      case '1': {
        const batchNum = await question('\nNúmero do batch: ');
        await rollbackBatch(parseInt(batchNum));
        break;
      }
      
      case '2': {
        const batchesStr = await question('\nNúmeros dos batches (separados por vírgula): ');
        const batches = batchesStr.split(',').map(n => parseInt(n.trim()));
        await rollbackBatches(batches);
        break;
      }
      
      case '3': {
        const n = await question('\nQuantos batches reverter? ');
        await rollbackLastN(parseInt(n));
        break;
      }
      
      case '4': {
        await rollbackAll();
        break;
      }
      
      case '5': {
        const idsStr = await question('\nIDs dos projects (separados por vírgula):\n');
        const ids = idsStr.split(',').map(id => id.trim());
        await rollbackProjects(ids);
        break;
      }
      
      case '6': {
        await analyzeMigration();
        break;
      }
      
      case '0': {
        continuar = false;
        console.log('\n👋 Encerrando...\n');
        break;
      }
      
      default: {
        console.log('\n❌ Opção inválida!\n');
      }
    }
    
    if (continuar && choice !== '6') {
      const continueMenu = await confirm('\nVoltar ao menu?');
      if (!continueMenu) {
        continuar = false;
        console.log('\n👋 Encerrando...\n');
      }
    }
  }
}

// ==================== CLI MODE ====================
async function cliMode() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Uso CLI:');
    console.log('  node rollback_migration.js --batch <número>');
    console.log('  node rollback_migration.js --batches <num1,num2,num3>');
    console.log('  node rollback_migration.js --last <N>');
    console.log('  node rollback_migration.js --all');
    console.log('  node rollback_migration.js --projects <id1,id2,id3>');
    console.log('  node rollback_migration.js --analyze');
    console.log('\nFlags:');
    console.log('  DRY_RUN=true   - Simular sem persistir');
    console.log('  FORCE=true     - Pular confirmações');
    console.log('\nSem argumentos = Modo interativo\n');
    return false;
  }
  
  const command = args[0];
  
  switch (command) {
    case '--batch': {
      if (!args[1]) {
        console.error('❌ Especifique o número do batch');
        return true;
      }
      await rollbackBatch(parseInt(args[1]));
      return true;
    }
    
    case '--batches': {
      if (!args[1]) {
        console.error('❌ Especifique os números dos batches');
        return true;
      }
      const batches = args[1].split(',').map(n => parseInt(n.trim()));
      await rollbackBatches(batches);
      return true;
    }
    
    case '--last': {
      if (!args[1]) {
        console.error('❌ Especifique quantos batches reverter');
        return true;
      }
      await rollbackLastN(parseInt(args[1]));
      return true;
    }
    
    case '--all': {
      await rollbackAll();
      return true;
    }
    
    case '--projects': {
      if (!args[1]) {
        console.error('❌ Especifique os IDs dos projects');
        return true;
      }
      const ids = args[1].split(',').map(id => id.trim());
      await rollbackProjects(ids);
      return true;
    }
    
    case '--analyze': {
      await analyzeMigration();
      return true;
    }
    
    default: {
      console.error(`❌ Comando desconhecido: ${command}`);
      return true;
    }
  }
}

// ==================== MAIN ====================
async function main() {
  try {
    // Tentar CLI mode primeiro
    const wasCliMode = await cliMode();
    
    // Se não foi CLI, entrar em modo interativo
    if (!wasCliMode) {
      await interactiveMode();
    }
    
    console.log('\n✨ Rollback script finalizado\n');
    
  } catch (error) {
    console.error('\n❌ ERRO CRÍTICO:');
    console.error(error);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();

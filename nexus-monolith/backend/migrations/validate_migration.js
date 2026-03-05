const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const fs = require('fs');

const prisma = new PrismaClient();

// ==================== CONFIGURAÇÃO ====================
const CONFIG = {
  VERBOSE: process.env.VERBOSE === 'true',
  GENERATE_REPORT: process.env.NO_REPORT !== 'true',
  SAMPLE_SIZE: parseInt(process.env.SAMPLE_SIZE) || 5, // Amostras para validação profunda
};

console.log('🔍 NEXUS 2.0 - MIGRATION VALIDATION SCRIPT v1.0');
console.log('═══════════════════════════════════════════════════════\n');

// ==================== TESTES ====================
const tests = [];
let passedTests = 0;
let failedTests = 0;
let warnings = 0;

class TestResult {
  constructor(name, category) {
    this.name = name;
    this.category = category;
    this.status = 'RUNNING';
    this.message = '';
    this.details = [];
    this.startTime = Date.now();
    this.duration = 0;
  }
  
  pass(message = '') {
    this.status = 'PASS';
    this.message = message;
    this.duration = Date.now() - this.startTime;
    passedTests++;
    console.log(`  ✅ ${this.name} ${message ? `- ${message}` : ''}`);
  }
  
  fail(message, details = []) {
    this.status = 'FAIL';
    this.message = message;
    this.details = details;
    this.duration = Date.now() - this.startTime;
    failedTests++;
    console.log(`  ❌ ${this.name} - ${message}`);
    if (details.length > 0 && CONFIG.VERBOSE) {
      details.forEach(d => console.log(`     └─ ${d}`));
    }
  }
  
  warn(message, details = []) {
    this.status = 'WARN';
    this.message = message;
    this.details = details;
    this.duration = Date.now() - this.startTime;
    warnings++;
    console.log(`  ⚠️  ${this.name} - ${message}`);
    if (details.length > 0 && CONFIG.VERBOSE) {
      details.forEach(d => console.log(`     └─ ${d}`));
    }
  }
}

function test(name, category) {
  const result = new TestResult(name, category);
  tests.push(result);
  return result;
}

// ==================== CATEGORIA 1: CONTAGENS ====================
async function testCounts() {
  console.log('\n📊 CATEGORIA 1: Validação de Contagens\n');
  
  // Test 1.1: Projects migrados
  const t1 = test('Projects SOLAR com quoteId', 'Contagens');
  const migratedCount = await prisma.project.count({
    where: {
      type: 'SOLAR',
      quoteId: { not: null }
    }
  });
  
  if (migratedCount > 0) {
    t1.pass(`${migratedCount} projects migrados`);
  } else {
    t1.warn('Nenhum project migrado encontrado');
  }
  
  // Test 1.2: Leads de migração
  const t2 = test('Leads de migração criados', 'Contagens');
  const leadsCount = await prisma.lead.count({
    where: { source: 'MIGRATION' }
  });
  
  if (leadsCount === migratedCount) {
    t2.pass(`${leadsCount} leads criados (match com projects)`);
  } else if (leadsCount > 0) {
    t2.warn(`${leadsCount} leads, mas ${migratedCount} projects`, [
      `Diferença: ${Math.abs(leadsCount - migratedCount)}`
    ]);
  } else {
    t2.fail('Nenhum lead de migração criado');
  }
  
  // Test 1.3: Quotes aprovados
  const t3 = test('Quotes aprovados da migração', 'Contagens');
  const quotesCount = await prisma.quote.count({
    where: {
      status: 'APPROVED'
    }
  });
  
  if (quotesCount >= migratedCount) {
    t3.pass(`${quotesCount} quotes aprovados`);
  } else if (quotesCount > 0) {
    t3.warn(`${quotesCount} quotes, esperados pelo menos ${migratedCount}`);
  } else {
    t3.fail('Nenhum quote aprovado encontrado');
  }
  
  // Test 1.4: Audit records
  const t4 = test('Registros de audit criados', 'Contagens');
  const auditCount = await prisma.migrationAudit?.count().catch(() => 0);
  
  if (auditCount > 0) {
    t4.pass(`${auditCount} registros de audit`);
  } else {
    t4.warn('Nenhum registro de audit (tabela pode não existir)');
  }
  
  return { migratedCount, leadsCount, quotesCount, auditCount };
}

// ==================== CATEGORIA 2: INTEGRIDADE REFERENCIAL ====================
async function testReferentialIntegrity() {
  console.log('\n🔗 CATEGORIA 2: Integridade Referencial\n');
  
  // Test 2.1: Orphan quotes (quotes sem lead)
  const t1 = test('Quotes sem Lead associado', 'Integridade');
  const orphanQuotes = await prisma.quote.findMany({
    where: {
      lead: null
    },
    select: { id: true, quoteNumber: true }
  });
  
  if (orphanQuotes.length === 0) {
    t1.pass('Nenhum quote órfão');
  } else {
    t1.fail(`${orphanQuotes.length} quotes sem lead`, 
      orphanQuotes.slice(0, 5).map(q => q.quoteNumber)
    );
  }
  
  // Test 2.2: Projects apontando para quotes inexistentes
  const t2 = test('Projects com quoteId inválido', 'Integridade');
  const invalidProjects = await prisma.$queryRaw`
    SELECT p.id, p.title, p.quoteId
    FROM Project p
    LEFT JOIN Quote q ON p.quoteId = q.id
    WHERE p.type = 'SOLAR'
      AND p.quoteId IS NOT NULL
      AND q.id IS NULL
  `;
  
  if (invalidProjects.length === 0) {
    t2.pass('Todas as referências válidas');
  } else {
    t2.fail(`${invalidProjects.length} projects com quoteId inválido`,
      invalidProjects.slice(0, 5).map(p => `${p.title} -> ${p.quoteId}`)
    );
  }
  
  // Test 2.3: Quotes sem project associado
  const t3 = test('Quotes sem Project usando eles', 'Integridade');
  const unusedQuotes = await prisma.$queryRaw`
    SELECT q.id, q.quoteNumber
    FROM Quote q
    LEFT JOIN Project p ON p.quoteId = q.id
    WHERE q.status = 'APPROVED'
      AND p.id IS NULL
  `;
  
  if (unusedQuotes.length === 0) {
    t3.pass('Todos os quotes aprovados estão associados');
  } else {
    t3.warn(`${unusedQuotes.length} quotes aprovados sem project`,
      unusedQuotes.slice(0, 5).map(q => q.quoteNumber)
    );
  }
  
  // Test 2.4: Leads sem quotes
  const t4 = test('Leads de migração sem Quotes', 'Integridade');
  const leadsWithoutQuotes = await prisma.lead.findMany({
    where: {
      source: 'MIGRATION',
      quotes: { none: {} }
    },
    select: { id: true, name: true }
  });
  
  if (leadsWithoutQuotes.length === 0) {
    t4.pass('Todos os leads têm quotes');
  } else {
    t4.fail(`${leadsWithoutQuotes.length} leads sem quotes`,
      leadsWithoutQuotes.slice(0, 5).map(l => l.name)
    );
  }
}

// ==================== CATEGORIA 3: CONSISTÊNCIA DE DADOS ====================
async function testDataConsistency() {
  console.log('\n🔬 CATEGORIA 3: Consistência de Dados\n');
  
  // Test 3.1: SolarData válido em Quotes
  const t1 = test('Validação de solarData nos Quotes', 'Consistência');
  const quotesWithInvalidData = [];
  
  const quotes = await prisma.quote.findMany({
    where: { status: 'APPROVED' },
    select: { id: true, quoteNumber: true, solarData: true },
    take: CONFIG.SAMPLE_SIZE
  });
  
  const solarDataSchema = z.object({
    inputData: z.object({
      energy: z.object({
        monthlyConsumption: z.number().positive()
      })
    }),
    proposalData: z.object({
      systemPower: z.number().positive(),
      modules: z.array(z.any()).min(1)
    })
  });
  
  for (const quote of quotes) {
    try {
      if (!quote.solarData) {
        quotesWithInvalidData.push(`${quote.quoteNumber}: solarData is null`);
        continue;
      }
      solarDataSchema.parse(quote.solarData);
    } catch (error) {
      quotesWithInvalidData.push(`${quote.quoteNumber}: ${error.message}`);
    }
  }
  
  if (quotesWithInvalidData.length === 0) {
    t1.pass(`${quotes.length} amostras validadas com sucesso`);
  } else {
    t1.fail(`${quotesWithInvalidData.length}/${quotes.length} amostras com dados inválidos`,
      quotesWithInvalidData
    );
  }
  
  // Test 3.2: Cross-validation solarData (Project.details === Quote.solarData)
  const t2 = test('Cross-validation Project.details == Quote.solarData', 'Consistência');
  const mismatchProjects = [];
  
  const projects = await prisma.project.findMany({
    where: {
      type: 'SOLAR',
      quoteId: { not: null }
    },
    include: { quote: true },
    take: CONFIG.SAMPLE_SIZE
  });
  
  for (const project of projects) {
    if (!project.quote) continue;
    
    try {
      const projectData = project.details ? JSON.parse(project.details) : null;
      const quoteData = project.quote.solarData;
      
      if (JSON.stringify(projectData) !== JSON.stringify(quoteData)) {
        mismatchProjects.push(`${project.title}: dados não coincidem`);
      }
    } catch (error) {
      mismatchProjects.push(`${project.title}: erro ao comparar - ${error.message}`);
    }
  }
  
  if (mismatchProjects.length === 0) {
    t2.pass(`${projects.length} amostras consistentes`);
  } else {
    t2.fail(`${mismatchProjects.length}/${projects.length} com dados divergentes`,
      mismatchProjects
    );
  }
  
  // Test 3.3: Valores comerciais preenchidos
  const t3 = test('Valores comerciais nos Quotes', 'Consistência');
  const quotesWithoutCommercial = await prisma.quote.count({
    where: {
      status: 'APPROVED',
      OR: [
        { proposedPrice: null },
        { totalCost: null },
        { margin: null }
      ]
    }
  });
  
  if (quotesWithoutCommercial === 0) {
    t3.pass('Todos os quotes têm valores comerciais');
  } else {
    t3.warn(`${quotesWithoutCommercial} quotes sem valores comerciais completos`);
  }
  
  // Test 3.4: Margens realistas (entre -10% e 60%)
  const t4 = test('Margens de lucro realistas', 'Consistência');
  const quotesWithWeirdMargins = await prisma.quote.findMany({
    where: {
      status: 'APPROVED',
      OR: [
        { margin: { lt: -10 } },
        { margin: { gt: 60 } }
      ]
    },
    select: { quoteNumber: true, margin: true }
  });
  
  if (quotesWithWeirdMargins.length === 0) {
    t4.pass('Todas as margens estão em faixa realista');
  } else {
    t4.warn(`${quotesWithWeirdMargins.length} quotes com margens suspeitas`,
      quotesWithWeirdMargins.map(q => `${q.quoteNumber}: ${q.margin?.toFixed(1)}%`)
    );
  }
}

// ==================== CATEGORIA 4: METADATA E FLAGS ====================
async function testMetadata() {
  console.log('\n🏷️  CATEGORIA 4: Metadata e Flags\n');
  
  // Test 4.1: Leads têm metadata de migração
  const t1 = test('Leads com metadata de rastreamento', 'Metadata');
  const leadsWithoutMetadata = await prisma.lead.count({
    where: {
      source: 'MIGRATION',
      OR: [
        { metadata: null },
        { metadata: '' }
      ]
    }
  });
  
  if (leadsWithoutMetadata === 0) {
    t1.pass('Todos os leads têm metadata');
  } else {
    t1.warn(`${leadsWithoutMetadata} leads sem metadata`);
  }
  
  // Test 4.2: Quotes têm flag isMigrated
  const t2 = test('Quotes com flag isMigrated', 'Metadata');
  const quotesWithFlag = await prisma.quote.count({
    where: {
      metadata: { contains: '"isMigrated":true' }
    }
  });
  
  const totalQuotes = await prisma.quote.count();
  
  if (quotesWithFlag > 0) {
    t2.pass(`${quotesWithFlag}/${totalQuotes} quotes identificados como migrados`);
  } else {
    t2.warn('Nenhum quote com flag isMigrated (pode ser normal se migração não usou)');
  }
  
  // Test 4.3: Lead emails seguem padrão
  const t3 = test('Lead emails seguem padrão de migração', 'Metadata');
  const invalidEmails = await prisma.lead.findMany({
    where: {
      source: 'MIGRATION',
      NOT: {
        email: { contains: '@nexus.internal' }
      }
    },
    select: { name: true, email: true }
  });
  
  if (invalidEmails.length === 0) {
    t3.pass('Todos os emails seguem padrão');
  } else {
    t3.warn(`${invalidEmails.length} leads com email fora do padrão`,
      invalidEmails.slice(0, 5).map(l => `${l.name}: ${l.email}`)
    );
  }
}

// ==================== CATEGORIA 5: AUDIT LOG ====================
async function testAuditLog() {
  console.log('\n📝 CATEGORIA 5: Audit Log\n');
  
  try {
    // Test 5.1: Tabela existe
    const t1 = test('Tabela MigrationAudit existe', 'Audit');
    const tableExists = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'MigrationAudit'
    `;
    
    if (tableExists[0].count > 0) {
      t1.pass('Tabela existe');
    } else {
      t1.warn('Tabela MigrationAudit não encontrada');
      return;
    }
    
    // Test 5.2: Registros SUCCESS vs FAILED
    const t2 = test('Proporção de sucessos no audit', 'Audit');
    const auditStats = await prisma.migrationAudit.groupBy({
      by: ['status'],
      _count: { status: true }
    });
    
    const stats = Object.fromEntries(auditStats.map(s => [s.status, s._count.status]));
    const successRate = (stats.SUCCESS || 0) / (Object.values(stats).reduce((a, b) => a + b, 0) || 1);
    
    if (successRate >= 0.95) {
      t2.pass(`${(successRate * 100).toFixed(1)}% de sucesso`);
    } else if (successRate >= 0.8) {
      t2.warn(`${(successRate * 100).toFixed(1)}% de sucesso (abaixo de 95%)`);
    } else {
      t2.fail(`Apenas ${(successRate * 100).toFixed(1)}% de sucesso`);
    }
    
    // Test 5.3: Cobertura de audit (todos projects têm registro?)
    const t3 = test('Cobertura do audit log', 'Audit');
    const migratedProjects = await prisma.project.findMany({
      where: {
        type: 'SOLAR',
        quoteId: { not: null }
      },
      select: { id: true }
    });
    
    const projectsWithAudit = await prisma.migrationAudit.findMany({
      where: {
        projectId: { in: migratedProjects.map(p => p.id) }
      },
      distinct: ['projectId']
    });
    
    const coverage = projectsWithAudit.length / (migratedProjects.length || 1);
    
    if (coverage === 1) {
      t3.pass('100% dos projects têm audit');
    } else if (coverage >= 0.9) {
      t3.warn(`${(coverage * 100).toFixed(1)}% de cobertura`);
    } else {
      t3.fail(`Apenas ${(coverage * 100).toFixed(1)}% de cobertura`);
    }
    
  } catch (error) {
    const t = test('Validação de Audit Log', 'Audit');
    t.warn(`Erro ao validar audit: ${error.message}`);
  }
}

// ==================== GERAÇÃO DE RELATÓRIO ====================
function generateReport(counts) {
  const successRate = (passedTests / (passedTests + failedTests)) * 100;
  const totalTests = passedTests + failedTests + warnings;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Relatório de Validação - Nexus Migration</title>
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
    h1 { 
      color: #2c3e50; 
      border-bottom: 3px solid ${successRate >= 90 ? '#27ae60' : successRate >= 70 ? '#f39c12' : '#e74c3c'}; 
      padding-bottom: 10px; 
    }
    .score {
      font-size: 72px;
      font-weight: bold;
      text-align: center;
      color: ${successRate >= 90 ? '#27ae60' : successRate >= 70 ? '#f39c12' : '#e74c3c'};
      margin: 30px 0;
    }
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
    .stat-card.pass { background: #d5f4e6; border-left: 4px solid #27ae60; }
    .stat-card.fail { background: #fadbd8; border-left: 4px solid #e74c3c; }
    .stat-card.warn { background: #fef5e7; border-left: 4px solid #f39c12; }
    .stat-number { font-size: 48px; font-weight: bold; margin: 10px 0; }
    .category {
      margin: 30px 0;
      border-left: 4px solid #3498db;
      padding-left: 15px;
    }
    .test-item {
      padding: 10px;
      margin: 5px 0;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .test-item.pass { background: #d5f4e6; }
    .test-item.fail { background: #fadbd8; }
    .test-item.warn { background: #fef5e7; }
    .details {
      font-size: 12px;
      color: #7f8c8d;
      margin-top: 5px;
      padding-left: 20px;
    }
    .badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .badge.pass { background: #27ae60; color: white; }
    .badge.fail { background: #e74c3c; color: white; }
    .badge.warn { background: #f39c12; color: white; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 Relatório de Validação - Migração Nexus</h1>
    <p style="color: #7f8c8d;">Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
    
    <div class="score">${successRate.toFixed(1)}%</div>
    <p style="text-align: center; font-size: 18px; color: #7f8c8d;">
      Taxa de Aprovação
    </p>
    
    <div class="stats">
      <div class="stat-card pass">
        <div>✅ Testes Passados</div>
        <div class="stat-number">${passedTests}</div>
      </div>
      <div class="stat-card fail">
        <div>❌ Testes Falhados</div>
        <div class="stat-number">${failedTests}</div>
      </div>
      <div class="stat-card warn">
        <div>⚠️ Avisos</div>
        <div class="stat-number">${warnings}</div>
      </div>
    </div>
    
    <h2>📊 Resumo de Dados</h2>
    <ul>
      <li><strong>Projects Migrados:</strong> ${counts.migratedCount}</li>
      <li><strong>Leads Criados:</strong> ${counts.leadsCount}</li>
      <li><strong>Quotes Aprovados:</strong> ${counts.quotesCount}</li>
      <li><strong>Registros de Audit:</strong> ${counts.auditCount}</li>
    </ul>
    
    ${['Contagens', 'Integridade', 'Consistência', 'Metadata', 'Audit'].map(category => {
      const categoryTests = tests.filter(t => t.category === category);
      if (categoryTests.length === 0) return '';
      
      return `
        <div class="category">
          <h3>${category}</h3>
          ${categoryTests.map(t => `
            <div class="test-item ${t.status.toLowerCase()}">
              <div>
                <strong>${t.name}</strong>
                ${t.message ? `<div style="font-size: 14px; color: #7f8c8d;">${t.message}</div>` : ''}
                ${t.details.length > 0 ? `
                  <div class="details">
                    ${t.details.slice(0, 3).map(d => `• ${d}`).join('<br>')}
                    ${t.details.length > 3 ? `<br>... e mais ${t.details.length - 3}` : ''}
                  </div>
                ` : ''}
              </div>
              <span class="badge ${t.status.toLowerCase()}">${t.status}</span>
            </div>
          `).join('')}
        </div>
      `;
    }).join('')}
    
    <h2>🎯 Recomendações</h2>
    <ul>
      ${failedTests > 0 ? '<li><strong>⚠️ CRÍTICO:</strong> Há testes falhando! Revise os erros acima antes de prosseguir.</li>' : ''}
      ${warnings > 5 ? '<li><strong>⚠️ ATENÇÃO:</strong> Múltiplos avisos detectados. Considere revisar manualmente.</li>' : ''}
      ${successRate >= 95 ? '<li>✅ Migração validada com sucesso! Pode prosseguir com confiança.</li>' : ''}
      ${successRate < 90 ? '<li>⚠️ Taxa de aprovação abaixo de 90%. Investigue os problemas antes de deploy.</li>' : ''}
    </ul>
    
    <h2>📋 Próximos Passos</h2>
    <ol>
      <li>Revisar todos os testes FAIL marcados em vermelho</li>
      <li>Investigar avisos (WARN) se houver muitos</li>
      <li>Testar manualmente 3-5 projects migrados na UI</li>
      <li>Validar botão "Ver Orçamento" funciona corretamente</li>
      <li>Monitorar sistema por 24-48h após deploy</li>
    </ol>
  </div>
</body>
</html>
  `;
  
  const filename = `validation_report_${Date.now()}.html`;
  fs.writeFileSync(filename, html);
  console.log(`\n📄 Relatório HTML salvo em: ${filename}`);
}

// ==================== MAIN ====================
async function main() {
  const startTime = Date.now();
  
  try {
    console.log('Iniciando validação...\n');
    
    // Executar categorias
    const counts = await testCounts();
    await testReferentialIntegrity();
    await testDataConsistency();
    await testMetadata();
    await testAuditLog();
    
    // Resumo
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const totalTests = passedTests + failedTests + warnings;
    const successRate = (passedTests / (passedTests + failedTests || 1)) * 100;
    
    console.log('\n' + '═'.repeat(60));
    console.log('📊 RESUMO DA VALIDAÇÃO');
    console.log('═'.repeat(60));
    console.log(`\n⏱️  Duração: ${duration}s`);
    console.log(`📋 Total de testes: ${totalTests}`);
    console.log(`✅ Passados: ${passedTests}`);
    console.log(`❌ Falhados: ${failedTests}`);
    console.log(`⚠️  Avisos: ${warnings}`);
    console.log(`📈 Taxa de aprovação: ${successRate.toFixed(1)}%`);
    
    // Gerar relatório
    if (CONFIG.GENERATE_REPORT) {
      generateReport(counts);
    }
    
    // Status final
    if (failedTests === 0 && warnings <= 3) {
      console.log('\n✅ VALIDAÇÃO PASSOU! Migração está consistente.\n');
      process.exit(0);
    } else if (failedTests === 0) {
      console.log('\n⚠️  VALIDAÇÃO COM AVISOS. Revise antes de prosseguir.\n');
      process.exit(0);
    } else {
      console.log('\n❌ VALIDAÇÃO FALHOU! Corrija os erros antes de prosseguir.\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ ERRO CRÍTICO NA VALIDAÇÃO:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

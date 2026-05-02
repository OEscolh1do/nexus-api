/**
 * 🔄 SHADOW MODE - VALIDADOR DE PARIDADE
 * 
 * Compara dados entre SolarFlow standalone e Nexus para validar migração.
 * 
 * USO:
 *   node scripts/shadow-mode-validator.js
 * 
 * OUTPUT:
 *   - Relatório de paridade
 *   - Taxa de divergência
 *   - Recomendação (CONTINUAR / INVESTIGAR / ROLLBACK)
 * 
 * Autor: Antigravity AI
 * Data: 2026-01-20
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// ANSI Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
};

// ========================
// HELPERS
// ========================

/**
 * Calcula checksum SHA-256 de um objeto JSON
 */
function calculateChecksum(data) {
  const normalized = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Compara dois objetos JSON de forma profunda
 */
function deepCompare(obj1, obj2, path = '') {
  const differences = [];

  // Se tipos diferentes
  if (typeof obj1 !== typeof obj2) {
    differences.push({
      path,
      solarflow: obj1,
      nexus: obj2,
      type: 'TYPE_MISMATCH',
    });
    return differences;
  }

  // Se objetos
  if (typeof obj1 === 'object' && obj1 !== null) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    // Chaves que existem em obj1 mas não em obj2
    const missingInObj2 = keys1.filter(k => !keys2.includes(k));
    missingInObj2.forEach(key => {
      differences.push({
        path: `${path}.${key}`,
        solarflow: obj1[key],
        nexus: undefined,
        type: 'MISSING_IN_NEXUS',
      });
    });

    // Chaves que existem em obj2 mas não em obj1
    const missingInObj1 = keys2.filter(k => !keys1.includes(k));
    missingInObj1.forEach(key => {
      differences.push({
        path: `${path}.${key}`,
        solarflow: undefined,
        nexus: obj2[key],
        type: 'EXTRA_IN_NEXUS',
      });
    });

    // Comparar chaves em comum
    const commonKeys = keys1.filter(k => keys2.includes(k));
    commonKeys.forEach(key => {
      const subDiff = deepCompare(obj1[key], obj2[key], `${path}.${key}`);
      differences.push(...subDiff);
    });
  } else {
    // Valores primitivos
    if (obj1 !== obj2) {
      differences.push({
        path,
        solarflow: obj1,
        nexus: obj2,
        type: 'VALUE_MISMATCH',
      });
    }
  }

  return differences;
}

// ========================
// VALIDAÇÃO
// ========================

async function validateParity() {
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue} SHADOW MODE - VALIDADOR DE PARIDADE${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  const startTime = Date.now();
  const today = new Date().toISOString().split('T')[0];

  console.log(`Data: ${today}`);
  console.log(`Período: Últimas 24 horas\n`);

  // 1. Ler dados do localStorage do SolarFlow (export manual)
  console.log(`${colors.yellow}[1/4] Lendo dados do SolarFlow (localStorage)...${colors.reset}`);
  
  const localStorageExportPath = path.join(__dirname, '../solarflow-localStorage-export.json');
  
  if (!fs.existsSync(localStorageExportPath)) {
    console.log(`${colors.red}❌ ERRO: Arquivo de export não encontrado!${colors.reset}`);
    console.log(`   Esperado em: ${localStorageExportPath}`);
    console.log(`\n${colors.yellow}INSTRUÇÕES:${colors.reset}`);
    console.log(`   1. Abra SolarFlow standalone no navegador`);
    console.log(`   2. Abra DevTools (F12) -> Console`);
    console.log(`   3. Execute: JSON.stringify(localStorage)`);
    console.log(`   4. Copie o resultado para: solarflow-localStorage-export.json`);
    process.exit(1);
  }

  const solarflowData = JSON.parse(fs.readFileSync(localStorageExportPath, 'utf-8'));
  console.log(`   Lido: ${Object.keys(solarflowData).length} itens do localStorage\n`);

  // 2. Ler dados do Nexus (MySQL via Prisma)
  console.log(`${colors.yellow}[2/4] Lendo dados do Nexus (MySQL)...${colors.reset}`);
  
  const projects = await prisma.project.findMany({
    where: {
      type: 'SOLAR',
      details: { not: null },
    },
    select: {
      id: true,
      title: true,
      details: true,
      updatedAt: true,
    },
  });

  console.log(`   Encontrados: ${projects.length} projetos solares\n`);

  // 3. Comparar checksums
  console.log(`${colors.yellow}[3/4] Comparando checksums...${colors.reset}\n`);

  let identicalCount = 0;
  let divergentCount = 0;
  const divergences = [];

  projects.forEach(project => {
    try {
      const nexusDetails = JSON.parse(project.details);
      
      // Tentar encontrar proposta correspondente no localStorage
      // (isso depende de como as propostas são identificadas no SolarFlow)
      const solarflowKey = `solar_proposal_${project.title}`; // Ajustar conforme necessário
      const solarflowDetails = solarflowData[solarflowKey] 
        ? JSON.parse(solarflowData[solarflowKey]) 
        : null;

      if (!solarflowDetails) {
        console.log(`   ⚠️  ${project.title}: Não encontrado no SolarFlow`);
        return;
      }

      const checksumNexus = calculateChecksum(nexusDetails);
      const checksumSolarflow = calculateChecksum(solarflowDetails);

      if (checksumNexus === checksumSolarflow) {
        console.log(`   ${colors.green}✓${colors.reset} ${project.title}: Idêntico`);
        identicalCount++;
      } else {
        console.log(`   ${colors.red}✗${colors.reset} ${project.title}: DIVERGENTE`);
        divergentCount++;

        // Análise profunda de divergências
        const diff = deepCompare(solarflowDetails, nexusDetails, 'root');
        divergences.push({
          projectId: project.id,
          projectTitle: project.title,
          checksumSolarflow,
          checksumNexus,
          differences: diff,
        });
      }
    } catch (error) {
      console.log(`   ${colors.red}✗${colors.reset} ${project.title}: Erro ao comparar`);
      console.error(`      ${error.message}`);
      divergentCount++;
    }
  });

  // 4. Gerar relatório
  console.log(`\n${colors.yellow}[4/4] Gerando relatório...${colors.reset}\n`);

  const totalCompared = identicalCount + divergentCount;
  const divergenceRate = totalCompared > 0 ? (divergentCount / totalCompared) * 100 : 0;

  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue} RESUMO${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  console.log(`PROPOSTAS COMPARADAS`);
  console.log(`  SolarFlow Standalone: ${Object.keys(solarflowData).length}`);
  console.log(`  Nexus (MySQL):        ${projects.length}`);
  console.log(`  Duplicadas:           ${totalCompared} (${totalCompared > 0 ? '100%' : '0%'})\n`);

  console.log(`PARIDADE DE DADOS`);
  console.log(`  Checksums Idênticos:  ${identicalCount} (${((identicalCount / totalCompared) * 100).toFixed(1)}%)`);
  console.log(`  Divergências:         ${divergentCount}  (${divergenceRate.toFixed(1)}%)\n`);

  // Divergências detalhadas
  if (divergences.length > 0) {
    console.log(`${colors.yellow}DIVERGÊNCIAS DETALHADAS${colors.reset}\n`);
    divergences.forEach(div => {
      console.log(`${colors.red}  Projeto: ${div.projectTitle}${colors.reset}`);
      console.log(`  ID: ${div.projectId}`);
      console.log(`  Checksum SolarFlow: ${div.checksumSolarflow.substring(0, 16)}...`);
      console.log(`  Checksum Nexus:     ${div.checksumNexus.substring(0, 16)}...`);
      
      if (div.differences.length > 0) {
        console.log(`  Diferenças encontradas (${div.differences.length}):`);
        div.differences.slice(0, 5).forEach(diff => {
          console.log(`    - ${diff.path}: ${diff.type}`);
          if (diff.type === 'VALUE_MISMATCH') {
            console.log(`      SolarFlow: ${JSON.stringify(diff.solarflow)}`);
            console.log(`      Nexus:     ${JSON.stringify(diff.nexus)}`);
          }
        });
        if (div.differences.length > 5) {
          console.log(`    ... e mais ${div.differences.length - 5} diferenças`);
        }
      }
      console.log('');
    });
  }

  // Recomendação
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  let recommendation;
  let status;

  if (divergenceRate === 0) {
    status = `${colors.green}✅ EXCELENTE${colors.reset}`;
    recommendation = 'Paridade perfeita! Continuar Shadow Mode.';
  } else if (divergenceRate < 1) {
    status = `${colors.green}✅ BOM${colors.reset}`;
    recommendation = 'Paridade aceitável. Continuar monitorando.';
  } else if (divergenceRate < 5) {
    status = `${colors.yellow}⚠️  ATENÇÃO${colors.reset}`;
    recommendation = 'Investigar causas das divergências antes de prosseguir.';
  } else if (divergenceRate < 10) {
    status = `${colors.red}🚨 CRÍTICO${colors.reset}`;
    recommendation = 'ROLLBACK RECOMENDADO - Taxa de divergência acima do threshold.';
  } else {
    status = `${colors.red}❌ EMERGÊNCIA${colors.reset}`;
    recommendation = 'ROLLBACK IMEDIATO - Sistema não está em paridade.';
  }

  console.log(`STATUS: ${status}`);
  console.log(`Taxa de divergência: ${divergenceRate.toFixed(2)}%`);
  console.log(`Threshold: 5%`);
  console.log(`\nRecomendação: ${recommendation}\n`);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`Execução completada em ${duration}s\n`);

  // Salvar relatório em arquivo
  const reportPath = path.join(__dirname, `../shadow-mode-reports/report-${today}.json`);
  const reportDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const report = {
    date: today,
    totalCompared,
    identicalCount,
    divergentCount,
    divergenceRate,
    status: status.replace(/\x1b\[[0-9;]*m/g, ''), // remove ANSI
    recommendation,
    divergences,
    duration,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Relatório salvo em: ${reportPath}\n`);

  // Exit code baseado na taxa de divergência
  if (divergenceRate >= 10) {
    process.exit(2); // Emergência
  } else if (divergenceRate >= 5) {
    process.exit(1); // Crítico
  } else {
    process.exit(0); // OK
  }
}

// ========================
// EXECUTAR
// ========================

validateParity()
  .catch(err => {
    console.error(`${colors.red}Erro fatal:${colors.reset}`, err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

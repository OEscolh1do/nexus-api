import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Abstract Core seeding...');

  // 1. LIFECYCLE STAGES (Table-driven Enum)
  console.log('   Creating Lifecycle Stages...');
  const stageLead = await prisma.lifecycleStage.upsert({
    where: { name: 'LEAD' },
    update: {},
    create: { name: 'LEAD', orderIndex: 1, colorCode: '#94a3b8' } // Slate
  });

  const stageProspect = await prisma.lifecycleStage.upsert({
    where: { name: 'PROSPECT' },
    update: {},
    create: { name: 'PROSPECT', orderIndex: 2, colorCode: '#f59e0b' } // Amber
  });

  const stageClient = await prisma.lifecycleStage.upsert({
    where: { name: 'CLIENT' },
    update: {},
    create: { name: 'CLIENT', orderIndex: 3, colorCode: '#10b981' } // Emerald
  });

  const stagePartner = await prisma.lifecycleStage.upsert({
    where: { name: 'PARTNER' },
    update: {},
    create: { name: 'PARTNER', orderIndex: 4, colorCode: '#8b5cf6' } // Violet
  });

  // 2. ORG UNITS (The Container)
  console.log('   Creating Organizational Hierarchy...');
  
  // Root
  const neonorte = await prisma.orgUnit.create({
    data: { name: 'Neonorte Group', type: 'HOLDING' }
  });

  // Diretoria Engenharia
  const engDept = await prisma.orgUnit.create({
    data: { 
      name: 'Diretoria de Engenharia', 
      type: 'DEPARTMENT', 
      parentId: neonorte.id,
      config: JSON.stringify({ modules: ['PROJECTS', 'ASSETS', 'LOGISTICS'] }) 
    }
  });

  // Diretoria Comercial & Academy
  const comDept = await prisma.orgUnit.create({
    data: { 
      name: 'Diretoria Comercial', 
      type: 'DEPARTMENT', 
      parentId: neonorte.id,
      config: JSON.stringify({ modules: ['CRM', 'PROGRAMS'] }) 
    }
  });

  // UN: Academy (Profit Center)
  const academy = await prisma.orgUnit.create({
    data: {
      name: 'Neonorte Academy',
      type: 'BUSINESS_UNIT',
      parentId: comDept.id,
      config: JSON.stringify({ modules: ['EVENTS', 'CERTIFICATION'] })
    }
  });

  // 3. PROGRAMS (The Process)
  console.log('   Creating Programs...');
  
  // Program: Expansão (Sales Mission)
  await prisma.program.create({
    data: {
      name: 'Expansão Cidades Vizinhas 2026',
      type: 'COMMERCIAL',
      orgUnitId: comDept.id,
      description: 'Missões de Venda para Parauapebas e Região.'
    }
  });

  // Program: Formação (Academy)
  await prisma.program.create({
    data: {
      name: 'Formação Instalador Solar Elite',
      type: 'EDUCATIONAL',
      orgUnitId: academy.id,
      description: 'Curso técnico para formar parceiros.'
    }
  });

  // 4. WORKFLOW RULES (The Logic)
  console.log('   Creating Workflow Rules...');

  // Setup Pipelines first
  const pipelineSales = await prisma.pipeline.create({
    data: { name: 'Pipeline Comercial', orgUnitId: comDept.id }
  });

  const pipelineEng = await prisma.pipeline.create({
    data: { name: 'Pipeline Execução', orgUnitId: engDept.id }
  });

  // Sales Stages
  const stageWon = await prisma.stage.create({
    data: { name: 'Contrato Fechado', pipelineId: pipelineSales.id, orderIndex: 4 }
  });

  // Eng Stages
  const stageBacklog = await prisma.stage.create({
    data: { name: 'Aguardando Vistoria', pipelineId: pipelineEng.id, orderIndex: 1 }
  });

  // RULE: Auto-Convert Lead -> Client + Send to Engineering
  await prisma.workflowRule.create({
    data: {
      name: 'Handover: Venda para Engenharia',
      sourceStageId: stageWon.id,
      triggerType: 'ON_ENTER',
      actionType: 'CLONE_TO_PIPELINE',
      targetPipelineId: pipelineEng.id,
      targetStageName: 'Aguardando Vistoria',
      config: JSON.stringify({
        lifecycleUpdate: 'CLIENT', // Convert Entity to CLIENT
        copyFields: ['solarData', 'totalCost']
      })
    }
  });

  console.log('✅ Seeding Complete. The System is now Context-Aware.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

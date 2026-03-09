const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do Nexus...');

  // 1. LIMPAR DADOS EXISTENTES (Ordem de dependência)
  console.log('   Limpando dados existentes...');
  await prisma.session.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.hRLeave.deleteMany({});
  await prisma.checklistItem.deleteMany({});
  await prisma.checklist.deleteMany({});
  await prisma.taskDependency.deleteMany({});
  await prisma.operationalTask.deleteMany({});
  await prisma.risk.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.keyResult.deleteMany({});
  await prisma.strategy.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.workflowRule.deleteMany({});
  await prisma.stage.deleteMany({});
  await prisma.pipeline.deleteMany({});
  await prisma.program.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.orgUnit.deleteMany({});
  await prisma.tenant.deleteMany({});

  // 1.5. TENANT (Obrigatório para RLS)
  console.log('   Criando Tenant de Teste...');
  const tenant = await prisma.tenant.create({
    data: {
      id: 'default-tenant-001',
      name: 'Neonorte Master (Default)',
      type: 'MASTER'
    }
  });

  // 2. ESTRUTURA ORGANIZACIONAL
  console.log('   Criando estrutura organizacional...');

  const neonorte = await prisma.orgUnit.create({
    data: { name: 'Neonorte Group', type: 'HOLDING' }
  });

  const engDept = await prisma.orgUnit.create({
    data: {
      name: 'Diretoria de Engenharia',
      type: 'DEPARTMENT',
      parentId: neonorte.id
    }
  });

  const comDept = await prisma.orgUnit.create({
    data: {
      name: 'Diretoria Comercial',
      type: 'DEPARTMENT',
      parentId: neonorte.id
    }
  });

  const academy = await prisma.orgUnit.create({
    data: {
      name: 'Academy',
      type: 'BUSINESS_UNIT',
      parentId: comDept.id,
      config: JSON.stringify({ modules: ['EVENTS'] })
    }
  });

  // 3. PROGRAMAS
  console.log('   Criando programas...');

  await prisma.program.create({
    data: {
      name: 'Programa de Expansão Regional',
      description: 'Expansão para 5 novas cidades até 2026',
      orgUnitId: neonorte.id
    }
  });

  await prisma.program.create({
    data: {
      name: 'Academy - Formação de Instaladores',
      description: 'Formar 50 instaladores certificados',
      orgUnitId: academy.id
    }
  });

  // 4. PIPELINES
  console.log('   Criando pipelines...');

  const salesPipeline = await prisma.pipeline.create({
    data: {
      name: 'Pipeline Comercial',
      type: 'SALES',
      orgUnitId: comDept.id
    }
  });

  await prisma.stage.createMany({
    data: [
      { pipelineId: salesPipeline.id, name: 'Lead', order: 1 },
      { pipelineId: salesPipeline.id, name: 'Proposta', order: 2 },
      { pipelineId: salesPipeline.id, name: 'Negociação', order: 3 },
      { pipelineId: salesPipeline.id, name: 'Fechado', order: 4 }
    ]
  });

  const engPipeline = await prisma.pipeline.create({
    data: {
      name: 'Pipeline de Engenharia',
      type: 'ENGINEERING',
      orgUnitId: engDept.id
    }
  });

  await prisma.stage.createMany({
    data: [
      { pipelineId: engPipeline.id, name: 'Aguardando', order: 1 },
      { pipelineId: engPipeline.id, name: 'Em Execução', order: 2 },
      { pipelineId: engPipeline.id, name: 'Vistoria', order: 3 },
      { pipelineId: engPipeline.id, name: 'Concluído', order: 4 }
    ]
  });

  // 5. USUÁRIOS
  console.log('   Criando usuários...');

  const hashedPassword = await bcrypt.hash('bud4X891fd', 10);

  const admin = await prisma.user.create({
    data: {
      username: 'tecnologianeonorte@gmail.com',
      password: hashedPassword,
      fullName: 'Tecnologia Neonorte',
      role: 'ADMIN',
      orgUnitId: neonorte.id,
      badgeId: 'NEO-001',
      jobTitle: 'Responsável Técnico',
      hierarchyLevel: 'C-LEVEL'
    }
  });

  const engineer = await prisma.user.create({
    data: {
      username: 'engenheiro',
      password: hashedPassword,
      fullName: 'João Silva',
      role: 'ENGENHARIA',
      orgUnitId: engDept.id,
      badgeId: 'ENG001',
      jobTitle: 'Engenheiro Sênior',
      hierarchyLevel: 'N3',
      supervisorId: admin.id
    }
  });

  const sales = await prisma.user.create({
    data: {
      username: 'vendedor',
      password: hashedPassword,
      fullName: 'Maria Costa',
      role: 'COORDENACAO',
      orgUnitId: comDept.id,
      badgeId: 'COM001',
      jobTitle: 'Coordenadora Comercial',
      hierarchyLevel: 'N2',
      supervisorId: admin.id
    }
  });

  // 6. ESTRATÉGIAS
  console.log('   Criando estratégias...');

  const pillar1 = await prisma.strategy.create({
    data: {
      code: 'P1',
      title: 'Pilar: Crescimento Regional',
      description: 'Expandir operações para novas regiões do Norte',
      colorCode: '#3B82F6',
      type: 'PILLAR',
      isActive: true,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31')
    }
  });

  const objective1 = await prisma.strategy.create({
    data: {
      code: 'O1.1',
      title: 'Objetivo: 5 Novas Cidades',
      description: 'Atingir presença em 5 novas cidades até dezembro',
      colorCode: '#10B981',
      type: 'OBJECTIVE',
      parentId: pillar1.id,
      isActive: true,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31')
    }
  });

  const initiative1 = await prisma.strategy.create({
    data: {
      code: 'I1.1.1',
      title: 'Iniciativa: Missão Parauapebas',
      description: 'Abrir mercado em Parauapebas',
      colorCode: '#F59E0B',
      type: 'INITIATIVE',
      parentId: objective1.id,
      isActive: true,
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-04-30')
    }
  });

  const pillar2 = await prisma.strategy.create({
    data: {
      code: 'P2',
      title: 'Pilar: Capacitação',
      description: 'Desenvolver e certificar talentos',
      colorCode: '#8B5CF6',
      type: 'PILLAR',
      isActive: true,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31')
    }
  });

  // 7. KEY RESULTS
  console.log('   Criando indicadores (Key Results)...');

  await prisma.keyResult.createMany({
    data: [
      {
        strategyId: objective1.id,
        title: 'Cidades Atingidas',
        targetValue: 5,
        currentValue: 1,
        unit: 'un'
      },
      {
        strategyId: objective1.id,
        title: 'Receita Regional',
        targetValue: 500000,
        currentValue: 120000,
        unit: 'R$'
      },
      {
        strategyId: pillar2.id,
        title: 'Instaladores Certificados',
        targetValue: 50,
        currentValue: 12,
        unit: 'un'
      }
    ]
  });

  // 8. PROJETOS
  console.log('   Criando projetos...');

  const project1 = await prisma.project.create({
    data: {
      strategyId: initiative1.id,
      managerId: sales.id,
      title: 'Expansão Parauapebas - Fase 1',
      description: 'Primeira fase de expansão para Parauapebas',
      status: 'ATIVO',
      type: 'GENERIC',
      progressPercentage: 35,
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-04-30')
    }
  });

  const project2 = await prisma.project.create({
    data: {
      strategyId: pillar2.id,
      managerId: engineer.id,
      title: 'Workshop Instalação Solar Q1',
      description: 'Treinamento prático de 3 dias',
      status: 'PLANEJAMENTO',
      type: 'GENERIC',
      progressPercentage: 0,
      startDate: new Date('2026-02-20'),
      endDate: new Date('2026-02-22')
    }
  });

  // 9. TAREFAS OPERACIONAIS
  console.log('   Criando tarefas...');

  await prisma.operationalTask.createMany({
    data: [
      {
        projectId: project1.id,
        title: 'Agendar reunião com prefeito',
        description: 'Contatar secretaria para apresentação institucional',
        status: 'BACKLOG',
        assignedTo: sales.id,
        dueDate: new Date('2026-02-15')
      },
      {
        projectId: project1.id,
        title: 'Mapear clientes potenciais',
        description: 'Levantar lista de empresas com perfil solar',
        status: 'EM_ANALISE',
        assignedTo: sales.id,
        completionPercent: 40,
        dueDate: new Date('2026-02-10')
      },
      {
        projectId: project2.id,
        title: 'Reservar local do evento',
        description: 'Contratar espaço para 30 pessoas',
        status: 'BACKLOG',
        assignedTo: admin.id,
        dueDate: new Date('2026-02-10')
      },
      {
        projectId: project2.id,
        title: 'Criar material didático',
        description: 'Preparar apostilas e apresentações',
        status: 'BACKLOG',
        assignedTo: engineer.id,
        dueDate: new Date('2026-02-15')
      }
    ]
  });

  // 10. ATIVOS
  console.log('   Criando ativos...');

  await prisma.asset.createMany({
    data: [
      {
        name: 'Fiat Strada',
        type: 'VEHICLE',
        status: 'AVAILABLE',
        serialNumber: 'ABC-1234',
        location: 'Sede'
      },
      {
        name: 'Kit de Ferramentas Profissional',
        type: 'TOOL',
        status: 'AVAILABLE',
        location: 'Almoxarifado'
      }
    ]
  });

  // 11. WORKFLOW RULES
  console.log('   Criando regras de workflow...');

  await prisma.workflowRule.create({
    data: {
      orgUnitId: engDept.id,
      name: 'Notificar ao concluir projeto',
      condition: JSON.stringify({ trigger: 'project.status', equals: 'CONCLUIDO' }),
      action: JSON.stringify({ type: 'notify', target: 'manager' }),
      isActive: true
    }
  });

  // 12. NAVEGAÇÃO DINÂMICA (DEFAULT)
  console.log('   Criando navegação padrão (Ops)...');

  // Ops Module Default Navigation
  const opsGroup1 = await prisma.navigationGroup.create({
    data: {
      orgUnitId: neonorte.id,
      module: 'OPS',
      title: 'Planejamento & Estratégia',
      order: 1,
      items: {
        create: [
          { label: 'Cockpit Projetos', path: '/ops/cockpit', icon: 'HardHat', order: 1 },
          { label: 'Estratégia', path: '/ops/strategy', icon: 'Target', order: 2 },
          { label: 'Portfólio', path: '/ops/portfolio', icon: 'Briefcase', order: 3 }
        ]
      }
    }
  });

  const opsGroup2 = await prisma.navigationGroup.create({
    data: {
      orgUnitId: neonorte.id,
      module: 'OPS',
      title: 'Execução Tática',
      order: 2,
      items: {
        create: [
          { label: 'Cronograma Mestre', path: '/ops/gantt', icon: 'CalendarRange', order: 1 },
          { label: 'Kanban', path: '/ops/kanban', icon: 'Workflow', order: 2 },
          { label: 'Aprovações', path: '/ops/reviews', icon: 'ClipboardCheck', order: 3 }
        ]
      }
    }
  });

  const opsGroup3 = await prisma.navigationGroup.create({
    data: {
      orgUnitId: neonorte.id,
      module: 'OPS',
      title: 'Inteligência',
      order: 3,
      items: {
        create: [
          { label: 'Mapa Operacional', path: '/ops/map', icon: 'Map', order: 1 },
          { label: 'Gargalos', path: '/ops/issues', icon: 'AlertTriangle', order: 2 }
        ]
      }
    }
  });

  console.log('✅ Seed concluído com sucesso!');
  console.log('   - 4 OrgUnits criadas');
  console.log('   - 2 Programas criados');
  console.log('   - 2 Pipelines (com 8 estágios)');
  console.log('   - 3 Usuários criados (login: tecnologianeonorte@gmail.com, senha: bud4X891fd)');
  console.log('   - 4 Estratégias criadas (hierarquia Pilar > Objetivo > Iniciativa)');
  console.log('   - 3 Key Results criados');
  console.log('   - 2 Projetos criados');
  console.log('   - 4 Tarefas criadas');
  console.log('   - 2 Ativos criados');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * STRATEGIC SEED - Neonorte 2030
 * 
 * Popula o banco de dados com a Árvore Estratégica completa baseada nos
 * documentos de contexto:
 * - Framework_Estrategico_Neonorte.md (9 Pilares)
 * - Plano_Estrategico_Geral_Neonorte.md (Objetivos 2025-2030)
 * - Nossos_Servicos_Neonorte.md (Unidades de Negócio)
 * 
 * ATENÇÃO: Este script APAGA todos os dados estratégicos existentes!
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedStrategies() {
  console.log('🧹 Limpando dados estratégicos existentes...\n');

  // A ordem correta de exclusão considerando foreign keys:
  // 1. ChecklistItems -> Checklists -> Tasks -> Projects
  // 2. KeyResults -> Strategies
  
  try {
    // 1. Limpar todo o cascading de Projects (usando CASCADE já definido no schema)
    // Mas Projects têm FK para Strategy, então precisamos deletar Projects primeiro
    
    // Deletar dependências de Tasks primeiro
    await prisma.checklistItem.deleteMany({});
    console.log('✓ ChecklistItems removidos');
    
    await prisma.checklist.deleteMany({});
    console.log('✓ Checklists removidos');
    
    await prisma.taskDependency.deleteMany({});
    console.log('✓ TaskDependencies removidos');
    
    await prisma.task.deleteMany({});
    console.log('✓ Tasks removidos');
    
    // Agora podemos deletar Projects
    await prisma.project.deleteMany({});
    console.log('✓ Projects removidos');
    
    // Deletar KeyResults (dependem de Strategy)
    await prisma.keyResult.deleteMany({});
    console.log('✓ KeyResults removidos');
    
    // Finalmente deletar Strategies
    await prisma.strategy.deleteMany({});
    console.log('✓ Strategies removidas');
    
  } catch (error) {
    console.error('❌ Erro na limpeza:', error.message);
    throw error;
  }


  console.log('\n📦 Populando Árvore Estratégica Neonorte 2030...\n');

  // ============================================================
  // PILARES (Nível 1 - type: PILLAR)
  // Baseado em: Framework_Estrategico_Neonorte.md
  // ============================================================

  const pilares = [
    {
      code: 'P01-IDENTIDADE',
      title: 'Identidade Organizacional',
      description: 'Refinar missão, visão e valores alinhados à marca pessoal de Breno Nunes. "Iluminar o Pará, um lar e um negócio de cada vez..."',
      colorCode: 'bg-purple-500',
      type: 'PILLAR',
    },
    {
      code: 'P02-DIAGNOSTICO',
      title: 'Diagnóstico Estratégico',
      description: 'Clareza da posição atual e futura através de análises SWOT e PESTEL. Forças: Expertise técnica, valores, liderança.',
      colorCode: 'bg-blue-500',
      type: 'PILLAR',
    },
    {
      code: 'P03-COMPETITIVAS',
      title: 'Estratégias Competitivas',
      description: 'Diferenciação única: "Excelência de técnico, expertise de engenheiro, atendimento de arquiteto."',
      colorCode: 'bg-red-500',
      type: 'PILLAR',
    },
    {
      code: 'P04-CRESCIMENTO',
      title: 'Estratégias de Crescimento',
      description: 'Mapear rotas de expansão: Penetração em Parauapebas, Novos Produtos (Híbridos, Off-grid), Diversificação (Mercado Livre).',
      colorCode: 'bg-green-500',
      type: 'PILLAR',
    },
    {
      code: 'P05-MODELOS',
      title: 'Modelos de Negócio',
      description: 'Sustentabilidade financeira através do Business Model Canvas para cada linha (Solar, Agro, Software).',
      colorCode: 'bg-yellow-500',
      type: 'PILLAR',
    },
    {
      code: 'P06-ESTRUTURA',
      title: 'Estrutura Organizacional',
      description: 'Suportar a estratégia com eficiência. Níveis: Estratégico, Tático, Operacional. Organogramas e matriz RACI.',
      colorCode: 'bg-indigo-500',
      type: 'PILLAR',
    },
    {
      code: 'P07-GOVERNANCA',
      title: 'Governança Estratégica',
      description: 'Execução ética e responsável. Mantra: "Não quero nada do que não é pra ser meu."',
      colorCode: 'bg-pink-500',
      type: 'PILLAR',
    },
    {
      code: 'P08-IMPLEMENTACAO',
      title: 'Plano de Implementação',
      description: 'Traduzir estratégia em tarefas com prazos via OKRs/KPIs, Cronograma Mestre e Plano de Ação 5W2H.',
      colorCode: 'bg-orange-500',
      type: 'PILLAR',
    },
    {
      code: 'P09-TALENTOS',
      title: 'Talentos e Cultura',
      description: 'Time de alta performance alinhado aos valores. Cultura: "Primeiro quem, depois o quê" (Jim Collins).',
      colorCode: 'bg-cyan-500',
      type: 'PILLAR',
    },
  ];

  const createdPilares = {};
  for (const pilar of pilares) {
    const created = await prisma.strategy.create({
      data: {
        ...pilar,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2030-12-31'),
        isActive: true,
      },
    });
    createdPilares[pilar.code] = created;
    console.log(`✓ Pilar criado: ${pilar.title}`);
  }

  // ============================================================
  // OBJETIVOS (Nível 2 - type: OBJECTIVE)
  // Baseado em: Plano_Estrategico_Geral_Neonorte.md
  // ============================================================

  const objetivos = [
    // Crescimento (P04)
    {
      parentCode: 'P04-CRESCIMENTO',
      code: 'O01-RECEITA',
      title: 'Receita R$ 1 milhão até 2030',
      description: 'Meta de faturamento anual consolidado.',
      colorCode: 'bg-green-400',
    },
    {
      parentCode: 'P04-CRESCIMENTO',
      code: 'O02-CIDADES',
      title: 'Presença em 3 cidades-chave',
      description: 'Expansão geográfica para além de Parauapebas.',
      colorCode: 'bg-green-400',
    },
    {
      parentCode: 'P04-CRESCIMENTO',
      code: 'O03-CLIENTES',
      title: '1.000 clientes impactados',
      description: 'Base de clientes ativos com sistemas instalados.',
      colorCode: 'bg-green-400',
    },
    // Operacional (P08)
    {
      parentCode: 'P08-IMPLEMENTACAO',
      code: 'O04-TEMPO',
      title: 'Reduzir tempo de execução em 30%',
      description: 'Otimização de processos de instalação e entrega.',
      colorCode: 'bg-orange-400',
    },
    {
      parentCode: 'P08-IMPLEMENTACAO',
      code: 'O05-SATISFACAO',
      title: 'Satisfação > 95%',
      description: 'NPS e avaliações de clientes acima de 95%.',
      colorCode: 'bg-orange-400',
    },
    {
      parentCode: 'P08-IMPLEMENTACAO',
      code: 'O06-DIGITAL',
      title: 'Digitalizar 100% dos processos (2027)',
      description: 'Eliminar processos manuais e papel.',
      colorCode: 'bg-orange-400',
    },
    // Inovação (P05)
    {
      parentCode: 'P05-MODELOS',
      code: 'O07-PDI',
      title: 'Departamento de P&D&I (2026)',
      description: 'Criar área dedicada a pesquisa e desenvolvimento.',
      colorCode: 'bg-yellow-400',
    },
    {
      parentCode: 'P05-MODELOS',
      code: 'O08-PLATAFORMA',
      title: 'Plataforma de monitoramento (2027)',
      description: 'SaaS próprio para gestão energética dos clientes.',
      colorCode: 'bg-yellow-400',
    },
    {
      parentCode: 'P05-MODELOS',
      code: 'O09-IOT',
      title: 'IoT em 50% dos projetos (2028)',
      description: 'Integração de sensores e automação.',
      colorCode: 'bg-yellow-400',
    },
    // Talentos (P09)
    {
      parentCode: 'P09-TALENTOS',
      code: 'O10-ACADEMY',
      title: 'Neonorte Academy (2026)',
      description: 'Cursos e certificações "Padrão Neonorte" para formar talentos.',
      colorCode: 'bg-cyan-400',
    },
    {
      parentCode: 'P09-TALENTOS',
      code: 'O11-PARCEIROS',
      title: 'Rede de Parceiros Certificados',
      description: 'Plataforma de talentos para instaladores e parceiros regionais.',
      colorCode: 'bg-cyan-400',
    },
    // Competitivas (P03)
    {
      parentCode: 'P03-COMPETITIVAS',
      code: 'O12-REGIONAL',
      title: 'Diferenciação Regional',
      description: '"Empresa genuinamente paraense" - autoridade que desmistifica a tecnologia.',
      colorCode: 'bg-red-400',
    },
    // Governança (P07)
    {
      parentCode: 'P07-GOVERNANCA',
      code: 'O13-COMITE',
      title: 'Comitê Estratégico Mensal',
      description: 'Reuniões mensais de governança com KPIs e gestão de riscos.',
      colorCode: 'bg-pink-400',
    },
  ];

  const createdObjetivos = {};
  for (const obj of objetivos) {
    const parent = createdPilares[obj.parentCode];
    if (!parent) {
      console.error(`❌ Pilar não encontrado: ${obj.parentCode}`);
      continue;
    }
    const created = await prisma.strategy.create({
      data: {
        code: obj.code,
        title: obj.title,
        description: obj.description,
        colorCode: obj.colorCode,
        type: 'OBJECTIVE',
        parentId: parent.id,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2030-12-31'),
        isActive: true,
      },
    });
    createdObjetivos[obj.code] = created;
    console.log(`  ✓ Objetivo: ${obj.title}`);
  }

  // ============================================================
  // KEY RESULTS (Indicadores BSC)
  // ============================================================

  const keyResults = [
    // Financial
    { strategyCode: 'O01-RECEITA', title: 'Faturamento Anual', targetValue: 1000000, unit: 'R$', perspective: 'FINANCIAL' },
    { strategyCode: 'O01-RECEITA', title: 'Ticket Médio por Projeto', targetValue: 25000, unit: 'R$', perspective: 'FINANCIAL' },
    // Customer
    { strategyCode: 'O03-CLIENTES', title: 'Clientes Ativos', targetValue: 1000, unit: 'clientes', perspective: 'CUSTOMER' },
    { strategyCode: 'O05-SATISFACAO', title: 'NPS Score', targetValue: 95, unit: '%', perspective: 'CUSTOMER' },
    // Process
    { strategyCode: 'O04-TEMPO', title: 'Tempo Médio de Instalação', targetValue: 3, unit: 'dias', perspective: 'PROCESS' },
    { strategyCode: 'O06-DIGITAL', title: 'Processos Digitalizados', targetValue: 100, unit: '%', perspective: 'PROCESS' },
    // Learning
    { strategyCode: 'O10-ACADEMY', title: 'Alunos Formados', targetValue: 200, unit: 'pessoas', perspective: 'LEARNING' },
    { strategyCode: 'O07-PDI', title: 'Projetos de Inovação', targetValue: 5, unit: 'projetos/ano', perspective: 'LEARNING' },
  ];

  for (const kr of keyResults) {
    const strategy = createdObjetivos[kr.strategyCode];
    if (!strategy) {
      console.error(`❌ Objetivo não encontrado: ${kr.strategyCode}`);
      continue;
    }
    await prisma.keyResult.create({
      data: {
        title: kr.title,
        targetValue: kr.targetValue,
        currentValue: 0,
        unit: kr.unit,
        perspective: kr.perspective,
        indicatorType: 'OKR',
        strategyId: strategy.id,
      },
    });
    console.log(`    ✓ KR: ${kr.title}`);
  }

  // ============================================================
  // RESUMO
  // ============================================================

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ SEED ESTRATÉGICO CONCLUÍDO!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✓ ${Object.keys(createdPilares).length} Pilares criados`);
  console.log(`✓ ${Object.keys(createdObjetivos).length} Objetivos criados`);
  console.log(`✓ ${keyResults.length} Key Results criados`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🚀 Acesse http://localhost:3000 e navegue para');
  console.log('   "Gerenciador de Estratégias" para visualizar!');
}

seedStrategies()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

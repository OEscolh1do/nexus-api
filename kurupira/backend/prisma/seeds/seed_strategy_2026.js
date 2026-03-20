const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Neonorte 2026 Strategies...');

  const pillars = [
    {
      code: 'EXP-26',
      title: 'Expansão - Presença Digital, Execução Local',
      type: 'PILLAR',
      colorCode: '#f59e0b',
      description: 'Expansão via Vendas Ativas e Parceiros sem sedes físicas novas.',
      keyResults: [
        { title: 'Fechar 5 projetos fora da sede (Sprint 2)', targetValue: 5, unit: 'Projetos', perspective: 'CUSTOMER' },
        { title: 'Obras remotas com margem alvo', targetValue: 100, unit: '%', perspective: 'FINANCIAL' }
      ]
    },
    {
      code: 'TECH-26',
      title: 'Tecnologia como Espinha Dorsal',
      type: 'PILLAR',
      colorCode: '#6366f1',
      description: 'Centro de Controle de Operações. Única fonte da verdade.',
      keyResults: [
        { title: 'Adesão ao Sistema (Leads/Tarefas)', targetValue: 100, unit: '%', perspective: 'PROCESS' },
        { title: 'Uptime do Sistema Interno', targetValue: 99, unit: '%', perspective: 'PROCESS' },
        { title: 'Reduzir ciclo de instalação', targetValue: 15, unit: '%', perspective: 'PROCESS' }
      ]
    },
    {
      code: 'EDU-26',
      title: 'Neonorte Academy (Profit Center)',
      type: 'PILLAR',
      colorCode: '#10b981',
      description: 'Transformar marketing em educação (receita) e filtro de talentos.',
      keyResults: [
        { title: 'Faturamento 1º Workshop', targetValue: 15000, unit: 'BRL', perspective: 'FINANCIAL' },
        { title: 'Receita Acumulada Academy 2026', targetValue: 100000, unit: 'BRL', perspective: 'FINANCIAL' },
        { title: 'Representatividade no Faturamento', targetValue: 10, unit: '%', perspective: 'FINANCIAL' }
      ]
    },
    {
        code: 'GROWTH-26',
        title: 'Eficiência e Novos Produtos',
        type: 'PILLAR',
        colorCode: '#ec4899',
        description: 'Plataforma de Soluções (Cross-sell Eng + Solar).',
        keyResults: [
          { title: 'Reduzir Ciclo de Venda (Automação)', targetValue: 20, unit: '%', perspective: 'PROCESS' },
          { title: 'Conversão de Parceiros em Eventos', targetValue: 15, unit: '%', perspective: 'CUSTOMER' }
        ]
      }
  ];

  for (const pillar of pillars) {
    console.log(`Processing: ${pillar.title}...`);
    
    // Upsert Pillar
    const strategy = await prisma.strategy.upsert({
      where: { code: pillar.code },
      update: {
          title: pillar.title,
          colorCode: pillar.colorCode,
          description: pillar.description
      },
      create: {
        code: pillar.code,
        title: pillar.title,
        type: pillar.type,
        colorCode: pillar.colorCode,
        description: pillar.description,
        startDate: new Date(),
        endDate: new Date('2026-12-31')
      }
    });

    // Create Key Results (Simple cleanup and re-create for idempotency implies delete many, but here lets just create if not exists or ignore)
    // For simplicity in this seed, we iterate and create if title doesn't exist for this strategy
    for (const kr of pillar.keyResults) {
        const existing = await prisma.keyResult.findFirst({
            where: { 
                strategyId: strategy.id,
                title: kr.title
            }
        });

        if (!existing) {
            await prisma.keyResult.create({
                data: {
                    strategyId: strategy.id,
                    title: kr.title,
                    targetValue: kr.targetValue,
                    currentValue: 0,
                    unit: kr.unit,
                    perspective: kr.perspective
                }
            });
        }
    }
  }

  console.log('✅ Seed Completed Successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

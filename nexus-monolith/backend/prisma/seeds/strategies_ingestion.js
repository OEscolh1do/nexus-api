const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const pillars = [
  {
    code: 'PILAR-CRESCIMENTO',
    title: 'Crescimento e Expansão',
    description: 'Pilar de expansão de mercado e receita.',
    type: 'PILLAR',
    colorCode: '#64147D', // Roxo Neonorte
    startDate: new Date('2025-01-01'),
    endDate: new Date('2030-12-31'),
    isActive: true,
    objectives: [
      {
        code: 'EST-CRESCIMENTO-2030',
        title: 'Expansão Geográfica e Receita',
        description: 'Presença em 3 cidades-chave, R$1M receita, 1000 clientes impactados.',
        type: 'OBJECTIVE',
        colorCode: '#7C3AED',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2030-12-31'),
        keyResults: [
          { title: 'Presença em cidades-chave', targetValue: 3, currentValue: 1, unit: 'cidades', perspective: 'CUSTOMER', indicatorType: 'KPI' },
          { title: 'Receita anual', targetValue: 1000000, currentValue: 250000, unit: 'R$', perspective: 'FINANCIAL', indicatorType: 'KPI' },
          { title: 'Clientes impactados', targetValue: 1000, currentValue: 150, unit: 'clientes', perspective: 'CUSTOMER', indicatorType: 'KPI' }
        ]
      },
      {
        code: 'EST-SOLAR-RES-2025',
        title: 'Domínio do Mercado Residencial Solar',
        description: 'Ticket médio R$4.5-5K, economia 90%, pós-venda proativo.',
        type: 'OBJECTIVE',
        colorCode: '#F59E0B',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        keyResults: [
          { title: 'Ticket médio lucro', targetValue: 5000, currentValue: 3800, unit: 'R$', perspective: 'FINANCIAL', indicatorType: 'KPI' },
          { title: 'Economia média clientes', targetValue: 90, currentValue: 85, unit: '%', perspective: 'CUSTOMER', indicatorType: 'KPI' }
        ]
      }
    ]
  },
  {
    code: 'PILAR-OPERACAO',
    title: 'Excelência Operacional',
    description: 'Eficiência e qualidade nos processos internos.',
    type: 'PILLAR',
    colorCode: '#05CD46', // Verde Neonorte
    startDate: new Date('2025-01-01'),
    endDate: new Date('2030-12-31'),
    isActive: true,
    objectives: [
      {
        code: 'EST-OPERACAO-2027',
        title: 'Eficiência e Digitalização',
        description: 'Reduzir tempo execução 30%, satisfação >95%, 100% digital.',
        type: 'OBJECTIVE',
        colorCode: '#10B981',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2027-12-31'),
        keyResults: [
          { title: 'Redução tempo execução', targetValue: 30, currentValue: 10, unit: '%', perspective: 'PROCESS', indicatorType: 'KPI' },
          { title: 'Satisfação do cliente (NPS)', targetValue: 95, currentValue: 88, unit: 'pontos', perspective: 'CUSTOMER', indicatorType: 'KPI' },
          { title: 'Processos digitalizados', targetValue: 100, currentValue: 40, unit: '%', perspective: 'PROCESS', indicatorType: 'OKR' }
        ]
      },
      {
        code: 'EST-GOVERNANCA-2025',
        title: 'Integridade e Governança',
        description: 'Gestão de riscos, compliance e auditorias.',
        type: 'OBJECTIVE',
        colorCode: '#6366F1',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        keyResults: [
          { title: 'Reuniões de comitê', targetValue: 12, currentValue: 2, unit: 'reuniões', perspective: 'PROCESS', indicatorType: 'OKR' },
          { title: 'Auditorias internas', targetValue: 4, currentValue: 0, unit: 'auditorias', perspective: 'PROCESS', indicatorType: 'OKR' }
        ]
      }
    ]
  },
  {
    code: 'PILAR-INOVACAO',
    title: 'Inovação e Tecnologia',
    description: 'Transformação digital e novos modelos de negócio.',
    type: 'PILLAR',
    colorCode: '#3B82F6', // Azul Tech
    startDate: new Date('2026-01-01'),
    endDate: new Date('2030-12-31'),
    isActive: true,
    objectives: [
      {
        code: 'EST-INOVACAO-2028',
        title: 'P&D&I e Plataforma',
        description: 'Departamento P&D, Plataforma SaaS e IoT.',
        type: 'OBJECTIVE',
        colorCode: '#0EA5E9',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2028-12-31'),
        keyResults: [
          { title: 'Departamento P&D criado', targetValue: 1, currentValue: 0, unit: 'un', perspective: 'LEARNING', indicatorType: 'OKR' },
          { title: 'IoT em projetos', targetValue: 50, currentValue: 0, unit: '%', perspective: 'PROCESS', indicatorType: 'OKR' }
        ]
      },
      {
        code: 'EST-SAAS-2027',
        title: 'Software House (SaaS)',
        description: 'Plataforma de gestão energética.',
        type: 'OBJECTIVE',
        colorCode: '#0284C7',
        startDate: new Date('2027-01-01'),
        endDate: new Date('2028-12-31'),
        keyResults: [
          { title: 'Clientes SaaS', targetValue: 50, currentValue: 0, unit: 'clientes', perspective: 'CUSTOMER', indicatorType: 'KPI' }
        ]
      }
    ]
  },
  {
    code: 'PILAR-PESSOAS',
    title: 'Talentos e Cultura',
    description: 'Desenvolvimento humano e cultura forte.',
    type: 'PILLAR',
    colorCode: '#EC4899', // Pink
    startDate: new Date('2025-01-01'),
    endDate: new Date('2030-12-31'),
    isActive: true,
    objectives: [
      {
        code: 'EST-PESSOAS-2026',
        title: 'Time de Alta Performance',
        description: 'Treinamentos, sucessão e employer branding.',
        type: 'OBJECTIVE',
        colorCode: '#DB2777',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-12-31'),
        keyResults: [
          { title: 'Colaboradores treinados em IA', targetValue: 100, currentValue: 20, unit: '%', perspective: 'LEARNING', indicatorType: 'OKR' },
          { title: 'NPS Interno', targetValue: 80, currentValue: 75, unit: 'pontos', perspective: 'LEARNING', indicatorType: 'KPI' }
        ]
      },
      {
        code: 'EST-ACADEMY-2026',
        title: 'Neonorte Academy',
        description: 'Formação técnica e certificações.',
        type: 'OBJECTIVE',
        colorCode: '#9333EA',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2027-12-31'),
        keyResults: [
          { title: 'Alunos formados', targetValue: 100, currentValue: 0, unit: 'alunos', perspective: 'LEARNING', indicatorType: 'KPI' }
        ]
      }
    ]
  }
];

async function main() {
  console.log('🌱 Iniciando seed de estratégias...');

  for (const pilar of pillars) {
    // 1. Criar/Atualizar Pilar
    const { objectives, ...pilarData } = pilar;
    
    // Procura por code para evitar duplicidade
    let pilarDb = await prisma.strategy.findFirst({
        where: { code: pilarData.code }
    });

    if (pilarDb) {
        pilarDb = await prisma.strategy.update({
            where: { id: pilarDb.id },
            data: pilarData
        });
        console.log(`🔄 Pilar atualizado: ${pilarDb.title}`);
    } else {
        pilarDb = await prisma.strategy.create({
            data: pilarData
        });
        console.log(`✅ Pilar criado: ${pilarDb.title}`);
    }

    // 2. Criar/Atualizar Objetivos Filhos
    for (const obj of objectives) {
      const { keyResults, ...objData } = obj;
      
      let objDb = await prisma.strategy.findFirst({
          where: { code: objData.code }
      });

      const objPayload = {
          ...objData,
          parentId: pilarDb.id // Vincula ao pai
      };

      if (objDb) {
          objDb = await prisma.strategy.update({
              where: { id: objDb.id },
              data: objPayload
          });
          console.log(`   🔄 Objetivo atualizado: ${objDb.title}`);
      } else {
          objDb = await prisma.strategy.create({
              data: objPayload
          });
          console.log(`   ✅ Objetivo criado: ${objDb.title}`);
      }

      // 3. Criar Key Results
      // Nota: deletamos KRs antigos e recriamos para garantir consistência ou fazemos upsert
      // Para simplificar e garantir a lista exata, vamos iterar e criar se n existir
      
      for (const kr of keyResults) {
          const krExists = await prisma.keyResult.findFirst({
              where: { 
                  title: kr.title,
                  strategyId: objDb.id
              }
          });

          if (!krExists) {
              await prisma.keyResult.create({
                  data: {
                      ...kr,
                      strategyId: objDb.id
                  }
              });
              console.log(`      🎯 KR criado: ${kr.title}`);
          } else {
              // Opcional: atualizar valores
               await prisma.keyResult.update({
                  where: { id: krExists.id },
                  data: kr
              });
              console.log(`      ✏️ KR atualizado: ${kr.title}`);
          }
      }
    }
  }

  console.log('✅ Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

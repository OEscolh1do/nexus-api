const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed Comercial...');

  // 1. Obter Usuário ADMIN para atribuição
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!adminUser) {
    console.error('❌ Nenhum usuário ADMIN encontrado. Rode o seed de usuários primeiro.');
    process.exit(1);
  }

  console.log(`👤 Usando usuário ADMIN: ${adminUser.username} (${adminUser.id})`);

  // --- CENÁRIO A: LEAD FRIO (Novo, sem interação) ---
  console.log('🧊 Criando Lead Frio...');
  await prisma.lead.create({
    data: {
      name: 'Padaria do Seu João',
      email: 'joao@padaria.com.br',
      phone: '94999998888',
      source: 'Indicação',
      status: 'NEW',
      assignedTo: adminUser.id,
    },
  });

  // --- CENÁRIO B: LEAD EM NEGOCIAÇÃO (Com Quotes) ---
  console.log('🤝 Criando Lead em Negociação...');
  const activeLead = await prisma.lead.create({
    data: {
      name: 'Mercado Super Mais',
      email: 'compras@supermais.com.br',
      phone: '94988887777',
      source: 'Site',
      status: 'QUOTED',
      assignedTo: adminUser.id,
    },
  });

  const randomSuffix = Math.floor(Math.random() * 100000);
  const quoteNumA = `QT-2026-${randomSuffix}`;

  // Quote V1 (Arquivado/Superado)
  await prisma.quote.create({
    data: {
      quoteNumber: quoteNumA,
      leadId: activeLead.id,
      version: 1,
      status: 'ARCHIVED',
      archivedReason: 'Cliente solicitou revisão de potência',
      archivedAt: new Date(),
      totalCost: 25000.00,
      proposedPrice: 32000.00,
      margin: 21.8,
      solarData: JSON.stringify({ power: 5000, modules: 10 }), // Mock data simplificado
      createdBy: adminUser.id,
    },
  });

  // Quote V2 (Pendente de Aprovação)
  await prisma.quote.create({
    data: {
      quoteNumber: quoteNumA, // Mesmo número, versão diferente
      leadId: activeLead.id,
      version: 2,
      status: 'PENDING',
      totalCost: 28000.00,
      proposedPrice: 36000.00,
      margin: 22.2,
      solarData: JSON.stringify({ power: 6000, modules: 12 }),
      createdBy: adminUser.id,
    },
  });

  // --- CENÁRIO C: LEAD GANHO (Projeto deve ser gerado pelo sistema, aqui simulamos o estado final) ---
  console.log('🏆 Criando Lead Ganho (Project Ready)...');
  const wonLead = await prisma.lead.create({
    data: {
      name: 'Fazenda Boa Esperança',
      email: 'contato@fazendabe.com',
      phone: '94977776666',
      source: 'Evento Agrishow',
      status: 'WON',
      assignedTo: adminUser.id,
    },
  });

  const quoteNumB = `QT-2026-${Math.floor(Math.random() * 100000)}`;

  // Quote Aprovado
  const approvedQuote = await prisma.quote.create({
    data: {
      quoteNumber: quoteNumB,
      leadId: wonLead.id,
      version: 1,
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: adminUser.id,
      totalCost: 150000.00,
      proposedPrice: 210000.00,
      margin: 28.5,
      solarData: JSON.stringify({ 
        clientName: "Fazenda Boa Esperança",
        power: 45000, 
        modules: 90 
      }),
      createdBy: adminUser.id,
    },
  });

  // Opcional: Criar Projeto vinculado se o backend não tiver trigger automático (depende da implementação do approve)
  // Como estamos apenas populando dados, vamos deixar sem projeto para testar se o botão "Gerar Projeto" aparece ou se o sistema gerou.
  // NO ENTANTO, para a Milestone 4 funcionar (link de projeto para quote), seria bom ter UM projeto linkado.
  // Vamos criar um projeto manualmente linkado a este quote para validar o ReadOnly.

  console.log('🏗️ Criando Projeto vinculado para teste de ReadOnly...');
  await prisma.project.create({
    data: {
      title: 'Usina Solo - Fazenda BE',
      description: 'Projeto fotovoltaico de solo 45kWp',
      status: 'ATIVO',
      type: 'SOLAR',
      strategyId: (await prisma.strategy.findFirst()).id, // Pega qualquer estratégia válida
      managerId: adminUser.id,
      quoteId: approvedQuote.id, // VÍNCULO IMPORTANTE
      details: approvedQuote.solarData, // Copia dados para manter compatibilidade
    }
  });

  console.log('✅ Seed Comercial Concluído com Sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

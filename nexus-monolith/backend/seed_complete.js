const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearAndSeed() {
  try {
    console.log('🧹 Limpando dados existentes...\n');

    // Limpar dados na ordem correta (respeitar foreign keys)
    await prisma.checklistItem.deleteMany({});
    console.log('✓ ChecklistItem limpo');
    
    await prisma.checklist.deleteMany({});
    console.log('✓ Checklist limpo');
    
    await prisma.taskDependency.deleteMany({});
    console.log('✓ TaskDependency limpo');
    
    await prisma.task.deleteMany({});
    console.log('✓ Task limpo');
    
    await prisma.project.deleteMany({});
    console.log('✓ Project limpo');
    
    await prisma.keyResult.deleteMany({});
    console.log('✓ KeyResult limpo');
    
    await prisma.strategy.deleteMany({});
    console.log('✓ Strategy limpo');
    
    await prisma.hRLeave.deleteMany({});
    console.log('✓ HRLeave limpo');
    
    // Limpar AuditLog (se existir)
    try {
      await prisma.auditLog.deleteMany({});
      console.log('✓ AuditLog limpo');
    } catch (e) {
      console.log('⚠ AuditLog não existe ainda (normal em primeira execução)');
    }
    
    await prisma.user.deleteMany({});
    console.log('✓ User limpo');

    console.log('\n📦 Populando dados iniciais...\n');

    // 1. Criar usuário ADMIN
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        password: '123', // TODO: Usar bcrypt em produção
        fullName: 'Administrador do Sistema',
        role: 'ADMIN',
        jobTitle: 'Administrador',
        isActive: true,
      },
    });
    console.log('✓ Usuário admin criado (username: admin, password: 123)');

    // 2. Criar usuário COORDENACAO
    const coord = await prisma.user.create({
      data: {
        username: 'coord',
        password: '123',
        fullName: 'Coordenador de Projetos',
        role: 'COORDENACAO',
        jobTitle: 'Coordenador',
        isActive: true,
      },
    });
    console.log('✓ Usuário coordenador criado (username: coord, password: 123)');

    // 3. Criar usuário VENDEDOR
    const vendedor = await prisma.user.create({
      data: {
        username: 'vendedor',
        password: '123',
        fullName: 'João Vendedor',
        role: 'VENDEDOR',
        jobTitle: 'Vendedor Solar',
        isActive: true,
      },
    });
    console.log('✓ Usuário vendedor criado (username: vendedor, password: 123)');

    // 4. Criar estratégia padrão
    const strategy = await prisma.strategy.create({
      data: {
        code: 'PPA-2026',
        title: 'Plano Estratégico 2026',
        description: 'Estratégia de crescimento e consolidação no mercado solar',
        colorCode: 'bg-blue-500',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        isActive: true,
      },
    });
    console.log('✓ Estratégia padrão criada (PPA-2026)');

    // 5. Criar KeyResult exemplo
    const kr = await prisma.keyResult.create({
      data: {
        title: 'Potência instalada (kWp)',
        targetValue: 5000,
        currentValue: 0,
        unit: 'kWp',
        strategyId: strategy.id,
      },
    });
    console.log('✓ Key Result criado (Potência instalada)');

    // 6. Criar projeto exemplo SOLAR
    const projectSolar = await prisma.project.create({
      data: {
        title: 'Projeto Solar - Cliente Demo',
        description: 'Exemplo de projeto de energia solar',
        type: 'SOLAR',
        status: 'ATIVO',
        progress: 0,
        startDate: new Date(),
        strategyId: strategy.id,
        managerId: vendedor.id, // Projeto do vendedor
        details: JSON.stringify({
          solar: {
            version: "1.0",
            inputData: {
              address: "Rua Exemplo, 123 - São Paulo/SP",
              monthlyConsumption: 750,
            }
          }
        }),
      },
    });
    console.log('✓ Projeto Solar exemplo criado');

    // 7. Criar projeto GENERIC
    const projectGeneric = await prisma.project.create({
      data: {
        title: 'Projeto Genérico - Cliente Demo',
        description: 'Exemplo de projeto genérico',
        type: 'GENERIC',
        status: 'ATIVO',
        progress: 25,
        startDate: new Date(),
        strategyId: strategy.id,
        managerId: admin.id,
      },
    });
    console.log('✓ Projeto Genérico exemplo criado');

    // 8. Criar tarefa exemplo
    const task = await prisma.task.create({
      data: {
        title: 'Visita técnica ao local',
        description: 'Realizar medições e análise de viabilidade',
        status: 'EM_ANDAMENTO',
        priority: 'HIGH',
        projectId: projectSolar.id,
        assigneeId: vendedor.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 dias
        completionPercent: 30,
      },
    });
    console.log('✓ Tarefa exemplo criada');

    // 9. Criar checklist para a tarefa
    const checklist = await prisma.checklist.create({
      data: {
        title: 'Checklist de Visita Técnica',
        taskId: task.id,
        items: {
          create: [
            { title: 'Fotografar telhado', isCompleted: true },
            { title: 'Medir área disponível', isCompleted: true },
            { title: 'Verificar quadro elétrico', isCompleted: false },
            { title: 'Coletar conta de luz', isCompleted: false },
          ],
        },
      },
    });
    console.log('✓ Checklist criado com 4 itens');

    console.log('\n✅ Seed completo!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('CREDENCIAIS DE ACESSO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('👤 Admin:');
    console.log('   Username: admin');
    console.log('   Password: 123');
    console.log('   Role: ADMIN (acesso total)');
    console.log('');
    console.log('👤 Coordenador:');
    console.log('   Username: coord');
    console.log('   Password: 123');
    console.log('   Role: COORDENACAO (leitura/escrita em projetos)');
    console.log('');
    console.log('👤 Vendedor:');
    console.log('   Username: vendedor');
    console.log('   Password: 123');
    console.log('   Role: VENDEDOR (apenas projetos próprios)');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('DADOS CRIADOS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log(`✓ 3 Usuários (IDs: ${admin.id}, ${coord.id}, ${vendedor.id})`);
    console.log(`✓ 1 Estratégia (ID: ${strategy.id})`);
    console.log(`✓ 1 Key Result (ID: ${kr.id})`);
    console.log(`✓ 2 Projetos (IDs: ${projectSolar.id}, ${projectGeneric.id})`);
    console.log(`✓ 1 Tarefa (ID: ${task.id})`);
    console.log(`✓ 1 Checklist com 4 itens`);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🚀 Pronto para testar!');
    console.log('   POST http://localhost:3001/auth/login');
    console.log('');

  } catch (error) {
    console.error('❌ Erro ao executar seed:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearAndSeed();

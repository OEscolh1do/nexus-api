/**
 * @file create_admin_user.js
 * @description Script para criar o usuário administrativo principal no banco Hostinger.
 * 
 * ATENÇÃO: Este script deve ser executado UMA VEZ após a configuração do banco.
 * Ele irá criar ou atualizar o usuário "Tecnologia_Neonorte" com perfil ADMIN.
 * 
 * Uso: node prisma/seeds/create_admin_user.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Campos alinhados com o schema.prisma do modelo User
const ADMIN_USER = {
  username: 'Tecnologia_Neonorte',
  password: 'neonorte@2026', // TODO: Hash com bcrypt em produção
  fullName: 'Tecnologia Neonorte',
  role: 'ADMIN',
  jobTitle: 'Administrador do Sistema',
  hierarchyLevel: 'C-LEVEL',
  isActive: true,
};

async function main() {
  console.log('🔐 Iniciando criação do usuário administrativo...');
  
  const dbHost = process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'localhost';
  console.log(`📌 Conectando ao banco: ${dbHost}`);

  try {
    // Upsert: cria se não existir, atualiza se existir
    const user = await prisma.user.upsert({
      where: { username: ADMIN_USER.username },
      update: {
        password: ADMIN_USER.password,
        fullName: ADMIN_USER.fullName,
        role: ADMIN_USER.role,
        jobTitle: ADMIN_USER.jobTitle,
        hierarchyLevel: ADMIN_USER.hierarchyLevel,
        isActive: ADMIN_USER.isActive,
      },
      create: ADMIN_USER,
    });

    console.log('');
    console.log('✅ Usuário administrativo criado/atualizado com sucesso!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   ID:       ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   FullName: ${user.fullName}`);
    console.log(`   Role:     ${user.role}`);
    console.log(`   Nivel:    ${user.hierarchyLevel || 'N/A'}`);
    console.log(`   Ativo:    ${user.isActive ? 'Sim' : 'Não'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Erro ao criar usuário:', error.message);
    
    if (error.code === 'P1001') {
      console.error('');
      console.error('💡 Não foi possível conectar ao banco. Verifique:');
      console.error('   - Conexão com a internet');
      console.error('   - URL do banco no .env');
      console.error('   - Firewall/permissões do servidor');
    }
    
    if (error.code === 'P2002') {
      console.error('');
      console.error('💡 Usuário já existe com esse username.');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

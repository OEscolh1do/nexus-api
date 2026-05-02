/**
 * Script de migração de usuários locais (Iaçã/Sumaúma) para o ZITADEL.
 * 
 * ATENÇÃO: Este script deve ser executado no servidor backend,
 * com acesso às variáveis de ambiente:
 * - DATABASE_URL (para Prisma)
 * - ZITADEL_API_URL
 * - ZITADEL_SERVICE_TOKEN
 * 
 * Uso:
 * node seed_zitadel_migration.js
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');

// Tenta carregar env local se rodando na máquina do dev
if (fs.existsSync('../../iaca/backend/.env')) {
  dotenv.config({ path: '../../iaca/backend/.env' });
} else {
  dotenv.config();
}

const prisma = new PrismaClient();

const zitadelClient = axios.create({
  baseURL: process.env.ZITADEL_API_URL || 'https://api.zitadel.cloud',
  headers: {
    'Authorization': `Bearer ${process.env.ZITADEL_SERVICE_TOKEN}`,
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

async function main() {
  console.log('🚀 Iniciando script de migração para o ZITADEL...');

  if (!process.env.ZITADEL_SERVICE_TOKEN) {
    console.error('❌ ERRO: ZITADEL_SERVICE_TOKEN não definido. Abortando.');
    process.exit(1);
  }

  try {
    // 1. Buscar todos os usuários sem authProviderId
    const usersToMigrate = await prisma.user.findMany({
      where: {
        authProviderId: null,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        password: true,
        tenantId: true,
      }
    });

    console.log(`Encontrados ${usersToMigrate.length} usuários para migração.`);

    if (usersToMigrate.length === 0) {
      console.log('✅ Nenhum usuário pendente de migração.');
      return;
    }

    // 2. Para cada usuário, criar no Zitadel
    for (const user of usersToMigrate) {
      console.log(`\nMigrando usuário: ${user.username} (${user.id})...`);
      try {
        const [firstName, ...lastNameArr] = user.fullName.split(' ');
        const lastName = lastNameArr.join(' ') || 'User';

        // Determina se a senha é bcrypt ou plaintext
        const isBcrypt = user.password.startsWith('$2');

        const payload = {
          organizationId: user.tenantId,
          username: user.username,
          human: {
            profile: {
              givenName: firstName,
              familyName: lastName,
            },
            email: {
              email: `${user.username}@neonorte.local`,
              isVerified: true,
            },
          }
        };

        if (isBcrypt) {
          payload.human.hashedPassword = {
            hash: user.password
          };
          console.log(`  - Hash bcrypt detectado (migração transparente com preservação de senha)`);
        } else {
          payload.human.password = {
            password: user.password,
            changeRequired: true
          };
          console.log(`  - Senha em plaintext detectada (exigirá troca no primeiro acesso)`);
        }

        const response = await zitadelClient.post('/v2/users', payload);

        const zitadelUserId = response.data.id;
        console.log(`  ✅ Criado no ZITADEL v2 com ID: ${zitadelUserId}`);

        // 3. Atualizar o Prisma
        await prisma.user.update({
          where: { id: user.id },
          data: { authProviderId: zitadelUserId }
        });
        console.log(`  ✅ Referência atualizada no banco local.`);

      } catch (err) {
        console.error(`  ❌ Falha ao migrar ${user.username}:`, err.response?.data || err.message);
      }
    }

    console.log('\n🎉 Migração concluída.');

  } catch (err) {
    console.error('❌ Falha fatal:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

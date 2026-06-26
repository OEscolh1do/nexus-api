#!/usr/bin/env node
// =============================================================
// Sumaúma — Vincular operador local à conta Logto (authProviderId)
//
// Uso: node scripts/link-logto-operator.js <email-logto>
//
// Quando executar: sempre que um operador foi criado via
// create-operator.js (local) mas ainda não tem authProviderId
// configurado (ou seja, não consegue logar via SSO Logto).
//
// O que faz:
//   1. Busca o usuário no Logto Cloud pela Management API (por email)
//   2. Atualiza User.authProviderId = logto.sub no db_sumauma
// =============================================================

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const targetEmail = process.argv[2];

if (!targetEmail) {
  console.error('\n❌ Uso: node scripts/link-logto-operator.js <email-logto>\n');
  process.exit(1);
}

async function getLogtoManagementToken() {
  const endpoint = process.env.LOGTO_ENDPOINT;
  const clientId = process.env.LOGTO_M2M_CLIENT_ID;
  const clientSecret = process.env.LOGTO_M2M_CLIENT_SECRET;

  const res = await axios.post(
    `${endpoint}/oidc/token`,
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'all',
      resource: `${endpoint}/api`,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return res.data.access_token;
}

async function findLogtoUserByEmail(token, email) {
  const endpoint = process.env.LOGTO_ENDPOINT;
  // Logto Management API: GET /api/users?search=<email>
  const res = await axios.get(
    `${endpoint}/api/users?search=${encodeURIComponent(email)}&page=1&page_size=10`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const users = res.data;
  if (!Array.isArray(users) || users.length === 0) return null;
  // Filtrar pelo email exato
  return users.find(u =>
    u.primaryEmail?.toLowerCase() === email.toLowerCase() ||
    u.primaryPhone === email ||
    u.username?.toLowerCase() === email.toLowerCase()
  ) || null;
}

async function main() {
  console.log('\n══════════════════════════════════════════════════');
  console.log(' SUMAÚMA — Vincular Operador ao Logto (SSO)');
  console.log('══════════════════════════════════════════════════\n');
  console.log(`Buscando usuário no Logto: "${targetEmail}"\n`);

  // 1. Token de Management API
  const mgmtToken = await getLogtoManagementToken();
  console.log('✅ Token Management API obtido.');

  // 2. Buscar usuário no Logto por email
  const logtoUser = await findLogtoUserByEmail(mgmtToken, targetEmail);
  if (!logtoUser) {
    console.error(`❌ Usuário "${targetEmail}" não encontrado no Logto.`);
    console.error('   Verifique se o email está correto e se o usuário existe no Logto Cloud.');
    process.exit(1);
  }

  console.log(`✅ Usuário Logto encontrado:`);
  console.log(`   sub (ID): ${logtoUser.id}`);
  console.log(`   email:    ${logtoUser.primaryEmail}`);
  console.log(`   username: ${logtoUser.username || '—'}`);
  console.log(`   name:     ${logtoUser.name || '—'}`);
  console.log('');

  // 3. Buscar operador no banco pelo email ou username
  const dbUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: targetEmail },
        { username: targetEmail },
      ]
    },
    select: { id: true, username: true, role: true, authProviderId: true }
  });

  if (!dbUser) {
    console.error(`❌ Operador "${targetEmail}" não encontrado em db_sumauma.`);
    console.error('   Execute create-operator.js primeiro para criar o registro local.');
    process.exit(1);
  }

  console.log(`✅ Operador local encontrado:`);
  console.log(`   ID:             ${dbUser.id}`);
  console.log(`   username:       ${dbUser.username}`);
  console.log(`   role:           ${dbUser.role}`);
  console.log(`   authProviderId: ${dbUser.authProviderId || '(não vinculado)'}`);
  console.log('');

  if (dbUser.role !== 'PLATFORM_ADMIN') {
    console.error(`❌ O usuário "${targetEmail}" não tem role PLATFORM_ADMIN no banco.`);
    process.exit(1);
  }

  if (dbUser.authProviderId === logtoUser.id) {
    console.log('✅ authProviderId já está configurado corretamente. Nenhuma ação necessária.');
    process.exit(0);
  }

  if (dbUser.authProviderId && dbUser.authProviderId !== logtoUser.id) {
    console.warn(`⚠️  authProviderId já estava configurado com valor diferente:`);
    console.warn(`   Antigo: ${dbUser.authProviderId}`);
    console.warn(`   Novo:   ${logtoUser.id}`);
    console.warn('   Sobrescrevendo...\n');
  }

  // 4. Atualizar authProviderId
  await prisma.user.update({
    where: { id: dbUser.id },
    data: { authProviderId: logtoUser.id }
  });

  console.log(`✅ authProviderId atualizado com sucesso!`);
  console.log(`   ${dbUser.id} → authProviderId = ${logtoUser.id}`);
  console.log('\n   O operador agora pode autenticar via SSO Logto.\n');
  console.log('══════════════════════════════════════════════════\n');
}

main()
  .catch(err => {
    console.error('\n❌ Erro fatal:', err.response?.data || err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

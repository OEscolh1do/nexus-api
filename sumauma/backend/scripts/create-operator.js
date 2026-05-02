#!/usr/bin/env node
// =============================================================
// Sumaúma — Script CLI: Criar Operador de Plataforma
//
// Uso: node scripts/create-operator.js
//
// Este é o ÚNICO caminho autorizado para criar um Operador de
// Plataforma (PLATFORM_ADMIN). Deve ser executado diretamente
// no servidor via SSH. Nunca expor via HTTP.
// =============================================================

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const readline = require('readline');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function askHidden(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.setRawMode?.(true);
    let input = '';
    process.stdin.on('data', function handler(char) {
      char = char.toString();
      if (char === '\r' || char === '\n') {
        process.stdin.setRawMode?.(false);
        process.stdin.removeListener('data', handler);
        process.stdout.write('\n');
        resolve(input);
      } else if (char === '\u0003') {
        process.exit();
      } else if (char === '\u007f') {
        input = input.slice(0, -1);
      } else {
        input += char;
        process.stdout.write('*');
      }
    });
  });
}

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  SUMAÚMA — Criação de Operador de Plataforma         ║');
  console.log('║  ⚠️  ACESSO RESTRITO — SOMENTE VIA SERVIDOR           ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Este operador terá acesso irrestrito ao painel Sumaúma.');
  console.log('Certifique-se de que esta ação é autorizada.\n');

  const fullName = await ask('Nome completo: ');
  if (!fullName.trim()) {
    console.error('\nErro: Nome completo é obrigatório.');
    process.exit(1);
  }

  const username = await ask('Username: ');
  if (!username.trim() || /\s/.test(username)) {
    console.error('\nErro: Username inválido (não pode conter espaços).');
    process.exit(1);
  }

  const password = await askHidden('Senha (min. 12 caracteres para operadores): ');
  if (password.length < 12) {
    console.error('\nErro: Operadores de plataforma requerem senha de no mínimo 12 caracteres.');
    process.exit(1);
  }

  const confirm = await askHidden('Confirme a senha: ');
  if (password !== confirm) {
    console.error('\nErro: As senhas não coincidem.');
    process.exit(1);
  }

  const reason = await ask('\nMotivo da criação (para auditoria): ');
  if (!reason.trim()) {
    console.error('\nErro: O motivo é obrigatório para fins de auditoria.');
    process.exit(1);
  }

  console.log('\n──────────────────────────────────────────────────────');
  console.log('Confirmação:');
  console.log(`  Nome: ${fullName.trim()}`);
  console.log(`  Username: ${username.trim()}`);
  console.log(`  Role: PLATFORM_ADMIN`);
  console.log(`  Motivo: ${reason.trim()}`);
  console.log('──────────────────────────────────────────────────────');

  const confirm2 = await ask('\nDigite CONFIRMAR para prosseguir: ');
  if (confirm2.trim() !== 'CONFIRMAR') {
    console.log('\nOperação cancelada.');
    process.exit(0);
  }

  // Buscar tenant MASTER para vincular o operador
  const masterTenant = await prisma.tenant.findFirst({
    where: { type: 'MASTER' }
  });

  if (!masterTenant) {
    console.error('\nErro: Tenant MASTER não encontrado no banco. Execute o seed primeiro.');
    process.exit(1);
  }

  // Verificar se username já existe
  const existing = await prisma.user.findFirst({ where: { username: username.trim() } });
  if (existing) {
    console.error(`\nErro: Username '${username.trim()}' já está em uso.`);
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 12); // Salt mais alto para operadores

  const operator = await prisma.user.create({
    data: {
      fullName: fullName.trim(),
      username: username.trim(),
      password: hashedPassword,
      role: 'PLATFORM_ADMIN',
      tenantId: masterTenant.id,
      status: 'ACTIVE',
    }
  });

  console.log('\n✅ Operador criado com sucesso!');
  console.log(`   ID: ${operator.id}`);
  console.log(`   Username: ${operator.username}`);
  console.log(`   Role: ${operator.role}`);
  console.log('\n⚠️  Compartilhe as credenciais por canal seguro e peça que o operador');
  console.log('   altere a senha no primeiro acesso.\n');

  rl.close();
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('\nErro fatal:', err.message);
  rl.close();
  await prisma.$disconnect();
  process.exit(1);
});

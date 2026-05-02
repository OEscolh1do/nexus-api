const prismaIaca = require('../src/lib/prismaIaca');
const prismaKurupira = require('../src/lib/prismaKurupira');
const prismaSumauma = require('../src/lib/prismaSumauma');

async function testConnections() {
  console.log('--- Inspeção Profunda de Bancos Sumaúma ---');
  
  const targets = [
    { name: 'db_sumauma (Master)', client: prismaSumauma },
    { name: 'db_iaca (RO)', client: prismaIaca },
    { name: 'db_kurupira (RO)', client: prismaKurupira }
  ];

  for (const target of targets) {
    try {
      console.log(`\n[${target.name}] Tabelas:`);
      const tables = await target.client.$queryRaw`SHOW TABLES`;
      console.log(tables.map(t => Object.values(t)[0]));
    } catch (err) {
      console.error(`❌ ${target.name}: Falha`);
      console.error(err.message);
    }
  }

  process.exit(0);
}

testConnections();

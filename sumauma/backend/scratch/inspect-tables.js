const mysql = require('mysql2/promise');
require('dotenv').config();

async function inspectDatabases() {
  const configs = [
    { name: 'db_iaca', url: process.env.DATABASE_URL_IACA_RO },
    { name: 'db_kurupira', url: process.env.DATABASE_URL_KURUPIRA_RO }
  ];

  for (const config of configs) {
    console.log(`\n--- Inspecionando ${config.name} ---`);
    try {
      const connection = await mysql.createConnection(config.url);
      const [rows] = await connection.execute('SHOW TABLES');
      console.log(`Tabelas encontradas:`, rows.map(r => Object.values(r)[0]));
      await connection.end();
    } catch (err) {
      console.error(`Erro ao conectar em ${config.name}:`, err.message);
    }
  }
}

inspectDatabases();

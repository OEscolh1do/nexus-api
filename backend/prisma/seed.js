// /backend/prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Dados extraídos diretamente da sua planilha "IRRADIAÇÃO.csv"
// (Mapeando 'Peba' para Parauapebas)
const locationsData = [
  {
    city: 'Parauapebas',
    state: 'PA',
    irradiation: [4.32, 4.46, 4.58, 4.73, 4.98, 5.29, 5.34, 5.72, 5.19, 4.72, 4.53, 4.4] // 12 meses
  },
  {
    city: 'Belém',
    state: 'PA',
    irradiation: [4.24, 4.17, 4.25, 4.35, 4.64, 4.98, 5.04, 5.2, 5.21, 5.0, 4.7, 4.45] // 12 meses
  }
  // Adicione outras cidades aqui se precisar
];

async function main() {
  console.log(`🌱 Iniciando o seed do banco de dados...`);

  for (const loc of locationsData) {
    console.log(`Verificando/Criando localização: ${loc.city}...`);
    
    // Usamos 'upsert' para evitar duplicatas se você rodar o script de novo
    const location = await prisma.location.upsert({
      where: { city: loc.city },
      update: {}, // Não faz nada se já existir
      create: {
        city: loc.city,
        state: loc.state,
        // Cria os 12 registros de irradiação JUNTOS
        irradiation: {
          create: loc.irradiation.map((value, index) => ({
            month: index + 1, // 1 para Jan, 2 para Fev, etc.
            irradiation: value
          }))
        }
      }
    });
    console.log(`✅ Localização ${location.city} processada.`);
  }

  console.log(`🎉 Seed completo!`);
}

// Executa a função principal
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
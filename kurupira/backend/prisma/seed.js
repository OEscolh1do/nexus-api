const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do Kurupira (Engenharia PV)...');

  console.log('   Limpando catálogos existentes...');
  await prisma.moduleCatalog.deleteMany({});
  await prisma.inverterCatalog.deleteMany({});

  console.log('   Semeando ModuleCatalog (Módulos de teste v3.7)...');
  await prisma.moduleCatalog.create({
    data: {
      manufacturer: 'Canadian Solar',
      model: 'CS6W-550MS',
      powerWp: 550,
      efficiency: 0.213,
      dimensions: '2278x1134x35mm',
      weight: 27.6,
      isActive: true,
      bifacial: false,
      bifacialityFactor: null,
      noct: 41,
      tempCoeffVoc: -0.27,
      tempCoeffPmax: -0.34,
      cellSizeClass: 'M10',
      degradacaoAnual: 0.0055,
      electricalData: { voc: 49.6, isc: 14.0, vmp: 41.7, imp: 13.2 }
    }
  });

  console.log('   Semeando InverterCatalog (Inversores de teste v3.7)...');
  await prisma.inverterCatalog.create({
    data: {
      manufacturer: 'Huawei',
      model: 'SUN2000-5KTL-L1',
      nominalPowerW: 5000,
      maxInputV: 600,
      mpptCount: 2,
      efficiency: 0.984,
      isActive: true,
      Voc_max_hardware: 600,
      Isc_max_hardware: 18,
      coolingType: 'passive',
      afci: true,
      rsd: true,
      portaria515Compliant: true,
      electricalData: { minMpptVoltage: 90, maxMpptVoltage: 560, maxCurrentPerMPPT: 12.5 }
    }
  });

  console.log('✅ Seed do Kurupira concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

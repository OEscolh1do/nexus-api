// /backend/prisma/seed_catalog.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('📦 Iniciando Seed do Catálogo...');

  // 1. Limpa dados antigos (opcional, cuidado em produção)
  // await prisma.solarPanel.deleteMany({});
  // await prisma.inverter.deleteMany({});

  // --- PAINÉIS SOLARES (Baseado em BD-Módulos.csv) ---
  const panels = [
    { model: 'Jinko Tiger Neo 555W', manufacturer: 'Jinko', power: 555, efficiency: 0.215, area: 2.58, weight: 28.0 },
    { model: 'Canadian CS6W 550W', manufacturer: 'Canadian', power: 550, efficiency: 0.213, area: 2.56, weight: 27.6 },
    { model: 'Trina Vertex 550W', manufacturer: 'Trina', power: 550, efficiency: 0.210, area: 2.54, weight: 27.8 },
    { model: 'JA Solar 550W', manufacturer: 'JA Solar', power: 550, efficiency: 0.212, area: 2.55, weight: 28.0 },
    { model: 'Longi Hi-MO 550W', manufacturer: 'Longi', power: 550, efficiency: 0.213, area: 2.50, weight: 27.2 },
  ];

  for (const p of panels) {
    await prisma.solarPanel.upsert({
      where: { model: p.model },
      update: {},
      create: p,
    });
  }
  console.log(`✅ ${panels.length} Painéis cadastrados.`);

  // --- INVERSORES (Baseado em BD-Inversores.csv) ---
  const inverters = [
    { model: 'Growatt MIN 3000', manufacturer: 'Growatt', power: 3.0, voltage: 220, mpptCount: 2 },
    { model: 'Growatt MIN 5000', manufacturer: 'Growatt', power: 5.0, voltage: 220, mpptCount: 2 },
    { model: 'Growatt MIN 8000', manufacturer: 'Growatt', power: 8.0, voltage: 220, mpptCount: 2 },
    { model: 'Deye SUN-5K-G', manufacturer: 'Deye', power: 5.0, voltage: 220, mpptCount: 2 },
    { model: 'Deye SUN-8K-G', manufacturer: 'Deye', power: 8.0, voltage: 220, mpptCount: 2 },
    { model: 'Solis 5K-4G', manufacturer: 'Solis', power: 5.0, voltage: 220, mpptCount: 2 },
    { model: 'PHB 3000-NS', manufacturer: 'PHB', power: 3.0, voltage: 220, mpptCount: 1 },
    { model: 'PHB 9300-MS', manufacturer: 'PHB', power: 9.3, voltage: 220, mpptCount: 3 },
  ];

  for (const inv of inverters) {
    await prisma.inverter.upsert({
      where: { model: inv.model },
      update: {},
      create: inv,
    });
  }
  console.log(`✅ ${inverters.length} Inversores cadastrados.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
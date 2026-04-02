/**
 * Kurupira — Seed de Catálogo de Equipamentos
 * Popula ModuleCatalog e InverterCatalog com dados do inventário local do frontend.
 * Fonte única validada pelo Antigravity: CSVs oficiais Neonorte (DMEGC, PHB, Huawei).
 *
 * Executar com: node prisma/seed-catalog.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── Módulos Fotovoltaicos (100% Espelho docs/modulos_fv_comparativo.csv) ─────
const MODULES = [
  { manufacturer: "DMEGC", model: "DM610G12RT-B66HSW", electrical: { pmax: 610, vmp: 40.45, imp: 15.09, voc: 48.69, isc: 15.99, efficiency: 0.226, tempCoeffVoc: -0.0025 }, physical: { widthMm: 1134, heightMm: 2382, depthMm: 30, weightKg: 32.3, cells: 132 } },
  { manufacturer: "DMEGC", model: "DM615G12RT-B66HSW", electrical: { pmax: 615, vmp: 40.65, imp: 15.15, voc: 48.89, isc: 16.05, efficiency: 0.228, tempCoeffVoc: -0.0025 }, physical: { widthMm: 1134, heightMm: 2382, depthMm: 30, weightKg: 32.3, cells: 132 } },
  { manufacturer: "DMEGC", model: "DM620G12RT-B66HSW", electrical: { pmax: 620, vmp: 40.85, imp: 15.20, voc: 49.09, isc: 16.11, efficiency: 0.230, tempCoeffVoc: -0.0025 }, physical: { widthMm: 1134, heightMm: 2382, depthMm: 30, weightKg: 32.3, cells: 132 } },
  { manufacturer: "DMEGC", model: "DM625G12RT-B66HSW", electrical: { pmax: 625, vmp: 41.05, imp: 15.25, voc: 49.29, isc: 16.17, efficiency: 0.231, tempCoeffVoc: -0.0025 }, physical: { widthMm: 1134, heightMm: 2382, depthMm: 30, weightKg: 32.3, cells: 132 } },
  { manufacturer: "DMEGC", model: "DM630G12RT-B66HSW", electrical: { pmax: 630, vmp: 41.25, imp: 15.30, voc: 49.49, isc: 16.23, efficiency: 0.233, tempCoeffVoc: -0.0025 }, physical: { widthMm: 1134, heightMm: 2382, depthMm: 30, weightKg: 32.3, cells: 132 } },
  { manufacturer: "DMEGC", model: "DM635G12RT-B66HSW", electrical: { pmax: 635, vmp: 41.45, imp: 15.35, voc: 49.69, isc: 16.29, efficiency: 0.235, tempCoeffVoc: -0.0025 }, physical: { widthMm: 1134, heightMm: 2382, depthMm: 30, weightKg: 32.3, cells: 132 } },
];

// ─── Inversores (100% Espelho frontend INVERTER_CATALOG achatedo) ──────────────
const INVERTERS = [
  // PHB Solar — Monofásicos 127V
  { manufacturer: "PHB Solar", model: "PHB2000-XS",     nominalPowerW: 2000, maxInputV: 550, efficiency: 97.6, electricalData: { minInputV: 40, maxInputCurrent: 16.0, maxOutputCurrent: 15.7, outputVoltage: 127, outputFrequency: 60, weight: 5.8,  connectionType: "Monofásico" } },
  { manufacturer: "PHB Solar", model: "PHB3100D-YS",    nominalPowerW: 3100, maxInputV: 550, efficiency: 96.4, electricalData: { minInputV: 40, maxInputCurrent: 20.0, maxOutputCurrent: 24.4, outputVoltage: 127, outputFrequency: 60, weight: 9.2,  connectionType: "Monofásico" } },
  // PHB Solar — Monofásicos 220V
  { manufacturer: "PHB Solar", model: "PHB3300-XS",     nominalPowerW: 3300, maxInputV: 600, efficiency: 97.6, electricalData: { minInputV: 40, maxInputCurrent: 16.0, maxOutputCurrent: 15.0, outputVoltage: 220, outputFrequency: 60, weight: 5.8,  connectionType: "Monofásico" } },
  { manufacturer: "PHB Solar", model: "PHB4000D-YS",    nominalPowerW: 4000, maxInputV: 600, efficiency: 98.1, electricalData: { minInputV: 40, maxInputCurrent: 20.0, maxOutputCurrent: 18.2, outputVoltage: 220, outputFrequency: 60, weight: 9.2,  connectionType: "Monofásico" } },
  { manufacturer: "PHB Solar", model: "PHB5000D-YS",    nominalPowerW: 5000, maxInputV: 600, efficiency: 98.1, electricalData: { minInputV: 40, maxInputCurrent: 20.0, maxOutputCurrent: 22.8, outputVoltage: 220, outputFrequency: 60, weight: 9.2,  connectionType: "Monofásico" } },
  { manufacturer: "PHB Solar", model: "PHB6000D-YS",    nominalPowerW: 6000, maxInputV: 600, efficiency: 98.1, electricalData: { minInputV: 40, maxInputCurrent: 20.0, maxOutputCurrent: 27.3, outputVoltage: 220, outputFrequency: 60, weight: 9.2,  connectionType: "Monofásico" } },
  { manufacturer: "PHB Solar", model: "PHB7K5D-WS",     nominalPowerW: 7500, maxInputV: 600, efficiency: 97.8, electricalData: { minInputV: 40, maxInputCurrent: 20.0, maxOutputCurrent: 34.1, outputVoltage: 220, outputFrequency: 60, weight: 16.0, connectionType: "Monofásico" } },
  { manufacturer: "PHB Solar", model: "PHB7K5-MS",      nominalPowerW: 7500, maxInputV: 600, efficiency: 97.8, electricalData: { minInputV: 40, maxInputCurrent: 20.0, maxOutputCurrent: 34.1, outputVoltage: 220, outputFrequency: 60, weight: 16.0, connectionType: "Monofásico" } },
  { manufacturer: "PHB Solar", model: "PHB10K-MS",      nominalPowerW: 10000, maxInputV: 600, efficiency: 97.9, electricalData: { minInputV: 40, maxInputCurrent: 20.0, maxOutputCurrent: 45.5, outputVoltage: 220, outputFrequency: 60, weight: 16.0, connectionType: "Monofásico" } },
  // PHB Solar — Trifásicos 220V
  { manufacturer: "PHB Solar", model: "PHB9K-SDT",      nominalPowerW: 9000, maxInputV: 850, efficiency: 97.7, electricalData: { minInputV: 140, maxInputCurrent: 22.0, maxOutputCurrent: 22.7, outputVoltage: 220, outputFrequency: 60, weight: 16.2, connectionType: "Trifásico" } },
  { manufacturer: "PHB Solar", model: "PHB12K-SDT",     nominalPowerW: 12000, maxInputV: 850, efficiency: 98.2, electricalData: { minInputV: 140, maxInputCurrent: 32.0, maxOutputCurrent: 33.3, outputVoltage: 220, outputFrequency: 60, weight: 17.1, connectionType: "Trifásico" } },
  { manufacturer: "PHB Solar", model: "PHB17K-SDT",     nominalPowerW: 17000, maxInputV: 850, efficiency: 97.5, electricalData: { minInputV: 140, maxInputCurrent: 42.0, maxOutputCurrent: 50.0, outputVoltage: 220, outputFrequency: 60, weight: 20.5, connectionType: "Trifásico" } },
  { manufacturer: "PHB Solar", model: "PHB12KS-DT",     nominalPowerW: 12000, maxInputV: 850, efficiency: 98.3, electricalData: { minInputV: 140, maxInputCurrent: 40.0, maxOutputCurrent: 31.5, outputVoltage: 220, outputFrequency: 60, weight: 16.6, connectionType: "Trifásico" } },
  { manufacturer: "PHB Solar", model: "PHB23K-SDT",     nominalPowerW: 23000, maxInputV: 850, efficiency: 98.6, electricalData: { minInputV: 140, maxInputCurrent: 42.0, maxOutputCurrent: 60.4, outputVoltage: 220, outputFrequency: 60, weight: 28.0, connectionType: "Trifásico" } },
  { manufacturer: "PHB Solar", model: "PHB35KS-MT",     nominalPowerW: 35000, maxInputV: 800, efficiency: 98.6, electricalData: { minInputV: 200, maxInputCurrent: 30.0, maxOutputCurrent: 96.0, outputVoltage: 220, outputFrequency: 60, weight: 55.0, connectionType: "Trifásico" } },
  { manufacturer: "PHB Solar", model: "PHB50K-SMT",     nominalPowerW: 50000, maxInputV: 900, efficiency: 98.5, electricalData: { minInputV: 180, maxInputCurrent: 42.0, maxOutputCurrent: 131.2, outputVoltage: 220, outputFrequency: 60, weight: 64.0, connectionType: "Trifásico" } },
  { manufacturer: "PHB Solar", model: "PHB75K-GT",      nominalPowerW: 75000, maxInputV: 800, efficiency: 98.6, electricalData: { minInputV: 180, maxInputCurrent: 42.0, maxOutputCurrent: 196.9, outputVoltage: 220, outputFrequency: 60, weight: 88.0, connectionType: "Trifásico" } },
  // PHB Solar — Trifásicos 380V
  { manufacturer: "PHB Solar", model: "PHB15K-SDT",     nominalPowerW: 15000, maxInputV: 1100, efficiency: 98.5, electricalData: { minInputV: 140, maxInputCurrent: 22.0, maxOutputCurrent: 22.7, outputVoltage: 380, outputFrequency: 60, weight: 16.2, connectionType: "Trifásico" } },
  { manufacturer: "PHB Solar", model: "PHB20K-SDT",     nominalPowerW: 20000, maxInputV: 1100, efficiency: 98.5, electricalData: { minInputV: 140, maxInputCurrent: 32.0, maxOutputCurrent: 30.3, outputVoltage: 380, outputFrequency: 60, weight: 17.1, connectionType: "Trifásico" } },
  { manufacturer: "PHB Solar", model: "PHB30K-SDT",     nominalPowerW: 30000, maxInputV: 1100, efficiency: 98.6, electricalData: { minInputV: 140, maxInputCurrent: 42.0, maxOutputCurrent: 45.5, outputVoltage: 380, outputFrequency: 60, weight: 20.5, connectionType: "Trifásico" } },
  { manufacturer: "PHB Solar", model: "PHB20KS-DT",     nominalPowerW: 20000, maxInputV: 1100, efficiency: 98.7, electricalData: { minInputV: 140, maxInputCurrent: 40.0, maxOutputCurrent: 30.3, outputVoltage: 380, outputFrequency: 60, weight: 16.6, connectionType: "Trifásico" } },
  { manufacturer: "PHB Solar", model: "PHB37K5-SDT",    nominalPowerW: 37500, maxInputV: 1100, efficiency: 98.6, electricalData: { minInputV: 140, maxInputCurrent: 42.0, maxOutputCurrent: 56.9, outputVoltage: 380, outputFrequency: 60, weight: 28.0, connectionType: "Trifásico" } },
  { manufacturer: "PHB Solar", model: "PHB60KS-MT",     nominalPowerW: 60000, maxInputV: 1100, efficiency: 98.6, electricalData: { minInputV: 200, maxInputCurrent: 30.0, maxOutputCurrent: 96.0, outputVoltage: 380, outputFrequency: 60, weight: 55.0, connectionType: "Trifásico" } },
  { manufacturer: "PHB Solar", model: "PHB75K-SMT",     nominalPowerW: 75000, maxInputV: 1100, efficiency: 98.6, electricalData: { minInputV: 180, maxInputCurrent: 42.0, maxOutputCurrent: 114.0, outputVoltage: 380, outputFrequency: 60, weight: 64.0, connectionType: "Trifásico" } },
  { manufacturer: "PHB Solar", model: "PHB125K-GT",     nominalPowerW: 125000, maxInputV: 1100, efficiency: 98.6, electricalData: { minInputV: 180, maxInputCurrent: 42.0, maxOutputCurrent: 199.4, outputVoltage: 380, outputFrequency: 60, weight: 88.0, connectionType: "Trifásico" } },
  // Huawei — Monofásicos
  { manufacturer: "Huawei", model: "SUN2000-2KTL-L1",   nominalPowerW: 2000, maxInputV: 600, efficiency: 98.2, electricalData: { minInputV: 90, maxInputCurrent: 12.5, maxOutputCurrent: 10.0, outputVoltage: 220, outputFrequency: 60, weight: 12.0, connectionType: "Monofásico" } },
  { manufacturer: "Huawei", model: "SUN2000-3KTL-L1",   nominalPowerW: 3000, maxInputV: 600, efficiency: 98.3, electricalData: { minInputV: 90, maxInputCurrent: 12.5, maxOutputCurrent: 15.0, outputVoltage: 220, outputFrequency: 60, weight: 12.0, connectionType: "Monofásico" } },
  { manufacturer: "Huawei", model: "SUN2000-4KTL-L1",   nominalPowerW: 4000, maxInputV: 600, efficiency: 98.4, electricalData: { minInputV: 90, maxInputCurrent: 12.5, maxOutputCurrent: 20.0, outputVoltage: 220, outputFrequency: 60, weight: 12.0, connectionType: "Monofásico" } },
  { manufacturer: "Huawei", model: "SUN2000-5KTL-L1",   nominalPowerW: 5000, maxInputV: 600, efficiency: 98.4, electricalData: { minInputV: 90, maxInputCurrent: 12.5, maxOutputCurrent: 25.0, outputVoltage: 220, outputFrequency: 60, weight: 12.0, connectionType: "Monofásico" } },
  { manufacturer: "Huawei", model: "SUN2000-6KTL-L1",   nominalPowerW: 6000, maxInputV: 600, efficiency: 98.4, electricalData: { minInputV: 90, maxInputCurrent: 12.5, maxOutputCurrent: 27.3, outputVoltage: 220, outputFrequency: 60, weight: 12.0, connectionType: "Monofásico" } },
  // Huawei — Trifásico
  { manufacturer: "Huawei", model: "SUN2000-75KTL-M1",  nominalPowerW: 75000, maxInputV: 1100, efficiency: 98.6, electricalData: { minInputV: 200, maxInputCurrent: 26.0, maxOutputCurrent: 113.6, outputVoltage: 380, outputFrequency: 60, weight: 90.0, connectionType: "Trifásico" } }
];

async function main() {
  console.log('🌱 Seeding Kurupira catalog...');

  // [DESTRUTIIVO] Limpa completamente as tabelas antes de popular com os dados oficiais (CSV)
  // Isso expurgará todos os Fronius, Jinko, SMA, Longi, etc. do banco SQL garantindo alinhamento 1:1.
  console.log('🧹 Limpando dados legados do banco...');
  await prisma.$transaction([
    prisma.moduleCatalog.deleteMany({}),
    prisma.inverterCatalog.deleteMany({})
  ]);

  let mCount = 0;
  for (const m of MODULES) {
    const electricalData = { ...m.electrical, ...m.physical };
    await prisma.moduleCatalog.create({
      data: {
        manufacturer: m.manufacturer,
        model: m.model,
        powerWp: m.electrical.pmax,
        efficiency: m.electrical.efficiency,
        dimensions: `${m.physical.heightMm}x${m.physical.widthMm}x${m.physical.depthMm}mm`,
        weight: m.physical.weightKg,
        electricalData,
      }
    });
    mCount++;
  }

  let iCount = 0;
  for (const inv of INVERTERS) {
    // Topologia dinâmica baseada nas arquiteturas conhecidas pela Indústria (PHB / Huawei)
    let mpptCount = 2;
    let stringsPerMppt = 1;
    
    if (inv.nominalPowerW >= 75000) {
      mpptCount = 10;
      stringsPerMppt = 2;
    } else if (inv.nominalPowerW >= 50000) {
      mpptCount = 6;
      stringsPerMppt = 2;
    } else if (inv.nominalPowerW >= 23000) {
      mpptCount = 4;
      stringsPerMppt = 2;
    } else if (inv.nominalPowerW >= 12000) {
      mpptCount = 2;
      stringsPerMppt = 2;
    } else {
      mpptCount = 2;
      stringsPerMppt = 1;
    }

    const mppts = Array.from({ length: mpptCount }).map((_, idx) => ({
      mpptId: idx + 1,
      minMpptVoltage: inv.electricalData.minInputV || 40,
      maxMpptVoltage: inv.maxInputV || 600,
      maxInputVoltage: inv.maxInputV || 600,
      maxCurrentPerMPPT: Number((inv.electricalData.maxInputCurrent / mpptCount).toFixed(2)),
      stringsAllowed: stringsPerMppt
    }));

    const enrichedElectricalData = {
      ...inv.electricalData,
      mppts // A single source of truth é salva de volta no Json Object do DB!
    };

    await prisma.inverterCatalog.create({
      data: {
        manufacturer: inv.manufacturer,
        model: inv.model,
        nominalPowerW: inv.nominalPowerW,
        maxInputV: inv.maxInputV,
        efficiency: inv.efficiency,
        mpptCount: mpptCount,
        electricalData: enrichedElectricalData,
      }
    });
    iCount++;
  }

  console.log(`✅ ${mCount} módulos e ${iCount} inversores cadastrados do CSV oficial.`);
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());

const { PrismaClient } = require("@prisma/client");
const { parsePanOnd } = require("./panOndParser");

const prisma = new PrismaClient();

function extractModuleData(parsed, filename) {
  const comm = parsed.PVObject_Commercial || {};
  
  const manufacturer = comm.Manufacturer || "Desconhecido";
  const model = comm.Model || filename.replace('.pan', '');
  
  // Potência STC
  const powerWp = Number(parsed.Pnom) || 550;
  
  // Eficiência pode vir de diferentes campos ou pode ser calculada. Vamos salvar null se não houver
  // (O PVSyst não costuma exportar a eficiência explicitamente em %, mas Area está em m²)
  const efficiency = null; 

  const width = comm.Width || parsed.Width || 0;
  const height = comm.Height || parsed.Height || 0;
  const dimensions = (width > 0 && height > 0) ? `${width} x ${height} m` : null;
  const weight = parsed.Weight || null;

  return {
    manufacturer,
    model,
    powerWp,
    efficiency,
    dimensions,
    weight,
    datasheet: null,
    isActive: true,
    unifilarSymbolRef: "solar-panel-default",
    electricalData: parsed, // Salva tudo para futuras consultas elétricas e referências
  };
}

function extractInverterData(parsed, filename) {
  const comm = parsed.PVObject_Commercial || {};
  
  const manufacturer = comm.Manufacturer || "Desconhecido";
  const model = comm.Model || filename.replace('.ond', '');
  
  const nominalPowerW = Number(parsed.Pnom) ? Number(parsed.Pnom) * 1000 : 0; // PVSyst costuma exportar Pnom em kW para inversores
  const maxInputV = Number(parsed.Vabsmax) || null;
  
  // MPPT count (Em arquivos PVSyst, isso fica na seção de inputs ou multi-MPPT)
  let mpptCount = 1;
  if (parsed.NbInputs) {
    mpptCount = Number(parsed.NbInputs);
  }

  // Fases (Vac) -> se não tiver Phase, tenta deduzir
  let phase = "Trifásico";
  if (parsed.Vac === 220 || parsed.Vac === 127) {
    phase = "Monofásico";
  }

  return {
    manufacturer,
    model,
    nominalPowerW,
    maxInputV,
    mpptCount,
    efficiency: Number(parsed.Eff_Max) || null,
    datasheet: null,
    isActive: true,
    unifilarSymbolRef: "inverter-default",
    electricalData: {
      ...parsed,
      phase, // Injeta a fase deduzida para o frontend ler
      minInputV: Number(parsed.Vmin) || null,
    },
  };
}

async function processPanUpload(filename, content) {
  const parsed = parsePanOnd(content);
  const data = extractModuleData(parsed, filename);

  return await prisma.moduleCatalog.create({
    data: data
  });
}

async function processOndUpload(filename, content) {
  const parsed = parsePanOnd(content);
  const data = extractInverterData(parsed, filename);

  return await prisma.inverterCatalog.create({
    data: data
  });
}

module.exports = {
  processPanUpload,
  processOndUpload,
};

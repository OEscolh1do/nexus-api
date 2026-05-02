const { PrismaClient } = require("@prisma/client");
const { parsePanOnd } = require("./panOndParser");

const prisma = new PrismaClient();

function extractModuleData(parsed, filename) {
  // O PVSyst aninha tudo dentro de um PVObject_ principal. 
  // Vamos pegar o conteúdo desse objeto se ele existir, ou usar a raiz.
  const core = parsed.PVObject_ || parsed;
  const comm = core.PVObject_Commercial || core; // Tenta comercial, se não existir usa o core
  
  const manufacturer = comm.Manufacturer || "Desconhecido";
  const model = comm.Model || filename.replace('.pan', '');
  
  // Potência STC (Pnom está no core)
  const powerWp = Number(core.Pnom) || 550;
  
  // Eficiência e dimensões
  const width = Number(comm.Width || core.Width) || 0;
  const height = Number(comm.Height || core.Height) || 0;
  const dimensions = (width > 0 && height > 0) ? `${width} x ${height} m` : null;
  const weight = Number(core.Weight) || null;

  return {
    manufacturer,
    model,
    powerWp,
    efficiency: Number(core.EffMax) || null,
    dimensions,
    weight,
    datasheet: null,
    isActive: true,
    unifilarSymbolRef: "solar-panel-default",
    electricalData: core, // Salva o bloco técnico completo
    // Mapeamento direto de coeficientes para o schema (Regra 5 do validador)
    tempCoeffPmax: Number(core.TempCoeffPmax) || null,
    tempCoeffVoc: Number(core.TempCoeffVoc) || null,
  };
}

function extractInverterData(parsed, filename) {
  const core = parsed.PVObject_ || parsed;
  const comm = core.PVObject_Commercial || core;
  
  const manufacturer = comm.Manufacturer || "Desconhecido";
  const model = comm.Model || filename.replace('.ond', '');
  
  const nominalPowerW = Number(core.Pnom) ? Number(core.Pnom) * 1000 : 0; 
  const maxInputV = Number(core.Vabsmax) || null;
  
  let mpptCount = 1;
  if (core.NbInputs) mpptCount = Number(core.NbInputs);

  let phase = "Trifásico";
  if (core.Vac === 220 || core.Vac === 127) phase = "Monofásico";

  return {
    manufacturer,
    model,
    nominalPowerW,
    maxInputV,
    mpptCount,
    efficiency: Number(core.Eff_Max || core.EffMax) || null,
    datasheet: null,
    isActive: true,
    unifilarSymbolRef: "inverter-default",
    electricalData: {
      ...core,
      phase,
      minInputV: Number(core.Vmin) || null,
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

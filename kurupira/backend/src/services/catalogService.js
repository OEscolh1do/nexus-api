const prisma = require("../lib/prisma");
const { parsePanOnd } = require("./panOndParser");
const { validateModule, validateInverter } = require("./equipmentValidator");

// Extrai campos elétricos do core OND — whitelist explícita para não vazar sub-objetos PVSyst
function normalizeTechnicalKeys(core) {
  const n = (key) => { const v = Number(core[key]); return isFinite(v) && v !== 0 ? v : null; };
  return {
    vNom:     n('Vnom'),
    vMinMppt: n('Vmin'),
    vMaxMppt: n('Vmax'),
    vAbsMax:  n('Vabsmax'),
    vAc:      n('Vac'),
    pNomDc:   n('PNomDC') ?? n('Pnom'),
    pMaxDc:   n('Pmax'),
    effMax:   n('Eff_Max') ?? n('EffMax'),
    fNom:     n('FNom') ?? n('Fac'),
    nbPhases: n('NbPhases'),
    nbInputs: n('NbInputs'),
  };
}

function buildModuleElectricalData(core, parsed) {
  // Extrai apenas campos elétricos relevantes — sem vazar sub-objetos PVSyst inteiros
  const get = (key) => core[key] !== undefined ? core[key] : parsed[key];
  return {
    voc:    Number(get('Voc'))   || null,
    isc:    Number(get('Isc'))   || null,
    vmp:    Number(get('Vmp'))   || null,
    imp:    Number(get('Imp'))   || null,
    pmax:   Number(get('Pnom') || get('PNom') || get('Pmax')) || null,
    rSerie: Number(get('RSerie')) || null,
    rShunt: Number(get('RShunt')) || null,
    gamma:  Number(get('Gamma'))  || null,
    nCelS:  Number(get('NCelS'))  || null,
    nCelP:  Number(get('NCelP'))  || null,
    technol: get('Technol') || null,
    // Tensão máxima de sistema por norma — essencial para conformidade NBR 16690 / IEC 60364
    vMaxIEC: Number(get('VMaxIEC') || get('VMaxUL')) || null,
    // Fator de bifacialidade — presente em módulos bifaciais; ausente em monofaciais
    bifacialityFactor: Number(get('BifacialityFactor')) || null,
  };
}

function extractModuleData(parsed, filename) {
  const core = parsed.PVObject_ || parsed;
  const comm = core.PVObject_Commercial || core;
  
  const manufacturer = comm.Manufacturer || "Desconhecido";
  const model = comm.Model || filename.replace('.pan', '');
  
  // Busca Pnom suportando alias PNom (PVSyst v7) e fallback para Pmax
  const powerWp = Number(core.Pnom || core.PNom || parsed.Pnom || parsed.PNom || core.Pmax || parsed.Pmax || 0);
  
  const width = Number(comm.Width || core.Width || parsed.Width) || 0;
  const height = Number(comm.Height || core.Height || parsed.Height) || 0;
  const dimensions = (width > 0 && height > 0) ? `${width} x ${height} m` : null;
  const weight = Number(core.Weight || parsed.Weight) || null;

  let efficiency = Number(core.EffMax || parsed.EffMax) || null;
  if (!efficiency && powerWp && width && height) {
    efficiency = Number(((powerWp / (width * height * 1000)) * 100).toFixed(2));
  }

  const electricalBase = buildModuleElectricalData(core, parsed);

  // Coeficientes: PVSyst v6 (%/°C) e v7 (mV/°C, mA/°C, %/°C)
  let tempCoeffVoc = Number(core.TempCoeff_Voc || core.TempCoeffVoc || parsed.TempCoeff_Voc) || null;
  if (tempCoeffVoc === null && (core.muVocSpec !== undefined || parsed.muVocSpec !== undefined)) {
    const muVoc = Number(core.muVocSpec || parsed.muVocSpec);
    // Se for um valor absoluto alto (ex: -121), é mV/°C. Convertendo para %/°C:
    if (muVoc < -1 && electricalBase.voc > 0) {
      tempCoeffVoc = Number((((muVoc / 1000) / electricalBase.voc) * 100).toFixed(3));
    } else {
      tempCoeffVoc = muVoc;
    }
  }

  let tempCoeffIsc = Number(core.TempCoeff_Isc || core.TempCoeffIsc || parsed.TempCoeff_Isc) || null;
  // muISC é armazenado em CAPS no PVSyst v7; muIscSpec em versões anteriores
  const _muIscRaw = core.muISC ?? core.muIsc ?? core.muIscSpec ?? parsed.muISC ?? parsed.muIsc ?? parsed.muIscSpec;
  if (tempCoeffIsc === null && _muIscRaw !== undefined) {
    const muIsc = Number(_muIscRaw);
    // Se for um valor absoluto alto (ex: 7.7), é mA/°C. Convertendo para %/°C:
    if (muIsc > 0.5 && electricalBase.isc > 0) {
      tempCoeffIsc = Number((((muIsc / 1000) / electricalBase.isc) * 100).toFixed(3));
    } else {
      tempCoeffIsc = muIsc;
    }
  }

  const tempCoeffPmax = Number(core.muPmpReq || core.TempCoeff_Pmax || core.TempCoeffPmax || parsed.muPmpReq || parsed.TempCoeff_Pmax) || null;

  // Executa validação técnica
  const validation = validateModule({
    pnom: powerWp,
    imp: Number(core.Imp || parsed.Imp),
    vmp: Number(core.Vmp || parsed.Vmp),
    rSerie: Number(core.RSerie || parsed.RSerie),
    nCelS: Number(core.NCelS || parsed.NCelS),
    technol: core.Technol || parsed.Technol || 'mtSiMono',
    tempCoeffVoc,
    tempCoeffIsc,
    tempCoeffPmax,
    rpExp: core.Rp_Exp !== undefined ? Number(core.Rp_Exp) : (parsed.Rp_Exp !== undefined ? Number(parsed.Rp_Exp) : null),
    width,
    height
  });


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
    electricalData: {
      ...electricalBase,
      tempCoeffVoc,
      tempCoeffIsc,
      tempCoeffPmax,
      validation: validation.results,
      bankability: validation.bankability,
    },
    tempCoeffPmax: tempCoeffPmax || null,
    tempCoeffVoc: tempCoeffVoc || null,
    noct: Number(core.NOCT || parsed.NOCT || core.Tnom || parsed.Tnom || core.T_NOCT || parsed.T_NOCT) || null,

  };
}

function extractInverterData(parsed, filename) {
  const core = parsed.PVObject_ || parsed;
  const comm = core.PVObject_Commercial || core;
  
  const manufacturer = comm.Manufacturer || "Desconhecido";
  const model = comm.Model || filename.replace('.ond', '');
  
  // PVSyst v6 armazena Pnom em kW; versões mais novas podem usar W.
  // Heurística: Pnom ≥ 1000 → já está em W (nenhum inversor típico tem 1000 kW como Pnom no arquivo).
  const pnomRaw = Number(core.Pnom || parsed.Pnom) || 0;
  const nominalPowerW = pnomRaw > 0 ? (pnomRaw < 1000 ? pnomRaw * 1000 : pnomRaw) : 0;
  const maxInputV = Number(core.Vabsmax || parsed.Vabsmax) || null;
  
  let mpptCount = 1;
  if (core.NbInputs || parsed.NbInputs) mpptCount = Number(core.NbInputs || parsed.NbInputs);

  // Lógica de fase baseada no PVSyst (NbPhases) ou tensão
  let phase = "Trifásico";
  const nbPhases = Number(core.NbPhases || parsed.NbPhases);
  const vAc = Number(core.Vac || parsed.Vac);
  
  if (nbPhases === 1 || vAc < 300) phase = "Monofásico";

  const normalizedCore = normalizeTechnicalKeys(core);

  // Validação do inversor
  const validation = validateInverter({
    pAcNom: nominalPowerW,
    pAcMax: (() => { const r = Number(core.Pmax || parsed.Pmax) || 0; return r > 0 ? (r < 1000 ? r * 1000 : r) : nominalPowerW; })(),
    vMinMpp: Number(core.Vmin || parsed.Vmin) || 0,
    vMaxMpp: Number(core.Vmax || parsed.Vmax) || 0,
    vAbsMax: maxInputV || 0,
    fNom: normalizedCore.fNom || null,
  });

  return {
    manufacturer,
    model,
    nominalPowerW,
    maxInputV,
    mpptCount,
    efficiency: Number(core.Eff_Max || core.EffMax || parsed.Eff_Max || parsed.EffMax) || null,
    datasheet: null,
    isActive: true,
    unifilarSymbolRef: "inverter-default",
    electricalData: {
      ...normalizedCore,
      phase,
      minInputV: Number(core.Vmin || parsed.Vmin) || null,
      validation: validation.results,
      bankability: validation.bankability
    },
  };
}



async function processPanUpload(filename, content) {
  const parsed = parsePanOnd(content);
  const data = extractModuleData(parsed, filename);

  // Upsert por fabricante + modelo: idempotente em qualquer número de instâncias.
  // Re-upload do mesmo arquivo atualiza os parâmetros técnicos mas preserva isActive.
  const existing = await prisma.moduleCatalog.findFirst({
    where: { manufacturer: data.manufacturer, model: data.model },
  });
  if (existing) {
    return await prisma.moduleCatalog.update({
      where: { id: existing.id },
      data: { ...data, isActive: existing.isActive },
    });
  }
  return await prisma.moduleCatalog.create({ data });
}

async function processOndUpload(filename, content) {
  const parsed = parsePanOnd(content);
  const data = extractInverterData(parsed, filename);

  // Mesmo padrão upsert: re-upload atualiza parâmetros sem criar duplicata.
  const existing = await prisma.inverterCatalog.findFirst({
    where: { manufacturer: data.manufacturer, model: data.model },
  });
  if (existing) {
    return await prisma.inverterCatalog.update({
      where: { id: existing.id },
      data: { ...data, isActive: existing.isActive },
    });
  }
  return await prisma.inverterCatalog.create({ data });
}


module.exports = {
  processPanUpload,
  processOndUpload,
};

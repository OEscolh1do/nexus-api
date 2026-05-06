const prisma = require("../lib/prisma");
const { parsePanOnd } = require("./panOndParser");
const { validateModule, validateInverter } = require("./equipmentValidator");

// Extrai campos elétricos do core OND — whitelist explícita para não vazar sub-objetos PVSyst
function normalizeTechnicalKeys(core) {
  const n = (key) => { const v = Number(core[key]); return isFinite(v) && v !== 0 ? v : null; };
  return {
    vNom:     n('Vnom'),
    vMinMpp: n('Vmin') ?? n('VMppMin'),
    vMaxMpp: n('Vmax') ?? n('VMPPMax') ?? n('VMppMax'),
    vAbsMax:  n('Vabsmax') ?? n('VAbsMax'),
    vAc:      n('Vac') ?? n('VOutConv'),
    pNomDc:   n('PNomDC') ?? n('Pnom'),
    pMaxDc:   n('Pmax') ?? n('PMaxDC'),
    effMax:   n('Eff_Max') ?? n('EffMax') ?? n('EfficMax'),
    fNom:     n('FNom') ?? n('Fac'),
    nbPhases: n('NbPhases'),
    nbInputs: n('NbInputs'),
  };
}

function buildModuleElectricalData(core, parsed) {
  // Extrai apenas campos elétricos relevantes — sem vazar sub-objetos PVSyst inteiros
  const get = (key) => core[key] !== undefined ? core[key] : (parsed[key] !== undefined ? parsed[key] : null);
  
  // Extração de Pontos IAM (Perfil de Ângulo)
  const iamProfile = core.PVObject_IAM?.IAMProfile || parsed.PVObject_IAM?.IAMProfile;
  const iamPoints = extractIAMPoints(iamProfile);

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
    depth: Number(core.Depth || (core.PVObject_Commercial && core.PVObject_Commercial.Depth) || parsed.Depth) || null,
    lidLoss: Number(get('LIDLoss')) || null,
    iamPoints,
    relEffic: {
      g800: Number(get('RelEffic800')),
      g600: Number(get('RelEffic600')),
      g400: Number(get('RelEffic400')),
      g200: Number(get('RelEffic200')),
    }
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
  const weight = Number(comm.Weight || core.Weight || parsed.Weight) || null;

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
    depth: electricalBase.depth,
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

function extractEfficiencyCurve(conv) {
  // ProfilPIO=TCubicProfile contém pares Point_N=Pin,Pout (Watts)
  // NPtsEff indica quantos pontos são válidos (restantes são 0,0)
  const profile = conv.ProfilPIO;
  if (!profile || typeof profile !== 'object') return [];

  const nPtsEff = Number(profile.NPtsEff) || 0;
  const points = [];

  for (let i = 1; i <= nPtsEff; i++) {
    const raw = profile[`Point_${i}`];
    if (!raw || typeof raw !== 'string') continue;
    const [pinStr, poutStr] = raw.split(',');
    const pin  = parseFloat(pinStr);
    const pout = parseFloat(poutStr);
    if (isFinite(pin) && pin > 0 && isFinite(pout)) {
      points.push({ power: pin, efficiency: pout / pin, pOut: pout });
    }
  }

  return points;
}

function extractIAMPoints(profile) {
  if (!profile || typeof profile !== 'object') return [];
  const nPtsEff = Number(profile.NPtsEff) || 0;
  const points = [];
  for (let i = 1; i <= nPtsEff; i++) {
    const raw = profile[`Point_${i}`];
    if (!raw || typeof raw !== 'string') continue;
    const [angleStr, factorStr] = raw.split(',');
    const angle = parseFloat(angleStr);
    const factor = parseFloat(factorStr);
    if (isFinite(angle) && isFinite(factor)) {
      points.push([angle, factor]);
    }
  }
  return points;
}

function extractInverterData(parsed, filename) {
  const core = parsed.PVObject_ || parsed;
  const comm = core.PVObject_Commercial || core;

  // Arquivos .OND do PVSyst armazenam todos os parâmetros elétricos dentro de
  // um sub-objeto "Converter=TConverter". Buscamos aí primeiro, com fallback
  // no nível raiz para compatibilidade com formatos mais simples.
  const conv = core.Converter || core;

  const manufacturer = comm.Manufacturer || 'Desconhecido';
  const model        = comm.Model || filename.replace(/\.ond$/i, '');

  // Potência nominal AC — PVSyst armazena em kW (PNomConv) dentro de TConverter
  const pnomRaw = Number(conv.PNomConv ?? conv.Pnom ?? core.Pnom ?? parsed.Pnom) || 0;
  const nominalPowerW = pnomRaw > 0 ? (pnomRaw < 1000 ? pnomRaw * 1000 : pnomRaw) : 0;

  // Dimensões e Peso — extraídos do bloco Commercial ou core
  const width  = Number(comm.Width  || core.Width  || parsed.Width)  || null;
  const height = Number(comm.Height || core.Height || parsed.Height) || null;
  const depth  = Number(comm.Depth  || core.Depth  || parsed.Depth)  || null;
  const weight = Number(comm.Weight || core.Weight || parsed.Weight) || null;

  // Potência máxima de saída AC (ex: PHB6000D: PMaxOUT=6.6 kW)
  const pmaxRaw = Number(conv.PMaxOUT ?? conv.Pmax ?? core.Pmax ?? parsed.Pmax) || 0;
  const maxOutputW = pmaxRaw > 0 ? (pmaxRaw < 1000 ? pmaxRaw * 1000 : pmaxRaw) : nominalPowerW;

  // Potência nominal e máxima DC
  const pNomDCRaw = Number(conv.PNomDC ?? core.PNomDC) || 0;
  const pNomDCW   = pNomDCRaw > 0 ? (pNomDCRaw < 1000 ? pNomDCRaw * 1000 : pNomDCRaw) : null;
  const pMaxDCRaw = Number(conv.PMaxDC ?? core.PMaxDC) || 0;
  const pMaxDCW   = pMaxDCRaw > 0 ? (pMaxDCRaw < 1000 ? pMaxDCRaw * 1000 : pMaxDCRaw) : null;

  // Tensão CC máxima absoluta (limite de hardware — dano irreversível se excedido)
  const maxInputV = Number(conv.VAbsMax ?? conv.Vabsmax ?? core.VAbsMax ?? core.Vabsmax) || null;

  // Janela MPPT
  const vMinMpp = Number(conv.VMppMin ?? conv.Vmin ?? core.VMppMin ?? core.Vmin) || null;
  const vMaxMpp = Number(conv.VMPPMax ?? conv.VMppMax ?? conv.Vmax ?? core.VMPPMax ?? core.Vmax) || null;

  // Correntes
  const iMaxDC  = Number(conv.IMaxDC  ?? conv.IDCMax  ?? core.IMaxDC)  || null;
  const iNomAC  = Number(conv.INomAC  ?? core.INomAC)  || null;
  const iMaxAC  = Number(conv.IMaxAC  ?? core.IMaxAC)  || null;

  // Eficiência
  const effMax  = Number(conv.EfficMax  ?? conv.Eff_Max  ?? core.Eff_Max  ?? core.EfficMax)  || null;
  const effEuro = Number(conv.EfficEuro ?? conv.Eff_Euro ?? core.EfficEuro) || null;

  // Tensão AC de saída — determina mono/trifásico
  const vAc = Number(conv.VOutConv ?? conv.Vac ?? core.Vac) || null;

  // MPPTs — NbMPPT (nível raiz); NbInputs = entradas CC físicas
  const nbMppt   = Number(core.NbMPPT   ?? parsed.NbMPPT)  || null;
  const nbInputs = Number(core.NbInputs ?? parsed.NbInputs) || null;
  const mpptCount = nbMppt ?? nbInputs ?? 1;

  // Fase — campo MonoTri no TConverter ou inferência por tensão
  const monoTri = (conv.MonoTri ?? core.MonoTri ?? '').toString().toLowerCase();
  let phase = 'Trifásico';
  if (monoTri === 'mono' || vAc === null || vAc < 300) phase = 'Monofásico';

  // Limiar de ativação (Pthreshold)
  // PSeuil = limiar em W; PThreshEff = limiar de eficiência mínima
  const pThreshold = Number(conv.PSeuil ?? conv.PThreshEff ?? conv.PThreshold ?? core.PSeuil) || null;

  // Temperatura e derating
  const tPNom    = Number(conv.TPNom    ?? core.TPNom)    || null;
  const tPMax    = Number(conv.TPMax    ?? core.TPMax)    || null;
  const tPLim1   = Number(conv.TPLim1   ?? core.TPLim1)   || null;
  const tPLimAbs = Number(conv.TPLimAbs ?? core.TPLimAbs) || null;
  const pLim1Raw = Number(conv.PLim1    ?? core.PLim1)    || null;
  const pLimAbsRaw = Number(conv.PLimAbs ?? core.PLimAbs) || null;
  // PLim1 e PLimAbs também são em kW no arquivo PHB
  const pLim1W    = pLim1Raw   ? (pLim1Raw   < 1000 ? pLim1Raw   * 1000 : pLim1Raw)   : null;
  const pLimAbsW  = pLimAbsRaw ? (pLimAbsRaw < 1000 ? pLimAbsRaw * 1000 : pLimAbsRaw) : null;

  // Consumo noturno (W)
  const nightLoss = Number(core.Night_Loss ?? parsed.Night_Loss) || null;

  // Tipo de transformador (Transfo=Without | With | ...)
  const transfo = (core.Transfo ?? parsed.Transfo ?? null)?.toString() || null;

  // Curva de eficiência — ProfilPIO=TCubicProfile dentro de TConverter
  const efficiencyCurve = extractEfficiencyCurve(conv);

  const normalizedCore = normalizeTechnicalKeys({
    ...core,
    // Sobrescreve com valores do TConverter (mais precisos)
    Vmin:    vMinMpp,
    Vmax:    vMaxMpp,
    Vabsmax: maxInputV,
    Vac:     vAc,
    PNomDC:  pnomRaw,
    Eff_Max: effMax,
  });

  const validation = validateInverter({
    pAcNom:        nominalPowerW,
    pAcMax:        maxOutputW,
    vMinMpp:       vMinMpp || 0,
    vMaxMpp:       vMaxMpp || 0,
    vAbsMax:       maxInputV || 0,
    fNom:          normalizedCore.fNom || null,
    pThreshold,
    efficiencyCurve,
  });

  return {
    manufacturer,
    model,
    nominalPowerW,
    maxInputV,
    mpptCount,
    efficiency: effMax,
    width,
    height,
    depth,
    weight,
    datasheet: null,
    isActive: true,
    unifilarSymbolRef: 'inverter-default',
    electricalData: {
      ...normalizedCore,
      phase,
      vNomDC:        normalizedCore.vNom,
      vAcOut:        vAc,
      vMinMpp,
      vMaxMpp,
      iMaxDC,
      iNomAC,
      iMaxAC,
      effEuro,
      pNomDCW,
      pMaxDCW,
      pThreshold,
      tPNom,
      tPMax,
      tPLim1,
      tPLimAbs,
      pLim1W,
      pLimAbsW,
      nightLoss,
      transfo,
      maxOutputW,
      nbInputs,
      nbMppt,
      efficiencyCurve,
      validation:    validation.results,
      bankability:   validation.bankability,
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

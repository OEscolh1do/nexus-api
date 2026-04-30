import { InverterCatalogItem } from '@/core/schemas/inverterSchema';
import { PVSystObject } from './pvsystParser';

export class ONDValidationError extends Error {
  constructor(message: string) {
    super(`[validador-ond] ${message}`);
    this.name = 'ONDValidationError';
  }
}

/**
 * Helper case-insensitive para buscar propriedades em um objeto parseado.
 * Retorna o primeiro match válido.
 */
function getCaseInsensitiveVal(obj: PVSystObject, keys: string[]): any {
  if (!obj) return undefined;
  const lowerKeys = keys.map(k => k.toLowerCase());
  for (const k of Object.keys(obj)) {
    if (lowerKeys.includes(k.toLowerCase())) {
      return obj[k];
    }
  }
  return undefined;
}

/**
 * Mapeia um objeto parseado de um arquivo .OND (PVSyst) para o Schema de Inverter do Kurupira.
 * Executa validações físicas do componente (validador-ond skill).
 *
 * @param pvsystRoot Objeto raiz gerado pelo parsePanOnd
 * @returns InverterCatalogItem (Omitindo o id que deve ser gerado na inserção)
 */
export function mapOndToInverter(pvsystRoot: PVSystObject): Omit<InverterCatalogItem, 'id'> {
  // A raiz do arquivo OND declara o objeto PVObject_=pvInverter
  let root = pvsystRoot;
  
  // Resolve o envelopamento caso tenha vindo como chave principal
  if (pvsystRoot['PVObject_'] && typeof pvsystRoot['PVObject_'] === 'object' && !Array.isArray(pvsystRoot['PVObject_'])) {
    root = pvsystRoot['PVObject_'] as PVSystObject;
  } else {
    // Procura por chaves que pareçam ser o objeto do inversor
    const invKey = Object.keys(pvsystRoot).find(k => k.toLowerCase().includes('inverter') || k.toLowerCase().includes('pvobject'));
    if (invKey && typeof pvsystRoot[invKey] === 'object' && !Array.isArray(pvsystRoot[invKey])) {
      root = pvsystRoot[invKey] as PVSystObject;
    }
  }

  // Bloco Comercial
  const commercial = (getCaseInsensitiveVal(root, ['PVObject_Commercial']) as PVSystObject) || {};
  
  const manufacturer = String(getCaseInsensitiveVal(commercial, ['Manufacturer']) || getCaseInsensitiveVal(root, ['Manufacturer']) || 'Unknown Manufacturer');
  const model = String(getCaseInsensitiveVal(commercial, ['Model']) || getCaseInsensitiveVal(root, ['Model']) || 'Unknown Model');

  // Parâmetros de Potência CA (PVSyst geralmente exporta inversores em kW)
  const pnomKW = Number(getCaseInsensitiveVal(root, ['Pnom', 'PnomAC', 'PNom', 'PNomAC', 'Pnom_AC', 'PNom_AC']) || 0); 
  const pnomW = pnomKW * 1000;
  
  const pmaxKW = Number(getCaseInsensitiveVal(root, ['Pmax', 'PMax', 'PmaxAC', 'PMaxAC', 'Pmax_AC', 'PMax_AC']) || pnomKW || 0);
  const pmaxW = pmaxKW * 1000;

  // Parâmetros de Tensão (MPPT e Absoluto)
  const vMinMpp = Number(getCaseInsensitiveVal(root, ['Vmin', 'VMin', 'Vmin_MPP', 'VminMPP']) || 0);
  const vMaxMpp = Number(getCaseInsensitiveVal(root, ['Vmax', 'VMax', 'Vmax_MPP', 'VmaxMPP']) || 0);
  const vAbsMax = Number(getCaseInsensitiveVal(root, ['Vabsmax', 'VAbsMax', 'Vabs_max', 'VmaxAbs']) || 0);

  // -- Skill: validador-ond (Regras Físicas) --
  if (vMinMpp > 0 && vMaxMpp > 0 && vAbsMax > 0) {
    if (vMinMpp >= vMaxMpp || vMaxMpp > vAbsMax) {
      console.warn(`[validador-ond] Inconsistência de Tensão no Inversor ${model}: Vmin (${vMinMpp}) < Vmax (${vMaxMpp}) <= Vabsmax (${vAbsMax}) violado.`);
      // Opt-out de throw rigoroso para não travar upload de arquivos legado, mas emitimos warning de terminal
    }
  }

  if (pmaxW > 0 && pnomW > 0 && pmaxW < pnomW) {
    console.warn(`[validador-ond] Inconsistência de Potência no Inversor ${model}: Pmax (${pmaxW}W) não pode ser menor que Pnom (${pnomW}W).`);
  }
  // -------------------------------------------

  // MPPTs e Correntes
  const nbMPPT = Number(getCaseInsensitiveVal(root, ['NbMPPT', 'NbInputs', 'Nb_MPPT']) || 1);
  const mpptMaxCurrent = Number(getCaseInsensitiveVal(root, ['IMax', 'Imax', 'ImaxDC', 'IMax_DC']) || 15);
  
  // Rendimento
  const effMax = Number(getCaseInsensitiveVal(root, ['Eff_Max', 'EffMax', 'MaxEff', 'Eff_max']) || 98.0);
  const effEuro = Number(getCaseInsensitiveVal(root, ['Eff_Euro', 'EffEuro', 'EuroEff', 'Eff_euro']) || effMax - 0.5);

  // Parâmetros de Saída
  const pacOutputVolt = Number(getCaseInsensitiveVal(root, ['Vac', 'VOut', 'V_AC', 'VAC']) || 220);
  const freq = 60; // Padrão BR
  
  // Replicação Global de MPPTs
  // O PVSyst geralmente define limites globais. O Kurupira precisa do array MPPTSpecSchema.
  const mppts = [];
  for (let i = 1; i <= nbMPPT; i++) {
    mppts.push({
      mpptId: i,
      maxInputVoltage: vAbsMax,
      minMpptVoltage: vMinMpp,
      maxMpptVoltage: vMaxMpp,
      maxCurrentPerMPPT: mpptMaxCurrent,
      stringsAllowed: 2, // Fixo seguro para default se não vier
    });
  }

  // Tensão de saída inferida e tipo de conexão
  const connectionType = pacOutputVolt >= 380 ? 'Trifásico' : 'Monofásico';
  const weight = Number(getCaseInsensitiveVal(root, ['Weight', 'Poids', 'Peso']) || 0); // Poids é comum no PVSyst (francês base)

  return {
    manufacturer,
    model,
    nominalPowerW: pnomW,
    maxDCPowerW: pmaxW,
    mppts,
    efficiency: {
      euro: effEuro,
      cec: effMax, // Fallback aproximação
    },
    maxInputVoltage: vAbsMax,
    connectionType,
    outputVoltage: pacOutputVolt,
    outputFrequency: freq,
    maxOutputCurrent: pnomW / pacOutputVolt,
    weight: weight > 0 ? weight : undefined,
    Voc_max_hardware: vAbsMax,
    Isc_max_hardware: mpptMaxCurrent * nbMPPT,
    coolingType: 'passive',
    afci: true, // Defaults mercadológicos atuais
    rsd: false,
    portaria515Compliant: false,
    isActive: true,
  };
}

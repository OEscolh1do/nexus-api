import { type ModuleCatalogItem } from '@/core/schemas/moduleSchema';
import { type PVSystObject } from './pvsystParser';

/**
 * Converte o objeto genérico do PVSyst (.PAN) para o domínio estrito do Kurupira
 * 
 * @param parsed O objeto hierárquico gerado pelo `parsePanOnd`
 * @param originalFilename O nome original do arquivo para uso como fallback do modelo
 */
export function mapPanToModule(parsed: PVSystObject, originalFilename: string): ModuleCatalogItem {
  // O arquivo PVSyst inicia com PVObject_=pvModule. Então os dados reais estão dentro de parsed.PVObject_
  const pvModule = (parsed.PVObject_ as PVSystObject) || parsed;

  // Extração dos blocos comerciais
  const pvCommercial = (pvModule.PVObject_Commercial as PVSystObject) || {};
  
  // Função utilitária para converter qualquer valor PVSyst em número de forma segura
  const parseNum = (val: any, fallback: number): number => {
    if (typeof val === 'number' && !isNaN(val)) return val;
    if (typeof val === 'string') {
      const clean = val.replace(',', '.').replace(/[^\d.-]/g, '');
      const parsedFloat = parseFloat(clean);
      if (!isNaN(parsedFloat)) return parsedFloat;
    }
    return fallback;
  };

  // Fabricante e Modelo
  const manufacturer = (pvCommercial.Manufacturer as string) || "Desconhecido";
  const model = (pvCommercial.Model as string) || originalFilename.replace(/\.pan$/i, '') || "Custom_Module";
  
  // Parâmetros Elétricos Principais (Tolerância a PVSyst v6 e v7)
  const pmax = parseNum(pvModule.PNom ?? pvModule.Pnom, 1);
  const voc = parseNum(pvModule.Voc, 0);
  const vmp = parseNum(pvModule.Vmp, 0);
  const isc = parseNum(pvModule.Isc, 0);
  const imp = parseNum(pvModule.Imp, 0);
  
  // Coeficientes de Temperatura (PVSyst v7 usa muVocSpec/muPmpReq, PVSyst v6 usa TempCoeff_*)
  const tempCoeffVoc = parseNum(pvModule.muVocSpec ?? pvModule.TempCoeff_Voc, -0.30);
  const tempCoeffPmax = parseNum(pvModule.muPmpReq ?? pvModule.TempCoeff_Pmax, -0.40);

  // Parâmetros Físicos e Dimensões
  // .PAN armazena dimensões em Metros. O Kurupira exige Milímetros.
  const widthMm = parseNum(pvCommercial.Width, 1) * 1000;
  const heightMm = parseNum(pvCommercial.Height, 2) * 1000;
  const weightKg = parseNum(pvCommercial.Weight, 25);
  
  // Quantidade de Células (Série x Paralelo)
  const nCelS = parseNum(pvModule.NCelS, 72);
  const nCelP = parseNum(pvModule.NCelP, 2);
  const cells = nCelS * nCelP;

  // Inferência de Eficiência Global (STC)
  // Como .PAN não traz 'Efficiency' diretamente, calculamos por Pmax / Área.
  const areaM2 = (widthMm / 1000) * (heightMm / 1000);
  let efficiency = 0.20; // Fallback 20%
  if (areaM2 > 0 && pmax > 0) {
    efficiency = (pmax / areaM2) / 1000; 
  }

  return {
    id: `PAN_${Math.random().toString(36).substring(2, 9)}`,
    manufacturer,
    model,
    imageUrl: '', // Módulos customizados não possuem foto por padrão
    electrical: {
      pmax,
      voc,
      vmp,
      isc,
      imp,
      tempCoeffVoc,
      tempCoeffPmax,
      efficiency,
      degradacaoAnual: 0.005, // Fallback conservador padrão
      bifacial: Boolean(
        pvModule.BifacialityFactor || 
        (pvModule.Bifacial && (pvModule.Bifacial === 1 || String(pvModule.Bifacial).toLowerCase() === 'true' || String(pvModule.Bifacial).toLowerCase() === 'yes'))
      ),
    },
    physical: {
      widthMm,
      heightMm,
      depthMm: 35, // Espessura de frame padrão comercial
      weightKg,
      cells,
    }
  };
}

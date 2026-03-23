import { ModuleCatalogItem } from "@/core/schemas/moduleSchema";
import { ModuleSpecs } from "@/core/schemas/equipment.schemas";

/**
 * P4-6: Mapeia um item do catálogo (aninhado, sem quantidade) 
 * para um item do inventário do projeto (achatado, transacional).
 */
export const mapCatalogToSpecs = (catalogItem: ModuleCatalogItem): ModuleSpecs => {
  // Compute flat properties
  const areaM2 = (catalogItem.physical.widthMm * catalogItem.physical.heightMm) / 1_000_000;
  
  // Extract type from model name (naive heuristic, since catalog doesn't store type)
  const modelLower = catalogItem.model.toLowerCase();
  const type = (modelLower.includes('mono') || modelLower.includes('m10')) ? 'MONO' : 'POLY';

  return {
    id: catalogItem.id,
    quantity: 1, // Default initial quantity
    supplier: (catalogItem as any).supplier || "Desconhecido",
    manufacturer: catalogItem.manufacturer,
    model: catalogItem.model,
    type: type,
    power: catalogItem.electrical.pmax,
    efficiency: catalogItem.electrical.efficiency ? (catalogItem.electrical.efficiency * 100) : 0,
    cells: catalogItem.physical.cells || 144,
    imp: catalogItem.electrical.imp,
    vmp: catalogItem.electrical.vmp,
    isc: catalogItem.electrical.isc,
    voc: catalogItem.electrical.voc,
    weight: catalogItem.physical.weightKg,
    area: Number(areaM2.toFixed(3)),
    dimensions: `${catalogItem.physical.heightMm}x${catalogItem.physical.widthMm}x${catalogItem.physical.depthMm}mm`,
    inmetroId: (catalogItem as any).inmetroRegistration || "N/A",
    maxFuseRating: catalogItem.electrical.maxFuseRating || 20,
    tempCoeff: catalogItem.electrical.tempCoeffPmax || -0.35,
    annualDepreciation: 0.005, // 0.5% a.a default
  };
};

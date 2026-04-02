/**
 * P4-2: InMemoryEquipmentRepo — Adaptador de Equipamentos
 *
 * Estratégia: API-first com fallback para dados locais.
 * - Tenta buscar do backend (GET /api/v1/catalog/modules e /inverters)
 * - Em caso de erro (rede, 401, backend desligado), usa os arrays locais.
 *
 * P7: Fonte única — INVERTER_CATALOG substitui INVERTER_DB.
 * Derivamos InverterSpecs a partir do catálogo unificado.
 */

import { IEquipmentRepository } from "../../core/ports/IEquipmentRepository";
import { ModuleCatalogItem } from "../../core/schemas/moduleSchema";
import { InverterSpecs } from "../../core/schemas/equipment.schemas";
import { KurupiraClient } from "../NexusClient";

function mapApiModuleToItem(apiModule: any): ModuleCatalogItem | null {
  const ed = apiModule.electricalData;
  if (!ed || ed.vmp == null || ed.voc == null) return null;

  return {
    id: apiModule.id,
    manufacturer: apiModule.manufacturer,
    model: apiModule.model,
    imageUrl: apiModule.imageUrl,
    unifilarSymbolRef: apiModule.unifilarSymbolRef,
    electrical: {
      pmax: apiModule.powerWp,
      vmp: ed.vmp,
      imp: ed.imp,
      voc: ed.voc,
      isc: ed.isc,
      efficiency: ed.efficiency ?? apiModule.efficiency ?? 0,
      tempCoeffVoc: ed.tempCoeffVoc,
    },
    physical: {
      widthMm: ed.widthMm,
      heightMm: ed.heightMm,
      depthMm: ed.depthMm,
      weightKg: ed.weightKg ?? apiModule.weight ?? 0,
      cells: ed.cells,
    },
  };
}

function mapApiInverterToSpec(apiInv: any): InverterSpecs | null {
  const ed = apiInv.electricalData;
  if (!ed) return null;

  return {
    id: apiInv.id,
    quantity: 0, // Assigned by inventory config
    manufacturer: apiInv.manufacturer,
    model: apiInv.model,
    imageUrl: apiInv.imageUrl,
    unifilarSymbolRef: apiInv.unifilarSymbolRef,
    maxInputVoltage: apiInv.maxInputV ?? 0,
    minInputVoltage: ed.minInputV ?? 0,
    maxInputCurrent: ed.maxInputCurrent ?? 0,
    outputVoltage: ed.outputVoltage ?? 0,
    outputFrequency: ed.outputFrequency ?? 60,
    maxOutputCurrent: ed.maxOutputCurrent ?? 0,
    nominalPower: apiInv.nominalPowerW,
    maxEfficiency: apiInv.efficiency ?? 0,
    weight: ed.weight ?? 0,
    connectionType: ed.connectionType ?? '',
  };
}

export class InMemoryEquipmentRepo implements IEquipmentRepository {
  async getModules(): Promise<ModuleCatalogItem[]> {
    const apiData = await KurupiraClient.catalog.modules();
    const mapped = apiData.map(mapApiModuleToItem).filter(Boolean) as ModuleCatalogItem[];
    if (mapped.length === 0) throw new Error("Equipment Repository: fetched modules catalog is empty.");
    return mapped;
  }

  async getInverters(): Promise<InverterSpecs[]> {
    const apiData = await KurupiraClient.catalog.inverters();
    const mapped = apiData.map(mapApiInverterToSpec).filter(Boolean) as InverterSpecs[];
    if (mapped.length === 0) throw new Error("Equipment Repository: fetched inverters catalog is empty.");
    return mapped;
  }
}

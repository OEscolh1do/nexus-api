/**
 * P4-2: InMemoryEquipmentRepo — Adaptador de Equipamentos
 * 
 * Módulos: MODULE_DB já é parseado por `moduleDatabaseSchema` (Zod),
 * retornando `ModuleCatalogItem[]` diretamente. Nenhum mapeamento necessário.
 * 
 * Inversores: INVERTER_DB ainda usa formato legado com chaves em português.
 * O mapeamento via `mapInverterToSpec` é mantido até a migração do DB.
 */

import { IEquipmentRepository } from "../../core/ports/IEquipmentRepository";
import { ModuleCatalogItem } from "../../core/schemas/moduleSchema";
import { InverterSpecs } from "../../core/schemas/equipment.schemas";
import { MODULE_DB } from "../../data/equipment/modules";
import { INVERTER_DB } from "../../data/equipment/inverters";

function mapInverterToSpec(data: any): InverterSpecs {
  return {
    id: data["Modelo"].replace(/\s+/g, '-').toLowerCase(),
    quantity: 0,
    manufacturer: data["Fabricante"],
    model: data["Modelo"],
    maxInputVoltage: Number(data["Tensão máxima de entrada"]),
    minInputVoltage: Number(data["Tensão mínima de entrada"]),
    maxInputCurrent: Number(data["Corrente Máxima de entrada"]),
    outputVoltage: Number(data["Tensão de saída"]),
    outputFrequency: Number(data["Frequência de saída"]),
    maxOutputCurrent: Number(data["Corrente Máxima de Saída"]),
    nominalPower: Number(data["Potência Nominal"]),
    maxEfficiency: Number(data["Eficiência Máxima"]),
    weight: Number(data["Peso"]),
    connectionType: data["Ligação"]
  };
}

export class InMemoryEquipmentRepo implements IEquipmentRepository {
  async getModules(): Promise<ModuleCatalogItem[]> {
    // MODULE_DB já é ModuleCatalogItem[] validado pelo Zod (moduleDatabaseSchema.parse)
    return MODULE_DB;
  }

  async getInverters(): Promise<InverterSpecs[]> {
    return INVERTER_DB.map(mapInverterToSpec);
  }
}

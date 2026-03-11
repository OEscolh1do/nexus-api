import { IEquipmentRepository } from "../../core/ports/IEquipmentRepository";
import { ModuleSpecs, InverterSpecs } from "../../core/schemas/equipment.schemas"; // Use schemas for types? Or types? Using types from schemas.
import { MODULE_DB } from "../../data/equipment/modules";
import { INVERTER_DB } from "../../data/equipment/inverters";

function mapModuleToSpec(data: any): ModuleSpecs {
  return {
    id: data["Modelo"].replace(/\s+/g, '-').toLowerCase(),
    quantity: 0, // Default for catalog
    supplier: data["Fornecedor"],
    manufacturer: data["Fabricante"],
    model: data["Modelo"],
    type: data["Tipo"],
    power: Number(data["Potência"]),
    efficiency: Number(data["ƞ Módulo"]) * 100, // fractional to percentage if needed, checking schema. Schema max(30). Data .17. So *100 = 17.
    cells: Number(data["Número de células"]),
    imp: Number(data["Imáx"]),
    vmp: Number(data["Vmáx"]),
    isc: Number(data["Isc/Icc"]),
    voc: Number(data["Voc/Vca"]),
    weight: Number(data["Peso"]),
    area: Number(data["Área (m²)"]),
    dimensions: data["Dimensões (mm)"],
    inmetroId: data["Inmetro"],
    maxFuseRating: Number(data["Máx. Corr. Fusível (série)"]),
    tempCoeff: Number(data["Coef. Temperatura/°C"]),
    annualDepreciation: Number(data["Depreciação a.a."])
  };
}

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
  async getModules(): Promise<ModuleSpecs[]> {
    // Return all modules mapped
    return MODULE_DB.map(mapModuleToSpec);
  }

  async getInverters(): Promise<InverterSpecs[]> {
    return INVERTER_DB.map(mapInverterToSpec);
  }
}

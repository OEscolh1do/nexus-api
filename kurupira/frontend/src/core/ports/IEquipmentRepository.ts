import { ModuleSpecs, InverterSpecs } from "../schemas/equipment.schemas";

export interface IEquipmentRepository {
  getModules(): Promise<ModuleSpecs[]>;
  getInverters(): Promise<InverterSpecs[]>;
}

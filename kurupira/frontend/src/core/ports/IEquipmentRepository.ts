import { ModuleCatalogItem } from "../schemas/moduleSchema";
import { InverterSpecs } from "../schemas/equipment.schemas";

export interface IEquipmentRepository {
  getModules(): Promise<ModuleCatalogItem[]>;
  getInverters(): Promise<InverterSpecs[]>;
}

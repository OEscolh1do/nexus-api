export interface IrradiationData {
  monthly: number[];
  source: string;
}

export interface IIrradiationProvider {
  getByCity(city: string, state: string): Promise<IrradiationData>;
}

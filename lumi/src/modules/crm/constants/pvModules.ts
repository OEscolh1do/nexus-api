export interface PVModuleDimensions {
  length: number; // mm
  width: number; // mm
  thickness: number; // mm
}

export interface PVModuleElectrical {
  pmax: number; // W
  efficiency: number; // %
  imp: number; // A
  vmp: number; // V
  isc: number; // A
  voc: number; // V
  maxFuse: number; // A
}

export interface PVModuleTemperature {
  coeffPmax: number; // %/°C
}

export interface PVModuleWarranty {
    annualDegradation: number; // %
}

export interface PVModule {
  id: string;
  manufacturer: string;
  model: string;
  supplier?: string;
  type: string;
  
  dimensions: PVModuleDimensions;
  
  // Properties for mechanical calculations
  weight: number; // kg
  area: number; // m²
  cells: number;

  electrical: PVModuleElectrical;
  temperature: PVModuleTemperature;
  warranty?: PVModuleWarranty;
  inmetroId?: string;
}

export const AVAILABLE_MODULES: PVModule[] = [
  {
    id: 'dmegc-620-bifacial',
    manufacturer: 'DMEGC',
    supplier: 'PHB',
    model: 'DM620G12RT-B66HSW',
    type: 'Monocristalino-Bifacial',
    
    dimensions: {
      length: 2382,
      width: 1134,
      thickness: 30
    },
    
    weight: 32.3,
    area: 2.70,
    cells: 132,
    
    electrical: {
      pmax: 620,
      efficiency: 23.00,
      imp: 15.2,
      vmp: 40.85,
      isc: 16.11,
      voc: 49.09,
      maxFuse: 30
    },
    
    temperature: {
      coeffPmax: -0.29
    },
    
    warranty: {
        annualDegradation: 0.85
    }
  }
];

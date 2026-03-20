export interface Inverter {
  id: string;
  manufacturer: string;
  model: string;
  powerAc: number; // Watts
  efficiency: number; // Percentage (e.g. 98.0)
  type: 'string' | 'micro';
  phases: 'single' | 'three';
  
  // MPPT Specs
  mppts: number;
  maxInputVoltage: number; // V
  startVoltage: number; // V
  minMpptVoltage: number; // V
  maxMpptVoltage: number; // V
  maxIscPerMppt: number; // A (Short Circuit Current)
  maxInputCurrent: number; // A (Operating Current)
  
  // Physical
  weight: number; // kg
  dimensions: { width: number; height: number; depth: number }; // mm
  price: number; // BRL
}

export const INVERTER_CATALOG: Inverter[] = [
  {
    id: 'inv-growatt-75k',
    manufacturer: 'Growatt',
    model: 'MAX 75KTL3 LV',
    powerAc: 75000,
    efficiency: 98.5,
    type: 'string',
    phases: 'three',
    mppts: 6, // 6 MPPTs, 2 strings per MPPT usually
    maxInputVoltage: 1100,
    startVoltage: 250,
    minMpptVoltage: 200,
    maxMpptVoltage: 1000,
    maxIscPerMppt: 40,
    maxInputCurrent: 32,
    weight: 64,
    dimensions: { width: 860, height: 600, depth: 300 },
    price: 35000
  },
  {
    id: 'inv-deye-50k',
    manufacturer: 'Deye',
    model: 'SUN-50K-G03',
    powerAc: 50000,
    efficiency: 98.7,
    type: 'string',
    phases: 'three',
    mppts: 4,
    maxInputVoltage: 1000,
    startVoltage: 250,
    minMpptVoltage: 200,
    maxMpptVoltage: 850,
    maxIscPerMppt: 55, // High current support
    maxInputCurrent: 40,
    weight: 48,
    dimensions: { width: 550, height: 800, depth: 300 },
    price: 28000
  },
  {
    id: 'inv-fronius-tauro-50',
    manufacturer: 'Fronius',
    model: 'Tauro Eco 50-3-D',
    powerAc: 50000,
    efficiency: 98.5,
    type: 'string',
    phases: 'three',
    mppts: 1, // Single large MPPT design (example)
    maxInputVoltage: 1000,
    startVoltage: 650,
    minMpptVoltage: 580,
    maxMpptVoltage: 930,
    maxIscPerMppt: 100,
    maxInputCurrent: 87.5,
    weight: 74,
    dimensions: { width: 1109, height: 755, depth: 346 },
    price: 42000
  },
  {
    id: 'inv-sungrow-125k',
    manufacturer: 'Sungrow',
    model: 'SG125CX',
    powerAc: 125000,
    efficiency: 99.0,
    type: 'string',
    phases: 'three',
    mppts: 12,
    maxInputVoltage: 1100,
    startVoltage: 250,
    minMpptVoltage: 180,
    maxMpptVoltage: 1000,
    maxIscPerMppt: 35,
    maxInputCurrent: 26,
    weight: 89,
    dimensions: { width: 1050, height: 655, depth: 325 },
    price: 65000
  },
  {
    id: 'inv-micro-aps-ds3',
    manufacturer: 'APSystems',
    model: 'DS3-LV',
    powerAc: 880,
    efficiency: 97.0,
    type: 'micro',
    phases: 'single',
    mppts: 2,
    maxInputVoltage: 60,
    startVoltage: 20,
    minMpptVoltage: 28,
    maxMpptVoltage: 45,
    maxIscPerMppt: 25,
    maxInputCurrent: 20,
    weight: 3.5,
    dimensions: { width: 260, height: 240, depth: 40 },
    price: 1800
  }
];

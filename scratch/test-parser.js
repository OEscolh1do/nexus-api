const { parsePanOnd } = require('../kurupira/backend/src/services/panOndParser');

// Simulação de um arquivo .PAN real do PVSyst
const samplePan = `
PVObject_=pvModule
  PVObject_Commercial=pvCommercial
    Manufacturer=Dah Solar
    Model=DM620G12RT-B66HSW
  Pnom=550.0
  Isc=18.52
  Voc=38.45
  Imp=17.41
  Vmp=31.59
  NCelS=132
  TempCoeffPmax=-0.35
  TempCoeffVoc=-0.28
End of PVObject pvModule
`;

console.log('--- Testando Parser PVSyst ---');
const result = parsePanOnd(samplePan);

const core = result.PVObject_ || result;
const comm = core.PVObject_Commercial || core;

console.log('\n--- Extração de Dados (Nova Lógica) ---');
console.log('Fabricante:', comm.Manufacturer || "Desconhecido");
console.log('Modelo:', comm.Model || "N/A");
console.log('Pnom:', core.Pnom || "N/A");
console.log('Voc:', core.Voc || "N/A");
console.log('TempCoeffPmax:', core.TempCoeffPmax || "N/A");

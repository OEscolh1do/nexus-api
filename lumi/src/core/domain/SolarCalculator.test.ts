import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SolarCalculator } from './SolarCalculator';
import { IIrradiationProvider } from '@/core/ports/IIrradiationProvider';
import { IEquipmentRepository } from '@/core/ports/IEquipmentRepository';
import { InputData, EngineeringSettings } from '@/core/types';

describe('SolarCalculator', () => {
  let calculator: SolarCalculator;
  let mockIrradiationProvider: IIrradiationProvider;
  let mockEquipmentRepository: IEquipmentRepository;

  const mockSettings: EngineeringSettings = {
    performanceRatio: 0.75,
    referenceKitPricePerKwp: 3000,
    orientationFactors: { norte: 1, sul: 0.85, leste: 0.9, oeste: 0.9 },
    monthlyInterestRate: 0.01,
    marginPercentage: 0.2,
    commissionPercentage: 0.05,
    taxPercentage: 0.1,
    co2Factor: 0.1,
    serviceUnitModule: 50,
    serviceUnitStructure: 20,
    serviceUnitInverter: 100,
    serviceProjectBase: 500,
    serviceProjectPercent: 0.02,
    serviceAdminBase: 200,
    serviceAdminPercent: 0.03,
    serviceMaterialsPercent: 0.05,
    energyInflationRate: 0.05,
    minHistoricalTemp: 0,
    vocTempCoefficient: -0.3,
    soilingLoss: 0.02,
    mismatchLoss: 0.02,
    inverterEfficiency: 0.98,
    orientationLoss: 0.03,
    inclinationLoss: 0.03,
    shadingLoss: 0.03,
    horizonLoss: 0.02,
    cableDCLoss: 0.005,
    cableACLoss: 0.01,
    thermalLoss: 0.044,
    targetOversizing: 1.2,
    minPerformanceRatio: 0.75,
    cableLoss: 0.01,
    structureType: 'Telhado',
    engineerName: 'Eng. Teste',
    creaNumber: '123456',
    companyCnpj: '00000000000000'
  } as unknown as EngineeringSettings;

  const mockInput: InputData = {
    city: 'Test City',
    state: 'TS',
    tariffRate: 1.0,
    invoices: [{
      id: 'inv001',
      name: 'Test Invoice',
      installationNumber: '123456789',
      concessionaire: 'CEMIG',
      rateGroup: 'B1',
      voltage: '127/220',
      breakerCurrent: 40,
      monthlyHistory: Array(12).fill(300), // Avg 300 kWh
      connectionType: 'monofasico'
    }],
    clientName: 'Test Client',
    street: 'Test St',
    neighborhood: 'Test',
    number: '123',
    complement: '',
    zipCode: '00000-000',
    availableArea: 50,
    orientation: 'Norte'
  };

  beforeEach(() => {
    mockIrradiationProvider = {
      getByCity: vi.fn().mockResolvedValue({
        city: 'Test City',
        state: 'TS',
        monthly: Array(12).fill(5.0), // 5 HSP constant
        annual: 60
      }),
      getByCoordinates: vi.fn()
    } as any;

    mockEquipmentRepository = {
      getModules: vi.fn().mockResolvedValue([
        {
          id: 'mod1',
          model: 'TestMod',
          manufacturer: 'TestManu',
          power: 500,
          price: 500,
          area: 2,
          efficiency: 0.2,
          voc: 50,
          isc: 10,
          vmp: 40,
          imp: 9,
          tempCoeffPmax: -0.35,
          tempCoeffVoc: -0.28
        }
      ]),
      getInverters: vi.fn().mockResolvedValue([
        {
          id: 'inv1',
          model: 'TestInv',
          manufacturer: 'TestManu',
          nominalPower: 3000,
          price: 2000,
          maxInputVoltage: 600,
          mpptCount: 1,
          maxInputCurrent: 15,
          startVoltage: 100,
          efficiency: 0.98,
          phases: 1,
          type: 'string',
          wifi: true,
          warrantyYears: 5
        }
      ]),
      getBOSItems: vi.fn()
    } as any;

    calculator = new SolarCalculator(mockIrradiationProvider, mockEquipmentRepository);
  });

  it('should calculate system size correctly', async () => {
    const result = await calculator.calculate(mockInput, mockSettings);

    // Target: 300 kWh/mo
    // HSP: 5
    // PR: 0.75
    // Formula: Size = 300 / (5 * 30.4 * 0.75) = 300 / 114 = ~2.63 kWp

    // With 500W modules: ceil(2.63 / 0.5) = ceil(5.26) = 6 modules
    // Actual Size: 6 * 500 = 3.0 kWp

    expect(result.moduleCount).toBe(6);
    expect(result.systemSizeKwp).toBe(3.0);
  });

  it('should calculate financial metrics', async () => {
    const result = await calculator.calculate(mockInput, mockSettings);

    expect(result.totalInvestment).toBeGreaterThan(0);
    expect(result.monthlySavings).toBeGreaterThan(0);
    expect(result.paybackYears).toBeLessThan(30);
  });

  it('should throw error if no equipment available', async () => {
    mockEquipmentRepository.getModules = vi.fn().mockResolvedValue([]);

    await expect(calculator.calculate(mockInput, mockSettings))
      .rejects.toThrow("No equipment available");
  });
});

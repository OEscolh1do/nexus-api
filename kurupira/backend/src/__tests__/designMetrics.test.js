const { extractDesignMetrics } = require('../utils/designMetrics');

const BASE_DESIGN = {
  solar: {
    clientData: {
      averageConsumption: 600,
      lat: -15.8,
      lng: -47.9,
      clientName: 'Teste Solar',
      city: 'Brasília',
      state: 'DF',
      voltage: '220V',
    },
  },
};

describe('extractDesignMetrics', () => {
  test('retorna zeros quando designData é nulo', () => {
    const result = extractDesignMetrics(null);
    expect(result.targetPowerKwp).toBe(0);
    expect(result.averageConsumptionKwh).toBe(0);
    expect(result.moduleCount).toBe(0);
  });

  test('retorna zeros quando não há campo solar', () => {
    const result = extractDesignMetrics({ tech: {} });
    expect(result.targetPowerKwp).toBe(0);
  });

  test('calcula kWp alvo a partir de consumo e HSP', () => {
    const result = extractDesignMetrics(BASE_DESIGN);
    // HSP de Brasília = 5.4, PR default = 0.75
    // kWp = (600 * 12) / (5.4 * 365 * 0.75) ≈ 4.87
    expect(result.targetPowerKwp).toBeGreaterThan(4);
    expect(result.targetPowerKwp).toBeLessThan(6);
    expect(result.averageConsumptionKwh).toBe(600);
  });

  test('usa performanceRatio customizado do projeto', () => {
    const design = {
      ...BASE_DESIGN,
      tech: { performanceRatio: 0.85 },
    };
    const resultPR085 = extractDesignMetrics(design);
    const resultDefault = extractDesignMetrics(BASE_DESIGN);
    // PR maior → menos kWp necessário
    expect(resultPR085.targetPowerKwp).toBeLessThan(resultDefault.targetPowerKwp);
  });

  test('usa kWpAlvo explícito quando fornecido', () => {
    const design = {
      solar: { clientData: { averageConsumption: 600 } },
      tech: { kWpAlvo: 7.5 },
    };
    const result = extractDesignMetrics(design);
    expect(result.targetPowerKwp).toBe(7.5);
  });

  test('calcula moduleCount a partir do kWp e potência padrão (550W)', () => {
    const design = {
      solar: { clientData: { averageConsumption: 0 } },
      tech: { kWpAlvo: 5.5 },
    };
    const result = extractDesignMetrics(design);
    // 5500W / 550W = 10 módulos
    expect(result.moduleCount).toBe(10);
  });

  test('extrai clientName, city, state e voltage corretamente', () => {
    const result = extractDesignMetrics(BASE_DESIGN);
    expect(result.clientName).toBe('Teste Solar');
    expect(result.city).toBe('Brasília');
    expect(result.state).toBe('DF');
    expect(result.voltage).toBe('220V');
  });

  test('aceita designData como string JSON', () => {
    const result = extractDesignMetrics(JSON.stringify(BASE_DESIGN));
    expect(result.averageConsumptionKwh).toBe(600);
  });

  test('retorna zeros se JSON string for inválido', () => {
    const result = extractDesignMetrics('{invalid json');
    expect(result.targetPowerKwp).toBe(0);
  });

  test('lat/lng zero são normalizados para null', () => {
    const design = {
      solar: { clientData: { averageConsumption: 100, lat: 0, lng: 0 } },
    };
    const result = extractDesignMetrics(design);
    expect(result.lat).toBeNull();
    expect(result.lng).toBeNull();
  });
});

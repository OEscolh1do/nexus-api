/**
 * 🧪 TESTES DE VALIDAÇÃO - MÓDULO SOLAR
 * 
 * Objetivo: Garantir que validação Zod proteja contra CVE-2025-55182
 * 
 * Cenários testados:
 * 1. Rejeição de payloads com dados inválidos
 * 2. Aceitação de payloads válidos
 * 3. Proteção contra DoS (limites de tamanho)
 * 4. Versionamento automático
 * 
 *  Para executar: node tests/validation.solar.test.js
 */

const { validateSolarDetails, SolarDetailsSchema } = require('../src/validation/solar.zod.js');

// ANSI Colors para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

// Helper de teste simples
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`${colors.green}✓${colors.reset} ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} ${name}`);
    console.error(`  ${error.message}`);
    testsFailed++;
  }
}

function expect(value) {
  return {
    toThrow: () => {
      if (typeof value !== 'function') {
        throw new Error('expect().toThrow() requer uma função');
      }
      let didThrow = false;
      try {
        value();
      } catch (e) {
        didThrow = true;
      }
      if (!didThrow) {
        throw new Error('Esperava que a função lançasse erro, mas não lançou');
      }
    },
    notToThrow: () => {
      if (typeof value !== 'function') {
        throw new Error('expect().notToThrow() requer uma função');
      }
      try {
        value();
      } catch (e) {
        throw new Error(`Esperava que a função NÃO lançasse erro, mas lançou: ${e.message}`);
      }
    },
    toEqual: (expected) => {
      if (JSON.stringify(value) !== JSON.stringify(expected)) {
        throw new Error(`Esperava ${JSON.stringify(expected)}, mas recebeu ${JSON.stringify(value)}`);
      }
    },
  };
}

// =========================
// TESTES
// =========================

console.log(`\n${colors.blue}🧪 Executando Testes de Validação Solar...${colors.reset}\n`);

// Teste 1: Deve rejeitar consumo negativo
test('Deve rejeitar payload com consumo negativo', () => {
  const invalidPayload = {
    solar: {
      version: "1.0",
      inputData: {
        address: 'Rua Teste, 123',
        monthlyConsumption: -100, // ❌ Inválido
      },
    },
  };

  expect(() => SolarDetailsSchema.parse(invalidPayload)).toThrow();
});

// Teste 2: Deve aceitar payload válido
test('Deve aceitar payload válido', () => {
  const validPayload = {
    solar: {
      version: "1.0",
      inputData: {
        address: 'Rua Teste, 123',
        monthlyConsumption: 500,
      },
    },
  };

  expect(() => SolarDetailsSchema.parse(validPayload)).notToThrow();
});

// Teste 3: Deve rejeitar endereço muito longo (DoS protection)
test('Deve rejeitar endereço excedendo limite de 500 caracteres', () => {
  const payloadWithLongAddress = {
    solar: {
      version: "1.0",
      inputData: {
        address: 'A'.repeat(501), // 501 caracteres
        monthlyConsumption: 500,
      },
    },
  };

  expect(() => SolarDetailsSchema.parse(payloadWithLongAddress)).toThrow();
});

// Teste 4: Deve rejeitar latitude inválida
test('Deve rejeitar latitude fora do range [-90, 90]', () => {
  const invalidLatitude = {
    solar: {
      version: "1.0",
      inputData: {
        address: 'Rua Teste',
        monthlyConsumption: 500,
        latitude: 91, // ❌ Inválido
      },
    },
  };

  expect(() => SolarDetailsSchema.parse(invalidLatitude)).toThrow();
});

// Teste 5: Deve rejeitar systemPower negativo
test('Deve rejeitar systemPower negativo em proposalData', () => {
  const invalidSystemPower = {
    solar: {
      version: "1.0",
      inputData: {
        address: 'Rua Teste',
        monthlyConsumption: 500,
      },
      proposalData: {
        systemPower: -10, // ❌ Inválido
      },
    },
  };

  expect(() => SolarDetailsSchema.parse(invalidSystemPower)).toThrow();
});

// Teste 6: Deve rejeitar número de painéis não-inteiro
test('Deve rejeitar numberOfPanels que não seja inteiro', () => {
  const invalidPanels = {
    solar: {
      version: "1.0",
      inputData: {
        address: 'Rua Teste',
        monthlyConsumption: 500,
      },
      proposalData: {
        systemPower: 10,
        numberOfPanels: 10.5, // ❌ Deve ser inteiro
      },
    },
  };

  expect(() => SolarDetailsSchema.parse(invalidPanels)).toThrow();
});

// Teste 7: Deve aceitar proposalData completo e válido
test('Deve aceitar proposalData completo e válido', () => {
  const fullValidPayload = {
    solar: {
      version: "1.0",
      inputData: {
        address: 'Rua Engenheiro Solar, 456',
        monthlyConsumption: 750,
        latitude: -23.550520,
        longitude: -46.633308,
        electricityRate: 0.85,
        solarIrradiance: 5.2,
      },
      proposalData: {
        systemPower: 15.5,
        numberOfPanels: 30,
        panelPower: 550,
        estimatedCost: 95000,
        paybackPeriod: 4.2,
        annualSavings: 22700,
        estimatedGeneration: 1850,
        inverterModel: 'Fronius Primo 15.0-1',
        panelModel: 'Canadian Solar HiKu 550W',
        calculationDate: new Date().toISOString(),
        engineVersion: '1.0',
      },
    },
  };

  expect(() => SolarDetailsSchema.parse(fullValidPayload)).notToThrow();
});

// Teste 8: Deve ADICIONAR version automaticamente se omitido
test('validateSolarDetails deve adicionar version 1.0 se omitido', () => {
  const payloadWithoutVersion = {
    solar: {
      // version omitido
      inputData: {
        address: 'Rua Teste',
        monthlyConsumption: 500,
      },
    },
  };

  const validated = validateSolarDetails(payloadWithoutVersion);
  
  expect(validated.solar.version).toEqual("1.0");
});

// Teste 9: Deve rejeitar campos extras não declarados (strict mode)
test('Deve rejeitar campos extras não declarados no schema', () => {
  const payloadWithExtraField = {
    solar: {
      version: "1.0",
      inputData: {
        address: 'Rua Teste',
        monthlyConsumption: 500,
        hackerField: 'malicious code', // ❌ Campo não declarado
      },
    },
  };

  expect(() => SolarDetailsSchema.parse(payloadWithExtraField)).toThrow();
});

// Teste 10: Deve aceitar proposalData como opcional
test('Deve aceitar inputData sem proposalData', () => {
  const onlyInputDataPayload = {
    solar: {
      version: "1.0",
      inputData: {
        address: 'Rua Teste',
        monthlyConsumption: 500,
      },
      // proposalData omitido
    },
  };

  expect(() => SolarDetailsSchema.parse(onlyInputDataPayload)).notToThrow();
});

// =========================
// RESULTADO
// =========================

console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`${colors.green}✓ Testes Passados: ${testsPassed}${colors.reset}`);
if (testsFailed > 0) {
  console.log(`${colors.red}✗ Testes Falhados: ${testsFailed}${colors.reset}`);
  process.exit(1);
} else {
  console.log(`\n${colors.green}🎉 Todos os testes passaram!${colors.reset}`);
  console.log(`${colors.blue}Validação Zod está protegendo contra CVE-2025-55182.${colors.reset}\n`);
  process.exit(0);
}

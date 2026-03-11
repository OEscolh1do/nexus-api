
export interface LoadPreset {
    id: string;
    name: string;
    power: number; // Watts
    dutyCycle: number; // 0-1 (Ex: 0.6 for Inverter)
    defaultHours: number;
    defaultDays: number; // New field: Days per month
    solarOpportunity?: boolean;
    suggestion?: string;
}

export const TYPICAL_LOADS: LoadPreset[] = [
    {
        id: 'ac-9000',
        name: 'Ar Condicionado 9000 BTU (Inverter)',
        power: 800,
        dutyCycle: 0.6,
        defaultHours: 8,
        defaultDays: 30, // Most residential ACs run daily
        suggestion: 'Média com Inverter (Ciclo Noturno)'
    },
    {
        id: 'ac-12000',
        name: 'Ar Condicionado 12000 BTU (Inverter)',
        power: 1100,
        dutyCycle: 0.6,
        defaultHours: 8,
        defaultDays: 30,
        suggestion: 'Média com Inverter (Ciclo Noturno)'
    },
    {
        id: 'ac-18000',
        name: 'Ar Condicionado 18000 BTU (Inverter)',
        power: 1600,
        dutyCycle: 0.7,
        defaultHours: 8,
        defaultDays: 22, // Commercial often mon-fri
        suggestion: 'Uso Comercial/Intenso'
    },
    {
        id: 'ev-slow',
        name: 'Carregador VE (Lento/Portátil)',
        power: 3700,
        dutyCycle: 1.0,
        defaultHours: 4,
        defaultDays: 15, // Every other day charging
        suggestion: 'Atenção ao Pico de Corrente'
    },
    {
        id: 'ev-wallbox',
        name: 'Carregador VE (Wallbox Padrão)',
        power: 7000,
        dutyCycle: 1.0,
        defaultHours: 3,
        defaultDays: 15,
        suggestion: 'Verificar Disjuntor Geral! (Alto CONSUMO)'
    },
    {
        id: 'shower',
        name: 'Chuveiro Elétrico (Posição Morna)',
        power: 4500,
        dutyCycle: 1.0,
        defaultHours: 0.5, // 30 min
        defaultDays: 30,
        suggestion: 'Maior vilão do pico de demanda'
    },
    {
        id: 'fridge',
        name: 'Geladeira Duplex (Eficiente)',
        power: 150,
        dutyCycle: 0.35,
        defaultHours: 24,
        defaultDays: 30,
        suggestion: 'Motor liga/desliga (Duty Cycle 35%)'
    },
    {
        id: 'washer',
        name: 'Lava e Seca (Ciclo Combinado)',
        power: 2500,
        dutyCycle: 0.75,
        defaultHours: 2,
        defaultDays: 12, // 3 times a week appx
        solarOpportunity: true,
        suggestion: '💡 Ideal para horário solar (10h-14h)'
    },
    {
        id: 'pool-pump',
        name: 'Bomba de Piscina (1/2 CV)',
        power: 735,
        dutyCycle: 1.0,
        defaultHours: 6,
        defaultDays: 30,
        solarOpportunity: true,
        suggestion: '💡 Ideal para horário solar (10h-15h)'
    }
];

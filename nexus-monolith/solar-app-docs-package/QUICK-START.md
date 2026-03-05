# Quick Start - Solar Dimension App

## Pré-requisitos

- Node.js >= 18
- npm >= 9
- Git
- PostgreSQL >= 14 (ou Docker)
- Redis (opcional, para cache)

## Setup Inicial (30 minutos)

### 1. Criar Repositório

\\\ash
# Criar diretório do projeto
mkdir solar-dimension-app
cd solar-dimension-app

# Inicializar Git
git init
git add .
git commit -m "Initial commit"
\\\

### 2. Inicializar Monorepo

\\\ash
# Opção A: Turborepo (recomendado)
npx create-turbo@latest

# Opção B: Nx
npx create-nx-workspace@latest

# Estrutura esperada:
# packages/
#   ├── core/       # Lógica de negócio pura
#   ├── api/        # Backend REST
#   ├── web/        # Frontend React
#   └── shared/     # Utilitários
\\\

### 3. Configurar Core Package

\\\ash
cd packages/core

# Inicializar package
npm init -y

# Instalar dependências
npm install zod

# Instalar dev dependencies
npm install -D typescript @types/node vitest

# Criar tsconfig.json
npx tsc --init --strict
\\\

### 4. Criar Estrutura de Pastas

\\\ash
# Core
mkdir -p src/domain
mkdir -p src/schemas
mkdir -p src/types
mkdir -p tests

# Criar arquivos iniciais
touch src/domain/SolarCalculator.ts
touch src/schemas/input.schemas.ts
touch src/schemas/output.schemas.ts
touch src/types/index.ts
touch src/index.ts
\\\

### 5. Implementar SolarCalculator (Exemplo)

\\\	ypescript
// src/domain/SolarCalculator.ts
import { SolarInput, SolarOutput } from '../types';

export class SolarCalculator {
  calculate(input: SolarInput): SolarOutput {
    // TODO: Implementar lógica de cálculo
    // Consulte: 03-REQUIREMENTS.md → RF-001
    
    const systemSizeKwp = this.calculateSystemSize(
      input.consumptionKwh,
      input.cityCode
    );
    
    return {
      systemSizeKwp,
      // ... outros campos
    };
  }
  
  private calculateSystemSize(
    consumptionKwh: number,
    cityCode: string
  ): number {
    // Fórmula: (Consumo Mensal × 12) / (Irradiação Anual × 365 × 0.8)
    // TODO: Buscar irradiação do banco de dados
    const avgIrradiation = 5.0; // kWh/m²/dia (placeholder)
    const correctionFactor = 0.8; // 20% de perdas
    
    return (consumptionKwh * 12) / (avgIrradiation * 365 * correctionFactor);
  }
}
\\\

### 6. Criar Testes

\\\	ypescript
// tests/SolarCalculator.test.ts
import { describe, it, expect } from 'vitest';
import { SolarCalculator } from '../src/domain/SolarCalculator';

describe('SolarCalculator', () => {
  it('deve calcular potência do sistema corretamente', () => {
    const calculator = new SolarCalculator();
    
    const result = calculator.calculate({
      consumptionKwh: 500,
      cityCode: '3550308', // São Paulo
      roofType: 'CERAMIC',
      roofOrientation: 'NORTH',
      roofInclination: 15,
      voltage: 'V220',
      connectionType: 'BIFASICO',
    });
    
    expect(result.systemSizeKwp).toBeGreaterThan(0);
    expect(result.systemSizeKwp).toBeCloseTo(4.1, 1);
  });
});
\\\

### 7. Executar Testes

\\\ash
# Adicionar script ao package.json
# "scripts": {
#   "test": "vitest"
# }

npm test
\\\

## Próximos Passos

1. ✅ Setup completo
2. 📖 Leia 03-REQUIREMENTS.md → RF-001 a RF-004
3. 💻 Implemente IrradiationEngine
4. 💻 Implemente FinancialAnalyzer
5. 📊 Defina schemas Zod completos
6. ✅ Garanta cobertura de testes >= 80%

## Recursos

- Documentação: Leia README.md
- Arquitetura: Consulte 02-ARCHITECTURE.md
- Requisitos: Consulte 03-REQUIREMENTS.md
- Diagramas: Consulte 04-DIAGRAMS.md

## Dúvidas?

- Revise DEVELOPMENT-CHECKLIST.md
- Consulte a documentação relevante
- Entre em contato com o arquiteto

Bom desenvolvimento! 🚀

#!/usr/bin/env pwsh
# Script para criar pacote de documentação standalone para desenvolvedor externo
# Uso: .\create-solar-app-package.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Criando pacote de documentação Solar App..." -ForegroundColor Cyan

# Diretórios
$DocsDir = "docs"
$OutputDir = "solar-app-docs-package"
$AssetsDir = "$OutputDir/assets"

# Criar estrutura de pastas
Write-Host "📁 Criando estrutura de pastas..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
New-Item -ItemType Directory -Force -Path $AssetsDir | Out-Null

# Copiar documentos essenciais
Write-Host "📄 Copiando documentos essenciais..." -ForegroundColor Yellow

# 1. Overview
Copy-Item "$DocsDir/SOLAR_APP_STUDY.md" "$OutputDir/01-OVERVIEW.md"
Write-Host "  ✓ 01-OVERVIEW.md" -ForegroundColor Green

# 2. Arquitetura
Copy-Item "$DocsDir/architecture/solar-app-standalone.md" "$OutputDir/02-ARCHITECTURE.md"
Write-Host "  ✓ 02-ARCHITECTURE.md" -ForegroundColor Green

# 3. Requisitos
Copy-Item "$DocsDir/guides/solar-app-development-requirements.md" "$OutputDir/03-REQUIREMENTS.md"
Write-Host "  ✓ 03-REQUIREMENTS.md" -ForegroundColor Green

# 4. Diagramas
Copy-Item "$DocsDir/architecture/solar-app-diagrams.md" "$OutputDir/04-DIAGRAMS.md"
Write-Host "  ✓ 04-DIAGRAMS.md" -ForegroundColor Green

# 5. ADR (opcional)
Copy-Item "$DocsDir/adr/008-standalone-solar-app.md" "$OutputDir/05-ADR.md"
Write-Host "  ✓ 05-ADR.md" -ForegroundColor Green

# 6. Guia de integração (futuro)
Copy-Item "$DocsDir/guides/solar-app-integration-guide.md" "$OutputDir/06-INTEGRATION-GUIDE.md"
Write-Host "  ✓ 06-INTEGRATION-GUIDE.md" -ForegroundColor Green

# 7. Índice
Copy-Item "$DocsDir/SOLAR_APP_DEVELOPER_PACKAGE.md" "$OutputDir/README.md"
Write-Host "  ✓ README.md (índice)" -ForegroundColor Green

# Criar arquivo de metadados
Write-Host "📋 Criando metadados..." -ForegroundColor Yellow

$Metadata = @"
# Solar App Documentation Package

**Versão:** 1.0.0
**Data de Criação:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Gerado por:** create-solar-app-package.ps1

## Conteúdo

1. **README.md** - Índice e guia de início rápido
2. **01-OVERVIEW.md** - Visão geral do projeto (COMECE AQUI)
3. **02-ARCHITECTURE.md** - Arquitetura técnica detalhada
4. **03-REQUIREMENTS.md** - Requisitos funcionais e não-funcionais
5. **04-DIAGRAMS.md** - Diagramas visuais (Mermaid)
6. **05-ADR.md** - Decisão arquitetural (opcional)
7. **06-INTEGRATION-GUIDE.md** - Guia de integração com Nexus (Fase 4)

## Ordem de Leitura Recomendada

### Dia 1 (2-3 horas)
1. README.md (10 min)
2. 01-OVERVIEW.md (20 min)
3. 04-DIAGRAMS.md (15 min)
4. 02-ARCHITECTURE.md - Seções 1-3 (45 min)
5. 03-REQUIREMENTS.md - RF-001 a RF-004 (60 min)

### Dia 2-3 (4-6 horas)
1. 02-ARCHITECTURE.md - Seções 4-9 (completo)
2. 03-REQUIREMENTS.md - RF-005 a RF-009 + RNF
3. 05-ADR.md (contexto adicional)

### Fase 4 (Integração)
1. 06-INTEGRATION-GUIDE.md (apenas quando necessário)

## Próximos Passos

1. Leia README.md para entender a estrutura
2. Siga a ordem de leitura recomendada
3. Configure ambiente de desenvolvimento
4. Inicie Fase 1: Core Domain

## Suporte

- Dúvidas arquiteturais: 02-ARCHITECTURE.md
- Dúvidas de requisitos: 03-REQUIREMENTS.md
- Visualização: 04-DIAGRAMS.md

---

**Gerado automaticamente pelo Nexus Monolith**
"@

$Metadata | Out-File -FilePath "$OutputDir/PACKAGE-INFO.md" -Encoding UTF8
Write-Host "  ✓ PACKAGE-INFO.md" -ForegroundColor Green

# Criar arquivo .gitignore
Write-Host "🔒 Criando .gitignore..." -ForegroundColor Yellow

$GitIgnore = @"
# Arquivos temporários
*.tmp
*.bak
*~

# Diretórios de build (se desenvolvedor clonar aqui)
node_modules/
dist/
build/
.next/
.turbo/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
"@

$GitIgnore | Out-File -FilePath "$OutputDir/.gitignore" -Encoding UTF8
Write-Host "  ✓ .gitignore" -ForegroundColor Green

# Criar arquivo de checklist
Write-Host "✅ Criando checklist..." -ForegroundColor Yellow

$Checklist = @"
# Checklist de Desenvolvimento - Solar App

## Fase 1: Fundação (2 semanas)

### Setup
- [ ] Leu README.md
- [ ] Leu 01-OVERVIEW.md
- [ ] Leu 04-DIAGRAMS.md
- [ ] Leu 02-ARCHITECTURE.md (Seções 1-3)
- [ ] Configurou ambiente (Node.js, TypeScript, Prisma)
- [ ] Criou repositório Git
- [ ] Inicializou monorepo (Turborepo/Nx)

### Core Domain
- [ ] Criou estrutura de pastas (packages/core/domain)
- [ ] Implementou SolarCalculator.ts
- [ ] Implementou IrradiationEngine.ts
- [ ] Implementou FinancialAnalyzer.ts
- [ ] Definiu schemas Zod (input.schemas.ts, output.schemas.ts)
- [ ] Criou testes unitários (>= 80% cobertura)
- [ ] Todos os testes passando

### Entregável Fase 1
- [ ] Core domain testado e funcionando
- [ ] Documentação atualizada (README do core)
- [ ] Code review realizado

---

## Fase 2: API (2 semanas)

### Backend
- [ ] Criou estrutura de pastas (packages/api)
- [ ] Configurou Fastify
- [ ] Implementou controllers
- [ ] Implementou services (orquestração)
- [ ] Configurou Prisma (schema.prisma)
- [ ] Criou migrations
- [ ] Implementou seeds (dados de teste)

### Catálogo
- [ ] CRUD de módulos fotovoltaicos
- [ ] CRUD de inversores
- [ ] Consulta de irradiação (cache Redis)
- [ ] Validação Zod em todas as rotas

### Segurança
- [ ] Rate limiting implementado
- [ ] Validação de entrada (client + server)
- [ ] Logs estruturados (Pino)

### Entregável Fase 2
- [ ] API REST funcional
- [ ] Documentação Swagger
- [ ] Testes de integração passando

---

## Fase 3: Frontend (3 semanas)

### Setup
- [ ] Criou estrutura de pastas (packages/web)
- [ ] Configurou Vite + React
- [ ] Configurou TailwindCSS

### Wizard
- [ ] Implementou wizard de dimensionamento
- [ ] Validação Zod no frontend
- [ ] Integração com API

### PDF
- [ ] Implementou geração de PDF
- [ ] Templates profissionais
- [ ] Gráficos de geração vs consumo

### Admin
- [ ] CRUD de catálogo (UI)
- [ ] Dashboard de propostas
- [ ] Responsividade mobile

### Entregável Fase 3
- [ ] Aplicação web completa
- [ ] Testes E2E (Playwright)
- [ ] Performance dentro dos alvos

---

## Fase 4: Integração (1 semana)

### Event Bus
- [ ] Leu 06-INTEGRATION-GUIDE.md
- [ ] Configurou RabbitMQ/Redis Pub/Sub
- [ ] Implementou event publisher
- [ ] Implementou event subscriber

### Multi-tenancy
- [ ] Adicionou tenantId em todas as queries
- [ ] Testou isolamento de dados

### Entregável Fase 4
- [ ] Integração com Nexus funcional
- [ ] Testes de integração E2E passando

---

## Fase 5: Produção (1 semana)

### Otimizações
- [ ] Performance dentro dos alvos (< 500ms)
- [ ] Geração de PDF < 2s
- [ ] Throughput >= 100 req/s

### Observabilidade
- [ ] Logs estruturados
- [ ] Métricas Prometheus
- [ ] Tracing OpenTelemetry
- [ ] Alertas configurados

### Deployment
- [ ] Dockerfile otimizado
- [ ] Docker Compose funcional
- [ ] Kubernetes manifests
- [ ] CI/CD pipeline (GitHub Actions)

### Entregável Fase 5
- [ ] Aplicação em produção
- [ ] Runbook de operações
- [ ] Documentação completa

---

## Critérios de Qualidade

### Código
- [ ] ESLint sem warnings
- [ ] Prettier formatado
- [ ] TypeScript strict mode
- [ ] Funções < 50 linhas
- [ ] Complexidade ciclomática < 10

### Testes
- [ ] Cobertura >= 80% (core)
- [ ] Cobertura >= 60% (api)
- [ ] Cobertura >= 50% (web)
- [ ] Todos os testes passando

### Documentação
- [ ] README.md completo
- [ ] API Reference (Swagger)
- [ ] Comentários em lógica complexa
- [ ] Changelog atualizado

---

**Data de Início:** _______________
**Data de Conclusão Prevista:** _______________
**Desenvolvedor:** _______________
"@

$Checklist | Out-File -FilePath "$OutputDir/DEVELOPMENT-CHECKLIST.md" -Encoding UTF8
Write-Host "  ✓ DEVELOPMENT-CHECKLIST.md" -ForegroundColor Green

# Criar arquivo de quick start
Write-Host "🚀 Criando quick start..." -ForegroundColor Yellow

$QuickStart = @"
# Quick Start - Solar Dimension App

## Pré-requisitos

- Node.js >= 18
- npm >= 9
- Git
- PostgreSQL >= 14 (ou Docker)
- Redis (opcional, para cache)

## Setup Inicial (30 minutos)

### 1. Criar Repositório

\`\`\`bash
# Criar diretório do projeto
mkdir solar-dimension-app
cd solar-dimension-app

# Inicializar Git
git init
git add .
git commit -m "Initial commit"
\`\`\`

### 2. Inicializar Monorepo

\`\`\`bash
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
\`\`\`

### 3. Configurar Core Package

\`\`\`bash
cd packages/core

# Inicializar package
npm init -y

# Instalar dependências
npm install zod

# Instalar dev dependencies
npm install -D typescript @types/node vitest

# Criar tsconfig.json
npx tsc --init --strict
\`\`\`

### 4. Criar Estrutura de Pastas

\`\`\`bash
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
\`\`\`

### 5. Implementar SolarCalculator (Exemplo)

\`\`\`typescript
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
\`\`\`

### 6. Criar Testes

\`\`\`typescript
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
\`\`\`

### 7. Executar Testes

\`\`\`bash
# Adicionar script ao package.json
# "scripts": {
#   "test": "vitest"
# }

npm test
\`\`\`

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
"@

$QuickStart | Out-File -FilePath "$OutputDir/QUICK-START.md" -Encoding UTF8
Write-Host "  ✓ QUICK-START.md" -ForegroundColor Green

# Criar arquivo ZIP
Write-Host "📦 Criando arquivo ZIP..." -ForegroundColor Yellow

$ZipFile = "solar-app-docs-package.zip"
if (Test-Path $ZipFile) {
    Remove-Item $ZipFile -Force
}

Compress-Archive -Path $OutputDir -DestinationPath $ZipFile -CompressionLevel Optimal
Write-Host "  ✓ $ZipFile criado" -ForegroundColor Green

# Resumo
Write-Host ""
Write-Host "✅ Pacote criado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Pasta: $OutputDir" -ForegroundColor Cyan
Write-Host "📦 ZIP: $ZipFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "📄 Arquivos incluídos:" -ForegroundColor Yellow
Write-Host "  - README.md (índice e guia)" -ForegroundColor White
Write-Host "  - 01-OVERVIEW.md (visão geral)" -ForegroundColor White
Write-Host "  - 02-ARCHITECTURE.md (arquitetura técnica)" -ForegroundColor White
Write-Host "  - 03-REQUIREMENTS.md (requisitos completos)" -ForegroundColor White
Write-Host "  - 04-DIAGRAMS.md (diagramas visuais)" -ForegroundColor White
Write-Host "  - 05-ADR.md (decisão arquitetural)" -ForegroundColor White
Write-Host "  - 06-INTEGRATION-GUIDE.md (integração Nexus)" -ForegroundColor White
Write-Host "  - PACKAGE-INFO.md (metadados)" -ForegroundColor White
Write-Host "  - DEVELOPMENT-CHECKLIST.md (checklist de desenvolvimento)" -ForegroundColor White
Write-Host "  - QUICK-START.md (guia de início rápido)" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Próximos passos:" -ForegroundColor Yellow
Write-Host "  1. Envie $ZipFile para o desenvolvedor" -ForegroundColor White
Write-Host "  2. Desenvolvedor deve ler README.md primeiro" -ForegroundColor White
Write-Host "  3. Seguir ordem de leitura recomendada" -ForegroundColor White
Write-Host ""
Write-Host "📧 Template de email disponível em:" -ForegroundColor Yellow
Write-Host "  $OutputDir/README.md (seção 'Template de Email')" -ForegroundColor White
Write-Host ""

# Lumi

> **Sistema de Dimensionamento de Sistemas Fotovoltaicos**  
> Arquitetura Hexagonal | TypeScript | React | Zod Validation

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff.svg)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

---

## 🎯 Sobre o Projeto

**Lumi** é uma aplicação de engenharia fotovoltaica que automatiza o dimensionamento de sistemas solares residenciais e comerciais. Refatorada seguindo princípios de **Clean Architecture** e **Hexagonal Architecture**, a aplicação garante:

- ✅ **Separação de Responsabilidades** (SOLID)
- ✅ **Testabilidade** via Dependency Injection
- ✅ **Segurança por Design** (validação Zod obrigatória)
- ✅ **Independência de Frameworks**
- ✅ **Manutenibilidade** e escalabilidade

### Funcionalidades Principais

🔹 **Dimensionamento Automático**  
Calcula potência do sistema (kWp), quantidade de módulos e inversores baseado em consumo histórico.

🔹 **Análise de Irradiação Solar**  
Banco de dados CRESESB local + fallback para Google GenAI API.

🔹 **Composição de Serviços**  
Cronograma de instalação em 6 etapas com custos detalhados.

🔹 **Análise Financeira**  
Payback, ROI 25 anos, opções de parcelamento (1x a 36x).

🔹 **Geração de Proposta PDF**  
Template profissional com gráficos e especificações técnicas.

---

## 🚀 Quick Start

### Pré-requisitos

- Node.js v18+ (testado em v20.11.0)
- npm v9+

### Instalação

```bash
# Clone o repositório
cd lumi-propose-engine/Lumi

# Instale dependências
# (--legacy-peer-deps resolve conflitos de peer dependencies do React 19)
npm install --legacy-peer-deps

# Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local e adicione VITE_API_KEY
```

### Executar

```bash
# Desenvolvimento
npm run dev
# Acesse http://localhost:5173

# Build de produção
npm run build

# Preview do build
npm run preview
```

---

## 📂 Estrutura do Projeto

```
Lumi/
├── src/
│   ├── core/                    # 🔒 Core Domain (Business Logic)
│   │   ├── domain/              # Lógica de cálculo pura
│   │   ├── ports/               # Interfaces (DIP)
│   │   ├── schemas/             # Validação Zod
│   │   └── types/               # Type definitions
│   ├── services/                # 🔧 Application Services
│   │   ├── adapters/            # Implementações de Ports
│   │   ├── solarEngine.ts       # Facade de cálculos
│   │   └── weatherService.ts    # Serviço de clima
│   ├── components/              # 🎨 UI Layer (React)
│   │   ├── InputForm.tsx
│   │   ├── TechnicalForm.tsx
│   │   ├── AnalysisPhase.tsx
│   │   └── ...
│   ├── data/                    # 📊 Data Layer
│   │   ├── equipment/           # Catálogos de módulos/inversores
│   │   └── irradiation/         # Banco CRESESB
│   ├── App.tsx                  # Orquestrador principal
│   └── main.tsx                 # Entry point
├── ARCHITECTURE.md              # Documentação arquitetural
├── DEVELOPER_GUIDE.md           # Guia de desenvolvimento
├── COMPONENTS.md                # Referência de componentes
└── package.json
```

---

## 🏗️ Arquitetura

### Hexagonal Architecture (Ports & Adapters)

```
┌─────────────────────────────────────────────┐
│           UI Layer (React)                  │
│  InputForm → TechnicalForm → AnalysisPhase  │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│      Application Services                   │
│  solarEngine.ts | weatherService.ts         │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         Core Domain (Isolado)               │
│  SolarCalculator ← IIrradiationProvider     │
│                  ← IEquipmentRepository     │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│      Adapters (Infrastructure)              │
│  CresesbIrradiationProvider                 │
│  InMemoryEquipmentRepo                      │
└─────────────────────────────────────────────┘
```

**Leia mais**: [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 🛠️ Tecnologias

| Categoria       | Stack                      |
| --------------- | -------------------------- |
| **Frontend**    | React 19.2, TypeScript 5.8 |
| **Build Tool**  | Vite 6.2                   |
| **Validação**   | Zod 3.22                   |
| **Logging**     | Pino 8.17                  |
| **Gráficos**    | Recharts 3.6               |
| **PDF**         | jsPDF 3.0, html2canvas 1.4 |
| **Ícones**      | lucide-react 0.561         |
| **API Externa** | Google GenAI 1.34          |

---

## 📖 Documentação

| Documento                                       | Descrição                                                |
| ----------------------------------------------- | -------------------------------------------------------- |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md)       | Arquitetura hexagonal, diagramas Mermaid, fluxo de dados |
| [DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md) | Setup, workflows, padrões de código, testes              |
| [COMPONENTS.md](./docs/COMPONENTS.md)           | Referência de componentes React (props, exemplos)        |
| [API.md](./docs/API.md)                         | Referência de APIs e schemas Zod                         |

---

## 🧪 Testes

```bash
# Executar testes unitários
npm run test

# Modo watch
npm run test -- --watch

# Cobertura
npm run test:coverage

# UI interativa
npm run test:ui
```

---

## 🔒 Segurança

### Mandatos de Segurança

1. **Validação Obrigatória com Zod**  
   Toda entrada que cruza fronteira Cliente → Servidor DEVE ser validada.

2. **Proteção contra CVE-2025-55182**  
   Nenhum dado não sanitizado é renderizado diretamente.

3. **Sanitização XSS**  
   Uso de `isomorphic-dompurify` para inputs de texto.

4. **Secrets Management**  
   API keys em `.env.local` (não commitadas).

5. **Logging Estruturado**  
   Auditoria com `pino` para operações críticas.

---

## 📜 Scripts Disponíveis

```bash
npm run dev              # Servidor de desenvolvimento
npm run build            # Build de produção
npm run preview          # Preview do build
npm run lint             # ESLint
npm run type-check       # TypeScript check
npm run test             # Testes unitários
npm run test:ui          # Vitest UI
npm run test:coverage    # Cobertura de testes
```

---

## 🤝 Contribuindo

### Workflow de Desenvolvimento

1. **Clone e instale**:

   ```bash
   git clone <repo-url>
   cd Lumi
   npm install --legacy-peer-deps
   ```

2. **Crie uma branch**:

   ```bash
   git checkout -b feature/nova-funcionalidade
   ```

3. **Desenvolva seguindo padrões**:
   - Leia [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
   - Use validação Zod em todas as fronteiras
   - Escreva testes para lógica de negócio

4. **Verifique qualidade**:

   ```bash
   npm run type-check
   npm run lint
   npm run test
   ```

5. **Commit e push**:
   ```bash
   git add .
   git commit -m "feat: adiciona nova funcionalidade"
   git push origin feature/nova-funcionalidade
   ```

### Convenções de Commit

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `refactor:` Refatoração de código
- `test:` Adição/modificação de testes
- `chore:` Tarefas de manutenção

---

## 📊 Roadmap

### Fase 1: Funcionalidades Core ✅

- [x] Dimensionamento automático
- [x] Análise de irradiação (CRESESB + GenAI)
- [x] Composição de serviços
- [x] Geração de PDF

### Fase 2: Testes e Qualidade 🚧

- [ ] Testes unitários (SolarCalculator)
- [ ] Testes de integração (solarEngine)
- [ ] Testes de componentes (React Testing Library)
- [ ] Cobertura > 80%

### Fase 3: Otimizações 📋

- [ ] Memoização de cálculos pesados
- [ ] Code splitting de componentes
- [ ] Lazy loading de dados
- [ ] Service Worker (PWA)

### Fase 4: Novas Funcionalidades 💡

- [ ] Suporte a baterias (armazenamento)
- [ ] Cálculo de sistemas trifásicos complexos
- [ ] Integração com APIs de concessionárias
- [ ] Dashboard de monitoramento pós-instalação

---

## 📝 Licença

**Proprietary** - Todos os direitos reservados.

---

## 👥 Equipe

**Arquiteto de Software**: Antigravity  
**Empresa**: Neonorte Tecnologia  
**Contato**: [contato@neonorte.com.br](mailto:contato@neonorte.com.br)

---

## 🙏 Agradecimentos

- **CRESESB** - Banco de dados de irradiação solar
- **Google GenAI** - API de análise climática
- **Comunidade Open Source** - React, TypeScript, Vite, Zod

---

**Desenvolvido com ⚡ por Neonorte Tecnologia**

# Lumi V3.2 - Arquitetura Modular Full-Height

> **Lead Architecture Document**
> **Versão**: 3.2.0 (Integrated Finance & Contracts)
> **Data**: 2026-02-15
> **Pattern**: ProfileOrchestrator + Domain Modules + Global Zustand

---

## 📋 Índice

1. [Visão Geral e Evolução](#visão-geral-e-evolução)
2. [Arquitetura V3.2](#arquitetura-v32)
3. [Layout de 3 Colunas (CRM)](#layout-de-3-colunas-crm)
4. [Estrutura de Diretórios](#estrutura-de-diretórios)
5. [Gerenciamento de Estado](#gerenciamento-de-estado)
6. [Segurança e Validação](#segurança-e-validação)

---

## 🎯 Visão Geral e Evolução

### De V3.1 para V3.2 (Maturidade Comercial)

| V3.1 (Tech Focus)              | V3.2 (Commercial Focus)                        |
| ------------------------------ | ---------------------------------------------- |
| `SettingsModule` local storage | `SettingsModule` Global Store (Zustand Slices) |
| Financiamento (Placeholder)    | `FinanceSlice` + `Contract Generation`         |
| Precificação Estática          | Precificação Configurável (Kits, Margins, BOS) |

> [!IMPORTANT]
> A grande mudança da V3.2 é a promoção das "Premissas" (`Settings`) para o estado global, permitindo que alterações de preço e juros afetem imediatamente todas as simulações ativas.

---

## 🏗️ Arquitetura V3.2

### Fluxo de Renderização

```mermaid
graph TB
    subgraph "Entry Point"
        APP[App.tsx]
    end

    subgraph "Orchestration Layer"
        ORCH[ProfileOrchestrator]
    end

    subgraph "Domain Modules (Full-Height)"
        CRM[ClientModule]
        ENG[TechModule]
        ELEC[ElectricalModule]
        DOC[DocumentationModule]
        PROP[ProposalModule]
        SET[SettingsModule]
    end

    subgraph "Global State (Zustand)"
        STORE[(SolarStore)]
        CRM_SLICE[ClientSlice]
        TECH_SLICE[TechSlice]
        ELEC_SLICE[ElectricalSlice]
        FIN_SLICE[FinanceSlice]
        SET_SLICE[SettingsSlice (Integrated)]
    end

    APP --> ORCH
    ORCH -->|activeModule='crm'| CRM
    ORCH -->|activeModule='engineering'| ENG
    ORCH -->|activeModule='electrical'| ELEC
    ORCH -->|activeModule='documentation'| DOC
    ORCH -->|activeModule='proposal'| PROP
    ORCH -->|activeModule='settings'| SET

    CRM <--> STORE
    ENG <--> STORE
    ELEC <--> STORE
    DOC <--> STORE
    PROP <--> STORE
    SET <--> STORE

    STORE --- CRM_SLICE
    STORE --- TECH_SLICE
    STORE --- ELEC_SLICE
    STORE --- FIN_SLICE
    STORE --- SET_SLICE

    style ORCH fill:#f96,stroke:#333
    style CRM fill:#81C784,stroke:#2E7D32
    style PROP fill:#64B5F6,stroke:#1565C0
    style SET fill:#90A4AE,stroke:#455A64
```

### Mapeamento Completo de Tabs

| Tab ID          | Label           | Componente            | Status    | Roles Permitidos       |
| --------------- | --------------- | --------------------- | --------- | ---------------------- |
| `crm`           | Levantamento    | `ClientModule`        | ✅ Pronto | SALES, ENGINEER, ADMIN |
| `engineering`   | Dimensionamento | `TechModule`          | ✅ Pronto | ENGINEER, ADMIN        |
| `electrical`    | Elétrico & BOS  | `ElectricalModule`    | ✅ Pronto | ENGINEER, ADMIN        |
| `documentation` | Documentação    | `DocumentationModule` | ✅ Pronto | ENGINEER, ADMIN        |
| `finance`       | Financeiro      | `FinanceModule`       | ✅ Pronto | ADMIN                  |
| `proposal`      | Proposta        | `ProposalModule`      | ✅ Pronto | SALES, ENGINEER, ADMIN |
| `settings`      | Premissas       | `SettingsModule`      | ✅ Pronto | ENGINEER, ADMIN        |

> **Nota:** O módulo `finance` atua como uma funcionalidade independente (aba exclusiva para ADMIN) e também é consumido pelos módulos `Proposal` e `Settings`.

---

## 🏛️ Layout de 3 Colunas (CRM)

O `ClientModule` implementa um layout de **3 colunas distintas** com identidade visual por cor:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ProfileOrchestrator Header                             │
├────────────────┬───────────────────────────────┬───────────────────────────┤
│   🟣 ADMIN     │         🟢 GEO                │      🟠 WEATHER           │
│   (3 cols)     │         (5 cols)              │      (4 cols)             │
├────────────────┼───────────────────────────────┼───────────────────────────┤
│ ClientDataPanel│     GeoLocationWidget         │ WeatherStats              │
│ • Nome Cliente │     • Mapa Leaflet            │ • Cards HSP/Temperatura   │
│ • CPF/Contato  │     • Busca de Endereço       │ • Presets de Cidades      │
│ • Endereço     │     • Desenho de Área         │ • Simulação Térmica       │
│ • Área (m²)    │                               │                           │
└────────────────┴───────────────────────────────┴───────────────────────────┘
```

---

## 📂 Estrutura de Diretórios

```bash
src/
├── App.tsx                 # Renderiza ProfileOrchestrator
├── layout/
│   └── ProfileOrchestrator.tsx  # Shell global (Header + Routing)
├── modules/
│   ├── crm/
│   │   ├── ClientModule.tsx         # Orquestrador de Abas
│   │   └── components/              # Widgets
│   ├── engineering/
│   │   ├── TechModule.tsx           # Dimensionamento
│   │   └── components/
│   ├── electrical/
│   │   ├── ElectricalModule.tsx     # BOS
│   │   └── tabs/
│   ├── documentation/
│   │   ├── DocumentationModule.tsx
│   │   └── tabs/
│   ├── proposal/                   # ✅ EXPANDIDO V3.2
│   │   ├── ProposalModule.tsx      # Orquestrador de Proposta
│   │   ├── tabs/
│   │   │   ├── PresentationTab.tsx     # Apresentação Visual
│   │   │   ├── PricingTab.tsx          # Ajuste Fino de Preço
│   │   │   └── ContractPreviewTab.tsx  # ✅ Geração de Minuta
│   │   └── utils/
│   │       ├── generatePDF.ts          # Motor de PDF (Comercial)
│   │       └── generateContract.ts     # Motor de Contrato (Legal)
│   ├── finance/                    # ✅ REINTEGRADO V3.2
│   │   ├── FinanceModule.tsx       # Simulação Financeira
│   │   ├── components/             # Componentes Financeiros
│   │   └── store/                  # Store Específico
│   │       └── financeSlice.ts     # Slice de Financiamento
│   └── settings/                   # ✅ REATORADO V3.2
│       ├── SettingsModule.tsx      # Orquestrador Global
│       └── tabs/
│           ├── PerformanceTab.tsx  # Perdas e Ganhos
│           ├── PricingTab.tsx      # ✅ Preços de Kits e Margens
│           ├── FinanceTab.tsx      # ✅ Juros e Inflação
│           └── InstitutionalTab.tsx
├── core/
│   ├── state/
│   │   ├── solarStore.ts           # Store Principal
│   │   ├── slices/                 # ✅ SLICES ORGANIZADOS
│   │   │   ├── clientSlice.ts
│   │   │   ├── techSlice.ts
│   │   │   └── electricalSlice.ts
│   └── schemas/
└── components/             # UI Library (Dense UI)
```

---

## 🧩 Gerenciamento de Estado

### SolarStore (Zustand)

> **Documentação Completa**: [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md)

```typescript
// solarStore.ts (Simplificado)
interface SolarState {
  // Slices Domain-Driven
  clientData: InputData; // CRM (ClientSlice)
  modules: ModuleSpecs[]; // Tech (TechSlice)
  settings: EngineeringSettings; // Admin (SettingsSlice - via TechSlice)
  financeParams: FinanceParams; // ✅ Finance (FinanceSlice)

  // UI State
  activeModule: string;
  userRole: "SALES" | "ENGINEER" | "ADMIN";
}
```

### Persistência

- **Storage Engine**: `localStorage` (via zustand/persist middleware).
- **Dados Persistidos**:
  - `clientData` (CRM)
  - `modules`, `inverters` (Tech)
  - `engineeringData` (Geo)
  - `financeParams` (Configuração do Financiamento Ativo)
  - `settings` (Premissas Globais - **Agora no Store Principal**)

---

## 🔒 Segurança e Validação

Validação Zod na entrada e persistência:

| Schema                      | Arquivo               | Descrição                                   |
| --------------------------- | --------------------- | ------------------------------------------- |
| `ClientDataSchema`          | `input.schemas.ts`    | Dados do cliente e faturas                  |
| `EngineeringSettingsSchema` | `settings.schemas.ts` | Premissas globais (incl. Preços e Juros)    |
| `FinanceSchema`             | `financeSchema.ts`    | Parâmetros de simulação (Entrada, Parcelas) |

---

**Autor**: Neonorte Tecnologia  
**Status**: Produção (Stable V3.2.0)  
**Última Atualização**: 2026-02-15

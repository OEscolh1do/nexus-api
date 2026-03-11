# Diagrama: Evolução da Arquitetura Solar

## Situação Atual (ADR 003)

```mermaid
graph TB
    subgraph "Neonorte | Nexus Monolith"
        A[Commercial Module]
        B[Solar Module<br/>Integrado]
        C[Ops Module]
        D[Database]
    end

    A -->|Cria proposta| B
    B -->|Persiste| D
    B -->|Cria projeto| C

    style B fill:#faa,stroke:#333,stroke-width:2px

    Note1[❌ Acoplado ao Neonorte | Nexus<br/>❌ Não reutilizável<br/>❌ Difícil testar isoladamente]
```

## Proposta: Aplicação Standalone (ADR 008)

```mermaid
graph TB
    subgraph "Solar Dimension App (Standalone)"
        SA[Solar API]
        SC[Solar Core<br/>Hexagonal]
        SDB[(Solar DB)]
        SWE[Solar Web]
    end

    subgraph "Neonorte | Nexus Monolith"
        NA[Neonorte | Nexus API Gateway]
        NM[Commercial Module]
        NDB[(Neonorte | Nexus DB)]
    end

    subgraph "Outras Aplicações"
        MA[Mobile App]
        PU[Calculadora Pública]
    end

    EB[Event Bus<br/>RabbitMQ]

    SWE -->|REST| SA
    MA -->|REST| SA
    PU -->|REST| SA

    SA --> SC
    SA --> SDB

    NA -->|Proxy| SA
    NM --> NA

    SA -->|Publish| EB
    EB -->|Subscribe| NA
    NA --> NDB

    style SC fill:#bfb,stroke:#333,stroke-width:3px
    style SA fill:#bbf,stroke:#333,stroke-width:2px

    Note2[✅ Independente<br/>✅ Reutilizável<br/>✅ Testável<br/>✅ Escalável]
```

## Estratégias de Integração

### Opção 1: Microserviço (Produção)

```mermaid
sequenceDiagram
    participant NF as Neonorte | Nexus Frontend
    participant NG as Neonorte | Nexus Gateway
    participant SA as Solar API
    participant EB as Event Bus
    participant ND as Neonorte | Nexus DB
    participant SD as Solar DB

    NF->>NG: POST /solar/calculate
    NG->>NG: Valida JWT
    NG->>SA: Proxy + API Key
    SA->>SD: Calcula + Persiste
    SA-->>NG: 201 Created
    SA->>EB: solar.proposal.created
    EB->>NG: Consume event
    NG->>ND: Sincroniza
    NG-->>NF: 201 Created

    Note over SA,EB: Comunicação Assíncrona
    Note over NG,SA: Comunicação Síncrona
```

### Opção 2: Biblioteca Compartilhada (Desenvolvimento)

```mermaid
graph LR
    subgraph "NPM Package"
        P[@neonorte/solar-core]
    end

    subgraph "Neonorte | Nexus Backend"
        N1[Solar Service]
        N2[Prisma Adapter]
    end

    subgraph "Solar App"
        S1[Solar Service]
        S2[Prisma Adapter]
    end

    subgraph "Mobile App"
        M1[Solar Service]
        M2[SQLite Adapter]
    end

    P -->|npm install| N1
    P -->|npm install| S1
    P -->|npm install| M1

    N1 --> N2
    S1 --> S2
    M1 --> M2

    style P fill:#bbf,stroke:#333,stroke-width:3px
```

### Opção 3: Módulo Embarcado (MVP)

```mermaid
graph TB
    subgraph "Solar App (Origem)"
        O1[Core Domain]
        O2[Schemas Zod]
    end

    subgraph "Neonorte | Nexus Monolith"
        N1[modules/solar/domain]
        N2[modules/solar/schemas]
        N3[modules/solar/services]
        N4[Neonorte | Nexus Prisma]
        N5[Neonorte | Nexus Events]
    end

    O1 -.->|Copia| N1
    O2 -.->|Copia| N2

    N3 --> N1
    N3 --> N2
    N3 --> N4
    N3 --> N5

    style O1 fill:#faa,stroke:#333,stroke-width:2px
    style O2 fill:#faa,stroke:#333,stroke-width:2px
    style N1 fill:#bfb,stroke:#333,stroke-width:2px
    style N2 fill:#bfb,stroke:#333,stroke-width:2px
```

## Arquitetura Hexagonal (Core)

```mermaid
graph TB
    subgraph "Core Domain (Hexágono)"
        C1[SolarCalculator]
        C2[IrradiationEngine]
        C3[FinancialAnalyzer]
        C4[ProposalGenerator]
    end

    subgraph "Ports (Interfaces)"
        P1[IEquipmentRepository]
        P2[IIrradiationProvider]
        P3[IProposalStorage]
        P4[IEventBus]
    end

    subgraph "Adapters Neonorte | Nexus"
        AN1[PrismaEquipmentRepo]
        AN2[NexusIrradiationCache]
        AN3[NexusFileStorage]
        AN4[NexusEventBus]
    end

    subgraph "Adapters Solar App"
        AS1[PrismaEquipmentRepo]
        AS2[ANEELIrradiationAPI]
        AS3[S3ProposalStorage]
        AS4[RabbitMQEventBus]
    end

    subgraph "Adapters Testes"
        AT1[InMemoryEquipmentRepo]
        AT2[MockIrradiationProvider]
        AT3[InMemoryStorage]
        AT4[NoOpEventBus]
    end

    C1 --> P1
    C2 --> P2
    C4 --> P3
    C1 --> P4

    P1 -.-> AN1
    P2 -.-> AN2
    P3 -.-> AN3
    P4 -.-> AN4

    P1 -.-> AS1
    P2 -.-> AS2
    P3 -.-> AS3
    P4 -.-> AS4

    P1 -.-> AT1
    P2 -.-> AT2
    P3 -.-> AT3
    P4 -.-> AT4

    style C1 fill:#bbf,stroke:#333,stroke-width:3px
    style C2 fill:#bbf,stroke:#333,stroke-width:3px
    style C3 fill:#bbf,stroke:#333,stroke-width:3px
    style C4 fill:#bbf,stroke:#333,stroke-width:3px
```

## Roadmap de Implementação

```mermaid
gantt
    title Roadmap Solar Dimension App
    dateFormat  YYYY-MM-DD
    section Fase 1: Fundação
    Setup Monorepo           :f1a, 2026-02-01, 3d
    Core Domain              :f1b, after f1a, 7d
    Schemas Zod              :f1c, after f1a, 5d
    Testes Unitários         :f1d, after f1b, 4d

    section Fase 2: API
    Backend REST             :f2a, after f1d, 5d
    Persistência Prisma      :f2b, after f2a, 4d
    Catálogo Equipamentos    :f2c, after f2b, 3d
    Dados Irradiação         :f2d, after f2c, 2d

    section Fase 3: Frontend
    Wizard Dimensionamento   :f3a, after f2d, 7d
    Geração PDF              :f3b, after f3a, 5d
    Catálogo Admin           :f3c, after f3b, 4d
    Dashboard Propostas      :f3d, after f3c, 5d

    section Fase 4: Integração
    Event Bus                :f4a, after f3d, 3d
    Sincronização Neonorte | Nexus      :f4b, after f4a, 3d
    Multi-tenancy            :f4c, after f4b, 1d

    section Fase 5: Produção
    Otimizações              :f5a, after f4c, 3d
    Observabilidade          :f5b, after f5a, 2d
    Deploy Kubernetes        :f5c, after f5b, 2d
```

## Comparação de Estratégias

```mermaid
graph TD
    A{Escolher Estratégia}

    A -->|MVP Rápido| B[Módulo Embarcado]
    A -->|Desenvolvimento| C[Biblioteca NPM]
    A -->|Produção| D[Microserviço]

    B --> B1[✅ Simplicidade<br/>✅ Zero latência<br/>❌ Código duplicado]
    C --> C1[✅ Tipagem compartilhada<br/>✅ Refatoração atômica<br/>❌ Acoplamento versões]
    D --> D1[✅ Escalabilidade<br/>✅ Deploy independente<br/>❌ Complexidade operacional]

    B1 --> E[Recomendado: Fase 1-3]
    C1 --> F[Recomendado: Desenvolvimento]
    D1 --> G[Recomendado: Produção]

    style B fill:#bfb
    style C fill:#bbf
    style D fill:#fbb
```

## Modelo de Dados (Compatibilidade)

```mermaid
erDiagram
    SolarProposal ||--o{ Lead : "externalLeadId (opcional)"
    SolarProposal ||--o{ Project : "cria quando aprovado"
    SolarProposal {
        string id PK
        float consumptionKwh
        string cityCode
        float systemSizeKwp
        decimal totalInvestment
        float paybackYears
        string tenantId "opcional (multi-tenancy)"
        string externalLeadId "opcional (integração Neonorte | Nexus)"
    }

    SolarModule {
        string id PK
        string brand
        string model
        int powerWp
        float efficiency
        decimal price
    }

    SolarInverter {
        string id PK
        string brand
        string model
        float powerKw
        int phases
        decimal price
    }

    Lead {
        string id PK
        string name
        string phone
        string tenantId
    }

    Project {
        string id PK
        string title
        string proposalId FK
        string tenantId
    }

    Note1["✅ Campos opcionais permitem<br/>uso standalone E integrado"]
```

---

**Legenda:**

- 🟦 **Azul:** Core Domain (lógica pura)
- 🟩 **Verde:** Componentes reutilizáveis
- 🟥 **Vermelho:** Componentes acoplados (a evitar)
- ⚪ **Branco:** Infraestrutura/Adaptadores

# Lumi - Guia do Desenvolvedor

> **Developer Guide - Setup, Workflows e Best Practices**  
> **Versão**: 3.1.0 (Detailed Analysis & Tech Standard)  
> **Data**: 2026-01-30

---

## 📋 Índice

1. [Setup Inicial](#setup-inicial)
2. [Estrutura de Diretórios V3](#estrutura-de-diretórios-v3)
3. [Workflows](#workflows)
4. [Convenções](#convenções)

---

## 🚀 Setup Inicial

```bash
# Clone e instale
cd Lumi
npm install

# Dev server
npm run dev
# → http://localhost:5173

# Type check
npx tsc --noEmit --skipLibCheck
```

---

## 🏗️ Estrutura de Diretórios V3

```bash
src/
├── App.tsx                 # Entry → ProfileOrchestrator
├── layout/
│   └── ProfileOrchestrator.tsx  # Shell (Header + Module Router)
├── modules/                # DOMAIN MODULES (7 total)
│   ├── crm/
│   │   ├── ClientModule.tsx         # Orchestrator
│   │   ├── tabs/
│   │   │   ├── SurveyTab.tsx        # 🟣🟢🟠 Levantamento
│   │   │   └── AnalysisTab.tsx      # 🟠 Análise
│   │   └── components/
│   │       ├── ClientDataPanel.tsx
│   │       ├── GeoLocationWidget.tsx
│   │       ├── WeatherStats.tsx
│   │       ├── ConsumptionManager.tsx
│   │       ├── LoadSimulator.tsx
│   │       └── EnergyProfileChart.tsx
│   ├── engineering/
│   │   ├── TechModule.tsx           # Flex-1 Layout
│   │   ├── tabs/
│   │   │   ├── PVArrayTab.tsx
│   │   │   ├── InverterSystemTab.tsx
│   │   │   └── GenerationAnalysisTab.tsx
│   │   └── components/
│   ├── electrical/
│   │   ├── ElectricalModule.tsx
│   │   ├── tabs/
│   │   │   ├── CablingTab.tsx
│   │   │   └── StringBoxTab.tsx
│   │   └── components/
│   │       └── BOSInventory.tsx
│   ├── documentation/              # ✅ NOVO
│   │   ├── DocumentationModule.tsx
│   │   ├── tabs/
│   │   └── components/
│   ├── proposal/                   # ✅ NOVO
│   │   └── ProposalModule.tsx      # Checklist + geração
│   └── settings/                   # ✅ NOVO
│       ├── SettingsModule.tsx      # Premissas (localStorage)
│       └── tabs/
├── core/
│   ├── state/
│   │   └── solarStore.ts   # Zustand
│   ├── schemas/            # Zod
│   └── types/
└── components/
    └── ui/                 # Design System (DenseCard, etc)
```

### Fluxo de Renderização

```
App.tsx → ProfileOrchestrator → [ClientModule | TechModule | ElectricalModule | DocumentationModule | ProposalModule | SettingsModule | FinancePlaceholder]
```

---

## 🔄 Workflows

### Criar Novo Componente Atômico

1. Crie em `src/modules/[module]/components/NewAtom.tsx`
2. Conecte via `useSolarStore` (não use props para state global)
3. Envolva com `DenseCard` para consistência visual
4. Adicione ao grid do módulo orquestrador

### Criar Novo Módulo

1. Crie diretório `src/modules/[novo]/`
2. Crie `[Novo]Module.tsx` com layout full-height
3. Adicione import em `ProfileOrchestrator.tsx`
4. Adicione case no `activeModule` switch
5. Registre roles permitidos em `MODULE_ROLES`
6. (Opcional) Adicione tab em `navigation.ts`

### Atualizar Premissas

O `SettingsModule` persiste em `localStorage` com key `engineering_settings`:

```typescript
// Ler
const settings = localStorage.getItem('engineering_settings');

// Settings padrão estão em SettingsModule.tsx
const DEFAULT_SETTINGS = { ... };
```

---

## 📐 Convenções

### Layout de 3 Colunas (CRM)

```tsx
<div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full">
    <section className="lg:col-span-3">  {/* Esquerda */}
    <section className="lg:col-span-5">  {/* Centro */}
    <section className="lg:col-span-4">  {/* Direita */}
</div>
```

### Cores por Coluna

| Coluna   | Cor        | CSS Class                |
| -------- | ---------- | ------------------------ |
| Esquerda | 🟣 Roxo    | `border-neonorte-purple` |
| Centro   | 🟢 Verde   | `border-emerald-500`     |
| Direita  | 🟠 Laranja | `border-orange-400`      |

### Module Roles

```typescript
// ProfileOrchestrator.tsx
const MODULE_ROLES = {
  crm: ["SALES", "ENGINEER", "ADMIN"],
  engineering: ["ENGINEER", "ADMIN"],
  electrical: ["ENGINEER", "ADMIN"],
  documentation: ["ENGINEER", "ADMIN"],
  finance: ["ADMIN"],
  proposal: ["SALES", "ENGINEER", "ADMIN"],
  settings: ["ENGINEER", "ADMIN"],
};
```

### Deprecated (Não Use)

> **Consulte**: [LEGACY_COMPONENTS_DETAIL.md](LEGACY_COMPONENTS_DETAIL.md) para detalhes antigos.
> **Consulte**: [MODULES_DETAIL.md](MODULES_DETAIL.md) para arquitetura atual.

| Legado                    | Substituto            |
| ------------------------- | --------------------- |
| `SolarDashboard`          | `ProfileOrchestrator` |
| `InputForm`               | `ClientModule`        |
| `TechnicalForm`           | `TechModule`          |
| `SettingsPanel` (modal)   | `SettingsModule`      |
| `ServiceCompositionPhase` | `ProposalModule`      |

---

**Autor**: Neonorte Tecnologia  
**Versão**: 3.1.0  
**Última Atualização**: 2026-02-02

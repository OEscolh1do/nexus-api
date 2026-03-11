# 🏗️ Plano de Arquitetura: Sistema AC (InverterSystemTab)

**Versão:** 1.0  
**Data:** 2026-02-03  
**Autor:** Neonorte Tecnologia (Antigravity Agent)

---

## 🎯 Objetivo

Definir a estrutura técnica, visual e funcional da aba **Sistema AC**, replicando o sucesso da UX do _PV Array_ ("High Density Grid") para o contexto de Inversores e StringBox.

---

## 🗺️ Mapeamento de Componentes (De/Para)

A estratégia é espelhar a arquitetura da aba DC (PVArrayTab) para reduzir a carga cognitiva do desenvolvedor e do usuário.

| Função       | Componente DC (Referência)   | Novo Componente AC (Target) | Mudanças Chave                                                      |
| :----------- | :--------------------------- | :-------------------------- | :------------------------------------------------------------------ |
| **Status**   | `PVArrayStatusBar`           | `InverterStatusBar`         | Kpis: Fator de Dimensionamento (FDI), Potência AC Total, # MPPTs.   |
| **Workflow** | `ModuleInventory`            | `InverterInventory`         | Dual Mode mantido. Adicionar gestão de disparidade de strings.      |
| **Config**   | `SystemLossesCard`           | `StringConfigurator`        | Substitui perdas por configuração de Strings (MPPTs). Layout denso. |
| **Feedback** | `GenerationConsumptionChart` | `InverterEfficiencyChart`   | Curva de eficiência x Tensão ou Clipping visual.                    |

---

## 📐 Wireframe (Grid 12-col)

O layout seguirá estritamente o grid de 12 colunas estabelecido no PV Array.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       InverterSystemTab Container                       │
│                    (Grid 12-col, h-full, gap-4, p-2)                   │
├─────────────────────────────────────────┬───────────────────────────────┤
│  LEFT COLUMN (col-span-8)              │  RIGHT COLUMN (col-span-4)    │
│  Stack Vertical                         │  Full Height Panel            │
│                                         │                               │
│  ┌───────────────────────────────────┐ │  ┌─────────────────────────┐ │
│  │ 🟦 ZONA A: STATUS BAR             │ │  │ 🟨 ZONA D:              │ │
│  │ InverterStatusBar                 │ │  │ STRING LAYOUT           │ │
│  │ (h-14, shrink-0)                  │ │  │ StringConfigurator      │ │
│  │ KPIs: FDI, AC Power, Strings Ok   │ │  │ (h-full)                │ │
│  └───────────────────────────────────┘ │  │                         │ │
│                                         │  │ • Seleção de Inversor   │ │
│  ┌───────────────────────────────────┐ │  │ • Config MPPTs (1, 2..) │ │
│  │ 🟩 ZONA B: INVERTER MANAGER       │ │  │ • Visualização Strings  │ │
│  │ InverterInventory                 │ │  │   [=====] 12 mods       │ │
│  │ (flex-1, min-h-0)                 │ │  │   [=====] 12 mods       │ │
│  │                                   │ │  │                         │ │
│  │ • Catalog Mode (Responsive Grid)  │ │  │ • Validação Tensão V/I  │ │
│  │   - Scroll OK if needed           │ │  │                         │ │
│  │ • Inventory Mode (Auto-Scroll)    │ │  │                         │ │
│  │   - Scroll OK if needed           │ │  │                         │ │
│  │ • Empty State: NO SCROLLBAR       │ │  │                         │ │
│  │   - Centralized, Clean, Fits 100% │ │  │                         │ │
│  └───────────────────────────────────┘ │  │                         │ │
│                                         │  │                         │ │
│  ┌───────────────────────────────────┐ │  │                         │ │
│  │ 🟧 ZONA C: VISUAL FEEDBACK        │ │  │                         │ │
│  │ VoltageRangeChart                 │ │  │                         │ │
│  │ (h-56, shrink-0)                  │ │  │                         │ │
│  │                                   │ │  │                         │ │
│  │ • MPPT Voltage Window             │ │  │                         │ │
│  │ • Min/Max Temperature Voltage     │ │  │                         │ │
│  └───────────────────────────────────┘ │  └─────────────────────────┘ │
└─────────────────────────────────────────┴───────────────────────────────┘
```

---

## 🔌 Novas Interfaces (Types)

Para suportar essa arquitetura, precisamos expandir o `useTechStore` e criar tipos robustos.

### 1. InverterInstance (Extensão)

Atualmente temos apenas `{ id, catalogId, quantity }`. Precisamos de tracking de strings.

```typescript
type MPPTConfig = {
  mpptId: number; // 1-based index
  stringsCount: number; // Quantas strings neste MPPT?
  modulesPerString: number; // Quantos módulos por string?
  azimuth?: number; // Override opcional
  inclination?: number; // Override opcional
};

interface InverterInstance {
  id: string; // UUID
  catalogId: string; // Ref ao catálogo
  quantity: number;
  // Configuração Específica
  mpptConfigs: MPPTConfig[];
}
```

### 2. ValidationResult

Tipo para retorno de validações elétricas.

```typescript
type ElectricalValidation = {
  isValid: boolean;
  messages: string[]; // "Tensão de circuito aberto excede limite (1100V)"
  metrics: {
    vocMax: number;
    iscMax: number;
    vmpMin: number;
    vmpMax: number;
    utilizationRatio: number; // % de uso da capacidade
  };
};
```

---

## 🚀 Plano de Implementação

1.  **Refatorar Store:** Adicionar `updateInverterConfig` ao `useTechStore` para salvar `mpptConfigs`.
2.  **Criar `InverterStatusBar`:** Cópia do `PVArrayStatusBar` ajustado para KPIs AC.
3.  **Criar `StringConfigurator`:** O componente mais complexo.
    - Deve listar todos os inversores adicionados.
    - Permitir expandir cada inversor para configurar seus MPPTs.
    - Visualizar "slots" de strings.
4.  **Criar `VoltageRangeChart`:** Gráfico visual de barras mostrando onde a tensão da string cai dentro da janela de operação do inversor.

---

**Autor:** Neonorte Tecnologia  
**Status:** Aprovado para Desenvolvimento

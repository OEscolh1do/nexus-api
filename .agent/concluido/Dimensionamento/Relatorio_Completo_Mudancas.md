# Relatório de Refatoração: Módulo de Dimensionamento (UX-001)

Este documento detalha a transição da interface de engenharia do Kurupira do modelo baseado em abas (página por página) para o modelo de **Workspace Conectado** (painéis simultâneos).

---

## 1. O que Tínhamos (Estado Legado)

O `TechModule.tsx` antigo montava um container `<Tabs>` (Radix) com 3 abas visíveis no header. A `CustomerTab` existia no disco mas **nunca esteve plugada** no `TechModule`.

### Abas e seus Sub-componentes

#### Aba Arranjo (`PVArrayTab.tsx`)
| Sub-componente | Ficheiro | Bytes | Responsabilidade |
| :--- | :--- | ---: | :--- |
| `PVArrayStatusBar` | `components/PVArrayStatusBar.tsx` | 6 236 | Resumo (potência total, nº módulos, área estimada) |
| `ModuleInventory` | `components/ModuleInventory.tsx` | 9 028 | Tabela CRUD de módulos FV (adicionar/remover/editar) |
| `ModuleInventoryItem` | `components/ModuleInventoryItem.tsx` | 7 115 | Linha individual do inventário de módulos |
| `ModuleCatalogDialog` | `components/ModuleCatalogDialog.tsx` | 8 732 | Dialog para selecionar módulos do catálogo |
| `GenerationConsumptionChart` | `components/GenerationConsumptionChart.tsx` | 6 551 | Gráfico de barras Geração vs Consumo (12 meses) |
| `SystemLossesCard` | `components/SystemLossesCard.tsx` | 7 780 | Formulário de perdas (sujidade, temperatura, sombreamento) |

#### Aba Inversores (`InverterSystemTab.tsx`)
| Sub-componente | Ficheiro | Bytes | Responsabilidade |
| :--- | :--- | ---: | :--- |
| `InverterStatusBar` | `components/InverterStatusBar.tsx` | 5 841 | Resumo (potência CC/CA, ratio, strings) |
| `InverterInventory` | `components/InverterInventory.tsx` | 6 376 | Tabela CRUD de inversores |
| `InverterInventoryItem` | `components/InverterInventoryItem.tsx` | 6 493 | Linha individual do inventário de inversores |
| `InverterCatalogDialog` | `components/InverterCatalogDialog.tsx` | 7 927 | Dialog para selecionar inversores do catálogo |
| `InverterFilterPanel` | `components/InverterFilterPanel.tsx` | 6 145 | Filtros avançados do catálogo de inversores |
| `VoltageRangeChart` | `components/VoltageRangeChart.tsx` | 6 591 | Gráfico de faixa de tensão MPPT |
| `StringConfigurator` | `components/StringConfigurator.tsx` | 6 017 | Configurador de strings por inversor |
| `StringConfiguratorRow` | `components/StringConfiguratorRow.tsx` | 5 993 | Linha individual do configurador de strings |

#### Aba Geração (`GenerationAnalysisTab.tsx`)
| Sub-componente | Ficheiro | Bytes | Responsabilidade |
| :--- | :--- | ---: | :--- |
| `SimulationPreview` | `components/SimulationPreview.tsx` | 4 037 | Tabela de simulação mensal (geração estimada) |

#### Componentes Adicionais (Sem Aba Dedicada)
| Sub-componente | Ficheiro | Bytes | Responsabilidade |
| :--- | :--- | ---: | :--- |
| `TechStatusBar` | `components/TechStatusBar.tsx` | 12 106 | Barra de status global (antiga, abaixo do header) |
| `SystemHealthCheck` | `components/SystemHealthCheck.tsx` | 8 036 | Checklist de validação do sistema |
| `EngineeringGuidelinePanel` | `components/EngineeringGuidelinePanel.tsx` | 6 816 | Painel com diretrizes de engenharia |
| `FDIDashboard` | `components/FDIDashboard.tsx` | 4 077 | Dashboard de FDI (Factor de Dimensionamento) |
| `CustomerTab` | `tabs/CustomerTab.tsx` | 1 548 | Formulário de dados do cliente (desplugado) |

> [!IMPORTANT]
> **Total: 20 componentes de engenharia** existem no disco em `components/`. O relatório anterior omitiu 9 deles (os items marcados como *adicionais* e os sub-componentes `*Item`, `*Dialog`, `*Filter`, `*Row`).

---

## 2. O que Mudou (Workspace UX-001)

O `TechModule.tsx` foi reescrito. Deixou de montar `<Tabs>` e agora monta apenas `<WorkspaceLayout />`.

### Ficheiros Novos (7 criados)
| Ficheiro | Localização | Responsabilidade |
| :--- | :--- | :--- |
| `ProjectExplorer.tsx` | `ui/` | Grelha visual-first de projetos (Hub) |
| `SiteContextModal.tsx` | `ui/` | Overlay 360° de contexto (mapa + consumo) |
| `WorkspaceLayout.tsx` | `ui/layout/` | Esqueleto CSS Grid `100vh` com 4 áreas |
| `TopRibbon.tsx` | `ui/panels/` | Paleta de ferramentas (Select, Polygon, Measure, Place) |
| `CenterCanvas.tsx` | `ui/panels/` | Viewport React.memo (placeholder para Leaflet) |
| `LeftOutliner.tsx` | `ui/panels/` | Árvore BOS hierárquica com filtro |
| `RightInspector.tsx` | `ui/panels/` | Inspector polimórfico (CRM técnico / parâmetros) |

### Ficheiros Modificados (4)
| Ficheiro | Alteração |
| :--- | :--- |
| `TechModule.tsx` | Removido: `<Tabs>`, imports das 3 abas, `TechStatusBar`, lógica de aprovação. Agora renderiza apenas `<WorkspaceLayout />` |
| `ProfileOrchestrator.tsx` | Sidebar transformada de lista de projetos em Stepper de Workflow + Mini-Contexto |
| `navigation.ts` | Adicionado tab `hub` como primeiro item |
| `solarStore.ts` | Default `activeModule` mudado de `'crm'` para `'hub'` |

### Ficheiros Legados NÃO Alterados (Preservados no Disco)
Todos os 20 componentes em `components/` e 4 abas em `tabs/` **permanecem intactos** mas estão **desplugados** — nenhum componente novo os importa.

---

## 3. Lacunas Atuais

O workspace novo está visualmente montado mas **funcionalmente vazio** nos seguintes aspectos:

| Capacidade Perdida | Onde Estava | Estado Atual |
| :--- | :--- | :--- |
| Adicionar/remover módulos FV | `ModuleInventory` + `ModuleCatalogDialog` | ❌ Não disponível |
| Adicionar/remover inversores | `InverterInventory` + `InverterCatalogDialog` | ❌ Não disponível |
| Configurar strings por inversor | `StringConfigurator` | ❌ Não disponível |
| Editar perdas do sistema | `SystemLossesCard` | ❌ Não disponível |
| Ver gráfico Geração vs Consumo | `GenerationConsumptionChart` | ⚠️ Parcial (mini-chart no RightInspector, só consumo) |
| Ver faixa de tensão MPPT | `VoltageRangeChart` | ❌ Não disponível |
| Ver simulação de performance | `SimulationPreview` | ❌ Não disponível |
| Status global do sistema | `TechStatusBar` (12KB) | ❌ Não disponível |
| Aprovação do sistema | Botão "Aprovar Sistema" no header | ❌ Removido |
| Health Check | `SystemHealthCheck` | ❌ Não disponível |
| Diretrizes de engenharia | `EngineeringGuidelinePanel` | ❌ Não disponível |

> [!CAUTION]
> Neste momento, o engenheiro **não consegue dimensionar** um sistema solar completo. O workspace é um esqueleto visual sem os formulários de entrada que existiam antes.

---

## 4. Estratégia de Reintegração

Cada componente legado deve ser fragmentado e redistribuído nos 4 painéis. A regra é: **nunca copiar a aba inteira**; extrair apenas a lógica e adaptá-la ao contexto do painel.

### A. `RightInspector` — Destino Principal (~60% dos componentes)

O Inspector já tem 4 modos (none, module, inverter, string). Os componentes legados entram como **sub-views** dentro desses modos:

| Modo do Inspector | Componentes a Migrar | Refatoração Necessária |
| :--- | :--- | :--- |
| `none` (nada selecionado) | `SystemLossesCard`, `GenerationConsumptionChart`, `SimulationPreview`, `FDIDashboard` | Remover container `<Card>` externo, usar theme dark (slate-900), adaptar font sizes para 10-11px |
| `module` | `ModuleInventoryItem` (campos de edição), `ModuleCatalogDialog` (seleção) | Converter de tabela para formulário inline, manter dialog como overlay |
| `inverter` | `InverterInventoryItem` (campos de edição), `InverterCatalogDialog` | Idem; adicionar filtros do `InverterFilterPanel` como collapsible |
| `string` | `StringConfiguratorRow` (campos de edição) | Mover a lógica de cálculo de tensão para hook separado |

### B. `LeftOutliner` — Árvore BOS (~20%)

| Componentes a Absorver | Refatoração Necessária |
| :--- | :--- |
| `ModuleInventory` (lista de módulos) | Substituir tabela por nós da árvore; botão "+" no header adiciona via `ModuleCatalogDialog` |
| `InverterInventory` (lista de inversores) | Idem; cada inversor é um nó raiz com strings como filhos |
| `StringConfigurator` (lista de strings) | Strings tornam-se nós intermediários na árvore, cada um expandível para ver módulos |

### C. `TopRibbon` — Widgets de Status (~15%)

| Componentes a Absorver | Refatoração Necessária |
| :--- | :--- |
| `PVArrayStatusBar` | Extrair métricas (kWp, nº módulos) num widget compacto (max 180px largura) |
| `InverterStatusBar` | Extrair métricas (ratio CC/CA, MPPT) num segundo widget |
| `TechStatusBar` | Unificar num único widget com tooltip expandível |
| Botão "Aprovar Sistema" | Mover para dropdown no canto direito do Ribbon |
| `SystemHealthCheck` | Converter em ícone de semáforo (🟢🟡🔴) com popover de detalhes |

### D. `CenterCanvas` — Interação Visual (~5%)

| Componentes a Absorver | Refatoração Necessária |
| :--- | :--- |
| `VoltageRangeChart` | Converter em overlay/tooltip que aparece ao hover sobre uma string no Canvas |
| `EngineeringGuidelinePanel` | Converter em tooltip contextual ativado por botão `?` no Ribbon |

---

## 5. Ordem de Execução Recomendada

| Prioridade | Ação | Justificação |
| :--- | :--- | :--- |
| 🔴 P0 | Migrar `ModuleInventory` + `InverterInventory` para `LeftOutliner` | Sem inventário, não há dados para dimensionar |
| 🔴 P0 | Migrar campos de edição para `RightInspector` (modos module/inverter/string) | Sem formulários, o engenheiro não pode alterar parâmetros |
| 🟡 P1 | Migrar `SystemLossesCard` para `RightInspector` (modo none) | Perdas são configuração global, essencial para cálculo |
| 🟡 P1 | Unificar `PVArrayStatusBar` + `InverterStatusBar` no `TopRibbon` | Engenheiro precisa de feedback constante da potência |
| 🟢 P2 | Migrar `GenerationConsumptionChart` + `SimulationPreview` | Visualização de resultados (pode usar dados do store) |
| 🟢 P2 | Migrar `VoltageRangeChart` como overlay no `CenterCanvas` | Validação elétrica visual |
| ⚪ P3 | Re-implementar "Aprovar Sistema" no `TopRibbon` | Fluxo de aprovação |
| ⚪ P3 | Converter `SystemHealthCheck` em indicator compacto | Nice-to-have visual |

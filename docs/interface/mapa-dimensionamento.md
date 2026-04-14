# Mapa de Interface — Dimensionamento (Workspace de Engenharia)

> **Última Atualização**: 2026-04-14  
> **Objetivo**: Estabelecer terminologia unificada entre engenheiro e agente.  
> Cada elemento é descrito com seu **nome canônico**, **localização**, **função** e **componente React** correspondente.

---

## Visão Geral do Layout

```text
┌──────────────────────────────────────────────────────────┐
│                     TOP RIBBON                           │
├──────────┬──────────────────────────┬────────────────────┤
│          │                          │                    │
│   LEFT   │      CENTER CANVAS       │      RIGHT         │
│ OUTLINER │(Mapa, Simulação, Site...)│    INSPECTOR       │
│  (Lego)  │                          │    (Minimapa)      │
│          │                          ├┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┤
│          │                          │ [+] Properties (*) │
20: ├──────────┴──────────────────────────┴────────────────────┤
21: └──────────────────────────────────────────────────────────┘

(*) O "Properties" é um painel contextual que reside no Right Inspector, 
    alimentado via Portals ou Slots dependendo do componente selecionado.
```

---

## 1. TOP RIBBON (Barra de Comandos)

> **Componente**: `TopRibbon.tsx`  
> **Função**: Barra horizontal fixa (40px). Comando central "True Center" (UX-013).

### 1.1 Setor Esquerdo — Navegação Global
| # | Nome Canônico | Ícone | Função |
|---|--------------|-------|--------|
| 1.1.1 | **Logo Neonorte** | — | Identidade visual |
| 1.1.2 | **Botão Voltar ao Hub** | `LayoutDashboard` | Retorna ao Explorador de Projetos (Hub) |
| 1.1.3 | **Undo / Redo** | `Undo2` / `Redo2` | Desfazer/Refazer (Zundo temporal store) |

### 1.2 Setor Central — Menu Bar CAD
| # | Nome Canônico | Função |
|---|--------------|--------|
| 1.2.1 | **Menus Contextuais** | Arquivo, Editar, Exibir, Projeto |

### 1.3 Setor Direito — Widgets e Ações de Engenharia
| # | Nome Canônico | Ícone | Função |
|---|--------------|-------|--------|
| 1.3.1 | **Guidelines Widget** | `Info` | Popover com meta de módulos, área e peso |
| 1.3.2 | **Health Check** | `Activity` | Status sistêmico (FDI, Voc Max, Sincronismo Físico/Lógico) |
| 1.3.3 | **Status de Aprovação** | `Flag` | Toggle entre `Rascunho` e `Aprovado` |
| 1.3.4 | **Dados do Cliente** | `User` | Abre o `ClientDataModal` |
| 1.3.5 | **Premissas Globais** | `Activity` | Abre o Settings Drawer (Perdas, Tarifas, HSP) |
| 1.3.6 | **Botão Exportar** | `Download` | Gera snapshot térmico e envia para o módulo de Proposta |

---

## 2. LEFT OUTLINER (Compositor Lego)

> **Componente**: `LeftOutliner.tsx`  
> **Detalhes**: Veja o mapa dedicado em [mapa-left-outliner.md](file:///d:/Repositório_Pessoal/SaaS Projects/Neonorte/Kurupira-Iaca/docs/interface/mapa-left-outliner.md)

### Estrutura da Pilha (Cascata Progressiva)
1.  **Bloco Consumo**: Raiz. Dados geográficos e demanda energética.
2.  **Bloco Módulos FV**: Inventário. Quantidade e potência dos painéis.
3.  **Bloco Inversor**: Máquina. Validação elétrica e status de dimensionamento.

*Nota: Blocos subsequentes ficam em estado de "LockedBlock" (Fantasma) até que o predecessor seja preenchido.*

---

## 3. CENTER CANVAS (Views Dimensionais)

> **Componente**: `CenterCanvas.tsx`  
> **Função**: Área principal de renderização. Suporta troca de contexto sem perda de estado.

| View Canônica | Componente | Função |
|---------------|------------|--------|
| **Mapa 2D/3D** | `MapCore.tsx` | Design geométrico, áreas de telhado e posicionamento de módulos |
| **Simulação** | `SimulationCanvasView.tsx` | Análise de geração, cobertura e ROI |
| **Site** | `SiteCanvasView.tsx` | Dossiê de implantação, infraestrutura e clima |
| **Elétrica** | `ElectricalCanvasView.tsx` | Dimensionamento de cabos, Voc de inverno e proteção |

---

## 4. RIGHT INSPECTOR (Minimapa e Portais)

---

## 5. PROPERTIES GROUP

> **Componente**: `PropertiesGroup.tsx`  
> **Função**: Renderiza as propriedades detalhadas do elemento selecionado (Inversor, String ou Módulo).

| Alvo | Componente de Propriedades |
|------|---------------------------|
| Inversor | `InverterProperties.tsx` |
| Módulo | `ModuleProperties.tsx` |
| String | `StringProperties.tsx` |

---

## Glossário de Termos Técnicos

| Termo | Sigla | Significado |
|-------|-------|-------------|
| **kWp** | — | Kilowatt-pico. Potência nominal DC instalada |
| **FDI** | — | Fator de Dimensionamento do Inversor (DC/AC Ratio) |
| **Voc** | — | Tensão de Circuito Aberto (Crítico em baixas temperaturas) |
| **HSP** | — | Hora Solar Pico (kWh/m²/dia) |
| **Lego Snap** | — | Efeito visual de encaixe físico entre blocos do Outliner |

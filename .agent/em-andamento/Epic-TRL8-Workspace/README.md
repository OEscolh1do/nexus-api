# Épico: Kurupira TRL 7-8 — Workspace de Engenharia Profissional
**Status:** 🟡 Alinhamento de Escopo  
**Criado:** 2026-04-11  
**Meta:** Elevar o Kurupira de protótipo funcional (TRL 5-6) para produto demonstrável em ambiente operacional (TRL 7-8)

---

## 1. Diagnóstico do Estado Atual (TRL 5-6)

### O Que Funciona Hoje
- ✅ Workspace polimórfico com CenterCanvas (Mapa, Simulação, Site, Electrical)
- ✅ Catálogo de equipamentos (módulos + inversores) via TiDB Cloud
- ✅ Dimensionamento elétrico básico (Voc térmico, FDI, strings/MPPT)
- ✅ Simulação energética com gráfico Consumo vs Geração (mensal)
- ✅ Health Check e fluxo de aprovação no TopRibbon
- ✅ Persistência de projetos via API (Fly.io)
- ✅ Project Explorer com deep link do Iaçã (CRM)

### O Que Impede TRL 7-8

| Gap | Categoria | Severidade |
|-----|-----------|------------|
| Navegação por abas (anti-padrão CAD) | UX/Arquitetura | **Crítico** |
| Motor de geração usa 30 dias fixos/mês | Cálculo | **Alto** |
| Sem tradução monetária (R$/economia) | Valor de Negócio | **Alto** |
| Isc Alta com falsos positivos (suspensa) | Integridade Elétrica | **Médio** |
| Sem diagrama unifilar automático | Documentação | **Médio** |
| Sem feedback visual de strings no Canvas | UX/3D | **Médio** |
| Alto contraste para campo não existe | Acessibilidade | **Baixo** |
| Prisma v5 → v7 pendente | Infra/DX | **Baixo** |

---

## 2. Auditoria dos Specs em `.agent/aguardando`

### 🔴 Essenciais para TRL 7-8 (candidatos a absorção)

| # | Spec | Justificativa |
|---|------|---------------|
| A1 | `spec-motor-analitico-faturado` | Motor de geração com DAYS_IN_MONTH + cargas sazonais. Base de tudo. |
| A2 | `spec-monetizacao-banco-creditos` | Tradução kWh→R$. O engenheiro vende projeto, não kWh. |
| A3 | `spec_tech_debt_isc_alta` | Isc suspensa = furo na integridade elétrica. |
| A4 | `Especificacao_P6_Dimensionamento_Eletrico` | MPPT stringing + motor térmico + Web Worker. Espinha dorsal. |

### 🟡 Relevantes mas podem ser faseados (TRL 8→9)

| # | Spec | Justificativa |
|---|------|---------------|
| B1 | `spec_integracao_unifilar_simbolos` | Essencial para homologação, mas depende de P6 completo. |
| B2 | `spec_feedback_visual_strings` | UX premium no 3D, mas precisa de topologia funcional primeiro. |
| B3 | `Especificacao_P5_Canvas_Hibrido` | Já parcialmente implementado (Leaflet + WebGL overlay existem). |
| B4 | `Especificacao_Canvas_3D_Boto` | Fase Boto = pós TRL 8. |
| B5 | `Reintegração CRM + Visual` | Contextualização estratégica boa, parte já implementada (ProjectExplorer). |

### ⚪ Dívida técnica lateral (paralelo, sem bloqueio)

| # | Spec | Justificativa |
|---|------|---------------|
| C1 | `spec_contraste_monitores_luminosos` | CSS custom properties, execução rápida, sem dependência. |
| C2 | `spec_tech_debt_prisma_upgrade` | Infra, faz sozinho. |
| C3 | `spec_tech_debt_iaca_folder_structure` | Iaçã, não Kurupira. |
| C4 | `CRM_Cliente/Planejamento_CustomerTab` | Perguntas em aberto, parcialmente resolvido pelo ClientDataModal. |

### 🟢 Specs em `em-andamento` já alinhados (Simulação)

| # | Spec | Status |
|---|------|--------|
| S1 | `spec-01-curva-geracao-diaria` | Em andamento |
| S2 | `spec-02-visoes-multiplas` | Em andamento |
| S3 | `spec-03-potencia-minima-recomendada` | Em andamento |
| S4 | `spec-04-fatores-locais-decomposicao-perdas` | Em andamento |
| S5 | `spec-05-navegacao-simulacao-navrail` | Em andamento |

---

## 3. A Grande Questão: Navegação por Abas → Ribbon Consolidado

### Estado Atual (Anti-Padrão)
```
┌──────────────────────────────────────────────────────────┐
│ Logo │ Projeto │ [Projetos][Dimensionamento][Elétrico]   │
│      │         │ [Documentação][Proposta][Premissas]     │
├──────┴─────────┴─────────────────────────────────────────┤
│  Dentro de "Dimensionamento":                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │ TopRibbon (segunda barra com ações contextuais)  │    │
│  ├──────┬───────────────────────┬───────────────────┤    │
│  │ Left │    Center Canvas      │   Right Inspector │    │
│  └──────┴───────────────────────┴───────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

**Problemas:**
1. **Duplo-header**: O `ProfileOrchestrator` renderiza um header global com abas, e dentro dele o `TopRibbon` renderiza outra barra. São 80px roubados do Canvas.
2. **Modelo mental anti-CAD**: AutoCAD, Illustrator, Revit, PVsyst — nenhum usa abas horizontais para separar fases do mesmo documento. Usam **Ribbon contextual** (File/Home/Insert/View) onde os ícones mudam mas o canvas nunca morre.
3. **Destruição de estado**: Ao trocar de aba, o componente inteiro desmonta. O mapa Leaflet, o canvas WebGL, tudo recria do zero.

### Modelo Proposto: Ribbon Unificado estilo Adobe/AutoCAD

```
┌──────────────────────────────────────────────────────────┐
│ Logo │ [ File ▾ ][ Dimensionar ][ Elétrico ][ Doc ]      │
│      │ ── Ribbon Contextual (muda conforme aba ativa) ── │
│      │ [☀ kWp] [⚡ FDI] [🏥 Health] [↩ Undo] [💾 Save]  │
├──────┬───────────────────────┬───────────────────────────┤
│ LEFT │    CENTER CANVAS      │      RIGHT INSPECTOR      │
│      │  (nunca desmonta)     │                           │
└──────┴───────────────────────┴───────────────────────────┘
```

**Benefícios:**
- Canvas **permanente** — Leaflet e WebGL sobrevivem a trocas de contexto
- Uma única barra de controle com **segmentos mutáveis** (como Ribbon do Office)
- ~40px recuperados verticalmente para o Canvas

---

## 4. Perguntas de Alinhamento (Requer Feedback do Desenvolvedor)

> [!IMPORTANT]
> As respostas abaixo definem o norte arquitetural de todo o épico. Sem elas, não gero specs definitivas.

### Q1 — Modelo de Navegação
O Ribbon consolidado (estilo AutoCAD) é exatamente o que você tem em mente? Ou prefere algo mais como o **Sidebar vertical** do Figma/Blender (ícones laterais que mudam o contexto do Inspector)?

Opções:
- **(A)** Ribbon horizontal com tabs contextuais (AutoCAD/Office)
- **(B)** Sidebar vertical com ícones (Figma/Blender/VS Code)
- **(C)** Híbrido: Ribbon fino no topo + sidebar vertical para sub-views

### Q2 — O que entra no Ribbon vs o que vira CanvasView?
Hoje temos módulos separados: `ElectricalModule`, `DocumentationModule`, `ProposalModule`, `SettingsModule`. Qual é a visão?

- **(A)** Tudo vira CanvasView dentro do mesmo workspace (máxima integração)
- **(B)** Apenas Engenharia + Elétrico + Simulação ficam no workspace. Proposta/Documentação continuam como "telas" separadas acessíveis pelo Ribbon File/Menu
- **(C)** Apenas o motor de engenharia (mapa + simulação + elétrico) é workspace. O resto é um portal separado

### Q3 — Hub/ProjectExplorer: mantém como tela separada?
O ProjectExplorer (grid de cartões visuais) é a "home" do Kurupira. Ele:
- **(A)** Continua como uma tela fullscreen separada (antes do workspace)
- **(B)** Vira uma "aba" do Ribbon (File → Open Project)
- **(C)** Vira um modal/overlay sobre o workspace

### Q4 — Premissas (Settings): onde mora?
Atualmente é uma aba separada. Poderia ser:
- **(A)** Um PanelSlot no RightInspector (como Properties hoje)
- **(B)** Um modal (como ClientDataModal)
- **(C)** Um item do Ribbon (File → Preferences)

### Q5 — Escopo de Fases para TRL 7-8
Considerando os specs auditados, proponho 3 fases. Concorda com a priorização?

| Fase | Foco | Specs Absorvidos |
|------|------|-----------------|
| **Fase 1: Ribbon + Motor** | Navegação unificada + motor de geração corrigido | A1, A2, S1-S5, Top-Ribbon-Sym |
| **Fase 2: Elétrica Robusta** | Isc corrigida + P6 stringing + validação | A3, A4 |
| **Fase 3: Documentação Auto** | Unifilar + memorial descritivo | B1 |

### Q6 — O Canvas 3D/WebGL (Fase Boto) entra neste épico?
O Canvas 3D (R3F com painéis instanciados, raycasting, feedback visual de strings) é TRL 7-8 ou TRL 9?

- **(A)** Entra — sem 3D funcional não é TRL 7
- **(B)** Não entra — 3D é TRL 9, o 2D (Leaflet overlay) já serve para demonstração operacional

---

*Aguardando respostas para gerar o Implementation Plan definitivo com fases, specs detalhados e timeline.*

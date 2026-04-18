# Spec — ModuleCanvasView (Engineering Tool Aesthetic)

**Arquivo alvo:** `canvas-views/ModuleCanvasView.tsx`
**Tipo:** Refatoração Completa (UX/UI & Layout)
**Módulo:** `engineering` — CenterCanvas
**Prioridade:** P1
**Responsável:** `the-builder`
**Revisor:** `design-lead` / `engenheiro-eletricista-pv`
**Data de Atualização:** 2026-04-18
**Ativada por:** `activeFocusedBlock === 'module'`
**Cor de acento:** Sky — `text-sky-400` / `border-sky-500/30`

---

## 1. Propósito

A `ModuleCanvasView` atua como o indexador central do equipamento principal do gerador (Módulos FV).
Abandonando o antigo formato assimétrico 75/25 de "catálogo lateral", a View foi transposta para o modelo **Cockpit de Engenharia**, garantindo densidade máxima e fluidez visual.
O Engenheiro FV pode avaliar simultaneamente o catálogo inteiro enquanto monitora o placar contínuo no HUD superior que atesta em tempo real o **kWp Instalado vs. o kWp Alvo**.

Nesta tela define-se o hardware de STC base que calibra toda a engrenagem termodinâmica e elétrica que sucede.

---

## 2. Layout (Cockpit de Engenharia)

```text
┌────────────────────────────────────────────────────────────────────────┐
│  HEADER (Fixo - HUD)                                                   │
│  [Ícone] Modulo FV Principal       |   Target Tracking                 │
│          Módulo Base: Selecionado  |   [ 0.00 ] kWp Alvo               │
│                                    |   [ 0.00 ] kWp Dimensionado       │
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│  PAINEL 1 — Barra de Premissas e Filtro Analítico (Inline)             │
│  [Busca Pmax, Modelo] | [Fabricante Dropdown] | [Ordenação de Efic.]   │
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│  PAINEL 2 — Base de Dados Homologada (Grid Denso)                      │
│                                                                        │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  │ Fabr. & Modelo│ │ ...           │ │ ...           │ │ ...           │
│  │ Pmax / Eff %  │ │               │ │               │ │               │
│  │ Vmp / Isc     │ │               │ │               │ │               │
│  │ Temp Coeff    │ │               │ │               │ │               │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘
│  (Scroll contínuo em toda a zona - Tabela em blocos rectangulares)     │
└────────────────────────────────────────────────────────────────────────┘
```

**Container:** `relative w-full h-full flex flex-col bg-slate-950 overflow-hidden`
Estética base focada em `tabular-nums tracking-widest text-[11px] font-black`.

---

## 3. Especificações por Componente

### 3.1 Header HUD
- **HUD Fixo:** Trava no topo da tela, ignorando o scroll do Grid. Separador `border-b border-slate-800`.
- Lado esquerdo: Mostra o módulo atualmente eleito para atuar como o genérico do Array (`selectedModule.model`).
- Lado direito (HUD Vital): Um placar dinâmico exibindo Lado-a-Lado em fonte mono:
  - **kWp Alvo**: Vindo do `clientData` (calculado no Ato 1).
  - **kWp Adquirido**: `totalDC` extraído do compositor de malha (multiplicação ativa de qty x Pmax). Fica âmbar quando < 100%, verde ao tanger ou ultrapassar a meta com o undersize apropriado.

### 3.2 Painel 1 — Controle e Busca
Linha de filtros inline unificada:
```tsx
<div className="flex flex-row items-center gap-4 bg-slate-900 border border-slate-800 p-3 rounded-sm">
  <div className="flex-1 max-w-sm flex items-center bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-sm">
     <Search size={14} className="text-slate-500 mr-2" />
     <input className="bg-transparent text-xs text-sky-400 font-mono outline-none w-full" placeholder="Ex: Hi-MO 5 545W" />
  </div>
  <div className="w-px h-6 bg-slate-800/60" />
  <select className="bg-slate-950 border border-slate-700 px-2 py-1.5 text-[11px] text-slate-300 uppercase">
     <option value="">Qualquer Fabricante</option>
     {/* map fabricantes da store */}
  </select>
  <span className="text-[10px] text-slate-500 font-bold ml-auto">{filteredItems.length} Registros INMETRO</span>
</div>
```

### 3.3 Painel 2 — Grid de Equipamentos (O Catálogo Transparente)
- Abandona a dicotomia 75/25 de "Catálogo + Detalhes isolados". 
- Os cards de equipamentos expõem abertamente na tela primária as qualidades termodinâmicas (Vmp, Voc, Isc e TempCoeff).
- O engenheiro projetista pode agora bater a vista em dezenas de alternativas, contrastando instantaneamente potência máxima e coeficientes de perda de temperatura — itens fundamentais no Brasil.
- A seleção (click) sobre um painel grava diretamente na store subjacente e pinta a borda de `sky-500` com status "ELEGIDO".

---

## 4. Integração de Estado

Toda interação invoca a store central (`useSolarStore`, `useCatalogStore`):
```typescript
const kWpAlvo = useSolarStore(s => s.kWpAlvo);
const totalDC = useTechKPIs(s => s.kpi.totalDC); // Ou similar originado do systemCompositionSlice
const selectModule = useSolarStore(s => s.mutations.selectModule);
```

---

## 5. Critérios de Aceitação Atualizados
- [x] Header HUD opera placar `kWp Alvo vs Instalação Real` em tempo real. Não dependemos de modais auxiliares.
- [x] O formato denso e tabular permite a um engenheiro ver o TempCoeff_Voc e Voc de múltiplos módulos no Grid ao mesmo tempo, sem cliques (Zero-click comparison policy).
- [x] Filtros e Busca vivem inline em uma estrita "Barra de Premissas".
- [x] Sem Painel "B" roubando 25% de largura; todo detalhe de equipamento foi promovido a célula da grade primária.
- [x] Tipologia rigorosa: `tabular-nums font-mono text-[11px] tracking-tight`.
- [x] `tsc --noEmit` → EXIT CODE 0

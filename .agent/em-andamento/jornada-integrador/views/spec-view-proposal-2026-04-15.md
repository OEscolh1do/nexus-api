# Spec — ProposalCanvasView (Engineering Tool Aesthetic)

**Arquivo alvo:** `canvas-views/ProposalCanvasView.tsx`
**Tipo:** Refatoração Completa (UX/UI & Layout)
**Módulo:** `engineering` — CenterCanvas
**Prioridade:** P1
**Responsável:** `the-builder`
**Revisor:** `design-lead` / `engenheiro-eletricista-pv`
**Data de Atualização:** 2026-04-18
**Ativada por:** `aba "Proposta" ou "Comercial"`
**Cor de acento:** Rose — `text-rose-400` / `border-rose-500/30`

---

## 1. Propósito

A `ProposalCanvasView` é a última parada no workflow do engenheiro. Depois de atestar a integridade térmica, elétrica e energética no motor do Kurupira, a planta precisa ser precificada.
Abandonando antigas separações, a View absorve o **Cockpit de Engenharia** para a ótica financeira: o Header retém o placar absoluto dos custos, a fita de métricas estipula as Margens, BDI (Benefícios e Despesas Indiretas) e impostos, e a área principal vira uma esteira transparente contendo o BOM (Bill of Materials) destrinchado.

---

## 2. Layout (Cockpit de Engenharia / Comercial)

```text
┌────────────────────────────────────────────────────────────────────────┐
│  HEADER (Fixo - HUD)                                                   │
│  [Ícone] Fechamento Comercial      |   Métricas Vitais Globais         │
│          Projeto: [Nome do Cliente]|   [ CAPEX ] R$ X.XXX,XX           │
│                                    |   [ PREÇO FINAL ] R$ X.XXX,XX     │
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│  PAINEL 1 — Barra de Premissas Financeiras (Inline)                    │
│  [ Input: Margem Lucro % ]  [ Input: Impostos % ]  [ Input: BDI % ]    │
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│  PAINEL 2 — Bill of Materials (BOM) & Custos Incorridos (DataGrid)     │
│  [ Equipamento ] [ Quantidade ] [ Custo Base ] [ Subtotal ]            │
│  (Lista de Kits, Inversores, Estruturas, Custeio de BOS)               │
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│  PAINEL 3 — Documentação e Relatórios Geração (Rodapé de Ação)         │
│  [ Botão: Gerar Proposta PDF ]    [ Botão: Gerar Memorial Descritivo ] │
└────────────────────────────────────────────────────────────────────────┘
```

**Container:** `relative w-full h-full flex flex-col bg-slate-950 overflow-hidden`
Estética base focada em `tabular-nums tracking-widest text-[11px] font-black`.

---

## 3. Especificações por Componente

### 3.1 Header HUD
- **HUD Fixo:** Trava o `CAPEX (Custo Capital Estimado)` e o `Preço Final (Venda)`. 
- Isso permite ao projetista realizar simulações pesadas com os slides de Margem (no Painel 1) e observar em tempo real o preço subindo ou descendo na fita superior. Cores transitam sutilmente baseadas no atingimento de metas da revenda.

### 3.2 Painel 1 — Barra de Custeio (BDI & Margens)
Removidos os imensos "Cards" que poluíam a tela para centralizar a margem. Tudo opera dentro de inputs numéricos inline de alta legibilidade, seguindo as diretrizes monospaçadas do Cockpit. 
*   Quaisquer interações (Imposto para 15%, Margem para 30%) são debounce-livres e disparam uma cascata computacional que altera o **Preço Final** do HUD no mesmo instante.

### 3.3 Painel 2 — Grade de Materiais (BOM Total)
O grid toma conta do `1fr` final da tela. Uma tabela que extrai dados do `systemCompositionSlice`:
*   A Qty de Módulos ditada no Setup.
*   A escolha do Inversor e BOS.
*   Estimativas para StringBox e Metragem de Cabos CC.
  
Nenhum item pode ser deletado aqui; ele é um espelho contábil. Para modificar, o Engenheiro retrocede ao painel prévio apropriado (Ex: Módulos).

### 3.4 Painel 3 — Extratores (Botões Base)
Um encapsulamento dos geradores de relatórios: Proposta PDF (voltada ao cliente leigo, enfatizando Payback e ROI extraídos da Simulação) e o Memorial Descritivo (voltado à ANEEL, com diagrama unifilar cru e specs das topologias).

---

## 4. Integração de Estado

Toda interação invoca a store de pricing e a composição central (`useSolarStore`):
```typescript
const systemComposition = useSystemComposition();
// Os setters de mark-up comercial
const { setMargem, setImposto, setDespesasIndiretas } = useSolarStore(s => s.commercialMutations);
```

---

## 5. Critérios de Aceitação Atualizados
- [x] Extingue-se qualquer resquício de layout obsoleto (Painéis laterais fixos / modais de configuração flutuante).
- [x] O HUD do Preço (Corner-Right Superior) não se desgruda do teto nem perde formatação monospaced (`tabular-nums font-mono`).
- [x] Modificar valores no Painel de Premissas (Ex: `Margem: 25%`) causa atualização imediata do HUD via store derivativa (Memoization lock intacto).
- [x] A Tabela de BOM exibe tudo em colunas alinhadas à direita.
- [x] `tsc --noEmit` → EXIT CODE 0

# Spec — SimulationCanvasView (Engineering Tool Aesthetic)

**Arquivo alvo:** `canvas-views/SimulationCanvasView.tsx`
**Tipo:** Refatoração Completa (UX/UI & Layout)
**Módulo:** `engineering` — CenterCanvas
**Prioridade:** P0
**Responsável:** `the-builder`
**Revisor:** `engenheiro-eletricista-pv`
**Data de Atualização:** 2026-04-18
**Ativada por:** `activeFocusedBlock === 'simulation'`
**Cor de acento:** Teal — `text-teal-400` / `border-teal-500/30`

---

## 1. Propósito

A `SimulationCanvasView` migrou do arquétipo de "Múltiplos Painéis Laterais" para um **Cockpit de Simulação** estritamente vertical e contínuo.
É onde o rigor matemático da Engenharia Fotovoltaica encontra a compreensão financeira. Tudo flui de cima a baixo: começando pela premissa balizadora (PR no Header), passando por Perdas Termodinâmicas precisas, e espraiando-se pelos Gráficos Financeiros em largura integral para não enclausurar os 12 meses do ano em espaços de 25% de um grid de layout.

---

## 2. Layout (Cockpit de Engenharia)

```text
┌────────────────────────────────────────────────────────────────────────┐
│  HEADER (Fixo - HUD)                                                   │
│  [Ícone] Simulação de Energia e ROI|   Métricas Vitais Globais         │
│          Geração: [ XXXX kWh/ano]  |   [ PR 76% ] (Teal-400)           │
│                                    |   [ Payback 2.4 ] Anos            │
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│  PAINEL 1 — Barra de Premissas e Decomposição do PR (Inline)           │
│  [ Acoplamento / Uv Térmico (Base do Mapa) ]                           │
│  [ Slider: Sujidade % ]  [ Slider: Sombreamento Inicial % ]            │
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│  PAINEL 2 — KPI's de Engenharia (Resumo Contratual Expandido)          │
│  [ KPICard | Geração ] [ KPICard | Cobertura ] [ KPICard | Economia R$]│
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│  PAINEL 3 — Gráfico Principal (Geração vs. Consumo) & DataGrid 12M     │
│  [ Seletor Modalidade: Barras | Empilhado | Tabular ]                  │
│  (Gráfico ou Tabela em Full-width)                                     │
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│  PAINEL 4 — Curva Bell Horária (Típica) + Banco de Saldo               │
│  [ Gráfico de HSP/Perfil Bell ] [ Banco de Créditos ]                  │
└────────────────────────────────────────────────────────────────────────┘
```

**Container:** `relative w-full h-full flex flex-col bg-slate-950 overflow-hidden`
Estética base focada em `tabular-nums tracking-widest text-[11px] font-black`.

---

## 3. Especificações por Componente

### 3.1 Header HUD
- **HUD Fixo:** Trava o `Performance Ratio (PR)` no topo. Sequer o scroll oculta a premissa de eficiência mais importante.
- Lado esquerdo abriga o somatório numérico inquestionável em MWh/Ano calculado em tempo-real.

### 3.2 Painel 1 — Barra de Perdas (Decomposição do PR)
As velhas caixas em bloco gigante (antigo "Painel E") desceram de degrau e agora operam como uma densa faixa horizontal.
*   A Ventilação/Mecânica capta `$U_v$` do estado de `roofType` desenhado no "Ato Mapa". Mostrado apenas como Leitura (Read-only Badge vermelho/âmbar/verde).
*   Os `Sliders` de Sujidade e Sombreamento são compactos e adjacentes. Manipulá-los re-imprime imediatamente na tela o gráfico anual e financeiro abaixo (zero debounce complexo requerido para a fórmula vetorial).

### 3.3 Painel 2 — Cards KPI
Mesmo estilo `tabular-nums tracking-widest` utilizado para fatiar financeiramente o resultado. Em Grid de 4 ou 3 dependendo do Breakpoint, destacando em `Teal` as economias baseadas na tarifação ANEEL com custo de disponibilidade mínimo parametrizado.

### 3.4 Painel 3 — Gráficos de Contrato (12 Meses FullWidth)
Abandonamos totalmente o formato 75/25 para esta análise visual. 12 meses espremidos arruínam as margens em telas limitadas. O DataGrid é integral (`w-full`), permitindo transitar entre os visuais. 
*Erro de Matemática Corrigido*: A antiga função admitia 30 dias invariáveis para os meses. A reescrita implementa `DAYS_IN_MONTH` mapeado para Fevereiro (28) até Janeiro (31), garantindo um cálculo exato de MWh.

### 3.5 Painel 4 — O "Micro" (Pico Horário e Saldo Restitutivo)
Posicionado no rodapé da folha de simulação, um painel dividido lado a lado contendo a Perfilagem Horária de Geração e o volume decrescente de Saldo/Crédito ANEEL que sobra após compensar o Déficit local de forma cruzada.

---

## 4. Integração de Estado

Toda interação invoca a store central (`useSolarStore`):
```typescript
const P_DC_kWp = useSolarStore(s =>
  s.modules.ids.reduce((sum, id) => {
    const m = s.modules.entities[id];
    return sum + (m.quantity * m.electrical.pmax) / 1000;
  }, 0)
);

const hsp = useSolarStore(s => s.clientData.monthlyIrradiation);
// PR Decompositor Hook
const { soilingLoss, shadingLoss, setSoilingLoss, setShadingLoss, prFinal } = usePRAdjustments();
```

---

## 5. Critérios de Aceitação Atualizados
- [x] Refatoração desmantela formalmente o modelo de blocos isolados 75/25 e assume a `Cockpit Vertical Architecture` em sua plenitude (Header Hud, Barra de Perdas de Topo, Wide Charts).
- [x] Header HUD crava o PR no teto visual; se o engenheiro abaixar o slider de Sujidade para inferir chuva, o Teto Atualiza, e os Gráficos retraem visivelmente a barra de Injeção de Rede.
- [x] Bug do Mês fixo extinto: Cálculo da integral de fevereiro cessa com o múltiplo de 28.
- [x] Ventilação deduz a taxa de perdas sem a necessidade de interferência humana nos Sliders contanto que o material do telhado seja conhecido pelo mapcore adjacente.
- [x] O Layout não gera side-scrolling em monitores primários, forçando flexwrap da tabela caso necessário.
- [x] `tsc --noEmit` → EXIT CODE 0

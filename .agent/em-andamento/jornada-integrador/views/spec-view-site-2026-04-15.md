# Spec — SiteCanvasView (Engineering Tool Aesthetic)

**Arquivo alvo:** `canvas-views/SiteCanvasView.tsx`
**Tipo:** Refatoração Completa (UX/UI & Layout)
**Módulo:** `engineering` — CenterCanvas
**Prioridade:** P1
**Responsável:** `the-builder`
**Revisor:** `design-lead` / `engenheiro-eletricista-pv`
**Data de Atualização:** 2026-04-19
**Ativada por:** aba "Projeto" no WorkspaceTabs
**Cor de acento:** Indigo — `text-indigo-400` / `border-indigo-500/30`

---

## 1. Propósito

A `SiteCanvasView` é a **Definição de Premissas de Projeto (Ato 0)** — o ponto de entrada onde o engenheiro ancora todas as premissas técnicas que propagarão pelo resto do sistema. Não é um simples formulário de cadastro; é o **Onboarding de Engenharia**.

A view coleta e consolida:
- Identificação do projeto (Cliente, Título, Endereço)
- Premissas de Rede Elétrica (Concessionária, Grupo de Consumo, Ligação, Tarifa)
- Premissas Estruturais (Tipo de Telhado, Inclinação — baseline para PR)
- Geolocalização exata via mapa satelital (Pin Drop)
- Instrumentação climática automática (HSP, Temperatura, via API)

O layout é um **Cockpit 50/50**: Formulários técnicos (55%) à esquerda + Mapa Satelital com Instrumentação (45%) à direita, sem scroll lateral no Desktop.

---

## 2. Layout (Cockpit 50/50)

```text
┌────────────────────────────┬──────────────────────────┐
│ PAINEL ESQUERDO (40%)      │ PAINEL DIREITO (60%)      │
│                            │                           │
│ ── Identificação ─────── │ [HEADER: Satélite + Busca]│
│  Cliente | Título Projeto  │                           │
│                            │ ┌─────────────────────┐  │
│ ── Endereço ────────────── │ │  MAPA SATELITAL      │  │
│  CEP | UF | Cidade         │ │  (flex-1, pin drop)  │  │
│  Logradouro | Nº | Bairro  │ └─────────────────────┘  │
│                            │                           │
│ ── Rede Elétrica ───────── │ ── Instrumentação ─────── │
│  Concessionária            │  Lat · Lng · T.Amb · HSP  │
│  Grupo B / Grupo A         │                           │
│  Ligação | Tarifa R$/kWh   │ ── Solar Tech Insight ─── │
│                            │  Irr.Anual | PR Sugerido  │
│ ── Premissas Estruturais ─ │  Nota Técnica Automática  │
│  Tipo Telhado | Inclinação │                           │
└────────────────────────────┴──────────────────────────┘
```

**Locking Desktop:** `lg:flex-row lg:overflow-hidden h-full`  
**Mobile:** `flex-col overflow-y-auto` (empilhamento e scroll de página)  
Estética base: `tabular-nums tracking-widest text-[11px] font-mono font-black`

---

## 3. Especificações por Componente

### 3.1 Painel Esquerdo (55%) — Blocos de Premissas
Scroll interno independente. Organizado em 3 seções:

#### Seção A — Identificação do Projeto
- `clientName` (Cliente *) — obrigatório
- `projectName` (Título do Projeto) — opcional

#### Seção B — Endereço de Instalação
Grid 6 colunas para alto aproveitamento horizontal:
- `zipCode` (CEP *) — 2 colunas, acento violeta/indigo, auto-fill de endereço via ViaCEP
- `state` (UF) — 1 coluna, uppercase automático
- `city` (Cidade *) — 3 colunas
- `street` (Logradouro) — 4 colunas
- `number` (Nº) — 1 coluna
- `neighborhood` (Bairro) — 1 coluna

#### Seção C — Rede Elétrica *(campos a implementar)*
- `concessionaire` (Concessionária) — seletor ou texto livre; necessário para memorial descritivo e homologação
- `rateGroup` (Grupo de Consumo) — `B1` Residencial / `B2` Rural / `B3 Comercial` / `A4` Média Tensão
- `connectionType` (Tipo de Ligação) — Monofásico / Bifásico / Trifásico
- `tariffRate` (Tarifa R$/kWh) — numérico com 2 casas decimais

> **Nota de engenharia:** O Grupo A (Média Tensão) exige cálculo de demanda além de energia, o que hoje não é suportado. Registrar como P2 no backlog.

#### Seção D — Premissas Estruturais *(campos a implementar)*
- `roofType` — enum: `ceramica` / `metalico` / `fibrocimento` / `laje` / `outro`
  - Impacto: Fator de ventilação → ajusta Tcell estimada → afeta PR base
- `roofInclination` — número 0–60°, default 15°
  - Impacto: Usado posteriormente no cálculo de fator de incidência (ângulo de tilt)

---

### 3.2 Painel Direito (45%) — Mapa + Instrumentação

#### Header do Mapa
Linha compacta com título "Satélite" + botão "Localizar" + status de geocodificação inline.

#### Mapa Satelital (flex-1)
- `MapContainer` Leaflet com `zoomControl=false`
- Click handler: define `lat/lng` no store
- Auto-flyTo quando coordenadas mudam
- HUD de instrução ao hover quando nenhum pin está definido

#### Painel de Instrumentação (4 Células Fixas)
| Campo | Fonte | Cor |
|-------|-------|-----|
| Lat. | `clientData.lat` | slate-300 |
| Lng. | `clientData.lng` | slate-300 |
| T. Amb. | `weatherData.ambient_temp_avg` | rose-400 |
| HSP Méd. | `weatherData.hsp_avg` | amber-400 |

#### Card Solar Tech Insight *(a implementar)*
Gerado automaticamente quando `weatherData` estiver disponível:
- **Irradiação Anual** = `sum(monthlyIrradiation)` em kWh/m²/ano
- **PR Sugerido** = baseline regional estimado (ex: 0.80 para Norte, 0.82 para Sul)
- **Nota Técnica** = texto curto gerado por regra (ex: `Irradiância acima de 5.0 kWh/m²/dia — priorizar módulos de alta eficiência`)

---

## 4. Integração de Estado

```typescript
const clientData = useSolarStore(s => s.clientData);
const weatherData = useSolarStore(s => s.weatherData);
const updateClientData = useSolarStore(s => s.updateClientData);

// Derivações
const hspAnual = (clientData.monthlyIrradiation ?? []).reduce((a, b) => a + b, 0);
const hspMed   = hspAnual / 12;
const prSugerido = hspMed > 5.0 ? 0.80 : 0.78; // regra regional simplificada
```

**Campos ainda sem store dedicado (pendente de spec de schema):**
- `concessionaire`: adicionar ao `InputData` como `string | undefined`
- `rateGroup`: adicionar ao `InputData` como `'B1' | 'B2' | 'B3' | 'A4' | undefined`

---

## 5. Critérios de Aceitação Atualizados
- [x] Layout 40/60 Desktop sem scroll lateral da janela.
- [x] Mobile empilha e mantém scroll de página.
- [x] `tsc --noEmit` → EXIT CODE 0.
- [x] Novos campos `concessionaire`, `rateGroup`, `roofType`, `roofInclination` persistidos no `useSolarStore`.
- [x] Card "Solar Tech Insight" exibe Irradiação Anual e PR Sugerido quando `weatherData` disponível.
- [ ] Dado de `concessionaire` flui para o memorial descritivo gerado na view Proposta *(pendente — Gênes P2)*.

---

## 6. Backlog de Gaps (Próximos Épicos)

| ID | Gap Identificado | Prioridade | Impacto |
|----|-----------------|------------|--------|
| G-01 | Suporte a Grupo A (Média Tensão / Demanda) | P2 | Cálculo de demanda ausente |
| G-02 | `roofType` propagando fator de ventilação para o PR no motor de simulação | P2 | PR mais realista |
| G-03 | Autocomplete de Concessionária por UF | P3 | UX de preenchimento |
| G-04 | Irradiação anual na Instrumentação + nota de viabilidade | P2 | Percepção de valor imediato |

# Spec — Fluxo Guiado de Dimensionamento (Jornada do Integrador)

**Tipo:** Feature Nova + Refatoração de UX
**Módulo:** `engineering` + `uiStore` + `solarStore`
**Prioridade:** P0 — Bloqueante
**Responsável (impl.):** `the-builder`
**Revisor (aceitação):** `engenheiro-eletricista-pv` + `design-lead`
**Data de criação:** 2026-04-14
**Versão:** 2.0 — revisado 2026-04-15
**Supersede:** `02-spec-jornada-integrador-2026-04-15.md.md` v1.0

---

## Changelog v2.0

| Seção | Mudança |
|-------|---------|
| §2 | Decisão arquitetural reescrita: stepper de 5 etapas **eliminado**; substituído por sincronia bloco-aba via `activeFocusedBlock` |
| §2.1 | `JourneyStepBar` removido — não será criado |
| §2.2 | As 5 etapas reinterpretadas como views ativas, não como passos obrigatórios |
| §3 | Arquivos afetados atualizado: `JourneyStepBar.tsx` e modificação do `TopRibbon` para stepper removidos |
| §4 | Plano de migração reescrito sem as etapas A–F do stepper |
| §5 | Riscos atualizados |
| §6 | Critérios de aceitação atualizados |

---

## 1. Diagnóstico (mantido da v1.0)

### 1.1 Situação atual

O Kurupira possui todos os componentes de engenharia necessários para um dimensionamento
completo (`ModuleInventory`, `InverterInventory`, `StringConfigurator`, `VoltageRangeChart`,
etc.), mas nenhum deles está conectado a um fluxo que guie o integrador. O engenheiro
abre o workspace e encontra um canvas sem orientação de onde começar.

O `CustomerTab` — que contém dados de consumo e localização — existe no disco mas nunca
foi integrado ao workspace atual.

### 1.2 Impacto no usuário (mantido)

- **Integrador:** Não sabe por onde começar. Abandona o fluxo ou dimensiona na ordem errada.
- **Qualidade do projeto:** Sem entrada de consumo obrigatória, o sistema não calcula `kWp alvo`.
- **Confiança nos números:** Um fluxo sem ordem explícita amplifica o desconforto com caixas pretas.

---

## 2. Solução Técnica (v2.0)

### 2.1 Decisão arquitetural

~~Implementar um stepper de 5 etapas no `TopRibbon.tsx`~~

**Novo modelo:** A orientação do integrador é dada pelos **blocos do LeftOutliner**,
não por um stepper externo. O estado de cada bloco (placeholder → ativo → completo)
é o indicador de progresso. A navegação entre contextos é feita pelo campo
`activeFocusedBlock` no `uiStore`, que sincroniza blocos e canvas views.

**Spec que implementa o mecanismo:** `spec-sincronia-bloco-canvas-2026-04-15.md`

Esta spec é responsável apenas pelo que é **exclusivo do fluxo de dados de engenharia**:
- Cálculo do `kWpAlvo` a partir dos dados de consumo
- `journeySlice` com `loadGrowthFactor` e `kWpAlvo`
- Lógica de desbloqueio em cascata dos blocos

### 2.2 As views da jornada (antes: "5 etapas")

As views existem como antes, mas são ativadas por foco no bloco, não por um stepper:

| Bloco | View ativa | Dados de entrada |
|-------|-----------|-----------------|
| Local | `SiteCanvasView` | Identificação, Endereço, Coordenadas (NASA API) |
| Consumo | `ConsumptionCanvasView` | 12 faturas mensais, tarifa, fator crescimento |
| Arranjo Físico | `MapCore` (Camada: Telhados/Obstáculos) | Área física, Azimute, Tilt |
| Módulos FV | `MapCore` (Camada: Módulos Posicionados) | Seleção de módulo, quantidade calculada |
| Inversor | `ElectricalCanvasView` | Seleção de inversor, validação elétrica |
| Simulação | `SimulationCanvasView` | Resultado calculado — apenas leitura |

A navegação entre views é **livre e não bloqueante** — exatamente como o stepper
da v1.0 especificava ("o stepper é guia, não portão"). O que muda é o mecanismo
visual: o guia é o estado dos blocos, não uma barra de progresso separada.

### 2.3 Especificação: Cálculo do kWp Alvo (mantido da v1.0)

#### Entrada

| Variável | Tipo | Fonte | Unidade |
|----------|------|-------|---------|
| `consumoMensalKwh` | `number[12]` | `solarStore.clientData.monthlyConsumption` | kWh |
| `fatorCrescimento` | `number` | `journeySlice.loadGrowthFactor` (default: 0) | % |
| `hsp` | `number` | `solarStore.clientData.monthlyIrradiation` (média anual) | kWh/m²/dia |
| `pr` | `number` | `lossConfig` (PR decomposto ou default 0.80) | adimensional |

#### Fórmula (inalterada)

```typescript
const consumoMedioMensal = mean(consumoMensalKwh) * (1 + fatorCrescimento / 100);
const consumoAnual = consumoMedioMensal * 12;
const kWpAlvo = consumoAnual / (hsp * 365 * pr);
```

#### Saída

| Variável | Tipo | Unidade | Onde aparece |
|----------|------|---------|-------------|
| `kWpAlvo` | `number` | kWp | Conector Consumo → Módulos no LeftOutliner |
| `qtdModulosMinima` | `number` | unid. | Bloco Módulos após seleção de modelo |

### 2.4 journeySlice (simplificado vs v1.0)

O `journeySlice` não precisa mais de `currentStep` nem `stepStatus[5]` — esses
campos serviam o stepper eliminado. O slice fica enxuto:

```typescript
// src/core/state/slices/journeySlice.ts
interface JourneySlice {
  loadGrowthFactor: number;        // % crescimento de carga (default: 0)
  kWpAlvo: number | null;          // calculado a partir do consumo
  setLoadGrowthFactor: (v: number) => void;
  setKWpAlvo: (v: number | null) => void;
}
```

`kWpAlvo` é recalculado sempre que `clientData.monthlyConsumption`,
`clientData.monthlyIrradiation` ou `loadGrowthFactor` mudam — via `useEffect`
ou selector derivado no `ConsumptionCanvasView`.

---

## 3. Arquivos Afetados (v2.0)

### Modificar

| Arquivo | Mudança |
|---------|---------|
| `core/state/solarStore.ts` | Adicionar `journeySlice` simplificado (`loadGrowthFactor` + `kWpAlvo`) — **sem** `currentStep` nem `stepStatus` |
| `canvas-views/SimulationCanvasView.tsx` | Confirmar que exibe resultado financeiro completo como view de saída |

### Criar

| Arquivo | Propósito |
|---------|-----------|
| `core/state/slices/journeySlice.ts` | Slice Zustand enxuto: `loadGrowthFactor`, `kWpAlvo`, actions |
| `canvas-views/ConsumptionCanvasView.tsx` | View de raio-x do consumo — **delegada à spec-sincronia §4** |

### Removidos vs v1.0 (não criar)

| Arquivo v1.0 | Motivo da remoção |
|--------------|-------------------|
| `[NEW] ui/panels/components/JourneyStepBar.tsx` | Stepper eliminado — orientação é pelos blocos |
| `[MODIFY] TopRibbon.tsx` para stepper | Sem stepper, sem modificação para esse fim |
| `[MODIFY] CenterCanvas.tsx` para stepper | `spec-sincronia-bloco-canvas` cuida disso |

### Reintegrar (mantido da v1.0)

| Arquivo | Destino |
|---------|---------|
| `tabs/CustomerTab.tsx` | Absorver lógica na `ConsumptionCanvasView` |
| `components/ModuleInventory.tsx` + `ModuleCatalogDialog.tsx` | Disponíveis via Bloco Módulos (overlay de catálogo) |
| `components/StringConfigurator.tsx` | Disponível via `ElectricalCanvasView` |
| `components/SystemLossesCard.tsx` | Settings Drawer (premissas globais) |

---

## 4. Plano de Migração (v2.0)

```
Etapa A: Refatoração da SiteCanvasView ("Local")
  → Permite editar Nome do Cliente, Endereço e Coordenadas no Workspace.
  → Dashboard climático integrado com persistência (NASA).

Etapa B: journeySlice enxuto
  → Passo de sincronia entre Local e Consumo.

Etapa C: ConsumptionCanvasView (delegada a spec-sincronia §4)
  → Integrador insere consumo; kWpAlvo aparece no conector do bloco.

Etapa D: Reintegração de ModuleInventory + ModuleCatalogDialog
  → Overlay de catálogo disparado pelo Bloco Módulos.

Etapa E: StringConfigurator na ElectricalCanvasView
  → Validação elétrica completa acessível via Bloco Inversor.

Etapa F: SimulationCanvasView como view de saída
  → Integrador vê Geração vs Consumo + R$ economizados.
```

### Guardrails (mantidos)
- [ ] Nenhum bloco bloqueia navegação — os blocos são guia, não portão
- [ ] `tsc --noEmit` passa ao fim de cada etapa
- [ ] Projetos salvos sem `journeySlice` abrem normalmente (defaults aplicados)
- [ ] Bootstrap de equipamentos default executado antes de qualquer dimensionamento

---

## 5. Avaliação de Riscos (v2.0)

| Risco | Prob. | Sev. | Mitigação |
|-------|:-----:|:----:|-----------|
| `journeySlice.kWpAlvo` stale (não recalcula quando `clientData` muda) | Média | Alta | Recalcular via `useEffect` na `ConsumptionCanvasView` que observa `monthlyConsumption` + `loadGrowthFactor` |
| `ConsumptionCanvasView` duplicar lógica do `CustomerTab` legado | Média | Média | Absorver os campos direto; não reusar o componente legado |
| Integrador engenheiro experiente ignorar os blocos e ir direto ao canvas | Alta | Baixa | Comportamento esperado — blocos são orientação, não obrigação |
| `weatherData` indisponível para correlação climática | Alta | Baixa | Seção de correlação implementada por último com fallback de placeholder |

---

## 6. Critérios de Aceitação (v2.0)

### Funcionais
- [ ] Integrador insere consumo na `ConsumptionCanvasView` e vê `kWp alvo` atualizar no Bloco Consumo em tempo real
- [ ] `fatorCrescimento` = 20% aumenta o `kWpAlvo` em 20% corretamente
- [ ] Selecionar um módulo via overlay de catálogo exibe quantidade mínima baseada no `kWpAlvo`
- [ ] `ElectricalCanvasView` exibe alerta CRITICAL quando `Voc_max × N_série > V_max_inversor`
- [ ] `SimulationCanvasView` exibe gráfico Geração vs Consumo com os 12 meses quando inversor validado

### Técnicos
- [ ] `tsc --noEmit` → EXIT CODE 0
- [ ] Projetos sem `journeySlice` no estado legado abrem sem erro (defaults aplicados)
- [ ] `journeySlice` não contém `currentStep` nem `stepStatus` (campos do stepper eliminado)
- [ ] `kWpAlvo` não é armazenado duplicado — apenas no `journeySlice`, consumido pelo bloco via selector

### Engenharia
- [ ] Caso real: consumo 500 kWh/mês + HSP 4.8 + PR 0.80 → kWp alvo ≈ 3,56 kWp
- [ ] Engenheiro revisor confirma ordem das views compatível com NBR 16690 / prática de campo
- [ ] HealthCheck cobre: oversize ratio, Voc corrigido, Isc × strings vs. I_MPPT

---

## 7. O que este escopo desbloqueia (mantido)

| Módulo / Feature | Desbloqueio |
|-----------------|-------------|
| `P4 — BOS/Elétrico` | Topologia elétrica completa na `ElectricalCanvasView` |
| `P5 — Financeiro` | `SimulationCanvasView` com `kWh gerado × tarifa` |
| `spec-monetizacao-banco-creditos` | View de simulação é o ponto de exposição das métricas |
| `Memorial Descritivo` | Dados das views 1–4 são entradas para geração automática |
| `Proposta Comercial` | `SimulationCanvasView` é antessala da proposta |

---

## 8. Fora do escopo (v2.0)

- **~~Stepper / JourneyStepBar~~** — eliminado
- **~~Bloqueio de navegação entre etapas~~** — nunca foi o objetivo
- **Integração com API climática (PVGIS)** — HSP via CRESESB estático; integração dinâmica é escopo separado
- **Módulo de BOS** — desbloqueado por este escopo, não contido nele
- **Visualização 3D do arranjo** — roadmap WebGL/R3F
- **Catálogo online de módulos/inversores** — catálogos estáticos suficientes para este escopo

---

## Referências

- **Mecanismo de navegação:** `spec-sincronia-bloco-canvas-2026-04-15.md`
- Foco tátil: `spec-foco-tatil.md`
- Edição inline: `05-spec-edicao-inline-blocos-2026-04-15.md.md`
- Spec de kWp alvo: `.agent/concluido/spec-03-potencia-minima-recomendada-2026-04-11.md`
- Spec de validação elétrica: `.agent/concluido/Engenharia_Dimensionamento_Funcional/Especificacao_Engenharia_Funcional.md`
- Mapa de interface: `docs/interface/mapa-interface-completo.md`
- Norma: NBR 16690:2019 / REN ANEEL nº 1.000/2021

# Plano de Refatoração — Jornada do Integrador: Fluxo Guiado de Dimensionamento

**Tipo:** Feature Nova + Refatoração de UX
**Módulo:** `engineering` + `settings` (CustomerTab / clientData)
**Prioridade:** P0 — Bloqueante
**Responsável (impl.):** `the-builder`
**Revisor (aceitação):** `engenheiro-eletricista-pv` + `design-lead`
**Data de criação:** 2026-04-14
**Versão:** 1.0
**Origem:** jornada-usuario / auditoria-ux-001

---

## 1. Diagnóstico

### 1.1 Situação atual

O Kurupira possui todos os componentes de engenharia necessários para um dimensionamento completo
(`ModuleInventory`, `InverterInventory`, `StringConfigurator`, `VoltageRangeChart`, etc.), mas
nenhum deles está conectado a um fluxo sequencial que guie o integrador. O engenheiro abre o
workspace e encontra um canvas vazio sem saber por onde começar. O `CustomerTab` — que contém
dados de consumo e localização — existe no disco mas nunca foi integrado ao workspace atual.

A raiz do problema: o Kurupira foi refatorado visualmente (UX-001) mas não recebeu uma
**narrativa de uso** que traduza a sequência lógica de dimensionamento em passos concretos na
interface.

### 1.2 Evidência do problema

| Indicador | Valor Atual | Valor Esperado |
|-----------|-------------|----------------|
| `CustomerTab` plugado no workspace | ❌ Desplugado | ✅ Acessível antes de qualquer cálculo |
| Sequência guiada de etapas | ❌ Inexistente | ✅ 5 etapas com progressão visual |
| Bootstrap de equipamentos ao abrir projeto | ❌ Canvas vazio | ✅ Módulo e inversor default injetados |
| Acréscimo de carga disponível na entrada | ❌ Inexistente | ✅ Campo opcional na Etapa 1 |
| Estado de completude de cada etapa | ❌ Inexistente | ✅ Indicador por etapa (pendente / completo / erro) |

### 1.3 Impacto no usuário

- **Integrador:** Não sabe por onde começar. Abre o workspace e vê um canvas sem orientação.
  Resultado: ou abandona o fluxo, ou dimensiona na ordem errada (ex: seleciona inversor antes
  de definir quantos módulos cabem no telhado).
- **Qualidade do projeto:** Sem entrada de consumo obrigatória antes do dimensionamento, o
  sistema não consegue calcular `kWp alvo` nem validar se a geração cobre o consumo.
- **Confiança nos números:** O engenheiro-eletricista-pv identificou que caixas pretas geram
  desconforto imediato. Um fluxo sem ordem explícita amplifica esse problema.

---

## 2. Solução Técnica

### 2.1 Decisão arquitetural

Implementar um **stepper de 5 etapas** exposto no `TopRibbon.tsx` como barra de progresso
horizontal, onde cada etapa corresponde a uma `CanvasView` específica do `CenterCanvas`. A
navegação entre etapas é livre (não bloqueante), mas etapas com dados insuficientes exibem
indicador visual de incompletude. O estado de progresso vive no `solarStore` (novo slice
`journeySlice`).

**Alternativas descartadas:**

| Alternativa | Motivo do descarte |
|-------------|-------------------|
| Modal wizard obrigatório | Bloqueia o engenheiro experiente que já sabe o que quer fazer |
| Aba separada "Jornada" | Fragmenta a experiência — o engenheiro perde contexto ao trocar de aba |
| Stepper lateral no LeftOutliner | Conflita com a árvore de topologia elétrica, que precisa de espaço |

### 2.2 As 5 Etapas da Jornada

```
Etapa 1: Consumo e Localização
  → Dados do cliente, 12 faturas mensais (kWh), tarifa, cidade
  → Acréscimo de carga (opcional): fator de crescimento %

Etapa 2: Módulo Fotovoltaico
  → Seleção no catálogo (Wp, Voc, Vmp, Isc, coeficientes)
  → kWp alvo calculado automaticamente
  → Quantidade mínima de módulos sugerida

Etapa 3: Arranjo Físico
  → Canvas Leaflet: área disponível no telhado, orientação, inclinação
  → Posicionamento dos módulos (PLACE_MODULE)
  → Strings e MPPTs definidos no LeftOutliner

Etapa 4: Inversor
  → Seleção no catálogo
  → Validação elétrica automática (oversize, Voc, Isc por MPPT)
  → HealthCheck verde = etapa concluída

Etapa 5: Simulação e Resultado
  → Gráfico Geração vs Consumo (12 meses)
  → Banco de créditos acumulado
  → Economia projetada (R$)
  → Acesso à documentação e proposta
```

### 2.3 Especificação: Cálculo do kWp Alvo (Etapa 1 → Etapa 2)

#### Entrada

| Variável | Tipo | Fonte | Unidade |
|----------|------|-------|---------|
| `consumoMensalKwh` | `number[12]` | `solarStore.clientData.monthlyConsumption` | kWh |
| `fatorCrescimento` | `number` | `journeySlice.loadGrowthFactor` (default: 0) | % |
| `hsp` | `number` | `solarStore.clientData.monthlyIrradiation` (média anual) | kWh/m²/dia |
| `pr` | `number` | `lossConfig` (PR decomposto ou default 0.80) | adimensional |

#### Fórmula

```typescript
// Consumo médio ajustado com acréscimo de carga
const consumoMedioMensal = mean(consumoMensalKwh) * (1 + fatorCrescimento / 100);
const consumoAnual = consumoMedioMensal * 12; // kWh/ano

// kWp mínimo para cobrir 100% do consumo anual
const kWpAlvo = consumoAnual / (hsp * 365 * pr);
```

#### Saída

| Variável | Tipo | Unidade | Significado |
|----------|------|---------|-------------|
| `kWpAlvo` | `number` | kWp | Potência mínima do sistema para cobrir 100% do consumo |
| `qtdModulosMinima` | `number` | unid. | `Math.ceil(kWpAlvo * 1000 / modulo.electrical.pmax)` |

#### Casos de borda

| Situação | Comportamento esperado |
|----------|----------------------|
| Nenhuma fatura inserida | Etapa 1 fica com indicador `pendente`; Etapa 2 não exibe sugestão de quantidade |
| HSP não disponível para a cidade | Usar média nacional de 4.5 kWh/m²/dia como fallback com aviso visível |
| `fatorCrescimento` = 0 | Dimensionar para consumo histórico sem acréscimo |
| Módulo não selecionado | `qtdModulosMinima` exibe "—" até que o módulo seja escolhido |

### 2.4 Especificação: Indicador de Completude por Etapa

```typescript
type EtapaStatus = 'pendente' | 'em-andamento' | 'completo' | 'erro';

// Regras de completude
const etapa1Completa = clientData.monthlyConsumption.some(v => v > 0)
  && clientData.city !== '';

const etapa2Completa = modules.ids.length > 0;

const etapa3Completa = project.placedModules.length > 0
  && Σ(mppt.modulesPerString × mppt.stringsCount) > 0;

const etapa4Completa = inverters.ids.length > 0
  && systemHealthCheck.voc === 'ok'
  && systemHealthCheck.oversize === 'ok';

const etapa5Completa = etapa4Completa; // Simulação roda automaticamente
```

---

## 3. Arquivos Afetados

### Modificar

| Arquivo | Mudança |
|---------|---------|
| `[MODIFY] ui/panels/TopRibbon.tsx` | Adicionar `JourneyStepBar` — barra de progresso horizontal com 5 etapas e indicadores de status |
| `[MODIFY] ui/panels/CenterCanvas.tsx` | Mapear cada etapa do stepper para a `CanvasView` correspondente; navegação por etapa muda a view ativa |
| `[MODIFY] core/stores/solarStore.ts` | Adicionar `journeySlice` com `currentStep`, `loadGrowthFactor`, `kWpAlvo`, `stepStatus[5]` |
| `[MODIFY] ui/panels/canvas-views/SimulationCanvasView.tsx` | Promover para Etapa 5 — exibir resultado financeiro + banco de créditos como saída da jornada |

### Criar

| Arquivo | Propósito |
|---------|-----------|
| `[NEW] ui/panels/components/JourneyStepBar.tsx` | Componente de stepper horizontal: 5 etapas, indicador de status por etapa, clique navega para a view |
| `[NEW] ui/panels/canvas-views/ConsumptionCanvasView.tsx` | View da Etapa 1 — formulário de faturas (12 meses), cidade, tarifa, acréscimo de carga opcional |
| `[NEW] core/stores/journeySlice.ts` | Slice Zustand: estado de progresso, `kWpAlvo` calculado, `loadGrowthFactor` |

### Reintegrar (componentes existentes no disco, atualmente desplugados)

| Arquivo | Destino |
|---------|---------|
| `[REINTEGRATE] tabs/CustomerTab.tsx` | Migrar campos para `ConsumptionCanvasView` — não reusar o componente legado diretamente, absorver a lógica |
| `[REINTEGRATE] components/ModuleInventory.tsx` + `ModuleCatalogDialog.tsx` | Etapa 2 — plugar no `LeftOutliner` ou como painel inline no `CenterCanvas` |
| `[REINTEGRATE] components/StringConfigurator.tsx` | Etapa 3 — plugar no `RightInspector` quando string selecionada no Outliner |
| `[REINTEGRATE] components/SystemLossesCard.tsx` | Etapa 3 ou Premissas — configuração de PR decomposto |

### Consequências em cascata

- `useAutoSizing.ts` — deverá consumir `journeySlice.kWpAlvo` como meta de potência
- `SystemHealthCheck` — etapa 4 é declarada completa quando `healthCheck` não tem críticos
- `spec-03-potencia-minima-recomendada-2026-04-11.md` — esta spec implementa o cálculo de kWp; a Jornada consome o resultado via `journeySlice`

---

## 4. Plano de Migração

### Ordem de execução

```
Etapa A: journeySlice + JourneyStepBar (estado e UI do stepper)
  ↓  [sistema compila; stepper aparece mas todas as etapas ficam "pendente"]

Etapa B: ConsumptionCanvasView (Etapa 1 — entrada de faturas e localização)
  ↓  [integrador consegue inserir consumo; kWpAlvo é calculado e exibido]

Etapa C: Reintegração de ModuleInventory + ModuleCatalogDialog (Etapa 2)
  ↓  [integrador seleciona módulo; qtdModulosMinima é exibida]

Etapa D: StringConfigurator + cruzamento físico/lógico (Etapa 3)
  ↓  [arranjo físico e topologia elétrica conectados]

Etapa E: Inversor + validação elétrica completa (Etapa 4)
  ↓  [HealthCheck verde = jornada concluída; Etapa 5 destravada]

Etapa F: SimulationCanvasView como Etapa 5 (resultado financeiro)
  ↓  [integrador vê Geração vs Consumo + R$ economizados]
```

### Guardrails obrigatórios

- [ ] Nenhuma etapa bloqueia navegação — o stepper é guia, não portão
- [ ] `tsc --noEmit` passa ao fim de cada etapa
- [ ] Projetos já salvos abrem normalmente (sem `journeySlice` no estado legado — inicializar com defaults)
- [ ] Bootstrap de equipamentos default (Ação 4 da spec de engenharia funcional) executado antes da Etapa 2

---

## 5. Avaliação de Riscos

| Risco | Probabilidade | Severidade | Mitigação |
|-------|:---:|:---:|-----------|
| `journeySlice` com estado não-persistido: ao recarregar, `currentStep` reseta para Etapa 1 | Alta | Baixa | Aceitar o comportamento — recalcular status de cada etapa a partir dos dados persistidos no `solarStore` |
| `ConsumptionCanvasView` duplicar lógica do `CustomerTab` legado | Média | Média | Absorver os campos do `CustomerTab` direto; não reusar o componente legado (arquitetura diferente) |
| Reintegração do `ModuleInventory` quebrar o layout do Workspace novo | Média | Alta | Implementar como painel flutuante sobre o canvas antes de integrar ao Outliner permanentemente |
| Engenheiro experiente ignorar o stepper e ir direto ao canvas | Alta | Baixa | Comportamento esperado — o stepper não deve bloquear; é orientação, não obrigação |

---

## 6. Critérios de Aceitação

### Funcionais

- [ ] Integrador consegue inserir 12 faturas mensais na Etapa 1 e ver `kWp alvo` calculado em tempo real
- [ ] `fatorCrescimento` = 20% aumenta o `kWpAlvo` em 20% corretamente
- [ ] Selecionar um módulo na Etapa 2 exibe quantidade mínima sugerida baseada no `kWpAlvo`
- [ ] Etapa 4 exibe alerta `CRITICAL` quando `Voc_max × N_série > V_max_inversor`
- [ ] Etapa 5 exibe gráfico de Geração vs Consumo com os 12 meses após Etapa 4 concluída

### Técnicos

- [ ] `tsc --noEmit` → EXIT CODE 0
- [ ] Projetos salvos sem `journeySlice` abrem sem erro (defaults aplicados)
- [ ] `JourneyStepBar` não introduz reflow no layout do workspace (`height` fixo no `TopRibbon`)

### Engenharia

- [ ] Resultado validado com caso real: consumo 500 kWh/mês + HSP 4.8 + PR 0.80 → kWp alvo ≈ 3.56 kWp
- [ ] Engenheiro revisor confirma que a ordem das etapas não viola o fluxo da NBR 16690 / prática de campo
- [ ] HealthCheck da Etapa 4 cobre: oversize ratio, Voc corrigido, Isc × strings vs. I_MPPT

---

## 7. O que este escopo desbloqueia

| Módulo / Feature | Desbloqueio |
|-----------------|-------------|
| `P4 — BOS/Elétrico` | Etapa 3 e 4 fornecem topologia elétrica completa (strings, MPPTs, Isc) necessária para dimensionar cabos DC e String Box |
| `P5 — Financeiro` | Etapa 5 com `kWh gerado × tarifa` alimenta o cálculo de ROI e payback |
| `spec-monetizacao-banco-creditos` | Etapa 5 é o ponto de exposição das métricas financeiras (economia R$, banco de créditos) |
| `Memorial Descritivo` | Dados das Etapas 1–4 são as entradas obrigatórias para geração automática do memorial |
| `Proposta Comercial` | Etapa 5 serve como antessala da proposta — botão "Gerar Proposta" fica natural ao final da jornada |

---

## 8. Fora do escopo

- **Bloqueio de navegação entre etapas** — o stepper é sempre livre; validação é visual, não obstrutiva
- **Integração com API climática (PVGIS)** — HSP continua via CRESESB estático; integração dinâmica é escopo separado
- **Módulo de BOS (cabos, proteções)** — é desbloqueado por este escopo, não está contido nele
- **Visualização 3D do arranjo** — pertence ao roadmap WebGL/R3F; a Etapa 3 usa o canvas Leaflet 2D atual
- **Catálogo de módulos e inversores online** — os catálogos estáticos existentes são suficientes para este escopo

---

## Referências

- Fluxo de engenharia: `.agent/skills/engenheiro-eletricista-pv/SKILL.md` — Eixo 6.2 (Fluxo de Trabalho Natural)
- Componentes legados disponíveis: `.agent/concluido/Dimensionamento/Relatorio_Completo_Mudancas.md`
- CustomerTab em aberto: `.agent/aguardando/CRM_Cliente/Planejamento_CustomerTab.md`
- Spec de kWp alvo: `.agent/concluido/spec-03-potencia-minima-recomendada-2026-04-11.md`
- Spec de validação elétrica: `.agent/concluido/Engenharia_Dimensionamento_Funcional/Especificacao_Engenharia_Funcional.md`
- Mapa de interface: `docs/interface/mapa-dimensionamento.md`
- Norma: NBR 16690:2019 / REN ANEEL nº 1.000/2021

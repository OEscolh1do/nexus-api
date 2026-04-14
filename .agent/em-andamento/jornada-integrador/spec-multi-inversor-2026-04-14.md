# Spec — Projetos com Múltiplos Inversores

**Tipo:** Feature Nova + Extensão de UX
**Módulo:** `engineering` — `useTechStore`, `ComposerCanvasView`, `electricalMath`, `systemCompositionSlice`
**Prioridade:** P1 — Crítico
**Responsável (impl.):** `the-builder`
**Revisor (aceitação):** `engenheiro-eletricista-pv`
**Data de criação:** 2026-04-14
**Versão:** 1.0
**Origem:** scope-jornada-integrador-2026-04-14 § Fora do Escopo (item explícito)
**Dependência direta:** `spec-compositor-blocos-2026-04-14` — Fase C concluída

---

## 1. Diagnóstico

### 1.1 Por que projetos com múltiplos inversores existem

Dois cenários práticos geram essa necessidade:

**Cenário A — Potência além de um inversor.** Um projeto comercial de 20 kWp não pode
usar um único inversor de 20 kW se o integrador prefere redundância ou se os modelos
disponíveis na faixa de custo são de 10 kW. Dois inversores de 10 kW é a solução padrão.

**Cenário B — Telhados com múltiplas orientações.** Uma residência com águas Norte e
Sul idealmente tem um inversor por orientação — cada um com seus MPPTs apontando para
a água correspondente, sem mismatch por diferença de geração entre as duas faces.

Ambos são casos rotineiros no mercado brasileiro. Qualquer integrador comercial os
encontra semanalmente.

### 1.2 O que o sistema suporta hoje

A store `useTechStore` já é normalizada: `inverters: { ids: string[], entities: Record<string, InverterSpec> }`. Tecnicamente, N inversores podem ser adicionados via `addInverter()`. O `LeftOutliner` já renderiza múltiplos nós raiz de inversor.

O que não existe:

| Camada | Estado atual | Problema |
|--------|-------------|---------|
| `useTechStore` | Suporta N inversores | Sem ação `addInverterInstance` com validação de compatibilidade |
| Cálculo de geração | `SolarCalculator` usa potência de 1 inversor | `Pdc_total` não soma múltiplos inversores |
| `systemCompositionSlice` | Derivado para 1 bloco de inversor | Sem modelo para N blocos |
| `ComposerCanvasView` | 1 bloco de inversor fixo na cadeia | Sem representação de N inversores |
| Validação elétrica | `calculateStringMetrics` opera por inversor | Correto — mas os chips do Compositor só exibem o primeiro |
| `HealthCheckWidget` | Valida Voc do primeiro inversor | Precisa validar todos |

### 1.3 Impacto atual

Um integrador que adiciona dois inversores no `LeftOutliner` hoje vê ambos na árvore,
mas o Compositor mostra apenas o primeiro. Os chips de validação refletem apenas o
inversor 1. A geração total calculada usa apenas `Pac_nominal` do inversor 1. A proposta
gerada com dois inversores está errada.

---

## 2. Decisão Arquitetural: Como Representar N Inversores no Compositor

Esta é a decisão de design mais importante da spec. Há três opções:

**Opção A — Um bloco por inversor (N blocos paralelos).** O Compositor mostra dois
blocos de inversor lado a lado. Cada um tem seus próprios chips.

**Opção B — Um bloco agregado com sub-linhas.** Um único Bloco Inversor mostra uma
linha por inversor dentro dele, com os chips de cada um.

**Opção C — Bloco agregado com expansão.** O Bloco Inversor em modo resumo mostra
métricas consolidadas (Pdc total, ratio médio). Em modo edição, expande para mostrar
cada inversor individualmente.

**Decisão: Opção C.**

A Opção A quebra a metáfora linear da cadeia de blocos (Consumo → Módulo → Arranjo →
Inversor) quando há dois inversores em paralelo — a cadeia vira uma bifurcação. A Opção
B coloca muita informação no corpo do bloco sem a hierarquia visual que ela merece. A
Opção C mantém a linearidade do Compositor em modo resumo e expõe a complexidade apenas
quando o integrador decide acessá-la.

```
MODO RESUMO (N inversores)            MODO EDIÇÃO (expandido)
┌─────────────────────────────┐       ┌─────────────────────────────┐
│ [ícone] Inversores  2× 10kW │       │ [ícone] Inversores  2× 10kW │
│ [20kWp DC] [Ratio 1.18]     │       │ [20kWp DC] [Ratio 1.18]     │
│ [Voc ok] [2 unidades]       │       ├─────────────────────────────┤
└─────────────────────────────┘       │ ① PHB 10kW                  │
                                      │   [Ratio 1.20] [Voc 298V ✓] │
         clicar ──────────────►       │   [Isc ok] [1 MPPT]         │
                                      ├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤
                                      │ ② PHB 10kW                  │
                                      │   [Ratio 1.16] [Voc 298V ✓] │
                                      │   [Isc ok] [1 MPPT]         │
                                      ├─────────────────────────────┤
                                      │ [+ Adicionar inversor]       │
                                      │ [Mais opções →]              │
                                      └─────────────────────────────┘
```

---

## 3. Especificação Técnica

### 3.1 Chips agregados do Bloco Inversor (modo resumo, N inversores)

Em modo resumo, o Bloco Inversor exibe métricas consolidadas de **todos** os inversores:

| Chip | Cálculo | Semáforo |
|------|---------|----------|
| `Pdc total` | `Σ(Pdc_i)` para todos os inversores | Neutro (informativo) |
| `Ratio médio` | `Σ(Pdc_i) / Σ(Pac_i)` | Verde 1.10–1.25; âmbar 1.05–1.35; vermelho fora |
| `Voc` | `"ok"` se todos os inversores com Voc válido; `"X com erro"` se algum falha | Verde se todos ok; vermelho com contagem de falhas |
| `Inversores` | `N unidades` | Verde se ≥ 1; cinza se 0 |

O semáforo do chip `Ratio médio` usa o pior caso entre os inversores — se qualquer
inversor estiver fora da faixa, o chip fica vermelho, independente da média.

```typescript
// systemCompositionSlice.ts — lógica de chips multi-inversor
const inverterIds = useTechStore(s => s.inverters.ids);
const inverterEntities = useTechStore(s => s.inverters.entities);

const pdcTotal = inverterIds.reduce((sum, id) => {
  const inv = inverterEntities[id];
  const mpptSum = inv.mpptConfigs.reduce((s, mppt) =>
    s + (mppt.modulesPerString * mppt.stringsCount * moduleWp), 0);
  return sum + mpptSum;
}, 0);

const pacTotal = inverterIds.reduce((sum, id) =>
  sum + inverterEntities[id].electrical.pacNominal, 0);

const ratioAvg = pacTotal > 0 ? pdcTotal / pacTotal : 0;

// Pior caso entre todos os inversores
const worstVoc = inverterIds.some(id => {
  const inv = inverterEntities[id];
  const vocMax = calculateVocMax(inv, moduleData, tmin);
  return vocMax > inv.electrical.maxInputVoltage;
});

const worstRatio = inverterIds.reduce((worst, id) => {
  const inv = inverterEntities[id];
  const pdc = inv.mpptConfigs.reduce((s, mppt) =>
    s + (mppt.modulesPerString * mppt.stringsCount * moduleWp), 0);
  const ratio = pdc / inv.electrical.pacNominal;
  return Math.max(worst, ratio > 1.35 ? ratio : 0, ratio < 1.05 ? (1.05 - ratio) : 0);
}, 0);
```

### 3.2 Sub-linha por inversor no modo edição

Quando o bloco expande, cada inversor é representado como uma sub-linha com:
- Número de ordem (①, ②, ③...)
- Nome do modelo
- Chips individuais: Ratio DC/AC, Voc corrigido, Isc × MPPT

Os chips por inversor usam a mesma lógica de semáforo dos chips do Bloco Inversor
individual (especificada em `spec-compositor-blocos-2026-04-14` §3.2.4).

Clicar em uma sub-linha seleciona aquele inversor no `LeftOutliner` e abre o
`RightInspector` em modo `inverter` para ele — sem sair do Compositor.

### 3.3 Botão "+ Adicionar inversor" no modo edição

O botão no rodapé da zona de edição abre o `InverterCatalogDialog` em modo `add`
(não `replace`). Ao confirmar, o novo inversor é adicionado ao `useTechStore` via
`addInverter()` e uma nova sub-linha aparece no bloco.

O sistema sugere automaticamente o mesmo modelo do inversor existente como padrão
no catálogo — o integrador pode trocar, mas a sugestão reduz fricção para o caso
mais comum (dois inversores iguais em projetos comerciais simétricos).

### 3.4 Distribuição de módulos entre inversores

Quando há N inversores, os módulos precisam ser distribuídos entre eles. O sistema
propõe uma distribuição balanceada por padrão, mas o integrador pode ajustar.

**Distribuição automática ao adicionar segundo inversor:**

```typescript
// useAutoSizing.ts — lógica de distribuição multi-inversor
function distributeModulesAcrossInverters(
  totalModules: number,
  inverters: InverterSpec[]
): Record<string, number> {
  // Distribuição proporcional à capacidade AC de cada inversor
  const totalPac = inverters.reduce((s, inv) => s + inv.electrical.pacNominal, 0);
  return Object.fromEntries(
    inverters.map(inv => [
      inv.id,
      Math.round(totalModules * (inv.electrical.pacNominal / totalPac))
    ])
  );
}
```

O resultado é exibido no Compositor como chips por inversor: `"Inv ① 12 módulos"` e
`"Inv ② 12 módulos"`. O integrador pode mover módulos manualmente na árvore do
`LeftOutliner` ou ajustar as strings por MPPT no `RightInspector`.

### 3.5 Correção do `SolarCalculator` para multi-inversor

O motor de geração precisa somar a potência DC de todos os inversores:

```typescript
// SolarCalculator.ts — correção
// ANTES (apenas primeiro inversor):
const pdcNominal = techStore.inverters.entities[techStore.inverters.ids[0]]
  .mpptConfigs.reduce(...)

// DEPOIS (soma de todos):
const pdcNominal = techStore.inverters.ids.reduce((total, invId) => {
  const inv = techStore.inverters.entities[invId];
  return total + inv.mpptConfigs.reduce((sum, mppt) =>
    sum + (mppt.modulesPerString * mppt.stringsCount * moduleWp), 0);
}, 0);
```

Essa correção é necessária independente do Compositor — afeta qualquer projeto
com N > 1 inversores configurados.

### 3.6 Correção do `HealthCheckWidget` para multi-inversor

O widget no `TopRibbon` hoje valida Voc apenas do primeiro inversor:

```typescript
// TopRibbon.tsx — HealthCheckWidget — correção
// ANTES: valida apenas inverters.ids[0]
// DEPOIS: valida todos os inversores e agrega o resultado

const vocViolations = useTechStore(s =>
  s.inverters.ids.filter(invId => {
    const inv = s.inverters.entities[invId];
    const vocMax = calculateVocMaxForInverter(inv, moduleData, tmin);
    return vocMax > inv.electrical.maxInputVoltage;
  })
);

// Se qualquer inversor viola → semáforo vermelho
// Tooltip: "Inversor 2: Voc 612V excede limite 600V"
```

---

## 4. Casos de Uso Principais

### 4.1 Projeto comercial com 2 inversores iguais (caso mais comum)

```
Consumo: 3.000 kWh/mês → kWp alvo: 21.4 kWp
Módulo: DMEGC 610W → 36 módulos (21.96 kWp)
Inversor ①: PHB 10kW → 18 módulos (10.98 kWp DC, ratio 1.10)
Inversor ②: PHB 10kW → 18 módulos (10.98 kWp DC, ratio 1.10)
Chip agregado: "21.96 kWp DC · Ratio 1.10 · Voc ok · 2 unidades"
```

### 4.2 Projeto com duas águas e inversores diferentes

```
Telhado Norte (15 módulos): MPPT 180° → Inversor ① 8kW, ratio 1.14
Telhado Sul  (12 módulos): MPPT 0°   → Inversor ② 6kW, ratio 1.22
Chip agregado: "16.47 kWp DC · Ratio médio 1.18 · Voc ok · 2 unidades"
```

O chip de Ratio usa o pior caso entre os dois (1.22 está dentro da faixa → chip
verde). Se o Inversor ② fosse configurado com ratio 1.40, o chip ficaria vermelho
mesmo com o ratio médio sendo 1.27.

### 4.3 Distribuição assimétrica de módulos

O integrador pode deliberadamente colocar mais módulos em um inversor (ex: para
otimizar custo em sistemas com orientações homogêneas). O sistema aceita qualquer
distribuição desde que cada inversor individualmente passe na validação elétrica.

---

## 5. Arquivos Afetados

### Modificar

| Arquivo | Mudança |
|---------|---------|
| `[MODIFY] SolarCalculator.ts` | Somar `Pdc_total` de todos os inversores ao invés de usar apenas o primeiro |
| `[MODIFY] ui/panels/TopRibbon.tsx` — `HealthCheckWidget` | Validar Voc e Isc de todos os inversores; tooltip identifica qual inversor tem o problema |
| `[MODIFY] core/stores/systemCompositionSlice.ts` | `inverterBlock` passa a ter chips agregados + array `perInverterStatus[]` |
| `[MODIFY] composer/ComposerBlockInverter.tsx` | Modo resumo: chips agregados. Modo edição: sub-linhas por inversor + botão "Adicionar inversor" |

### Criar

| Arquivo | Propósito |
|---------|-----------|
| `[NEW] composer/ComposerInverterSubRow.tsx` | Sub-linha de um inversor individual dentro do Bloco Inversor expandido |

### Sem alteração

| Arquivo | Motivo |
|---------|--------|
| `core/stores/useTechStore.ts` | Store já suporta N inversores via `inverters: NormalizedCollection<InverterSpec>` |
| `utils/electricalMath.ts` — `calculateStringMetrics` | Já opera por inversor individual; o Compositor apenas chama N vezes |
| `ui/panels/LeftOutliner.tsx` | Já renderiza múltiplos inversores como nós raiz |

---

## 6. Plano de Migração

### Ordem de execução

```
Etapa 1: Correção do SolarCalculator (pdcTotal agregado)
  → Correção de bug imediata; afeta todos os projetos com N > 1 inversores
  → Independente do Compositor

Etapa 2: Correção do HealthCheckWidget (validar todos os inversores)
  → Complementa a Etapa 1; garante que o semáforo reflita a realidade

Etapa 3: systemCompositionSlice — chips agregados + perInverterStatus[]
  → Seletores derivados para o Bloco Inversor multi-unidade

Etapa 4: ComposerInverterSubRow + ComposerBlockInverter modo edição
  → Visualização das sub-linhas por inversor no Compositor

Etapa 5: distributeModulesAcrossInverters em useAutoSizing
  → Distribuição automática ao adicionar segundo inversor via Compositor
```

As Etapas 1 e 2 são correções de bug que podem (e devem) ser implementadas
independentemente do Compositor — elas afetam projetos que já existem com múltiplos
inversores configurados manualmente via LeftOutliner.

### Guardrails

- [ ] Etapa 1 testada com fixture: 2× PHB 10kW, 36 módulos DMEGC 610W → `Pdc_total = 21.96 kWp` (não 10.98 kWp)
- [ ] Etapa 2 testada com fixture: inversor 2 com Voc violado → semáforo vermelho; tooltip identifica "Inversor 2"
- [ ] `perInverterStatus[]` no slice é derivado — não armazena estado novo, apenas lê de `useTechStore`
- [ ] Projeto com 1 inversor não regride — `perInverterStatus` tem length 1, Bloco Inversor se comporta como antes

---

## 7. Avaliação de Riscos

| Risco | Prob. | Sev. | Mitigação |
|-------|:-----:|:----:|-----------|
| Correção do `SolarCalculator` quebra projetos existentes com 1 inversor (resultado muda de 10.98 para 10.98 — mesmo) | Baixa | Nenhuma | Para 1 inversor, o loop produz o mesmo resultado que antes |
| Distribuição automática de módulos produz frações não-inteiras (ex: 35 módulos / 2 inversores = 17.5) | Alta | Baixa | `Math.round()` no primeiro; `totalModules - primeiro` no segundo |
| Chip de Ratio "pior caso" sendo mais restritivo que o necessário | Média | Baixa | Documentar no tooltip: "Pior caso entre N inversores" para transparência |
| Integrador adiciona 3+ inversores: sub-linhas não cabem na viewport do Compositor | Média | Média | Limitar a 4 sub-linhas visíveis; adicionar scroll interno na zona de edição do bloco |
| `perInverterStatus[]` causando re-renders em cascata por ser um array recriado | Alta | Média | Usar `useShallow` (Zustand) para comparação superficial do array |

---

## 8. Critérios de Aceitação

### Funcionais

- [ ] Projeto com 2× PHB 10kW + 36 módulos: `SolarCalculator.pdcTotal = 21.96 kWp` (não 10.98)
- [ ] Bloco Inversor em modo resumo: chip `"Ratio 1.10"` verde, chip `"2 unidades"`, chip `"Voc ok"` — tudo correto
- [ ] Clicar no Bloco Inversor: expande e exibe 2 sub-linhas com chips individuais
- [ ] Inversor 2 com Voc violado: chip "Voc" do bloco fica vermelho com texto `"1 com erro"`; sub-linha ② fica vermelha; tooltip do `HealthCheckWidget` identifica "Inversor ②: Voc 612V > 600V"
- [ ] Botão "+ Adicionar inversor" no modo edição: abre `InverterCatalogDialog` com modelo atual pré-selecionado
- [ ] Após adicionar segundo inversor: módulos são distribuídos proporcionalmente e a distribuição aparece nas sub-linhas

### Técnicos

- [ ] `tsc --noEmit` → EXIT CODE 0
- [ ] Projeto com 1 inversor não regride em nenhuma etapa (regressão verificada em cada etapa)
- [ ] `perInverterStatus[]` não re-cria o array a cada render sem mudança na store (verificar com React DevTools Profiler)

### Engenharia

- [ ] Fixture validada pelo `engenheiro-eletricista-pv`: 2× PHB 10kW, strings 6S1P com DMEGC 610W por inversor → `Voc_max = 6 × 49.8V × [1 + (-0.29/100) × (-5 - 25)] = 298.8V × 1.087 = 324.8V` (< 600V V\_max inversor → verde) ✓
- [ ] Motor de geração gera resultado correto com 2 inversores: `Geração_jan = Pdc_total × HSP_jan × DIAS_jan × PR = 21.96 × 5.2 × 31 × 0.80 ≈ 2,838 kWh` ✓

---

## 9. O que este escopo desbloqueia

| Feature | Desbloqueio |
|---------|-------------|
| **Projetos comerciais reais** | Sistemas acima de ~12 kWp que requerem 2+ inversores se tornam dimensionáveis no Compositor |
| **Telhados com múltiplas orientações** | Cada inversor com azimute diferente por MPPT — caso de uso documentado desde a spec de `MPPTConfig.azimuth` |
| **Unifilar multi-inversor** | O motor de unifilar (spec aguardando) pode agora gerar a topologia correta para N inversores em paralelo |
| **Proposta com BOM correto** | Lista de materiais da proposta passa a listar N inversores com quantidades corretas |
| **Memorial descritivo completo** | Campo "equipamentos instalados" inclui todos os inversores com modelos e potências nominais |

---

## 10. Fora do escopo

- **Inversores em série (micros inversores / otimizadores string)** — arquitetura diferente; cada módulo tem seu próprio inversor. Requer modelo de dados completamente diferente no `useTechStore`
- **Inversores trifásicos com balanceamento de fase** — validação por fase (L1/L2/L3) não está no schema atual do `InverterSpec`; escopo separado
- **Simulação de geração diferenciada por inversor** — hoje a geração é calculada para o sistema todo com um PR e HSP únicos; simulação por sub-arranjo com azimutes diferentes é escopo futuro (requer dados horários, não apenas HSP mensal)
- **Interface de arrastar módulos entre inversores no canvas** — o integrador usa o `LeftOutliner` para isso; drag-and-drop cross-inversor no Compositor é escopo separado

---

## Referências

- Store normalizada: `Especificacao_Tecnica_Refatoracao_Kurupira.md` §3.1
- Schema `InverterSpec` com `mpptConfigs[]`: `Especificacao_Engenharia_Funcional.md` §6.3
- `calculateStringMetrics()`: `electricalMath.ts`
- `HealthCheckWidget` multi-regra: `Especificacao_Dimensionamento_Funcional_Kurupira.md` §4.2
- Bloco Inversor (1 unidade): `spec-compositor-blocos-2026-04-14.md` §3.2.4
- Edição inline do bloco inversor: `spec-edicao-inline-blocos-2026-04-14.md` §3.4
- Norma: NBR 16690:2019 §6.3 (oversize ratio ≤ 1.35 por inversor, não pelo agregado)

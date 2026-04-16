# Spec — Substituição da Árvore do LeftOutliner

**Tipo:** Refatoração Técnica + Feature
**Módulo:** `engineering` — `LeftOutliner`, `useTechStore`, `solarStore`
**Prioridade:** P1 — Crítico
**Responsável (impl.):** `the-builder`
**Revisor (aceitação):** `engenheiro-eletricista-pv`
**Data de criação:** 2026-04-14
**Versão:** 1.0
**Origem:** `Especificacao_P6_4_Topologia_DragDrop.md` (aprovada para planejamento arquitetural)
**Dependência:** `spec-compositor-blocos-2026-04-14` Fase B concluída (o Compositor absorve a navegação de alto nível; a árvore foca em edição granular)

---

## 1. Diagnóstico

### 1.1 O problema do `quantity: N`

O `LeftOutliner` atual representa módulos como uma quantidade numérica abstrata:
`"📦 Módulos (DMEGC 610W) — 24 unid."`. Isso funciona como inventário mas falha
como ferramenta de engenharia: o integrador não consegue mover um módulo específico
de uma string para outra, não vê qual módulo físico (no mapa) corresponde a qual
posição lógica na string, e não pode criar strings selecionando módulos individuais.

A consequência técnica é que a validação elétrica trabalha com médias e totais
(`modulesPerString × stringsCount`) em vez de objetos reais, tornando impossível
calcular mismatch por string, verificar balanceamento entre MPPTs, ou identificar
qual módulo específico está causando um alerta de Voc.

### 1.2 O que o Compositor muda nesta equação

Antes do Compositor, o LeftOutliner era o único lugar onde o integrador via e
gerenciava o sistema como um todo. Com o Compositor existindo, os papéis ficam
claramente divididos:

| Responsabilidade | Compositor | LeftOutliner |
|-----------------|-----------|-------------|
| Avaliação de coerência do sistema | ✅ | — |
| Edição paramétrica rápida (consumo, qtd, modelo) | ✅ | — |
| Configuração granular de strings e MPPTs | — | ✅ |
| Atribuição de módulos individuais a strings | — | ✅ |
| Visualização da topologia elétrica completa | — | ✅ |
| Drag & drop de módulos entre strings | — | ✅ |

Essa divisão significa que a nova árvore **não precisa mais ser o ponto de entrada
do dimensionamento** — esse papel foi para o Compositor. A árvore pode ser o que
sempre deveria ser: um editor de topologia preciso, para quem precisa de controle
granular.

### 1.3 Estado atual do LeftOutliner

A árvore atual tem:
- Inversores como nós raiz com MPPTs como filhos — ✅ funcional
- Strings como nós intermediários com `modulesPerString` numérico — ⚠️ abstrato
- Módulos como uma entrada de catálogo com `quantity` — ❌ não são objetos individuais
- Áreas de instalação como nós separados — ✅ funcional
- Drag & drop básico HTML5 em strings — ⚠️ sem multi-seleção, sem context menu

---

## 2. A Nova Arquitetura: Flat Tree com Pastas Virtuais

### 2.1 Estrutura visual alvo

```
📂 OUTLINER
│
├─ ⚡ PHB 10kW                       ← Inversor (nó raiz)
│   └─ ● MPPT 1                      ← MPPT (subpasta)
│       ├─ ─ String A (10 mód.)       ← String (grupo)
│       │    ├─ ☀ Mod-001             ← Módulo individual
│       │    ├─ ☀ Mod-002
│       │    └─ ...
│       └─ ─ String B (10 mód.)
│
├─ ─ Strings desconectadas            ← Pasta virtual
│    └─ ─ String C (sem MPPT)
│         ├─ ☀ Mod-021
│         └─ ☀ Mod-022
│
└─ □ Módulos livres (4)               ← Pasta virtual
     ├─ ☀ Mod-023
     └─ ☀ Mod-024
```

**Pastas virtuais** são geradas pela UI a partir do estado da store — não são entidades
persistidas. "Strings desconectadas" agrega `LogicalString` com `mpptId: null`.
"Módulos livres" agrega `PlacedModuleLogical` sem `stringId`.

### 2.2 Interações-chave

**Multi-seleção:** `Shift+Click` seleciona range; `Ctrl+Click` toggle individual.
Seleção múltipla ativa o Context Menu via botão direito ou via botão `⋯` no nó.

**Context Menu (nós selecionados):**
- Em módulos livres selecionados: `[+ Criar String com seleção]`
- Em string: `[Renomear]`, `[Mover para MPPT...]`, `[Dissolver string]`
- Em módulo dentro de string: `[Remover da string]`, `[Mover para string...]`

**Drag & Drop:**
- String → MPPT: move a string inteira e todos os seus módulos para o MPPT de destino
- Módulo → Módulos livres: desvincula o módulo da string atual
- Módulo → String diferente: move o módulo para a string de destino
- Módulo → MPPT direto: cria nova string implícita ou usa a última string do MPPT

**Teclado:**
- `Delete` em módulo livre: remove do projeto (volta ao pool)
- `Delete` em string: dissolve a string, módulos voltam para "Módulos livres"
- `Enter` em qualquer nó: abre o `RightInspector` para aquela entidade

---

## 3. Mudanças na Store

### 3.1 Fim do `quantity: N` em módulos

O campo `quantity` no `useTechStore.modules.entities[id]` é substituído por uma
coleção normalizada de módulos individuais.

**Antes:**
```typescript
// useTechStore — estado atual
modules: {
  ids: string[],
  entities: Record<string, {
    id: string,
    catalogItemId: string,
    quantity: number,        // ← será removido
    mpptConfigs: MPPTConfig[]
  }>
}
```

**Depois — nova entidade `LogicalModule`:**
```typescript
// useTechStore — novo slice logicalModules
logicalModules: {
  ids: string[],   // ['lmod-001', 'lmod-002', ...]
  entities: Record<string, LogicalModule>
}

interface LogicalModule {
  id: string;              // 'lmod-001'
  catalogItemId: string;   // ID do ModuleCatalogItem (modelo)
  stringId: string | null; // ID da LogicalString ou null (módulo livre)
  placedModuleId: string | null; // FK para PlacedModule no projectSlice (pode ser null)
  label?: string;          // 'Mod-001' — gerado automaticamente, editável
}
```

O `catalogItemId` aponta para o modelo (`ModuleCatalogItem`) — todos os módulos de
um projeto residencial simples compartilham o mesmo `catalogItemId`. O que os
distingue é o `id` individual (UUID), o `stringId` e o `placedModuleId`.

### 3.2 Nova entidade `LogicalString`

```typescript
// useTechStore — novo slice logicalStrings
logicalStrings: {
  ids: string[],
  entities: Record<string, LogicalString>
}

interface LogicalString {
  id: string;              // 'str-001'
  label: string;           // 'String A' — editável pelo usuário
  mpptId: string | null;   // FK para MPPTConfig ou null (string desconectada)
  inverterId: string | null; // FK para inversor pai (derivado do mpptId, mas útil)
  moduleIds: string[];     // IDs de LogicalModule em ordem de série
  color: string;           // Cor para visualização no canvas 3D (gerada automaticamente)
}
```

A `LogicalString` substitui o campo `mpptConfigs[].modulesPerString × stringsCount`
como fonte de verdade da topologia elétrica. Os campos numéricos do MPPT
(`modulesPerString`, `stringsCount`) tornam-se **derivados** — calculados a partir
do comprimento dos `moduleIds` das strings que apontam para aquele MPPT.

### 3.3 Migração de `mpptConfigs` para modelo derivado

```typescript
// ANTES: useTechStore.inverters.entities[id].mpptConfigs[i]
{
  mpptId: 0,
  modulesPerString: 12,   // ← dado autoritativo
  stringsCount: 2,         // ← dado autoritativo
  azimuth: 180,
  inclination: 15
}

// DEPOIS: mpptConfigs mantém apenas metadados, topology é derivada
{
  mpptId: 0,
  azimuth: 180,
  inclination: 15,
  // modulesPerString e stringsCount são computados:
  // modulesPerString = logicalStrings conectadas a este MPPT
  //   → módulos de qualquer string conectada (assume strings uniformes)
  //   → fallback: max(moduleIds.length) entre as strings do MPPT
  // stringsCount = count(logicalStrings onde mpptId === este MPPT)
}
```

**Compatibilidade retroativa:** Para projetos salvos com o modelo antigo
(`modulesPerString` + `stringsCount`), um migration helper cria `LogicalModule`s e
`LogicalString`s sintéticas ao carregar o projeto:

```typescript
function migrateNumericToLogical(inverter: InverterSpec): void {
  for (const mppt of inverter.mpptConfigs) {
    for (let s = 0; s < mppt.stringsCount; s++) {
      const stringId = `str-${uuid()}`;
      const moduleIds = Array.from({ length: mppt.modulesPerString }, (_, i) => {
        const modId = `lmod-${uuid()}`;
        addLogicalModule({ id: modId, catalogItemId: inverter.moduleId, stringId });
        return modId;
      });
      addLogicalString({ id: stringId, mpptId: mppt.mpptId, moduleIds, label: `String ${s+1}` });
    }
  }
}
```

### 3.4 Ações novas no `useTechStore`

| Ação | Parâmetros | Efeito |
|------|-----------|--------|
| `addLogicalModules(catalogItemId, count)` | id do modelo, quantidade | Cria N `LogicalModule`s livres (sem string) |
| `removeLogicalModule(moduleId)` | id | Remove o módulo; se em string, atualiza `moduleIds` da string |
| `createString(moduleIds, label?)` | array de IDs | Cria `LogicalString`, remove os módulos de "livres" |
| `dissolveString(stringId)` | id | Remove a string; módulos voltam para livres (`stringId = null`) |
| `assignStringToMPPT(stringId, inverterId, mpptId)` | ids | Atualiza `mpptId` e `inverterId` da string |
| `moveModuleToString(moduleId, targetStringId)` | ids | Remove do array da string atual, adiciona no target |
| `reorderModulesInString(stringId, newOrder)` | id, array de IDs | Reordena os módulos (ordem afeta posição física na série) |

---

## 4. Implementação do Componente

### 4.1 Escolha de biblioteca para DnD

A árvore atual usa HTML5 drag & drop nativo. Para a nova versão com multi-seleção,
drop-between-groups e context menu, isso não é suficiente.

**Decisão: `@dnd-kit/core` + `@dnd-kit/sortable`.**

Justificativa: é a biblioteca mais leve do ecossistema React que suporta os requisitos
exatos desta spec (sortable trees com drag entre contêineres distintos, multi-drag,
acessibilidade nativa). Alternativa `react-dnd` foi descartada por ser mais pesada e
por ter DX inferior com TypeScript estrito.

Instalação: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

### 4.2 Arquitetura do componente

```
LeftOutliner.tsx               ← orquestrador: DndContext + SortableContext
  ├── OutlinerSection.tsx       ← seção colapsável (Inversores / Strings desc. / Módulos livres)
  │     └── OutlinerNode.tsx   ← nó genérico (polimórfico por tipo)
  │           ├── InverterNode.tsx
  │           ├── MPPTNode.tsx
  │           ├── StringNode.tsx     ← draggable
  │           └── ModuleNode.tsx     ← draggable
  └── OutlinerContextMenu.tsx  ← portal de context menu
```

### 4.3 `OutlinerNode` — tipos e badges

Cada nó exibe: ícone de tipo + label + badge de contagem ou status.

| Tipo | Ícone | Badge |
|------|-------|-------|
| Inversor | `Cpu` | `N strings` |
| MPPT | `Cable` | `N mód.` |
| String | `Link` | Chip de cor + `N mód.` |
| Módulo livre | `Sun` (opaco) | — |
| Módulo em string | `Sun` (cor da string) | — |

A cor da string é gerada automaticamente quando a string é criada, escolhida de uma
paleta de 12 cores distintas. A mesma cor é usada no canvas 3D para colorir o
`InstancedMesh` dos módulos daquela string (`spec_feedback_visual_strings`).

### 4.4 Performance com projetos grandes

Um projeto comercial de 50 kWp tem ~80 módulos. Com módulos individuais na árvore,
isso é 80+ nós. A preocupação de performance é legítima mas gerenciável:

- Nós de módulo são renderizados apenas quando a string-pai está **expandida**. Por
  padrão, strings começam colapsadas — o integrador expande apenas a que quer editar.
- `React.memo` em `ModuleNode` — re-render apenas quando `moduleId` ou `stringId` mudam.
- Virtualização (`@tanstack/react-virtual`) é reservada para projetos > 200 módulos
  (> 300 kWp). Não é necessária para o caso de uso principal da Neonorte.

---

## 5. Arquivos Afetados

### Criar

| Arquivo | Propósito |
|---------|-----------|
| `[NEW] core/stores/slices/logicalModulesSlice.ts` | Slice normalizado de `LogicalModule` |
| `[NEW] core/stores/slices/logicalStringsSlice.ts` | Slice normalizado de `LogicalString` |
| `[NEW] utils/migrateNumericToLogical.ts` | Helper de migração para projetos salvos |
| `[NEW] ui/panels/outliner/OutlinerNode.tsx` | Nó genérico polimórfico |
| `[NEW] ui/panels/outliner/OutlinerContextMenu.tsx` | Context menu portal |
| `[NEW] ui/panels/outliner/nodes/InverterNode.tsx` | Nó de inversor |
| `[NEW] ui/panels/outliner/nodes/MPPTNode.tsx` | Nó de MPPT |
| `[NEW] ui/panels/outliner/nodes/StringNode.tsx` | Nó de string (draggable) |
| `[NEW] ui/panels/outliner/nodes/ModuleNode.tsx` | Nó de módulo individual (draggable) |

### Modificar

| Arquivo | Mudança |
|---------|---------|
| `[MODIFY] core/stores/useTechStore.ts` | Adicionar `logicalModules` e `logicalStrings` slices; adicionar 8 novas actions; `mpptConfigs` passa a ter campos derivados |
| `[MODIFY] ui/panels/LeftOutliner.tsx` | Reescrever usando `@dnd-kit/core`; importar novos nós; manter a mesma API de seleção de entidade para o `RightInspector` |
| `[MODIFY] utils/electricalMath.ts` — `calculateStringMetrics` | Passar a receber array de `LogicalModule` (módulos reais) em vez de `modulesPerString: number` |
| `[MODIFY] core/stores/systemCompositionSlice.ts` | Atualizar `logicalCount` para usar `logicalStrings` em vez de `mpptConfigs` numérico |
| `[MODIFY] ui/panels/TopRibbon.tsx` — `HealthCheckWidget` | `logicalCount` calculado via `logicalStrings` |

### Depreciar

| Campo | Substituição |
|-------|-------------|
| `InverterSpec.mpptConfigs[i].modulesPerString` | Derivado de `logicalStrings` |
| `InverterSpec.mpptConfigs[i].stringsCount` | Derivado de `logicalStrings` |
| `TechSlice.modules.entities[id].quantity` | Removido; módulos são contados pelo length de `logicalModules.ids` com mesmo `catalogItemId` |

---

## 6. Plano de Migração

### Ordem de execução

```
Etapa 1: logicalModulesSlice + logicalStringsSlice (store pura, sem UI)
  → Store compila; nenhuma UI consome ainda

Etapa 2: migrateNumericToLogical (migration helper)
  → Projetos salvos carregam sem quebrar; módulos e strings sintéticos criados

Etapa 3: Atualizar electricalMath + systemCompositionSlice + HealthCheckWidget
  → Cálculos agora derivam das entidades reais; testes unitários atualizados

Etapa 4: Construir OutlinerNode + nós específicos (sem DnD ainda)
  → Árvore renderiza com estrutura correta mas sem arrastar

Etapa 5: @dnd-kit — drag de string para MPPT
  → Caso de uso mais simples: mover uma string inteira entre MPPTs

Etapa 6: @dnd-kit — drag de módulo individual entre strings
  → Caso de uso avançado; requer sortable dentro de sortable

Etapa 7: Multi-seleção + Context Menu
  → Criação de strings por seleção, dissolver strings, renomear
```

### Guardrails

- [ ] Etapa 2: projeto salvo com `modulesPerString: 6, stringsCount: 2` carrega com 2 `LogicalString` de 6 `LogicalModule` cada — verificar no DevTools
- [ ] Etapa 3: `calculateStringMetrics` retorna os mesmos valores que antes para a migração sintética (fixture de regressão obrigatória antes desta etapa)
- [ ] Nenhuma etapa além da 1 pode ser iniciada sem a anterior comprovadamente compilando com `tsc --noEmit` → EXIT CODE 0
- [ ] `migrateNumericToLogical` é idempotente — rodar duas vezes não duplica módulos

---

## 7. Avaliação de Riscos

| Risco | Prob. | Sev. | Mitigação |
|-------|:-----:|:----:|-----------|
| `logicalModules` com 80 UUIDs tornando o JSON persistido grande | Média | Baixa | 80 objetos pequenos ≈ 20 KB — irrelevante para o limite do backend |
| Migration helper criando strings sintéticas com ordem de módulos incorreta | Alta | Média | Ordem não importa para cálculo elétrico atual; importará no futuro para mismatch por posição — documentar como limitação conhecida |
| DnD com aninhamento `string-dentro-de-MPPT` causando comportamentos imprevisíveis no `@dnd-kit` | Alta | Alta | Implementar etapa 5 (string → MPPT) antes da etapa 6 (módulo → string); as duas usam contextos DnD separados e não se aninham |
| `calculateStringMetrics` quebrar porque espera `number` e recebe array | Alta | Alta | Etapa 3 é explicitamente bloqueante — testes de regressão devem passar antes de qualquer código de UI da árvore nova |
| Integrador com projeto grande (80+ módulos) travando ao abrir a árvore | Baixa | Média | Strings colapsadas por padrão; virtualização é guardrail de performance para fase futura |

---

## 8. Critérios de Aceitação

### Funcionais

- [ ] Projeto com `modulesPerString: 6, stringsCount: 2` carrega e exibe 2 strings com 6 módulos individuais cada
- [ ] Arrastar String A de MPPT 1 para MPPT 2: String A aparece como filha de MPPT 2; cálculo de Voc/Isc atualiza
- [ ] Selecionar 5 módulos livres com Shift+Click → Context Menu → "Criar String": nova string aparece em "Strings desconectadas" com 5 módulos
- [ ] Arrastar módulo individual de String A para String B: String A perde 1 módulo, String B ganha 1; chips do Compositor atualizam
- [ ] Dissolver string: módulos retornam para "Módulos livres"; string some da árvore
- [ ] Projetos sem `logicalModules` no JSON salvo carregam sem erro (migration automática)

### Técnicos

- [ ] `tsc --noEmit` → EXIT CODE 0 em todas as etapas
- [ ] `calculateStringMetrics` com módulos reais retorna resultado idêntico ao calculado com `modulesPerString × stringsCount` para topologia simétrica (fixture de regressão)
- [ ] `@dnd-kit` instalado sem conflito de versão com dependências existentes

### Engenharia

- [ ] `logicalStrings` com 10 módulos em série: `Voc_string = 10 × Voc_módulo × (1 + TempCoeff × (Tmin - 25))` — valor verificado pelo engenheiro-eletricista-pv
- [ ] String com módulos mistos (dois modelos diferentes): `Voc_string = Σ(Voc_i)` — comportamento correto, futura feature de mismatch por módulo fica habilitada por esta infraestrutura

---

## 9. O que este escopo desbloqueia

| Feature | Desbloqueio |
|---------|-------------|
| **Feedback visual de strings no canvas 3D** | `spec_feedback_visual_strings` — a cor por `LogicalString` já está no schema; o canvas precisa apenas ler `logicalModule.stringId → logicalString.color` |
| **Mismatch por posição na string** | Com módulos individuais na store, o motor de simulação pode calcular `Isc_mismatch` comparando módulos adjacentes na mesma string |
| **Diagrama unifilar automático** | O `UnifilarEngine` pode iterar `logicalStrings` para gerar a topologia exata, em vez de reconstruir da contagem numérica |
| **Atribuição física-lógica precisa** | `logicalModule.placedModuleId` cria a FK direta entre módulo lógico (elétrico) e módulo físico (canvas) — base para colorir módulos no mapa pela string a que pertencem |

---

## 10. Fora do escopo

- **Mismatch por módulo individual na simulação de geração** — a infraestrutura de dados é construída aqui, mas o motor de cálculo que a consome é escopo separado
- **Virtualização da árvore para projetos > 200 módulos** — guardrail de performance para fase futura; projetos típicos da Neonorte ficam abaixo deste limite
- **Renomeação de módulos individuais** — `label` existe no schema mas a UI de edição de label é escopo separado
- **Reordenação manual de módulos dentro da string via drag** — `reorderModulesInString` existe nas actions mas a UI de arrastar-para-reordenar dentro da string não está neste escopo

---

## Referências

- Spec arquitetural P6.4: `.agent/concluido/Especificacao_P6_4_Topologia_DragDrop/Especificacao_P6_4_Topologia_DragDrop.md`
- Spec de feedback visual de strings: `.agent/aguardando/spec_feedback_visual_strings.md`
- Normalização Zustand: `docs/Arquitetura SaaS Fotovoltaica Web Profunda.md` §4
- Mapa de interface: `docs/interface/mapa-dimensionamento.md` §2
- `calculateStringMetrics`: `utils/electricalMath.ts`
- Norma: NBR 16690:2019 §6.3 (Voc por string = N_série × Voc_módulo × fator térmico)

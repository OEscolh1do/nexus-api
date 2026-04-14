# Spec — Edição Inline nos Blocos do Compositor

**Tipo:** Feature Nova (extensão da spec-compositor-blocos-2026-04-14)
**Módulo:** `engineering` — `ComposerCanvasView`, `ComposerBlock.*`
**Prioridade:** P1 — Crítico
**Responsável (impl.):** `the-builder`
**Revisor (aceitação):** `engenheiro-eletricista-pv` + `design-lead`
**Data de criação:** 2026-04-14
**Versão:** 1.0
**Origem:** spec-compositor-blocos-2026-04-14 § Fora do Escopo (item explícito)
**Dependência direta:** `spec-compositor-blocos-2026-04-14` — Fase C concluída

---

## 1. Diagnóstico

### 1.1 A tensão fundamental

O Compositor de Blocos foi especificado como vista de **avaliação**: o integrador
vê o sistema como um todo, identifica lacunas, e navega para os painéis
especializados (`RightInspector`, canvas Leaflet) para editar. Isso é correto como
arquitetura — mas cria uma fricção desnecessária para os ajustes mais comuns.

O integrador olha para o bloco do Módulo FV, vê o chip "6 módulos" em âmbar e quer
mudar para 8. Para isso ele precisa: fechar o Compositor mentalmente → lembrar que
módulos ficam no LeftOutliner → selecionar o nó certo → editar no RightInspector →
voltar para o Compositor para confirmar que o chip ficou verde.

Quatro interações para uma mudança de um número.

O `RightInspector` faz sentido para edições complexas: trocar o modelo do inversor,
reconfigurar MPPTs, ajustar vértices de polígono. Mas para os ajustes paramétricos
mais frequentes — quantidade de módulos, consumo médio, fator de crescimento — a
edição deveria acontecer diretamente no bloco.

### 1.2 O que muda e o que não muda

Esta spec não converte o Compositor em editor completo. O princípio permanece:
**avaliação no Compositor, edição complexa no especialista**. O que muda é o
critério de "complexo": campos com um único valor numérico ou textual simples são
editáveis inline. Ações que envolvem seleção de catálogo, geometria, ou configuração
de sub-entidades (MPPTs individuais) continuam no especialista.

A distinção concreta:

| Ação | Onde fica | Critério |
|------|-----------|---------|
| Alterar quantidade de módulos | Inline no bloco | Campo numérico simples |
| Trocar o modelo do módulo | Overlay de catálogo disparado pelo bloco | Envolve seleção em lista |
| Alterar consumo médio mensal | Inline no bloco | Campo numérico simples |
| Editar as 12 faturas individualmente | RightInspector / ConsumptionView | 12 campos + sazonalidade |
| Alterar fator de crescimento | Inline no bloco | Campo numérico simples |
| Configurar strings por MPPT | RightInspector modo inverter | Sub-entidades (N MPPTs) |
| Alterar o modelo do inversor | Overlay de catálogo disparado pelo bloco | Envolve seleção em lista |

---

## 2. Modelo de Interação: Bloco com Dois Modos

Cada bloco do Compositor tem dois modos:

**Modo Resumo (padrão):** O que existe hoje — header com título e resumo, body com
chips de status. Somente leitura.

**Modo Edição (ao clicar no bloco):** O bloco se expande verticalmente revelando uma
zona de edição com os campos inline. Os chips de status continuam visíveis acima da
zona de edição, atualizando em tempo real enquanto o integrador digita.

```
MODO RESUMO                         MODO EDIÇÃO
┌─────────────────────────────┐     ┌─────────────────────────────┐
│ [ícone] Módulo FV   6×610W  │     │ [ícone] Módulo FV   6×610W  │
│ [3.66kWp] [Voc 299V] [ok]   │     │ [3.66kWp] [Voc 299V] [ok]   │
└─────────────────────────────┘     ├─────────────────────────────┤
                                    │ Modelo    [DMEGC 610W    ▼] │
         clicar ───────────────►    │ Qtd.      [    6         ↑↓]│
                                    │ Strings   [    1         ↑↓]│
                                    │                             │
                                    │ [Fechar]    [Mais opções →] │
                                    └─────────────────────────────┘
```

A transição entre modos usa `max-height` CSS (padrão do `PanelGroup` já existente no
projeto). Apenas um bloco pode estar em modo edição por vez — abrir um fecha o
anterior.

---

## 3. Campos por Bloco

### 3.1 Bloco Consumo — campos inline

| Campo | Tipo de controle | Action | Observação |
|-------|-----------------|--------|-----------|
| Consumo médio mensal | `PropRowEditable` (number, kWh) | `solarStore.setAvgConsumption(val)` | Alternativa rápida às 12 faturas |
| Fator de crescimento | `PropRowEditable` (number %, 0–50) | `journeySlice.setLoadGrowthFactor(val)` | 0 = sem acréscimo |
| Tarifa | `PropRowEditable` (number R$/kWh) | `solarStore.setTariffRate(val)` | Reedita sem abrir o modal de cliente |

Botão "Mais opções →" abre o `ConsumptionCanvasView` completo com as 12 faturas
mensais individuais.

### 3.2 Bloco Módulo FV — campos inline

| Campo | Tipo de controle | Action | Observação |
|-------|-----------------|--------|-----------|
| Modelo | Select inline (dropdown) com busca | `useTechStore.replaceModuleModel(id, newModelId)` | Abre `ModuleCatalogDialog` ao clicar — não é dropdown nativo |
| Quantidade | `PropRowEditable` (number, inteiro ≥ 1) | `useTechStore.setModuleQuantity(id, val)` | Recalcula kWp instalado em tempo real |
| Séries por string | `PropRowEditable` (number, 1–30) | `updateMPPTConfig(invId, mpptId, { modulesPerString: val })` | Propaga para validação elétrica |

**Detalhe do campo Modelo:** Ao clicar no campo "Modelo", não abre um `<select>`
nativo — abre o `ModuleCatalogDialog` existente em modo de troca (overlay flutuante
sobre o Compositor). Ao confirmar a seleção, o dialog fecha e o campo exibe o novo
modelo. Esse padrão reutiliza o dialog existente sem duplicar lógica de catálogo.

Botão "Mais opções →" seleciona o nó do módulo no `LeftOutliner` e abre o
`RightInspector` em modo `module`.

### 3.3 Bloco Arranjo Físico — campos inline

| Campo | Tipo de controle | Action | Observação |
|-------|-----------------|--------|-----------|
| Auto-Layout | Botão de ação | `projectSlice.autoLayoutArea(firstAreaId)` | Preenche a primeira área com os módulos configurados |
| Azimute solar | `PropRowEditable` (number, 0–360°) | `solarStore.setAzimuth(val)` | Azimute solar global (diferente do azimute físico da área) |
| Inclinação (°) | `PropRowEditable` (number, 0–90°) | `solarStore.setInclination(val)` | Metadado para cálculo de geração |

O bloco de arranjo tem natureza diferente dos outros — seus campos mais importantes
são ações (Auto-Layout) e metadados de simulação, não parâmetros de dimensionamento.
A edição granular do polígono permanece exclusiva no canvas Leaflet.

Botão "Editar no mapa →" (já especificado na spec do bloco de arranjo) permanece
como saída principal para edição complexa.

### 3.4 Bloco Inversor — campos inline

| Campo | Tipo de controle | Action | Observação |
|-------|-----------------|--------|-----------|
| Modelo | Abre `InverterCatalogDialog` ao clicar | `useTechStore.replaceInverterModel(id, newModelId)` | Mesmo padrão do campo Modelo do módulo |
| Strings por MPPT | `PropRowEditable` (number, 1–10) | `updateMPPTConfig(invId, mpptId, { stringsCount: val })` | Atualiza Isc total no MPPT |
| Módulos por string | `PropRowEditable` (number, 1–30) | `updateMPPTConfig(invId, mpptId, { modulesPerString: val })` | Atualiza Voc da string |

**Nota sobre multi-MPPT:** Quando o inversor tem mais de 1 MPPT, os campos "Strings
por MPPT" e "Módulos por string" editam o MPPT 1 por padrão, com um indicador
`"MPPT 1 de N"` e setas de navegação para trocar entre MPPTs sem sair do bloco.
Para configurações assimétricas complexas (cada MPPT com configuração diferente),
o botão "Mais opções →" navega para o `RightInspector` modo `inverter`.

Botão "Mais opções →" seleciona o nó do inversor no `LeftOutliner` e abre o
`RightInspector` em modo `inverter`.

---

## 4. Especificação Técnica

### 4.1 Estado de edição: `composerEditingBlockId`

Um único campo no `systemCompositionSlice` controla qual bloco está em modo edição:

```typescript
// Adição ao systemCompositionSlice.ts
interface SystemCompositionState {
  // ... campos existentes ...
  editingBlockId: 'consumption' | 'module' | 'arrangement' | 'inverter' | null;
  setEditingBlock: (id: SystemCompositionState['editingBlockId']) => void;
}
```

Regra: `setEditingBlock(id)` — se `id === editingBlockId` atual, fecha (set null).
Se diferente, troca. Nunca dois blocos abertos simultaneamente.

Esse campo vive no slice como **estado de UI efêmero** — não é persistido com o
projeto (sem entrada no `partialize` do Zundo). Fechar e reabrir o Compositor sempre
começa com todos os blocos no modo resumo.

### 4.2 Reutilização do `PropRowEditable`

O `PropRowEditable` já existe no `RightInspector.tsx` (linhas 640–693) com
comportamento completo: `blur`/`Enter` confirmam, `Escape` cancela, limites `min`/
`max` aplicados antes de despachar a action. Esta spec o extrai para um componente
compartilhado:

```
src/modules/engineering/ui/components/PropRowEditable.tsx  ← MOVER (extrair do RightInspector)
```

Após a extração, o `RightInspector.tsx` importa do novo caminho compartilhado.
Nenhuma alteração de comportamento — apenas mudança de localização.

### 4.3 Componente `BlockEditZone`

Cada bloco que suporta edição inline ganha um `BlockEditZone` — a zona que aparece
e desaparece conforme `editingBlockId`:

```typescript
// src/modules/engineering/ui/panels/canvas-views/composer/BlockEditZone.tsx

interface BlockEditZoneProps {
  blockId: 'consumption' | 'module' | 'arrangement' | 'inverter';
  children: React.ReactNode;  // campos PropRowEditable específicos do bloco
  onMoreOptions: () => void;  // navega para o especialista
  moreOptionsLabel: string;   // ex: "Editar faturas →", "Configurar MPPTs →"
}
```

A zona usa `max-height` transition para animar a expansão — mesmo mecanismo do
`PanelGroup.tsx` já existente (SPEC-002). Reutilizar o padrão CSS, não criar novo.

### 4.4 Abertura dos dialogs de catálogo a partir do bloco

Quando o integrador clica no campo "Modelo" de qualquer bloco, o Compositor precisa
abrir o `ModuleCatalogDialog` ou `InverterCatalogDialog` sem desmontá-lo. O dialog
é um overlay independente — não substitui nem empilha sobre o Compositor.

O mecanismo usa o `uiStore` existente:

```typescript
// uiStore — adição mínima
openCatalogDialog: (
  type: 'module' | 'inverter',
  mode: 'add' | 'replace',
  targetId?: string   // ID do equipamento a ser substituído (modo replace)
) => void;
```

O `ComposerCanvasView` escuta `uiStore.catalogDialogOpen` e renderiza o dialog
como portal no topo do stack. Ao confirmar a seleção, o dialog dispara a action
adequada (`replaceModuleModel` ou `replaceInverterModel`) e fecha.

`replaceModuleModel` e `replaceInverterModel` são duas actions novas no
`useTechStore` que substituem o modelo mantendo a quantidade e a topologia de
strings intactas.

### 4.5 Especificação: `replaceModuleModel`

```typescript
// useTechStore.ts — action nova
replaceModuleModel: (currentModuleId: string, newModel: ModuleCatalogItem) => void
```

Comportamento:
1. Encontra o módulo pelo `currentModuleId` no `modules.entities`
2. Substitui apenas os campos elétricos e físicos pelo `newModel`
3. Mantém `quantity`, `stringAssignments`, e posição no `LeftOutliner`
4. Recalcula chips do bloco via seletor derivado (sem ação adicional)
5. Dispara validação elétrica via `useElectricalValidation` (já existente)

Casos de borda:
- O novo módulo tem Voc que excede o inversor atual → chips ficam vermelhos
  imediatamente; o integrador vê o problema sem sair do Compositor
- O novo módulo é fisicamente maior → `PlacedModule`s existentes no canvas podem
  ficar fora dos limites da `InstallationArea`; o `HealthCheckWidget` exibe aviso
  de inconsistência física (comportamento já especificado)

---

## 5. Arquivos Afetados

### Criar

| Arquivo | Propósito |
|---------|-----------|
| `[NEW] ui/components/PropRowEditable.tsx` | Extração do `PropRowEditable` do `RightInspector` para uso compartilhado |
| `[NEW] composer/BlockEditZone.tsx` | Container animado de zona de edição; reutiliza padrão CSS do `PanelGroup` |

### Modificar

| Arquivo | Mudança |
|---------|---------|
| `[MODIFY] ui/panels/RightInspector.tsx` | Substituir definição local de `PropRowEditable` por import do novo caminho compartilhado; sem alteração de comportamento |
| `[MODIFY] core/stores/systemCompositionSlice.ts` | Adicionar `editingBlockId` e `setEditingBlock` |
| `[MODIFY] core/stores/uiStore.ts` | Adicionar `openCatalogDialog` com `type`, `mode`, `targetId` |
| `[MODIFY] core/stores/useTechStore.ts` | Adicionar `replaceModuleModel` e `replaceInverterModel` |
| `[MODIFY] composer/ComposerBlockConsumption.tsx` | Adicionar `BlockEditZone` com campos de consumo, tarifa, fator de crescimento |
| `[MODIFY] composer/ComposerBlockModule.tsx` | Adicionar `BlockEditZone` com campos de modelo, quantidade, séries |
| `[MODIFY] composer/ComposerBlockInverter.tsx` | Adicionar `BlockEditZone` com campos de modelo, strings/MPPT, módulos/string + navegação multi-MPPT |
| `[MODIFY] composer/ComposerBlockArrangement.tsx` | Adicionar `BlockEditZone` com botão Auto-Layout e campos de azimute/inclinação |
| `[MODIFY] canvas-views/ComposerCanvasView.tsx` | Escutar `uiStore.catalogDialogOpen` e renderizar dialogs de catálogo como portal |

### Sem alteração

| Arquivo | Motivo |
|---------|--------|
| `components/ModuleCatalogDialog.tsx` | Consumido via portal pelo Compositor; sem alteração interna |
| `components/InverterCatalogDialog.tsx` | Idem |
| `ui/panels/LeftOutliner.tsx` | Não tocado; botão "Mais opções →" navega para ele via `uiStore.setSelectedEntity` |

---

## 6. Plano de Migração

### Ordem de execução

```
Etapa 1: Extrair PropRowEditable para caminho compartilhado
  → RightInspector continua funcionando (apenas muda o import)
  → Compositor pode importar o componente

Etapa 2: BlockEditZone + editingBlockId no slice
  → Animação de expansão funcionando; blocos expandem mas sem campos ainda

Etapa 3: replaceModuleModel + replaceInverterModel no useTechStore
  → Actions prontas antes dos campos que as disparam

Etapa 4: openCatalogDialog no uiStore + portal no ComposerCanvasView
  → Dialogs de catálogo abríveis a partir do Compositor

Etapa 5: Campos inline por bloco (um bloco por vez)
  → Consumo → Módulo → Arranjo → Inversor
  → Cada bloco testado individualmente antes de avançar
```

### Guardrails

- [ ] Extração do `PropRowEditable` validada com `tsc --noEmit` antes de qualquer uso no Compositor
- [ ] `editingBlockId` não entra no `partialize` do Zundo — estado de UI, não de projeto
- [ ] `replaceModuleModel` testada com fixture: módulo DMEGC 610W → Canadian HiKu6 550W; verificar que `quantity` e `stringAssignments` sobrevivem
- [ ] Dialogs de catálogo não desmontam o Compositor ao abrir (verificar com React DevTools que `ComposerCanvasView` permanece montado durante o overlay)

---

## 7. Avaliação de Riscos

| Risco | Prob. | Sev. | Mitigação |
|-------|:-----:|:----:|-----------|
| `PropRowEditable` extraído quebra o `RightInspector` por import circular | Baixa | Alta | Mover para `ui/components/` (fora de `panels/`) elimina o risco de circularidade |
| `replaceModuleModel` descarta silenciosamente assignamentos de string | Média | Alta | Implementar preservando `stringAssignments`; teste com fixture obrigatório antes da Etapa 5 |
| Dialog de catálogo aberto a partir do Compositor fecha o estado de edição do bloco | Média | Baixa | `editingBlockId` não é resetado ao abrir o dialog — o bloco permanece em modo edição quando o dialog fechar |
| Animação de expansão dos blocos causando layout shift nos conectores do Compositor | Média | Baixa | Conectores usam `position: relative` com altura dinâmica — testar com bloco mais longo (Inversor com multi-MPPT) |
| Integrador confunde "editar inline" com "editar completo" e não descobre os campos avançados | Alta | Baixa | Botão "Mais opções →" sempre visível no rodapé da `BlockEditZone`; label contextual por bloco |

---

## 8. Critérios de Aceitação

### Funcionais

- [ ] Clicar no Bloco Módulo FV alterna para modo edição; clicar novamente fecha
- [ ] Abrir o Bloco Inversor enquanto o Bloco Módulo está aberto fecha o Módulo automaticamente
- [ ] Alterar quantidade de módulos no bloco atualiza o chip `kWp instalado` em tempo real (sem submit explícito — ao blur/Enter)
- [ ] Clicar em "Modelo" no Bloco Módulo abre o `ModuleCatalogDialog`; confirmar troca atualiza o chip de modelo sem fechar o Compositor
- [ ] Botão "Mais opções →" no Bloco Inversor seleciona o nó correto no `LeftOutliner` e abre o `RightInspector` em modo `inverter`
- [ ] `Escape` dentro de qualquer `PropRowEditable` cancela a edição sem disparar a action (comportamento existente preservado)
- [ ] Undo (`Ctrl+Z`) reverte a última edição feita via bloco (actions estão no domínio do Zundo)

### Técnicos

- [ ] `tsc --noEmit` → EXIT CODE 0 após cada etapa
- [ ] `editingBlockId` ausente do histórico de Undo (verificar que não entra no `partialize`)
- [ ] `PropRowEditable` em `ui/components/` sem import circular (verificar com `madge --circular`)

### Engenharia

- [ ] `replaceModuleModel` com DMEGC 610W → Canadian HiKu6 550W: chips de Voc e kWp atualizam corretamente; `quantity` mantida; validação elétrica roda automaticamente
- [ ] Campo "Módulos por string" no Bloco Inversor: alterar de 6 para 7 atualiza chip "Voc máx" imediatamente (Voc_max = 7 × 49.8V = 348.6V → verificar contra V_max inversor)

---

## 9. O que este escopo desbloqueia

| Feature | Desbloqueio |
|---------|-------------|
| **Aprovação do projeto no Compositor** | Com edição inline, o integrador pode fechar todas as lacunas sem sair do Compositor — habilitando o botão "Aprovar sistema" diretamente na vista |
| **Uso mobile do Compositor** | Edição inline reduz drasticamente a necessidade de navegar entre painéis — o Compositor num tablet ou celular passa a ser suficiente para o ciclo de ajuste + aprovação |
| **Demo ao cliente** | O integrador pode apresentar o projeto ao cliente e fazer ajustes em tempo real na vista de blocos, sem expor a complexidade da árvore e do Inspector |

---

## 10. Fora do escopo

- **Edição das 12 faturas mensais individualmente no bloco** — `ConsumptionCanvasView` continua sendo o lugar correto para isso; o campo de consumo médio no bloco é uma entrada rápida alternativa
- **Configuração de MPPTs assimétricos inline** — quando cada MPPT tem configuração diferente, o `RightInspector` modo `inverter` é necessário; o bloco expõe apenas o MPPT 1 com navegação simples
- **Criação de novos inversores ou módulos a partir do bloco** — o bloco edita entidades existentes; para adicionar novos equipamentos, o LeftOutliner continua sendo o ponto de entrada
- **Persistência do estado de edição (`editingBlockId`) entre sessões** — deliberadamente efêmero; cada abertura do Compositor começa limpa

---

## Referências

- `PropRowEditable` existente: `RightInspector.tsx` linhas 640–693
- `PanelGroup` com `max-height` transition: `SPEC-002-collapsible-panel-container.md`
- `ModuleCatalogDialog` e `InverterCatalogDialog`: `spec-compositor-blocos-2026-04-14` §4.4 + `Especificacao_P4_Catalogos_Kurupira.md`
- `updateMPPTConfig`: `useTechStore.ts` linha 70 (action existente)
- Compositor de Blocos (dependência): `spec-compositor-blocos-2026-04-14.md`
- Bloco de Arranjo Físico (dependência): `spec-bloco-arranjo-fisico-2026-04-14.md`
- Zundo `partialize`: `Arquitetura SaaS Engenharia WebGL Profunda.md`

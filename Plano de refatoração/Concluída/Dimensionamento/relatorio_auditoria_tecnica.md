# Relatório de Auditoria Técnica: Pré-condições Arquiteturais — Kurupira

**Data:** 22/03/2026
**Referência:** [Arquitetura SaaS Engenharia WebGL Profunda](file:///d:/Reposit%C3%B3rio_Pessoal/SaaS%20Projects/Neonorte/Neonorte/docs/Arquitetura%20SaaS%20Engenharia%20WebGL%20Profunda.md)

---

## Pergunta 1: O `solarStore.ts` usa estado aninhado ou normalizado?

**Resposta: Estado baseado em arrays — não normalizado.**

Todos os quatro slices foram auditados. Nenhum utiliza a estrutura `{ entities: Record<string, T>, ids: string[] }` recomendada pelo documento de referência. O padrão observado é `T[]` com mutações via `.map()` e `.filter()`.

### Evidências por Slice

| Slice | Campo | Estrutura | Evidência |
|-------|-------|-----------|-----------|
| [techSlice.ts](file:///d:/Reposit%C3%B3rio_Pessoal/SaaS%20Projects/Neonorte/Neonorte/kurupira/frontend/src/core/state/slices/techSlice.ts) | `modules` | `ModuleSpecs[]` | [L22](file:///d:/Reposit%C3%B3rio_Pessoal/SaaS%20Projects/Neonorte/Neonorte/kurupira/frontend/src/core/state/slices/techSlice.ts#L22): declaração como array |
| techSlice.ts | `inverters` | `InverterSpecs[]` | [L25](file:///d:/Reposit%C3%B3rio_Pessoal/SaaS%20Projects/Neonorte/Neonorte/kurupira/frontend/src/core/state/slices/techSlice.ts#L25): declaração como array |
| techSlice.ts | `updateModuleQty` | `.map()` full-scan | [L156-158](file:///d:/Reposit%C3%B3rio_Pessoal/SaaS%20Projects/Neonorte/Neonorte/kurupira/frontend/src/core/state/slices/techSlice.ts#L156-L158): itera sobre **todos** os módulos para atualizar um campo de **um** módulo |
| [clientSlice.ts](file:///d:/Reposit%C3%B3rio_Pessoal/SaaS%20Projects/Neonorte/Neonorte/kurupira/frontend/src/core/state/slices/clientSlice.ts) | `simulatedItems` | `LoadItem[]` | [L50](file:///d:/Reposit%C3%B3rio_Pessoal/SaaS%20Projects/Neonorte/Neonorte/kurupira/frontend/src/core/state/slices/clientSlice.ts#L50): declaração como array |
| clientSlice.ts | `updateLoadItem` | `.map()` full-scan | [L150-153](file:///d:/Reposit%C3%B3rio_Pessoal/SaaS%20Projects/Neonorte/Neonorte/kurupira/frontend/src/core/state/slices/clientSlice.ts#L150-L153): mesmo padrão do techSlice |
| [electricalSlice.ts](file:///d:/Reposit%C3%B3rio_Pessoal/SaaS%20Projects/Neonorte/Neonorte/kurupira/frontend/src/core/state/slices/electricalSlice.ts) | `bosInventory` | `BOSInventory \| null` | [L23](file:///d:/Reposit%C3%B3rio_Pessoal/SaaS%20Projects/Neonorte/Neonorte/kurupira/frontend/src/core/state/slices/electricalSlice.ts#L23): objeto monolítico contendo 3 arrays internos |
| [bos.schemas.ts](file:///d:/Reposit%C3%B3rio_Pessoal/SaaS%20Projects/Neonorte/Neonorte/kurupira/frontend/src/core/schemas/bos.schemas.ts) | `BOSInventory` | `dcCables[]`, `acCables[]`, `breakers[]` | [L121-130](file:///d:/Reposit%C3%B3rio_Pessoal/SaaS%20Projects/Neonorte/Neonorte/kurupira/frontend/src/core/schemas/bos.schemas.ts#L121-L130): 3 arrays aninhados dentro de um único objeto |
| [engineeringSlice.ts](file:///d:/Reposit%C3%B3rio_Pessoal/SaaS%20Projects/Neonorte/Neonorte/kurupira/frontend/src/core/state/slices/engineeringSlice.ts) | `engineeringData` | Objeto flat (shallow) | [L45-50](file:///d:/Reposit%C3%B3rio_Pessoal/SaaS%20Projects/Neonorte/Neonorte/kurupira/frontend/src/core/state/slices/engineeringSlice.ts#L45-L50): ✅ Único slice sem arrays — não apresenta risco |

### Análise de Risco

> [!WARNING]
> Ao reintegrar `ModuleInventory` e `InverterInventory` no `LeftOutliner`, qualquer chamada a `updateModuleQty(id, qty)` gerará uma nova referência do array `modules[]` inteiro. Componentes que consomem `selectModules` via `useSolarStore(selectModules)` serão **todos** re-renderizados, mesmo que apenas 1 módulo tenha mudado.

O `BOSInventory` é agravante: como é um objeto monolítico com 3 arrays internos, um `patchBOSInventory({ dcCables: [...] })` gera uma nova referência do `bosInventory` inteiro, disparando re-render em qualquer componente assinando `selectBOSInventory`.

**Severidade: P1 — Risco latente. Não bloqueia o P0, mas será o primeiro gargalo na Fase 2.**

---

## Pergunta 2: O `WorkspaceLayout.tsx` tem `ResizeObserver` no canvas?

**Resposta: Não. O layout usa apenas CSS Grid estático.**

### Evidências

| Arquivo | Achado | Evidência |
|---------|--------|-----------|
| [WorkspaceLayout.tsx](file:///d:/Reposit%C3%B3rio_Pessoal/SaaS%20Projects/Neonorte/Neonorte/kurupira/frontend/src/modules/engineering/ui/layout/WorkspaceLayout.tsx) | CSS Grid com colunas dinâmicas via `useState` | [L61-65](file:///d:/Reposit%C3%B3rio_Pessoal/SaaS%20Projects/Neonorte/Neonorte/kurupira/frontend/src/modules/engineering/ui/layout/WorkspaceLayout.tsx#L61-L65): `gridCols` muda quando painéis abrem/fecham |
| WorkspaceLayout.tsx | Nenhum `ResizeObserver` | Sem import ou instância de `ResizeObserver` em todo o arquivo |
| [CenterCanvas.tsx](file:///d:/Reposit%C3%B3rio_Pessoal/SaaS%20Projects/Neonorte/Neonorte/kurupira/frontend/src/modules/engineering/ui/panels/CenterCanvas.tsx) | Placeholder HTML puro, sem motor gráfico | [L91-94](file:///d:/Reposit%C3%B3rio_Pessoal/SaaS%20Projects/Neonorte/Neonorte/kurupira/frontend/src/modules/engineering/ui/panels/CenterCanvas.tsx#L91-L94): texto indica que "Motor Leaflet/WebGL será integrado aqui" |
| CenterCanvas.tsx | `React.memo()` aplicado | [L114-115](file:///d:/Reposit%C3%B3rio_Pessoal/SaaS%20Projects/Neonorte/Neonorte/kurupira/frontend/src/modules/engineering/ui/panels/CenterCanvas.tsx#L114-L115): ✅ decisão correta para isolamento futuro |

### Análise de Risco

O `CenterCanvas` hoje é um `div` com placeholder. **O risco de distorção de aspect ratio não existe agora** — ele se materializa exclusivamente no momento em que o motor Leaflet/WebGL for integrado. O que existe hoje é a **ausência da infraestrutura** que o documento de referência exige:

1. `ResizeObserver` no contêiner pai do canvas (não no canvas)
2. Acoplamento da operação de resize ao `requestAnimationFrame`
3. `<Canvas resize={{ debounce: 0 }}>` se R3F for utilizado

**Severidade: P2 — Risco futuro. Deve ser endereçado como pré-condição da integração WebGL, não agora.**

---

## Pergunta 3: Há alguma decisão tomada sobre Undo/Redo no projeto?

**Resposta: Não. Ausência total de infraestrutura ou decisão.**

### Evidências

| Verificação | Resultado |
|-------------|-----------|
| `grep -r "undo\|redo\|zundo\|CommandPattern"` em `kurupira/frontend/src/` | **Zero resultados** |
| Middleware no `solarStore.ts` | Apenas `devtools` e `persist` — nenhum middleware de histórico |
| Dependências do projeto (`package.json`) | Não verificado — mas a ausência de qualquer referência no código confirma que não está instalado |

### Análise de Impacto

O documento de referência posiciona esta decisão como **binária e estruturante**:

| Critério | Command Pattern | Immer Patches (zundo) |
|----------|----------------|----------------------|
| Memória | Mínima — armazena apenas deltas vetoriais | Baixa — armazena patches JSON, não snapshots |
| Código por feature | Alto — cada action precisa de `execute()` + `undo()` | Baixo — interceptação automática via middleware |
| Compatibilidade com Zustand atual | Baixa — exige refatorar todas as actions | **Alta** — middleware se acopla ao store existente |
| Agrupamento de ações | Nativo (batch commands) | Requer configuração manual (`handleSet`) |
| Debuggability | Superior — cada comando é rastreável | Moderada — patches são legíveis mas menos expressivos |

### Recomendação

Dado que o projeto já usa **Zustand com slices compostos e `persist` middleware**, a rota de **menor fricção** é `zundo` (Immer Patches). Ela se acopla ao `solarStore` sem refatorar as actions existentes. O Command Pattern seria superior em isolamento e memória, mas exigiria reescrever todas as actions dos 4 slices — um custo desproporcional nesta fase.

**Severidade: P1 — Decisão bloqueante para a Fase 2. Deve ser tomada antes da implementação de `StringConfigurator` e `SystemLossesCard`.**

---

## Quadro de Severidades

| # | Achado | Severidade | Gatilho |
|---|--------|------------|---------|
| 1 | Estado não normalizado (arrays com `.map()`) | **P1** | Reintegração de componentes no LeftOutliner (Fase 2) |
| 2 | Ausência de `ResizeObserver` no canvas | **P2** | Integração do motor Leaflet/WebGL |
| 3 | Nenhuma decisão sobre Undo/Redo | **P1** | Formulários de edição paramétrica (Fase 2) |

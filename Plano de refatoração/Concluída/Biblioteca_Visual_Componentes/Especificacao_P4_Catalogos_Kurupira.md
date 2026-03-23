# Especificação Técnica P4: Refatoração dos Catálogos de Equipamentos
## Kurupira Frontend — Biblioteca Visual de Componentes

**Status:** Planejamento Finalizado
**Revisão:** R3 (pós-auditoria cruzada profunda)
**Data:** 23 de Março de 2026

---

## 1. Contexto e Diagnóstico

O sistema atual possui **três definições concorrentes** do que é um Módulo Fotovoltaico:

| # | Tipo | Arquivo | Formato | Usado por |
|---|------|---------|---------|-----------|
| 1 | `ModuleCatalogItem` | `core/schemas/moduleSchema.ts` | **Aninhado** (`electrical.pmax`, `physical.widthMm`) | `MODULE_DB` (28 itens) |
| 2 | `ModuleSpecs` | `core/schemas/equipment.schemas.ts` | **Achatado** (`power`, `vmp`, `area`) | `techSlice`, `solarStore`, 15+ consumidores |
| 3 | `PVModule` | `hooks/useTechCalculations.ts` | **Aninhado alternativo** (`electrical.pmax`, `dimensions.length`) | `ModuleCatalogDialog`, `useTechCalculations` |

O `InMemoryEquipmentRepo.ts` tenta converter o formato #1 para #2, mas usa chaves CSV legadas (`data["Modelo"]`, `data["Potência"]`) que **não existem** no banco de dados atual (que já migrou para o formato aninhado). Executar o repositório hoje causa crash imediato.

Os diálogos de catálogo (`ModuleCatalogDialog` e `InverterCatalogDialog`) usam arrays vazios hardcoded e estão totalmente desconectados.

---

## 2. Decisão Arquitetural: Qual Tipo Sobrevive?

**Veredito: `ModuleCatalogItem` (formato #1) é promovido a Single Source of Truth.**

**Justificativa:**
- É o formato que o banco de dados (`MODULE_DB`) já usa e valida via Zod.
- Possui separação semântica (`electrical`, `physical`) alinhada com a arquitetura "Leaflet-first + WebGL" (cada bloco alimenta um motor diferente).
- Já inclui o slot `asset: { glbAsset }` para modelos 3D futuros.

**Consequências:**
- `ModuleSpecs` (formato #2 achatado) será **depreciado** e removido após migração dos 15+ consumidores.
- `PVModule` (formato #3) será **eliminado** imediatamente; `useTechCalculations` passará a consumir `ModuleCatalogItem`.
- `IEquipmentRepository` será atualizado para retornar `ModuleCatalogItem[]`.

---

## 3. Plano de Implementação (6 Etapas)

### Etapa P4-1: Unificar Schemas e Eliminar Tipos Fantasma
**Arquivos Modificados:**
- `core/schemas/equipment.schemas.ts` → Importar e re-exportar `ModuleCatalogItem` de `moduleSchema.ts`, depreciar `ModuleSpecs`
- `core/ports/IEquipmentRepository.ts` → Trocar `ModuleSpecs` por `ModuleCatalogItem`
- `core/types/index.ts` → Atualizar exports
- `hooks/useTechCalculations.ts` → Eliminar interface `PVModule`, usar `ModuleCatalogItem`

**Risco:** Alto — toca 15+ consumidores via `selectModules`.
**Mitigação:** Os consumidores continuarão compilando se mantivermos um alias temporário `type ModuleSpecs = ModuleCatalogItem` durante a migração.

---

### Etapa P4-2: Consertar o InMemoryEquipmentRepo
**Arquivos Modificados:**
- `services/adapters/InMemoryEquipmentRepo.ts` → Reescrever `mapModuleToSpec` para ler do formato aninhado real

**Estado Atual (Quebrado):**
```ts
// Tenta ler chaves que NÃO EXISTEM no MODULE_DB atual
return { power: Number(data["Potência"]), ... }
```

**Estado Alvo:**
```ts
// Lê diretamente do formato aninhado real
return data; // MODULE_DB já retorna ModuleCatalogItem[] validado pelo Zod
```

**Nota:** Como `MODULE_DB` já é parseado pelo `moduleDatabaseSchema` (que retorna `ModuleCatalogItem[]`), o repositório pode simplesmente retornar os dados sem mapeamento adicional.

---

### Etapa P4-3: Criar a Camada de Catálogo no Store
**Arquivos Criados/Modificados:**
- `core/state/slices/catalogSlice.ts` → **[NOVO]** Slice isolado para dados de catálogo
- `core/state/solarStore.ts` → Integrar `catalogSlice` com `partialize` no Zundo

**Estrutura do Slice:**
```ts
interface CatalogSlice {
  catalogModules: ModuleCatalogItem[];
  catalogInverters: InverterSpecs[];
  isCatalogLoaded: boolean;
  loadCatalog: () => Promise<void>;
}
```

**Regra Zundo:** O `partialize` do middleware temporal DEVE excluir `catalogModules` e `catalogInverters` para que navegações e filtros no catálogo nunca poluam o histórico de Undo/Redo do projeto.

---

### Etapa P4-4: Conectar ModuleCatalogDialog ao Store
**Arquivos Modificados:**
- `components/ModuleCatalogDialog.tsx` → Consumir `catalogModules` do store, eliminar array vazio

**De:**
```tsx
const availableModules: PVModule[] = [];
```

**Para:**
```tsx
const catalogModules = useSolarStore(state => state.catalogModules);
const { loadCatalog } = useSolarStore();
useEffect(() => { if (!isCatalogLoaded) loadCatalog(); }, []);
```

**Filtros existentes:** A UI de filtros (busca textual + seletor de marca) já está implementada e funcional. Apenas precisa de dados reais para operar.

---

### Etapa P4-5: Conectar InverterCatalogDialog ao Store
**Arquivos Modificados:**
- `components/InverterCatalogDialog.tsx` → Consumir `catalogInverters` do store

**Nota:** O `InverterFilterPanel.tsx` já possui filtros avançados completos (potência, fabricante, fases, MPPTs). Ele está 100% funcional mas inoperante por falta de dados.

---

### Etapa P4-6: Migrar Consumidores de `ModuleSpecs` → `ModuleCatalogItem`
**Arquivos Impactados (15+):**
Os componentes que usam `selectModules` (`TopRibbon`, `LeftOutliner`, `RightInspector`, `VoltageRangeChart`, `PVArrayStatusBar`, `InverterStatusBar`, `GenerationConsumptionChart`, `EngineeringGuidelinePanel`, `SystemHealthCheck`, `SimulationPreview`, `StringConfigurator`, `ModuleInventory`, `SolarLayer`, `useTechKPIs`, `useProposalCalculator`, `ExecutionCostsSection`, `ProposalModule`) precisarão acessar propriedades via `module.electrical.pmax` em vez de `module.power`.

**Estratégia de Migração Segura:**
1. Criar alias temporário: `type ModuleSpecs = ModuleCatalogItem` em `equipment.schemas.ts`
2. Ajustar `techSlice` para `NormalizedCollection<ModuleCatalogItem>`
3. Atualizar seletores em `solarSelectors.ts`
4. Migrar consumidores arquivo por arquivo
5. Remover alias após 100% de migração

---

## 4. Itens Fora de Escopo (P4)

Os seguintes itens ficam para épicos futuros:

- **WebGL Preview 3D** (`@react-three/fiber` e `@react-three/drei`) → Épico separado `WebGL_Leaflet`
- **Web Workers e Comlink** (Hover Preditivo) → Requer setup Vite completo, adiado para pós-catálogo funcional
- **Canadian Solar no MODULE_DB** → Tarefa de dados menor, pode ser feita a qualquer momento

**Razão:** O objetivo primário é **fazer o catálogo funcionar com dados reais**. Adicionar dependências pesadas (R3F, Workers) nesta fase aumentaria o risco sem entregar valor imediato.

---

## 5. Verificação

Após cada etapa:
```bash
npm run type-check
```
**Meta:** Zero novas regressões de tipagem. Os 24 erros pré-existentes em arquivos legados devem permanecer inalterados.

**Teste Funcional:** Abrir o Workspace de Engenharia → clicar em "+" no Outliner de Módulos → o `ModuleCatalogDialog` deve exibir os 28 módulos do banco de dados com filtros funcionais.

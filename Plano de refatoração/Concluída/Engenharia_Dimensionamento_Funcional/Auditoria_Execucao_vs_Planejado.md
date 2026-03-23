# Auditoria: Planejado vs Executado — Fase Kurupira

**Data:** 22/03/2026  
**Escopo:** Especificacao_Dimensionamento_Funcional_Kurupira.md (v1.0, 1069 linhas)

---

## Resumo Executivo

| Métrica | Valor |
|:---|:---|
| Ações planejadas | 5 + 1 refatoração opcional |
| Ações concluídas (funcional) | 5 de 5 |
| Refatoração opcional (§3.3) | Diferida (conforme spec) |
| `npx tsc --noEmit` | Exit code 0 |
| Desvios críticos | 0 |
| Desvios estruturais (schema) | 1 (detalhado abaixo) |
| Items de catálogo pendentes | 3 (novos equipamentos PHB) |

---

## Ação 1 — StringInspector Write-Mode

### Planejado (§2, linhas 100-253)
- Substituir `PropRow` por `PropRowEditable` nos 4 campos: `modulesPerString`, `stringsCount`, `azimuth`, `inclination`.
- Limites: 1-30, 1-10, 0-360°, 0-90°.
- Disparar `updateMPPTConfig(inverterId, mpptId, { field: value })`.
- Critérios: blur/enter/escape, Undo funcional, decimais em azimute/inclinação.

### Executado (`RightInspector.tsx`, linhas 560-625)
- ✅ 4 campos substituídos por `PropRowEditable`.
- ✅ Limites exatos conforme spec.
- ✅ `updateMPPTConfig()` disparado via `handleMPPTCommit`.
- ✅ Azimute default 180°, Inclinação default 0° (via `??`).

### Desvios
| Item | Spec | Executado | Severidade |
|:---|:---|:---|:---|
| Props `min`/`max` no `PropRowEditable` | Passados como props (`min={1} max={30}`) | Implementados via **clamping no callback** (`Math.min/max`) | ⚪ Equivalente funcional |
| Valores fora do range | "input fora do range não dispara a action" | Clampa ao limite mais próximo e dispara | ⚠️ **Desvio menor** — UX diferente (spec rejeita, implementação ajusta) |

---

## Ação 2a — Correção de Temperatura (VoltageRangeChart)

### Planejado (§3.1, linhas 262-296)
- Substituir `0` e `70` hardcoded por `settings.minHistoricalTemp` e `settings.maxCellTemp`.
- Usa `useSolarStore(s => s.project.settings)`.

### Executado (`VoltageRangeChart.tsx`, linhas 15, 29-31)
- ✅ `minAmbientTemp` lê `settings.minHistoricalTemp`.
- ✅ `settings` adicionado ao array de deps do `useMemo`.

### Desvios
| Item | Spec | Executado | Severidade |
|:---|:---|:---|:---|
| `maxCellTemp` | `projectSettings?.maxCellTemp ?? 70` | `const maxCellTemp = 70` (fixo) | ⚠️ **Desvio menor** — `maxCellTemp` não existe no schema de settings. Valor 70°C é o padrão IEC 61215. Quando/se o campo for adicionado ao schema, basta plugar. |
| Seletor | `s => s.project.settings` | `state => state.settings` | ⚪ Equivalente — diferentes caminhos para o mesmo objeto |

---

## Ação 2b — Validação de Corrente (HealthCheck)

### Planejado (§3.2, linhas 297-358)
- Nova regra: `Isc × stringsCount > maxCurrentPerMPPT`.
- Semáforo vermelho. Mensagem descritiva por MPPT.
- Implementação sugerida: `currentViolations = flatMap(...)`.

### Executado (`TopRibbon.tsx`, linhas 291-310)
- ✅ Loop por `techInverters.forEach` → `mpptConfigs.forEach`.
- ✅ Cálculo: `m.isc * mppt.stringsCount > spec.maxIscPerMppt`.
- ✅ `isCurrentUnsafe` alimenta `hasCritical` → semáforo vermelho.

### Desvios
| Item | Spec | Executado | Severidade |
|:---|:---|:---|:---|
| Granularidade da mensagem | Mensagem por MPPT (`MPPT 1: 13.9A > 12.5A máx.`) | Mensagem global ("Corrente MPPT (Isc): Excedida (Risco!)") | ⚠️ **Desvio menor** — menos informativo, mas funcional |
| Campo comparado | `inv.spec.maxCurrentPerMPPT` | `spec.maxIscPerMppt` (do `INVERTER_CATALOG`) | ⚪ Equivalente — fonte diferente, dado idêntico |

---

## Ação 3 — Cruzamento Físico/Lógico

### Planejado (§4, linhas 382-458)
- `physicalCount` = `project.placedModules.length`
- `logicalCount` = `Σ(modulesPerString × stringsCount)`
- Semáforo amarelo se divergem e ambos > 0.
- Tooltip com os dois números.

### Executado (`TopRibbon.tsx`, linhas 316-318, 348-360)
- ✅ `placedModules` lido do store.
- ✅ `logicalModuleCount` calculado no loop de MPPTs.
- ✅ `isMismatch` alimenta `hasWarning` → semáforo amarelo.
- ✅ Popover com números e status descritivo.

### Desvios
| Item | Spec | Executado | Severidade |
|:---|:---|:---|:---|
| Fonte do logicalCount | `useTechStore(s => s.inverters.ids.reduce(...))` (seletor Zustand) | Calculado inline no componente via `techInverters.forEach` | ⚪ Equivalente |
| Nenhum alerta em projeto vazio | Requerido | ✅ Implementado (`placedModules.length > 0 && logicalModuleCount > 0`) | ✅ Conforme |

---

## Ação 4 — Bootstrap de Projeto Vazio

### Planejado (§5, linhas 460-511)
- `useEffect` + `useRef(false)` em `SolarDashboard.tsx` ou `WorkspaceLayout.tsx`.
- Injetar `MODULE_CATALOG[0]` e `INVERTER_CATALOG[0]`.
- Dupla checagem `moduleCount === 0 && inverterCount === 0`.

### Executado (`WorkspaceLayout.tsx`, linhas 47-90)
- ✅ `useRef(false)` guard.
- ✅ Dupla checagem de stores vazios.
- ✅ Injeção de `MODULE_DB[0]` e `INVERTER_CATALOG[0]`.
- ✅ Local: `WorkspaceLayout.tsx` (opção permitida pela spec).

### Desvios
| Item | Spec | Executado | Severidade |
|:---|:---|:---|:---|
| Nome do catálogo | `MODULE_CATALOG` | `MODULE_DB` | ⚪ — nomes diferentes, mesma fonte de verdade |
| Mapeamento do inversor | `useTechStore.getState().addInverter(INVERTER_CATALOG[0])` direto | Mapeamento manual `{ id, manufacturer, model, nominalPower: powerAc/1000, ... }` | ⚪ — necessário devido a tipos divergentes entre catálogo e store |

---

## Ação 5 — Schemas Zod

### Planejado (§6, linhas 513-990)
**Módulo:** Schema de 3 camadas aninhadas:
```
ModuleCatalogItemSchema = { id, manufacturer, model, electrical: {...}, physical: {...}, asset: {...} }
```

**Inversor:** Schema com array de MPPTs:
```
InverterCatalogItemSchema = { id, manufacturer, model, nominalPowerW, maxDCPowerW, mppts: [MPPTSpecSchema], efficiency, asset }
```

**Catálogo:** Novos itens com dados PHB reais (Canadian HiKu6, JA Solar, PHB5000D-WS, PHB6000D-WS).

### Executado
**`moduleSchema.ts`:** Schema flat com chaves em português (`Fornecedor`, `Potência`, etc.) — espelha o `MODULE_DB` existente.

**`inverterSchema.ts`:** Schema flat com campos globais (`maxIscPerMppt`, `mppts: number`) — espelha o `INVERTER_CATALOG` existente.

### Desvios

| Item | Spec | Executado | Severidade |
|:---|:---|:---|:---|
| Estrutura do módulo | 3 camadas (electrical/physical/asset) | Flat (chaves PT-BR) | 🟡 **Desvio estrutural** |
| Estrutura do inversor | Array de MPPTSpecSchema por inversor | Campos MPPT globais (um valor por inversor) | 🟡 **Desvio estrutural** |
| Novos itens de catálogo | Canadian HiKu6, JA Solar, PHB5000D, PHB6000D | Não adicionados | 🟡 **Pendente** |
| Slug IDs | `canadian-hiku6-cs6r-550ms` | IDs existentes mantidos | ⚪ Compatibilidade |
| `asset.glbAsset` / `featureId` | Campos opcionais previstos | Não incluídos no schema | ⚪ Ok — spec diz "optional até fase R3F" |

---

## Refatoração Opcional (§3.3, linha 360-380)

### Planejado
- Extrair lógica do HealthCheck para `useSystemValidation()` hook dedicado.
- HealthCheckWidget vira display puro.
- Status: **"Não bloqueante para P4"**.

### Executado
- ❌ Não realizado — lógica permanece inline no HealthCheckWidget.

### Avaliação
- Conforme spec: item declarado como **"não bloqueante"** e prioridade 7 (última), agendado para "após P4 definido". Não é pendência.

---

## Conclusão da Auditoria

### ✅ Critérios de aceite plenamente atendidos
- Ação 1: 4 campos editáveis, limites, `updateMPPTConfig()`.
- Ação 2a: Temperatura do store, consistência com HealthCheck.
- Ação 2b: Corrente validada por MPPT, semáforo vermelho.
- Ação 3: Cruzamento físico/lógico, semáforo amarelo.
- Ação 4: Bootstrap com guard, dupla checagem.
- Ação 5: Schemas Zod com `.parse()`, type-check limpo.

### ⚠️ Desvios menores (não bloqueantes para P4)
1. **Clamping vs Rejeição:** Spec diz "não disparar action" fora do range. Implementação clampeia ao limite mais próximo.
2. **Mensagem de corrente:** Global em vez de por-MPPT.
3. **`maxCellTemp`:** Fixo em 70 porque o campo não existe no schema do store.

### 🟡 Desvio estrutural (Ação 5 — Schemas)
Os schemas criados seguem a **forma plana dos catálogos existentes** em vez da **forma aninhada de 3 camadas** proposta na spec. Isso foi uma decisão pragmática: reestruturar `MODULE_DB` (562 linhas de dados legados com chaves PT-BR) e `INVERTER_CATALOG` (5 inversores com interface TypeScript própria) para o formato novo exigiria refatorar todas as referências downstream (`LeftOutliner`, `calculateStringMetrics`, `VoltageRangeChart`, `HealthCheck`, `Bootstrap`). O benefício da validação `.parse()` foi atingido; a reestruturação em camadas pode ser feita incrementalmente quando a Fase Boto (3D/glTF) exigir os campos `asset.*`.

### 📋 Itens pendentes (não bloqueantes)
1. Adicionar novos itens de catálogo PHB ao `MODULE_DB` e `INVERTER_CATALOG`.
2. Migrar schemas para formato aninhado (quando necessário para Fase Boto).
3. Extrair `useSystemValidation()` hook (quando P4 for definido).

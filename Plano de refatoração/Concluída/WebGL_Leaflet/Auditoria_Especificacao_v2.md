# Auditoria da Especificação v2: Integração Gráfica Kurupira

**Data:** 22/03/2026  
**Auditor:** Antigravity (AI Engineer)  
**Documento Auditado:** `Especificacao_Integracao_Grafica_Kurupira_v2.md` (880 linhas)  
**Método:** Verificação cruzada de cada claim da spec contra o código-fonte real em `kurupira/frontend/src/`.

---

## 1. Resumo Executivo

A especificação v2.0 é **tecnicamente sólida e bem estruturada**. Todos os 7 achados da auditoria anterior (A1–A7) foram corretamente absorvidos. Porém, o documento é uma **especificação pura** — nenhum dos artefatos descritos existe no código ainda. A auditoria abaixo separa o que é **ajuste de spec** do que é **gap de implementação**.

---

## 2. Verificação dos Achados (A1–A7)

| # | Achado | Spec Corrigiu? | Código Existe? | Veredicto |
| :---: | :--- | :---: | :---: | :--- |
| A1 | `projectSlice` inexistente | ✅ Seção 3.1 | ❌ | Gap de implementação |
| A2 | Duas versões de `CanvasContainer` | ✅ Seção 2.1 | ⚠️ Ambas ainda no disco | Gap de implementação |
| A3 | `data-width/height` → quebra Leaflet | ✅ Seção 2.2 | ⚠️ Versão antiga ainda ativa | Gap de implementação |
| A4 | Tile layer Google sem API key | ✅ Seção 3.2 | ❌ Leaflet não instalado | N/A (dep inexistente) |
| A5 | `SolarLayer` sem `useMemo` | ✅ Seção 3.3 | ❌ `SolarLayer` não existe | Gap de implementação |
| A6 | `PLACE_MODULE` sem `axisAngle` | ✅ Seção 4.3 | ❌ `geoUtils.ts` não existe | Gap de implementação |
| A7 | `activeTool` em `useState` local | ✅ Seção 5.1 | ⚠️ Ainda em `useState` | Gap de implementação |

> [!IMPORTANT]
> **Conclusão:** A spec está correta em 7/7 achados. Zero erros factuais. Mas o código está em 0/7 de implementação.

---

## 3. Auditoria de Precisão Técnica do Documento

### 3.1 CanvasContainer (Seção 2) — ✅ Preciso

| Claim da Spec | Verificação | Status |
| :--- | :--- | :---: |
| "Duas versões conflitantes no disco" | `ui/panels/CanvasContainer.tsx` (Context + `useCanvasDimensions`) e `components/CanvasContainer.tsx` (`data-width/height`) | ✅ Confirmado |
| `CenterCanvas` usa a versão com `data-attrs` | [CenterCanvas.tsx:20](file:///d:/Reposit%C3%B3rio_Pessoal/SaaS%20Projects/Neonorte/Neonorte/kurupira/frontend/src/modules/engineering/ui/panels/CenterCanvas.tsx#L20) importa de `../../components/CanvasContainer` | ⚠️ Parcial |
| `WorkspaceLayout` envolve `CenterCanvas` em outro `CanvasContainer` | [WorkspaceLayout.tsx:108-114](file:///d:/Reposit%C3%B3rio_Pessoal/SaaS%20Projects/Neonorte/Neonorte/kurupira/frontend/src/modules/engineering/ui/layout/WorkspaceLayout.tsx#L108-L114) importa de `../panels/CanvasContainer` | ✅ Confirmado |

> [!WARNING]
> **Achado Novo (A8):** O `CenterCanvas` está sendo envolvido por **dois** `CanvasContainer` simultaneamente — um no próprio JSX do componente (L63) e outro no `WorkspaceLayout` (L108). Isso cria dois `ResizeObserver` aninhados desnecessariamente. A spec não menciona este duplo envolvimento.

### 3.2 Estado de UI (Seção 5) — ✅ Preciso com ressalva

| Claim da Spec | Verificação | Status |
| :--- | :--- | :---: |
| "`activeTool` em `useState` local" | [WorkspaceLayout.tsx:56](file:///d:/Reposit%C3%B3rio_Pessoal/SaaS%20Projects/Neonorte/Neonorte/kurupira/frontend/src/modules/engineering/ui/layout/WorkspaceLayout.tsx#L56) | ✅ Confirmado |
| "`selectedEntity` em `useState` local" | [WorkspaceLayout.tsx:59](file:///d:/Reposit%C3%B3rio_Pessoal/SaaS%20Projects/Neonorte/Neonorte/kurupira/frontend/src/modules/engineering/ui/layout/WorkspaceLayout.tsx#L59) | ✅ Confirmado |
| "TopRibbon recebe via prop" | [TopRibbon.tsx:51-58](file:///d:/Reposit%C3%B3rio_Pessoal/SaaS%20Projects/Neonorte/Neonorte/kurupira/frontend/src/modules/engineering/ui/panels/TopRibbon.tsx#L51-L58) recebe `activeTool` e `onToolChange` | ✅ Confirmado |
| "uiStore não existe" | Busca por `uiStore.ts` retornou 0 resultados | ✅ Confirmado |

> [!NOTE]
> A decisão de migrar para `uiStore` separado (Seção 5.1) é justificada: o `SolarLayer` futuro precisará ler `activeTool` sem prop-drilling pelo `WorkspaceLayout` → `CanvasContainer` → `CenterCanvas` → `MapCore` → `SolarLayer`.

### 3.3 Seletores (Seção 3.3) — ✅ Preciso

| Claim | Verificação | Status |
| :--- | :--- | :---: |
| "Sem `reselect` instalado" | `package.json` não contém `reselect` | ✅ Confirmado |
| "Sem `createSelector` no código" | grep retornou 0 resultados | ✅ Confirmado |
| "Seletores existentes usam `toArray()`" | [solarStore.ts:221-223](file:///d:/Reposit%C3%B3rio_Pessoal/SaaS%20Projects/Neonorte/Neonorte/kurupira/frontend/src/core/state/solarStore.ts#L221-L223) usa `toArray()` que faz `.map().filter()` | ⚠️ Risco |

> [!WARNING]
> **Achado Novo (A9):** Os seletores atuais `selectModules` e `selectInverters` em `solarStore.ts` já usam `toArray()` que reconstrói o array a cada chamada. O `TopRibbon` já consome esses seletores (L273-274). Isso significa que o problema de re-render instável **já existe hoje**, não apenas no futuro `SolarLayer`. A spec deveria recomendar a migração dos seletores existentes, não apenas dos futuros.

### 3.4 Tile Layer (Seção 3.2) — ✅ Preciso

| Claim | Verificação | Status |
| :--- | :--- | :---: |
| "Leaflet não instalado" | `package.json` não contém `leaflet` | ✅ Confirmado |
| "Mapbox + fallback OSM" | Spec define lógica clara com `VITE_MAPBOX_TOKEN` | ✅ Correto |

### 3.5 PLACE_MODULE e Trigonometria (Seção 4) — ✅ Matematicamente Correto

| Claim | Verificação | Status |
| :--- | :--- | :---: |
| `calcRoofAzimuth()` — Haversine simplificado | Fórmula `dLat * 111320` é aproximação válida para escalas < 1km | ✅ Correto |
| `calcModulePolygon()` — rotação 2D | Matriz de rotação `[cos, -sin; sin, cos]` aplicada corretamente | ✅ Correto |
| `axisAngle` distinto de `azimute` solar | Separação conceitual clara na tabela da Seção 4.2 | ✅ Correto |

### 3.6 Plano de Execução (Seção 7) — ✅ Ordem Lógica

| Fase | Deps Corretas? | Observação |
| :--- | :---: | :--- |
| PGFX (Pré-GFX) | ✅ | CanvasContainer, projectSlice, uiStore, seletores — correto como pré-condição |
| P0-GFX | ✅ | Dependências → MapCore → SolarLayer polígono — ordem lógica |
| P1-GFX | ✅ | Módulos → PLACE_MODULE → SELECT → MEASURE — progressão correta |
| P2-GFX | ✅ | Hover → Outliner sync → On-demand rendering — polish final |

---

## 4. Achados Novos (Não Cobertos pela Spec)

| # | Achado | Severidade | Descrição | Recomendação |
| :---: | :--- | :---: | :--- | :--- |
| A8 | Duplo `CanvasContainer` | 🟡 Média | `CenterCanvas` usa internamente um `CanvasContainer`. `WorkspaceLayout` envolve `CenterCanvas` em **outro** `CanvasContainer`. Dois `ResizeObserver` aninhados. | Remover o `CanvasContainer` de dentro do `CenterCanvas` ou do `WorkspaceLayout`. Manter apenas um. |
| A9 | Seletores instáveis já em uso | 🟡 Média | `selectModules`/`selectInverters` no `solarStore.ts` já reconstroem arrays via `toArray()` a cada render. `TopRibbon` e `HealthCheckWidget` já consomem esses seletores. | Migrar os seletores existentes para `createSelector` na task PGFX-04, não apenas os futuros. |
| A10 | `setZoom` ausente no pseudocódigo | 🟢 Baixa | O `projectSlice` na spec declara `setZoom` na interface `ProjectState` mas não implementa a action no corpo do slice. | Adicionar: `setZoom: (zoom) => set(s => ({ project: { ...s.project, zoom } }))` |

---

## 5. Veredicto Final

| Categoria | Nota |
| :--- | :---: |
| **Precisão Factual** | 9/10 — Todos os claims verificáveis estão corretos. A8 (duplo container) não foi detectado. |
| **Completude** | 8/10 — Falta A9 (seletores existentes) e A10 (`setZoom` body). |
| **Viabilidade Técnica** | 10/10 — Fórmulas, arquitetura de stores e plano de execução são implementáveis. |
| **Ordem de Execução** | 10/10 — PGFX como pré-condição do GFX é a decisão correta. |

> [!TIP]
> **Recomendação:** Incorporar os achados A8, A9 e A10 como errata na spec e prosseguir com a fase PGFX. O documento está pronto para servir como guia de implementação.

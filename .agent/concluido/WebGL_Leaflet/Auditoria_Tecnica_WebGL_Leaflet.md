# Relatório de Auditoria Técnica: Integração WebGL/Leaflet

**Data:** 22/03/2026  
**Auditor:** Antigravity (AI Engineer)  
**Assunto:** Verificação de conformidade do esqueleto Kurupira vs. Especificação Gráfica.

---

## 1. Gestão de Estado e Zundo

| Item | Status | Evidência | Observação |
| :--- | :---: | :--- | :--- |
| **Isolamento de UI** | ✅ | `WorkspaceLayout.tsx:56-59` | `activeTool` e `selectedEntity` usam `useState` local. |
| **Poluição do Zundo** | ✅ | `solarStore.ts:116-125` | Apenas DOMÍNIO é rastreado no `partialize`. UI está segura. |
| **Project Slice** | ❌ | `src/core/state/slices/` | Slice inexistente. Dados de Geometria (Polígonos/Zoom) orfãos. |

> [!NOTE]
> **Ponto Positivo:** O histórico de Undo/Redo está protegido contra ruídos de interface, conforme o mandato de arquitetura PRÉ-2.

---

## 2. Infraestrutura de Rendering (`CanvasContainer`)

| Risco Identificado | Severidade | Impacto | Recomendação |
| :--- | :---: | :--- | :--- |
| **Inconsistência de Componente** | 🟡 Média | Duas versões do `CanvasContainer.tsx` no disco. | Unificar em um único `SharedComponent`. |
| **Uso de Data-Attributes** | 🔴 Alta | Renderizador atual (`CenterCanvas`) usa versão `data-width/height`. | Leaflet irá quebrar ou falhar no resize automático. |
| **Falta de InvalidateSize** | 🔴 Alta | `ResizeObserver` não envia sinal para o motor Leaflet. | Implementar `map.invalidateSize()` via Ref/Context. |

---

## 3. Conformidade Gráfica e Geometria

### 3.1 Provisão de Tiles (Satélite)
- **Status:** Vulnerável.
- **Evidência:** Plano sugeriu endpoint Google `{s}.google.com/vt/lyrs=s` sem chave de API.
- **Risco:** Bloqueio de IP ou cobrança inesperada se escalado.
- **Ação:** Migrar para Provedores Híbridos/Gratuitos no código de bootstrap.

### 3.2 Camada de Polígonos (`SolarLayer.tsx`)
- **Status:** **Não Implementado**.
- **Auditoria de Performance:** A especificação prevê `Object.values(s.modules.entities)`. 
- **Risco O(n):** Sem `useMemo`, cada movimento de mouse ou click no outliner irá refazer o array de módulos, causando jitter na renderização WebGL.

### 3.3 Alinhamento de Módulos (`PLACE_MODULE`)
- **Status:** Gap de Lógica.
- **Descrição:** Falta a definição trigonométrica de alinhamento à "Normal do Telhado".
- **Ação:** Adicionar cálculo de `axisAngle` baseado nos pontos cardeais (`EngineeringSlice.azimute`).

---

## 4. Conclusão da Auditoria

O esqueleto visual do Kurupira está **estabilizado**, mas a ponte para o motor WebGL/Leaflet possui falhas de sincronização dimensional (`CanvasContainer`) e ausência de estado persistente para a geometria do sítio.

**Recomendação:** Aprovar o Plano de Implementação (v2) que corrige especificamente a infraestrutura do `CanvasContainer` e a persistência de polígonos antes de iniciar a construção do `MapCore`.

# UX-002 — Sistema de Painéis Flexíveis (Panel Swap Architecture)

**Épico**: Refatoração do Workspace de Engenharia  
**Status**: Em Andamento  
**Criado**: 2026-04-09  
**Autor**: Agente + Desenvolvedor Líder  

## Objetivo

Transformar o workspace de engenharia de um layout rígido (4 painéis fixos) para um 
sistema de painéis agrupados, colapsáveis e comutáveis com o center canvas, inspirado 
no Adobe Illustrator mas com restrições poka-yoke para evitar configurações inválidas.

## ⚠️ LEITURA OBRIGATÓRIA ANTES DE IMPLEMENTAR

**`SPEC-000-integration-contract.md`** documenta 5 conflitos reais entre as specs 
e as decisões que os resolvem. Qualquer implementação que ignore essa spec vai gerar 
dívida técnica. Leia primeiro.

## Specs Contidas

| # | Spec | Fase | Passo | Status |
|---|------|------|-------|--------|
| 0 | `SPEC-000-integration-contract.md` | Meta | — | `[ ]` Referência |
| 1 | `SPEC-005-panel-store.md` (V1 mínimo) | Fase 1 | PASSO 0 | `[ ]` Aguardando |
| 2 | `SPEC-001-panel-group-decomposition.md` | Fase 1 | PASSO 1 | `[ ]` Aguardando |
| 3 | `SPEC-002-collapsible-panel-container.md` | Fase 1 | PASSO 2 | `[ ]` Aguardando |
| 4 | `SPEC-003-inspector-orchestrator.md` | Fase 1 | PASSO 3 | `[ ]` Aguardando |
| 5 | `SPEC-004-workspace-grid-simplification.md` | Fase 1 | PASSO 4 | `[ ]` Aguardando |
| — | 🔒 CHECKPOINT FASE 1 | — | — | `[ ]` TSC + QA |
| 6 | `SPEC-005-panel-store.md` (V2 swap) | Fase 2 | PASSO 5 | `[ ]` Aguardando |
| 7 | Container Queries (via SPEC-000 §5) | Fase 2 | PASSO 6 | `[ ]` Aguardando |
| 8 | `SPEC-006-center-slot-swap.md` | Fase 2 | PASSO 7 | `[ ]` Aguardando |
| 9 | `SPEC-007-dock-map-indicator.md` | Fase 2 | PASSO 8 | `[ ]` Aguardando |
| 10 | Guardrails (via SPEC-000 §1–3) | Fase 2 | PASSO 9 | `[ ]` Aguardando |
| — | 🔒 CHECKPOINT FASE 2 | — | — | `[ ]` TSC + QA |

## Decisões-Chave (da SPEC-000)

1. **panelStore antecipado** para Fase 1 (evita dono duplo de estado de colapso)
2. **PropertiesGroup uniformizado** — usa PanelGroup com props `contextual`/`onDismiss`
3. **CSS Container Queries** para layout adaptativo dock↔center (zero props extras)
4. **IntersectionObserver** no MapCore para auto-invalidateSize (zero acoplamento)
5. **frameloop="demand"** mantido — remove hack "never" que não funciona no R3F v8+

## Premissas Canon

- Zustand sem persist para estado de UI transiente (painéis)
- WebGL não desmonta — usa `display: none` para preservar estado Leaflet
- Nenhum setState contínuo novo (colapso é toggle discreto via panelStore)
- Separação Catálogo/Inventário intocada

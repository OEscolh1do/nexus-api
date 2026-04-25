# Spec — Substituição da Árvore do LeftOutliner

**Tipo:** Refatoração Técnica + Feature
**Módulo:** `engineering` — `LeftOutliner`, `useTechStore`, `solarStore`
**Prioridade:** P1 — Crítico
**Responsável (impl.):** `the-builder`
**Revisor (aceitação):** `engenheiro-eletricista-pv`
**Data de criação:** 2026-04-16
**Versão:** 3.7 — alinhado ao Escopo Definitivo 2026-04-15
**Origem:** `08-spec-left-outliner-flat-tree-2026-04-16.md` v2.0
**Dependência:** `03-spec-compositor-blocos-2026-04-15.md` v3.7

---

## 1. Visão Geral (v4.0 - Atualizado)

O `LeftOutliner` é o hub de controle fixo do Kurupira. 
- **Largura Master:** Fixo em **280px** (Ajustado para comportar o Engineering Grid numérico).
- **Estrutura:** Puramente processual — Pilha de Blocos (Compositor). A "Flat Tree" de topologia elétrica foi despriorizada deste painel para evitar colapso visual e manter o foco na jornada.

---

## 2. A Nova Arquitetura: Flat Tree (v3.7)

### 2.1 Princípios de Layout
O Outliner nunca colapsa automaticamente ao navegar na jornada. Ele mantém os 280px para garantir que a pilha de blocos (Lego) esteja sempre disponível para avaliação rápida de coerência. A adoção da *Summary Bar (Semi-Resumido)* protege a leitura quando a view central exige espaço.

### 2.2 Estrutura Visual Implementada
```
📂 OUTLINER (280px)
│
└─ [PILHA DE BLOCOS - COMPOSITOR]
    ├─ 📍 Site (Local / Clima)
    ├─ ⚡ Consumo (Carga Mensal)
    ├─ ☀ Módulos (Geração DC)
    ├─ 🔲 Inversor (Conversão AC)
    ├─ 📊 Projeção (Performance)
    └─ 📄 Proposta (Status Comercial)
```
*(A Topologia Elétrica detalhada será tratada dentro da `ElectricalCanvasView`, mantendo o LeftOutliner focado na Orquestração de Alto Nível).*

---

## 11. Critérios de Aceitação (Revisados v4.0)

- [x] Largura forçada em 280px via CSS.
- [x] Sincronia de seleção: clicar num bloco (`ComposerBlock*.tsx`) define `activeFocusedBlock` e ilumina o bloco (Scientific Palette).
- [x] Ausência de `opacity-40`: todos os blocos mantêm 100% de opacidade com variação apenas na intensidade da borda.

---

## Referências

- Mestre: `escopo-definitivo-kurupira-v3.7-2026-04-15.md`
- Sincronia: `01-spec-sincronia-bloco-canvas-2026-04-15.md`

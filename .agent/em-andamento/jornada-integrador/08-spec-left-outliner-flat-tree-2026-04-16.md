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

## 1. Visão Geral (v3.7)

O `LeftOutliner` é o hub de controle fixo do Kurupira. 
- **Largura Master:** Fixo em **240px** (Engineering Tool Aesthetic).
- **Estrutura:** Híbrida — Pilha de Blocos (topo) + Árvore de Topologia (corpo).

---

## 2. A Nova Arquitetura: Flat Tree (v3.7)

### 2.1 Princípios de Layout
O Outliner nunca colapsa automaticamente ao navegar na jornada. Ele mantém os 240px para garantir que a pilha de blocos (Lego) esteja sempre disponível para avaliação rápida de coerência.

### 2.2 Estrutura Visual
```
📂 OUTLINER (240px)
│
├─ [PILHA DE BLOCOS]
│   ├─ ⚡ Consumo
│   ├─ ☀ Módulos
│   ├─ 🗺 Arranjo
│   └─ 🔲 Inversor
│
└─ [TOPOLOGIA ELÉTRICA]
    └─ ⚡ PHB 10kW
        └─ ● MPPT 1
            ├─ ─ String A
            └─ ─ String B
```

---

## 11. Critérios de Aceitação (v3.7)

- [ ] Largura forçada em 240px via CSS `min-w-[240px] max-w-[240px]`.
- [ ] Renderização correta da Flat Tree abaixo da pilha de blocos.
- [ ] Sincronia de seleção: clicar num nó da árvore desativa o foco do bloco (`activeFocusedBlock = null`) para evitar conflito visual.

---

## Referências

- Mestre: `escopo-definitivo-kurupira-v3.7-2026-04-15.md`
- Sincronia: `01-spec-sincronia-bloco-canvas-2026-04-15.md`

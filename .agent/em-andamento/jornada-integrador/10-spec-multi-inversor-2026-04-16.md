# Spec — Projetos com Múltiplos Inversores

**Tipo:** Feature Nova + Extensão de UX
**Módulo:** `engineering` — `useTechStore`, `ComposerCanvasView`, `electricalMath`, `systemCompositionSlice`
**Prioridade:** P1 — Crítico
**Responsável (impl.):** `the-builder`
**Revisor (aceitação):** `engenheiro-eletricista-pv`
**Data de criação:** 2026-04-16
**Versão:** 3.7 — alinhado ao Escopo Definitivo 2026-04-15
**Supersede:** `10-spec-multi-inversor-2026-04-16.md` v2.0
**Dependência direta:** `03-spec-compositor-blocos-2026-04-15.md` v3.7

---

## 1. Visão Geral (v3.7)

Projetos comerciais frequentemente requerem N inversores. Esta especificação define como o Compositor de Blocos (LeftOutliner) e a `ElectricalCanvasView` (CenterCanvas) lidam com essa multiplicidade.

### 1.1 Layout Master
- O Bloco Inversor multi-unidade reside no `LeftOutliner` (**240px**).
- A edição granular de N inversores ocorre na `ElectricalCanvasView` (Grid **75/25**).

---

## 2. Decisão Arquitetural: Bloco Agregado (v3.7)

Mantida a **Opção C**: Bloco agregado com expansão. 
O bloco consome o mesmo espaço vertical na pilha Lego, mas expande internamente para listar sub-linhas de cada inversor (①, ②, ③...).

---

## 3. Especificação Técnica

### 3.1 Chips Agregados
- `Pdc total`: Soma de todos os sub-arranjos.
- `Ratio médio`: Média ponderada pela potência AC.
- `Health status`: Vermelho se QUALQUER inversor falhar na validação individual.

### 3.2 ElectricalCanvasView (75/25)
A view de Elétrica agora exibe um Seletor de Inversores no painel lateral (25%) para alternar o foco do diagrama principal (75%).

---

## 8. Critérios de Aceitação (v3.7)

- [ ] Clicar no Bloco Inversor expandido → abre a view de Elétrica no inversor selecionado.
- [ ] Geração total na `SimulationCanvasView` soma a potência de todos os inversores.
- [ ] Respeito ao grid 75/25 na `ElectricalCanvasView`.

---

## Referências

- Mestre: `escopo-definitivo-kurupira-v3.7-2026-04-15.md`
- Design: `11-spec-canvas-views-design-2026-04-15.md`

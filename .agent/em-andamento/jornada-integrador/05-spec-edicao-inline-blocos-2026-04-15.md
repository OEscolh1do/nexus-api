# Spec — Edição Inline nos Blocos do Compositor

**Tipo:** Feature Nova (extensão da spec-compositor-blocos)
**Módulo:** `engineering` — `LeftOutliner`, `ComposerBlock.*`
**Prioridade:** P1 — Crítico
**Responsável (impl.):** `the-builder`
**Revisor (aceitação):** `engenheiro-eletricista-pv` + `design-lead`
**Data de criação:** 2026-04-14
**Versão:** 2.0 — revisado 2026-04-15
**Supersede:** `spec-edicao-inline-blocos-2026-04-14.md` v1.0
**Dependência direta:** `spec-sincronia-bloco-canvas-2026-04-15.md` — Etapa 4 concluída

---

## Changelog v2.0

| Seção | Mudança |
|-------|---------|
| §1.1 | Diagnóstico atualizado: tensão fundamental resolvida diferentemente — não há mais `RightInspector`; edição complexa vai para a Canvas View correspondente |
| §1.2 | Tabela de onde fica cada ação atualizada: `RightInspector` substituído por Canvas View |
| §2 | Modelo de interação: sem estado `editingBlockId` vs `null` — bloco focado simplesmente expõe campos inline |
| §3 | Campos por bloco: mantidos, com ajuste de redirecionamento para Canvas View em vez de RightInspector |

---

## 1. Diagnóstico (v2.0)

### 1.1 A tensão fundamental (atualizada)

O Compositor no LeftOutliner é a vista de **estado** do sistema — o integrador vê o
progresso e os chips de validação. As Canvas Views são o espaço de **trabalho** —
onde o integrador edita em profundidade.

A tensão: para ajustes simples (quantidade de módulos, consumo médio, fator de
crescimento), navegar para a Canvas View é excessivo. O integrador quer mudar um
número sem "sair" do que está vendo.

A regra que resolve: **campos com um único valor simples são editáveis inline no bloco.
Tudo que envolve seleção de lista, geometria ou sub-entidades vai para a Canvas View.**

### 1.2 Onde fica cada ação (v2.0)

| Ação | Onde fica | Critério |
|------|-----------|---------|
| Alterar quantidade de módulos | Inline no bloco | Campo numérico simples |
| Trocar o modelo do módulo | Overlay de catálogo disparado pelo bloco | Seleção em lista |
| Alterar consumo médio mensal | Inline no bloco | Campo numérico simples |
| Editar as 12 faturas individualmente | `ConsumptionCanvasView` (clicar no bloco) | 12 campos + sazonalidade |
| Alterar fator de crescimento | Inline no bloco | Campo numérico simples |
| Configurar strings por MPPT | `ElectricalCanvasView` (clicar no bloco Inversor) | Sub-entidades |
| Alterar o modelo do inversor | Overlay de catálogo disparado pelo bloco | Seleção em lista |

> **Mudança vs v1.0:** onde antes estava "RightInspector / ConsumptionView",
> agora está apenas "Canvas View correspondente". O RightInspector foi eliminado
> no MVP atual.

---

## 2. Modelo de Interação: Bloco com Dois Modos (v2.0)

**Modo Resumo (padrão):** header + chips de status. Somente leitura.
Ativo quando `activeFocusedBlock !== blocoId`.

**Modo Inline (edição rápida):** campos numéricos simples aparecem no corpo do bloco.
Ativo quando `activeFocusedBlock === blocoId` — o foco já existe, a edição
é consequência natural de o bloco estar selecionado.

Não há mais um `editingBlockId` separado. O foco IS a edição.

```
MODO RESUMO (bloco não focado)     MODO INLINE (bloco focado)
┌─────────────────────────┐        ┌─────────────────────────┐
│ ⚡ Consumo  600 kWh/mês │        │ ⚡ Consumo              │
│ [chip] [chip]           │  →  →  │ Consumo médio: [___600__] kWh/mês  │
└─────────────────────────┘        │ Crescimento:   [__0__] %  │
                                   │ [chip] [chip]             │
                                   │ → Raio-x completo ↗       │
                                   └─────────────────────────────┘
```

O link "→ Raio-x completo ↗" abre a Canvas View correspondente para
edições mais profundas (as 12 faturas, correlação climática, etc.).

---

## 3. Campos por Bloco (v2.0)

### 3.1 Bloco Consumo — campos inline

| Campo | Tipo | Action no store | Unidade |
|-------|------|-----------------|---------|
| Consumo médio mensal | `number input` | `solarStore.clientData.setAverageConsumption()` | kWh/mês |
| Fator de crescimento | `number input` (slider opcional) | `journeySlice.setLoadGrowthFactor()` | % |

**Link para profundidade:** "→ Ver raio-x do consumo" → `setFocusedBlock('consumption')`
(se já estiver focado, o link não aparece — a view já está ativa)

**Não inline (vai para ConsumptionCanvasView):**
- 12 faturas individuais
- Cargas simuladas
- Correlação com temperatura histórica

### 3.2 Bloco Módulos FV — campos inline

| Campo | Tipo | Action no store | Unidade |
|-------|------|-----------------|---------|
| Quantidade de módulos | `number input` | `useTechStore.updateModuleQty(id, qty)` | unid. |

**Overlay de catálogo:** botão "Trocar modelo" → `ModuleCatalogDialog` (overlay sobre o bloco,
não navegação para outra view)

**Não inline (vai para MapCore via foco):**
- Posicionamento físico no telhado
- Auto-layout de área

### 3.3 Bloco Arranjo (quando implementado)

Sem campos inline — o Bloco Arranjo é inteiramente um espelho do MapCore.
Clicar nele = `setFocusedBlock('module')` (leva para o mapa).

### 3.4 Bloco Inversor — campos inline

| Campo | Tipo | Action no store | Unidade |
|-------|------|-----------------|---------|
| Quantidade de strings por MPPT 1 | `number input` | `useTechStore.updateMPPTConfig(id, {strings: n})` | unid. |

**Overlay de catálogo:** botão "Trocar modelo" → `InverterCatalogDialog`

**Não inline (vai para ElectricalCanvasView via foco):**
- Configuração assimétrica de MPPTs
- Diagrama de strings completo
- Validação Voc com temperatura

---

## 4. PropRowEditable — componente base (mantido da v1.0)

```tsx
// Componente reutilizável para campos inline nos blocos
interface PropRowEditableProps {
  label: string;
  value: number | string;
  unit?: string;
  onChange: (v: number | string) => void;
  min?: number;
  max?: number;
  step?: number;
}

export const PropRowEditable: React.FC<PropRowEditableProps> = ({ ... }) => {
  // Input numérico compacto, 10-11px, tema dark
  // onBlur → commit (sem debounce — autosave otimista)
  // Enter → commit + blur
  // Esc → reverte para valor anterior
}
```

O commit no `onBlur` é suficiente — o `solarStore` com `persist` já salva
automaticamente. Sem debounce necessário.

---

## 5. Arquivos Afetados (v2.0)

### Modificar

| Arquivo | Mudança |
|---------|---------|
| `ui/panels/LeftOutliner.tsx` (ConsumptionBlock) | Adicionar campos inline quando `activeFocusedBlock === 'consumption'` |
| `canvas-views/composer/ComposerBlockModule.tsx` | Adicionar campo qty inline quando focado + botão overlay catálogo |
| `canvas-views/composer/ComposerBlockInverter.tsx` | Adicionar campo strings-MPPT1 inline quando focado + botão overlay catálogo |

### Criar

| Arquivo | Propósito |
|---------|-----------|
| `canvas-views/composer/PropRowEditable.tsx` | Componente base de campo inline reutilizável |

### Sem alteração vs v1.0

A lógica de overlays de catálogo (`ModuleCatalogDialog`, `InverterCatalogDialog`) já existe —
apenas o trigger muda de "botão no LeftOutliner" para "botão dentro do bloco focado".

---

## 6. Plano de Execução (v2.0)

```
Etapa 1: PropRowEditable (componente base)
  → Reutilizável pelos 3 blocos

Etapa 2: ConsumptionBlock inline (consumo médio + fator crescimento)
  → Dependência: spec-sincronia Etapa 4 concluída (foco ativo no bloco)

Etapa 3: ComposerBlockModule inline (quantidade + botão catálogo)
  → Idem

Etapa 4: ComposerBlockInverter inline (strings MPPT1 + botão catálogo)
  → Idem
```

---

## 7. Critérios de Aceitação (v2.0)

- [ ] Clicar no Bloco Consumo focado mostra campos de consumo médio e fator de crescimento editáveis inline
- [ ] Editar consumo médio inline → kWp alvo no conector atualiza em tempo real
- [ ] Clicar em "Ver raio-x" no bloco Consumo focado → canvas está em ConsumptionCanvasView (já estava)
- [ ] Campo qty no Bloco Módulos aceita apenas inteiros ≥ 1
- [ ] Botão "Trocar modelo" no Bloco Módulos abre `ModuleCatalogDialog` como overlay
- [ ] Editar strings MPPT1 no Bloco Inversor → chips de validação recalculam imediatamente
- [ ] `tsc --noEmit` → EXIT CODE 0

---

## 8. Fora do escopo (v2.0)

- **Edição das 12 faturas mensais inline** — `ConsumptionCanvasView` é o lugar correto
- **Configuração de MPPTs assimétricos inline** — `ElectricalCanvasView` é o lugar correto
- **Criação de novos inversores/módulos a partir do bloco** — LeftOutliner / catálogos
- **~~Persistência do `editingBlockId` entre sessões~~** — eliminado; foco é o `activeFocusedBlock` do uiStore

---

## Referências

- **Mecanismo de foco:** `spec-sincronia-bloco-canvas-2026-04-15.md`
- Compositor de Blocos: `spec-compositor-blocos-2026-04-15.md`
- `ModuleCatalogDialog` e `InverterCatalogDialog`: `Especificacao_P4_Catalogos_Kurupira.md`
- `updateMPPTConfig`: `useTechStore.ts`
- Zundo `partialize`: não afetado (campos editados são paramétricos, já incluídos)

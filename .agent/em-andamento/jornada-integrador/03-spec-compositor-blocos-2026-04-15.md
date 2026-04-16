# Spec — Compositor de Blocos: LeftOutliner como Centro da Jornada

**Tipo:** Feature Existente + Refinamento de Arquitetura
**Módulo:** `engineering` — `LeftOutliner`, `solarStore`, `uiStore`
**Prioridade:** P0 — Bloqueante
**Responsável (impl.):** `the-builder`
**Revisor (aceitação):** `engenheiro-eletricista-pv` + `design-lead`
**Data de criação:** 2026-04-14
**Versão:** 2.0 — revisado 2026-04-15
**Supersede:** `spec-compositor-blocos-2026-04-14.md` v1.0

---

## Changelog v2.0

| Seção | Mudança |
|-------|---------|
| §1 | Diagnóstico atualizado: problema original resolvido em parte pelo MVP v3.6 |
| §2 | `ComposerCanvasView` no CenterCanvas **eliminada** — Compositor permanece no LeftOutliner |
| §2.2 | `systemCompositionSlice` mantido, mas agora alimenta o LeftOutliner diretamente |
| §3 | Blocos ganham comportamento de foco via `activeFocusedBlock` (spec-sincronia) |
| §4 | `spec-sincronia-bloco-canvas` é nova dependência — não mais alternativa |
| §5 | Arquivos afetados: `ComposerCanvasView.tsx` como arquivo novo removido |
| Geral | Referências ao `RightInspector` removidas (eliminado no MVP) |

---

## 1. Diagnóstico (v2.0)

### 1.1 Situação atual

O MVP v3.6 entregou o Compositor de Blocos no LeftOutliner com:
- ✅ Pilha Consumo → Módulos → Inversor com conectores Lego (Tab/Notch)
- ✅ Cascata de ativação: `LockedBlock` → bloco ativo quando predecessor tem dados
- ✅ Chips de validação no Bloco Inversor (FDI, Voc, Isc)
- ✅ `ComposerBlockModule.tsx` e `ComposerBlockInverter.tsx` operacionais

O que ainda falta para o Compositor ser o **guia ativo da jornada**:

| Indicador | Estado atual | Estado desejado |
|-----------|-------------|-----------------|
| Clicar no bloco abre a view correspondente | ❌ Blocos sem onClick funcional | ✅ `setFocusedBlock()` no onClick |
| Bloco focado tem glow visual | ❌ Sem estado de foco | ✅ `ring-2` + glow por cor de bloco |
| Blocos não focados recuam | ❌ Todos sempre opacity-100 | ✅ `opacity-40` quando outro está em foco |
| Conector mostra dado transitado | ⚠️ Parcial — LegoTab tem label | ✅ Conector mostra kWp alvo calculado |

### 1.2 O que NÃO muda

O Compositor **fica no LeftOutliner**. A ideia de uma `ComposerCanvasView` separada
no CenterCanvas foi descartada. O CenterCanvas é para as views de trabalho (mapa,
elétrica, simulação, consumo). O LeftOutliner é para a pilha de composição — é o
lugar correto pela metáfora Lego/Scratch/Tinkercad.

---

## 2. A Proposta Refinada (v2.0)

### 2.1 Conceito central (mantido)

Blocos que declaram contratos de entrada/saída. Conectores que mostram o dado
transitado. Placeholders que comunicam o que falta. O integrador vê o raciocínio
do sistema, não apenas o resultado.

### 2.2 O que muda: blocos como pontos de foco

Cada bloco ganha um `onClick` que chama `setFocusedBlock(id)` no `uiStore`.
Esse campo é a única fonte de verdade para:
1. Qual bloco tem glow (estado visual no LeftOutliner)
2. Qual view está ativa no CenterCanvas (via `spec-sincronia-bloco-canvas`)

```
Bloco Consumo.onClick   → setFocusedBlock('consumption')
Bloco Módulos.onClick   → setFocusedBlock('module')
Bloco Inversor.onClick  → setFocusedBlock('inverter')
```

O `systemCompositionSlice` continua existindo como camada de view derivada —
ele lê dos stores existentes e expõe o estado dos blocos (chips, status, sugestões).
Nenhum dado novo é armazenado nele.

### 2.3 O Dimensionamento Inteligente no novo modelo (mantido)

O botão "Dimensionamento Inteligente" no TopRibbon:
1. Só fica ativo quando `clientData.averageConsumption > 0`
2. Ao clicar → anima a materialização dos blocos em sequência (lego-snap)
3. Após animação → chama `setFocusedBlock('module')` automaticamente
   (leva o integrador para o próximo passo natural)

---

## 3. Anatomia dos Blocos (v2.0)

### 3.1 Estrutura (mantida)

```
┌─ [ícone] [título]         [resumo] ─┐  ← header
│  [chip] [chip] [chip]                │  ← body: chips de status
└──────────────────────────────────────┘
```

### 3.2 Estados visuais (novo em v2.0)

| Estado | Classe CSS | Condição |
|--------|-----------|---------|
| **Focado** | `ring-2 opacity-100 shadow-[glow]` | `activeFocusedBlock === blocoId` |
| **Desfocado** | `opacity-40 grayscale-[0.15]` | `activeFocusedBlock !== null && !== blocoId` |
| **Neutro** | `opacity-100` | `activeFocusedBlock === null` |
| **Locked** | `opacity-25 pointer-events-none` | predecessor incompleto |

Cores de glow (spec-foco-tatil):
- Consumo: `rgba(245, 158, 11, 0.4)` — Amber
- Módulos: `rgba(14, 165, 233, 0.4)` — Sky
- Inversor: `rgba(16, 185, 129, 0.4)` — Emerald

### 3.3 Conectores (mantidos com refinamento)

| Conector | Dado exibido | Quando indisponível |
|----------|-------------|-------------------|
| Consumo → Módulo | `kWp alvo: X.XX kWp` | `—` (cinza) |
| Módulo → Inversor | `topologia: N strings, Voc XXX V` | `—` (cinza) |

---

## 4. systemCompositionSlice (mantido, simplificado)

```typescript
// src/core/state/slices/systemCompositionSlice.ts

interface BlockStatus {
  status: 'complete' | 'warning' | 'error' | 'empty';
  chips: Array<{
    label: string;
    value: string;
    severity: 'ok' | 'warn' | 'error' | 'neutral';
  }>;
}

interface SystemCompositionState {
  consumptionBlock: BlockStatus;
  moduleBlock: BlockStatus;
  inverterBlock: BlockStatus;
  connectorC1: { label: string; value: string; active: boolean };
  connectorC2: { label: string; value: string; active: boolean };
  // Animação do Dimensionamento Inteligente
  autoSizingInProgress: boolean;
  autoSizingStep: 'idle' | 'consumption' | 'module' | 'inverter' | 'done';
}
```

Todo o estado continua derivado — zero dados novos armazenados. Lê de
`solarStore.clientData`, `useTechStore.modules`, `useTechStore.inverters`,
`journeySlice.kWpAlvo`.

---

## 5. Arquivos Afetados (v2.0)

### Modificar

| Arquivo | Mudança |
|---------|---------|
| `ui/panels/LeftOutliner.tsx` | Adicionar `onClick → setFocusedBlock('consumption')` no `ConsumptionBlock`; estados de foco/desfoco |
| `canvas-views/composer/ComposerBlockModule.tsx` | Adicionar `onClick → setFocusedBlock('module')`; estados de foco/desfoco |
| `canvas-views/composer/ComposerBlockInverter.tsx` | Adicionar `onClick → setFocusedBlock('inverter')`; estados de foco/desfoco |
| `hooks/useAutoSizing.ts` | Despachar `autoSizingStep` ao slice durante execução; chamar `setFocusedBlock('module')` após conclusão |

### Criar

| Arquivo | Propósito |
|---------|-----------|
| `core/state/slices/systemCompositionSlice.ts` | Seletores derivados para estado dos chips (inalterado da v1.0) |

### Removidos vs v1.0 (não criar)

| Arquivo v1.0 | Motivo |
|--------------|--------|
| `canvas-views/ComposerCanvasView.tsx` | Compositor permanece no LeftOutliner |
| `canvas-views/composer/ComposerBlock.tsx` | Blocos já existem como `ComposerBlock*` específicos |
| `canvas-views/composer/ComposerPlaceholder.tsx` | `LockedBlock` já existe no `LeftOutliner.tsx` |
| `canvas-views/composer/ComposerConnector.tsx` | Conectores são os `LegoTab/LegoNotch` existentes |

### Sem alteração (explícito)

| Arquivo | Motivo |
|---------|--------|
| `core/state/useTechStore.ts` | Fonte de verdade não muda |
| `core/state/solarStore.ts` | `systemCompositionSlice` apenas lê |
| `canvas-views/LegoConnectors.tsx` | LegoTab/LegoNotch já implementados |

---

## 6. Plano de Migração (v2.0)

```
Fase A: systemCompositionSlice (seletores derivados)
  → Slice existe; chips derivados funcionam; nenhum componente consome ainda

Fase B: onClick nos blocos + integração com activeFocusedBlock
  → Clicar num bloco ativa foco visual + muda view no canvas
  → Dependência: spec-sincronia-bloco-canvas Etapa 4 concluída

Fase C: Estados visuais foco/desfoco nos blocos
  → glow âmbar/sky/esmeralda no bloco focado; outros em opacity-40

Fase D: Animação do Dimensionamento Inteligente
  → autoSizingStep despachado; lego-snap em sequência; setFocusedBlock ao final
```

### Guardrails
- [ ] `LeftOutliner` e árvore de topologia não são alterados estruturalmente
- [ ] `systemCompositionSlice` não armazena dados — apenas seletores derivados
- [ ] `tsc --noEmit` passa ao fim de cada fase

---

## 7. Avaliação de Riscos (v2.0)

| Risco | Prob. | Sev. | Mitigação |
|-------|:-----:|:----:|-----------|
| `systemCompositionSlice` ficando stale | Baixa | Alta | Implementar como seletores com `useShallow` — não como estado local |
| onClick no bloco conflitar com interações existentes (ex: scroll da pilha) | Média | Baixa | `onClick` no container do bloco; sem propagação para elementos filhos que já têm handlers |
| Glow visual causar reflow no layout do LeftOutliner | Baixa | Baixa | `box-shadow` (não `outline`) para glow — não afeta layout |
| Integrador de tela pequena com ambos os painéis visíveis sem espaço | Média | Média | LeftOutliner colapsável via botão existente no TopRibbon |

---

## 8. Critérios de Aceitação (v2.0)

### Funcionais
- [ ] Clicar no Bloco Consumo → canvas desliza para ConsumptionCanvasView + bloco recebe glow âmbar
- [ ] Clicar no Bloco Módulos → canvas desliza para MapCore + bloco recebe glow sky
- [ ] Clicar no Bloco Inversor → canvas desliza para ElectricalCanvasView + bloco recebe glow esmeralda
- [ ] Bloco não focado fica em opacity-40 enquanto outro está em foco
- [ ] Clicar no canvas vazio → `clearSelection()` → todos os blocos voltam para opacity-100
- [ ] Projeto com oversize ratio > 1.35 exibe chip "Ratio DC/AC" em vermelho no Bloco Inversor
- [ ] Dimensionamento Inteligente anima lego-snap nos blocos em sequência
- [ ] Após Dimensionamento Inteligente → `activeFocusedBlock` vai para `'module'` automaticamente

### Técnicos
- [ ] `tsc --noEmit` → EXIT CODE 0
- [ ] `systemCompositionSlice` sem estado novo — apenas seletores derivados
- [ ] `LeftOutliner.tsx` sem modificações estruturais (apenas adição de onClick e classes CSS)

### Engenharia
- [ ] Chips do Bloco Inversor validados: DMEGC 610W × 6 un. + PHB 5kW → oversize 1.15, Voc 299V, Isc 13.2A
- [ ] Engenheiro revisor confirma chips `warn` e `error` refletem limites da NBR 16690

---

## 9. O que este escopo desbloqueia (mantido)

| Feature | Desbloqueio |
|---------|-------------|
| Jornada do integrador fluida | Blocos são o fio condutor visual de todo o dimensionamento |
| Onboarding de novos integradores | Sistema auto-explicativo pelo estado dos blocos |
| `spec-guardiao-aprovacao` | Estado dos chips dos blocos alimenta a lógica de aprovação |
| Multi-inversor (futuro) | Bloco Inversor com modo expandido suporta N inversores |

---

## 10. Fora do escopo (v2.0)

- **~~ComposerCanvasView no CenterCanvas~~** — eliminado; Compositor é e permanece no LeftOutliner
- **Substituição da árvore do LeftOutliner** — blocos convivem com a árvore de topologia
- **Multi-inversor** — `spec-multi-inversor-2026-04-14.md` (paralelo, P1)
- **Edição inline de campos** — `spec-edicao-inline-blocos-2026-04-14.md` (paralelo, P1)

---

## Referências

- **Mecanismo de foco:** `spec-sincronia-bloco-canvas-2026-04-15.md`
- **Estados visuais detalhados:** `spec-foco-tatil.md`
- Edição inline: `spec-edicao-inline-blocos-2026-04-14.md`
- Mapa do LeftOutliner: `docs/interface/mapa-left-outliner.md`
- `calculateStringMetrics()`: `electricalMath.ts`
- Norma: NBR 16690:2019

# Escopo — Jornada Completa do Integrador

**Tipo:** Épico de Experiência (orquestra specs existentes)
**Módulo:** Transversal — `engineering` + `proposal` + `documentation`
**Prioridade:** P0 — Bloqueante
**Responsável (impl.):** `the-builder`
**Revisor (aceitação):** `engenheiro-eletricista-pv` + `design-lead`
**Data de criação:** 2026-04-14
**Versão:** 2.0 — revisado 2026-04-15
**Origem:** consolidação das specs do Compositor de Blocos + TRL 7-8
**Supersede:** `scope-jornada-integrador-2026-04-14.md` v1.0

---

## Changelog v2.0

| Seção | Mudança |
|-------|---------|
| §2 | Jornada reescrita: 6 Atos colapsados em modelo **Bloco ↔ View** sem progressão por abas separadas |
| §3–§8 | Cada Ato atualizado com o mecanismo de sincronia `activeFocusedBlock` |
| §9 | Mapa de dependências atualizado — `spec-sincronia-bloco-canvas` é nova fundação |
| §11 | Tabela de rastreabilidade atualizada — stepper removido, edição inline mantida |
| Geral | Referências ao `RightInspector` removidas (eliminado no MVP atual) |
| Geral | Referências ao `JourneyStepBar` removidas (substituído por sincronia bloco-aba) |
| Geral | `ComposerCanvasView` como CenterCanvas removido — Compositor permanece no LeftOutliner |

---

## 1. O que é este documento

Este escopo define a **experiência completa do integrador** como uma narrativa com
começo, meio e fim — e mapeia cada momento a uma spec técnica ou componente existente.

**Critério de conclusão deste épico (inalterado):**

> O integrador abre o Kurupira, cria um projeto para um cliente real em Parauapebas-PA,
> dimensiona o sistema usando o Compositor de Blocos, valida a elétrica, posiciona os
> módulos no telhado, aprova o sistema e gera a proposta — do zero à entrega, sem
> planilha paralela e sem consultar um colega sobre o que fazer a seguir.

---

## 2. A Jornada — Modelo Bloco ↔ View

A jornada não é mais uma progressão linear por abas ou stepper. É uma **tela única**
onde o integrador sempre vê os blocos à esquerda e o canvas à direita. O progresso
é dado pelo estado dos blocos, não pela posição numa lista de etapas.

```
LEFT OUTLINER (sempre visível)     CENTER CANVAS (muda de foco)
─────────────────────────────      ──────────────────────────────
⚡ Bloco Consumo        [âmbar] ←→  ConsumptionCanvasView
☀  Bloco Módulos FV    [cyan]  ←→  MapCore (modo posicionamento)
🔲 Bloco Inversor      [verde] ←→  ElectricalCanvasView
📊 Bloco Simulação     [saída] ←→  SimulationCanvasView
```

**Princípio central:** clicar num bloco ativa a view correspondente no canvas.
Clicar na aba do bottom produz o mesmo efeito. São dois pontos de entrada para
o mesmo estado: `activeFocusedBlock` no `uiStore`.

**Autosave otimista:** desliza sempre, salva automaticamente. Sem prompt de
confirmação ao trocar de bloco/view.

**Spec que implementa este mecanismo:** `spec-sincronia-bloco-canvas-2026-04-15.md`

---

## 3. Ato 1 — Entrada: Criar ou Abrir Projeto

### O que o integrador quer fazer
Chegar ao workspace de dimensionamento sem fricção.

### Dois caminhos (inalterados)
- **Caminho A — via Iaçã:** deep link `?leadId=X&token=JWT` → workspace com dados pré-carregados
- **Caminho B — standalone:** Hub → "+ Novo Projeto" → `ProjectInitWizardModal` → workspace

### Estado atual
✅ Ambos os caminhos existem e funcionam (v3.2.0).
✅ Bootstrap de equipamentos default ao abrir projeto vazio.

### Lacuna — abertura padrão
Ao abrir workspace novo, `activeFocusedBlock` deve ser inicializado como `'consumption'`
— o canvas abre direto na `ConsumptionCanvasView`, o bloco Consumo já está em foco,
o integrador sabe imediatamente o que fazer.

**Spec responsável:** `spec-sincronia-bloco-canvas-2026-04-15.md` §6 (guardrails)

---

## 4. Ato 2 — Consumo: Inserir Dados do Cliente

### O que o integrador quer fazer
Informar o consumo histórico e dados da instalação para que o sistema calcule
o `kWp alvo` automaticamente.

### Fluxo no novo modelo
1. Workspace abre com Bloco Consumo em foco (âmbar, glow ativo).
2. Canvas mostra `ConsumptionCanvasView` — gráfico de 12 meses editável.
3. Integrador edita consumo médio diretamente no canvas.
4. Bloco Consumo no Left atualiza em tempo real: consumo médio + kWp alvo.
5. Integrador pode aprofundar: correlação com temperatura histórica, cargas simuladas,
   fator de crescimento — tudo na mesma view, sem trocar de tela.
6. Quando `averageConsumption > 0` → Bloco Módulos desbloqueia (`lego-snap`).

### Estado atual
✅ `clientData.averageConsumption`, `monthlyConsumption[12]`, `tariffRate` existem no store.
✅ `ConsumptionBlock` no LeftOutliner sempre ativo (raiz da pilha).
⚠️ `ConsumptionCanvasView` não existe (a criar).
⚠️ Correlação consumo × temperatura depende de disponibilidade de `weatherData`.

**Spec responsável:** `spec-sincronia-bloco-canvas-2026-04-15.md` §4

---

## 5. Ato 3 — Dimensionamento: Módulos FV

### O que o integrador quer fazer
Selecionar o módulo e ver a quantidade mínima calculada automaticamente.

### Fluxo no novo modelo
1. Integrador clica no Bloco Módulos (ou aba "Módulos" no bottom).
2. Canvas desliza para `MapCore` em modo posicionamento.
3. Bloco Módulos mostra: modelo selecionado, kWp instalado, cobertura (%).
4. Botão "Dimensionamento Inteligente" no TopRibbon fica ativo quando consumo > 0.
5. Integrador clica → módulo sugerido aparece no bloco com quantidade calculada
   + animação `lego-snap` de desbloqueio do Bloco Inversor.
6. Edição de quantidade: inline no bloco (campo numérico simples).
7. Troca de modelo: overlay de catálogo disparado pelo bloco.

### Estado atual
✅ `ComposerBlockModule.tsx` existe e operacional.
✅ `useAutoSizing()` calcula quantidade mínima.
✅ `ModuleCatalogDialog` existe.
⚠️ Bloco não dispara `setFocusedBlock('module')` no onClick.
⚠️ Aba "Módulos" no bottom não está sincronizada com o bloco.

**Specs responsáveis:**
- `spec-sincronia-bloco-canvas-2026-04-15.md` §3.3 (glow/foco no bloco)
- `spec-edicao-inline-blocos-2026-04-14.md` §3.2 (campo quantidade inline) — **mantida**

---

## 6. Ato 4 — Posicionamento: Arranjo Físico no Telhado

### O que o integrador quer fazer
Desenhar a área do telhado e posicionar os módulos para validar que cabem fisicamente.

### Fluxo no novo modelo
1. Com Bloco Módulos focado, o canvas já está no `MapCore`.
2. Ferramentas de desenho disponíveis no HUD do mapa: Desenhar Área, Auto-Layout.
3. Integrador desenha o polígono → clica Auto-Layout → módulos preenchem a área.
4. Bloco Módulos (ou Bloco Arranjo, se implementado) atualiza chip de consistência:
   `physicalCount === logicalCount`.
5. Navegar de volta para Bloco Inversor → canvas desliza para `ElectricalCanvasView`
   com a topologia já refletindo o posicionamento.

### Estado atual
✅ `InstallationArea` freeform completa (v3.1.0 + P10/P10.1).
✅ Auto-Layout com otimização Portrait/Landscape implementado.
✅ Cruzamento físico-lógico no `HealthCheckWidget`.
⚠️ Chip de consistência no Bloco Módulos não existe.

> **Nota v2.0:** O Bloco Arranjo Físico (`spec-bloco-arranjo-fisico-2026-04-14.md`)
> permanece válido como evolução futura. No modelo atual, o posicionamento é acessado
> via Bloco Módulos → MapCore. A spec do Bloco Arranjo pode ser implementada em
> paralelo sem bloquear a jornada principal.

---

## 7. Ato 5 — Validação Elétrica: Inversor

### O que o integrador quer fazer
Selecionar o inversor, ver a validação elétrica e confirmar que o sistema está coerente.

### Fluxo no novo modelo
1. Integrador clica no Bloco Inversor (ou aba "Elétrica" no bottom).
2. Canvas desliza para `ElectricalCanvasView`.
3. Bloco Inversor mostra chips ao vivo: FDI, Voc, Isc — semáforo.
4. Na view, integrador vê: diagrama de strings, catálogo de inversores, validação
   com temperatura mínima histórica integrada.
5. Quando todos os chips do Bloco Inversor estão verdes → Bloco Simulação aparece
   como saída da pilha (`lego-snap`).

### Estado atual
✅ `ComposerBlockInverter.tsx` existe e operacional.
✅ `ElectricalCanvasView` existe.
✅ `useElectricalValidation()` calcula chips.
⚠️ Bloco não dispara `setFocusedBlock('inverter')` no onClick.

**Specs responsáveis:**
- `spec-sincronia-bloco-canvas-2026-04-15.md` §3.3
- `spec-edicao-inline-blocos-2026-04-14.md` §3.4 — **mantida**

---

## 8. Ato 6 — Aprovação e Saída: Simulação + Proposta

### O que o integrador quer fazer
Ver o resultado financeiro, aprovar o sistema e gerar a proposta.

### Fluxo no novo modelo
1. Todos os chips dos blocos Consumo, Módulos e Inversor estão verdes.
2. Bloco Simulação aparece na pilha como bloco de saída (não tem foco próprio —
   é resultado, não entrada).
3. Integrador clica na aba "Simulação" (ou no bloco) → canvas mostra
   `SimulationCanvasView`: geração vs consumo 12 meses, payback, economia R$.
4. Botão "Aprovar sistema" no TopRibbon fica ativo (guardião de aprovação).
5. Integrador aprova → projeto vai para `APPROVED` → botão "Gerar Proposta" aparece.
6. Proposta abre o módulo `proposal/` com dados já preenchidos.

### Estado atual
✅ `SimulationCanvasView` existe.
✅ Estados `DRAFT` e `APPROVED` no backend.
✅ Dropdown de aprovação no `TopRibbon` existe.
✅ Módulo `proposal/` operacional.
⚠️ Guardião de aprovação não conectado ao estado dos blocos.
⚠️ Botão "Gerar Proposta" pós-aprovação não existe no fluxo do Compositor.
⚠️ Motor de geração usa 30 dias fixos/mês (Gap G1 — spec aguardando).

**Specs responsáveis:**
- `spec-guardiao-aprovacao-2026-04-15.md` — conecta blocos à aprovação
- `spec-motor-analitico-faturado` (aguardando) — corrige 30 dias fixos
- `spec-monetizacao-banco-creditos` (aguardando) — kWh → R$ + ANEEL

---

## 9. Mapa de Dependências entre Specs (v2.0)

```
spec-sincronia-bloco-canvas          ← FUNDAÇÃO (nova — P0)
  ├── ConsumptionCanvasView (§4)
  │     ├── Correlação climática (depende de weatherData)
  │     └── Cargas simuladas (spec-edicao-inline §3.1 adaptada)
  ├── spec-foco-tatil                 ← glow/deemphasis dos blocos
  ├── spec-edicao-inline-blocos       ← campos inline nos blocos (mantida)
  │     └── campos: consumo, qtd módulos, fator crescimento
  └── spec-bloco-arranjo-fisico       ← chip consistência (paralelo, não bloqueante)

spec-guardiao-aprovacao-2026-04-15      ← desbloqueado pela sincronia
  └── Ato 6 completo

spec-motor-analitico-faturado        ← paralelo (não depende da sincronia)
spec-monetizacao-banco-creditos      ← paralelo
spec-multi-inversor                  ← paralelo (P1, após sincronia)
```

**Mudança principal vs v1.0:** `spec-compositor-blocos` com `ComposerCanvasView` no
CenterCanvas foi **substituída** por `spec-sincronia-bloco-canvas`. O Compositor
permanece no LeftOutliner — era o lugar correto desde o início.

---

## 10. Lacunas sem spec

### Lacuna A — `spec-guardiao-aprovacao` ✅ Especificada
Spec criada em `spec-guardiao-aprovacao-2026-04-15.md`. Pendente apenas de implementação.

### Lacuna B — abertura padrão `activeFocusedBlock = 'consumption'`
Coberta pela `spec-sincronia-bloco-canvas-2026-04-15.md` §6 (guardrails).

### Lacuna C — Dimensionamento Inteligente com pré-condição
Botão desabilitado com tooltip quando `averageConsumption === 0`.
Coberta por `spec-sincronia-bloco-canvas-2026-04-15.md` §3.3 (foco + estado do bloco).

---

## 11. Tabela de rastreabilidade (v2.0)

| Momento da jornada | Spec responsável | Estado |
|-------------------|-----------------|--------|
| Criar projeto (Hub → Workspace) | Implementado v3.2.0 | ✅ |
| Bootstrap de equipamentos default | Implementado v3.1.0 | ✅ |
| Abertura com `activeFocusedBlock = 'consumption'` | spec-sincronia §6 | ⚠️ Falta |
| Bloco Consumo em foco → ConsumptionCanvasView | spec-sincronia §3.1–3.2 | ⚠️ Falta |
| ConsumptionCanvasView (gráfico + edição) | spec-sincronia §4 | ⚠️ A criar |
| Correlação consumo × temperatura | spec-sincronia §4.1 Seção 2 | ⚠️ A criar |
| Cargas simuladas na view | spec-sincronia §4.1 Seção 3 | ⚠️ A criar |
| kWp alvo calculado em tempo real | spec-sincronia §4.3 + journeySlice | ⚠️ Falta |
| Bloco Módulos → glow + ativa MapCore | spec-sincronia §3.3 | ⚠️ Falta |
| Quantidade de módulos inline | spec-edicao-inline §3.2 | ⚠️ Falta |
| Troca de modelo via overlay catálogo | spec-edicao-inline §3.2 | ⚠️ Falta |
| Bloco Inversor → glow + ativa ElectricalCanvasView | spec-sincronia §3.3 | ⚠️ Falta |
| Edição inline no bloco inversor | spec-edicao-inline §3.4 | ⚠️ Falta |
| Chip consistência físico-lógico | spec-bloco-arranjo-fisico | ⚠️ Paralelo |
| Bloco Simulação como saída da pilha | spec-sincronia §2 (tabela) | ⚠️ Falta |
| Bottom Tabs sincronizados com blocos | spec-sincronia §3.4 | ⚠️ Falta |
| Guardião de aprovação | `spec-guardiao-aprovacao-2026-04-15.md` | ⚠️ Falta implementar |
| Botão "Gerar Proposta" pós-aprovação | `spec-guardiao-aprovacao-2026-04-15.md` | ⚠️ Falta implementar |
| Economia R$ correta no módulo Proposta | spec-motor-analitico-faturado | ⚠️ Aguardando |
| Payback calculado automaticamente | spec-monetizacao-banco-creditos | ⚠️ Aguardando |

---

## 12. Critérios de Aceitação do Épico (v2.0)

- [ ] Workspace abre com Bloco Consumo em foco e ConsumptionCanvasView ativa
- [ ] Integrador edita consumo → kWp alvo atualiza em tempo real no bloco
- [ ] Clicar no Bloco Módulos → canvas desliza para MapCore sem desmontagem
- [ ] Clicar em qualquer aba do bottom → bloco correspondente recebe glow
- [ ] Bloco Inversor com todos chips verdes → Bloco Simulação aparece na pilha
- [ ] Botão "Aprovar sistema" só fica ativo quando blocos Consumo + Módulos + Inversor estão completos
- [ ] Integrador aprova → botão "Gerar Proposta" aparece
- [ ] Proposta gerada mostra economia R$ e payback com valores corretos
- [ ] Nenhuma Canvas View desmonta ao navegar entre blocos (verificar React DevTools)
- [ ] Todo o fluxo acima sem nenhum prompt de "salvar"

---

## 13. Fora do escopo deste épico (atualizado)

- **Módulo BOS (cabos, proteções)** — desbloqueado pelo épico mas não contido nele
- **Diagrama unifilar automático** — `spec-integracao-unifilar-simbolos` (aguardando)
- **Multi-inversor no Compositor** — `spec-multi-inversor-2026-04-14.md` (paralelo, P1)
- **App mobile** — responsivo por design mas otimização mobile é épico separado
- **Integração com distribuidoras (AcessoNet/GD)** — documentação gerada, envio eletrônico fora
- **~~JourneyStepBar / stepper de 5 etapas~~** — eliminado; substituído por sincronia bloco-aba
- **~~ComposerCanvasView no CenterCanvas~~** — eliminado; Compositor permanece no LeftOutliner
- **~~RightInspector~~** — eliminado no MVP atual; edições complexas via overlays e views

---

## Referências

- **Nova fundação:** `spec-sincronia-bloco-canvas-2026-04-15.md`
- Foco tátil dos blocos: `spec-foco-tatil.md`
- Edição inline: `spec-edicao-inline-blocos-2026-04-14.md`
- Bloco Arranjo Físico: `spec-bloco-arranjo-fisico-2026-04-14.md`
- Multi-inversor: `spec-multi-inversor-2026-04-14.md`
- Motor analítico: `.agent/aguardando/spec-motor-analitico-faturado`
- Monetização: `.agent/aguardando/spec-monetizacao-banco-creditos`
- Mapa de interface: `docs/interface/mapa-interface-completo.md`
- Left Outliner: `docs/interface/mapa-left-outliner.md`

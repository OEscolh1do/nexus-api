# Escopo — Jornada Completa do Integrador

**Tipo:** Épico de Experiência (orquestra specs existentes)
**Módulo:** Transversal — `engineering` + `proposal` + `documentation`
**Prioridade:** P0 — Bloqueante
**Responsável (impl.):** `the-builder`
**Revisor (aceitação):** `engenheiro-eletricista-pv` + `design-lead`
**Data de criação:** 2026-04-14
**Versão:** 3.7 — alinhado ao Escopo Definitivo 2026-04-15
**Origem:** consolidação v3.7 — inclusão de Arranjo, Site e Proposta
**Supersede:** `00-scope-jornada-integrador-2026-04-15.md` v2.0

---

## Changelog v2.0

| Seção | Mudança |
|-------|---------|
| §2 | Jornada v3.7: 8 Atos/Blocos incluindo Arranjo, Site e Proposta |
| §2.1 | Definição de Grid Master: Outliner fixo em 240px |
| §3–§8 | Sincronia `activeFocusedBlock` expandida para 9 estados |
| §11 | Tabela de rastreabilidade para v3.7 completa |
| Geral | Alinhamento de cores: Arranjo (Indigo), Site (Violet), Proposta (Indigo) |
| Geral | Remoção de referências obsoletas à v1.0 |
| Geral | Grid 75/25 para views de engenharia (Consumo, Elétrica) |

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
onde o integrador sempre vê os blocos à esquerda e o canvas à direita.

### 2.1 Estrutura de Layout (Grid Master)

- **LeftOutliner:** Fixo em `240px`. Contém a pilha Lego do Compositor.
- **CenterCanvas:** `flex-1`. Slot polimórfico para as Views de Engenharia.
- **Views 75/25:** Consumo e Elétrica usam grid interno `grid-cols-[3fr_1fr]`.

### 2.2 Pilha de Composição (Lego)

```
LEFT OUTLINER (240px)              CENTER CANVAS (flex-1)
─────────────────────────────      ──────────────────────────────
⚡ Bloco Consumo        [âmbar] ←→  ConsumptionCanvasView
- **Ato 2: Módulos (Sky) — Escolha Técnica**
  - Foco: Seleção do modelo de módulo no catálogo.
  - View: `ModuleCanvasView` (75/25 grid).
  - Resultado: Modelo de módulo definido para o projeto.

- **Ato 3: Arranjo (Indigo) — Design Espacial**
  - Foco: Posicionamento dos módulos e desenho de áreas no telhado.
  - View: `MapCanvasView` (MapCore em modo desenho).
  - Resultado: Arranjo físico definido e validado contra o dimensionamento elétrico.
🔲 Bloco Inversor      [verde] ←→  ElectricalCanvasView
📊 Bloco Simulação     [saída] ←→  SimulationCanvasView
🏗  Aba Site            [violet]←→  SiteCanvasView
📄 Aba Proposta        [indigo]←→  ProposalModule
```

**Princípio central:** clicar num bloco ativa a view correspondente no canvas.

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
- `05-spec-edicao-inline-blocos-2026-04-15.md.md` §3.2 (campo quantidade inline) — **mantida**

---

---

## 6. Ato 4 — Posicionamento: Arranjo Físico no Telhado

### O que o integrador quer fazer
Desenhar a área do telhado e posicionar os módulos para validar que cabem fisicamente.

### Fluxo no novo modelo
1. Integrador clica no Bloco Arranjo (Indigo).
2. Canvas desliza para `MapCore` em modo desenho.
3. Ferramentas de desenho disponíveis no HUD do mapa: Desenhar Área, Auto-Layout.
4. Bloco Arranjo atualiza chip de consistência: `physicalCount === logicalCount`.
5. Se inconsistente (△N), bloco exibe aviso em âmbar/vermelho.

### Estado atual
✅ `InstallationArea` freeform completa (v3.1.0).
✅ Auto-Layout operacional.
⚠️ Bloco Arranjo em implementação (spec-09).

**Spec responsável:** `09-spec-bloco-arranjo-fisico-2026-04-15.md`

---

## 7. Ato 5 — Validação Elétrica: Inversor

### O que o integrador quer fazer
Selecionar o inversor, ver a validação elétrica e confirmar que o sistema está coerente.

### Fluxo no novo modelo
1. Integrador clica no Bloco Inversor (ou aba "Elétrica").
2. Canvas desliza para `ElectricalCanvasView` (Grid 75/25).
3. Bloco Inversor mostra chips ao vivo: FDI, Voc, Isc — semáforo.
4. Na view, integrador vê: diagrama de strings, catálogo de inversores.

---

## 8. Ato 6 — Simulação: Análise de Geração

### Fluxo
1. Integrador clica no Bloco Simulação (ou aba "Simulação").
2. Canvas mostra `SimulationCanvasView` (Teal).
3. Visualiza: Geração 12m, Payback, Curva Diária.

---

## 9. Ato 7 — Dossiê: Site e Localização

### Fluxo
1. Clicar na aba "Site" (Violet).
2. Canvas mostra `SiteCanvasView`: cards de irradiação, temperatura e dados do cliente.

---

## 10. Ato 8 — Finalização: Proposta Comercial

### Fluxo
1. Integrador aprova o sistema ($APPROVED$).
2. Aba "Proposta" (Indigo) desbloqueia.
3. Canvas mostra `ProposalModule`.

---

## 11. Mapa de Dependências entre Specs (v3.7)

```
spec-sincronia-bloco-canvas          ← FUNDAÇÃO (v3.7)
  ├── ConsumptionCanvasView
  ├── spec-foco-tatil (glow/vibration)
  ├── spec-compositor-blocos         ← Orquestra a pilha Lego
  └── spec-bloco-arranjo-fisico       ← Nova integração obrigatória
```

---

## 12. Tabela de rastreabilidade (v3.7)

| Momento da jornada | Spec responsável | Estado |
|-------------------|-----------------|--------|
| Abertura com `activeFocusedBlock = 'consumption'` | spec-sincronia §6 | ⚠️ Falta |
| Bloco Consumo → ConsumptionCanvasView (75/25) | spec-sincronia §4 | ⚠️ Em refatoração |
| Bloco Arranjo → MapCore (Desenho) | 09-spec-bloco-arranjo | ⚠️ Falta |
| Bloco Inversor → ElectricalCanvasView (75/25) | spec-sincronia §3.3 | ⚠️ Falta |
| Aba Site → SiteCanvasView (Violet) | 11-spec-canvas §6 | ⚠️ Falta |
| Aba Proposta → ProposalModule (Indigo) | 11-spec-canvas §7 | ⚠️ Falta |

---

## 13. Critérios de Aceitação (v3.7)

- [ ] Workspace abre no Ato 1 (Consumo) com Outliner de 240px.
- [ ] Clicar em Arranjo (Indigo) ativa MapCore em modo desenho.
- [ ] Views de Engenharia respeitam grid 75/25.
- [ ] Sincronia bidirecional entre 9 estados de foco e abas.

---

## Referências

- **Mestre:** `escopo-definitivo-kurupira-v3.7-2026-04-15.md`
- Sincronia: `01-spec-sincronia-bloco-canvas-2026-04-15.md`
- Arranjo: `09-spec-bloco-arranjo-fisico-2026-04-15.md`
- Design: `11-spec-canvas-views-design-2026-04-15.md`


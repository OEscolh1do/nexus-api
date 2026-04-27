# Spec — PhysicalCanvas Layer 1: Arranjo Físico & Stringing

**Arquivo alvo:** `canvas-views/arrangement/Layer1Physical.tsx`
**Tipo:** Feature Nova
**Módulo:** `engineering` — `PhysicalCanvasView`
**Camada:** 1 de 3 (principal — onde o projeto executivo é criado)
**Prioridade:** P0 — camada de entrada de todos os dados do arranjo
**Responsável (impl.):** `the-builder`
**Revisor (aceitação):** `engenheiro-eletricista-pv` + `design-lead`
**Data de criação:** 2026-04-26
**Versão:** 1.0
**Depende de:** `spec-arrangement-layer0-contexto-satelital-2026-04-26.md`
**Alimenta:** `spec-arrangement-layer2-diagrama-blocos-2026-04-26.md`, `spec-arrangement-layer3-unifilar-2026-04-26.md`, `patch-spec-view-electrical-pv-2026-04-25.md`

---

## 1. Propósito

A Layer 1 é onde o projeto de instalação é efetivamente criado. O integrador demarca superfícies, posiciona módulos em escala 1:1 e conecta elétrica e visivelmente cada módulo a uma string. Toda a geometria e conectividade definidas aqui alimentam as layers superiores e o motor de validação elétrica.

A Layer 1 opera em **modo Blueprint** (Layer 0 dessaturada), isolando o integrador do ruído visual do satélite durante o trabalho técnico.

---

## 2. Ferramentas Disponíveis

O HUD esquerdo expõe as ferramentas desta camada:

```
┌──────────────┐
│  [🔲] Área   │  ← DRAW_POLYGON: demarca superfície de instalação
│  [☀] Módulo  │  ← PLACE_MODULE: posiciona módulo individual na grade
│  [⚡+] Str+  │  ← STRING_WIRE: cria aresta positivo→negativo
│  [⚡-] Str-  │  ← STRING_WIRE_REVERSE: aresta negativo→positivo
│  [📌] Drop   │  ← DROP_POINT: marca ponto de saída dos cabos CC
│  [🗑] Apagar │  ← DELETE: remove elemento clicado
│  ────────────│
│  [↕] Retrato │  ← orientação do módulo na grade
│  [↔] Paisag. │  ← orientação do módulo na grade
└──────────────┘
```

Apenas uma ferramenta ativa por vez. A ferramenta ativa é indicada por `bg-indigo-500/20 ring-1 ring-indigo-500`.

---

## 3. Ferramenta DRAW_POLYGON — Demarcação de Área

### 3.1 Comportamento

O integrador clica sequencialmente no mapa para definir os vértices do polígono. O polígono fecha ao clicar no primeiro vértice novamente ou pressionar `Enter`.

**Ortho-snap:** ao mover o cursor próximo de ângulo de 0°, 45° ou 90° em relação à última aresta, o sistema encaixa automaticamente. Linha de snap indicada por traço ciano enquanto ativa.

**Cotagem dinâmica:** cada aresta exibe seu comprimento em metros enquanto o polígono está sendo desenhado e após finalizado.

```
       |──────── 8.42 m ────────|
  ┌────────────────────────────────┐
  │                                │  ← vértices: círculos brancos, drag para reposicionar
  │                                │  5.20 m
  │                                │
  └────────────────────────────────┘
```

Comprimento calculado via fórmula de distância haversine (coordenadas geográficas → metros reais).

### 3.2 Configuração da área após criação

Ao fechar o polígono, um painel de configuração inline aparece sobre a área:

```
┌─────────────────────────────────────────────────────┐
│ Nova Área — configuração                            │
│                                                     │
│ Azimute:   [180°]  Inclinação: [14°]               │
│ Superfície: [● Cerâmica  ○ Metálica  ○ Laje  ○ Outro] │
│ Orientação módulo: [● Retrato  ○ Paisagem]         │
│                                                     │
│ [Auto-Layout →]          [Fechar ✕]                │
└─────────────────────────────────────────────────────┘
```

- **Azimute:** 0–360°. 0° = Norte. 180° = Sul (padrão para hemisfério sul).
- **Inclinação:** 0–60°. Default: `clientData.roofInclination` da SiteCanvasView.
- **Superfície:** define o tipo de fixação mecânica e o coeficiente de ventilação para cálculo de Tcell.
- **Orientação do módulo:** Retrato (comprimento vertical) ou Paisagem (comprimento horizontal).

Esses valores são persistidos em `PhysicalArrangement.orientation` e `PhysicalArrangement.surfaceType`.

### 3.3 Zona de vento (Safe Edge)

Após configurar a área, o sistema renderiza automaticamente um offset de 40cm (em metros reais, convertido para pixels na escala atual) dentro do polígono como zona de exclusão tracejada amarela:

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   ← borda do polígono
       zona de vento (tracejada amarela, 40cm)
  ┌──────────────────────────────┐     ← borda da área útil
  │         ÁREA ÚTIL            │
  └──────────────────────────────┘
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

Módulos só podem ser posicionados dentro da área útil (descontada a zona de vento).

---

## 4. Auto-Layout de Módulos

### 4.1 Algoritmo de empacotamento

Ao clicar em "Auto-Layout" no painel de configuração da área:

```
1. Ler dimensões do módulo selecionado: lengthMm × widthMm
2. Converter para metros: lengthM = lengthMm / 1000
3. Aplicar orientação: se Retrato → altura = lengthM, largura = widthM
                        se Paisagem → altura = widthM, largura = lengthM
4. Calcular bounding box da área útil (polígono − 40cm de zona de vento)
5. Preencher de cima para baixo, da esquerda para a direita:
   - Linha de módulos por trilho
   - Espaçamento entre módulos: 2cm (folga de dilatação térmica)
   - Corredor técnico de 80cm a cada 6 fileiras de módulos
6. Módulos que não couberem inteiramente dentro da área útil são descartados
7. Gerar ModuleGridCell[][] e ArrangementNode[] para cada módulo posicionado
```

**Corredor técnico:** faixa horizontal de 80cm (configurável: 60–120cm) inserida a cada 6 fileiras. Serve de acesso de manutenção e limpa a view visualmente. Renderizada como banda avermelhada com label "Corredor — 80cm".

### 4.2 Feedback durante o Auto-Layout

Enquanto o Worker processa (< 200ms para áreas típicas):
- Spinner de carregamento `indigo-400` sobre a área
- Label "Calculando layout..." no centro

Ao finalizar: os módulos aparecem em fade-in (150ms, stagger de 10ms por fileira).

### 4.3 Resultado visual

```
╔═══════════════════════════════════════════════════╗
║  SATÉLITE (brightness-50, saturate-0)             ║
║                                                   ║
║   ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐       ║
║   ╎  Zona de vento (amarela tracejada)    ╎       ║
║   ╎   ┌────────────────────────────────┐ ╎       ║
║   ╎   │  ┌──┬──┬──┬──┬──┬──┐  ←trilho │ ╎       ║
║   ╎   │  │▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│          │ ╎       ║
║   ╎   │  ├──┼──┼──┼──┼──┼──┤          │ ╎       ║
║   ╎   │  │▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│          │ ╎       ║
║   ╎   │  ════ CORREDOR 80cm ══════════ │ ╎       ║
║   ╎   │  ┌──┬──┬──┬──┬──┬──┐          │ ╎       ║
║   ╎   │  │▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│          │ ╎       ║
║   ╎   │                        📌 DC  │ ╎       ║
║   ╎   └────────────────────────────────┘ ╎       ║
║   └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘       ║
╚═══════════════════════════════════════════════════╝
```

Cada módulo é um retângulo SVG nas dimensões reais do catálogo, na escala do zoom atual:
- Fundo: `fill: rgba(99,102,241,0.6)` (indigo translúcido)
- Borda: `stroke: rgba(99,102,241,1)` (indigo sólido)
- Label no centro: número sequencial dentro da string (ex: `03`)

Trilhos renderizados como linhas `stroke: rgba(34,197,94,0.4)` (green/40) abaixo dos módulos.

---

## 5. Posicionamento Manual de Módulo

Ferramenta `PLACE_MODULE`:
- Click em célula vazia da grade → módulo aparece
- Click em célula ocupada → nenhuma ação (cursor `not-allowed`)
- A grade (derivada do `ModuleGridCell[][]`) permanece visível como pontos `•` nas interseções enquanto a ferramenta está ativa

Feedback de hover na grade: célula candidata recebe halo `rgba(99,102,241,0.3)` pulsante antes do click.

---

## 6. Ferramenta de Stringing — STRING_WIRE

### 6.1 Fluxo de interação

```
1. Integrador ativa STRING_WIRE
2. Cursor muda para crosshair; módulos exibem seus portos de conexão
   Porto positivo (+): círculo vermelho — lado direito do módulo
   Porto negativo (−): círculo azul — lado esquerdo do módulo
3. Click no porto + de um módulo → inicia arraste
4. Durante arraste: cabo em pré-visualização (tracejado indigo) roteado em tempo real
   via A* ortogonal com penalidade de curvas
5. Hover sobre porto − de outro módulo:
   → Porto pulsa verde, pré-visualização solidifica
6. Click (drop) no porto − → aresta criada, cabo renderizado como linha sólida
7. HUD flutuante atualiza Voc/Isc acumulado da string em formação
```

### 6.2 HUD de string em formação

```
┌─────────────────────────────────┐
│  String em formação             │
│  Módulos: 6 / 12 (limite MPPT) │
│  Voc acum: 246.0 V  ✅          │
│  Limite inversor: 600 V         │
│  [Finalizar String]  [Cancelar] │
└─────────────────────────────────┘
```

Posicionado no canto superior direito do canvas. `Voc acum` é calculado em tempo real: `N_módulos × Voc_STC × (1 + tempCoeffVoc × (manualTmin − 25))`. Se `Voc acum > 0.9 × Voc_max_hardware`: texto âmbar. Se `> Voc_max_hardware`: texto vermelho e "Finalizar String" é desabilitado.

### 6.3 Validação de polaridade em tempo real

```typescript
// Regras verificadas a cada hover sobre porto candidato
if (sourcePort.polarity === targetPort.polarity) {
  // Porto de destino fica vermelho + tooltip "Mesma polaridade — curto-circuito"
  // Drop é bloqueado
}
if (targetNode.ports.some(p => p.connected && p.polarity === targetPort.polarity)) {
  // Porto de destino já conectado — rosa + tooltip "Porto já conectado"
  // Drop é bloqueado
}
```

### 6.4 Finalização de string

"Finalizar String" ou pressionar `Enter`:
- O sistema gera um `StringGroupID` automático: S1, S2, S3...
- Label centroide da string aparece sobre os módulos: `S1` em `text-indigo-300 font-bold text-[10px]`
- O grupo de módulos recebe borda de cor da string (rotação de cores: indigo, sky, emerald, amber, violet...)

### 6.5 Validação de orientação entre módulos de uma string

Ao conectar dois módulos com `azimuth` ou `tilt` diferentes (de áreas distintas), o sistema emite aviso inline:

```
⚠ Módulos desta string têm orientações diferentes
   Área 1: Az 180° / 14°
   Área 2: Az 90° / 14°
   Isso causa mismatch. Use MPPTs separados por orientação.
```

A aresta é criada mesmo assim (não é bloqueante), mas aparece em âmbar tracejado em vez de sólido.

---

## 7. Drop Point — Ponto de Saída dos Cabos CC

Ferramenta `DROP_POINT`:
- Click em qualquer posição dentro de uma área → posiciona o ícone 📌
- Representa o ponto onde os cabos CC deixam o telhado em direção ao inversor
- Cada área pode ter um Drop Point
- Coordenadas salvas em `PhysicalArrangement.dropPoint: { lat, lng }`
- Exibido como pin amarelo com label "DC" no canvas

---

## 8. Mini-Blueprint — Anatomia da Peça de Fixação

Botão "Ver Anatomia" no HUD superior direito (ativo quando uma área está selecionada):

```
┌────────────────────────────────────────────┐
│  ANATOMIA DO SUPORTE                       │
│  Tipo: Telha Cerâmica                      │
│  ─────────────────────────────────────     │
│           Grampo Final                     │
│             ┌─┐                            │
│     ─────── ┤ ├──────                      │
│             └─┘                            │
│   ╔══════════════════╗  Trilho Alumínio   │
│   ╚════════╤═════════╝                    │
│            │                               │
│       ┌────┴────┐  Gancho Colonial         │
│       │  BASE   │                          │
│       └────┬────┘                          │
│   ~~~~~~~~~│~~~~~~~~~  ← Telha             │
│     ┌──────┴──────┐                       │
│     │   CAIBRO    │                       │
│     └─────────────┘                       │
│                                            │
│  Material: Alumínio anodizado              │
│  Carga máx: 200 kgf/m (NBR 16690)        │
│  [Trocar Tipo ▾]  [Fechar ✕]             │
└────────────────────────────────────────────┘
```

Cada `surfaceType` tem um desenho técnico SVG correspondente:

| `surfaceType` | Visualização |
|---------------|-------------|
| `ceramica` | Gancho colonial + trilho + grampo final |
| `metalico` | Grampo de fixação em "Ω" + trilho |
| `fibrocimento` | Parafuso passante + perfil Z |
| `laje` | Perfil soldado + lastro |
| `ground` | Estrutura de poste com fundação |
| `carport` | Viga metálica horizontal + coluna |

---

## 9. Cotagem Dinâmica

Ao selecionar qualquer polígono (hover ou click):
- Cada aresta exibe seu comprimento em metros
- Estilo CAD: linha de cota fina com setas, valor centralizado
- `|──── 8.42 m ────|` em `font-mono text-[9px] fill-indigo-300`

Durante resize (arrastar vértice):
- Cotas atualizam em tempo real (< 16ms, executado na thread principal pois é só transformação de coordenadas)

Área total calculada via algoritmo shoelace e exibida no chip do bloco no LeftOutliner.

---

## 10. Feedback de Validação Visual

| Situação | Visual no módulo | Origem |
|----------|-----------------|--------|
| Módulo sem string | Borda vermelha tracejada + ícone `⚡?` | `validateArrangementGraph` |
| Módulo em string aberta | Borda âmbar | `validateArrangementGraph` |
| Módulo em string OK | Borda da cor da string | — |
| Módulo selecionado | Borda indigo sólida + sombra glow | interação |
| Módulo hover | Borda indigo translúcida | interação |

Quando `physicalCount ≠ logicalCount` (módulos no grid vs módulos alcançáveis pelo grafo): chip `△N` no bloco do LeftOutliner atualiza automaticamente.

---

## 11. Bottom Status Bar

```
┌───────────────────────────────────────────────────────────────────────┐
│  ◉ -3.1316, -60.0233  │  ▸ Aresta: 4.57m  │  ◻ Área Útil: 38.1m²   │
│  Módulos: 18 │ △N: 0  │  ∠ Az: 180° / 14° │  ═ Trilhos: ~24m        │
└───────────────────────────────────────────────────────────────────────┘
```

Campos atualizados em tempo real conforme a área selecionada e os módulos posicionados.

---

## 12. Critérios de Aceitação

### Demarcação de área
- [ ] Polígono fecha ao clicar no primeiro vértice ou pressionar `Enter`
- [ ] Ortho-snap ativa em ângulos 0°, 45°, 90° com linha ciano indicadora
- [ ] Cotagem de aresta exibe comprimento em metros reais (haversine) durante desenho e após
- [ ] Zona de vento de 40cm renderizada como tracejado amarelo imediatamente após fechar o polígono
- [ ] Painel de configuração de azimute/inclinação/superfície aparece após fechar o polígono

### Auto-layout
- [ ] Para área de 100m² e módulo de 2,09m × 1,13m: grade produz ≥ 40 módulos dentro da área útil
- [ ] Corredor técnico de 80cm inserido a cada 6 fileiras
- [ ] Módulos fora da área útil são descartados (não há módulos na zona de vento)
- [ ] Orientação "Retrato" vs "Paisagem" gera grades visualmente distintas

### Stringing
- [ ] Porto negativo e positivo visíveis em todos os módulos quando STRING_WIRE está ativa
- [ ] Cabo roteado em tempo real durante arraste (< 16ms por frame)
- [ ] Conexão de mesma polaridade é bloqueada com feedback vermelho
- [ ] HUD exibe Voc acumulado da string em formação com semáforo correto
- [ ] `StringGroupID` gerado automaticamente ao finalizar; label aparece sobre os módulos
- [ ] Módulos de áreas com orientações distintas conectados na mesma string geram aviso âmbar

### Validação
- [ ] Módulo sem conexão: borda vermelha tracejada
- [ ] Chip `△N` no bloco do LeftOutliner atualiza ao adicionar/remover módulos e strings
- [ ] Banner NBR 16690 aparece quando N_strings paralelas ao mesmo MPPT ≥ 3 sem caixa CC

### Performance
- [ ] Auto-layout de 50 módulos executa em < 200ms (Worker)
- [ ] Hit-testing de hover em arranjo com 200 módulos: < 5ms (Quadtree)
- [ ] `tsc --noEmit` → EXIT CODE 0

# Spec — Physical Canvas (Arranjo Físico & Instalação Operacional)

**Arquivo alvo:** `canvas-views/PhysicalCanvasView.tsx` [NEW]
**Tipo:** Construção Nova — Rigor Técnico, Integração de Dados & Fluxo de Instalação  
**Módulo:** `engineering` — Arranjo Físico  
**Responsável:** `design-lead` / `the-builder`  
**Revisor de Engenharia:** `engenheiro-eletricista-pv`  
**Ativada por:** `activeFocusedBlock === 'arrangement'`  
**Cor de acento:** Indigo — `text-indigo-400` / `border-indigo-500/30`  
**Estado atual:** Nenhum componente existente. Construção do zero.

---

## 1. Propósito: Do Satélite ao Projeto Executivo (Blueprint)

A `PhysicalCanvasView` é o **Cockpit de Engenharia B2B Multinível** onde o projetista transforma uma imagem de satélite em um plano executável de instalação. Não existe UI prévia para esta função — tudo será construído do zero.

Os projetistas desenham polígonos que representam áreas úteis reais. O sistema reage validando as bordas, ancoramento e passagem técnica, garantindo que o projeto resulte em um **Croqui Instaurável**, e não um delírio geométrico impraticável. A view introduz **Camadas de Abstração Progressiva**, permitindo validar a geometria, a estrutura mecânica e a lógica elétrica em um único ambiente.

Esta etapa é a **ponte direta para a seleção do inversor**: o arranjo define quantos módulos existem, em quantas orientações distintas, sugerindo a quantidade mínima de MPPTs — informação que alimenta diretamente a etapa seguinte (Elétrica).

### 1.1 Layout Master — Composição Geral da View

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ LeftOutliner                 │           CENTER CANVAS (PhysicalCanvasView)  │
│ [Bloco Arranjo] ← Foco Ativo│                                              │
│                              │  ┌─ TOP RIBBON (Header HUD) ──────────────┐ │
│                              │  │ [📐] Arranjo Físico │ Layer: [▾ Físico] │ │
│                              │  │ Área: 42.3m² │ Módulos: 18/20 (△2) │ FDI: — │ │
│                              │  └────────────────────────────────────────┘ │
│                              │                                              │
│                              │  ┌───────────────── CANVAS ───────────────┐ │
│                              │  │ ┌──────┐                               │ │
│  ┌─ LEFT RIBBON ──┐         │  │ │ TOOL │   ╔═══════════════════╗       │ │
│  │ [▢] Polígono   │         │  │ │ BAR  │   ║  MAPA / BLUEPRINT ║       │ │
│  │ [▬] Corredor   │         │  │ │      │   ║   (Área ativa)    ║       │ │
│  │ [📌] Drop Pt   │         │  │ │ [⇅]  │   ║  ┌──┬──┬──┬──┐   ║       │ │
│  │ ─────────────  │         │  │ │ Snap │   ║  │▓▓│▓▓│▓▓│▓▓│   ║       │ │
│  │ [🏠] Fixação   │         │  │ │      │   ║  ├──┼──┼──┼──┤   ║       │ │
│  │ [↕] Retrato    │         │  │ │ [👁]  │   ║  │▓▓│▓▓│▓▓│▓▓│   ║       │ │
│  │ [↔] Paisagem   │         │  │ │ Anat │   ║  └──┴──┴──┴──┘   ║       │ │
│  └────────────────┘         │  │ │      │   ╚═══════════════════╝       │ │
│                              │  │ └──────┘                               │ │
│                              │  └────────────────────────────────────────┘ │
│                              │                                              │
│                              │  ┌─ BOTTOM RIBBON (Status Bar) ───────────┐ │
│                              │  │ Lat -3.131 Lng -60.023 │ Aresta: 4.57m │ │
│                              │  │ Área Útil: 38.1m² │ △ Cons: 2 UN │ ═ Trilhos: ~24m │ │
│                              │  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Container Master:** `relative w-full h-full flex flex-col bg-slate-950 overflow-hidden`
Estética: `tabular-nums tracking-widest text-[11px] font-mono`

---

## 2. Gaps Operacionais e Soluções de Engenharia

A física da instalação prevalece sobre o capricho milimétrico, guiadas pela filosofia de *Medir Duas Vezes, Cortar Uma*.

### 2.1 Camadas de Projeto (The Multilayer Switch)
Para garantir que o arranjo seja funcional eletricamente antes da escolha do inversor:
1. **Layer 0 - Contexto**: Satélite (opacity 50% - Reconhecimento).
2. **Layer 1 - Arranjo (Física & Strings)**: Desenho de áreas, módulos, trilhos e ferramenta de ligação (stringing).
3. **Layer 2 - Diagrama de Blocos**: Overlay lógico consolidado mostrando o agrupamento por strings eMPPTs.
4. **Layer 3 - Unifilar**: Esqumático unifilar preliminar (Símbolos NBR 16274).

#### Rascunho Visual — Layer 1: Arranjo (Física)

```text
  ╔══════════════════════════════════════════════════════╗
  ║  SATÉLITE (brightness-50, saturate-0)                ║
  ║                                                      ║
  ║   ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐          ║
  ║   ╎  ZONA DE VENTO (tracejado amarelo)    ╎          ║
  ║   ╎  +40cm padding                        ╎          ║
  ║   ╎   ┌────────────────────────────────┐  ╎          ║
  ║   ╎   │ ÁREA ÚTIL (polígono indigo)    │  ╎          ║
  ║   ╎   │                                │  ╎          ║
  ║   ╎   │  ┌──┬──┬──┬──┬──┬──┐          │  ╎          ║
  ║   ╎   │  │▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│  ←trilho │  ╎          ║
  ║   ╎   │  ├──┼──┼──┼──┼──┼──┤  ←trilho │  ╎          ║
  ║   ╎   │  │▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│          │  ╎          ║
  ║   ╎   │  └──┴──┴──┴──┴──┴──┘          │  ╎          ║
  ║   ╎   │  ═══ CORREDOR 80cm ═══════════ │  ╎          ║
  ║   ╎   │  ┌──┬──┬──┬──┬──┬──┐          │  ╎          ║
  ║   ╎   │  │▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│          │  ╎          ║
  ║   ╎   │  └──┴──┴──┴──┴──┴──┘          │  ╎          ║
  ║   ╎   │                         📌 DC  │  ╎          ║
  ║   ╎   └────────────────────────────────┘  ╎          ║
  ║   └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘          ║
  ║                                                      ║
  ╚══════════════════════════════════════════════════════╝

  Legenda:
  ▓▓ = Módulo fotovoltaico (escala 1:1 do catálogo)
  ── = Trilho de montagem (traço subjacente ao módulo)
  ═══ = Corredor técnico (zona de exclusão vermelha)
  ╎  = Zona de Vento / Safe Edge (tracejada amarela)
  📌 = Drop Point (Ponto de Saída dos Cabos CC)
```

#### Rascunho Visual — Layer 2: Diagrama de Blocos

```text
  ╔══════════════════════════════════════════════════════╗
  ║  GRID BLUEPRINT (fundo azul-escuro quadriculado)     ║
  ║                                                      ║
  ║   ┌──────────────────────┐  ┌──────────────────┐     ║
  ║   │  GRUPO A (Az 0°)     │  │  GRUPO B (Az 90°)│     ║
  ║   │  ┌──┬──┬──┬──┬──┐   │  │  ┌──┬──┬──┐      │     ║
  ║   │  │01│02│03│04│05│   │  │  │01│02│03│      │     ║
  ║   │  ├──┼──┼──┼──┼──┤   │  │  ├──┼──┼──┤      │     ║
  ║   │  │06│07│08│09│10│   │  │  │04│05│06│      │     ║
  ║   │  └──┴──┴──┴──┴──┘   │  │  └──┴──┴──┘      │     ║
  ║   │  String A1: 01→05   │  │  String B1: 01→03│     ║
  ║   │  String A2: 06→10   │  │  String B2: 04→06│     ║
  ║   │  ─────────┐         │  │  ─────────┐      │     ║
  ║   │           ▼         │  │           ▼      │     ║
  ║   │      [ MPPT 1 ]     │  │      [ MPPT 2 ] │     ║
  ║   └──────────────────────┘  └──────────────────┘     ║
  ║                    │                   │              ║
  ║                    └───────┬───────────┘              ║
  ║                            ▼                          ║
  ║                    ┌──────────────┐                   ║
  ║                    │  INVERSOR ?  │ ← Ainda não       ║
  ║                    │  (Pendente)  │   selecionado     ║
  ║                    └──────────────┘                   ║
  ║                                                      ║
  ╚══════════════════════════════════════════════════════╝

  Legenda:
  Grupo A/B = Agrupamento por orientação (Azimute + Tilt)
  Numeração = Índice sequencial do módulo na string
  ▼ MPPT    = Sugestão de entrada MPPT no futuro inversor
  ?         = Inversor ainda não definido (próxima etapa)
```

#### Rascunho Visual — Layer 3: Unifilar Preliminar

```text
  ╔══════════════════════════════════════════════════════╗
  ║  ESQUEMÁTICO UNIFILAR (Símbolos NBR 16274)           ║
  ║                                                      ║
  ║   ☀─┤├─┤├─┤├─┤├─┤├─╮    ☀─┤├─┤├─┤├─╮               ║
  ║   String A1 (5×550W) │    String B1 (3×550W)         ║
  ║                       │                  │            ║
  ║   ☀─┤├─┤├─┤├─┤├─┤├─╮│    ☀─┤├─┤├─┤├─╮ │            ║
  ║   String A2 (5×550W) ││    String B2 (3×550W)        ║
  ║                       ││                 │ │          ║
  ║                  ┌────┘│            ┌────┘ │          ║
  ║                  ▼     ▼            ▼      ▼          ║
  ║              ┌─────────────┐  ┌─────────────┐        ║
  ║              │  DPS CC     │  │  DPS CC     │        ║
  ║              │  ⚡ 1000V   │  │  ⚡ 1000V   │        ║
  ║              └──────┬──────┘  └──────┬──────┘        ║
  ║                     │                │                ║
  ║              ┌──────┴────────────────┴──────┐        ║
  ║              │     STRING BOX / COMBINER     │        ║
  ║              └──────────────┬────────────────┘        ║
  ║                             │                         ║
  ║                             ▼                         ║
  ║                    ┌────────────────┐                 ║
  ║                    │   INVERSOR     │                 ║
  ║                    │   (Pendente)   │                 ║
  ║                    └────────────────┘                 ║
  ║                                                      ║
  ╚══════════════════════════════════════════════════════╝

  Legenda:
  ☀    = Arranjo fotovoltaico (ponto de origem da string)
  ┤├   = Módulo em série (símbolo compacto)
  ⚡   = DPS CC (Dispositivo de Proteção contra Surto)
  ─╮╰─ = Conduíte / Cabeamento DC
```

### 2.2 Ancoragem Estrutural (The Croqui Mode)
- **Problema**: O engenheiro no escritório não enxerga os caibros ou as terças. Advinhar graus leva a erros no campo.
- **Solução (Pragmática)**: Trabalhamos com a **Intenção da Estrutura**. Ao selecionar o **Tipo de Suporte** (`Cerâmica`, `Fibrocimento`, etc), o sistema renderiza hastes paralelepipédicas ou traços de montagem subjacentes aos módulos (Retrato/Paisagem).
- **Anatomia Visual**: O botão **"Ver Anatomia"** abre uma mini-view (Top-Right) com o desenho técnico/3D da peça selecionada (Gancho, Trilho, Grampo).

#### Rascunho Visual — Croqui Mode: Retrato vs Paisagem

```text
  RETRATO (módulos verticais)           PAISAGEM (módulos horizontais)
  Trilhos horizontais cruzam            Trilhos verticais cruzam
  ┌─────────────────────────┐           ┌─────────────────────────┐
  │ ═══════════════ trilho  │           │ ┌──┬──┬──┬──┬──┬──┐    │
  │ ┌───┐┌───┐┌───┐┌───┐   │           │ ║  │  │  │  │  │  │    │
  │ │   ││   ││   ││   │   │           │ ├──┼──┼──┼──┼──┼──┤    │
  │ │ ▓ ││ ▓ ││ ▓ ││ ▓ │   │           │ ║  │  │  │  │  │  │    │
  │ │   ││   ││   ││   │   │           │ └──┴──┴──┴──┴──┴──┘    │
  │ └───┘└───┘└───┘└───┘   │           │ ║  trilho (vertical)    │
  │ ═══════════════ trilho  │           │ ║                       │
  │ ┌───┐┌───┐┌───┐┌───┐   │           │ ┌──┬──┬──┬──┬──┬──┐    │
  │ │ ▓ ││ ▓ ││ ▓ ││ ▓ │   │           │ ║  │  │  │  │  │  │    │
  │ └───┘└───┘└───┘└───┘   │           │ └──┴──┴──┴──┴──┴──┘    │
  │ ═══════════════ trilho  │           │ ║                       │
  └─────────────────────────┘           └─────────────────────────┘
```

#### Rascunho Visual — Mini-Blueprint View (Anatomia da Peça)

```text
  ┌─────────────────────────────────────┐
  │  ANATOMIA DO SUPORTE                │
  │  Tipo: Telha Cerâmica               │
  │  ─────────────────────────────────  │
  │                                     │
  │            Grampo Final             │
  │              ┌─┐                    │
  │      ────────┤ ├────────            │
  │              └─┘                    │
  │     ╔══════════════════╗  Trilho    │
  │     ║                  ║  Alumínio  │
  │     ╚════════╤═════════╝            │
  │              │                      │
  │         ┌────┴────┐                 │
  │         │ GANCHO  │  Gancho         │
  │         │ BASE    │  Colonial       │
  │         └────┬────┘                 │
  │              │                      │
  │      ~~~~~~~~│~~~~~~~~  ← Telha    │
  │     ┌────────┴────────┐             │
  │     │    CAIBRO       │             │
  │     └─────────────────┘             │
  │                                     │
  │  Material: Alumínio anodizado       │
  │  Carga: 200 kgf/m (NBR 16690)      │
  │  [Trocar Tipo ▾]  [Fechar ✕]       │
  └─────────────────────────────────────┘
```

### 2.3 Zonas de Vento (Safe Edge Offset)
- **Problema**: Módulos em beirais são arrancados pelo vento.
- **Solução (Aura Geométrica)**: O validador de preenchimento utiliza uma matemática leve `O(N)` que "incha" a borda interna dos polígonos (ex: padding visual +40cm). O sistema impede a colocação de módulos nessas áreas, emitindo o alerta visual (linha tracejada amarela) sobre as Zonas de Borda.

#### Rascunho Visual — Zonas de Vento no Canvas

```text
  ┌────────────────────────────────────────────┐
  │ BORDA DO TELHADO (Aresta real do polígono) │
  │ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │  ← Tracejado amarelo
  │ ┄ ZONA DE VENTO (+40cm)                  ┄ │     (Safe Edge)
  │ ┄  <-- 0.40m --> (Cota Automática)        ┄ │
  │ ┄                                        ┄ │
  │ ┄  ┌──────────────────────────────────┐  ┄ │
  │ ┄  │  ÁREA VÁLIDA PARA MÓDULOS       │  ┄ │  ← Preenchimento
  │ ┄  │  (layout automático atua aqui)  │  ┄ │     permitido
  │ ┄  │                                  │  ┄ │
  │ ┄  │  ┌──┬──┬──┬──┐    ┌──┬──┬──┬──┐ │  ┄ │
  │ ┄  │  │▓▓│▓▓│▓▓│▓▓│    │▓▓│▓▓│▓▓│▓▓│ │  ┄ │
  │ ┄  │  └──┴──┴──┴──┘    └──┴──┴──┴──┘ │  ┄ │
  │ ┄  │                                  │  ┄ │
  │ ┄  └──────────────────────────────────┘  ┄ │
  │ ┄                                        ┄ │
  │ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
  └────────────────────────────────────────────┘
```

### 2.4 Corredores Técnicos & Manutenção
- **Problema**: "Mares" de módulos impedem o acesso para limpeza e manutenção.
- **Solução (Subtract Tool)**: Ferramenta que permite demarcar corredores retos. Atua criando retângulos de exclusão `O(1)` na matriz de ocupação, forçando a quebra automática do preenchimento de módulos.

#### Rascunho Visual — Corredor Técnico (Subtract)

```text
  ┌────────────────────────────────────────────┐
  │           ÁREA DE INSTALAÇÃO               │
  │                                            │
  │  ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐          │
  │  │▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│          │
  │  ├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤          │
  │  │▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│          │
  │  └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘          │
  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  ← CORREDOR 80cm
  │  ░░  <-- 0.80m --> (Cota Linear)        ░░ │    (Subtract Tool)
  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
  │  ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐          │
  │  │▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│          │
  │  ├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤          │
  │  │▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│▓▓│          │
  │  └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘          │
  │                                            │
  └────────────────────────────────────────────┘
```

### 2.5 Ponto de Transporte (Drop Point) & Referência
- **Drop Point**: Pino que marca o *"Ponto de Saída dos Cabos Tensão CC"*, essencial para estimativas de conduítes.
- **Banco de Fotos**: Painel lateral opcional para upload de fotos do sítio como referência exclusiva do projetista.

#### Rascunho Visual — Drop Point & Banco de Fotos

```text
  CANVAS (detalhe canto inferior)        PAINEL LATERAL (opcional)
  ┌──────────────────────────┐          ┌─────────────────────┐
  │           ...            │          │ 📷 REFERÊNCIA VISUAL│
  │  ┌──┬──┬──┬──┐          │          │ ─────────────────── │
  │  │▓▓│▓▓│▓▓│▓▓│          │          │ ┌─────────────────┐ │
  │  └──┴──┴──┴──┘          │          │ │  foto_drone.jpg  │ │
  │            │             │          │ │  [Telhado Norte] │ │
  │            │ cabo CC     │          │ └─────────────────┘ │
  │            │             │          │ ┌─────────────────┐ │
  │          ┌─▼─┐           │          │ │  detalhe_beiral  │ │
  │          │📌 │ Drop Point│          │ │  [Obstáculo]     │ │
  │          │ DC│ (-3.13,   │          │ └─────────────────┘ │
  │          └───┘  -60.02)  │          │                     │
  │                          │          │ [+ Adicionar Foto]  │
  └──────────────────────────┘          └─────────────────────┘
```

### 2.6 Cotagem Dinâmica (Linear Dimensions)
- **Arestas de Polígono**: Exibição automática do comprimento de cada segmento do telhado ao selecionar ou hover.
- **Visual CAD**: Linhas de cota finas com setas nas extremidades e valor centralizado (ex: `|-- 4.57m --|`).
- **Comportamento**: As cotas se ajustam em tempo real durante o resize ou movimentação de vértices.

#### Rascunho Visual — Cotagem de Aresta

```text
       |---------- 8.42m ----------|
  ┌────────────────────────────────────┐
  │                                    │
  │                                    │ -
  │                                    │ |
  │                                    │ 5.20m
  │                                    │ |
  │                                    │ -
  └────────────────────────────────────┘
```

### 2.7 Ferramenta de Stringing (Wiring Tool)
Implementada diretamente na **Layer 1**, permitindo que o projetista defina a conexão elétrica enquanto visualiza o telhado.

- **Ação de Conexão**: O usuário seleciona a ferramenta de String e clica sequencialmente nos módulos (ou arrasta para criar um caminho).
- **Feedback em Tempo Real**: HUD flutuante próximo ao cursor mostrando `Voc Corrigido` e `Isc` acumulados da string atual contra os limites típicos.
  - **Rigor Elétrico (NBR 16690)**: O cálculo de `Voc Corrigido` deve obrigatoriamente utilizar a Temperatura Mínima Histórica (`clientData.tMin`) para garantir que o inversor não seja danificado em dias frios.
- **Agrupamento Automático**: Ao finalizar uma sequência, o sistema cria um `StringGroupID`, atribuindo um rótulo visual (ex: S1, S2) ao centro da string.
- **Validação de Orientação**: O sistema emite aviso se uma string tentar cruzar módulos com Azimutes ou Tilts diferentes (desvio de plano).

#### Rascunho Visual — Ferramenta de Stringing

```text
  ┌───────────────── CANVAS (Layer 1) ─────────────────┐
  │                                                    │
  │   ┌──┐    ┌──┐    ┌──┐    ┌──┐                     │
  │   │01│───▶│02│───▶│03│───▶│04│                     │
  │   └──┘    └──┘    └──┘    └──┘  HUD: String 1      │
  │     ▲               │           Modules: 6/12      │
  │     │               ▼           Voc: 298.5V [OK]   │
  │   ┌──┐    ┌──┐    ┌──┐                             │
  │   │06│◀───│05│◀───┘                                │
  │   └──┘                                             │
  └────────────────────────────────────────────────────┘
```

---

## 3. O Modo Prancheta (Blueprint Mode)

- **Fase 1: Reconhecimento** (Mapa Satélite em evidência 100%).
- **Fase 2: The Lock-In** (Toggle "Focar no Arranjo").
  - O Satélite sofre filtro `brightness-50 saturate-0`.
  - O fundo assume visual de **Grid Blueprint**. Os limites de estrutura (trilhos hipotéticos e arestas cortantes) se acendem. O ambiente vira um Laboratório CAD livre de ruído visual.

#### Rascunho Visual — Transição Satélite → Blueprint

```text
  FASE 1: RECONHECIMENTO                FASE 2: BLUEPRINT (Lock-In)

  ┌────────────────────────┐            ┌────────────────────────┐
  │ 🛰️ SATÉLITE 100%       │            │ ┼───┼───┼───┼───┼───┼ │
  │                        │   Toggle   │ │   │   │   │   │   │ │
  │   ┌──────────┐         │  ──────▶   │ ┼───╔═══════════╗──┼ │
  │   │ TELHADO  │         │  "Focar    │ │   ║ ARRANJO   ║  │ │
  │   │ (imagem  │         │   no       │ ┼───║ ┌──┬──┐   ║──┼ │
  │   │ real do  │         │  Arranjo"  │ │   ║ │▓▓│▓▓│   ║  │ │
  │   │ Google)  │         │            │ ┼───║ ├──┼──┤   ║──┼ │
  │   └──────────┘         │            │ │   ║ │▓▓│▓▓│   ║  │ │
  │                        │            │ ┼───║ └──┴──┘   ║──┼ │
  │  árvores, ruas, etc.   │            │ │   ╚═══════════╝  │ │
  │                        │            │ ┼───┼───┼───┼───┼───┼ │
  └────────────────────────┘            └────────────────────────┘

  brightness: 100%                      brightness: 50%
  saturate: 100%                        saturate: 0%
  Grid: oculto                          Grid: visível (blueprint)
  Trilhos: ocultos                      Trilhos: acesos (cyan)
```

---

## 4. Gêmeos Digitais & Catálogo
- Dimensões reais do banco: `ModulePhysicalSchema.widthMm` x `ModulePhysicalSchema.heightMm`.
- Escala Real `1:1` imperativa para validação de área.

#### Rascunho Visual — Módulo 1:1 (Gêmeo Digital)

```text
  Módulo: DMEGC 550W (2278mm × 1134mm)

  ┌──────────────────────────────────┐
  │                                  │  ↕ 1134mm
  │      DMEGC DM550M10-72HSW       │
  │         550 Wp                   │
  │      Voc: 49.65V                │
  │      Isc: 13.96A                │
  │                                  │
  └──────────────────────────────────┘
       ↔ 2278mm

  No canvas: renderizado em escala métrica real.
  Sem hardcode: widthM e heightM lidos do catálogo.
```

---

## 5. UI: O Engineering HUD & Ferramentas Cad

### The Structural & Diagram Toolbar (Left Ribbon)
- **Seletor de Camada**: Toggle Físico | Blocos | Unifilar.
- **Operadores Geométricos**: Polígono (Freeform) | Subtract (Corredor) | Drop Point (Pino).
- **Snap**: Ortho-Snap ativo via SHIFT.
- **Fixação**: Seletor de Direcionalidade e Tipo de Fixação (Anatomia).

#### Rascunho Visual — Left Ribbon (Toolbar Detalhada)

```text
  ┌────────────────────┐
  │  CAMADA             │
  │  ┌────┬────┬─────┐ │
  │  │ 📐 │ ◻️ │ ─┤├─│ │
  │  │Fís.│Bloc│Unif.│ │
  │  └────┴────┴─────┘ │
  │ ─────────────────── │
  │  GEOMETRIA          │
  │  [▢] Polígono       │  ← Desenhar área freeform
  │  [▬] Corredor       │  ← Subtract retangular
  │  [📌] Drop Point    │  ← Marcar saída CC
  │  [📏] Medir         │  ← Régua livre
  │ ─────────────────── │
  │  MONTAGEM           │
  │  [↕] Retrato        │  ← Módulos verticais
  │  [↔] Paisagem       │  ← Módulos horizontais
  │ ─────────────────── │
  │  LIGACÃO (Strings)  │
  │  [S] Stringing      │  ← Ferramenta de linha DC
  │  [X] Limpar Strings │  ← Reset de ligações
  │ ─────────────────── │
  │  ESTRUTURA          │
  │  ┌───────────────┐  │
  │  │ Cerâmica    ▾ │  │  ← surfaceType
  │  └───────────────┘  │
  │  [👁 Ver Anatomia]  │  ← Abre Mini-Blueprint
  │ ─────────────────── │
  │  SNAP               │
  │  [⇅] Ortho (SHIFT)  │
  │  [ ] 0° 45° 90°     │
  └────────────────────┘
```

### Status Ribbon On-The-Fly (Bottom)
- `Cursor (Lat/Lng | Y/X)` | `Aresta (m)` | `Área Útil Ocupada` | `Trilhos Lineares Estimados`.

#### Rascunho Visual — Bottom Ribbon

```text
  ┌────────────────────────────────────────────────────────────────────┐
  │  ◉ -3.1316, -60.0233  │  ▸ Aresta: 4.57m  │  ◻ 38.1m² (89.5%)  │
  │  Y: 12.4  X: 8.3      │  ∠ Az: 342°       │  △ Cons: 2 │ ═ Trilhos: ~24m │
  └────────────────────────────────────────────────────────────────────┘

  Tipografia: font-mono text-[11px] tabular-nums
  Cores: slate-400 base | indigo-400 coordenadas | emerald-400 métricas OK
```

---

## 6. Critérios de Aceitação
- [ ] `PhysicalCanvasView.tsx` criado como componente novo, sem herança do MapCore.
- [ ] Algoritmo de layout automático respeita **Safe Edge** (Zonas de Vento) e **Corredores de Subtração**.
- [ ] Alternância fluida entre as 4 camadas (Contexto / Físico / Blocos / Unifilar).
- [ ] Transição Satélite → Blueprint Mode funcional via toggle.
- [ ] Metadados de orientação (Azimute/Tilt), surfaceType e Tipo de Fixação persistidos no store.
- [ ] Mini-Blueprint View (Anatomia da Peça) renderiza corretamente para cada `surfaceType`.
- [ ] Drop Point e Banco de Fotos opcionais funcionais.
- [ ] Ortho-snap responsivo e intuitivo enquanto o projetista demarca o telhado.
- [ ] Cotagem Dinâmica (Linear Dimensions) ativa para Arestas, Safe Edge e Corredores.
- [ ] Ferramenta de Stringing permitindo conexão sequencial de módulos com feedback de Voc/Isc.
- [ ] `tsc --noEmit` → EXIT CODE 0.

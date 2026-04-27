# Spec — PhysicalCanvas Layer 3: Diagrama Unifilar Automático

**Arquivo alvo:** `canvas-views/arrangement/Layer3Unifilar.tsx`
**Tipo:** Feature Nova
**Módulo:** `engineering` — `PhysicalCanvasView`
**Camada:** 3 de 3 (saída técnica — derivada, somente leitura no MVP)
**Prioridade:** P1 — depende de Layer 1 + grafo elétrico completo
**Responsável (impl.):** `the-builder`
**Revisor (aceitação):** `engenheiro-eletricista-pv`
**Data de criação:** 2026-04-26
**Versão:** 1.0
**Depende de:** `spec-arrangement-layer1-fisico-stringing-2026-04-26.md`, `spec-modulo-arranjo-motor-tecnico-2026-04-26.md` §5
**Consome:** `ArrangementGraph`, `MPPTConfig`, `InverterModel`, `ModuleModel`
**Exporta para:** documentação técnica (PNG/SVG via export button)

---

## 1. Propósito

A Layer 3 gera automaticamente o **Diagrama Unifilar** do sistema fotovoltaico a partir do `ArrangementGraph` construído na Layer 1. É a representação técnica normalizada do sistema — o documento que acompanha a solicitação de homologação à distribuidora e o Memorial Descritivo.

A Layer 3 é **somente leitura** no MVP. Toda edição ocorre na Layer 1; o unifilar é um espelho derivado. O integrador pode exportar o diagrama, mas não editar elementos diretamente nesta camada.

---

## 2. Pipeline de Geração

```
ArrangementGraph (Layer 1)
        │
        ▼
[1. Pré-processamento]
  - Colapso de módulos em grupos de String
  - Remoção de ciclos (raro em CC; tratado para robustez)
  - Inserção de nós de proteção (fusíveis/string box quando N_paralelas ≥ 3)
        │
        ▼
[2. Motor Sugiyama]
  - Fase 1: Atribuição de camadas (layering por profundidade)
  - Fase 2: Minimização de cruzamentos (varrimento baricentro, 3 sweeps)
  - Fase 3: Atribuição de coordenadas (Brandes-Köpf compactado)
  - Fase 4: Roteamento ortogonal de arestas (A* com penalidade de curvas)
        │
        ▼
[3. Renderização SVG]
  - Símbolos IEC 60617 por tipo de nó
  - Labels de valores elétricos calculados
  - Anotações normativas (números de referência NBR)
        │
        ▼
[4. Cache]
  - Resultado do Sugiyama cacheado em memória
  - Invalidado apenas quando ArrangementGraph muda
```

Todo o processamento das fases 1 e 2 ocorre em `sugiyama.worker.ts` (Web Worker), preservando a responsividade da UI durante o cálculo.

---

## 3. Estrutura de Camadas do Unifilar

O fluxo de energia determina a organização vertical (top → bottom = geração → rede):

```
Camada 0 (topo):    Módulos FV (colapsados por string)
Camada 1:           String Box / Fusíveis CC (quando N ≥ 3 strings paralelas)
Camada 2:           Inversor / MPPTs (uma coluna por inversor)
Camada 3:           Quadro de Proteção CA
Camada 4:           Medidor Bidirecional / Ponto de Conexão
Camada 5 (base):    Rede Elétrica da Distribuidora
```

Para sistemas simples (residencial típico com 1 inversor, 1–2 strings), as camadas 1 e 3 podem ser omitidas quando não há elementos a representar.

---

## 4. Biblioteca de Símbolos (IEC 60617 / NBR 5444)

Cada tipo de nó no grafo tem um símbolo SVG correspondente:

### 4.1 String de Módulos FV

```svg
<!-- Símbolo: retângulo com diagonal e seta de corrente -->
<g class="symbol-pv-string">
  <rect x="-30" y="-15" width="60" height="30" rx="2"
        fill="none" stroke="currentColor" stroke-width="1.5"/>
  <line x1="-20" y1="10" x2="20" y2="-10"
        stroke="currentColor" stroke-width="1"/>
  <text y="5" font-size="9" text-anchor="middle">SX</text>
</g>
```

Label: `S1 · 10× ModBrand 630Wp`
Subcampo: `Voc: 490V  Isc: 10,2A`

### 4.2 String Box / Caixa de Proteção CC

```svg
<!-- Símbolo: retângulo com fusível interno (IEC 60617-7) -->
<g class="symbol-string-box">
  <rect x="-25" y="-20" width="50" height="40" rx="2"
        fill="none" stroke="currentColor" stroke-width="1.5"/>
  <!-- Símbolo de fusível IEC: retângulo fino interno -->
  <rect x="-10" y="-5" width="20" height="10"
        fill="none" stroke="currentColor" stroke-width="1"/>
  <text y="25" font-size="8" text-anchor="middle">CAIXA CC</text>
</g>
```

Inserida automaticamente quando `N_strings_paralelas_por_MPPT ≥ 3`, conforme NBR 16690.

### 4.3 Inversor

```svg
<!-- Símbolo: retângulo com ondas AC (IEC 60617) -->
<g class="symbol-inverter">
  <rect x="-40" y="-25" width="80" height="50" rx="3"
        fill="none" stroke="currentColor" stroke-width="1.5"/>
  <!-- Ondas CA centralizadas -->
  <path d="M-15,-5 Q-10,-15 -5,-5 Q0,5 5,-5 Q10,-15 15,-5"
        fill="none" stroke="currentColor" stroke-width="1.2"/>
  <text y="32" font-size="9" text-anchor="middle">INVERSOR</text>
</g>
```

Label: `InverterBrand ModelName · N kW`
Subcampo: `FDI X,XX  Eff X%`

### 4.4 Quadro de Proteção CA (QD-CA)

```svg
<!-- Símbolo: retângulo duplo (IEC 60617-11) -->
<g class="symbol-ac-panel">
  <rect x="-30" y="-20" width="60" height="40" rx="2"
        fill="none" stroke="currentColor" stroke-width="1.5"/>
  <rect x="-25" y="-15" width="50" height="30" rx="1"
        fill="none" stroke="currentColor" stroke-width="0.8"/>
  <text y="30" font-size="8" text-anchor="middle">QD-CA</text>
</g>
```

### 4.5 Medidor Bidirecional

```svg
<!-- Símbolo: círculo com setas bidirecionais (NBR 5444) -->
<g class="symbol-meter">
  <circle cx="0" cy="0" r="20"
          fill="none" stroke="currentColor" stroke-width="1.5"/>
  <!-- Setas bidirecionais -->
  <path d="M-8,-6 L0,-14 L8,-6" fill="none" stroke="currentColor" stroke-width="1"/>
  <path d="M-8,6 L0,14 L8,6" fill="none" stroke="currentColor" stroke-width="1"/>
  <text y="5" font-size="8" text-anchor="middle">kWh</text>
  <text y="30" font-size="8" text-anchor="middle">MEDIDOR</text>
</g>
```

### 4.6 Ponto de Conexão com a Rede

```svg
<!-- Símbolo: 3 linhas paralelas (rede trifásica) ou 1 linha (monofásica) -->
<!-- Derivado de clientData.connectionType -->
```

Label: `Rede Distribuidora · N fases · XXX V`

---

## 5. Arestas (Condutores)

### 5.1 Condutores CC (entre módulos e inversor)

```
stroke: #ef4444 (red-500) — convenção internacional para positivo CC
stroke: #3b82f6 (blue-500) — convenção para negativo CC
stroke-width: 2
```

Cada aresta CC exibe uma anotação de bitola quando disponível:
`Cabo CC: 6 mm²  ·  Cor: Vermelho`

### 5.2 Condutores CA (inversor → rede)

```
stroke: #64748b (slate-500)
stroke-width: 2.5
stroke-dasharray: none
```

Para sistemas trifásicos: três linhas paralelas com offset de 3px.

### 5.3 Aterramento

```
stroke: #22c55e (green-500)
stroke-width: 1.5
stroke-dasharray: 6 3
```

Símbolo de terra (IEC): triângulo invertido no ponto de aterramento.

---

## 6. Layout do Canvas

### 6.1 Área de desenho

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [HUD: UNIFILAR  ·  Exportar SVG ↓  ·  Exportar PNG ↓]  [Zoom ─ +]   │
│                                                                         │
│  ┌──────────────────────── DIAGRAMA UNIFILAR ──────────────────────┐   │
│  │                                                                  │   │
│  │   [S1 ·10×630Wp]   [S2 ·10×630Wp]   [S3 ·6×630Wp]             │   │
│  │         │                 │                │                    │   │
│  │         └────────┬────────┘                │                    │   │
│  │                  │                         │                    │   │
│  │           [CAIXA CC]                       │                    │   │
│  │  (só quando ≥3 strings)                    │                    │   │
│  │                  │                         │                    │   │
│  │          ┌───────┴──────┐          ┌───────┴──────┐            │   │
│  │          │  INVERSOR    │          │  MPPT 2      │            │   │
│  │          │  MPPT 1      │          │  S3          │            │   │
│  │          └───────┬──────┘          └───────┬──────┘            │   │
│  │                  └──────────┬──────────────┘                    │   │
│  │                             │                                   │   │
│  │                         [QD-CA]                                │   │
│  │                             │                                   │   │
│  │                        [MEDIDOR]                               │   │
│  │                             │                                   │   │
│  │                    [REDE DISTRIBUIDORA]                        │   │
│  │                                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─ LEGENDA ──────────────────────────────────────────────────────┐    │
│  │  — CC Positivo (vermelho)  — CC Negativo (azul)               │    │
│  │  — CA (cinza)  - - Aterramento (verde)                         │    │
│  └────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Fundo do canvas

```
background: #0f172a (slate-950)
Grid sutil: rgba(99,102,241,0.05), step 32px
```

Sem tile satelital — a Layer 0 fica completamente oculta quando Layer 3 está ativa.

### 6.3 Zoom e pan no unifilar

O SVG gerado pelo Sugiyama tem tamanho fixo calculado. O canvas permite:
- **Zoom:** scroll da roda ou botões `+` / `−` no HUD. Range: 50%–200%
- **Pan:** arraste do canvas (cursor `grab` → `grabbing`)
- **Fit to screen:** botão `⊞` no HUD centraliza e ajusta zoom para o diagrama caber na tela

---

## 7. Anotações Normativas

Anotações textuais automáticas no diagrama:

| Anotação | Condição | Posição |
|---------|---------|---------|
| `NBR 16690 — DPS CC obrigatório` | Sempre | Próximo à caixa CC ou ao inversor |
| `NBR 16690 — Fusível CC (In ≥ Isc × 1.25)` | N_strings ≥ 2 | Próximo à caixa CC |
| `AFCI ausente — verificar conformidade` | `inversor.afci === false` | Próximo ao inversor, cor amber |
| `RSD ausente — verificar NBR 17193` | `inversor.rsd === false` | Próximo ao inversor, cor amber |
| `Aterramento: ABNT NBR 5410` | Sempre | Próximo ao ponto de terra |

Anotações renderizadas como caixas de texto pequenas (`font-mono text-[8px]`) com fundo `bg-slate-800/80` e borda `border-slate-600/50`.

---

## 8. Painel Lateral de Valores Elétricos

Ao clicar em qualquer símbolo do unifilar, um painel lateral direito desliza para dentro:

### Click em String

```
┌─────────────────────────────────────┐
│  String S1                     [✕] │
│  ─────────────────────────────────  │
│  Módulos:      10                  │
│  Modelo:       ModBrand 630Wp      │
│  Voc (STC):    490,0 V             │
│  Voc (frio):   512,3 V  ✅         │
│    Tmin usada: 18°C                │
│  Vmp (calor):  410,2 V  ✅         │
│    Tamb max:   35°C                │
│  Isc:          10,2 A   ✅         │
│  Isc (bifacial):—  (não bifacial)  │
└─────────────────────────────────────┘
```

### Click no Inversor

```
┌─────────────────────────────────────┐
│  Inversor                      [✕] │
│  ─────────────────────────────────  │
│  Modelo:     Huawei SUN2000-5KTL   │
│  Potência:   5,0 kW CA             │
│  Eficiência: 97,5%                 │
│  FDI:        1,18  ✅              │
│  AFCI:       Não   ⚠              │
│  RSD:        Não   ⚠              │
│  IP:         IP65                  │
│  Resfriamento: Passivo             │
│                                    │
│  MPPT 1: Voc 512,3V · Isc 20,4A ✅│
│  MPPT 2: Voc 308,5V · Isc 10,2A ✅│
└─────────────────────────────────────┘
```

---

## 9. Estado de Carregamento

Quando o integrador acessa a Layer 3 pela primeira vez (ou após mudança no grafo):

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    ◐  Gerando Unifilar...                  │
│                                                             │
│      Processando topologia elétrica  ████████░░  80%       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Barra de progresso com 4 estágios:
- "Analisando grafo" (25%)
- "Calculando posições" (50%)
- "Roteando condutores" (75%)
- "Renderizando símbolos" (100%)

Tempo típico: < 500ms para projetos residenciais; até 2s para projetos com > 100 módulos.

---

## 10. Exportação

### 10.1 Exportar SVG

Botão no HUD: `[↓ SVG]`

Ação: serializa o `<svg>` do diagrama e dispara download de arquivo:
- Nome: `unifilar-{projectName}-{date}.svg`
- Inclui: todos os símbolos, anotações, legenda e cabeçalho técnico

**Cabeçalho técnico no SVG exportado:**
```
Projeto:      {projectName}
Cliente:      {clientName}
Endereço:     {street}, {city} - {state}
Data:         {date}
Elaborado:    Kurupira / Neonorte Engenharia
Normas:       NBR 5410 · NBR 16690 · IEC 60617
```

### 10.2 Exportar PNG

Botão: `[↓ PNG]`

Renderiza o SVG em Canvas 2D via `drawImage` e exporta como `image/png` com resolução 2× (para impressão A4).

---

## 11. Integração de Estado

```typescript
// Tudo derivado — Layer 3 não escreve no store

// Input: grafo completo
const arrangements = useSolarStore(s => s.designData.physicalArrangements);
const inverters    = useSolarStore(s => s.designData.inverters);
const modules      = useSolarStore(s => s.designData.modules);  // catálogo
const mpptConfigs  = useSolarStore(s => s.designData.mpptConfigs);
const clientData   = useSolarStore(s => s.clientData);

// Seletor principal — memoizado, recomputa quando grafo muda
const unifilarLayout = useUnifilarLayout();
// Retorna: { nodes: LayoutNode[], edges: LayoutEdge[], ready: boolean }
// 'ready: false' enquanto Worker processa

// Seleção interativa
const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
```

`useUnifilarLayout` gerencia o ciclo de vida do Worker:
- Cria o Worker na primeira chamada
- Posta mensagem com o grafo serializado quando `arrangements` muda
- Recebe o layout calculado via `onmessage`
- Retorna `ready: false` durante o processamento
- Cacheia o resultado; não reprocessa se o grafo não mudou

---

## 12. Critérios de Aceitação

### Geração automática
- [ ] Layer 3 gera o unifilar automaticamente ao ser acessada pela primeira vez
- [ ] Para 2 strings + 1 inversor: diagrama tem 4 camadas (Strings → Inversor → QD-CA → Rede)
- [ ] Para 3+ strings paralelas ao mesmo MPPT: nó "Caixa CC" inserido automaticamente entre strings e MPPT
- [ ] Diagrama atualiza quando integrador volta para Layer 1 e modifica o stringing

### Símbolos e anotações
- [ ] Símbolo de string FV exibe label `SX · N× Modelo WattsWp`
- [ ] Símbolo de inversor exibe modelo, potência e FDI
- [ ] Anotação `AFCI ausente` aparece quando `inversor.afci === false`
- [ ] Anotação `RSD ausente` aparece quando `inversor.rsd === false`
- [ ] Símbolo de aterramento (triângulo IEC) presente nos pontos corretos

### Arestas e roteamento
- [ ] Condutores CC positivos renderizados em vermelho; negativos em azul
- [ ] Condutores CA em cinza; aterramento em verde tracejado
- [ ] Nenhuma aresta cruza nenhum símbolo (roteamento ortogonal com desvio de obstáculos)

### Painel lateral
- [ ] Click em string exibe Voc(frio) e Vmp(calor) calculados com valores de Tmin/Tamb do projeto
- [ ] Click no inversor exibe status AFCI, RSD, IP e FDI

### Exportação
- [ ] SVG exportado inclui cabeçalho técnico com nome do projeto e normas
- [ ] PNG exportado tem resolução 2× adequada para impressão
- [ ] Nomes dos arquivos incluem `projectName` e data atual

### Performance
- [ ] Estado de carregamento exibido quando processamento > 100ms
- [ ] Para projeto com 20 módulos: unifilar pronto em < 300ms
- [ ] Para projeto com 100 módulos: unifilar pronto em < 1.500ms
- [ ] Zoom 50%–200% funcional sem re-renderização do SVG

### Geral
- [ ] Layer 0 completamente oculta quando Layer 3 está ativa
- [ ] `tsc --noEmit` → EXIT CODE 0

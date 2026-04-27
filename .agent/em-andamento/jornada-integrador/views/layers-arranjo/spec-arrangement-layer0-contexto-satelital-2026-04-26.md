# Spec — PhysicalCanvas Layer 0: Contexto Satelital

**Arquivo alvo:** `canvas-views/arrangement/Layer0Context.tsx`
**Tipo:** Feature Nova
**Módulo:** `engineering` — `PhysicalCanvasView`
**Camada:** 0 de 3 (base não interativa — sempre presente)
**Prioridade:** P0 — base de todas as outras camadas; nenhuma pode existir sem esta
**Responsável (impl.):** `the-builder`
**Revisor (aceitação):** `design-lead`
**Data de criação:** 2026-04-26
**Versão:** 1.0
**Depende de:** `spec-view-site-2026-04-15.md` (origem das coordenadas `lat/lng`)
**Consumida por:** Layer 1, Layer 2, Layer 3 (todas renderizam sobre esta base)

---

## 1. Propósito

A Layer 0 fornece o **substrato georreferenciado** sobre o qual todas as demais camadas do módulo de arranjo operam. Ela não é interativa no sentido de criar ou editar dados — é o plano de fundo que ancora o projeto ao mundo real.

Dois estados visuais alternam conforme o contexto de uso:

| Estado | Nome | Quando ativo |
|--------|------|-------------|
| **Reconhecimento** | Satélite pleno | Layer 0 isolada ou Layer 1 em modo "identificação de área" |
| **Blueprint** | Satélite dessaturado + grid | Sempre que Layer 1, 2 ou 3 estão em modo de edição ativo |

A transição entre os dois estados é disparada pelo toggle "Focar no Arranjo" no HUD superior, ou automaticamente quando o integrador começa a desenhar um polígono.

---

## 2. Composição Visual

### 2.1 Estado: Reconhecimento

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│   [IMAGEM SATELITAL — tiles Leaflet / Google Satellite]        │
│                                                                │
│   Zoom: nível 19–21 (permite identificar telhados)             │
│   brightness: 100% | saturate: 100%                           │
│                                                                │
│   [📍 Pin de localização — cor indigo-500]                     │
│   [HUD instrucional flutuante quando sem polígono desenhado]   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

O pin de localização é posicionado em `clientData.lat / clientData.lng`. Ao clicar e arrastar o pin, `clientData.lat` e `clientData.lng` são atualizados no store — refinamento fino sem sair do módulo de arranjo.

**HUD instrucional** (aparece somente quando `physicalArrangements.length === 0`):
```
┌──────────────────────────────────────────────┐
│  📐 Clique em "Nova Área" ou use             │
│  a ferramenta de polígono para              │
│  demarcar uma superfície de instalação.     │
└──────────────────────────────────────────────┘
```
Fundo `bg-slate-900/80 backdrop-blur-sm`, texto `text-slate-300 text-[11px]`.
Posicionado no centro-superior do canvas. Desaparece quando a primeira área é criada.

### 2.2 Estado: Blueprint

```
┌────────────────────────────────────────────────────────────────┐
│  ┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼   │
│  │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │  ← grid blueprint
│  ┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼   │
│                                                                │
│   [IMAGEM SATELITAL — sobreposta com filtro]                   │
│   filter: brightness(0.50) saturate(0)                        │
│                                                                │
│  ┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼   │
└────────────────────────────────────────────────────────────────┘
```

**Grid blueprint:** linhas verticais e horizontais em `stroke: rgba(99,102,241,0.12)` (indigo/12%), espaçamento de 20px na tela (escala independente do zoom do mapa). O grid é renderizado em SVG sobre o tile do Leaflet via `<svg>` absolutamente posicionado.

**Filtro do tile:** aplicado via classe Leaflet no container `.leaflet-tile-container`:
```css
.layer-0--blueprint .leaflet-tile-container {
  filter: brightness(0.5) saturate(0);
  transition: filter 400ms ease;
}
.layer-0--recon .leaflet-tile-container {
  filter: brightness(1) saturate(1);
  transition: filter 400ms ease;
}
```

### 2.3 Toggle de modo

Botão no HUD superior direito da PhysicalCanvasView:

```
Estado Reconhecimento:  [🛰 Focar no Arranjo]
Estado Blueprint:       [🛰 Ver Satélite]
```

Ao ativar Blueprint, o sistema executa em sequência:
1. Aplica `filter: brightness(0.5) saturate(0)` ao tile (400ms ease)
2. Fade-in do grid SVG (200ms, inicia após 200ms)
3. Emite `uiStore.setArrangementMode('blueprint')`

---

## 3. Controles de Navegação do Mapa

### 3.1 Zoom e pan

- **Zoom:** scroll da roda do mouse, pinch no touch. Limites: `minZoom: 17`, `maxZoom: 21`
- **Pan:** arraste livre. O pin de localização permanece fixo no `lat/lng`
- **Controles de zoom:** posicionados no canto inferior direito (não no padrão Leaflet superior esquerdo, que conflita com o LeftOutliner)

### 3.2 Botão "Centralizar"

Ícone de crosshair no HUD superior. Ao clicar: `map.flyTo([lat, lng], 19, { duration: 0.8 })`. Útil quando o integrador fez pan longe da localização do projeto.

### 3.3 Seletor de tile

Dois provedores disponíveis via dropdown no HUD:

| Label | Provider | Uso recomendado |
|-------|----------|----------------|
| Satélite | Google Maps Satellite (ou Mapbox Satellite) | Padrão — telhados claros |
| Híbrido | Google Maps Hybrid | Quando labels de rua são úteis para referência |

O provider ativo é salvo em `uiStore.arrangementTileProvider` — persiste apenas na sessão, não no projeto.

---

## 4. Integração de Estado

```typescript
// Leitura
const lat = useSolarStore(s => s.clientData.lat);
const lng = useSolarStore(s => s.clientData.lng);
const mode = useUIStore(s => s.arrangementMode);  // 'recon' | 'blueprint'

// Escrita
const updateClientData = useSolarStore(s => s.updateClientData);
const setArrangementMode = useUIStore(s => s.setArrangementMode);
```

**Invariante:** se `lat === null || lng === null`, a Layer 0 exibe um estado de erro com CTA:

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│         📍 Localização do projeto não definida                 │
│                                                                │
│         [→ Definir localização na aba Projeto]                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```
O CTA executa `setFocusedBlock('site')`.

---

## 5. Dados que Layer 0 fornece para as camadas superiores

Layer 0 estabelece o **sistema de coordenadas compartilhado** entre todas as camadas:

```typescript
// Context fornecido por Layer0Context via React Context
export interface Layer0Context {
  map: L.Map;                    // instância Leaflet — usada pelas camadas superiores para converter latlng ↔ px
  mode: 'recon' | 'blueprint';
  pixelOrigin: L.Point;          // ponto de referência para conversões de coordenadas
  zoom: number;                  // zoom atual — afeta escala dos módulos em Layer 1
}
```

A conversão de coordenadas geográficas para pixels do canvas é centralizada aqui e exposta às camadas superiores via context — nenhuma outra camada chama `map.latLngToContainerPoint()` diretamente.

---

## 6. Critérios de Aceitação

- [ ] Tile satelital carrega centrado em `clientData.lat / clientData.lng` ao montar o componente
- [ ] Zoom 17–21 funcional; fora desse range os botões de zoom são desabilitados
- [ ] Arraste do pin atualiza `clientData.lat` e `clientData.lng` no store com `onBlur` (não a cada pixel)
- [ ] Toggle "Focar no Arranjo" aplica filtro CSS no tile em 400ms; grid SVG aparece em fade após 200ms
- [ ] Toggle "Ver Satélite" reverte ambos os efeitos na mesma duração
- [ ] Botão "Centralizar" voa para `lat/lng` com `flyTo` animado
- [ ] Quando `lat === null`: estado de erro com CTA visível; nenhuma ferramenta de desenho ativa
- [ ] `Layer0Context` é acessível via `useLayer0()` em Layer 1, 2 e 3 sem prop drilling
- [ ] Tile não é recarregado ao trocar entre layers 1, 2 e 3 (Leaflet nunca desmonta)
- [ ] `tsc --noEmit` → EXIT CODE 0

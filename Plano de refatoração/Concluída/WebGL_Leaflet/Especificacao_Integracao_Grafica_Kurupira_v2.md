NEONORTE

**Kurupira --- Integração Gráfica**

Especificação Técnica: CenterCanvas (Leaflet + WebGL) --- v2.0

Para uso exclusivo do engenheiro responsável pela implementação

  -----------------------------------------------------------------------
  **Campo**              **Valor**
  ---------------------- ------------------------------------------------
  Data                   22 de março de 2026

  Versão                 2.0 --- revisada após auditoria técnica
                         (Antigravity, 22/03/2026)

  Versão anterior        1.0 ---
                         Especificacao_Integracao_Grafica_Kurupira.docx

  Pré-requisito          UX-001 concluído. solarStore normalizado. zundo
                         operacional.

  Componente alvo        CenterCanvas.tsx + CanvasContainer.tsx +
                         projectSlice.ts (novo)

  Status ao iniciar v2   Esqueleto visual estabilizado. 3 gaps críticos
                         identificados na auditoria.
  -----------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **O que mudou da v1.0 para a v2.0**                                   |
|                                                                       |
| CORRIGIDO --- Seção 2: CanvasContainer unificado em componente único  |
| com invalidateSize() via ref.                                         |
|                                                                       |
| CORRIGIDO --- Seção 2: data-width/height substituído por ref + CSS.   |
| Causa de quebra no Leaflet.                                           |
|                                                                       |
| CORRIGIDO --- Seção 3: projectSlice.ts especificado como pré-condição |
| obrigatória antes do MapCore.                                         |
|                                                                       |
| CORRIGIDO --- Seção 3: tile layer Google substituído por Mapbox com   |
| fallback OpenStreetMap.                                               |
|                                                                       |
| CORRIGIDO --- Seção 3: SolarLayer com useMemo e createSelector para   |
| seletores estáveis.                                                   |
|                                                                       |
| NOVO --- Seção 4: cálculo de axisAngle para alinhamento de módulos ao |
| telhado (PLACE_MODULE).                                               |
|                                                                       |
| ATUALIZADO --- Seção 5: uiStore como store separado (não useState     |
| local) para permitir consumo cross-component.                         |
|                                                                       |
| ATUALIZADO --- Seção 7: plano de execução reordenado ---              |
| CanvasContainer e projectSlice são pré-condições do GFX.              |
+-----------------------------------------------------------------------+

**1. Achados da Auditoria --- Resumo e Ações**

A auditoria técnica de 22/03/2026 (Antigravity) verificou a conformidade
do esqueleto Kurupira contra a especificação v1.0 e identificou três
gaps que bloqueiam a construção do MapCore.

  -------------------------------------------------------------------------------------
  **\#**   **Achado**                **Severidade**   **Ação na v2.0**
  -------- ------------------------- ---------------- ---------------------------------
  A1       projectSlice inexistente  Alta             Especificado em detalhe na Seção
           --- dados de geometria                     3.1. Pré-condição obrigatória do
           (polígonos, zoom) orfãos                   GFX.
           no store.                                  

  A2       Duas versões de           Média            Unificação especificada na Seção
           CanvasContainer.tsx no                     2.1. Uma única versão com API
           disco com comportamentos                   clara.
           conflitantes.                              

  A3       CanvasContainer usa       Alta             Substituição especificada na
           data-width/height em vez                   Seção 2.2 com invalidateSize()
           de ref + CSS. Leaflet                      obrigatório.
           quebra no resize.                          

  A4       Tile layer Google sem     Alta             Substituído por Mapbox + fallback
           chave de API --- risco de                  OSM na Seção 3.2.
           bloqueio de IP ou                          
           cobrança.                                  

  A5       SolarLayer previsto com   Média            Seletores estáveis com
           Object.values() sem                        createSelector especificados na
           useMemo --- re-render a                    Seção 3.3.
           cada evento.                               

  A6       PLACE_MODULE sem cálculo  Média            Cálculo de axisAngle detalhado na
           trigonométrico de                          Seção 4.3.
           alinhamento ao telhado.                    

  A7       activeTool e              Baixa            Migração para uiStore separado
           selectedEntity em                          especificada na Seção 5.1.
           useState local --- não                     
           acessíveis                                 
           cross-component.                           
  -------------------------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **Ponto positivo mantido da v1.0**                                    |
|                                                                       |
| Isolamento do zundo: activeTool e selectedEntity estão fora do        |
| solarStore --- o histórico de undo não está poluído.                  |
|                                                                       |
| React.memo() aplicado no CenterCanvas --- decisão correta para        |
| isolamento do motor gráfico.                                          |
|                                                                       |
| Parcialização do zundo cobre apenas domínio paramétrico --- conforme  |
| especificado em PRÉ-2.                                                |
+-----------------------------------------------------------------------+

**2. CanvasContainer --- Versão Unificada e Corrigida**

A auditoria encontrou duas versões conflitantes no disco. Esta seção
especifica a versão única definitiva que substitui ambas.

**2.1 Unificação --- o que descartar**

  ------------------------------------------------------------------------
  **Versão            **Problema**              **Ação**
  encontrada**                                  
  ------------------- ------------------------- --------------------------
  Versão com          Usa atributos de DOM para Descartar. Substituir pela
  data-width/height   repassar dimensões.       versão abaixo.
                      Leaflet não lê            
                      data-attributes --- o     
                      mapa não redimensiona.    

  Versão com ref +    Estrutura correta mas sem Base para a versão
  useState            chamada a                 unificada --- adicionar
                      invalidateSize(). O       invalidateSize().
                      Leaflet não sabe que o    
                      contêiner mudou.          
  ------------------------------------------------------------------------

**2.2 Implementação unificada**

A versão definitiva usa ref no contêiner pai, propaga dimensões via
Context (não data-attributes) e expõe um callback onResize para o motor
Leaflet chamar invalidateSize().

> // CanvasContainer.tsx --- versão unificada definitiva
>
> import { createContext, useContext, useEffect, useRef, useState } from
> \'react\'
>
> interface CanvasSize { width: number; height: number }
>
> const CanvasSizeContext = createContext\<CanvasSize\>({ width: 0,
> height: 0 })
>
> export const useCanvasSize = () =\> useContext(CanvasSizeContext)
>
> interface Props {
>
> children: React.ReactNode
>
> onResize?: (size: CanvasSize) =\> void // Leaflet chama
> invalidateSize() aqui
>
> }
>
> export const CanvasContainer = ({ children, onResize }: Props) =\> {
>
> const containerRef = useRef\<HTMLDivElement\>(null)
>
> const sizeRef = useRef\<CanvasSize\>({ width: 0, height: 0 })
>
> const \[size, setSize\] = useState\<CanvasSize\>({ width: 0, height: 0
> })
>
> useEffect(() =\> {
>
> const ro = new ResizeObserver((\[entry\]) =\> {
>
> const { width, height } = entry.contentRect
>
> // 1. Mutação de ref --- sem re-render (para uso no rAF do motor)
>
> sizeRef.current = { width, height }
>
> // 2. setState --- propaga via Context para consumidores React
>
> setSize({ width, height })
>
> // 3. Callback para o motor Leaflet chamar invalidateSize()
>
> onResize?.({ width, height })
>
> })
>
> if (containerRef.current) ro.observe(containerRef.current)
>
> return () =\> ro.disconnect()
>
> }, \[onResize\])
>
> return (
>
> \<CanvasSizeContext.Provider value={size}\>
>
> \<div ref={containerRef}
>
> style={{ position: \'relative\', width: \'100%\', height: \'100%\',
> overflow: \'hidden\' }}\>
>
> {children}
>
> \</div\>
>
> \</CanvasSizeContext.Provider\>
>
> )
>
> }

**2.3 Integração com Leaflet --- invalidateSize()**

O Leaflet precisa ser notificado explicitamente quando o contêiner muda
de tamanho. Sem isso, o mapa mantém o viewport interno com as dimensões
antigas e exibe tiles desalinhados.

> // MapCore.tsx --- uso do callback onResize
>
> import { useRef } from \'react\'
>
> import { MapContainer, TileLayer } from \'react-leaflet\'
>
> import { useMap } from \'react-leaflet\'
>
> const MapInvalidator = () =\> {
>
> const map = useMap()
>
> // Expõe invalidateSize para o CanvasContainer
>
> useEffect(() =\> {
>
> window.\_\_leafletInvalidate = () =\> map.invalidateSize()
>
> }, \[map\])
>
> return null
>
> }
>
> // Alternativa mais limpa via callback do CanvasContainer:
>
> const handleResize = useCallback(() =\> {
>
> mapRef.current?.invalidateSize()
>
> }, \[\])
>
> \<CanvasContainer onResize={handleResize}\>
>
> \<MapContainer ref={mapRef} \...\>
>
> \<MapInvalidator /\>
>
> \...
>
> \</MapContainer\>
>
> \</CanvasContainer\>

+-----------------------------------------------------------------------+
| **Critérios de aceite --- CanvasContainer v2**                        |
|                                                                       |
| Uma única versão de CanvasContainer.tsx no disco. Arquivos            |
| conflitantes removidos.                                               |
|                                                                       |
| Sem data-width ou data-height em qualquer parte do código.            |
|                                                                       |
| Arrastar o divisor entre Outliner e CenterCanvas redimensiona o mapa  |
| sem tiles desalinhados.                                               |
|                                                                       |
| onResize callback chama map.invalidateSize() --- verificável com      |
| DevTools (Network: novos tiles carregados após resize).               |
|                                                                       |
| canvas com display: block e sem window.addEventListener(\'resize\').  |
+-----------------------------------------------------------------------+

**3. Infraestrutura de Geometria --- Pré-condições do MapCore**

Dois problemas da auditoria (A1 e A4) bloqueiam o bootstrap do MapCore.
Ambos devem ser resolvidos antes de criar o MapCore.tsx.

**3.1 projectSlice.ts --- estado geométrico do projeto**

O slice é inexistente. Polígonos de telhado, coordenadas e zoom estão
orfãos. Este slice deve entrar no zundo parcializado --- mudanças de
geometria são reversíveis.

> // src/core/state/slices/projectSlice.ts
>
> import { StateCreator } from \'zustand\'
>
> import type { LatLngTuple } from \'leaflet\'
>
> export interface ProjectState {
>
> project: {
>
> coordinates: { lat: number; lng: number } \| null // null = não
> definido
>
> zoom: number // default: 19
>
> roofPolygon: LatLngTuple\[\] // vértices do telhado
>
> roofAzimuth: number \| null // graus --- derivado do polígono
>
> }
>
> setCoordinates: (lat: number, lng: number) =\> void
>
> setZoom: (zoom: number) =\> void
>
> addRoofVertex: (point: LatLngTuple) =\> void
>
> closeRoofPolygon: () =\> void // fecha e calcula azimuth
>
> clearRoofPolygon: () =\> void
>
> }
>
> export const projectSlice: StateCreator\<ProjectState\> = (set, get)
> =\> ({
>
> project: { coordinates: null, zoom: 19, roofPolygon: \[\],
> roofAzimuth: null },
>
> setCoordinates: (lat, lng) =\> set(s =\> ({
>
> project: { \...s.project, coordinates: { lat, lng } }
>
> })),
>
> addRoofVertex: (point) =\> set(s =\> ({
>
> project: { \...s.project, roofPolygon: \[\...s.project.roofPolygon,
> point\] }
>
> })),
>
> closeRoofPolygon: () =\> set(s =\> ({
>
> project: {
>
> \...s.project,
>
> roofAzimuth: calcRoofAzimuth(s.project.roofPolygon) // ver Seção 4.3
>
> }
>
> })),
>
> clearRoofPolygon: () =\> set(s =\> ({
>
> project: { \...s.project, roofPolygon: \[\], roofAzimuth: null }
>
> })),
>
> }

+-----------------------------------------------------------------------+
| **Integração com zundo --- parcialização**                            |
|                                                                       |
| Adicionar project ao objeto de partialize do zundo no solarStore.ts:  |
|                                                                       |
| partialize: (state) =\> ({ modules: state.modules, inverters:         |
| state.inverters, bosInventory: state.bosInventory, project:           |
| state.project })                                                      |
|                                                                       |
| Isso garante que desenhar/apagar o polígono do telhado seja           |
| reversível via Ctrl+Z.                                                |
+-----------------------------------------------------------------------+

**3.2 Tile Layer --- substituição do Google**

O endpoint Google sem chave de API é um risco operacional confirmado
pela auditoria. A substituição usa Mapbox como provedor primário com
fallback para OpenStreetMap.

  ------------------------------------------------------------------------------------------------------------------------------------------------
  **Provedor**    **URL**                                                                                       **Requisito**         **Uso**
  --------------- --------------------------------------------------------------------------------------------- --------------------- ------------
  Mapbox          https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token={token}   Token em .env         Primário ---
  Satellite                                                                                                     (VITE_MAPBOX_TOKEN)   alta
                                                                                                                                      qualidade

  OpenStreetMap   https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png                                            Nenhum --- gratuito   Fallback se
                                                                                                                                      token
                                                                                                                                      ausente

  Google          https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}                                            Sem chave --- RISCO   Remover ---
  Satellite                                                                                                                           não usar
  ------------------------------------------------------------------------------------------------------------------------------------------------

> // MapCore.tsx --- tile layer com fallback
>
> const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
>
> const tileUrl = MAPBOX_TOKEN
>
> ?
> \`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=\${MAPBOX_TOKEN}\`
>
> : \'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png\'
>
> \<TileLayer url={tileUrl} maxZoom={21} tileSize={512} zoomOffset={-1}
> /\>

**3.3 SolarLayer --- seletores estáveis com createSelector**

O Object.values() sem memoização reconstrói o array a cada render mesmo
sem mudança no store. Para o SolarLayer, que escuta mousemove, isso
causa re-renders contínuos.

> // selectors/solarSelectors.ts
>
> import { createSelector } from \'reselect\' // ou usar useMemo inline
>
> import { SolarStore } from \'@/core/state/solarStore\'
>
> // Seletor estável --- só reconstrói se entities mudar
>
> export const selectModulesArray = createSelector(
>
> (s: SolarStore) =\> s.modules.entities,
>
> (entities) =\> Object.values(entities)
>
> )
>
> export const selectInvertersArray = createSelector(
>
> (s: SolarStore) =\> s.inverters.entities,
>
> (entities) =\> Object.values(entities)
>
> )
>
> // Uso no SolarLayer.tsx
>
> const modules = useSolarStore(selectModulesArray)
>
> const inverters = useSolarStore(selectInvertersArray)

**4. PLACE_MODULE --- Cálculo de Alinhamento ao Telhado**

A auditoria identificou ausência do cálculo trigonométrico de
alinhamento (axisAngle) na ferramenta PLACE_MODULE. O módulo deve ser
posicionado alinhado à orientação dominante do telhado, não ao norte
geográfico.

**4.1 Conceito --- axisAngle**

O eixo de alinhamento é derivado da aresta mais longa do polígono do
telhado. O ângulo dessa aresta em relação ao norte geográfico é o
axisAngle. Módulos são posicionados em grid rotacionado por esse ângulo.

**4.2 Relação com engineeringSlice.azimute**

O engineeringSlice já possui um campo azimute --- o azimute solar do
projeto (orientação do painel para maximizar geração). O axisAngle de
alinhamento físico ao telhado pode divergir do azimute solar. Os dois
devem ser campos distintos:

  ------------------------------------------------------------------------------
  **Campo**     **Slice**          **Significado**           **Quem define**
  ------------- ------------------ ------------------------- -------------------
  azimute       engineeringSlice   Orientação solar ótima    Engenheiro,
                                   para cálculo de geração   formulário de
                                   (ex: 180° = sul)          parâmetros

  roofAzimuth   projectSlice       Ângulo físico do telhado  Calculado
                                   --- aresta longa do       automaticamente ao
                                   polígono em graus         fechar o polígono

  axisAngle     Derivado           Ângulo usado para         roofAzimuth por
                                   rotacionar o grid de      padrão,
                                   módulos no PLACE_MODULE   sobrescritível pelo
                                                             engenheiro
  ------------------------------------------------------------------------------

**4.3 Implementação --- calcRoofAzimuth**

Função pura que recebe o array de vértices do polígono e retorna o
azimute em graus (0--360) da aresta mais longa.

> // utils/geoUtils.ts
>
> import type { LatLngTuple } from \'leaflet\'
>
> /\*\*
>
> \* Retorna o azimute (graus, 0=Norte, 90=Leste) da aresta mais longa
>
> \* do polígono. Usado para alinhar o grid de módulos ao telhado.
>
> \*/
>
> export function calcRoofAzimuth(polygon: LatLngTuple\[\]): number {
>
> if (polygon.length \< 2) return 0
>
> let maxLen = 0
>
> let azimuth = 0
>
> for (let i = 0; i \< polygon.length; i++) {
>
> const \[lat1, lng1\] = polygon\[i\]
>
> const \[lat2, lng2\] = polygon\[(i + 1) % polygon.length\]
>
> // Comprimento aproximado em metros (Haversine simplificado)
>
> const dLat = (lat2 - lat1) \* 111320
>
> const dLng = (lng2 - lng1) \* 111320 \* Math.cos(lat1 \* Math.PI /
> 180)
>
> const len = Math.sqrt(dLat \* dLat + dLng \* dLng)
>
> if (len \> maxLen) {
>
> maxLen = len
>
> // atan2 retorna ângulo do eixo X; converter para azimute
>
> azimuth = (Math.atan2(dLng, dLat) \* 180 / Math.PI + 360) % 360
>
> }
>
> }
>
> return azimuth
>
> }

**4.4 Cálculo do polígono do módulo**

Com o axisAngle definido, cada módulo clicado gera um polígono de 4
vértices rotacionado. As dimensões físicas do modelo (largura e altura
em metros) são convertidas para graus geográficos.

> // utils/geoUtils.ts (continuação)
>
> export function calcModulePolygon(
>
> center: LatLngTuple,
>
> widthM: number, // largura do módulo em metros
>
> heightM: number, // altura do módulo em metros
>
> axisAngle: number // graus --- roofAzimuth ou override
>
> ): LatLngTuple\[\] {
>
> const \[lat, lng\] = center
>
> const rad = axisAngle \* Math.PI / 180
>
> // 1 grau de latitude ≈ 111320m; longitude depende da latitude
>
> const mPerLat = 111320
>
> const mPerLng = 111320 \* Math.cos(lat \* Math.PI / 180)
>
> const hw = widthM / 2 / mPerLng // half-width em graus
>
> const hh = heightM / 2 / mPerLat // half-height em graus
>
> // Cantos antes da rotação (ordem: TL, TR, BR, BL)
>
> const corners: \[number, number\]\[\] = \[
>
> \[-hh, -hw\], \[-hh, hw\], \[hh, hw\], \[hh, -hw\]
>
> \]
>
> // Rotacionar cada canto pelo axisAngle
>
> return corners.map((\[dy, dx\]) =\> \[
>
> lat + dy \* Math.cos(rad) - dx \* Math.sin(rad),
>
> lng + dy \* Math.sin(rad) + dx \* Math.cos(rad),
>
> \]) as LatLngTuple\[\]
>
> }

+-----------------------------------------------------------------------+
| **Critérios de aceite --- PLACE_MODULE**                              |
|                                                                       |
| calcRoofAzimuth() testável de forma isolada --- função pura sem       |
| dependências de store.                                                |
|                                                                       |
| Módulo posicionado no click alinhado ao roofAzimuth do projectSlice.  |
|                                                                       |
| Se roofPolygon estiver vazio, axisAngle padrão = 0 (alinhado ao Norte |
| geográfico).                                                          |
|                                                                       |
| Undo (Ctrl+Z) remove o último módulo posicionado --- commit via       |
| placeModule() no store.                                               |
|                                                                       |
| Dimensões físicas (widthM, heightM) lidas do ModuleSpecs selecionado  |
| no Inspector.                                                         |
+-----------------------------------------------------------------------+

**5. Gestão de Estado de UI --- uiStore**

A auditoria confirmou que activeTool e selectedEntity estão em useState
local no WorkspaceLayout.tsx. Isso funciona para o componente atual mas
impede consumo cross-component --- o SolarLayer.tsx não consegue ler a
ferramenta ativa sem prop drilling.

**5.1 uiStore --- store separado do solarStore**

Estado de UI nunca entra no zundo. O uiStore é um store Zustand
independente, sem persist e sem middleware de histórico.

> // src/core/state/uiStore.ts
>
> import { create } from \'zustand\'
>
> type Tool = \'SELECT\' \| \'POLYGON\' \| \'MEASURE\' \|
> \'PLACE_MODULE\'
>
> type EntityType = \'module\' \| \'inverter\' \| \'string\'
>
> interface UIState {
>
> // Ferramenta ativa na Ribbon
>
> activeTool: Tool
>
> setActiveTool: (tool: Tool) =\> void
>
> // Entidade selecionada (sincroniza Inspector + Canvas)
>
> selectedEntity: { type: EntityType; id: string } \| null
>
> selectEntity: (type: EntityType, id: string) =\> void
>
> clearSelection: () =\> void
>
> }
>
> export const useUIStore = create\<UIState\>((set) =\> ({
>
> activeTool: \'SELECT\',
>
> setActiveTool: (tool) =\> set({ activeTool: tool }),
>
> selectedEntity: null,
>
> selectEntity: (type, id) =\> set({ selectedEntity: { type, id } }),
>
> clearSelection: () =\> set({ selectedEntity: null }),
>
> }))
>
> // Hooks de conveniência
>
> export const useActiveTool = () =\> useUIStore(s =\> s.activeTool)
>
> export const useSelectedEntity = () =\> useUIStore(s =\>
> s.selectedEntity)

**5.2 Migração do useState local**

O WorkspaceLayout.tsx deve remover o useState local de activeTool e
selectedEntity e passar a usar o uiStore. Os componentes filhos
(TopRibbon, SolarLayer, RightInspector) consomem o uiStore diretamente
--- sem prop drilling.

  -----------------------------------------------------------------------------
  **Componente**        **Antes (useState       **Depois (uiStore)**
                        local)**                
  --------------------- ----------------------- -------------------------------
  WorkspaceLayout.tsx   const \[activeTool,     Remover. TopRibbon chama
                        setActiveTool\] =       setActiveTool() direto no
                        useState(\'SELECT\')    uiStore.

  TopRibbon.tsx         Recebe activeTool via   const { activeTool,
                        prop                    setActiveTool } = useUIStore()

  SolarLayer.tsx        Não tinha acesso (gap)  const activeTool =
                                                useActiveTool()

  RightInspector.tsx    Recebe selectedEntity   const selected =
                        via prop                useSelectedEntity()
  -----------------------------------------------------------------------------

**6. Regras Arquiteturais --- Atualizadas**

  ------------------------------------------------------------------------
  **Regra**          **Descrição**                 **Mudança v2**
  ------------------ ----------------------------- -----------------------
  Store é o único    Motor gráfico consome o store Sem mudança ---
  source of truth    passivamente. Nenhuma         reforçado pelo
                     entidade geométrica vive      projectSlice
                     apenas no Leaflet --- toda    obrigatório.
                     mutação passa pelas actions   
                     do solarStore ou              
                     projectSlice.                 

  Estado de UI no    activeTool, selectedEntity,   ATUALIZADO --- useState
  uiStore            hover state --- todos no      local no
                     uiStore independente. Nunca   WorkspaceLayout deve
                     no solarStore nem em useState ser migrado para
                     local de layout.              uiStore.

  Sem setState em    Eventos de mousemove e drag   Sem mudança.
  loops              usam refs mutados             
                     diretamente. Somente eventos  
                     finais (pointerUp,            
                     double-click) disparam commit 
                     no store.                     

  CanvasContainer é  Nenhuma biblioteca gráfica    ATUALIZADO ---
  a fronteira        acessa dimensões fora do      data-width/height
                     CanvasContainer. Sem          proibidos. Dimensões
                     window.resize. Sem            via Context ou callback
                     data-attributes para          onResize.
                     dimensões.                    

  invalidateSize()   Toda mudança de tamanho do    NOVO --- ausência desta
  obrigatório        CanvasContainer deve chamar   chamada causa tiles
                     map.invalidateSize() no       desalinhados.
                     Leaflet via callback          
                     onResize.                     

  Seletores estáveis Object.values() de entities   NOVO --- risco O(n)
                     sempre em createSelector ou   identificado na
                     useMemo. Nunca chamado        auditoria.
                     diretamente no corpo do       
                     componente.                   

  Geometria no       roofPolygon, coordinates e    NOVO --- slice
  projectSlice       zoom pertencem ao             inexistente na v1,
                     projectSlice --- não ao       obrigatório na v2.
                     engineeringSlice nem a estado 
                     local de componente.          
  ------------------------------------------------------------------------

**7. Plano de Execução --- Revisado**

O plano da v1.0 foi reordenado. CanvasContainer e projectSlice são
pré-condições do MapCore --- nenhuma das tasks GFX pode iniciar sem elas
concluídas.

**Pré-GFX --- Infraestrutura obrigatória**

Portão de entrada. Bloqueadores identificados pela auditoria.

  --------------------------------------------------------------------------
  **Task**          **Descrição**                 **Critério de aceite**
  ----------------- ----------------------------- --------------------------
  PGFX-01           Unificar as duas versões em   Uma versão no disco. Sem
  CanvasContainer   uma única. Substituir         data-width/height. Resize
  v2                data-attributes por Context + do painel não desalinha
                    callback onResize.            tiles.
                    Implementar invalidateSize()  
                    via Leaflet ref.              

  PGFX-02           Criar projectSlice.ts com     Campos persistidos.
  projectSlice      coordinates, zoom,            roofPolygon reversível via
                    roofPolygon, roofAzimuth.     undo. calcRoofAzimuth()
                    Compor no solarStore.         chamado no
                    Adicionar ao partialize do    closeRoofPolygon.
                    zundo.                        

  PGFX-03 uiStore   Criar uiStore.ts com          Sem useState de
                    activeTool e selectedEntity.  ferramenta/seleção no
                    Migrar useState local do      WorkspaceLayout.
                    WorkspaceLayout. Atualizar    SolarLayer acessa
                    TopRibbon e RightInspector    activeTool sem prop
                    para consumir o store.        drilling.

  PGFX-04 Seletores Criar solarSelectors.ts com   SolarLayer usa seletores
  estáveis          selectModulesArray e          memoizados. DevTools
                    selectInvertersArray usando   Zustand mostra re-renders
                    createSelector. Instalar      apenas quando entities
                    reselect se necessário.       mudam.
  --------------------------------------------------------------------------

**P0-GFX --- Mapa base funcional**

  -----------------------------------------------------------------------
  **Task**       **Descrição**                 **Critério de aceite**
  -------------- ----------------------------- --------------------------
  GFX-01         Instalar react-leaflet,       Mapa renderiza sem erros
  Dependências   leaflet, \@types/leaflet,     de CSS. Token lido do
                 reselect. Adicionar           .env. Fallback OSM
                 VITE_MAPBOX_TOKEN no .env.    funciona sem token.
                 Import do CSS no main.tsx.    

  GFX-02         Criar com MapContainer,       Mapa satélite carrega.
  MapCore.tsx    TileLayer Mapbox+fallback,    Resize dos painéis não
                 MapInvalidator. Usar          distorce. invalidateSize()
                 CanvasContainer v2 como       chamado após cada resize.
                 wrapper externo com onResize. 

  GFX-03         Renderizar roofPolygon do     Polígono desenhável.
  SolarLayer --- projectSlice. Ferramenta      Persiste no store. Undo
  polígono       POLYGON: click adiciona       desfaz último vértice.
                 vértice via addRoofVertex(),  roofAzimuth calculado ao
                 double-click chama            fechar.
                 closeRoofPolygon().           
  -----------------------------------------------------------------------

**P1-GFX --- Módulos e ferramentas**

  -----------------------------------------------------------------------
  **Task**       **Descrição**                 **Critério de aceite**
  -------------- ----------------------------- --------------------------
  GFX-04 Módulos Renderizar polígonos dos      Módulos visíveis. Cor por
  no canvas      módulos via                   string. Módulos sem string
                 selectModulesArray. Coloração em cinza. Sem re-render em
                 por stringId usando           mousemove.
                 stringColor() helper.         

  GFX-05         Click posiciona módulo via    Módulo alinhado ao
  PLACE_MODULE   calcModulePolygon(center, w,  telhado. Undo remove.
                 h, axisAngle). Dimensões do   Dimensões corretas por
                 modelo selecionado no         modelo.
                 Inspector. axisAngle =        
                 roofAzimuth do projectSlice.  

  GFX-06         Click em entidade chama       Inspector sincronizado.
  SELECT +       selectEntity() no uiStore.    VoltageRangeChart aparece
  Inspector      Inspector abre no modo        ao selecionar string.
                 correspondente. Click em área 
                 vazia chama clearSelection(). 

  GFX-07 MEASURE Dois clicks medem distância   Distância em tempo real.
                 A→B em metros usando          Sem re-renders no
                 Haversine. Tooltip flutuante  Inspector. ESC cancela.
                 em tempo real via ref mutado  
                 --- sem setState.             
  -----------------------------------------------------------------------

**P2-GFX --- Qualidade e sincronização**

  -----------------------------------------------------------------------
  **Task**       **Descrição**                 **Critério de aceite**
  -------------- ----------------------------- --------------------------
  GFX-08 Hover   Destacar entidade ao hover    Hover visível. 0
  feedback       com SELECT. Ref mutado        re-renders no Inspector
                 diretamente --- sem setState. durante hover (verificar
                 Leaflet eventHandlers         com React DevTools
                 mouseover/mouseout.           Profiler).

  GFX-09         selectedEntity no uiStore     Canvas centraliza na
  Outliner →     dispara flyTo() no mapa via   entidade selecionada no
  Canvas         useEffect que observa o       Outliner. Highlight visual
                 valor.                        no polígono.

  GFX-10         Leaflet já é on-demand por    CPU em idle quando sem
  On-demand      natureza. Para o R3F futuro:  interação (verificar com
  rendering      frameloop=\'demand\' +        DevTools Performance).
                 invalidate() manual.          
  -----------------------------------------------------------------------

Documento v2.0 gerado em 22/03/2026. Revisado com base na auditoria
técnica Antigravity (22/03/2026). Incorpora correções de:
CanvasContainer, projectSlice, tile layer, seletores, PLACE_MODULE e
uiStore.

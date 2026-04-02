**NEONORTE**

**Kurupira --- Módulo de Dimensionamento**

Especificação Técnica de Refatoração UX-001

Para uso exclusivo do engenheiro responsável pela implementação

  -----------------------------------------------------------------------
  **Campo**              **Valor**
  ---------------------- ------------------------------------------------
  Data                   22 de março de 2026

  Versão                 1.0

  Referência             Arquitetura SaaS Engenharia WebGL Profunda
  arquitetural           

  Auditoria técnica      relatorio_auditoria_tecnica.md --- 22/03/2026

  Repositório            OEscolh1do/nexus-api (branch: main)

  Stack                  React 19 + Vite + Zustand + TypeScript
  -----------------------------------------------------------------------

**1. Contexto e Situação Atual**

O módulo de Dimensionamento do Kurupira foi reestruturado do modelo
baseado em Abas (uma vista por vez) para o modelo Workspace Conectado (4
painéis simultâneos), seguindo a especificação UX-001. A reestruturação
criou o esqueleto visual do novo workspace mas não migrou os componentes
de engenharia existentes.

+-----------------------------------------------------------------------+
| **Situação crítica**                                                  |
|                                                                       |
| 20 componentes de engenharia existem no disco mas estão desplugados   |
| --- nenhum painel novo os importa.                                    |
|                                                                       |
| O engenheiro não consegue dimensionar um sistema solar na interface   |
| atual.                                                                |
|                                                                       |
| Nenhum arquivo legado foi apagado; todos podem ser remontados.        |
|                                                                       |
| A auditoria técnica revelou dois riscos P1 ausentes do plano original |
| que exigem pré-condições antes das migrações.                         |
+-----------------------------------------------------------------------+

**1.1 Distribuição dos componentes por painel**

  -----------------------------------------------------------------------
  **Painel destino** **O que recebe**                      **% do
                                                           esforço**
  ------------------ ------------------------------------- --------------
  RightInspector     Formulários de edição (módulos,       \~60%
                     inversores, strings, perdas,          
                     simulação)                            

  LeftOutliner       Inventários de equipamentos (árvore   \~20%
                     BOS hierárquica)                      

  TopRibbon          Barras de status unificadas +         \~15%
                     aprovação                             

  CenterCanvas       Overlays visuais (tensão MPPT,        \~5%
                     diretrizes)                           
  -----------------------------------------------------------------------

**2. Achados da Auditoria Técnica**

A auditoria técnica de 22/03/2026 examinou três pré-condições
arquiteturais antes de iniciar qualquer migração de componente. Os
achados alteraram a sequência do plano de execução.

**2.1 Estrutura do solarStore --- Estado não normalizado**

+-----------------------------------------------------------------------+
| **Achado #1 --- Severidade P1 (risco latente)**                       |
|                                                                       |
| Todos os quatro slices usam arrays (T\[\]) com mutações via .map() e  |
| .filter().                                                            |
|                                                                       |
| Nenhum slice usa a estrutura normalizada Record\<string, T\> com ids: |
| string\[\].                                                           |
|                                                                       |
| updateModuleQty() itera sobre todos os módulos para atualizar um      |
| único campo.                                                          |
|                                                                       |
| BOSInventory é um objeto monolítico com 3 arrays internos ---         |
| qualquer patch regenera o objeto inteiro.                             |
+-----------------------------------------------------------------------+

Impacto concreto: ao reintegrar ModuleInventory e InverterInventory no
LeftOutliner, qualquer chamada a updateModuleQty(id, qty) gerará uma
nova referência do array modules\[\] inteiro. Todos os componentes
assinando selectModules serão re-renderizados, mesmo que apenas 1 módulo
tenha mudado. O problema é invisível com dados de teste pequenos e
aparece em produção com projetos reais (20+ módulos, 3+ inversores).

**2.2 CenterCanvas --- Ausência de ResizeObserver**

+-----------------------------------------------------------------------+
| **Achado #2 --- Severidade P2 (risco futuro)**                        |
|                                                                       |
| WorkspaceLayout.tsx usa apenas CSS Grid estático --- sem              |
| ResizeObserver.                                                       |
|                                                                       |
| CenterCanvas.tsx é um div placeholder. O motor Leaflet/WebGL ainda    |
| não foi integrado.                                                    |
|                                                                       |
| O risco de distorção de aspect ratio não existe agora, mas se         |
| materializa no momento da integração gráfica.                         |
|                                                                       |
| React.memo() está aplicado no CenterCanvas --- decisão correta para   |
| isolamento futuro.                                                    |
+-----------------------------------------------------------------------+

**2.3 Undo/Redo --- Ausência total de infraestrutura**

+-----------------------------------------------------------------------+
| **Achado #3 --- Severidade P1 (decisão bloqueante para Fase 2)**      |
|                                                                       |
| grep -r \'undo\|redo\|zundo\|CommandPattern\' em src/ retornou zero   |
| resultados.                                                           |
|                                                                       |
| solarStore.ts tem apenas middlewares devtools e persist --- nenhum    |
| middleware de histórico.                                              |
|                                                                       |
| A decisão precisa ser tomada antes dos formulários de edição          |
| paramétrica (SystemLossesCard, StringConfigurator).                   |
|                                                                       |
| Recomendação: zundo (Immer Patches) --- menor fricção com Zustand +   |
| persist já instalados.                                                |
+-----------------------------------------------------------------------+

**3. Decisões Técnicas Documentadas**

**3.1 Normalização do solarStore**

Decisão: converter modules\[\], inverters\[\] e BOSInventory de arrays
para estrutura normalizada por ID.

**Estrutura atual (a ser substituída)**

> // techSlice.ts --- estrutura atual
>
> modules: ModuleSpecs\[\] // array --- O(n) para qualquer lookup
>
> inverters: InverterSpecs\[\] // array --- O(n) para qualquer lookup
>
> // clientSlice.ts
>
> simulatedItems: LoadItem\[\] // array --- mesmo problema
>
> // electricalSlice.ts
>
> bosInventory: BOSInventory \| null // objeto monolítico com 3 arrays

**Estrutura alvo (normalizada)**

> // techSlice.ts --- estrutura normalizada
>
> modules: {
>
> ids: string\[\]
>
> entities: Record\<string, ModuleSpecs\>
>
> }
>
> inverters: {
>
> ids: string\[\]
>
> entities: Record\<string, InverterSpecs\>
>
> }

**Reescrita das actions**

> // ANTES --- O(n) full-scan
>
> updateModuleQty: (id, qty) =\> set(state =\> ({
>
> modules: state.modules.map(m =\> m.id === id ? {\...m, qty} : m)
>
> }))
>
> // DEPOIS --- O(1) lookup
>
> updateModuleQty: (id, qty) =\> set(state =\> ({
>
> modules: {
>
> \...state.modules,
>
> entities: {
>
> \...state.modules.entities,
>
> \[id\]: { \...state.modules.entities\[id\], qty }
>
> }
>
> }
>
> }))

**Critérios de aceite**

-   Todos os seletores existentes (selectModules, selectInverters)
    ajustados para a nova estrutura.

-   updateModuleQty, updateInverterQty e equivalentes reescritos para
    lookup por ID.

-   BOSInventory decomposto em bosItems: { dcCables, acCables, breakers
    } com estrutura normalizada própria.

-   Nenhum componente existente quebrado --- os seletores são a
    interface pública.

**3.2 Undo/Redo --- zundo com Immer Patches**

Decisão: adotar zundo como middleware do solarStore para histórico via
Immer Patches (delta, não snapshots).

  -----------------------------------------------------------------------
  **Critério**       **Command Pattern**     **zundo (Immer Patches) ---
                                             ADOTADO**
  ------------------ ----------------------- ----------------------------
  Memória            Mínima --- deltas       Baixa --- patches JSON
                     vetoriais               

  Código por feature Alto --- execute() +    Baixo --- interceptação
                     undo() por action       automática

  Compatibilidade    Baixa --- refatora      Alta --- middleware plug-in
  Zustand            todas as actions        

  Agrupamento de     Nativo (batch commands) Requer configuração manual
  ações                                      

  Debuggability      Superior                Moderada --- patches
                                             legíveis

  Decisão            ---                     ADOTADO para esta fase
  -----------------------------------------------------------------------

**Implementação**

> // solarStore.ts
>
> import { temporal } from \'zundo\'
>
> export const useSolarStore = create(
>
> devtools(
>
> persist(
>
> temporal(
>
> (\...args) =\> ({
>
> \...techSlice(\...args),
>
> \...clientSlice(\...args),
>
> \...electricalSlice(\...args),
>
> \...engineeringSlice(\...args),
>
> }),
>
> {
>
> // Parcializar: excluir estado de UI do histórico
>
> partialize: (state) =\> ({
>
> modules: state.modules,
>
> inverters: state.inverters,
>
> bosInventory: state.bosInventory,
>
> }),
>
> // Agrupar: throttle de 500ms para sliders contínuos
>
> handleSet: (handleSet) =\>
>
> throttle(handleSet, 500, { leading: false, trailing: true }),
>
> }
>
> ),
>
> { name: \'kurupira-solar-store\' }
>
> )
>
> )
>
> )

**Política de commit para edição contínua**

Sliders de edição paramétrica (perdas, ângulos, temperaturas) geram
dezenas de estados intermediários. O arquivamento automático deve ser
suspenso durante a interação e o commit disparado manualmente no
onPointerUp.

> // Exemplo --- SystemLossesCard
>
> \<Slider
>
> onValueChange={(v) =\> setSoilingLoss(v)} // atualiza o store sem
> commit
>
> onPointerUp={() =\> useTemporalStore.getState().pause(false)} //
> comita
>
> /\>

**Critérios de aceite**

-   zundo instalado e configurado como middleware no solarStore.

-   Apenas os slices paramétricos (modules, inverters, bosInventory)
    entram no histórico --- estado de UI excluído.

-   Undo/redo funcional via useTemporalStore.getState().undo() e
    .redo().

-   Sliders de SystemLossesCard commitam apenas no onPointerUp --- sem
    poluição do histórico com valores intermediários.

**3.3 CenterCanvas --- Infraestrutura de ResizeObserver**

Decisão: criar CanvasContainer wrapper com ResizeObserver antes da
integração do motor gráfico. Não bloqueia o P0, mas deve existir antes
de qualquer motor Leaflet/WebGL ser plugado.

**Implementação**

> // CanvasContainer.tsx --- wrapper a criar
>
> const CanvasContainer = ({ children }) =\> {
>
> const containerRef = useRef\<HTMLDivElement\>(null)
>
> const \[size, setSize\] = useState({ w: 0, h: 0 })
>
> useEffect(() =\> {
>
> const ro = new ResizeObserver((\[entry\]) =\> {
>
> const { width, height } = entry.contentRect
>
> setSize({ w: width, h: height }) // apenas muta ref; resize no rAF
>
> })
>
> if (containerRef.current) ro.observe(containerRef.current)
>
> return () =\> ro.disconnect()
>
> }, \[\])
>
> return (
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
> )
>
> }
>
> // Se usar React Three Fiber, adicionar:
>
> \<Canvas resize={{ debounce: 0 }}\> // sincroniza com divisores do
> workspace

**Critérios de aceite**

-   CanvasContainer criado e aplicado em CenterCanvas.tsx.

-   ResizeObserver observa o contêiner pai --- nunca o elemento canvas
    diretamente.

-   canvas tem display: block --- sem margens fantasmas de inline-block.

-   Nenhum window.addEventListener(\'resize\') --- o ResizeObserver é a
    única fonte de dimensões.

**4. Plano de Execução**

O plano é composto de uma fase de pré-condições técnicas seguida de
quatro fases de migração de componentes. As pré-condições são portão
obrigatório --- nenhuma fase de migração deve iniciar antes delas serem
concluídas e validadas.

+-----------------------------------------------------------------------+
| **Regra de sequenciamento**                                           |
|                                                                       |
| Pré-condições → P0 → P1 → P2 → P3                                     |
|                                                                       |
| Cada fase entrega valor independente --- P1 não depende de P2 estar   |
| completo.                                                             |
|                                                                       |
| As pré-condições NÃO entregam UI. Entregam a fundação segura para as  |
| migrações.                                                            |
|                                                                       |
| Nunca copiar a aba inteira --- extrair apenas a lógica necessária e   |
| adaptar ao painel destino.                                            |
+-----------------------------------------------------------------------+

**Fase Pré --- Pré-condições Técnicas**

Portão obrigatório. Deve ser concluída integralmente antes de qualquer
migração de componente.

  --------------------------------------------------------------------------
  **Task**          **Descrição**                 **Critério de aceite**
  ----------------- ----------------------------- --------------------------
  PRÉ-1 Normalizar  Converter modules\[\],        Todos os seletores
  solarStore        inverters\[\],                ajustados. Nenhum
                    simulatedItems\[\] e          componente existente
                    bosInventory para             quebrado. updateModuleQty
                    Record\<string, T\> com ids:  e equivalentes sem .map()
                    string\[\]. Reescrever todas  full-scan.
                    as actions de atualização     
                    para lookup O(1) por ID.      

  PRÉ-2 Instalar    Adicionar zundo como          undo() e redo()
  zundo             middleware no solarStore.     funcionais. Sliders
                    Configurar partialização      commitam apenas no
                    (excluir estado de UI) e      onPointerUp. Estado de UI
                    throttle de 500ms para edição (painéis abertos, seleção)
                    contínua. Expor               excluído do histórico.
                    useTemporalStore para         
                    undo/redo.                    

  PRÉ-3             Criar wrapper                 canvas com display: block.
  CanvasContainer   CanvasContainer.tsx com       Sem window.resize.
                    ResizeObserver no contêiner   ResizeObserver observa o
                    pai. Aplicar em               pai, não o canvas.
                    CenterCanvas.tsx substituindo 
                    qualquer listener global de   
                    resize.                       
  --------------------------------------------------------------------------

**Fase P0 --- Desbloquear Uso**

Só inicia após PRÉ-1 e PRÉ-2 concluídos. Entrega: engenheiro consegue
adicionar módulos, inversores e strings na interface.

  -------------------------------------------------------------------------------------------------------
  **Task**             **Origem**                             **Destino**      **Critério de aceite**
  -------------------- -------------------------------------- ---------------- --------------------------
  P0-1 ModuleInventory components/ModuleInventory.tsx         LeftOutliner --- Módulos aparecem como nós
  → Outliner                                                  nós da árvore    expansíveis. Botão \'+\'
                                                              BOS              abre ModuleCatalogDialog
                                                                               como overlay. CRUD
                                                                               funcional.

  P0-2                 components/InverterInventory.tsx       LeftOutliner --- Inversores como nós raiz.
  InverterInventory →                                         nós raiz com     Strings como filhos
  Outliner                                                    strings como     expansíveis. CRUD
                                                              filhos           funcional.

  P0-3                 components/StringConfigurator.tsx      LeftOutliner --- Lógica de tensão extraída
  StringConfigurator → components/StringConfiguratorRow.tsx   nós              para hook separado antes
  Outliner                                                    intermediários   de mover. Strings exibem
                                                                               módulos como nós filhos.

  P0-4 Formulários →   ModuleInventoryItem.tsx                RightInspector   Campos de edição inline no
  Inspector            InverterInventoryItem.tsx              --- modos module Inspector.
                       StringConfiguratorRow.tsx              / inverter /     InverterFilterPanel como
                       InverterFilterPanel.tsx                string           collapsible interno.
                                                                               Dialogs de catálogo
                                                                               preservados como overlay.
  -------------------------------------------------------------------------------------------------------

**Fase P1 --- Funcionalidade Essencial**

Só inicia após P0 concluído. zundo da fase PRÉ é obrigatório antes do
SystemLossesCard (primeiro formulário de edição paramétrica contínua).

  -----------------------------------------------------------------------------------------------
  **Task**           **Origem**                        **Destino**      **Critério de aceite**
  ------------------ --------------------------------- ---------------- -------------------------
  P1-1               components/SystemLossesCard.tsx   RightInspector   Perdas globais editáveis
  SystemLossesCard →                                   --- modo none    no Inspector. Container
  Inspector                                            (nada            Card externo removido.
                                                       selecionado)     Theme dark slate-900.
                                                                        Font 10-11px. Sliders
                                                                        commitam no onPointerUp.

  P1-2 StatusBars →  PVArrayStatusBar.tsx              TopRibbon ---    Widgets com max 180px
  Ribbon             InverterStatusBar.tsx             widgets          largura cada.
                     TechStatusBar.tsx                 compactos        Métricas-chave visíveis.
                                                                        Detalhes em tooltip
                                                                        expandível. TechStatusBar
                                                                        fragmentado --- apenas
                                                                        métricas globais migram.
  -----------------------------------------------------------------------------------------------

**Fase P2 --- Visualização de Valor**

Depende de dados do store. Com estado normalizado (PRÉ-1), os seletores
derivados são mais eficientes.

  ------------------------------------------------------------------------------------------------
  **Task**            **Origem**                         **Destino**       **Critério de aceite**
  ------------------- ---------------------------------- ----------------- -----------------------
  P2-1 Gráficos →     GenerationConsumptionChart.tsx     RightInspector    Gráficos visíveis
  Inspector           SimulationPreview.tsx              --- modo none     quando nenhum elemento
                      FDIDashboard.tsx                                     selecionado. Dados
                                                                           consumidos diretamente
                                                                           do store normalizado
                                                                           via seletores
                                                                           derivados.

  P2-2                components/VoltageRangeChart.tsx   CenterCanvas ---  Gráfico de tensão MPPT
  VoltageRangeChart →                                    overlay/tooltip   aparece ao hover sobre
  Canvas                                                                   string no Canvas.
                                                                           Requer CanvasContainer
                                                                           (PRÉ-3) já aplicado.
  ------------------------------------------------------------------------------------------------

**Fase P3 --- Polish**

Fluxo de aprovação e indicadores visuais de qualidade. Não bloqueia o
uso do sistema.

  ---------------------------------------------------------------------------------------------------
  **Task**       **Origem**                                 **Destino**    **Critério de aceite**
  -------------- ------------------------------------------ -------------- --------------------------
  P3-1 Aprovação Botão \'Aprovar Sistema\' (removido do     TopRibbon ---  Dropdown com opções de
  → Ribbon       header)                                    dropdown canto aprovação parcial e total.
                                                            direito        Estado de aprovação
                                                                           persistido no store.

  P3-2           components/SystemHealthCheck.tsx           TopRibbon ---  Ícone de semáforo
  HealthCheck →                                             ícone          (verde/amarelo/vermelho)
  Ribbon                                                    semáforo +     com popover de detalhes ao
                                                            popover        clicar.

  P3-3           components/EngineeringGuidelinePanel.tsx   TopRibbon ---  Tooltip contextual ativado
  Guidelines →                                              tooltip do     por botão \'?\' no Ribbon.
  Ribbon                                                    botão \'?\'    Conteúdo das diretrizes
                                                                           preservado.
  ---------------------------------------------------------------------------------------------------

**5. Regras de Refatoração por Componente**

Estas regras aplicam-se a todos os componentes migrados,
independentemente da fase.

  -----------------------------------------------------------------------
  **Regra**              **Descrição**
  ---------------------- ------------------------------------------------
  Nunca copiar a aba     Extrair apenas a lógica necessária. Remover
  inteira                containers externos (Card, TabPanel, etc.) e
                         adaptar ao contexto do painel destino.

  Dialogs mantêm-se como ModuleCatalogDialog e InverterCatalogDialog
  overlay                preservam o padrão de overlay. Apenas os campos
                         de edição inline se movem para o Inspector.

  Lógica de cálculo em   StringConfiguratorRow: isolar lógica de cálculo
  hooks                  de tensão MPPT em hook separado
                         (useMPPTCalculation) antes de mover para a
                         árvore do Outliner.

  Tabelas viram nós de   ModuleInventory e InverterInventory deixam de
  árvore                 ser tabelas CRUD e passam a nós hierárquicos no
                         LeftOutliner com o mesmo CRUD via ações de
                         contexto.

  Theme e tipografia do  Componentes para o RightInspector usam
  Inspector              background slate-900 e font-size 10-11px.
                         Remover qualquer padding externo --- o Inspector
                         já tem container próprio.

  Status widgets         StatusBars no TopRibbon extraem apenas
  compactos              métricas-chave (máx. 180px de largura cada).
                         Detalhes completos ficam em tooltip expandível
                         --- não na barra.

  InverterFilterPanel    Os filtros avançados do catálogo de inversores
  como collapsible       entram no Inspector como seção colapsável dentro
                         do modo \'inverter\' --- não como painel
                         separado.
  -----------------------------------------------------------------------

**6. Mapa Completo de Componentes Legados**

Todos os 20 componentes existentes no disco em components/ e tabs/.
Nenhum foi apagado --- todos estão disponíveis para migração.

**6.1 Aba Arranjo (PVArrayTab.tsx)**

  ----------------------------------------------------------------------------------------------------------------
  **Componente**               **Arquivo**                                 **Responsabilidade**   **Destino**
  ---------------------------- ------------------------------------------- ---------------------- ----------------
  PVArrayStatusBar             components/PVArrayStatusBar.tsx             Resumo: potência       TopRibbon --- P1
                                                                           total, nº módulos,     
                                                                           área                   

  ModuleInventory              components/ModuleInventory.tsx              Tabela CRUD de módulos LeftOutliner ---
                                                                           FV                     P0

  ModuleInventoryItem          components/ModuleInventoryItem.tsx          Linha individual do    RightInspector
                                                                           inventário             modo module ---
                                                                                                  P0

  ModuleCatalogDialog          components/ModuleCatalogDialog.tsx          Dialog de seleção do   Overlay
                                                                           catálogo               preservado ---
                                                                                                  P0

  GenerationConsumptionChart   components/GenerationConsumptionChart.tsx   Gráfico Geração vs     RightInspector
                                                                           Consumo (12 meses)     modo none --- P2

  SystemLossesCard             components/SystemLossesCard.tsx             Formulário de perdas   RightInspector
                                                                           do sistema             modo none --- P1
  ----------------------------------------------------------------------------------------------------------------

**6.2 Aba Inversores (InverterSystemTab.tsx)**

  ------------------------------------------------------------------------------------------------------
  **Componente**          **Arquivo**                            **Responsabilidade**   **Destino**
  ----------------------- -------------------------------------- ---------------------- ----------------
  InverterStatusBar       components/InverterStatusBar.tsx       Resumo: potência       TopRibbon --- P1
                                                                 CC/CA, ratio, strings  

  InverterInventory       components/InverterInventory.tsx       Tabela CRUD de         LeftOutliner ---
                                                                 inversores             P0

  InverterInventoryItem   components/InverterInventoryItem.tsx   Linha individual do    RightInspector
                                                                 inventário             modo inverter
                                                                                        --- P0

  InverterCatalogDialog   components/InverterCatalogDialog.tsx   Dialog de seleção do   Overlay
                                                                 catálogo               preservado ---
                                                                                        P0

  InverterFilterPanel     components/InverterFilterPanel.tsx     Filtros avançados do   RightInspector
                                                                 catálogo               collapsible ---
                                                                                        P0

  VoltageRangeChart       components/VoltageRangeChart.tsx       Gráfico de faixa de    CenterCanvas
                                                                 tensão MPPT            overlay --- P2

  StringConfigurator      components/StringConfigurator.tsx      Configurador de        LeftOutliner ---
                                                                 strings por inversor   P0

  StringConfiguratorRow   components/StringConfiguratorRow.tsx   Linha individual do    RightInspector
                                                                 configurador           modo string ---
                                                                                        P0
  ------------------------------------------------------------------------------------------------------

**6.3 Aba Geração (GenerationAnalysisTab.tsx)**

  ----------------------------------------------------------------------------------------------
  **Componente**      **Arquivo**                        **Responsabilidade**   **Destino**
  ------------------- ---------------------------------- ---------------------- ----------------
  SimulationPreview   components/SimulationPreview.tsx   Tabela de simulação    RightInspector
                                                         mensal                 modo none --- P2

  ----------------------------------------------------------------------------------------------

**6.4 Componentes adicionais (sem aba dedicada)**

  --------------------------------------------------------------------------------------------------------------
  **Componente**              **Arquivo**                                **Responsabilidade**   **Destino**
  --------------------------- ------------------------------------------ ---------------------- ----------------
  TechStatusBar               components/TechStatusBar.tsx               Barra de status global TopRibbon
                                                                         (12KB)                 fragmentado ---
                                                                                                P1

  SystemHealthCheck           components/SystemHealthCheck.tsx           Checklist de validação TopRibbon
                                                                         do sistema             semáforo --- P3

  EngineeringGuidelinePanel   components/EngineeringGuidelinePanel.tsx   Diretrizes de          TopRibbon
                                                                         engenharia             tooltip --- P3

  FDIDashboard                components/FDIDashboard.tsx                Dashboard de FDI       RightInspector
                                                                                                modo none --- P2

  CustomerTab                 tabs/CustomerTab.tsx                       Formulário do cliente  Fora do escopo
                                                                         (desplugado)           desta
                                                                                                refatoração
  --------------------------------------------------------------------------------------------------------------

Documento gerado em 22/03/2026. Baseado em: mapping_reintegration.md,
Relatorio_Completo_Mudancas.md,
Arquitetura_SaaS_Engenharia_WebGL_Profunda.docx,
relatorio_auditoria_tecnica.md.

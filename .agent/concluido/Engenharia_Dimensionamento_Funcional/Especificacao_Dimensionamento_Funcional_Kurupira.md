NEONORTE

**Kurupira --- Dimensionamento Funcional**

Especificação Técnica: De Vitrine a Ferramenta de Engenharia

Para uso exclusivo do engenheiro responsável pela implementação

  -----------------------------------------------------------------------
  **Campo**              **Valor**
  ---------------------- ------------------------------------------------
  Data                   22 de março de 2026

  Versão                 1.0

  Pré-requisitos         UX-001 concluído. GFX v2 concluído.
                         useTechStore.ts operacional.

  Auditoria base         Relatório de Auditoria Dimensionamento --- 15
                         perguntas, 22/03/2026

  Referência             Engenharia de Componentes Paramétricos e 3D
  arquitetural           (Neonorte)

  Desbloqueio crítico    StringInspector em write-mode + validação de
                         corrente MPPT

  Caminho para           P4 (BOS/Elétrico) e P5 (Financeiro/ROI)
  -----------------------------------------------------------------------

**1. Diagnóstico --- Estado Atual do Sistema**

A auditoria de 22/03/2026 mapeou o estado real de cada componente
relevante. O sistema atingiu o estágio de \'vitrine\': catálogos
acessíveis, mapa funcional, mas sem a capacidade de configurar strings
nos MPPTs --- o que torna todos os cálculos elétricos cegos.

  --------------------------------------------------------------------------
  **Componente**         **Estado auditado**                **Severidade**
  ---------------------- ---------------------------------- ----------------
  useTechStore.ts        Operacional. updateMPPTConfig()    Pronto --- sem
                         existe (linha 70). Estrutura       bloqueio
                         MPPTConfig com stringsCount,       
                         modulesPerString, azimuth,         
                         inclination.                       

  StringInspector        Somente leitura. PropRow estáticos Bloqueador
  (RightInspector.tsx)   sem callback onCommit. Linhas      principal
                         560-616.                           

  PropRowEditable        Existe e funcional (linhas         Pronto --- sem
                         640-693). Usado nos modos module e bloqueio
                         inverter. Reutilizável             
                         imediatamente.                     

  VoltageRangeChart      Calcula tensão via                 Parcial --- bug
                         calculateStringMetrics(). Dados    de temperatura
                         reais do store. Temperaturas       
                         hardcoded (0°C/70°C) --- diverge   
                         do HealthCheck que usa             
                         settings.minHistoricalTemp.        

  HealthCheckWidget      Regras FDI e Voc inline hardcoded. Incompleto
  (TopRibbon)            useTechKPIs() chamado mas sem      
                         desestruturação --- chamada        
                         fantasma. Sem validação de         
                         corrente. Sem cruzamento           
                         físico/lógico.                     

  Bootstrap de projeto   SolarDashboard.tsx sem useEffect   Ausente
  vazio                  de montagem. Detecção superficial  
                         via modules.length === 0.          
                         Catálogos disponíveis em           
                         modules.ts e inverters.ts.         

  Schemas de             Campos elétricos mapeados no       Parcial
  equipamentos           addModule (voc, vmp, isc, imp,     
                         tempCoeff). Sem schema Zod/TS      
                         unificado. Sem referência glTF.    
  --------------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **Ponto positivo --- o que não requer trabalho**                      |
|                                                                       |
| useTechStore.ts autônomo com updateMPPTConfig() pronto na linha 70.   |
|                                                                       |
| PropRowEditable reutilizável imediatamente --- não precisa ser criado |
| do zero.                                                              |
|                                                                       |
| Campos elétricos (voc, vmp, isc, imp, tempCoeff) já injetados no      |
| addModule do LeftOutliner.                                            |
|                                                                       |
| VoltageRangeChart com dados reais e calculateStringMetrics()          |
| funcional.                                                            |
|                                                                       |
| Catálogos MODULE_CATALOG\[0\] e INVERTER_CATALOG\[0\] disponíveis     |
| para bootstrap.                                                       |
+-----------------------------------------------------------------------+

**2. Ação 1 --- StringInspector em Write-Mode (Bloqueador Principal)**

Esta é a única ação que desbloqueia todos os cálculos elétricos
subsequentes. Sem ela, VoltageRangeChart, HealthCheck e BOS permanecem
cegos. Estimativa: modificação cirúrgica em arquivo existente.

**2.1 Localização e escopo da mudança**

  -------------------------------------------------------------------------
  **Item**           **Detalhe**
  ------------------ ------------------------------------------------------
  Arquivo            src/modules/engineering/ui/panels/RightInspector.tsx

  Trecho atual       Linhas 560-616 --- StringInspector com PropRow
                     estáticos (somente leitura)

  Componente         PropRowEditable (linhas 640-693 do mesmo arquivo) ---
  reutilizado        já tem blur/enter/escape

  Action alvo        updateMPPTConfig(inverterId: string, mpptId: number,
                     config: Partial\<MPPTConfig\>) --- linha 70 do
                     useTechStore.ts

  Campos a           modulesPerString, stringsCount, azimuth (0-360°),
  destrancar         inclination (0-90°)
  -------------------------------------------------------------------------

**2.2 Campos e actions**

  -----------------------------------------------------------------------------------------
  **Campo**        **Tipo**   **Limites**   **Action disparada**           **Observação**
  ---------------- ---------- ------------- ------------------------------ ----------------
  Módulos/String   number     1 -- 30       updateMPPTConfig(inverterId,   Determina Voc e
                                            mpptId, { modulesPerString })  Vmp da string

  Número de        number     1 -- 10       updateMPPTConfig(inverterId,   Determina Isc
  Strings                                   mpptId, { stringsCount })      total no MPPT

  Azimute por MPPT number     0 -- 360°     updateMPPTConfig(inverterId,   Campo opcional
                                            mpptId, { azimuth })           já existe no
                                                                           MPPTConfig

  Inclinação por   number     0 -- 90°      updateMPPTConfig(inverterId,   Campo opcional
  MPPT                                      mpptId, { inclination })       já existe no
                                                                           MPPTConfig
  -----------------------------------------------------------------------------------------

**2.3 Implementação**

Substituir os PropRow estáticos por PropRowEditable nos quatro campos. O
padrão de uso já existe nos modos module e inverter do mesmo arquivo ---
copiar o padrão exato.

> // RightInspector.tsx --- StringInspector (linhas 560-616)
>
> // ANTES (somente leitura):
>
> \<PropRow label=\'Módulos/String\' value={mppt.modulesPerString} /\>
>
> \<PropRow label=\'Nº de Strings\' value={mppt.stringsCount} /\>
>
> // DEPOIS (editável --- mesmo padrão das linhas 640-693):
>
> \<PropRowEditable
>
> label=\'Módulos/String\'
>
> value={mppt.modulesPerString}
>
> type=\'number\'
>
> min={1} max={30}
>
> onCommit={(val) =\>
>
> updateMPPTConfig(inverterId, mppt.mpptId, { modulesPerString:
> Number(val) })
>
> }
>
> /\>
>
> \<PropRowEditable
>
> label=\'Nº de Strings\'
>
> value={mppt.stringsCount}
>
> type=\'number\'
>
> min={1} max={10}
>
> onCommit={(val) =\>
>
> updateMPPTConfig(inverterId, mppt.mpptId, { stringsCount: Number(val)
> })
>
> }
>
> /\>
>
> \<PropRowEditable
>
> label=\'Azimute (°)\'
>
> value={mppt.azimuth ?? 180}
>
> type=\'number\'
>
> min={0} max={360}
>
> onCommit={(val) =\>
>
> updateMPPTConfig(inverterId, mppt.mpptId, { azimuth: Number(val) })
>
> }
>
> /\>
>
> \<PropRowEditable
>
> label=\'Inclinação (°)\'
>
> value={mppt.inclination ?? 0}
>
> type=\'number\'
>
> min={0} max={90}
>
> onCommit={(val) =\>
>
> updateMPPTConfig(inverterId, mppt.mpptId, { inclination: Number(val)
> })
>
> }
>
> /\>

+-----------------------------------------------------------------------+
| **Critérios de aceite --- Ação 1**                                    |
|                                                                       |
| Os quatro campos aceitam input numérico com blur/enter/escape ---     |
| mesmo comportamento dos modos module e inverter.                      |
|                                                                       |
| Alterar modulesPerString ou stringsCount atualiza imediatamente o     |
| VoltageRangeChart no CenterCanvas.                                    |
|                                                                       |
| Undo (Ctrl+Z) reverte a última edição --- updateMPPTConfig está no    |
| domínio parcializado do zundo.                                        |
|                                                                       |
| Campos azimuth e inclination aceitam valores decimais (ex: 22.5°).    |
|                                                                       |
| Limite min/max aplicado --- input fora do range não dispara a action. |
+-----------------------------------------------------------------------+

**3. Ação 2 --- Validação de Corrente e Correção de Temperatura**

Com o StringInspector editável, o VoltageRangeChart passa a refletir
dados reais. Dois problemas precisam ser resolvidos em sequência: o bug
de temperatura descoberto na auditoria e a ausência de validação de
corrente.

**3.1 Bug --- temperaturas hardcoded no VoltageRangeChart**

+-----------------------------------------------------------------------+
| **Inconsistência identificada na auditoria**                          |
|                                                                       |
| VoltageRangeChart usa minAmbientTemp: 0 e maxCellTemp: 70 fixos       |
| (linhas 48-49).                                                       |
|                                                                       |
| HealthCheckWidget lê settings.minHistoricalTemp das configurações do  |
| projeto (linha 287).                                                  |
|                                                                       |
| Efeito: o gráfico calcula Voc máximo com temperatura diferente do     |
| HealthCheck --- dois números divergentes para a mesma grandeza.       |
|                                                                       |
| Risco: o engenheiro pode aprovar um sistema que o HealthCheck         |
| reprovaria (ou vice-versa).                                           |
+-----------------------------------------------------------------------+

Correção: substituir os valores fixos por leitura do projectSlice (ou
engineeringSlice se já existir o campo de temperatura histórica).

> // VoltageRangeChart --- linhas 48-49 (ANTES):
>
> const minAmbientTemp = 0 // hardcoded
>
> const maxCellTemp = 70 // hardcoded
>
> // DEPOIS --- ler do store:
>
> const projectSettings = useSolarStore(s =\> s.project.settings)
>
> const minAmbientTemp = projectSettings?.minHistoricalTemp ?? 0
>
> const maxCellTemp = projectSettings?.maxCellTemp ?? 70

**3.2 Validação de corrente --- nova regra**

A auditoria confirmou que calculateStringMetrics() cobre apenas tensão.
A validação de corrente (Isc × stringsCount vs maxCurrentPerMPPT) é
inexistente e deve ser implementada.

  ---------------------------------------------------------------------------------
  **Opção**   **Onde              **Prós**        **Contras**     **Decisão**
              implementar**                                       
  ----------- ------------------- --------------- --------------- -----------------
  A           Barra de corrente   Visual          Aumenta a       Não recomendado
              no                  integrado,      complexidade do 
              VoltageRangeChart   contexto        gráfico --- já  
                                  imediato        lida só com     
                                                  tensão          

  B           Nova regra no       Arquitetura     Menos imediato  ADOTADO
              HealthCheckWidget   separada de     para o usuário  
              (TopRibbon)         validação,      no momento da   
                                  consistente com edição          
                                  FDI e Voc já                    
                                  existentes                      
  ---------------------------------------------------------------------------------

Implementação da regra de corrente no HealthCheckWidget:

> // TopRibbon.tsx --- HealthCheckWidget --- adicionar após regras
> existentes de FDI e Voc
>
> // Somar corrente total por MPPT de cada inversor
>
> const currentViolations =
> useTechStore.getState().inverters.ids.flatMap(invId =\> {
>
> const inv = useTechStore.getState().inverters.entities\[invId\]
>
> return inv.mpptConfigs.map(mppt =\> {
>
> const isc = selectedModule?.isc ?? 0
>
> const totalCurrent = isc \* mppt.stringsCount
>
> const maxCurrent = inv.spec.maxCurrentPerMPPT
>
> return totalCurrent \> maxCurrent
>
> ? \`MPPT \${mppt.mpptId}: \${totalCurrent.toFixed(1)}A \>
> \${maxCurrent}A máx.\`
>
> : null
>
> }).filter(Boolean)
>
> })
>
> // Adicionar ao semáforo:
>
> if (currentViolations.length \> 0) {
>
> alerts.push({ level: \'error\', message: currentViolations\[0\] })
>
> }

**3.3 Refatoração do HealthCheckWidget --- eliminar chamada fantasma**

A auditoria identificou que useTechKPIs() é chamado na linha 270 mas sem
desestruturação --- o retorno é descartado e a lógica é refeita inline.
Isso cria duplicidade e dificulta a adição de novas regras.

+-----------------------------------------------------------------------+
| **Refatoração recomendada (não bloqueante para P4)**                  |
|                                                                       |
| Mover a lógica de FDI, Voc e Corrente para um hook                    |
| useSystemValidation() dedicado.                                       |
|                                                                       |
| O HealthCheckWidget torna-se um display puro: recebe alerts\[\] e     |
| renderiza o semáforo.                                                 |
|                                                                       |
| Novas regras de validação (P4: BOS, P5: ROI) entram no hook sem tocar |
| no componente.                                                        |
|                                                                       |
| Esta refatoração não é bloqueante para P4 --- pode ser feita após as  |
| Ações 1-4.                                                            |
+-----------------------------------------------------------------------+

**4. Ação 3 --- Alerta de Inconsistência Físico/Lógico (HealthCheck)**

A auditoria confirmou que não existe nenhuma infraestrutura para
comparar módulos posicionados no mapa (contagem física) vs módulos
configurados nas strings (contagem lógica). Precisa ser construída do
zero cruzando dois stores.

**4.1 Fontes de dados**

  -----------------------------------------------------------------------------------------------------
  **Contagem**   **Store**       **Seletor**                                          **Descrição**
  -------------- --------------- ---------------------------------------------------- -----------------
  Física (mapa)  solarStore ---  solarStore.getState().project.placedModules.length   Módulos com
                 projectSlice                                                         polígono
                                                                                      desenhado no
                                                                                      CenterCanvas via
                                                                                      PLACE_MODULE

  Lógica         useTechStore    Σ(mppt.modulesPerString × mppt.stringsCount) por     Módulos
  (strings)                      inversor                                             configurados nas
                                                                                      strings dos MPPTs
  -----------------------------------------------------------------------------------------------------

**4.2 Implementação da regra**

> // TopRibbon.tsx --- HealthCheckWidget --- nova regra de cruzamento
>
> const physicalCount = useSolarStore(s =\>
> s.project.placedModules?.length ?? 0)
>
> const logicalCount = useTechStore(s =\>
>
> s.inverters.ids.reduce((total, invId) =\> {
>
> const inv = s.inverters.entities\[invId\]
>
> return total + inv.mpptConfigs.reduce((sum, mppt) =\>
>
> sum + (mppt.modulesPerString \* mppt.stringsCount), 0
>
> )
>
> }, 0)
>
> )
>
> // Regra: só alertar se ambos os lados têm dados (evitar falso
> positivo no projeto vazio)
>
> if (physicalCount \> 0 && logicalCount \> 0 && physicalCount !==
> logicalCount) {
>
> alerts.push({
>
> level: \'warning\',
>
> message: \`Módulos em planta (\${physicalCount}) diverge das strings
> (\${logicalCount})\`
>
> })
>
> }

+-----------------------------------------------------------------------+
| **Critérios de aceite --- Ação 3**                                    |
|                                                                       |
| Semáforo amarelo acende quando physicalCount !== logicalCount e ambos |
| \> 0.                                                                 |
|                                                                       |
| Tooltip do semáforo exibe a mensagem com os dois números.             |
|                                                                       |
| Nenhum alerta em projeto vazio (physicalCount === 0 e logicalCount    |
| === 0).                                                               |
|                                                                       |
| Alerta desaparece ao corrigir a divergência em qualquer direção       |
| (adicionar módulos no mapa ou ajustar strings).                       |
+-----------------------------------------------------------------------+

**5. Ação 4 --- Bootstrap de Projeto Vazio**

A auditoria confirmou que SolarDashboard.tsx não tem useEffect de
montagem e os catálogos MODULE_CATALOG\[0\] e INVERTER_CATALOG\[0\]
estão disponíveis. A implementação é direta.

**5.1 Implementação**

> // SolarDashboard.tsx (ou WorkspaceLayout.tsx --- ponto de entrada do
> Workspace)
>
> import { MODULE_CATALOG } from \'@/data/equipment/modules\'
>
> import { INVERTER_CATALOG } from
> \'@/modules/engineering/constants/inverters\'
>
> const hasBootstrapped = useRef(false)
>
> useEffect(() =\> {
>
> const moduleCount = useSolarStore.getState().modules.ids.length
>
> const inverterCount = useTechStore.getState().inverters.ids.length
>
> if (moduleCount === 0 && inverterCount === 0 &&
> !hasBootstrapped.current) {
>
> hasBootstrapped.current = true
>
> useSolarStore.getState().addModule(MODULE_CATALOG\[0\])
>
> useTechStore.getState().addInverter(INVERTER_CATALOG\[0\])
>
> }
>
> }, \[\]) // \[\] garante execução apenas na montagem

+-----------------------------------------------------------------------+
| **Guardrail obrigatório --- useRef**                                  |
|                                                                       |
| O useRef(false) impede que re-renders do componente pai disparem a    |
| injeção múltiplas vezes.                                              |
|                                                                       |
| A checagem dupla (moduleCount === 0 && inverterCount === 0) garante   |
| que projetos já populados não sejam sobrescritos.                     |
|                                                                       |
| O bootstrap não entra no histórico do zundo --- é estado inicial, não |
| ação do usuário.                                                      |
|                                                                       |
| Se o usuário deletar o módulo/inversor default e recarregar a página, |
| o bootstrap dispara novamente --- comportamento correto.              |
+-----------------------------------------------------------------------+

**6. Ação 5 --- Biblioteca de Componentes Paramétricos**

A especificação de arquitetura do Neonorte estabelece que cada objeto do
sistema deve transcender sua representação geométrica: ele é uma
instância de dados físicos, elétricos e térmicos. Esta ação cria a
biblioteca de componentes paramétricos que alimenta simultaneamente o
motor de cálculo elétrico (useTechStore), o layout 2D (Leaflet) e a
futura visualização 3D (React Three Fiber/glTF). O ponto de partida são
inversores e módulos FV --- os dois tipos que já têm catálogos parciais
no código e são usados diretamente pela Ação 1.

+-----------------------------------------------------------------------+
| **As três camadas de cada componente paramétrico**                    |
|                                                                       |
| Elétrica/Térmica --- Voc, Vmp, Isc, Imp, tempCoeffVoc, limites MPPT.  |
| Alimenta calculateStringMetrics() e as validações do HealthCheck.     |
|                                                                       |
| Física --- dimensões em mm, peso, tipo de moldura. Alimenta           |
| calcModulePolygon() no PLACE_MODULE e a renderização Leaflet.         |
|                                                                       |
| 3D/glTF --- referência ao arquivo .glb e mapeamento de texturas.      |
| Alimenta o viewport R3F e o raycasting via EXT_structural_metadata.   |
+-----------------------------------------------------------------------+

**6.1 Princípio --- geometria como consequência da função**

No Neonorte, um componente 3D sem validação elétrica é puramente
cosmético. A sequência correta é: (1) o engenheiro configura os
parâmetros elétricos no RightInspector; (2) o sistema valida a
conformidade via useTechStore; (3) a geometria 2D e 3D é renderizada
como consequência do estado validado. Nunca o inverso.

**6.2 Schema do módulo FV --- ModuleCatalogItem**

O schema Zod unifica as três camadas em um único tipo. Os catálogos
existentes em src/data/equipment/modules.ts são atualizados para
conformidade --- campos faltantes ficam como optional até estarem
disponíveis.

> // src/data/equipment/moduleSchema.ts
>
> import { z } from \'zod\'
>
> // Camada 1 --- elétrica (obrigatória para calculateStringMetrics)
>
> export const ModuleElectricalSchema = z.object({
>
> pmax: z.number(), // Wp --- potência nominal
>
> voc: z.number(), // V --- tensão circuito aberto (STC)
>
> vmp: z.number(), // V --- tensão máxima potência (STC)
>
> isc: z.number(), // A --- corrente curto-circuito (STC)
>
> imp: z.number(), // A --- corrente máxima potência (STC)
>
> tempCoeffVoc: z.number(), // %/°C --- coef. temperatura Voc
>
> tempCoeffPmax: z.number().optional(),
>
> maxFuseRating: z.number().optional(), // A --- fusível máximo série
>
> })
>
> // Camada 2 --- física (obrigatória para PLACE_MODULE e layout
> Leaflet)
>
> export const ModulePhysicalSchema = z.object({
>
> widthMm: z.number(), // mm
>
> heightMm: z.number(), // mm
>
> depthMm: z.number(), // mm
>
> weightKg: z.number(),
>
> frameType: z.enum(\[\'aluminum\', \'frameless\'\]).optional(),
>
> })
>
> // Camada 3 --- 3D/glTF (optional até fase R3F)
>
> export const ModuleAssetSchema = z.object({
>
> glbAsset: z.string().optional(), //
> \'/assets/3d/canadian-hiku6-550w.glb\'
>
> featureId: z.string().optional(), // ID para EXT_structural_metadata
>
> })
>
> // Schema unificado
>
> export const ModuleCatalogItemSchema = z.object({
>
> id: z.string(), // slug: \'canadian-hiku6-cs6r-550ms\'
>
> manufacturer: z.string(),
>
> model: z.string(),
>
> electrical: ModuleElectricalSchema,
>
> physical: ModulePhysicalSchema,
>
> asset: ModuleAssetSchema.optional(),
>
> })
>
> export type ModuleCatalogItem = z.infer\<typeof
> ModuleCatalogItemSchema\>

**6.3 Schema do inversor --- InverterCatalogItem**

O schema do inversor é centrado nos MPPTs --- cada MPPT é um objeto
independente com seus próprios limites elétricos. É exatamente o que
alimenta a Ação 1 (StringInspector) e as validações de tensão e corrente
da Ação 2.

> // src/data/equipment/inverterSchema.ts
>
> import { z } from \'zod\'
>
> export const MPPTSpecSchema = z.object({
>
> mpptId: z.number(), // 1-based
>
> maxInputVoltage: z.number(), // V --- tensão máxima absoluta
>
> minMpptVoltage: z.number(), // V --- piso da faixa MPPT
>
> maxMpptVoltage: z.number(), // V --- teto da faixa MPPT
>
> maxCurrentPerMPPT: z.number(), // A --- corrente máxima por MPPT
>
> stringsAllowed: z.number(), // nº máximo de strings em paralelo
>
> })
>
> export const InverterCatalogItemSchema = z.object({
>
> id: z.string(), // slug: \'growatt-min-5000tl-x\'
>
> manufacturer: z.string(),
>
> model: z.string(),
>
> nominalPowerW: z.number(), // W --- potência nominal CA
>
> maxDCPowerW: z.number(), // W --- potência máxima CC
>
> mppts: z.array(MPPTSpecSchema).min(1),
>
> efficiency: z.object({
>
> euro: z.number().optional(), // %
>
> cec: z.number().optional(), // %
>
> }).optional(),
>
> asset: z.object({
>
> glbAsset: z.string().optional(),
>
> featureId: z.string().optional(),
>
> }).optional(),
>
> })
>
> export type InverterCatalogItem = z.infer\<typeof
> InverterCatalogItemSchema\>

**6.4 Catálogo inicial --- módulo e inversor default**

Os dois primeiros itens da biblioteca usam dados elétricos reais --- não
placeholders. São os equipamentos que o Bootstrap (Ação 4) injeta em
projetos novos e que alimentam calculateStringMetrics() desde o primeiro
uso.

> // src/data/equipment/modules.ts
>
> import { ModuleCatalogItemSchema } from \'./moduleSchema\'
>
> export const MODULE_CATALOG = \[
>
> ModuleCatalogItemSchema.parse({
>
> id: \'canadian-hiku6-cs6r-550ms\',
>
> manufacturer: \'Canadian Solar\',
>
> model: \'HiKu6 CS6R-550MS\',
>
> electrical: {
>
> pmax: 550, voc: 49.3, vmp: 41.8,
>
> isc: 13.97, imp: 13.16,
>
> tempCoeffVoc: -0.0027, // -0.27%/°C
>
> tempCoeffPmax: -0.0034, // -0.34%/°C
>
> maxFuseRating: 30,
>
> },
>
> physical: {
>
> widthMm: 1134, heightMm: 2278, depthMm: 35,
>
> weightKg: 28.5, frameType: \'aluminum\',
>
> },
>
> // asset.glbAsset preenchido quando o modelo 3D for gerado
>
> }),
>
> \]
>
> // src/modules/engineering/constants/inverters.ts
>
> import { InverterCatalogItemSchema } from
> \'@/data/equipment/inverterSchema\'
>
> export const INVERTER_CATALOG = \[
>
> InverterCatalogItemSchema.parse({
>
> id: \'growatt-min-5000tl-x\',
>
> manufacturer: \'Growatt\', model: \'MIN 5000TL-X\',
>
> nominalPowerW: 5000, maxDCPowerW: 6500,
>
> mppts: \[{
>
> mpptId: 1,
>
> maxInputVoltage: 600, minMpptVoltage: 80, maxMpptVoltage: 560,
>
> maxCurrentPerMPPT: 12.5, stringsAllowed: 2,
>
> }\],
>
> efficiency: { euro: 97.6 },
>
> }),
>
> \]

**Módulo PHB --- JA Solar JAM66D45-605/LB**

Comercializado pela PHB Solar. N-type bifacial 605Wp, certificado
INMETRO. Dados STC direto do site PHB.

> // src/data/equipment/modules.ts --- adicionar ao MODULE_CATALOG
>
> ModuleCatalogItemSchema.parse({
>
> id: \'ja-solar-jam66d45-605lb\',
>
> manufacturer: \'JA Solar\',
>
> model: \'JAM66D45-605/LB\',
>
> electrical: {
>
> pmax: 605,
>
> voc: 47.90, // V
>
> vmp: 39.60, // V
>
> isc: 16.00, // A
>
> imp: 15.28, // A
>
> tempCoeffVoc: -0.0028, // -0.28%/°C (típico N-type TopCon)
>
> tempCoeffPmax:-0.0030, // -0.30%/°C
>
> maxFuseRating: 30,
>
> },
>
> physical: {
>
> widthMm: 1134,
>
> heightMm: 2382,
>
> depthMm: 35,
>
> weightKg: 31.5,
>
> frameType: \'aluminum\',
>
> },
>
> // asset.glbAsset: preencher quando modelo 3D for gerado
>
> }),

**Inversores PHB --- PHB5000D-WS e PHB6000D-WS (AFCI)**

Inversores monofásicos 220V da linha D-WS com AFCI integrado.
Certificados INMETRO. 2 strings / 2 MPPTs independentes. Dados direto do
site PHB Solar.

> // src/modules/engineering/constants/inverters.ts --- adicionar ao
> INVERTER_CATALOG
>
> // PHB 5kW --- PHB5000D-WS (AFCI)
>
> InverterCatalogItemSchema.parse({
>
> id: \'phb-5000d-ws\',
>
> manufacturer: \'PHB Solar\',
>
> model: \'PHB5000D-WS (AFCI)\',
>
> nominalPowerW: 5000,
>
> maxDCPowerW: 6500, // estimado --- 1.3× nominal (prática PHB)
>
> mppts: \[
>
> {
>
> mpptId: 1,
>
> maxInputVoltage: 600, // V
>
> minMpptVoltage: 40, // V
>
> maxMpptVoltage: 560, // V
>
> maxCurrentPerMPPT: 16, // A (16A/16A conforme datasheet)
>
> stringsAllowed: 1,
>
> },
>
> {
>
> mpptId: 2,
>
> maxInputVoltage: 600,
>
> minMpptVoltage: 40,
>
> maxMpptVoltage: 560,
>
> maxCurrentPerMPPT: 16,
>
> stringsAllowed: 1,
>
> },
>
> \],
>
> efficiency: { euro: 97.9 },
>
> // INMETRO: registro em andamento --- verificar atualização
>
> }),
>
> // PHB 6kW --- PHB6000D-WS (AFCI)
>
> InverterCatalogItemSchema.parse({
>
> id: \'phb-6000d-ws\',
>
> manufacturer: \'PHB Solar\',
>
> model: \'PHB6000D-WS (AFCI)\',
>
> nominalPowerW: 6000,
>
> maxDCPowerW: 7800, // estimado --- 1.3× nominal
>
> mppts: \[
>
> {
>
> mpptId: 1,
>
> maxInputVoltage: 600,
>
> minMpptVoltage: 40,
>
> maxMpptVoltage: 560,
>
> maxCurrentPerMPPT: 16,
>
> stringsAllowed: 1,
>
> },
>
> {
>
> mpptId: 2,
>
> maxInputVoltage: 600,
>
> minMpptVoltage: 40,
>
> maxMpptVoltage: 560,
>
> maxCurrentPerMPPT: 16,
>
> stringsAllowed: 1,
>
> },
>
> \],
>
> efficiency: { euro: 97.9 },
>
> }),

**6.5 Convenção de IDs e integração com EXT_structural_metadata**

IDs dos equipamentos devem usar slugs legíveis no formato
fabricante-modelo-variante (ex: canadian-hiku6-cs6r-550ms). Esta decisão
deve ser tomada antes de qualquer modelo glTF ser gerado --- o campo
asset.featureId de cada item deve ser idêntico ao FeatureID declarado no
EXT_structural_metadata do modelo 3D correspondente. Mudar a convenção
após os modelos estarem prontos exige reedição dos binários .glb.

  ---------------------------------------------------------------------------------------------
  **Campo**         **No catálogo/store**         **No glTF                     **Uso**
                                                  (EXT_structural_metadata)**   
  ----------------- ----------------------------- ----------------------------- ---------------
  id do módulo      ModuleCatalogItem.id          FeatureID no mesh do módulo   Raycasting 3D:
                                                                                click → lookup
                                                                                no store sem
                                                                                conversão

  id do inversor    InverterCatalogItem.id        FeatureID no mesh do inversor Raycasting 3D:
                                                                                click → limites
                                                                                MPPT no
                                                                                Inspector

  asset.featureId   ModuleAssetSchema.featureId   Mapeamento explícito id →     Quando id e
                                                  FeatureID                     FeatureID
                                                                                divergem ---
                                                                                campo de bridge
  ---------------------------------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **Critérios de aceite --- Ação 5**                                    |
|                                                                       |
| MODULE_CATALOG\[0\] e INVERTER_CATALOG\[0\] validados por z.parse()   |
| sem erros TypeScript.                                                 |
|                                                                       |
| addModule no LeftOutliner.tsx usa ModuleCatalogItem tipado --- sem    |
| acesso via catalogItem.electrical?.pmax.                              |
|                                                                       |
| calculateStringMetrics() recebe voc, vmp, isc, imp do catálogo sem    |
| conversão manual.                                                     |
|                                                                       |
| IDs em slug legível. Convenção documentada no README de               |
| src/data/equipment/.                                                  |
|                                                                       |
| Campos asset.glbAsset e asset.featureId opcionais --- ausência não    |
| quebra o build.                                                       |
|                                                                       |
| Bootstrap (Ação 4) injeta MODULE_CATALOG\[0\] e INVERTER_CATALOG\[0\] |
| com dados elétricos reais.                                            |
+-----------------------------------------------------------------------+

**7. Plano de Execução --- Prioridade e Sequência**

A sequência foi definida pela especificação v2.0 revisada após
auditoria. As Ações 1 e 4 são independentes e podem ser feitas em
paralelo. A Ação 2 depende da Ação 1 estar concluída para validar com
dados reais.

  --------------------------------------------------------------------------------------------------------------------
  **Prioridade**   **Ação**          **Arquivo(s)**          **Dependência**              **Critério de conclusão**
  ---------------- ----------------- ----------------------- ---------------------------- ----------------------------
  1 --- Imediata   Ação 1:           RightInspector.tsx      Nenhuma                      PropRowEditable nos 4
                   StringInspector   (linhas 560-616)                                     campos. updateMPPTConfig
                   em write-mode                                                          dispara ao confirmar input.

  2 --- Imediata   Ação 4: Bootstrap SolarDashboard.tsx ou   Nenhuma                      Projeto vazio abre com 1
                   de projeto vazio  WorkspaceLayout.tsx                                  módulo e 1 inversor default.
                                                                                          useRef previne duplicação.

  3 --- Após Ação  Ação 2a: Correção VoltageRangeChart.tsx   Ação 1 concluída             VoltageRangeChart usa
  1                de temperatura    (linhas 48-49)                                       settings.minHistoricalTemp
                   hardcoded                                                              do store. Mesma temperatura
                                                                                          que o HealthCheck.

  4 --- Após Ação  Ação 2b:          TopRibbon.tsx ---       Ação 1 concluída             Semáforo vermelho quando Isc
  1                Validação de      HealthCheckWidget                                    × stringsCount \>
                   corrente no                                                            maxCurrentPerMPPT.
                   HealthCheck                                                            

  5 --- Após Ação  Ação 3:           TopRibbon.tsx ---       Ação 1 +                     Semáforo amarelo quando
  1                Cruzamento        HealthCheckWidget       projectSlice.placedModules   contagem física ≠ lógica.
                   físico/lógico                                                          

  6 --- Paralela   Ação 5: Schemas   src/data/equipment/     Nenhuma                      MODULE_CATALOG e
                   Zod               (novos arquivos)                                     INVERTER_CATALOG validados
                                                                                          por Zod. TypeScript sem any.

  7 --- Após P4    Refatoração       TopRibbon.tsx           P4 definido                  useSystemValidation() hook
                   HealthCheck                                                            isolado. HealthCheckWidget
                                                                                          como display puro.
  --------------------------------------------------------------------------------------------------------------------

**8. O que se Desbloqueia --- Caminho para P4 e P5**

Cada ação deste documento remove um bloqueio específico para os módulos
subsequentes. A tabela abaixo mapeia a dependência direta.

  -----------------------------------------------------------------------
  **Ação concluída** **Desbloqueia em P4        **Desbloqueia em P5
                     (BOS/Elétrico)**           (Financeiro)**
  ------------------ -------------------------- -------------------------
  Ação 1 --- Strings Contagem exata de Isc e    CapEx de cabos calculável
  editáveis          Voc por MPPT →             (metro × bitola × preço)
                     dimensionamento de         
                     disjuntores e bitola de    
                     cabo                       

  Ação 2 ---         String Box dimensionado    Custo de proteção
  Validação de       com corrente real por MPPT elétrica no orçamento
  corrente                                      

  Ação 3 ---         Garantia de que BOS é      ROI calculado com CapEx
  Cruzamento         gerado com geometria       físico real, não estimado
  físico/lógico      consistente                

  Ação 4 ---         Engenheiro começa P4 com   Aceleração do fluxo de
  Bootstrap          inversores e módulos já    orçamento
                     configurados               

  Ação 5 --- Schemas Catálogo tipado alimenta   Preços e margens
  Zod                cálculo de BOS sem         vinculados ao schema do
                     conversões manuais         equipamento
  -----------------------------------------------------------------------

Documento v1.0 gerado em 22/03/2026. Baseado em:
Especificacao_Engenharia_Funcional.md v2.0,
Relatorio_Auditoria_Dimensionamento.md, Engenharia de Componentes
Paramétricos e 3D.md.

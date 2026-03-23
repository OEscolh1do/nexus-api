# Auditoria Analítica: Dimensionamento Funcional (Kurupira)

**Versão:** 2.0 — Revisada após meta-auditoria (22/03/2026)

*Data: 22/03/2026* | *Escopo: Respostas às 15 perguntas da auditoria de viabilidade.*

---

## Bloco 1 — Estado do useTechStore / solarStore

1. **Sobre o Store:** O `useTechStore.ts` **existe como um store autônomo** e independente utilizando Zustand. A lógica de Inversores e Configurações MPPT vive separada lá dentro para gerenciar o domínio técnico com as perdas físicas, sem poluir o `solarStore`.
2. **Actions MPPT:** ✅ **Sim, a action principal já existe**. A assinatura é `updateMPPTConfig: (inverterId: string, mpptId: number, config: Partial<MPPTConfig>) => void` (linha 70). Também já existe um gerador `createDefaultMPPTConfig` (linhas 96-102).
3. **Estrutura de Dados:** ✅ **Sim**. Todo inversor (`InverterState`) contém obrigatoriamente um array `mpptConfigs` do tipo `MPPTConfig[]` que possui `mpptId`, `stringsCount`, `modulesPerString` (linhas 17-23). Há campos opcionais `azimuth` e `inclination` por MPPT.
4. **Campos Elétricos:** ✅ **Sim**. Quando um módulo é injetado via `LeftOutliner.tsx` (linhas 72-98), o handler `handleAddModule` mapeia campo a campo do objeto TypeScript estático do catálogo (`catalogItem.electrical?.pmax`, `catalogItem.electrical?.imp`, etc.) e cadastra no Node: `vmp`, `imp`, `voc`, `isc`, `tempCoeff` e `maxFuseRating`.

---

## Bloco 2 — Estado do RightInspector / StringInspector

1. **Arquitetura do Componente:** O `StringInspector` existe como um **sub-componente encapsulado** nativamente isolado no arquivo `RightInspector.tsx` (linhas 560-616).
2. **Estado do Modo String:** 🔴 **Somente Leitura Puro.** No momento presente, ele apenas extrai o estado e repassa para visualização textual engessada através do wrapper `PropRow`. Não há nenhum trigger de alteração nem callback `onCommit`.
3. **Reutilização de UI Editável:** ✅ **Existe e está funcional.** O componente `PropRowEditable` (linhas 640-693) já lida com eventos Blur/Enter/Escape e é adotado para alterar "Quantidades" nos modos Module e Inverter. **Pode ser reutilizado instantaneamente** nos slots MPPT dispensando construção do zero.

---

## Bloco 3 — Estado do VoltageRangeChart

1. **Qualidade dos Dados:** ✅ **Reais**. O componente processa diretamente o `selectedModule` e itera sobre o `useTechStore`, importando teto e piso de tensão definidos no `INVERTER_CATALOG` (`spec.minMpptVoltage`, `spec.maxMpptVoltage`, `spec.maxInputVoltage`).
2. **Motor Lógico:** ✅ **Calcula tensões integralmente.** O componente evoca `calculateStringMetrics()` de `electricalMath.ts`.

> [!WARNING]
> **Temperaturas hardcoded.** O `VoltageRangeChart` usa `minAmbientTemp: 0` e `maxCellTemp: 70` fixos (linhas 48-49), enquanto o `HealthCheckWidget` no `TopRibbon.tsx` lê `settings.minHistoricalTemp` das configurações do projeto (linha 287). Há uma **inconsistência** entre os dois cálculos de Voc — o gráfico não reflete a temperatura real do projeto.

3. **HUD/Renderização:** ✅ O tooltip flutua com animação CSS `slide-in-from-bottom-4` declarada no `CenterCanvas.tsx` (linha 56), ativada condicionalmente quando `selectedEntity.type === 'string'`. A renderização é DOM/SVG via Leaflet (não WebGL/GPU).

---

## Bloco 4 — Estado do HealthCheck no TopRibbon

1. **Arquitetura de Regras:** 🟠 **Hardcoded.** A lógica do `HealthCheckWidget` (TopRibbon.tsx, linhas 267-346) calcula FDI e Voc **inline** no próprio componente usando `selectModules` e `selectInverters` do `solarStore`.

> [!NOTE]
> O componente chama `useTechKPIs()` na linha 270, mas **sem desestruturar o retorno** — é uma chamada "fantasma" que não alimenta nenhum cálculo local. Toda a lógica de FDI e Voc Max é refeita manualmente dentro do widget. Para escalar validações futuras, seria melhor um validador de sistema isolado.

2. **Validação Físico/Lógico:** 🔴 **Inexistente.** Não existe nenhum loop verificando a diferença entre módulos posicionados fisicamente no mapa (`placedModules` do `projectSlice`) vs módulos configurados logicamente (`Σ(mppt.modulesPerString × mppt.stringsCount)` do `useTechStore`). Precisa ser construído do zero cruzando dados de dois stores distintos.

---

## Bloco 5 — Bootstrap de equipamentos default

1. **Entrada Silenciosa:** 🔴 Não tem entrada ativa. O `SolarDashboard.tsx` gerencia a hierarquia via `activeTab` mas carece de um ciclo de montagem (`useEffect`) para despachar actions iniciais ao detectar projeto vazio.
2. **Isolamento "Vazio":** 🟠 A camada avalia superficialmente o estado exibindo visuais empobrecidos em blocos que testam `modules.length === 0`.
3. **Dados Constantes Catálogo:** ✅ Os dados base estão organizados nos arquivos: `src/data/equipment/modules.ts` e `src/modules/engineering/constants/inverters.ts`, permitindo captura via referência direta (`MODULE_CATALOG[0]`, `INVERTER_CATALOG[0]`).

---

## Errata v2.0 (Correções da Meta-Auditoria)

| # | Bloco | Correção Aplicada |
|:---|:---|:---|
| E1 | 1.4 | Removida referência a "catálogo json raiz". A injeção é feita via mapeamento campo a campo de objeto TypeScript estático, não JSON parseado. |
| E2 | 3.2 | Adicionado alerta `[!WARNING]` sobre temperaturas hardcoded (0°C e 70°C) no `VoltageRangeChart` vs `settings.minHistoricalTemp` no HealthCheck. |
| E3 | 3.3 | Corrigida terminologia: o Kurupira usa Leaflet DOM/SVG, não "thread gráfica WebGL". |
| E4 | 4.1 | Explicitado que `useTechKPIs()` é chamada fantasma sem desestruturação — a lógica real é inline. |

# Spec: PhysicalCockpit (Diagramas & Anatomia)
**Tipo:** Refatorao Técnica / Rigor de Engenharia  
**Skill responsvel pela implementao:** `the-builder` / `design-lead`  
**Revisor de aceitao:** `engenheiro-eletricista-pv`  
**Prioridade:** P1  
**Origem:** Refinamento da Jornada do Integrador - Sessao 2026-04-19

---

## Problema
A view atual de Arranjo Fsico (`MapCore`) limita-se  representao geográfica de mdulos. Um engenheiro projetista real precisa validar a **lógica de conexo** (Diagrama de Blocos) e o **esquemtico unifilar** preliminar antes de selecionar o inversor, garantindo que o layout fsico  compatível com as MPPTs necessrias. Além disso, a escolha do suporte (BOS Mecnico) carece de feedback visual anatmico, induzindo a erros de especificao.

## Soluo Técnica

### 1. Sistema de Camadas (Multilayer Canvas)
Implementar um seletor de estado de renderizao que altera o overlay do canvas:
- **Layer Fsica**: Snapshot atual (Módulos reais 1:1).
- **Layer Blocos**: Renderiza polgonos translparentes sobre as strings, agrupando módulos por orientao e indicando o "Caminho Lógico" até o ponto de inverso. 
- **Layer Unifilar**: Substitui os mdulos por smbolos normalizados (NBR 16274) e linhas de circuito, mostrando a topologia String -> Inversor.

### 2. Mini-View Anatmica de Estruturas
Componente `StructureAnatomyPreview` que:
-  ativado ao clicar em uma rea de instalao.
- Exibe um croqui tcnico (SVG ou Three.js) demonstrando como o suporte selecionado (Gancho, Trilho, Grampo) se fixa  superfcie (Telha Cermica, Fibrocimento).
- Muda dinamicamente conforme a `surfaceType`  alterada.

### 3. Banco de Fotos Opcional
Integrao de um container de mídia no Painel Lateral para referncia visual do sítio, sem acoplamento com fluxos de verificao de campo (exclusivo para o projetista).

## Arquivos Afetados

### Modificar
- `[MODIFY] PhysicalCanvas.tsx` (Antigo `MapCore.tsx`) — Lógica de camadas.
- `[MODIFY] projectSlice.ts` — Adio de metadados de fotos e seleo de kit de estrutura.
- `[MODIFY] useTechStore.ts` — Mapeamento de kits de fixao por `surfaceType`.

### Novo
- `[NEW] StructureAnatomyPreview.tsx` — Painel de anatomia estrutural.
- `[NEW] BlockDiagramOverlay.tsx` — Renderizao de lógica de strings.
- `[NEW] UnifilarSymbolLibrary.tsx` — Biblioteca de smbolos para a layer unifilar.

## Critérios de Aceitao
- [ ] O usurio consegue alternar entre as 3 camadas (Fsico, Blocos, Unifilar) sem latncia perceptível.
- [ ] A alterao de `surfaceType` atualiza instantaneamente a anatomia sugerida.
- [ ] Os smbolos unifilares seguem a NBR 16274.
- [ ] `tsc --noEmit` → EXIT CODE 0
- [ ] Eng. Vtor Ramos valida que a camada de Blocos ajuda na deciso do Inversor (MPPTs visveis).

## Referncias Normativas
- ABNT NBR 16690:2019 (Arranjos Fotovoltaicos)
- ABNT NBR 16274:2014 (Documentao e Comissionamento)

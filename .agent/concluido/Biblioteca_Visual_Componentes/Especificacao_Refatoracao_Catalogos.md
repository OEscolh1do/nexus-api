# Especificação Técnica: Refatoração dos Catálogos (Biblioteca Visual 3D/2D)

**Status:** Aprovado (Revisão Arquitetural R2)
**Escopo:** `ModuleCatalogDialog.tsx`, `InverterCatalogDialog.tsx` e Repositórios
**Arquitetura:** SaaS Engenharia WebGL Profunda / Componentes Paramétricos

---

## 1. Problema e Objetivo
Atualmente, os catálogos de componentes estão vazios e utilizavam uma abordagem insegura de listas estáticas no UI. A intenção primária de convertê-los em uma "Grelha de Cards com Previews 3D" incorreu em graves infrações arquiteturais (estouro de limites de contexto da GPU, interações bloqueantes no DOM e poluição de memória no Zundo).

Esta especificação aborda a reintegração dos catálogos sob a rigidez da **Engenharia de Haute Performance**, garantindo que inversores e placas fotovoltaicas sejam tratados como entidades físicas híbridas (Leaflet-first e WebGL-ready) sem derreter o navegador do engenheiro.

---

## 2. Refatoração Lógica: Fluxo de Dados e Memória (Zustand + Jotai)

### 2.1 Padronização Atômica Paramétrica
Os esquemas base (`ModuleSpecs` e `InverterSpecs`) devem ser expandidos para incorporar metadados de fronteira:
- **Footprint 2D (Leaflet):** Além das dimensões brutas físicas (`dimensions`), os módulos precisam expor atritutos vetorizados rápidos (ex: `bounding_box_svg`, zona de refração e sobreposição) para instanciar polígonos perfeitos no mapa *antes* da simulação volumétrica.
- **Raycast Metadata (WebGL):** Os modelos `.glb` associados deverão carregar a extensão `EXT_structural_metadata` para alimentar o `RightInspector` diretamente da malha 3D.

### 2.2 Isolamento Temporal (Zundo Partialization)
Carregar centenas de itens de catálogo do `InMemoryEquipmentRepo` no `solarStore` ou num `useTechStore` geral envenena a pilha do **Undo/Redo** se não houver isolamento.
- **Diretriz:** O repositório de catálogo `catalogState` e seus filtros (`activeFilters`) devem residir em uma "fatia" (slice) ou store isolado que seja explicitamente ignorado pela serialização do histórico de edições (usando `partialize` hook do Zundo). O histórico ("Desfazer") só deve registrar a ação transacional final de "Adição do Modelo X no Projeto", mas *nunca* as navegações pelo catálogo.

---

## 3. Gestão de Renderização: O Colapso da GPU

A promessa de "Card WebGL Previews" deve obedecer ao limite físico de rendering passivo. Adicionar 50 tags `<Canvas>` numa janela mata a aba.

### 3.1 Grelha Virtualizada WebGL (Scissor Testing)
- **Solução Visual Híbrida:** O catálogo continuará sendo uma Grelha (`Grid`). Contudo, se optarmos por exibir modelos `.glb` reais em miniatura, utilizaremos o componente `<View>` do `@react-three/drei`.
- Esta abordagem aloca um **ÚNICO** `<Canvas>` mestre e global, rastreando estaticamente a janela, enquanto injeta magicamente os sub-cenários em pequenas áreas da tela usando *Scissor Testing*, economizando 99% da CPU/GPU.
- **Fallback 2D:** Exibir SVGs paramétricos limpos, carregando o 3D *apenas* no foco (*onMouseEnter* profundo) do Card.

---

## 4. Delegação Matemática: Web Workers e Predição

A interface deve simular "quantos módulos faltam" ou "esse inversor aguenta a string?" enquanto o engenheiro mouseia pelo catálogo.

### 4.1 Off-Main-Thread Architecture (Zero-Copy)
- **Implementação:** O hook `useTechCalculations` atrelado a interações do catálogo (`onHover` trigger) deve ser movido para a abstração de tráfego paralelepipédico de um **Web Worker** encapsulado pelo `Comlink`.
- Avaliações densas, cruzamentos MPPT logarítmicos e compatibilidade de fases ocorrerão silenciosamente na Background Thread.
- Ao parear sobre no Card do inversor "Growatt 50kW", o catálogo retorna instantaneamente o crachá de Validação Funcional ("Incompatível com 40 painéis") sem gaguejar (*Stutter*) o CSS de hover do botão de fechar.

---

## 5. Plano de Execução (Passo a Passo Corrigido)

1. **[Infra/Store]** Criar a slice isolada `useCatalogStore` com `partialize` ativado, separando os filtros transientes da persistência de projeto.
2. **[Infra/Workers]** Instanciar um Worker em `services/workers/catalogPredictor.worker.ts` para assumir o peso das validações on-hover.
3. **[DOM/UI]** Unificar as interfaces `ModuleSpecs`/`InverterSpecs` injetando buffers 2D obrigatórios pro Leaflet (Área/Sombra).
4. **[WebGL]** Construir a `Grid` virtualizada. Implementar o utilitário `<View>` (múltiplas câmeras 1 Canvas) se a biblioteca `.glb` estática estiver sendo solicitada.
5. **[Catalog Dialogs]** Reconectar e redesenhar `ModuleCatalogDialog.tsx` e `InverterCatalogDialog.tsx`.

---
*Assinado: Antigravity AI Engineering Assistant (Auditoria e Revisão R2)*

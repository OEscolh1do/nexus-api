# Especificação: Engenharia Canvas 3D (Fase Boto)

## 1. Visão Geral e Objetivo
Após a consolidação da camada de dados funcionais e elétricos (Fase Kurupira), o objetivo desta fase (Fase Boto) é implementar o **Centro Visual 3D** do Workspace de Engenharia. 

O foco é construir um viewport WebGL robusto (usando React Three Fiber) que consuma reativamente o Zustand (`selectedEntity`, `placedModules`, `inverters`) para renderizar os componentes físicos dimensionados em cima de um telhado tridimensional, permitindo interação bidirecional (clicar no 3D seleciona no Outliner/Inspector e vice-versa).

## 2. Arquitetura 3D
- **Tecnologia Base:** `@react-three/fiber` (R3F) e `@react-three/drei`.
- **Ativos 3D:** Modelos em formato fechado `.gltf` / `.glb` contendo metadados embarcados (sockets de snap, orientação solar, dimensões bounding box).
- **Gerenciamento de Câmera:** `OrbitControls` isolado, com restrições de pan/tilt para manter o foco no telhado projetado.
- **Interatividade:** Raycasting otimizado (instanced meshes ou bounding volume hierarchies se a contagem bruta de painéis for alta).

## 3. Escopo de Refatoração (Ações Funcionais)

### Ação 1: Inicialização do CenterCanvas (R3F Provider)
- Substituir o placeholder do `CenterCanvas.tsx` por um `<Canvas>` do React Three Fiber.
- Configurar iluminação base (AmbientLight + DirectionalLight simulando o sol do projeto).
- Adicionar `OrbitControls` com limites sensatos (sem ver debaixo do mapa).

### Ação 2: Carregador de Ativos glTF (AssetLoader)
- Criar hook/componente para carregar os `.glb` dos painéis solares e inversores.
- Implementar cache estrito usando `useGLTF` do `@react-three/drei`.
- Garantir fallback visual (caixas wireframe) enquanto o artefato 3D não carrega.

### Ação 3: Renderizador Instanciado (PlacedModules)
- Consumir `useSolarStore(state => state.project.placedModules)`.
- Renderizar os painéis no telhado 3D usando `<InstancedMesh>` para manter 60FPS mesmo com 10.000 painéis projetados nas usinas de solo/galpão.
- Aplicar transformações: `Position`, `Rotation` (Azimuth + Inclinação do MPPT correspondente) e `Scale` baseada nas dimensões do catálogo (`DIMENSIONS (mm)` do `moduleSchema.ts`).

### Ação 4: Interatividade Bidirecional (Raycasting)
- Sincronizar o `onClick` dos meshes 3D com a action `useUIStore.getState().selectEntity()`.
- Painéis selecionados recebem material de "highlight" (ex: emissive outline ou color overlay).
- Quando o usuário clica no *LeftOutliner*, o *MapFlyToSync* deve animar a câmera do R3F para enquadrar o painel/inversor físico no 3D (se ele estiver posicionado).

### Ação 5: Modos de Ferramenta (Tool Modes)
Interpretar `activeTool` do TopRibbon dentro do contexto 3D:
- **SELECT (V):** Raycast liga para selecionar.
- **PLACE_MODULE (L):** O cursor 3D vira um "fantasma" do painel selecionado no Catálogo. Ao clicar no telhado, dispara `addPlacedModule` e mapeia a coordenada de interseção.

## 4. Dependências da Fase Anterior (Kurupira)
Esta fase assume que:
- O painel direito (StringInspector) já fornece limites validados de azimute e inclinação.
- Os schemas Zod fornecem largura e comprimento garantidos na propriedade estruturada `dimensions: { width, height, depth }` para escalar o mesh 3D base.

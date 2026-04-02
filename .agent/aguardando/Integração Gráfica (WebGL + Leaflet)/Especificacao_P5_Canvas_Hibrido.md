# Especificação Técnica: Fase P5 - Integração Gráfica (WebGL + Leaflet)

## 1. Visão Geral do Épico
Após a consolidação da HUD de Engenharia nas fases P0 a P4 (onde `solarStore` e os menus laterais/ribbons foram implementados e tipados com sucesso), a próxima etapa reside em dar vida ao **Central Canvas**. O objetivo da Fase P5 é implementar o ambiente de visualização híbrido 2D/3D (Leaflet + React Three Fiber), focado na locação espacial dos equipamentos do projeto.

---

## 2. Objetivos Principais
- Substituir o componente "Mock" do Canvas por uma instância verdadeira de mapa georreferenciado interativo (Leaflet).
- Sobrepor um Canvas WebGL (`@react-three/fiber`) transparente e perfeitamente alinhado em aspecto / coordenada com o mapa base.
- Permitir a representação geométrica dos `ModuleSpecs` (os módulos presentes no Zustand) sobre a visão satélite.

---

## 3. Requisitos Arquiteturais
Conforme a *Arquitetura SaaS Engenharia WebGL*, as seguintes regras rígidas se aplicam:
1. **Gerenciamento Dimensional (ResizeObserver):** 
   O R3F Canvas deve possuir seu redimensionamento atado a um ResizeObserver no componente pai, evitando vazamento de pixels ao expandir ou retrair o *LeftOutliner* e o *RightInspector*. `resize={{ debounce: 0 }}` é obrigatório no Canvas.
2. **Isolamento de Render-Loop:**
   A viewport WebGL será alimentada por `api.getState()` (Zustand) dentro do `useFrame`. Nenhuma prop reativa do DOM deve atualizar o canvas diretamente, cortando o link de reconciliação de React.
3. **On-Demand Rendering:**
   O R3F Canvas deve rodar em `frameloop="demand"`. A renderização só ocorre quando houver mudança de câmera ou injeção forçada `invalidate()` via mutação do Zustand.

---

## 4. Etapas de Implementação (Sub-fases P5)

### P5-1: Estruturação Híbrida do Canvas
- Instalar dependências primárias (`leaflet`, `react-leaflet`, `@react-three/fiber`, `@react-three/drei`, `three`).
- Criar `HybridViewport.tsx` englobando tanto o mapa quanto a camada gráfica 3D com sobreposição CSS `position: absolute`.

### P5-2: Georreferenciamento Básico
- Vincular a localização do projeto (`clientSlice` > `city/state`) ao ponto central da câmera do Leaflet usando uma API de Geocoding simples.
- Implementar controles de pan/zoom sincronizados (movimento no Leaflet deve reposicionar a matriz de câmera ortográfica do WebGL).

### P5-3: Posicionamento Vetorial (Drag and Drop Virtual)
- Ler os módulos armazenados em `solarStore.modules`.
- Renderizar instâncias (via `InstancedMesh` no Three.js para performance) representando os painéis.
- (Drafting 2D): Permitir arrastar os blocos solares geométricos para posicioná-los na tela do mapa. Salvar localmente o vetor XYZ (ou lat/lng) no próprio `solarStore`.

---

## 5. Critérios de Aceite
- [ ] Ao abrir o modo de Engenharia, o centro da tela exibe visão de satélite.
- [ ] O arraste das abas laterais da HUD não distorce a imagem WebGL.
- [ ] Módulos adicionados via `ModuleCatalogDialog` criam "quadrados" flutuantes no canvas WebGL que podem ser arrastados.
- [ ] Type-check 0 erros pós-implementação.

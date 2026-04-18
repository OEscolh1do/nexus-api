# Competências Frontend — Kurupira

O frontend do Kurupira é uma aplicação de alta densidade visual que combina sistemas de informação geográfica (GIS) com renderização 3D de alta performance.

## ⚛ React 19 & TypeScript
- **Hooks Personalizados**: Domínio profundo de `useEffect`, `useMemo`, `useCallback` e a criação de Custom Hooks para encapsular lógica de cálculo (ex: `useElectricalValidation`).
- **Portais**: Capacidade de gerenciar múltiplos "targets" de renderização (ex: Minimap Portal).
- **Tipagem Estrita**: Respeito absoluto às interfaces do `solarStore` e à tipagem do catálogo Prisma.

## 🗺 Mapas e Geoprocessamento (Leaflet)
- **Manipulação de Layers**: Conhecimento de TileLayers, GeoJSON, Polígonos reativos e interações de drag-and-drop no mapa.
- **Coordenação Espacial**: Entender a conversão entre coordenadas geográficas (Lat/Lng) e pixels de tela.

## 🧊 WebGL & 3D (React Three Fiber / Three.js)
- **Cena Paramétrica**: Atualizar elementos 3D via `useFrame` utilizando referências mutáveis para evitar re-renders do React (Performance de 60 FPS).
- **Shaders Básicos**: Noção de materiais e iluminação para simulação de incidência solar.
- **GLTF**: Experiência com carregamento e manipulação de metadados em modelos 3D.

## 🧠 Estado e Reatividade (Zustand)
- **Slice Pattern**: Modularização do estado global em fatias independentes.
- **Zundo**: Implementar e configurar patches de Undo/Redo para ações complexas no mapa.
- **Throttling**: Aplicar `lodash.throttle` em eventos contínuos (sliders) para não sobrecarregar o store.

## 🎨 Design System & Estética de Engenharia
- **Tailwind CSS**: Uso avançado de utilitários para criar interfaces densas e profissionais.
- **Aesthetic de Ferramenta**: Foco em layouts rectilíneos, fontes mono (tabular-nums) e grids densos que transmitem precisão de engenharia.

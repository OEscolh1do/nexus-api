# Especificação: Thumbnails Reais no ProjectExplorer

## 1. O Quê (Business Problem)
**Problema**: O `ProjectExplorer` utiliza padrões gerativos (baseados em hash) como placeholders para os thumbnails dos projetos, dificultando o reconhecimento visual rápido de instalações reais.
**Solução**: Armazenar coordenadas no schema do backend Kurupira e consumir uma API genérica ou estática de mapas (Google/Mapbox Lite) para exibir a visão aérea do croqui da instalação.

## 2. Usuários Finais
- **Engenheiro Dimensionador**: Identificação mais ágil do projeto visualmente na listagem.

## 3. Critérios de Aceitação
1. Model `TechnicalDesign` ou `RoofSection` ganham colunas para coordenadas `latitude` / `longitude`.
2. A listagem de `/api/v1/designs` retorna as coordenadas ou payload compatível.
3. O Card do projeto consome estas URLs estáticas/via API e em caso de falha retorna ao fallback de pattern.

## 4. Fora de Escopo
- Mapas interativos 3D em miniatura. (Focado apenas na imagem `.jpg`/`.webp` do satellite).

## 5. Detalhes Técnicos
- Inserir colunas no `schema.prisma`.
- Ajustar Componente Thumb para possuir `img src` estático assinado.

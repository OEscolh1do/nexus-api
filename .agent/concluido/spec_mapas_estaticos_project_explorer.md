# Especificação: Mapas Estáticos nos Cards do ProjectExplorer

## 1. O Quê (Business Problem)
**Problema**: Os cards do ProjectExplorer exibem um padrão generativo de blocos como placeholder visual. Embora funcional e esteticamente aceitável, não fornece contexto geográfico real ao engenheiro — que precisa reconhecer visualmente o telhado/terreno do projeto para decidir qual abrir.

**Solução**: Integrar mapas estáticos (Static Map Tiles) nos thumbnails dos cards, consumindo as coordenadas geográficas (latitude/longitude) do projeto para renderizar uma imagem satélite real do local de instalação.

## 2. Pré-requisitos (Bloqueadores)
- [ ] **Schema Migration**: Adicionar campos `latitude Float?` e `longitude Float?` ao model `TechnicalDesign` no Prisma schema do Kurupira.
- [ ] **API Update**: A rota `GET /api/v1/designs` deve retornar `latitude` e `longitude` no payload de listagem.
- [ ] **Geocoding**: Definir se as coordenadas serão inseridas manualmente (engenheiro cola lat/lng) ou via Geocoding API (resolve endereço → coordenadas).

## 3. Critérios de Aceitação
1. Cards com `latitude`/`longitude` preenchidos exibem tile satélite estático (Google Static Maps ou OpenStreetMap/Mapbox).
2. Cards sem coordenadas continuam exibindo o placeholder generativo atual (graceful degradation).
3. Tiles são cacheados no frontend para evitar requisições repetidas (memoize ou `localStorage`).
4. O tile deve ter resolução mínima de 400x200px, zoom ~18 (nível de telhado).
5. `tsc --noEmit` → EXIT CODE 0.

## 4. Fora de Escopo
- Renderizar o mapa interativo no card (Leaflet); apenas imagem estática.
- Geocoding reverso (coordenada → endereço).
- Persistência de cache no backend (apenas frontend).

## 5. Dependências de API
- Google Static Maps API (`https://maps.googleapis.com/maps/api/staticmap?...`) — requer API key.
- Alternativa gratuita: OpenStreetMap Tile Server (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`).
- Alternativa premium: Mapbox Static Images API.

---
*Status: Aguardando migration do schema (lat/lng) para ser iniciada.*

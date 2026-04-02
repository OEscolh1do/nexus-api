# Planejamento: Integração Gráfica (Leaflet/WebGL) no CenterCanvas

**Status:** Rascunho Inicial
**Origem:** Fato novo após término do fluxo da Engenharia de UI (Especificação Técnica UX-001).
**Componente Alvo Principal:** `src/modules/engineering/ui/panels/CenterCanvas.tsx` e o recém-criado `CanvasContainer.tsx`

## 1. Contexto e Objetivo
O arcabouço da interface de usuário (DOM React, store Zustand, Zundo Undo/Redo e Ribbon/Outliner) já foi normalizado e blindado. Agora, é o momento de preencher o placeholder central do `CenterCanvas.tsx` com o mapa interativo e a malha 3D.

A integração não pode vazar atualizações constantes ("re-renders") para o React DOM, aproveitando o `ResizeObserver` nativo do `CanvasContainer.tsx` e os métodos de mutação assíncrona da GPU.

## 2. Escopo do Motor WebGL/Map
1. **Bibliotecas Candidatas:** `react-leaflet`, `leaflet`, `@react-three/fiber` (R3F) ou custom WebGL?
2. **Funcionalidades Iniciais:**
   - [ ] Carregar "Tile Layer" base de Satélite a partir das coordenadas geográficas.
   - [ ] Exibir camada de "Polígonos" do Store de engenharia (módulos, strings, inversores e traçado de telhado).
   - [ ] Interatividade: Pan, Zoom e Raycasting simplificado (click em telhado/string).

## 3. Desafios Arquiteturais
- **Sicronização de Estado:** O *source of truth* deve obrigatoriamente continuar sendo `solarStore.ts`. A engine gráfica consumirá o store e renderizará passivamente via `useSolarStore`, evitando loops.
- **Ferramentas (TopRibbon):** Cursos e modos de uso (`SELECT`, `POLYGON`, `MEASURE`, `PLACE_MODULE`) ditados na UI devem refletir o comportamento interno de input no Canvas WebGL.

## 4. Próximos Passos
- [ ] Listar dependências externas necessárias (e.g., `leaflet`, `@types/leaflet`).
- [ ] Criar o componente `MapCore.tsx` que fará o "bootstrap" da engine dentro do `CenterCanvas`.
- [ ] Definir como será a abstração dos polígonos.

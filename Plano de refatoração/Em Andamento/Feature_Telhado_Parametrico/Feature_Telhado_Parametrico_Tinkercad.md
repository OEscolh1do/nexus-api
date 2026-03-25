# 🛠️ Feature: Telhado Paramétrico (Estilo Tinkercad)

## Contexto do Refactoring (`/speckit`)
A abordagem tradicional GIS de desenhar vértices ponto a ponto num mapa distorce geometricamente a ortogonalidade dos telhados, dificultando o alinhamento da matriz solar 3D. Esta feature substitui o desenho livre por um motor de Constructive Solid Geometry (CSG) semelhante ao Tinkercad, onde telhados são "caixas paramétricas" que preservam 90 graus perfeitos.

---

## Etapa 1: `.specify` (O Quê)

### 1.1. Problema de Negócio
Garantir dimensões ortogonais perfeitas e alinhamentos mecânicos exatos (largura vs azimute) que ferramentas de clique-livre destruíram, oferecendo agilidade de layout para o engenheiro.

### 1.2. Usuário Final
Engenheiros Projetistas de Usinas Solares via WebGL/Leaflet Híbrido.

### 1.3. Critérios de Aceitação (Definition of Done)
1. **Instanciação (Drop):** Ao clicar num botão "Adicionar Água de Telhado", um retângulo padrão (ex: 10m x 5m) surge no centro da tela.
2. **Reposicionamento (Translate):** O usuário pode clicar no meio da caixa e arrastar livremente seu centro pelo mapa. Ao mover o telhado, todos os painéis contidos nele se movem junto.
3. **Escala Paramétrica (Scale):** Grips (nós de borda) permitem esticar a caixa apenas no eixo da lateral tracionada, alterando largura e altura fisicamente em metros.
4. **Alinhamento Radial (Rotate):** O telhado possui uma "haste" ou grip central rotacional. Ao arrastar, gira toda a caixa ao redor de seu centro cívico, extraindo nativamente o `roofAzimuth`. O giro carrega os painéis contidos nele solidariamente.
5. **Composição Booleana (Multi-Roof):** Podem existir N telhados simultâneos (água Norte, água Sul), permitindo compor estruturas de L ou T.
6. **Exclusão Limpa (Delete) e Cascata OBRIGATÓRIA:** A barra de `Delete/Backspace` apaga a instância inteira do telhado selecionado, além de *remover em cascata* os painéis contidos no limite desse array mapeado através da relação pai-filho.
7. **Input Numérico:** O RightInspector passa a exibir 4 campos para o telhado selecionado: `Largura (m)`, `Altura (m)`, `Azimute (°)` e um eixo lat/lng ajustável na mão.
8. **Restrição de Vazamento (Boundary Check):** O Motor Leaflet e WebGL impedirá que um painel seja instanciado ou arrastado fisicamente para fora das bounding boxes (áreas viáveis) de um telhado. Módulos "voadores" não serão permitidos no state. O clique de `PLACE_MODULE` fora de um polígono válido é ignorado com aviso.
9. **Preenchimento Automático Inteligente (Auto-Layout):** Terá um botão "Preencher (Auto-Fill)". O sistema calculará uma malha / array sobre a largura útil x altura útil do telhado paramétrico (descontando margens de segurança) e despejará a quantidade máxima possível de instâncias de módulos perfeitamente espaçados cobrindo a região.

### 1.4. Fora de Escopo
- Alterações em Z-axis (Elevação/Pitch do telhado em graus no 3D será coberta apenas como meta-dado 2D neste passo).
- Edição livre separada de vértices transformando a caixa em formas complexas (trapézios/triângulos não são contemplados nessa feature padrão CSG ortogonal).
- Grips de quina com atração proporcional (scale em X+Y). Somente gripar um lado de cada vez (X isolado ou Y isolado).

---

## Etapa 2: `.plan` (O Como)

### 2.1. Arquitetura de Estado (`projectSlice.ts`)
O armazenamento de um `roofPolygon: LatLngTuple[]` genérico será extinto e substituído por uma Árvore Hierárquica Relacional O(1). Módulos perdem a propriedade isolada central e passam a viver como filhos relativos a um Telhado Paramétrico.

*Nova Estruturação:*
```typescript
interface ParametricRoof {
  id: string;
  center: LatLngTuple; // Ponto pivô central (referência global do mapa)
  widthM: number;      // Tamanho físico em metros
  heightM: number;     // Altura da água
  azimuth: number;     // Rotação mecânica (0 a 360)
  pitch?: number;      // Inclinação do plano face ao solo
  placedModuleIds: string[]; // RELAÇÃO PAI-FILHO DIRETA
}

interface PlacedModule {
  id: string;
  moduleSpecId: string;
  roofId: string;      // Back-reference de Segurança
  // O center do painel agora é RELATIVO (Offset) ao telhado pai! 
  // Se o telhado girar ou mover, o painel muda junto via matrix.
  offsetX_M: number;   // Posição local em metros (X)
  offsetY_M: number;   // Posição local em metros (Y)
}

interface ProjectData {
  roofAreas: NormalizedCollection<ParametricRoof>; // Usa collection para lookup de performance
  placedModules: NormalizedCollection<PlacedModule>; 
  // ... coordinates, zoom ...
}
```

*Ações (Mutators):*
- `spawnRoofArea(center: LatLngTuple)`
- `updateRoofArea(id, data: Partial<ParametricRoof>)`: Mutador central. Atualizar `center` ou `azimuth` automaticamente move todos os painéis relativos no renderer, sem precisar iterá-los.
- `deleteRoofArea(id)`: Deleta o form iterando `placedModuleIds` para limpar toda a cadeia na mesma transação.
- `autoLayoutRoof(roofId, moduleSpecId)`: Calcula a matriz matemática da área (width/modWidth * height/modHeight) e preenche a array `placedModuleIds` com offsets precisos até bater na borda da caixa. Otimiza "Portrait" vs "Landscape" descobrindo o maior valor.

### 2.2. Lógica Geométrica (`geoUtils.ts`)
Hoje a função `calcModulePolygon(center, width, height, azimuth)` já calcula 4 pontos exatos de um painel posicionado.
**O Telhado também usará essa matemática!** Como ele é uma caixa, desenhar ele no Leaflet é só passar a própria estrutura `ParametricRoof` pelo `calcModulePolygon` e a saída será o array de LatLng a ser plotado no `<Polygon/>` Leaflet.

### 2.3. Camada de UI (`SolarLayer.tsx`)
1. Iteraremos sobre `project.roofAreas` criando instâncias isoladas do sub-componente `<ParametricRoofBlock />`.
2. Se o ID coincidir com `uiStore.selectedEntity`, renderizamos Controladores (Grips diretos):
   - Bolinhas Leaflet transparentes ou SVG Overlay colados nas 4 arestas.
   - Adicionador de Eventos de Drag.
   - A matemática do Drag de Borda usa a diferença lat/lng multiplicada por metros aproximados (Via `L.CRS.Earth.distance`).

### 2.4. A UI Inspector
O `RightInspector` sofrerá uma atualização (novo painel `RoofProperties.tsx`) para o usuário atrelar/ajustar milimetricamente as propriedades exatas da caixa (Azimute 0.5 em 0.5°, e Metros soltos).

---

## Próximos Passos (Workflow `.tasks` -> `.implement`)
Esta folha atua como o **BluePrint Final**, pronto para ser fatiado ao `task.md` e desenvolvido progressivamente.

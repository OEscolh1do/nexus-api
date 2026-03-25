# 🛠️ Feature: Área de Instalação Paramétrica Freeform (Estilo AutoCAD / Illustrator)

## Contexto da Evolução (`/speckit`)
O MVP da Fase P8 implementou a modelagem restrita "Tinkercad" (retângulos perfeitos de Largura x Altura) sob a nomenclatura "Telhado". Porém, **o polígono não representa exclusivamente um telhado** — ele pode ser uma cobertura de galpão, uma laje, um terreno de solo (ground-mount), um estacionamento ou qualquer superfície onde painéis solares serão instalados.
A partir desta revisão, a entidade passa a chamar-se **"Área de Instalação"** (`InstallationArea`), generalizando o conceito e permitindo que o projetista modele superfícies de qualquer natureza usando vértices livremente manipuláveis no estilo Illustrator/AutoCAD, mantendo todas as vantagens do motor CSG (Centro Pivotante, Azimute Global, e Filhos Relativos).

---

## Etapa 1: `.specify` (O Quê)

### 1.1. Problema de Negócio
Restringir o projetista a caixas ortogonais rotuladas como "telhado" bloqueia o design de usinas solares de solo, carports, lajes industriais e qualquer superfície não-residencial. A entidade precisa ser **agnóstica quanto ao tipo de superfície** e flexível quanto à forma geométrica.

### 1.2. Usuário Final
Engenheiros Projetistas de Usinas Solares (Residenciais, Comerciais e de Solo).

### 1.3. Critérios de Aceitação (Definition of Done)

#### A. Ciclo de Vida do Objeto (CRUD Completo)

| # | Ação | Gatilho UX | Comportamento |
|---|------|------------|---------------|
| A1 | **Criar (Drop)** | Selecionar ferramenta "Desenhar Área" na Toolbar → Clicar no mapa | Instancia um retângulo-padrão 10×5m no ponto clicado. Reverte automaticamente para a ferramenta "Seleção". |
| A2 | **Selecionar** | Tool "Seleção" ativa → Clicar no preenchimento ou borda da área | Área recebe halo visual (borda azul animada). Ativa os Grips (bolinhas). Popula o Right Inspector com as propriedades. |
| A3 | **Desselecionar** | Clicar em área vazia do mapa (fora de qualquer polígono) | Remove o halo, esconde os Grips, limpa o Inspector. |
| A4 | **Deletar a área inteira** | Área selecionada + Tecla `Delete` ou `Backspace` | Remove a área **e todos os módulos filhos em cascata**. Sem confirmação bloqueante (`window.confirm` proibido). Usar Undo (Ctrl+Z via Zundo) como safety net. |
| A5 | **Duplicar** | Área selecionada + Tecla `Ctrl+D` ou Botão 📋 no Inspector | Clona a área inteira (geometria + módulos filhos) com offset de +2m no eixo X para não sobrepor. Seleciona automaticamente o clone. |

#### B. Manipulação de Forma (Remodelação)

| # | Ação | Gatilho UX | Comportamento |
|---|------|------------|---------------|
| B1 | **Mover (Translate)** | Arrastar o **preenchimento interno** do polígono com o mouse | Translada o `center` (pivô global). Todos os vértices e módulos filhos se movem solidariamente. Cursor: `grab` → `grabbing`. |
| B2 | **Redimensionar Vértice (Direct Edit)** | Arrastar um dos **Grips de quina** (bolinhas brancas nos vértices) | Deforma o polígono livremente. Apenas o vértice puxado se move; os demais permanecem fixos. Permite criar trapézios, "L", "T" e formas irregulares. |
| B3 | **Redimensionar Aresta (Scale de Borda)** | Arrastar um dos **Grips de meia-aresta** (quadradinhos no ponto médio de cada lado) | Empurra os dois vértices da aresta paralelamente, esticando/comprimindo apenas aquele lado. Preserva os ângulos adjacentes. Estilo Illustrator "Scale Edge". |
| B4 | **Rotacionar (Azimuth)** | Arrastar o **Grip de Rotação** (ícone circular flutuante acima do polígono) ou Input numérico no Inspector | Gira todo o polígono ao redor do seu `center`. Módulos filhos giram junto solidariamente. |
| B5 | **Adicionar Vértice** | Hover sobre uma **aresta** do polígono → aparece um `+` fantasma → Clicar | Insere um novo vértice no meio daquela aresta, dividindo-a em duas. O vértice pode ser arrastado imediatamente após criação para desenhar chanfros ou recuos em "L". |
| B6 | **Remover Vértice** | Clicar num **Grip de quina** para selecioná-lo (fica laranja) → Tecla `Delete` | Remove o vértice do array, fundindo as duas arestas adjacentes em uma só. Mínimo de 3 vértices (triângulo) é preservado como limite inferior. |

#### C. Módulos Solares (Filhos da Área)

| # | Ação | Gatilho UX | Comportamento |
|---|------|------------|---------------|
| C1 | **Colocar módulo manual** | Tool "Colocar Módulo" ativa → Clicar **dentro** da área | Instancia o módulo nas coordenadas relativas. **Clique fora da área = ignorado com toast de aviso.** |
| C2 | **Auto-Layout (Preenchimento)** | Botão "Preencher (Auto-Fill)" no Inspector ou `Ctrl+F` | Preenche toda a área via grid, descartando painéis que vazem a borda irregular (Ray-Casting `isPointInPolygon`). Otimiza Portrait vs Landscape. |
| C3 | **Mover módulo** | Arrastar módulo individual com ferramenta Seleção | Módulo se move mas é **Clampado** nas paredes da área pai. Se o centro do módulo sair da área, o offset é restringido à borda mais próxima. |
| C4 | **Deletar módulo** | Módulo selecionado + `Delete` | Remove o módulo individual sem afetar a área pai. |
| C5 | **Cascata automática** | Pai é deletado (A4) / Pai é redimensionado e módulo fica fora da nova borda | Módulos órfãos são removidos silenciosamente. |

#### D. Propriedades da Área (`Right Inspector`)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| **Tipo de Superfície** | Dropdown | `Telhado ∣ Solo ∣ Carport ∣ Laje ∣ Outro` — Metadado descritivo para a proposta comercial e documentação. Não altera comportamento geométrico. |
| **Latitude / Longitude** | Input Numérico | Coordenadas do `center` (pivô). Permite reposicionamento analítico sem mouse. |
| **Azimute (°)** | Input Numérico | Rotação radial da área. |
| **Inclinação (°)** | Input Numérico | Pitch da superfície face ao solo. Metadado para cálculos de irradiância. |
| **Nº Vértices** | Read-only | Quantidade de pontos no polígono. |
| **Área Total (m²)** | Read-only | Calculada automaticamente via Shoelace formula. |
| **Botão "Preencher"** | Action | Dispara Auto-Layout. |
| **Botão "Duplicar"** | Action | Clona a área + filhos. |
| **Botão "Limpar Módulos"** | Action | Remove módulos filhos sem deletar a área. |

#### E. Feedback Visual (Estados do Polígono)

| Estado | Aparência |
|--------|-----------|
| **Idle (não selecionado)** | Preenchimento semi-transparente azul claro. Borda sólida fina cinza. Sem grips. |
| **Hover** | Borda muda para azul. Cursor vira `pointer`. |
| **Selecionado** | Borda azul brilhante (animated dash). Grips de quina (⚪ brancos) e de meia-aresta (◻ quadrados menores) visíveis. Grip de rotação (🔄) flutuante acima. |
| **Vértice em Hover** | Grip de quina cresce ligeiramente (scale 1.2). Cursor vira `crosshair`. |
| **Vértice Selecionado (pronto p/ Delete)** | Grip muda de branco para **laranja**. |
| **Aresta em Hover** | Fantasma `+` aparece no ponto médio. Cursor vira `cell` (crosshair com +). |

### 1.4. Fora de Escopo
- **Beziers:** Linhas curvas. Apenas arestas retas.
- **Booleanos:** Subtrair polígono A de B para furos centrais.
- **Right-click menus:** Nenhuma ação crítica depende de clique direito. Toda interação é via **seleção + tecla** ou **arrastar + soltar**.
- **Confirmação bloqueante (`window.confirm`):** Substituída por Undo (`Ctrl+Z`).

---

## Etapa 2: `.plan` (O Como)

### 2.1. Arquitetura de Estado (`projectSlice.ts`)

A interface será renomeada de `ParametricRoof` para `InstallationArea`:

```typescript
type SurfaceType = 'roof' | 'ground' | 'carport' | 'slab' | 'other';

interface InstallationArea {
  id: string;
  center: LatLngTuple;
  azimuth: number;
  pitch: number;
  surfaceType: SurfaceType;           // Metadado descritivo
  
  // NÚCLEO FREEFORM — Offsets métricos relativos ao center [0,0]
  localVertices: { x: number; y: number }[];

  placedModuleIds: string[];
}

interface PlacedModule {
  id: string;
  moduleSpecId: string;
  areaId: string;        // Antes "roofId", agora "areaId"
  offsetX_M: number;
  offsetY_M: number;
  widthM: number;
  heightM: number;
}
```

> [!IMPORTANT]
> A migração de `roofAreas` → `installationAreas` e `roofId` → `areaId` exigirá atualização do merge de cache antigo no `solarStore.ts`.

**Mutators Necessários:**

| Mutator | Responsabilidade |
|---------|-----------------|
| `spawnArea(center)` | Cria com 4 vértices retangulares padrão |
| `updateArea(id, data)` | Atualiza `center`, `azimuth`, `pitch`, `surfaceType` |
| `updateAreaVertex(areaId, index, x, y)` | Move um vértice individual |
| `addAreaVertex(areaId, afterIndex, x, y)` | Insere vértice no meio de uma aresta |
| `removeAreaVertex(areaId, index)` | Remove vértice (mín. 3) |
| `deleteArea(id)` | Cascata: remove área + todos os módulos filhos |
| `duplicateArea(id)` | Clona com offset de +2m |
| `autoLayoutArea(id)` | Grid + Ray-Casting + Otimizador Portrait/Landscape |

### 2.2. Lógica de UI / Manipuladores (`InstallationAreaBlock.tsx`)
1. **Plotagem:** Itera `localVertices`, aplica rotação 2D (azimuth) ao ponto `[vx, vy]` em torno de `[0,0]`, converte metros → LatLng offset a partir do `center`.
2. **Grips de Quina:** `<Marker>` para cada vértice. Evento `drag` → des-rotaciona o cursor e faz dispatch de `updateAreaVertex`.
3. **Grips de Meia-Aresta:** `<Marker>` fantasma no ponto médio de cada aresta. Evento `click` → `addAreaVertex`.
4. **Grip de Rotação:** Marker flutuante acima do polígono. `drag` → calcula ângulo relativo ao center.
5. **Keyboard Listener:** `useEffect` global escutando `Delete`, `Backspace`, `Ctrl+D`, `Ctrl+Z`.

### 2.3. Matemática Geométrica (`geoUtils.ts`)
- `isPointInPolygon(pt, polygon)` — Ray-Casting standard.
- `isRectInsidePolygon(rect, polygon)` — Testa os 4 cantos do módulo.
- `computePolygonArea(vertices)` — Shoelace formula para área em m².
- `midpoint(v1, v2)` — Para posicionar grips de meia-aresta.

### 2.4. Inspector (`AreaProperties.tsx`)
Propriedades detalhadas na Tabela D da seção 1.3.

---

## Etapa 4: `.analyze` (Riscos)

| Risco | Severidade | Mitigação |
|-------|-----------|-----------|
| Regressão: Renomear `roofAreas` → `installationAreas` em toda a codebase | ⚠️ Média | Busca global + testes manuais |
| Regressão: `autoLayoutRoof` usa `widthM/heightM` puro | ⚠️ Média | Derivar bounds dos `localVertices` |
| Performance: Ray-Casting em N módulos × M vértices | 🟢 Baixa | Bounding Box fast-reject antes do ray-cast |
| State Legacy: `localStorage` antigo sem `localVertices` | ⚠️ Média | `merge()` no `solarStore.ts` inicializa array vazio |

---

## Próximos Passos (Workflow `.tasks` → `.implement`)
Quando aprovado, será gerado o `task.md` atômico e a implementação seguirá a ordem: **Renomear Schema → Mutators → geoUtils → UI Component → Inspector → Keyboard Shortcuts → Testes**.

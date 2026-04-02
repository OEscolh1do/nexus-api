# 🛠️ Feature: Refinamentos P10.1 — Controle de Forma, Módulos Órfãos e Cap de Quantidade

## Contexto

A Fase P10 implementou o motor `InstallationArea` Freeform com vértices manipuláveis.
Três refinamentos são necessários para maturidade de produção:

1. **Ajuste Manual de Largura/Altura** — Inputs numéricos no Inspector
2. **Tratamento de Módulos Órfãos** — Limpeza automática quando módulos ficam fora dos limites
3. **Cap de Quantidade** — `autoLayoutArea` não deve colocar mais módulos do que a `quantity` declarada na barra lateral de Componentes

---

## Etapa 1: `/speckit.specify` (O Quê)

### 1.1. Problema de Negócio

| # | Problema | Impacto |
|---|---------|---------|
| F1 | O projetista não consegue definir Largura e Altura **exatas** (ex: 8.50m × 4.20m) exceto arrastando vértices pixel a pixel | Baixa precisão analítica |
| F2 | Quando o polígono é redimensionado e módulos ficam **fora** dos novos limites, eles permanecem como fantasmas visíveis | Inconsistência visual e lógica |
| F3 | O Auto-Layout preenche a área inteira sem respeitar a `quantity` declarada na lista de Componentes | Proposta comercial e engenharia elétrica ficam dessincronizadas |

### 1.2. Usuário Final
Engenheiros Projetistas de Usinas Solares (Kurupira Workspace).

### 1.3. Critérios de Aceitação

#### F1: Inputs Manuais de Largura e Altura

| # | Critério | Verificação |
|---|---------|-------------|
| F1.1 | `AreaProperties.tsx` exibe campos editáveis **"Largura (m)"** e **"Altura (m)"** | Campo visível no Inspector quando área selecionada |
| F1.2 | Os valores são **derivados** dos `localVertices` (bounding box) e apresentados como read-only inicialmente, editáveis ao clicar | Exibe `maxX - minX` e `maxY - minY` |
| F1.3 | Ao alterar Largura, os vértices são **reescalados proporcionalmente** no eixo X, mantendo o centro fixo | `vertexX_new = vertexX_old * (newWidth / oldWidth)` |
| F1.4 | Ao alterar Altura, os vértices são **reescalados proporcionalmente** no eixo Y, mantendo o centro fixo | `vertexY_new = vertexY_old * (newHeight / oldHeight)` |
| F1.5 | Valor mínimo: 1m para ambos | Inputs rejeitam valores < 1 |

#### F2: Tratamento de Módulos Órfãos

| # | Critério | Verificação |
|---|---------|-------------|
| F2.1 | Ao mover um vértice (`updateAreaVertex`), módulos que ficaram **fora** do novo contorno são removidos automaticamente | `isRectInsidePolygon` checado para cada módulo filho |
| F2.2 | Ao remover um vértice (`removeAreaVertex`), mesma limpeza de órfãos | Idem |
| F2.3 | Ao redimensionar via inputs W/H (F1), mesma limpeza | Idem |
| F2.4 | O `TopRibbon.tsx` exibe desacordo entre "Módulos Lógicos" (qty) vs "Módulos Posicionados" quando aplicável | Já existente — mantido como está |

#### F3: Cap de Quantidade no Auto-Layout

| # | Critério | Verificação |
|---|---------|-------------|
| F3.1 | `autoLayoutArea` lê o `quantity` total da `techSlice.modules` **antes** de preencher | `Sum(entities[id].quantity)` para todos os moduleSpecs |
| F3.2 | O layout para de colocar módulos quando `placedModules.length` (global) + novos módulos ≥ `totalLogicalQuantity` | Cap respeitado |
| F3.3 | Quando a área **já está vazia** e o cap é 0, exibe toast: "Configure a quantidade de módulos na barra lateral primeiro" | Toast informativo |
| F3.4 | O cap considera módulos **já posicionados em outras áreas** | `globalPlacedCount = s.project.placedModules.filter(m => m.areaId !== currentAreaId).length` |
| F3.5 | **Colocação Manual Bloqueada:** A ação manual de "Colocar Módulo" (`placeModule`) também é bloqueada se o limite lógico total já foi alcançado em todo o projeto. | `placeModule` early return se `globalPlacedCount >= totalLogicalQty` |
| F3.6 | **Redução de Cap (Downgrade):** Se o limite lógico for reduzido *abaixo* do que já está desenhado (ex: de 20 para 15), o motor **NÃO** remove módulos desenhados. A divergência é resolvida pela UI do `TopRibbon.tsx`. | Nenhuma ação de auto-delete acontece na redução |
| F3.7 | **Smart Fill (Preservação de Trabalho Manual):** Ao rodar o `autoLayoutArea` numa área que já possui módulos (ex: após remover módulos centrais para acomodar uma chaminé), o grid é gerado e as posições geradas que **colidem (bounding box overlapping)** com módulos já existentes são descartadas. | Trabalho manual do projetista não é destruído por cliques subsequentes no Auto-Layout |

### 1.4. Fora de Escopo

- Redimensionamento por aresta (empurrar dois vértices em paralelo) — previsto em spec anterior, não neste incremento
- Reposicionamento automático de módulos após redimensionamento (só remove os que ficam fora)
- Inputs de W/H para polígonos com > 4 vértices — o scaling proporcional funciona, mas pode distorcer formas complexas (aceitável)

---

## Etapa 2: `/speckit.plan` (O Como)

### Componente 1: Inputs de Largura/Altura

---

#### [MODIFY] [projectSlice.ts](file:///d:/Repositório_Pessoal/SaaS%20Projects/Neonorte/Neonorte/kurupira/frontend/src/core/state/slices/projectSlice.ts)

Novo mutator: `resizeArea(id: string, newWidthM: number, newHeightM: number)`
- Calcula bounds atuais via `computeBounds(localVertices)`
- Aplica fator de escala X: `scaleX = newWidthM / (bounds.maxX - bounds.minX)`
- Aplica fator de escala Y: `scaleY = newHeightM / (bounds.maxY - bounds.minY)`
- Reescreve `localVertices[i] = { x: v.x * scaleX, y: v.y * scaleY }`
- Chama cleanup de módulos órfãos (F2)

#### [MODIFY] [AreaProperties.tsx](file:///d:/Repositório_Pessoal/SaaS%20Projects/Neonorte/Neonorte/kurupira/frontend/src/modules/engineering/ui/panels/properties/AreaProperties.tsx)

Adicionar 2 `PropRowEditable`:
- **"Largura (m)"** → valor derivado de `computeBounds().widthM`, `onCommit` → `resizeArea(id, newW, currentH)`
- **"Altura (m)"** → valor derivado de `computeBounds().heightM`, `onCommit` → `resizeArea(id, currentW, newH)`

---

### Componente 2: Limpeza de Módulos Órfãos

---

#### [MODIFY] [projectSlice.ts](file:///d:/Repositório_Pessoal/SaaS%20Projects/Neonorte/Neonorte/kurupira/frontend/src/core/state/slices/projectSlice.ts)

Helper reutilizável inline:
```typescript
function cleanOrphanModules(
  placedModules: PlacedModule[],
  areaId: string,
  vertices: LocalVertex[]
): { cleaned: PlacedModule[]; removedIds: string[] }
```
- Itera `placedModules.filter(m => m.areaId === areaId)`
- Para cada: `isRectInsidePolygon(m.offsetX_M, m.offsetY_M, m.widthM/2, m.heightM/2, vertices)`
- Remove os que falham

Injetado em: `updateAreaVertex`, `removeAreaVertex`, `resizeArea`

---

### Componente 3: Cap de Quantidade no Auto-Layout

---

#### [MODIFY] [projectSlice.ts](file:///d:/Repositório_Pessoal/SaaS%20Projects/Neonorte/Neonorte/kurupira/frontend/src/core/state/slices/projectSlice.ts)

Dentro de `autoLayoutArea`:
1. Ler `totalLogicalQty = sum(modules.entities[id].quantity)` via `(s as any).modules`
2. Calcular `globalPlacedCount = s.project.placedModules.length` (inclui todas as áreas)
3. `maxNewModules = totalLogicalQty - globalPlacedCount`
4. Se `maxNewModules <= 0`, retornar sem alteração (guard)
5. **Smart Fill Collision Checker**: Criar lista de `existingModules` na área atual.
6. No loop de `tryLayout`, para cada coordenada `(cx, cy)` viável candidata:
   - Checar se o bounding box candidato `[cx±w/2, cy±h/2]` colide com o bounding box de algum `existingModule`.
   - Se colidir, pula e avança para a próxima célula do grid (preservando o painel original).
   - Se não colidir, cria novo painel e subtrai de `maxNewModules`.
7. Parar o grid iteration quando colocar `maxNewModules`.

#### [MODIFY] [projectSlice.ts](file:///d:/Repositório_Pessoal/SaaS%20Projects/Neonorte/Neonorte/kurupira/frontend/src/core/state/slices/projectSlice.ts) (placeModule)
- No início de `placeModule`, aplicar a mesma lógica: `totalLogicalQty - globalPlacedCount > 0` antes de prosseguir.

---

## Etapa 4: `/speckit.analyze` (Riscos)

| Risco | Severidade | Mitigação |
|-------|-----------|-----------|
| `resizeArea` distorce polígonos complexos (>4 vértices) | 🟢 Baixa | Escalamento proporcional é matematicamente válido; formas ficam "esticadas" mas corretas |
| Cleanup de órfãos em `updateAreaVertex` causa lag em polígonos com muitos módulos | 🟢 Baixa | Ray-Casting é O(N×V), com N=módulos e V=vértices; para N<500, < 1ms |
| Leitura cross-slice `(s as any).modules` é frágil | ⚠️ Média | Já utilizada no `autoLayoutArea` atual; refatorar para selector tipado em fase futura |
| Cap pode confundir quando existem múltiplos `moduleSpecs` com quantidades diferentes | ⚠️ Média | Soma total `quantity` de todos os specs; documentar que é cap global |

---

## Próximos Passos
Após aprovação: gerar `task.md` atômico e implementar na ordem **Schema → Cleanup → Cap → UI**.

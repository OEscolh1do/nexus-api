---
name: webgl-architect
description: Especialista em arquitetura de alto desempenho para viewports WebGL, estado paramétrico profundo e cálculos pesados off-thread. Ativado em tarefas envolvendo Canvas 3D/2D, Three.js, R3F, gerenciamento de cena e simulação numérica no navegador.
---

# Skill: WebGL Architect

## Gatilho Semântico

Ativado quando a tarefa envolve: viewport WebGL/Canvas, Three.js ou React Three Fiber, redimensionamento de canvas em layouts dinâmicos, estado paramétrico de milhares de entidades, sistema de undo/redo para cenas complexas, renderização on-demand, ou delegação de cálculos pesados para Web Workers/WASM.

## ⛔ Escopo de Não-Intervenção (Hard Boundaries)

- ❌ Estilização de painéis UI (CSS, Tailwind, Framer Motion) — responsabilidade do `design-lead`
- ❌ Endpoints de API, data fetching, hooks de query — responsabilidade do `the-builder`
- ❌ Schema de banco de dados, migrations, infraestrutura de deploy
- ❌ Lógica de negócio pura que não envolve geometria, cena ou simulação

## Protocolo de Arquitetura (6 Pilares)

### 1. Layout de Workspace

- Use **Dockview** (zero deps, wrappers React/Vue) ou **FlexLayout-React** (React puro, JSON tree).
- Serialize o estado do layout em `localStorage` para persistência entre sessões.
- Nunca use CSS Grid/Flexbox simples como gerenciador de janelas — painéis devem ser dockable, tabbable e pop-out.

### 2. Sincronização Canvas ↔ Layout

- Envolva o `<canvas>` em uma div container com `position: relative; width: 100%; height: 100%; overflow: hidden`.
- Observe o **container pai** com `ResizeObserver`, nunca o canvas diretamente.
- **Nunca** recalcule projeção/renderer dentro do callback do observer. O callback apenas atualiza refs:
```tsx
const sizeRef = useRef({ w: 0, h: 0 });
useEffect(() => {
  const ro = new ResizeObserver(([entry]) => {
    sizeRef.current = { w: entry.contentRect.width, h: entry.contentRect.height };
  });
  ro.observe(containerRef.current);
  return () => ro.disconnect();
}, []);
```
- O `useFrame` (R3F) ou `requestAnimationFrame` lê `sizeRef` e aplica `renderer.setSize()` apenas se houve mudança.
- Em R3F, force latência zero: `<Canvas resize={{ debounce: 0 }}>`.

### 3. Estado Paramétrico — Árvore de Decisão

| Critério | Escolha |
|---|---|
| Time-travel debug, serialização massiva, rastreabilidade de mutações | **Zustand** com normalização |
| Árvores de formulários densas, re-render de folhas isoladas | **Jotai** atômico |
| Ambos os cenários coexistem | **Híbrido**: Zustand (domínio central) + Jotai (UI transiente) |

**Regra Zustand**: Normalize entidades em hash maps por UUID. Hierarquias são arrays de IDs, nunca objetos aninhados.
```ts
// ✅ Correto: entidades achatadas
{ entities: { [uuid]: { depth: 10, parentId: 'abc' } }, childrenMap: { 'abc': ['uuid'] } }
// ❌ Errado: nesting profundo
{ project: { inverters: [{ strings: [{ modules: [...] }] }] } }
```

### 4. Undo/Redo — Árvore de Decisão

| Critério | Escolha |
|---|---|
| Memória mínima, encapsulamento por feature, operações vetoriais reversíveis | **Command Pattern** (execute/undo por objeto) |
| Integração rápida com Zustand, menor boilerplate | **Immer Patches** via `zundo` middleware |

**Regras obrigatórias para ambos**:
- **Parcialize**: Exclua do histórico estado transiente (mouse pos, menus abertos, painéis colapsados).
- **Agrupe ações contínuas**: Sliders e drags devem gerar **um** snapshot no `onPointerUp`, nunca um por frame.
- **Cap da pilha**: Imponha limite máximo de entradas (ex: 100) para evitar saturação do heap.

### 5. Isolamento do Render Loop

**Regra cardinal**: Nunca use `setState` dentro de `useFrame` ou em loops de animação.

Padrão de atualização transiente:
```tsx
const MeshComponent = ({ id }) => {
  const meshRef = useRef(null);
  useFrame(() => {
    if (!meshRef.current) return;
    // Leitura off-cycle — sem re-render
    const data = useAppStore.getState().entities[id];
    meshRef.current.position.set(data.x, data.y, data.z);
  });
  return <mesh ref={meshRef} geometry={cached} material={cached} />;
};
```

- Use `InstancedMesh` para geometrias repetidas (módulos solares, fixadores).
- Ative `frameloop="demand"` + `invalidate()` manual para economizar GPU em cenas estáticas.
- Memorize geometrias e materiais fora do componente — nunca instancie `new THREE.Vector3()` dentro do JSX.

### 6. Cálculos Pesados (Off-Main-Thread)

- Delegue simulações (irradiância, perdas elétricas, trigonometria de terreno) para **Web Workers**.
- Use **Comlink** para expor a API do Worker como métodos async — elimina `postMessage` manual.
- Para kernels de cálculo nativos (C/C++/Rust), compile para **WebAssembly** e execute dentro do Worker.
- Para dados massivos (matrizes de floats), use **SharedArrayBuffer** + **Atomics** para zero-copy.
- Proteja escritas concorrentes com Atomics.wait/notify ou spinlocks.

## Handoff para Outras Skills

| Entrega | Destinatário |
|---|---|
| Contrato de estado (stores, hooks, tipos) | `the-builder` |
| Layout visual dos painéis (Outliner, Inspector, Ribbon) | `design-lead` |
| Validação final do artefato | `dike` |

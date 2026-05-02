---
name: pv-simulation-engine
description: Especialista em simulação fotovoltaica off-thread (TMY, irradiância, sombreamento), colaboração multiplayer em tempo real (CRDTs, Command Pattern) e transferência zero-copy via SharedArrayBuffer. Ativado em tarefas de cálculo pesado de engenharia PV, undo/redo multiplayer ou integração Worker↔WASM.
---

# Skill: PV Simulation Engine

## Gatilho Semântico

Ativado quando a tarefa envolve: simulação de produção de energia (TMY/8760h), cálculo de sombreamento por raytracing, perdas elétricas em strings/cabos DC, modelagem de fluxo de potência, delegação de cálculos pesados para Web Workers ou WASM, integração SharedArrayBuffer/Atomics, colaboração multiplayer em tempo real (CRDTs/OT), ou sistema de undo/redo com isolamento por cliente em cenários concorrentes.

## ⛔ Escopo de Não-Intervenção (Hard Boundaries)

- ❌ Viewport WebGL, Scene Graph, R3F, ResizeObserver — responsabilidade do `webgl-architect`
- ❌ Estado paramétrico 3D, metadados glTF, sincronização Leaflet↔3D — responsabilidade do `parametric-3d-engineer`
- ❌ UI, CSS, componentes visuais — responsabilidade do `design-lead`
- ❌ Endpoints de API, data fetching, hooks de query — responsabilidade do `the-builder`
- ❌ Schema de banco de dados, migrations, infraestrutura de deploy

## Protocolo (5 Pilares)

### 1. Simulação Off-Thread (Web Workers)

1. **Nunca** execute cálculos com complexidade ≥ O(n²) na Main Thread.
2. Delegue para **Web Workers** dedicados: irradiância horária, perdas elétricas, sombreamento.
3. Use **Comlink** para expor a API do Worker como métodos `async` — elimina `postMessage` manual:
   ```ts
   // worker.ts
   import { expose } from 'comlink';
   const SimEngine = {
     async calculateTMY(lat: number, lon: number, panels: Float64Array): Promise<Float64Array> {
       // 8760 iterações horárias
     }
   };
   expose(SimEngine);
   ```
4. Para kernels nativos (Rust/C++), compile para **WebAssembly** e execute dentro do Worker.
5. Exiba progresso na UI via `postMessage` parcial (ex: % concluído) sem bloquear o render loop.

### 2. Transferência Zero-Copy (SharedArrayBuffer + Atomics)

1. **Prefira SharedArrayBuffer** sobre `postMessage` para matrizes numéricas grandes (posições XYZ, irradiância, temperaturas).
2. Aloque o buffer na Main Thread e passe a referência ao Worker — ambos leem/escrevem sem cópia:
   ```ts
   const sharedBuf = new SharedArrayBuffer(panelCount * 3 * Float64Array.BYTES_PER_ELEMENT);
   const positions = new Float64Array(sharedBuf);
   worker.postMessage({ sharedBuf }); // transferência por referência, não por cópia
   ```
3. Proteja escritas concorrentes com **`Atomics.wait()`/`Atomics.notify()`** ou flag de controle.
4. Verifique `crossOriginIsolated === true` no bootstrap da aplicação (requer headers COOP/COEP).

### 3. Sombreamento por Raytracing

1. O cálculo de sombras entre fileiras (pitch-to-pitch) é iterativo e massivo — **obrigatório em Worker**.
2. Inputs: geometria dos painéis, posição solar horária (azimute + elevação), topografia do terreno.
3. Outputs: fator de sombreamento por painel por hora → matriz `[panelCount × 8760]`.
4. Use **InstancedBufferGeometry** para representar colisões — nunca percorra meshes individualmente.
5. Retorne resultados via SharedArrayBuffer para que o viewport consulte sem latência.

### 4. Undo/Redo Multiplayer (Command Pattern + CRDTs)

1. **Single-player**: Use Immer Patches via `zundo` (coberto pelo `parametric-3d-engineer`).
2. **Multiplayer**: Adote o **Command Pattern** com objetos que encapsulam `execute()` e `undo()`:
   ```ts
   interface Command {
     execute(): void;
     undo(): void;
     metadata: { userId: string; timestamp: number; entityIds: string[] };
   }
   ```
3. **Isolamento por cliente**: Cada pilha de histórico contém apenas os Commands do operador local.
4. **Resolução de conflitos**: Integre CRDTs (ex: Liveblocks, Yjs) para sincronização do estado base.
5. **Falha graciosa**: Se o `undo()` referencia uma entidade deletada por outro usuário, falhe silenciosamente — nunca lance exceções que quebrem a renderização.
6. **Agrupamento transacional**: Durante drags contínuos, use `history.pause()` no `pointerdown` e `history.resume()` no `pointerup` para consolidar micromovimentos em uma única operação revertível.

### 5. Cálculos de Engenharia Elétrica PV

1. **Perdas em cabos DC**: Modelar queda de tensão cumulativa em strings paralelas de comprimento variável.
2. **Fluxo de potência**: Resolver matrizes de admitância nodal para verificar equilíbrio de corrente no ponto de interconexão.
3. **TMY (Typical Meteorological Year)**: Loop de 8.760 horas obrigatoriamente em Worker — nunca na Main Thread.
4. **Resultados**: Exponha via hook assíncrono para que a UI consuma sem bloqueio:
   ```ts
   const { result, progress, isRunning } = useSimulation('tmy', { lat, lon, config });
   ```

## Handoff para Outras Skills

| Entrega | Destinatário |
|---|---|
| Resultados de simulação (arrays, métricas) para exibir no viewport | `webgl-architect` |
| Estado normalizado dos resultados para persistir | `parametric-3d-engineer` |
| Hooks de consumo dos resultados (useSimulation, useShading) | `the-builder` |
| Visualização dos resultados em painéis UI (gráficos, tabelas) | `design-lead` |
| Validação final do artefato | `dike` |

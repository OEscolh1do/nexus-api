---
name: parametric-3d-engineer
description: Especialista na arquitetura híbrida 2D/3D (Leaflet + WebGL), metadados glTF, estado normalizado (Zustand/Jotai) e dimensionamento funcional.
---

# Skill: Parametric 3D Engineer

## Gatilho Semântico

Ativado quando: "criar componente 3D", "integrar modelo glTF", "mapear propriedades WebGL", "sincronizar Leaflet e 3D", "validar elétrica no 3D", ou quando houver tarefas especificamente exigindo manipulação de React Three Fiber, `EXT_structural_metadata` ou sincronização de estado Zustand/Jotai do canvas híbrido.

## Protocolo

1. **Priorizar a Camada Funcional (`useTechStore`)**: Antes de alterar ou instanciar qualquer geometria, certifique-se de que os metadados elétricos, térmicos e físicos do componente estejam validados e sincronizados no estado global (Zustand). A geometria é apenas uma consequência da função.
2. **Estado Normalizado (Zustand/Jotai)**: 
   - Ao adicionar ou manipular dados que afetem tanto o Viewport 2D (Leaflet) quanto o 3D, faça-o através de dicionários/Hash Maps normalizados por UUIDs no Zustand, em oposição a árvores JSON profundas.
   - Para micro-interações na UI (como um *slider* controlando inclinação) que não devem forçar renderizações globais, utilize átomos granulares do **Jotai**.
3. **Metadados glTF e Interações WebGL**:
   - Utilize a extensão `EXT_structural_metadata` para injetar ou ler inteligência (como as capacidades do MPPT ou as dimensões do módulo) diretamente dos binários `.glb` carregados.
   - Garanta a fluidez em redimensionamentos (ResizeObserver) configurando o componente raiz do React Three Fiber com `resize={{ debounce: 0 }}`.
4. **Histórico Imutável (Undo/Redo)**:
   - Para toda a manipulação do histórico de edições do Workspace, grave exclusivamente *deltas de estado* (Immutable Patches via **Immer / zundo**). Nunca armazene cópias completas do escopo das instâncias de projeto.

## Limitações e Boas Práticas

- **NÃO** duplique os dados de componentes paramétricos. As propriedades nunca devem ser mantidas localmente na malha 3D (`Mesh`) sem uma *Single Source of Truth* no Zustand.
- **NÃO** use Zustand para interações atômicas ultra-frequentes da interface (use Jotai para não disparar *re-renders* da árvore).
- **NÃO** contamine o domínio de design visual genérico (estilos de botões, cores de theme fora do viewport) – estas são funções para o `design-lead`. Esta skill restringe-se rigorosamente à arquitetura paramétrica, metadados e renderização do Workspace técnico híbrido.

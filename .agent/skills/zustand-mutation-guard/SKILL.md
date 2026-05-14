---
name: zustand-mutation-guard
description: Audita funções de atualização de estado no Zustand para prevenir vazamentos de referência (Shared Reference Bugs) em estruturas de dados aninhadas.
---

# Skill: Zustand Mutation Guard

## Gatilho Semântico

Ativado quando: o usuário pede para revisar, auditar ou criar lógica de store no Zustand; quando há relatos de bugs envolvendo "dados que mudam juntos" ou "estado que vaza"; ou quando a tarefa envolve manipulação de arrays/objetos aninhados dentro de `set(state => ...)`.

## Protocolo

1. **Rastreio de Aninhamento:** Analise o modelo de dados alvo. Se houver mais de um nível de profundidade (ex: `inverters -> mpptConfigs -> strings`), acione o modo de vigilância contra cópia rasa.
2. **Auditoria de Operador Spread:** Verifique se as funções de atualização usam o operador spread (`...`) sem iterar sobre os arrays/objetos filhos. Se sim, sinalize como vazamento de referência potencial (Shared Reference Bug).
3. **Mapeamento Explícito:** Proponha a refatoração usando `.map()` recursivo para garantir o Deep Clone e Isolamento de Estado em cada nível da árvore.
4. **Isolamento de Identidade:** Ao instanciar clones baseados em templates, garanta que IDs internos (ex: IDs de strings filhas) sejam regenerados (`Math.random().toString(36)`) para evitar colisões de chaves de renderização no React.
5. **Reset de Estado Ativo:** Verifique se as novas entidades clonadas carregam "dados operacionais" indesejados (ex: `modulesCount > 0` clonado de uma base). Recomende forçar o reset desses campos para evitar alucinação de dados na interface.

## Limitações e Boas Práticas

- Esta skill **NÃO** deve tentar introduzir bibliotecas externas de mutação (como `immer`) se o projeto segue o padrão Vanilla Zustand (definido pelo `kurupira-canon`).
- Foca estritamente na **integridade de mutação em estruturas aninhadas**; otimização de performance (uso de selectors) ou persistência local são escopos paralelos.

---
description: Caça a Anti-patterns e Dívidas Técnicas no React
---

# Fluxo de Trabalho: Auditoria de Más Práticas (Code Smells) no React

Garante que a manutenibilidade do ERP não degrade com o tempo. A arquitetura deve permanecer limpa e previsível.

1. **Identificação de "Componentes Deus" (Monólitos)**:
   - Vasculhe views (ex: `src/views/`) buscando arquivos React (`.tsx`) com mais de ~300 linhas de código.
   - **Solução**: Isole modais, formulários pesados, tabelas e lógicas de busca em subcomponentes na mesma pasta ou em `src/ui/`.

2. **Auditoria de "Prop Drilling" Excessivo**:
   - Observe se o estado de uma View "Pai" está sendo repassado por mais de 3 níveis de profundidade via `props` (ex: `Pai -> Filho -> Neto -> Botão`).
   - **Solução**: Abstenha-se de repassar a prop. Refatore usando `Zustand` (para estados complexos compartilhados), `Context API` (temas/UI) ou mova o fetch para o nível onde ele é realmente consumido (com `SWR` ou `React Query`).

3. **Bloqueio de Mutações de Estado e Imutabilidade**:
   - Cace o uso de `.push()`, `.splice()` ou reatribuições diretas a variáveis advindas de um `useState` (`array[0] = novoValor`).
   - **Solução**: Sempre produza novos arrays/objetos (`[...array Antigo, novoItem]`, `.map`, `.filter`).

4. **Remoção da Tipagem Cega (`any`)**:
   - O uso de `any` ou `// @ts-ignore` em TypeScript quebra a segurança que a linguagem provê. Onde a API retorna algo desconhecido, prefira referenciar com `unknown` e realizar Runtime Checks (Zod parses) ou adicione as Interfaces corretas (`interface IUser`).

5. **Excesso de useEffects Sincronizadores**:
   - Evite usar `useEffect` para sincronizar dois `useStates` locais. Se o Estado B pode ser derivado diretamente do Estado A durante o render da função, ele não deveria sequer ser um `useState`. (ex: estado `filteredList` derivado de `list` e `search`).

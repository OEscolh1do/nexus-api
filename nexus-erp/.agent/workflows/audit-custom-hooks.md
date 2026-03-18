---
description: Extração de Lógica de Negócio para Custom Hooks
---

# Fluxo de Trabalho: Auditoria de Custom Hooks e Separação de Responsabilidades

Views React devem ser **declarativas e finas**. Toda lógica de negócio (fetches, transformações de dados, handlers complexos) deve viver em Custom Hooks isolados, mantendo o componente legível em menos de ~150 linhas.

1. **Identificação de Views Gordas**:
   - Views com mais de ~200 linhas **e** que contenham `useEffect`, chamadas API, lógica de filtro/ordenação e `useState` misturados são candidatas à extração.
   - **Regra de ouro**: Se o arquivo da View tem mais lógica do que JSX, refatore.

2. **Padrão de Extração de Custom Hook**:
   - Mova todo o estado, efeitos e handlers para um arquivo `src/hooks/useNomeDoRecurso.ts`.
   - O hook deve expor apenas o necessário para o componente: `{ data, isLoading, error, handleSubmit, handleDelete }`.
   - Exemplo: `useClientesList()`, `useCreatePedido()`, `useEstoqueFilters()`.

3. **Separação: Presentational vs. Container (Smart vs. Dumb)**:
   - **Container (Smart)**: Componente ou Hook que sabe donde vêm os dados e como tratá-los.
   - **Presentational (Dumb)**: Componente que recebe dados via `props` e apenas renderiza JSX. Não deve ter `useEffect` ou chamadas diretas de API.
   - Prefira ter Views como Containers que compõem subcomponentes Presentational.

4. **Composição de Hooks ao Invés de Monólitos**:
   - Um hook complexo pode ser composto de outros mais simples.
   - Exemplo: `useFornecedor()` pode internamente usar `useFornecedorData()` + `useFornecedorForm()` + `useFornecedorPermissions()`.

5. **Localização dos Arquivos**:
   - Hooks **específicos de uma feature** ficam em `src/views/[modulo]/hooks/`.
   - Hooks **reutilizáveis globalmente** ficam em `src/hooks/`.
   - Funções utilitárias puras (sem estado React) ficam em `src/lib/utils/`.

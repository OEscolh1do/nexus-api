---
description: Auditoria de Padronização de Data Fetching e Server State
---

# Fluxo de Trabalho: Auditoria de Data Fetching e Server State

O maior antipadrão de ERPs React são chamadas API (`axios`/`fetch`) espalhadas diretamente dentro de `useEffect` em Views, sem cache, sem invalidação e sem tratamento de estados de loading/error padronizado.

1. **Identificação de `useEffect` para Fetch Direto**:
   - Busque em `src/views/` padrões como `useEffect(() => { axios.get(...).then(...) }, [])`.
   - Esses blocos são candidatos diretos à migração para **React Query** (`@tanstack/react-query`).
   - **Solução**: Extraia o fetch para um Custom Hook (ex: `useUsers.ts`) e utilize `useQuery` ou `useMutation` para obter loading, error, data e refetch automaticamente.

2. **Onde Cada Tipo de Estado Deve Viver**:
   - 🔵 **Estado Local** (`useState`): UI efêmera — toggle de modal, valor de input controlado.
   - 🟢 **Server State** (`React Query` / `SWR`): Dados vindos da API — listas, entidades. Use `queryKey` descritivos.
   - 🟡 **Estado Global** (`Zustand`): Estado de UI compartilhado entre rotas — usuário autenticado, tema, toasts.
   - Não misture as três camadas no mesmo componente sem justificativa.

3. **Invalidação e Sincronização de Cache**:
   - Após uma mutação bem-sucedida (criar, editar, deletar), o cache da query correspondente deve ser invalidado via `queryClient.invalidateQueries({ queryKey: ['entidade'] })`.
   - Isso evita bugs de "lista desatualizada após salvar".

4. **Tratamento Padronizado de Loading e Erro**:
   - Todos os `useQuery` devem ter seus estados `isLoading` e `isError` consumidos para exibir `<Skeleton />` e `<ErrorFallback />` respectivamente.
   - Nunca deixe a tela em branco enquanto dados carregam.

5. **Configuração Global do QueryClient**:
   - Verifique se o `QueryClient` em `main.tsx` está configurado com `staleTime` e `retry` razoáveis para o contexto da API (ex: `staleTime: 1000 * 60 * 2` — dados frescos por 2 minutos).

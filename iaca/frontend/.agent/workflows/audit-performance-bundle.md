---
description: Auditoria de Performance e Tamanho do Bundle no Vite
---

# Fluxo de Trabalho: Auditoria de Performance e Tamanho do Bundle

Projetos grandes como o Nexus ERP precisam de atenção contínua à velocidade de carregamento inicial e otimização de memória.

1. **Análise de Tamanho do Bundle**:
   - Rode o comando de build `npm run build` para checar os tamanhos dos arquivos gerados.
   - Considere integrar ou usar `rollup-plugin-visualizer` para identificar dependências grandes e verificar a necessidade delas.

2. **Code Splitting (Lazy Loading)**:
   - Rotas pesadas, grandes modais ou gráficos devem usar `React.lazy` e `Suspense`. 
   - Exemplo: Carregue bibliotecas de gráficos complexos (como Chart.js ou Recharts) apenas onde a View for acionada.

3. **Auditoria de Renderização no React**:
   - Revise o uso de `useEffect`. As dependências estão corretas? Não há loops infinitos? O cleanup function (return do useEffect) está debelando event listeners e timeouts?
   - Identifique e aplique memoização (`useMemo`, `useCallback` ou `React.memo()`) em componentes puramente visuais, tabelas pesadas ou em cálculos dispendiosos. Evite memoização prematura.

4. **Imagens e Assets Estáticos**:
   - Imagens que ficam dentro de `/public` ou carregadas estaticamente devem ser compactadas (WebP preferencialmente).
   - Componentes que lidam com listas extensas devem implementar virtualização (`react-window` ou paginação via query na API).

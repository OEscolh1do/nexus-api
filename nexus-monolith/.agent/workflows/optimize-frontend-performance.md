---
description: How to audit and optimize React performance, fixing re-render loops and main thread bottlenecks
---

# Otimização de Performance Frontend (Render Loop Forensics)

## Quando Usar
- Aplicação "congelando" ao digitar em inputs
- Filtros de tabela que demoram para refletir visualmente
- Dashboards piscando componentes inteiros ao receber updates
- O profiler do React aponta componentes re-renderizando milhares de vezes

## Passo 1: Caçando o Re-Render Loop (Diagnóstico)

O loop infinito de renderização na árvore React é o ladrão de performance nº 1. Use essas métricas mentais e de código para auditar:

1. **Log Tático:**
   Coloque um simples `console.log("Renderizando Componente X")` na raiz do componente problemático. Se ele cuspir dezenas de mensagens por segundo sem ação do usuário, você achou o gargalo.

2. **Array de Dependências Suspeito (`useEffect`):**
   Procure por `useEffect` que tem objetos ou arrays, ou funções não memoizadas, em seu array de dependências.
   ```tsx
   // ❌ O objeto `config` é recriado a cada render, engatilhando infinito loop
   const config = { max: 10 };
   useEffect(() => { ... }, [config]);
   ```

3. **Prop Drilling de Funções Não-Memoizadas:**
   Está passando uma função via Props para um componente filho "pesado" (como um Gráfico ou Tabela)?
   ```tsx
   // ❌ Quebra o memo da Tabela a cada render
   <TabelaPesada onRowClick={(id) => doSomething(id)} />
   ```

## Passo 2: Cirurgia de Otimização

Aplique estas correções dependendo do diagnóstico:

### 1. Memoização Tática (`useCallback` / `useMemo`)
Se filhos causam re-render porque funções/objetos pai são recriados:
```tsx
const memoizedCallback = useCallback((id) => doSomething(id), [deps]);
const memoizedConfig = useMemo(() => ({ max: 10 }), []);
```

### 2. Lifing State Down (Descer o Estado Local)
Se você tem um Modal que abre/fecha e o state `isOpen` está no componente PAI de uma Página gigantesca, **desça o state**. Isolar states em componentes menores reduz o impacto na árvore.

### 3. Debounce / Throttle em Entradas Rápidas
Em campos de busca ou dimensionamentos em tempo real:
```tsx
// Nunca dispare Axios ou cálculos pesados num onChange direto de input text
const [searchTerm, setSearchTerm] = useState("");
const debouncedSearch = useDebounce(searchTerm, 500); // Executa busca apenas após calmaria de 500ms
```

### 4. Extração Contextual vs Zustand
Se um Context Provider está mudando frequentemente (ex: estado de progresso de upload) e forçando toda a app a re-renderizar, a arquitetura está falha. Move states de alta frequência para Zustand ou reduza a árvore envolta no Provider.

## Checklist Final
- [ ] Console limpo de logs de renderização frenéticos?
- [ ] Funções passadas a componentes memoizados (React.memo) estão dentro de `useCallback`?
- [ ] O digitador em inputs textuais não sofre lag de UI?

// turbo
## Verificação de Compilação
```bash
cd frontend && npm run build
```

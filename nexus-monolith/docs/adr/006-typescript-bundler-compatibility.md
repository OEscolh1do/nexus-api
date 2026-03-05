# ADR 006: Compatibilidade TypeScript com Bundlers (Vite)

## Status

Aceito

## Contexto

Durante a expansão do módulo Commercial, encontramos um erro crítico de runtime:

```
Uncaught SyntaxError: The requested module '/src/modules/commercial/types/index.ts'
does not provide an export named 'CreateDealPayload'
```

### Causa Raiz

A configuração inicial do `tsconfig.app.json` utilizava `"verbatimModuleSyntax": true`, uma flag que força o TypeScript a preservar a sintaxe literal de imports/exports. Quando o Vite (via esbuild) transpila o código, ele realiza **type erasure** (remoção de tipos puros como `interface` e `type`) sem análise completa do grafo de módulos, causando a perda de exports type-only no runtime.

### Impacto Arquitetural

Conforme [ADR-001](./001-modular-monolith.md), a estrutura de módulos compartilha tipos entre Backend e Frontend via `modules/{domain}/types/`. Qualquer incompatibilidade na exportação de tipos quebra:

- **Event Payloads** ([ADR-004](./004-event-driven-architecture.md))
- **Sync Schemas Offline-First** ([ADR-005](./005-offline-first.md))
- **Validação Zod compartilhada**

## Decisão

Substituir `verbatimModuleSyntax` por `isolatedModules` no `tsconfig.app.json`.

```diff
// tsconfig.app.json
-    "verbatimModuleSyntax": true,
+    "verbatimModuleSyntax": false,
+    "isolatedModules": true,
```

### Justificativa

1. **`isolatedModules`** é a flag recomendada pela documentação oficial do Vite para projetos TypeScript
2. Garante que cada ficheiro pode ser transpilado isoladamente (requisito do esbuild)
3. Não remove exports de tipos durante o processo de bundling
4. Compatível com a arquitetura de tipos compartilhados (ADR-001)

### Alternativa Rejeitada

Manter `verbatimModuleSyntax` e refatorar todos os imports para usar `import type` explícito:

```typescript
import type { CreateDealPayload } from "...";
```

**Motivo da Rejeição:** Alto custo de refatoração (20+ ficheiros), risco de regressão em módulos críticos (Ops, Commercial), e complexidade de manutenção para novos desenvolvedores.

## Consequências

### Positivas

- **Correção Imediata:** Zero refatoração de código existente
- **Compatibilidade:** Alinhado com best practices Vite + React
- **Robustez:** Tipos compartilhados funcionam consistentemente em todos os módulos

### Negativas

- **Perda de Verificação:** `verbatimModuleSyntax` oferecia validação mais estrita de re-exports implícitos (trade-off aceitável)

## Compliance

Novos módulos devem seguir a estrutura padrão de `types/index.ts` com exports explícitos. A configuração `isolatedModules` garante compatibilidade automática com o bundler.

## Referências

- [Vite TypeScript Guide](https://vitejs.dev/guide/features.html#typescript)
- [TypeScript Compiler Options: isolatedModules](https://www.typescriptlang.org/tsconfig#isolatedModules)
- Walkthrough da correção: `.gemini/antigravity/brain/564c588d-8718-4e1c-bd34-f3bc446ec54c/walkthrough.md`

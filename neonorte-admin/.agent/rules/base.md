# Regras Base — Neonorte Admin

## TypeScript / JavaScript

1. **Backend**: CommonJS (`require` / `module.exports`). Alinhado com Iaçã e Kurupira.
2. **Frontend**: ESM + TypeScript strict. `noImplicitAny: true`.
3. **Sem `any`**: Use tipos explícitos ou `unknown` + type guards.
4. **Naming**:
   - Variáveis/funções: `camelCase`
   - Componentes React: `PascalCase`
   - Constantes: `UPPER_SNAKE_CASE`
   - Arquivos: `camelCase.js` (backend), `PascalCase.tsx` (componentes React), `camelCase.ts` (utils)
5. **Imports**: Agrupar por origem (node_modules → lib → componentes → tipos). Linha em branco entre grupos.
6. **Early returns**: Preferir `if (!x) return` sobre `if (x) { ... }` aninhado.
7. **Error handling**: Sempre capturar erros de chamadas HTTP e queries Prisma. Nunca deixar promise sem catch.

## Clean Code

1. **Funções curtas**: Máximo 40 linhas. Extrair funções auxiliares se necessário.
2. **Sem magic numbers**: Usar constantes nomeadas.
3. **Sem console.log em produção**: Usar logging estruturado.
4. **Sem código comentado**: Deletar, não comentar. Git é o histórico.
5. **DRY com critério**: Duplicação é preferível a uma abstração errada.

## Git

1. **Commits atômicos**: Uma mudança lógica por commit.
2. **Mensagens descritivas**: `feat(admin): add tenant listing endpoint` (Conventional Commits).

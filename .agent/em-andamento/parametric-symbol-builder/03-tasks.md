# Spec 03: Quebra em Passos Atômicos (Tasks)

Use os checkboxes abaixo para avançar a implementação de forma contínua e segura. Não pule etapas.

## Fase 1: Fundação de Dados (Backend **Kurupira**)
- [x] **(IC-03 — pré-requisito)** Antes da migração Prisma, auditar e adicionar `mpptCount: z.number().int().positive().optional()` ao `InverterSpecsSchema` em `kurupira/frontend/src/core/schemas/equipment.schemas.ts`. O campo já existe no banco mas não no schema Zod do frontend.
- [x] **(Ciclo 2)** Alvo correto da migração: editar **`kurupira/backend/prisma/schema.prisma`** adicionando `symbolConfig Json?` no model `InverterCatalog`. O `sumauma/backend/prisma/schema.prisma` é de tenants/usuários e não possui esse model. O `schema-kurupira.prisma` é read-only (Sumaúma) e não deve ser editado.
- [x] Gerar migração Prisma no contexto do Kurupira backend (`npx prisma migrate dev --name add_symbol_config`).
- [x] **(Ciclo 2)** A validação Zod estrita do `ParametricSymbolConfig` deve ser adicionada nas rotas **`kurupira/backend/src/routes/internal/catalog/`** (ou equivalente), pois o BFF do Sumaúma (`sumauma/backend/src/routes/catalog.js`) é um proxy M2M puro que repassa o body sem validar. Usar `z.discriminatedUnion('type', [parametricBlockSchema])` antes de `prisma.inverterCatalog.update()`.
- [ ] Gerar Prisma Clients.

## Fase 2: Symbol Builder (Frontend Sumaúma)
- [x] **(IC-04)** Definir a interface TypeScript `ParametricSymbolConfig` com chaves tipadas (`PortKey = \`mppt_${number}_${'pos' | 'neg'}\` | 'ac_out'`) e a interface `ParametricPort` (com campos `polarity` e `mpptIndex`) em pasta de schemas globais.
- [x] Criar o componente React `<ParametricSymbolBuilder />` (UI administrativa) com estado `useState` local (não Zustand).
- [x] Implementar a adição de par de pinos (`mppt_N_pos` / `mppt_N_neg`) na lateral esquerda (`side: 'left'`) para os canais MPPT, com redistribuição automática do `offset`.
- [x] Implementar o pino CA fixo (`ac_out`) na direita (`side: 'right'`, `offset: 0.5`) gerado automaticamente.
- [x] Conectar o output desse Builder ao submit do formulário de criação/edição de inversores do Catálogo.

## Fase 3: Motor Técnico de Renderização (Frontend Kurupira)
- [x] **(Ciclo 2)** A store correta é `useTechStore` (não `useSolarStore`). Adicionar `symbolConfig?: ParametricSymbolConfig | null` ao tipo `InverterState.snapshot` em `useTechStore.ts`. Popular o campo via `addInverter()` a partir dos dados de catálogo (que chegam via `useCatalogStore`, onde `unifilarSymbolRef` já é mapeado).
- [x] Atualizar o `InverterSpecsSchema` em `equipment.schemas.ts` para adicionar `symbolConfig` (tipado como `ParametricSymbolConfig | null`) e `mpptCount` (caso não tenha sido feito na Fase 1).
- [x] Criar o componente SVG customizado `<DynamicParametricBlock />` para traduzir o JSON do Sumaúma em visuais 2D na Layer 3 do Canvas de Arranjo. Implementar o prop `activePortKey?: PortKey` para destaque de terminal ativo.
- [x] **(IC-01)** **CRIAR** (o arquivo não existe) o módulo `kurupira/frontend/src/modules/engineering/ui/panels/canvas-views/electrical/symbols/registry.ts` com a função `getSymbol()` lendo `symbolConfig` de `useTechStore` e usando `unifilarSymbolRef` (de `useCatalogStore`) como fallback.
- [ ] Testar a conexão: verificar se o Sugiyama constrói corretamente o `portKey` via `` `mppt_${mpptConfig.mpptIndex}_pos` `` e que `PORT_NOT_FOUND` é lançado quando a porta não existe no `symbolConfig`.

## Fase 4: Revisão de Riscos (Analyze & Security)
- [x] Certificar que a migração não impactou registros legados (Inversores antigos retornarão `null` em `symbolConfig`, portanto o fallback para `unifilarSymbolRef` → IEC 60617 deve ser acionado — nunca lancar `undefined`).
- [ ] **(IC-02)** Analisar o Web Worker do Sugiyama para prevenir travamentos: se o `portKey` calculado via `mpptIndex` não existir no `symbolConfig.ports` do inversor (porta deletada/renomeada no Sumaúma), emitir `ValidationIssue` com código `PORT_NOT_FOUND` e bloquear o roteamento da aresta afetada. Adicionar rule de BFF no Sumaúma que impede remoção de porta se houver `TechnicalDesign` ativo referenciando o inversor.
- [x] Garantir que inputs de usuário (labels das portas) inseridos no Sumaúma não injetem XSS no SVG do Kurupira. Sanitizar via `DOMPurify` ou escapamento manual antes de inserir em atributos SVG.
- [x] **(Gap JSONB)** Validar que a rota de escrita executa o schema Zod (Feito no Kurupira Backend, que é o Source of Truth M2M, conforme Planejamento).

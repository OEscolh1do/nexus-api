# Dívidas Técnicas / Backlog de Espera (`aguardando`)

Este documento serve como a **Fila Oficial de Dívidas Técnicas (Tech Debts)**. Ele agrupa os `@deprecated`, `TODO`, `HACK` e `FIXME` encontrados em todo o repositório Kurupira.

Sempre que executar a rotina de limpeza técnica, puxe os itens daqui.

---

## 1. Alta Prioridade (Impacto em UX / Cálculo)

### A. Integração Completa de Radiação com Coordenadas
- **Arquivo:** `kurupira/frontend/src/modules/engineering/utils/generationSimulation.ts`
- **Débito:** `TODO: Retrieve real HSP from clientData.weatherData or lat/lng API`
- **Descrição:** Atualizar o simulador de geração 2D/3D no Canvas para não usar dados mockados e, em vez disso, forçar o consumo dos dados climáticos reais (CRESESB/INPE) baseados no recém adicionado `clientData.lat` e `clientData.lng`.

### B. Integração de Store nos Relatórios Oficiais
- **Arquivo:** `kurupira/frontend/src/modules/documentation/components/TechnicalMemorandum.tsx`
- **Arquivo:** `kurupira/frontend/src/modules/documentation/components/CommissioningChecklist.tsx`
- **Débito:** `TODO: Integrar com useSolarStore() para puxar dados reais`
- **Descrição:** O check-list de comissionamento e o memorial técnico usam dados estáticos (mocks temporários) em tela. Precisam plugar nos reativos `useSolarStore` via os seletores já existentes (`selectModules`, `selectInverters`).

---

## 2. Média Prioridade (Features Faltantes)

### A. Exportação PDF da Documentação
- **Arquivo:** `kurupira/frontend/src/modules/documentation/components/TechnicalMemorandum.tsx`
- **Débito:** `TODO: Adicionar exportação para PDF`
- **Descrição:** Implementar React-to-PDF ou ferramenta de Print de UI nativa para que o engenheiro possa gerar a RT (Responsabilidade Técnica) com sumário para download após gerar o projeto.

### B. Check de Comissionamento em Campo
- **Arquivo:** `kurupira/frontend/src/modules/documentation/components/CommissioningChecklist.tsx`
- **Débito:** `TODO: Adicionar campos de input para valores medidos`
- **Descrição:** O formulário de checklist comissionado deve permitir edição dos campos pela UI para os instaladores no local tirarem fotos, colocarem multímetro, etc.

---

## 3. Baixa Prioridade (Dívida de Estrutura / Cleanup)

Esses são restos de código marcados para deleção após a estabilização das refatorações (Migração v2.1.0):

### A. `solarEngine.ts` e Workaround Financeiro
- **Débito:** `// For now, we will perform a "Hack" by calling calculate and then manually updating the financial result`
- **Ação Recomendada:** Unificar o payload financeiro com a engine principal e delegar o serviço de financeiro para o Kurupira Backend, ou criar um solver financeiro unificado no estado principal (o que remove o mock).

### B. Cleanup de Aliases Deprecated (`@deprecated`)
Estes devem ser deletados, e as referências soltas, corrigidas pela árvore:
- `useTechCalculations.ts` (`@deprecated Alias mantido para facilitar transição e não quebrar imports existentes. Use ModuleSpecs diretamente se possível.`)
- `clientSlice.ts` (`@deprecated V2.1.0` no campo `orientation` - Fonte da verdade migrada).
- `input.schemas.ts` (`@deprecated V2.1.0` - O campo migrou totalmente para `EngineeringInputSchema`).
- `catalogSlice.ts` (`@deprecated P8` - Já utilizamos completamente a `useCatalogStore` mas esse arquivo legado ficou no diretório e pode ser apagado em totalidade).

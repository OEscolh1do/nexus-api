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

Todos os itens listados nesta categoria foram resolvidos (Limpeza de solarEngine.ts, remoção do campo orientation legado, e deleção dos slices zumbis e hooks deprecados).

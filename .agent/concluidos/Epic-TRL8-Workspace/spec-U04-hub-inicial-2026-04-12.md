# Spec: U04 - Separação do Hub de Projetos do Workspace de Engenharia
**Tipo:** Refatoração de UX/Arquitetura
**Skill responsável pela implementação:** the-builder, design-lead
**Revisor de aceitação:** engenheiro-eletricista-pv
**Prioridade:** P0
**Origem:** revisão-arquitetural-2026-04-12

---

## Problema
Atualmente, o explorador de projetos (Hub) é tratado como apenas mais uma "aba" (`[Projetos]`) no fluxo de trabalho de engenharia, no mesmo nível hierárquico que `Dimensionamento` ou `Elétrico`. Isso é um anti-padrão de UX para ferramentas de engenharia/CAD. 

Ferramentas profissionais tratam a seleção de projetos como uma **antessala** (uma tela inicial cheia). Uma vez que um arquivo de projeto é aberto, o usuário é transportado para o **workspace de autoria**, e a aba "Projetos" desaparece, dando lugar aos menus de trabalho daquele projeto específico. A presença do botão "Projetos" no meio do header de engenharia consome espaço, confunde o modelo mental e abre margem para destruição acidental de estado se o engenheiro clicar nele durante uma sessão de projeto.

## Solução Técnica

1. **Remover "Projetos" (hub) da lista de abas (Tabs) do Workspace:**
   O módulo `hub` deixará de ser renderizado pelas abas do `ProfileOrchestrator`.
2. **Transformar em Roteamento de Tela / Estados Mutuamente Exclusivos:**
   O `<ProfileOrchestrator>` verificará se um projeto está ativo (ou se `currentModule === 'hub'`).
   - Se for `'hub'`: Renderiza apenas o `ProjectExplorer` ocupando 100% da tela (sem o header global cheio de abas de engenharia ou com um header mínimo focado na marca e usuário).
   - Se diferente de `'hub'`: Renderiza o esquema atual do Workspace (com o Top Ribbon contextualizado e as abas).
3. **Mecanismo de Retorno:**
   Dentro do Workspace (Ribbon ou Header), haverá um botão de ação rápida (ex: o ícone da Logo Neonorte ou um ícone `Home`/`Folder`) encapsulando o comando `setActiveModule('hub')` para que o engenheiro possa fechar o projeto atual e voltar explicitamente para a "Antessala".

## Arquivos Afetados

### Modificar
- `[MODIFY] kurupira/frontend/src/config/navigation.ts`
  - Remover o item `hub` do array `DASHBOARD_TABS`.
  - Isso garante que a aba nunca seja desenhada nos `.map()` do header global.
- `[MODIFY] kurupira/frontend/src/layout/ProfileOrchestrator.tsx`
  - Incluir um header exclusivo para o `hub` (ou renderizar o main limpo se o próprio explorer já tiver header).
  - Condicionar a renderização do `<header>` atual de abas APENAS quando `currentModule !== 'hub'`.
  - Garantir que um elemento visual dentro do workspace sirva de botão para voltar ao hub (ex: clicando na logo Neonorte).

## Critérios de Aceitação
- [ ] O componente `ProfileOrchestrator` não renderiza mais a aba "Projetos" na lista `DASHBOARD_TABS`.
- [ ] Ao carregar a tela inicial (`currentModule === 'hub'`), o workspace de engenharia com suas abas fica completamente oculto, mostrando o `ProjectExplorer` de forma imersiva.
- [ ] No header/workspace de engenharia, continua existindo uma via para voltar à tela inicial de Projetos.
- [ ] `tsc --noEmit` → EXIT CODE 0

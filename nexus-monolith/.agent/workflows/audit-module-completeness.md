---
description: How to audit a module for completeness, mapping missing features, unfinished UI/Dashboards, and backend gaps, and generate an action plan
---
# Análise de Completude de Módulo (Gap Analysis)

## Quando Usar
- Um módulo foi criado estruturalmente, mas possui telas em branco, placeholders ou funções mockadas.
- Dashboards e gráficos planejados na arquitetura não foram desenhados na interface.
- Rotas de API que deveriam alimentar a interface estão vazias ou não existem.
- É necessário avaliar o estado real atual do módulo em comparação com a especificação e propor um plano de ação (roadmap) para finalizá-lo.

## Passo a Passo de Execução

O Agente IA deve seguir as etapas abaixo rigorosamente para evitar alucinar capacidades que não existem de fato no código.

### 1. Discovery da Arquitetura e Visão Ideal
- Localize e leia o arquivo de documentação arquitetural do módulo (geralmente em `docs/map_nexus_monolith/<modulo>/...` ou `docs/README.md`).
- Extraia a "Visão Ideal": os fluxos de usuário, gráficos, indicadores (KPIs) e ações macro que o módulo *deveria* entregar à operação.

### 2. Varredura do Frontend (Verdade Nua da Interface)
- Acesse `frontend/src/modules/<modulo>/ui/` e `components/`.
- Analise minuciosamente para encontrar:
  - Componentes estáticos usando dados *hardcoded* (mocks) ou bibliotecas de mock.
  - Divs com textos do tipo "Em breve", "Under Construction" ou ausência completa de widgets (telas brancas/simples).
  - Chamadas onClick que fazem apenas `console.log` sem invocar os Services correspondentes.

### 3. Varredura do Backend (Limitações do Motor Lógico)
- Acesse `backend/src/modules/<modulo>/controllers/` e `services/`.
- Avalie o suporte aos dashboards mapeados na Visão Ideal descobrindo:
  - Falta de endpoints de agregação/BI para alimentar gráficos (ex: endpoints de `stats` ou `metrics`).
  - Blocos de código vazios ou rotas retornando `501 Not Implemented`.

### 4. Geração de Artefato Analítico (`gap_analysis.md`)
- Crie ou atualize um artefato markdown listando a realidade do módulo avaliado de forma nua e crua.
- Estrutura obrigatória do artefato:
  - **Realidade Atual (As-Is):** O que de fato carrega na tela do usuário hoje.
  - **Lacunas Visuais (UI/UX Gaps):** Lista exata dos painéis, abas e gráficos prometidos mas não desenhados.
  - **Lacunas Estruturais (Backend Gaps):** Lista dos endpoints de cálculo, filtros e entidades ausentes.

### 5. Proposta de Action Plan (Milestone Breakdown)
- Converta os Gaps descobertos em um plano de ataque sequencial (Milestones).
- Embase cada Milestone de forma que ele possa ser executado através da rotina `/refine-module`.
- **Exemplo de divisão:**
  - Milestone 1: Substituir Gráfico Dummy por Componente Recharts e Tipar o Frontend.
  - Milestone 2: Escrever a querie complexa no Prisma Service usando `withTenant` para alimentar o Recharts.
  - Milestone 3: Conectar a UI ao Banco.

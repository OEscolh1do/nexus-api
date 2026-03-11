# Lumi - Photovoltaic Sizing App (V3.2)

## 🎯 Visão Geral do Sistema e Propósito
Lumi é uma ferramenta especializada no dimensionamento técnico, análise comercial e geração de contratos para sistemas fotovoltaicos. Originalmente concebida como um módulo, evoluiu para atuar como um aplicativo independente (SaaS App Satélite) que se integra de forma transparente ao ecossistema Nexus Monolith (O ERP/Hub principal).
Seu propósito máximo é permitir que engenheiros e vendedores modelem sistemas solares com extrema precisão técnica (incluindo geometria solar, perdas, e BOS) e fluidez de navegação.

## ⚙️ Stack Tecnológica Detalhada
- **Plataforma Core**: React 19, Vite, TypeScript
- **Estilização**: TailwindCSS (Design System Customizado via Utils) / Glassmorphism UI
- **Gerenciamento de Estado**: Zustand (`solarStore` segmentado em Slices de Domínio)
- **Validação de Schema**: Zod
- **Backend / Infra**: Supabase Base/Auth
- **Integração Principal**: Rotas REST protegidas com o `nexus-monolith` (Master Data Management de Clientes e Workflows).
- **Componentes de UI**: Radix UI (Tabs, Tooltip), Recharts (Gráficos), Lucide React (Ícones)
- **Engine PDF**: jsPDF + html2canvas

## 🏛️ Decisões Arquiteturais e Padrões
1. **Modular Orchestration (ProfileOrchestrator)**: O aplicativo não utiliza React Router para a navegação primária das etapas comerciais. Ele usa renderização condicional por "Abas/Módulos" (`crm`, `engineering`, `proposal`) orquestradas globalmente para manter o estado unificado enquanto o usuário preenche a proposta comercial.
2. **Global State via Zustand**: Diferente do Nexus que depende pesadamente de React Query, o Lumi armazena todos os inputs do usuário em um grande store unificado e persistido localmente no `localStorage`. Isso permite drafts offline ou transição rápida entre abas.
3. **Domain Slices**: O `solarStore.ts` é quebrado em pedaços de domínio (`ClientSlice`, `TechSlice`, `EngineeringSlice`, `FinanceSlice`) garantindo limites de preocupação limpos.
4. **Calculadora Solar Isolada**: Toda a regra matemática de dimensionamento fotovoltaico está encapsulada na classe `SolarCalculator`, separada dos componentes visuais.

## 📖 Glossário de Domínio (Lumi)
- **HSP (Horas de Sol Pico)**: Fator de irradiação solar utilizado no cálculo de predição de geração.
- **BOS (Balance of System)**: O custo e dimensionamento de todo o sistema fora dos módulos e inversores (cabos, string box, estruturas de fixação, aterramento).
- **Voc (Tensão de Circuito Aberto)**: Dado crucial para cálculo de compatibilidade elétrica de string x inversor em baixas temperaturas históricas.
- **PR (Performance Ratio)**: Taxa de eficiência global da usina (geralmente fixada em torno de 75-80% considerando perdas por calor, sombreamento, sujeira e cabeamento).
- **Sizing (Dimensionamento)**: O ato científico de calcular quantos painéis cobrem o offset do consumo medido na fatura de energia.

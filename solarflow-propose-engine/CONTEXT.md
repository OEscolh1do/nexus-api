# Contexto da Aplicação: SolarFlow Engine - NeoNorte Engenharia

## Visão Geral
O **SolarFlow Engine** é uma plataforma de engenharia e vendas de sistemas fotovoltaicos desenvolvida para a **NeoNorte Engenharia**. A aplicação guia o engenheiro/vendedor desde a coleta de dados do cliente até a geração de uma proposta comercial e técnica detalhada.

## Stack Tecnológico
- **Core:** React 19 (Vite) + TypeScript
- **Estilização:** TailwindCSS (Design System Customizado: Neonorte Purple/Green)
- **Mapas:** Leaflet / React-Leaflet
- **Gráficos:** Recharts
- **Ícones:** Lucide-React
- **AI Integration:** Google GenAI (Gemini) para análise meteorológica e de irradiação.

## Estrutura do Projeto
- `src/components`: Componentes de UI e formulários de etapas.
- `src/services`: Motores de cálculo (`solarEngine.ts`) e integrações.
- `src/types.ts`: Definições de tipos TypeScript (Single Source of Truth para dados).
- `src/data`: Bancos de dados locais (JSON/TS) de Módulos e Inversores.

## Fluxo da Aplicação (Steps)
1. **Mapeamento (InputForm):** Dados do cliente, localização e faturas de energia.
2. **Demanda (EnergyFluxForm):** Análise de consumo, histórico e perfil de carga.
3. **Sizing (TechnicalForm):** Seleção de equipamentos (Módulos/Inversores), dimensionamento técnico (Overload, kWp).
4. **Análise (AnalysisPhase):** Integração com API AI/NASA para dados climáticos e predição de geração.
5. **Orçamento (ServiceCompositionPhase):** Composição de custos, serviços, margens e financeiro.
6. **Proposta (ProposalTemplate):** Geração do dossiê final para o cliente (Pronto para impressão).

## Design System (Neonorte V2)
### Paleta de Cores (Hierarquia Rígida)
- **Primária (Roxo)**: `#64147D` (Ações principais, Headers)
- **Primária (Verde)**: `#05CD46` (Sucesso, Destaques secundários/Accent)
- **Secundária (Roxo Claro)**: `#874BBE` (Hover, Fundos claros)
- **Secundária (Roxo Escuro)**: `#3C0A41` (Textos em fundo claro, Container de alto contraste)
- **Secundária (Roxo Profundo)**: `#1E002D` (Backgrounds Dark Mode)
- **Secundária (Verde Claro)**: `#73EB82` (Gráficos)
- **Secundária (Verde Escuro)**: `#146437` (Texto sobre verde)

### Tipografia
- **Títulos (Display)**: *Grammatika* (Fallback: Inter/Sans-serif)
- **Corpo/Dados**: *Consolas* (Fallback: Monospace)

### UI Patterns
- **Filtro de Imagem**: Overlay Roxo (`#64147D`) com 70% opacidade e Blend Mode `overlay`.
- **Formas**: Triângulos e linhas angulares (Grafismo Marajoara/N).
- **Estilo**: Flat/Material. Sem outlines no logo.

## Regras de Negócio Importantes
- **Cálculo de Geração:** Baseado em HSP (Horas de Sol Pleno), eficiência dos painéis e perdas (Performance Ratio).
- **Financeiro:** Cálculo de Payback, ROI e fluxo de caixa acumulado em 25 anos.
- **Engenharia:** Validação de compatibilidade elétrica (Tensão/Corrente) entre Arrray e Inversor (verificado no `TechnicalForm`).

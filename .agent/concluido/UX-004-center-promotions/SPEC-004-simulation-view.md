---
id: SPEC-004
epic: UX-004 Center Canvas Promotions
description: Simulation Canvas View (O Simulador de Consumo e Carga)
---

# SPEC-004: Simulation Canvas View

## 1. O Quê (Specify)
**Problema**: A Aba de "Simulação" no Dock é extremamente dependente de BarCharts simples. O projetista requer capacidade extrema paramétrica (Engine-level) para projetar com exatidão, lidar com sazonalidades pontuais e aditivar consumos hipotéticos (E.g. Aumento da Planta, Inserção de EV/Ar Condicionado) sem corromper ou mascarar as Faturas preenchidas da unidade.

**Objetivo**: Construir a sala do motor (Engine Room) do projeto solar. Um ecossistema massivo de `Recharts` que englobe relatórios diários de projeção (Campânula), mensais integrados e que possua uma camada interativa de "Virtual Loads".

**DoD (Definition of Done)**:
- Migração de Chart Simples para Gráficos Compostos (Curva Diária de Geração usando Tracking profile estático).
- Ferramenta "Load Simulator" funcional (via Hooks locais/Store independente transiente).
- Grids Paralelos "Tuning Grid" para HSP vs Load original vs Virtuais Loads em tempo real.

## 2. O Como (Plan)
1. **Modelagem de Cargas Transiente (`useLoadSimulatorStore`)**:
   - Criação de uma micro-store com Zustand local a visão ou apenas useStates ricos.
   - Entidade de carga: `{ id, nome, perfilMensalKwH[] }`. 
   - Ao somar o total global, a base da simulação empurrará o "Consumo Oficial" para cima dinamicamente nos Gráficos.
2. **Engine Gráfico de Múltiplos Eixos**:
   - Desenhar um Recharts com ComposedChart, mostrando a Barra de Consumo Base empilhada com a Barra de Consumo Extra Fictícia (Virtual Loads), e frente a ela, a Área Limpa da Geração Prevista.
3. **Análise Fina (Daily Curve - Simulada)**:
   - Baseado no algoritmo simplificado da posição do sol, desenhar a curva de senóide clássica da geração das 06h às 18h no ápice previsto (Verão vs Inverno via select).

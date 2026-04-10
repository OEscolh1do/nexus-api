---
id: SPEC-003
epic: UX-004 Center Canvas Promotions
description: Electrical Canvas View (Dimensionamento Dinâmico)
---

# SPEC-003: Electrical Canvas View

## 1. O Quê (Specify)
**Problema**: A Aba "Elétrica" no dock atua apenas operando sliders paramétricos globais ignorando a necessidade de análises paramétricas de cabeamento prontas para uso. A representação visual unifilar foi vetada em favor de um ambiente focado puramente em cálculos elétricos em campo.

**Objetivo**: Transformar o Canvas maximizado na "Calculadora de Cabos e Termodinâmica" avançada do projeto.

**DoD (Definition of Done)**:
- Migração técnica da lógica visual para abranger cálculos de cabeamento AC/DC.
- Construção de blocos "Deep Thermal Model" (Demonstrativos em Curvas I-V/P-V que simulam comportamento do estresse de V/C).
- Remoção absoluta de diagramas em fluxogramas relacionais (Árvore/Unifilar).

## 2. O Como (Plan)
1. **Cable Dimensioning**:
   - Criação de interface para dimensionamento de lances DC/AC.
   - Parâmetros: Bitola, Cobre/Alumínio, Metragem, Temperatura e Carga Ativa.
   - Output: Queda de Tensão (%) e aprovação sob a NBR.
2. **Thermal Model Visualization**:
   - Uma área dedicada à elaboração gráfica das restrições operacionais baseadas nos coeficientes importados do dock e de catálogos paramétricos.

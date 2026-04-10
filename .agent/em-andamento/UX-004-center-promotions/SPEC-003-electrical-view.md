---
id: SPEC-003
epic: UX-004 Center Canvas Promotions
description: Electrical Canvas View (Topologia de Hardware)
---

# SPEC-003: Electrical Canvas View

## 1. O Quê (Specify)
**Problema**: A Aba "Elétrica" no dock atua apenas operando sliders de eficiência (Mismatch, Sujeira, Temperatura) ignorando a real costura eletromecânica do projeto.

**Objetivo**: Transformar o Canvas maximizado na "Mesa de Fiação e Hardware" do projeto. Aqui, a distribuição de perdas deve ser vista arquiteturalmente via árvore topológica da conexão dos módulos aos inversores.

**DoD (Definition of Done)**:
- Migração técnica da lógica visual para abranger Árvores Unifilares.
- Construção de blocos "Deep Thermal Model" (Demonstrativos em Curvas I-V/P-V que se clipam em limites).
- Dimensionador Lógico de Cabos.

## 2. O Como (Plan)
1. **Unifilar Builder (View Only)**:
   - Componente React recursivo ou estruturado tipo fluxograma demonstrando o fluxo: `Módulos (Potência) -> Strings Paralelas -> MPPTs -> Inversor`.
2. **Cable Dimensioning**:
   - Criação de uma tabela de especificação DC/AC local (sem precisar jogar pro DB se não submetido) permitindo calcular Queda de Tensão % em tempo real (`(2 * Resistividade * Amperagem * L) / Área`).
3. **Thermal Model Visualization**:
   - Uma área dedicada à demonstração de restrições operacionais baseadas nos coeficientes importados do dock.

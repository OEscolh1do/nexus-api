---
id: SPEC-002
epic: UX-004 Center Canvas Promotions
description: Site Context Canvas View (Dossiê Físico)
---

# SPEC-002: Site Context Canvas View

## 1. O Quê (Specify)
**Problema**: A Aba "Site" tem apenas o nome do cliente e a temperatura estática quando no dock. É desperdício de espaço e subutilização da vistoria técnica do projeto pré-engenharia.

**Objetivo**: Construir a aba Site como o equivalente a um documento "Folha de Rosto" (Dossiê). Em vez de campos iteráveis espremidos, teremos datachips robustos avaliando o ecossistema.

**DoD (Definition of Done)**:
- Consumo global das Zustands `clientData` e `weatherData`.
- Layout em CSS Grid `grid-cols-2` ou `grid-cols-3` de escopo preenchido.
- Seção Meteorológica isolada.

## 2. O Como (Plan)
1. **Layout e Módulos CSS**:
   - Desenhar Card de Cliente (Responsável, Dados Básicos).
   - Desenhar Card de Infraestrutura Nominal (Tensão, Relógio/Padrão de Ligação, Dimensão Alvo).
   - Desenhar Quadrante Meteorológico Rico (Usando ícones do Lucide-react mesclados à temperatura anual media capturada no store).
2. **Dependência**: Nenhuma lógica profunda, componente majoritariamente View/Leitura (Read-only).

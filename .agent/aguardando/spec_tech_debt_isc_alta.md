# Especificação: Reimplementação do Cálculo de Isc Alta (Dívida Técnica)

## 1. O Quê (Business Problem)
**Problema — Falsos Positivos no Warning/Erro de "Isc Alta"**
O alerta de corrente de curto-circuito (Isc) excedendo o limite da entrada MPPT (`maxCurrentPerMPPT`) foi suspenso temporariamente devido à necessidade de uma validação e precisão melhor alinhada com as informações de ficha de dados de inversores que comumente abrem exceções ou tolerâncias.

## 2. Usuários Finais
- **Engenheiro Dimensionador**: Precisa de um alerta confiável e que contemple tolerâncias da ficha do aparelho para evitar bloqueios irreais nos módulos de design.

## 3. Critérios de Aceitação
1. Validar a base de inversores e extrair as correntes nominais junto com as correntes de pico suportadas por MPPT.
2. Re-habilitar a lógica de verificação nos módulos `useStringValidation.ts` e `electricalMath.ts`.
3. Validar exibição do warning em `LeftOutliner.tsx`.
4. Definir constante global em `thresholds.ts` para tolerância de Isc se aplicável.

## 4. Fora de Escopo
- Mudanças nos cálculos de tensão (`Voc`).

---
*Status: Aguardando momento oportuno para execução.*

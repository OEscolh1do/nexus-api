# SPEC-05 — Fusíveis de String: Cálculo de Corrente e Proteção CC

> **Gap:** `#5 — Fusível de String`
> **Criticidade:** 🔴 Crítico (Requisito Normativo NBR 16690 / ART Blocker)
> **Norma:** NBR 16690:2017 § 6.4 / IEC 60364-7-712

---

## Problema

Atualmente, o sistema alerta sobre a necessidade de fusíveis quando há 3 ou mais strings em paralelo, mas não realiza o **cálculo do rating (amperagem)** do fusível. Para um engenheiro assinar a ART, ele precisa especificar se o fusível deve ser de 15A, 20A, 25A ou 30A (gPV).

**Consequência prática:** O sistema avisa que precisa de fusível, mas o integrador ainda precisa abrir uma planilha externa para calcular `1.5 * Isc_módulo` (ou `1.2 * Isc_módulo` conforme fabricante) para determinar a proteção. Isso gera descontinuidade no workflow e risco de especificação incorreta de componentes de segurança.

**Código afetado:**
- `electricalMath.ts` — Adição da regra de cálculo de rating de fusível.
- `CalculationAuditPanel.tsx` — Exibição da especificação sugerida.
- `DiagnosticAlertsList.tsx` — Refinamento do alerta para incluir o valor sugerido.

---

## Usuário

**Engenheiro Eletricista** especificando a String Box ou a proteção interna do inversor.

---

## Definition of Done

1. **Cálculo de Rating gPV**: Implementar a fórmula `In_fusivel ≥ 1.5 * Isc_STC` (regra conservadora NBR 16690).
2. **Sugerir Valor Comercial**: O sistema deve sugerir o valor comercial superior mais próximo (ex: calculado 19.5A → sugerir 20A gPV).
   - Valores padrão: 10A, 12A, 15A, 20A, 25A, 30A.
3. **Exibição na Auditoria**: Na aba "Auditoria de Cálculo", incluir uma linha: *"Proteção de String: Fusível gPV recomendado: X A"*.
4. **Alerta Inteligente**: Se `stringsCount >= 3`, o alerta no terminal deve ser: *"Obrigatório uso de fusíveis CC. Especificação sugerida: X A gPV."*
5. **Verificação de Imax_inversor**: Validar se a corrente total do arranjo (com fusíveis) é compatível com a corrente de curto-circuito máxima suportada pelo inversor (`maxIscInverter`).

---

## Fora do Escopo

- ❌ Dimensionamento de DPS (Dispositivo de Proteção contra Surtos).
- ❌ Dimensionamento de Chave Seccionadora CC.
- ❌ Lista de compras de materiais (BOM).

---

## Referências

| Recurso | Localização |
|---------|-------------|
| `MPPTValidationEntry` | `src/modules/engineering/utils/electricalMath.ts` L.91 |
| `validateSystemStrings` | `src/modules/engineering/utils/electricalMath.ts` L.157 |
| `CalculationAuditPanel.tsx` | `src/modules/engineering/ui/panels/canvas-views/electrical/components/` |

---

## Dike — Análise Estática de Riscos

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| Inconsistência entre `1.5 * Isc` e a especificação do manual do módulo | Média | Permitir que o valor do fusível seja sobrescrito manualmente no futuro (Spec-04 extension). |
| Sugestão de fusível maior que a capacidade do cabo CC | Baixa | Integrar o alerta se `In_fusivel > Iz_cabo` (Capacidade de condução do cabo selecionado na Spec-04). |
| Confusão entre fusível por string e fusível por MPPT | Média | Usar terminologia clara: "Fusível de String (individual)". |

# SPEC-02 — Azimute & Mismatch de Orientação por MPPT

> **Gap:** `#2 — Azimute Mismatch`
> **Criticidade:** 🟡 Médio
> **Norma:** Boas práticas de projeto (impacto em perdas por descasamento e curva de geração)

---

## Problema

O sistema permite configurar Azimute e Inclinação por MPPT, mas esses valores são atualmente "dados inertes" (Tier 3 marcado como `false`). Mudar o azimute no MPPT não gera alertas de conflito de orientação nem altera as métricas de geração exibidas, o que pode levar o integrador a projetar strings com orientações diferentes no mesmo MPPT (mismatch grave) sem aviso do sistema.

**Consequência prática:** O integrador pode, por erro, colocar uma string Norte e uma string Oeste no mesmo MPPT. O sistema não avisará que isso causará perdas drásticas por mismatch de tensão/corrente, e o gráfico de "Tensão Térmica" mostrará uma curva idealizada que não reflete a realidade do campo.

**Código afetado:**
- `ElectricalCanvasView.tsx` — `hasMismatch` hardcoded como `false`.
- `MPPTConfigStrip.tsx` — Badge de "Mismatch" condicional ao valor fixo.
- `useElectricalValidation.ts` — Falta a regra de validação cruzada entre MPPTs.

---

## Usuário

**Engenheiro Projetista** realizando projetos em telhados com águas múltiplas, onde a separação de orientações por MPPT é crucial para a performance do sistema.

---

## Definition of Done

1. **Detecção de Mismatch de Azimute**: Se duas strings em MPPTs diferentes tiverem azimutes discrepantes (> 10°), o sistema deve identificar isso na "Topologia Elétrica".
2. **Alerta de Mismatch no Card**: O card do MPPT deve exibir o ícone de `Share2` (Mismatch) em âmbar se o azimute/inclinação do MPPT divergir da média do inversor.
3. **Validação na Store**: Implementar no `useElectricalValidation` a regra `MPPT_ORIENTATION_MISMATCH`.
4. **Impacto Visual**: O componente `VoltageRangeChart` deve exibir um indicador visual (ex: ícone de bússola) se houver múltiplos azimutes configurados no mesmo inversor.
5. **Aba de Auditoria**: Incluir na `CalculationAuditPanel` uma nota sobre a perda estimada por mismatch se as orientações não forem idênticas.

---

## Fora do Escopo

- ❌ Simulação horária completa de sombras baseada no azimute (Módulo Solar Canvas).
- ❌ Cálculo exato de perdas em kWh (Módulo Financial Engine).
- ❌ Sugestão automática de mudança de telhado.

---

## Referências

| Recurso | Localização |
|---------|-------------|
| `ElectricalCanvasView.tsx` | L.216 (hasMismatch: false) |
| `useElectricalValidation.ts` | `src/modules/engineering/hooks/` |
| `MPPTConfigStrip.tsx` | L.68 (hasMism) |

---

## Dike — Análise Estática de Riscos

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| Falso positivo em telhados planos onde o azimute é irrelevante | Média | Ignorar mismatch se a inclinação for < 5°. |
| Carga cognitiva alta com muitos alertas de azimute | Baixa | Usar severidade `warning` (âmbar) em vez de `error`. |
| Conflito com dados vindos do "Solar Canvas" | Média | Priorizar o dado manual do MPPT se ele for editado na view elétrica. |

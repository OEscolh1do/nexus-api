# SPEC-03 — Multi-Inversor: Gestão e Cockpit Simultâneo

> **Gap:** `#3 — Multi-inversor`
> **Criticidade:** 🟡 Médio
> **Norma:** Boas práticas de projeto para sistemas comerciais/industriais

---

## Problema

Embora o sistema permita adicionar múltiplos inversores no `InverterHub`, a visualização técnica (Cockpit de MPPTs e Gráficos) é restrita ao **inversor ativo selecionado**. Em projetos de médio/grande porte (ex: 3 inversores de 10kW), o integrador não consegue ter uma visão sistêmica da saúde elétrica de todos os equipamentos ao mesmo tempo.

**Consequência prática:** O integrador pode corrigir um erro de Voc no Inversor 1, mas esquecer um erro grave no Inversor 3 que não está "na frente" dele. A falta de uma visão agregada aumenta o risco de erros de dimensionamento em projetos industriais.

**Código afetado:**
- `ElectricalCanvasView.tsx` — Estado focado em `activeInverter`.
- `InverterHub.tsx` — Chips de inversor mostram apenas status individual básico.
- `useInverterUIStore.ts` — Lógica de seleção `activeInverterId`.

---

## Usuário

**Integrador B2B** realizando projetos comerciais ou industriais (UFV de 20kW a 75kW) que utilizam mais de um inversor.

---

## Definition of Done

1. **Indicador de Erro no Hub**: Cada chip de inversor no `InverterHub` deve exibir um ícone de status (`ok`, `warning`, `error`) refletindo a saúde de seus MPPTs, mesmo quando não selecionado.
2. **Resumo Sistêmico**: Adicionar um "Painel de Resumo do Sistema" (opcional/expansível) que mostra a soma de potência CC/CA e a média de FDI de todos os inversores.
3. **Navegação Rápida entre Alertas**: O Terminal de Diagnóstico deve permitir clicar em um erro de QUALQUER inversor e automaticamente trocar o `activeInverterId` para focar no equipamento com falha.
4. **Persistência de Seleção**: Garantir que ao trocar de aba (ex: de Elétrica para Financeiro) e voltar, o inversor selecionado anteriormente permaneça ativo.
5. **Aba "Topologia Elétrica"**: Mostrar um diagrama simplificado que liste todos os inversores e suas respectivas strings.

---

## Fora do Escopo

- ❌ Dimensionamento de inversores de marcas diferentes no mesmo projeto (restrito a um modelo por vez para simplificação de catálogo nesta fase).
- ❌ Diagrama unifilar completo (Módulo de Documentação).
- ❌ Gestão de inversores em subestações diferentes.

---

## Referências

| Recurso | Localização |
|---------|-------------|
| `InverterHub.tsx` | L.320 (inverterChips) |
| `ElectricalCanvasView.tsx` | L.83 (activeInverter calculation) |
| `useInverterUIStore.ts` | `src/modules/engineering/store/` |

---

## Dike — Análise Estática de Riscos

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| Lentidão na UI ao validar 10+ inversores em tempo real | Média | Usar `Worker` para o hook `useElectricalValidation` se o número de MPPTs for > 15. |
| Confusão visual entre "Potência Total" e "Potência do Inversor Ativo" | Alta | Clarificar labels: "Sistema (Total)" vs "Inversor [Modelo]". |
| Perda de contexto ao trocar de inversor via alerta | Baixa | Adicionar um "Flash" visual no card do MPPT ao focar. |

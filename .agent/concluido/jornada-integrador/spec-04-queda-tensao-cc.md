# SPEC-04 — Queda de Tensão CC: Cálculo e Inputs de Cabeamento

> **Gap:** `#4 — Queda de Tensão CC`
> **Criticidade:** 🔴 Crítico (Requisito Normativo NBR 16690)
> **Norma:** NBR 16690:2017 § 6.3.3 / NBR 5410

---

## Problema

O motor matemático do Kurupira (`electricalMath.ts`) já possui a função `calculateVoltageDrop`, mas a interface **não expõe os campos necessários** (Comprimento do Cabo e Seção do Cabo) no card de MPPT. Sem esses inputs, o integrador não consegue validar se a queda de tensão está dentro dos limites normativos (≤ 1% recomendado, ≤ 2% limite para sistemas FV).

**Consequência prática:** O integrador projeta um sistema com 50 metros de cabo CC de 4mm² em uma string de alta corrente (ex: módulos de 18A). A queda de tensão real seria de 3%, mas o sistema não avisa nada. Isso gera perda de rendimento real e risco de aquecimento nos conectores/cabos, além de invalidar a conformidade normativa do projeto.

**Código afetado:**
- `MPPTConfigStrip.tsx` — Adição de campos de input.
- `ElectricalCanvasView.tsx` — Passagem de parâmetros para a validação.
- `electricalMath.ts` — Já possui a lógica, mas precisa ser integrada ao fluxo de UI.

---

## Usuário

**Engenheiro Eletricista** que precisa garantir a eficiência da transmissão CC e a conformidade com a NBR 16690 para emissão de ART.

---

## Definition of Done

1. **Novos Inputs no Card de MPPT**:
   - `Comprimento (m)`: Input numérico para distância de ida (unipessoal).
   - `Seção (mm²)`: Select com opções padrão (4, 6, 10 mm²).
2. **Cálculo em Tempo Real**: Ao alterar o comprimento ou seção, o sistema recalcula a queda de tensão (%) para aquele MPPT.
3. **Indicador de Queda de Tensão**: Mostrar no card (Telemetria) o valor de `ΔV%`.
   - Verde: ≤ 1.0%
   - Âmbar: > 1.0% e ≤ 2.0%
   - Vermelho: > 2.0% (Gera erro no Terminal de Diagnóstico).
4. **Validação Automática**: O Terminal de Diagnóstico deve disparar o alerta: *"Queda de tensão excessiva no MPPT X: Y.Z% (Limite 2%)"*
5. **Persistência**: Os dados de cabeamento devem ser salvos no objeto `MPPTConfig` na `techStore`.

---

## Fora do Escopo

- ❌ Dimensionamento automático do disjuntor CC (Módulo de Proteções).
- ❌ Cálculo de queda de tensão CA (Módulo de Conexão à Rede).
- ❌ Cálculo de custo do cabo (Módulo Financeiro - Futuro).

---

## Referências

| Recurso | Localização |
|---------|-------------|
| `calculateVoltageDrop` | `src/modules/engineering/utils/electricalMath.ts` L.135 |
| `MPPTInput` (interface) | `src/modules/engineering/utils/electricalMath.ts` L.112 |
| `MPPTConfig` (Zustand) | `src/modules/engineering/store/useTechStore.ts` |

---

## Dike — Análise Estática de Riscos

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| Poluição visual no card de MPPT já denso | Alta | Usar inputs compactos ou uma seção colapsável "Cabeamento CC". |
| Confusão entre comprimento "ida" e "ida+volta" | Média | Label explícita: "Comprimento (ida)". O cálculo já aplica o fator 2 internamente. |
| Erro de divisão por zero se tensão for 0 | Média | Guard no utilitário `calculateVoltageDrop` já existente. |

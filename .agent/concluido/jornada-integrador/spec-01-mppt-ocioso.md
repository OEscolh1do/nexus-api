# SPEC-01 — MPPT: Visibilidade de Canais Utilizados vs. Disponíveis

> **Gap:** `#1 — MPPT Ocioso`
> **Criticidade:** 🟡 Médio
> **Norma:** Boas práticas de dimensionamento (nenhuma norma específica, mas impacto direto em yield)

---

## Problema

O inversor selecionado expõe N canais MPPT. O cockpit atual exibe **todos os cards**, incluindo
os vazios — mas não há **nenhuma indicação de eficiência de alocação**: quantos dos N canais
disponíveis estão sendo efetivamente utilizados, e se a distribuição é ótima.

**Consequência prática:** Num Fronius Symo de 3 MPPTs, o integrador pode configurar apenas
os MPPTs 1 e 2 e nunca perceber que o MPPT 3 está ocioso, perdendo capacidade de arranjo
que poderia acomodar uma 3ª orientação ou strings adicionais.

**Código afetado:**
- `MPPTConfigStrip.tsx` — cards renderizados sem status de utilização agregada
- `InverterHub.tsx` — barra de aderência (`adherenceProgress`) não considera MPPTs ociosos
- `ElectricalCanvasView.tsx` — `mpptMetrics` calculado, mas sem sumarização de alocação

---

## Usuário

**Integrador** configurando um sistema com múltiplas orientações de telhado (ex: Leste/Oeste)
que precisa saber se está aproveitando ao máximo a topologia de MPPTs do inversor.

---

## Definition of Done

1. **Badge de Alocação no Hub**: O `InverterHub` exibe `X / N MPPTs ativos` como indicador
   ao lado do modelo do inversor. Ex: `2 / 3 MPPTs`.

2. **Status Semântico por Card**:
   - Card com `modulesPerString = 0` OU `stringsCount = 0`: badge `OCIOSO` (slate-500)
   - Card configurado mas abaixo do mínimo de módulos: badge `SUB-DIMENSIONADO` (amber-500)
   - Card configurado corretamente: badge omitido (verde)

3. **Tooltip de Oportunidade**: Card ocioso deve exibir, no lugar do gauge de tensão vazio,
   uma mensagem: *"Este MPPT está disponível. Adicione strings para aproveitar a capacidade."*

4. **Barra de Adherence atualizada**: A `adherenceProgress` no rodapé do Hub passa a
   incluir o percentual de MPPTs utilizados como fator de aderência adicional.

5. **Reativo**: Ao adicionar strings a um MPPT ocioso, o badge some instantaneamente.

---

## Fora do Escopo

- ❌ Sugestão automática de redistribuição de strings entre MPPTs.
- ❌ Persistência do estado "ocioso" no banco de dados.
- ❌ Otimização de yield por orientação (coberto pela Spec-02).

---

## Referências

| Recurso | Localização |
|---------|-------------|
| `MPPTConfigStrip.tsx` | `src/modules/engineering/ui/panels/canvas-views/electrical/` |
| `InverterHub.tsx` | `src/modules/engineering/ui/panels/canvas-views/electrical/` |
| `mpptMetrics` (useMemo) | `ElectricalCanvasView.tsx` L.196–220 |
| `MPPTConfig` (type) | `src/modules/engineering/store/useTechStore.ts` |

---

## Dike — Análise Estática de Riscos

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| Badge `OCIOSO` colidir visualmente com o card de erro existente (vermelho) | Baixa | Usar cor `slate-500` diferenciada do vermelho de erro |
| `adherenceProgress` mudar de fórmula e quebrar o glow visual do Hub | Média | Extrair `adherenceProgress` para um `useMemo` dedicado antes de alterar |
| Re-render desnecessário do Hub ao digitar nos StepperInputs | Média | `useMemo` de `activeCount` já depende de `mpptConfigs` — sem custo extra |
| Regressão: cards de MPPT configurados sendo marcados erroneamente como ociosos | Baixa | Guard explícita: `isEmpty = modulesPerString <= 0 || stringsCount <= 0` |

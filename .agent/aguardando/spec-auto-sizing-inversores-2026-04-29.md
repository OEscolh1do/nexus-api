# Spec: Compatibilidade Inteligente de Inversores (Auto-Sizing Preliminar)
**Tipo:** Refatoração Técnica e Nova Feature  
**Skill responsável pela implementação:** the-builder & arranjo-motor-tecnico  
**Revisor de aceitação:** engenheiro-eletricista-pv  
**Prioridade:** P0  
**Origem:** Revisão direta

---

## Problema
O fluxo atual de dimensionamento de inversores é baseado em "tentativa e erro". O usuário seleciona a quantidade de módulos, depois abre o catálogo de inversores e precisa adivinhar qual equipamento tem capacidade de absorver a potência CC (Oversizing) e suportar os limites de tensão e corrente dos módulos selecionados no clima local (Voc no frio, Vmp no calor). Isso resulta em sobrecarga cognitiva e erros de dimensionamento que só são descobertos quando os componentes já foram adicionados ao projeto.

## Solução Técnica
Criar um motor de "Análise Preliminar" (Auto-Sizing Engine) que atua na listagem/biblioteca de inversores. Antes do usuário selecionar um inversor, o Kurupira varrerá o banco de dados do catálogo e calculará a viabilidade de cada inversor contra os módulos já selecionados.

### Especificação Matemática do Auto-Match

**1. Limites Térmicos da String (Voc e Vmp):**
- `Voc_frio = N_série * Voc_stc * [1 + (TempCoeff_Voc / 100) * (T_min_histórica - 25)]`
- `Vmp_quente = N_série * Vmp_stc * [1 + (TempCoeff_Voc / 100) * (T_cel_max - 25)]` (onde `T_cel_max = T_amb_max + NOCT - 20`)

**2. Condição de Existência (Match):**
Um inversor é compatível se existir pelo menos um número inteiro `N_série` tal que:
- `N_série >= ceil(Inversor.minVmpInput / Vmp_quente)`
- `N_série <= floor((Inversor.maxVocInput * 0.95) / Voc_frio)`
- Se `N_min > N_max_seguro`, o inversor é incompatível (Não serve para este módulo neste clima).

**3. Validação de Corrente:**
- `Isc_string = Isc_stc * 1.25`
- O inversor deve ter `Inversor.maxIscInput >= Isc_string`.

**4. Oversizing (FDI) Alvo:**
- `P_cc_instalada = N_total_modulos * P_modulo`
- `FDI_Inversor = P_cc_instalada / Inversor.nominalPowerW`
- Rankear/Filtrar inversores onde o FDI fique na faixa ótima (1.05 a 1.35) ou até o limite de hardware especificado pelo fabricante.

## Arquivos Afetados

### Novos:
- `[NEW] kurupira/frontend/src/modules/engineering/hooks/useAutoSizing.ts`
  - Hook responsável por injetar o módulo atual, a contagem e as temperaturas para retornar a lista de IDs de inversores do catálogo compatíveis e com o FDI calculado.
- `[NEW] kurupira/frontend/src/modules/engineering/utils/compatibilityMath.ts`
  - Contém as funções puras de verificação do `N_min`, `N_max` e Oversizing.

### Modificados:
- `[MODIFY] kurupira/frontend/src/modules/engineering/ui/panels/LeftOutliner.tsx` ou componente de Biblioteca de Inversores.
  - Ao invés de apenas listar inversores, exibir um "Compatibility Badge" (Ideal, Aceitável, Incompatível).
  - Exibir o % de Oversizing (FDI) esperado logo na capa do Inversor antes da seleção.
  - Impedir ou alertar severamente a seleção de um inversor onde não exista `N_série` possível.

## Critérios de Aceitação
- [ ] A biblioteca de inversores reage reativamente (Zustand) aos módulos já adicionados no `ModuleCanvasView`.
- [ ] Se um módulo de 550W (Voc elevado no frio, ou alta corrente como 18A) for selecionado, inversores com limite de 13A de MPPT devem ser marcados como Incompatíveis imediatamente.
- [ ] O % de FDI aparece em cada card de inversor na lista.
- [ ] `tsc --noEmit` -> EXIT CODE 0

## Referências Normativas
- ABNT NBR 16690:2019 §6.3 (Dimensionamento de tensão máxima)
- ABNT NBR 16690:2019 §7.4 (Regras de correntes e proteção)

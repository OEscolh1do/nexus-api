# Proposta de Refatoração: UX do Cockpit de Saldo de Módulos

## Contexto e Diagnóstico do Gap
Atualmente, o indicador de "Saldo de Módulos" na view do Inversor (no `InverterHub.tsx`) exibe a proporção de forma muito técnica e fria: `Restantes / Total` (ex: `10 / 20`). 
Embora a matemática esteja correta e os dados agora estejam consistentes por MPPT, a **carga cognitiva** para o integrador é alta. Ao bater o olho, não fica imediatamente claro o significado da fração. 

Segundo a heurística do workflow `/engineering-ui` (Eficiência de Especialista e Previsibilidade Funcional), o usuário em uma tarefa densa não deve precisar "traduzir" um KPI. A interface deve contar a história do estado atual: *"Quantos módulos do meu projeto eu já puxei para os inversores? Sobrou algum? Estourei o orçamento?"*

---

## Soluções Propostas (Tier List)

Apresento 3 Tiers de solução, do mais simples ao mais robusto, focados em data storytelling e UX de HMI (Human-Machine Interface).

### Tier 1: Refinamento Semântico e Micro-Ajuste (Rápido e Efetivo)
**Conceito:** Manter a estrutura atual, mas mudar a linguagem e tipografia para ser inequivocamente clara.
- **Como:** Em vez de `10 / 20`, quebraremos em metadados explícitos:
  - Título muda para **Estoque de Módulos**
  - Valor principal: `[Ícone Package] 10 Restantes` (se `> 0`)
  - Subtexto: `de 20 orçados`
  - Estado Concluído: `[Ícone Check] Alocação Completa (20/20)`
  - Estado Negativo: `[Ícone Alert] Falta orçamento (-5 módulos)`
- **Prós:** Baixo esforço de implementação, resolve a ambiguidade.
- **Contras:** Não adiciona referência visual/espacial (barras/gráficos) para bater o olho de longe.

### Tier 2: Mini-Gauge SCADA (Barra de Progresso Integrada)
**Conceito:** Transformar o texto frio em um componente vivo, similar aos indicadores de combustível ou bateria de equipamentos físicos.
- **Como:** Adicionamos uma barra de progresso fina (sparkline) logo abaixo do número.
  - A barra vai enchendo (ou esvaziando) conforme a alocação.
  - Cores dinâmicas: 
    - Cinza preenchendo com **Azul/Esmeralda** enquanto há módulos.
    - Se bater o limite perfeito (0 restantes), a barra inteira brilha em **Verde**.
    - Se estourar (negativo), a barra fica cheia e pisca a borda em **Vermelho** com um overshoot visual.
- **Prós:** Feedback visual imediato. A barra permite entender a proporção sem precisar ler os números.
- **Contras:** Ocupa um pouco mais de espaço vertical no `InverterHub`.

### Tier 3: O "Dual-State Cockpit" (Recomendado para Kurupira)
**Conceito:** Adotar a heurística de "Densidade vs Clareza" do `/engineering-ui`. Separar fisicamente o que foi *Consumido* do que está *Disponível*.
- **Como:** Criamos um pequeno bloco com dois contadores espelhados e uma barra de ligação:
  ```text
  [Módulos Orçados: 20]
  ================================= (Barra visual)
  Alocados: 10   |   Restantes: 10
  (Em Inversores)    (No Estoque)
  ```
- **Comportamento de UX:**
  - Se `Restantes > 0`: O número de "Restantes" pulsa sutilmente em amarelo, indicando que a tarefa não acabou.
  - Se `Restantes === 0`: O bloco inteiro colapsa para um badge verde unificado `[✓] 100% Alocado` para reduzir ruído visual na tela e permitir foco em outras métricas (Progressive Disclosure).
  - Se `Restantes < 0`: O bloco expande e fica vermelho, mostrando "Estouro de +X módulos".
- **Prós:** Máxima clareza. Usa redução de ruído adaptativo (some quando não é mais um problema). Design Premium.

---

## Arquivos Afetados (Para qualquer Tier)
- `[MODIFY] kurupira/frontend/src/modules/engineering/ui/panels/canvas-views/electrical/InverterHub.tsx`
  - Refatorar o bloco `{/* INVENTORY / MODULE BALANCE */}`.

## Próximo Passo Recomendado
Peço que você avalie qual Tier mais lhe agrada. O **Tier 3** é o que mais se alinha com a proposta de "Wow Factor" e UX de engenharia robusta do sistema, mas se preferir algo mais enxuto para o momento atual, o **Tier 2** resolve perfeitamente a usabilidade.

> [!TIP]
> **Minha recomendação técnica é o Tier 3**. A capacidade de "esconder" a métrica quando ela chega a zero limpa o painel e dá uma sensação de "Checklist Completo" ao integrador, gamificando sutilmente a engenharia.

**Qual a sua decisão?** (Basta me confirmar o Tier escolhido ou sugerir uma mescla de ideias e eu executarei a implementação).

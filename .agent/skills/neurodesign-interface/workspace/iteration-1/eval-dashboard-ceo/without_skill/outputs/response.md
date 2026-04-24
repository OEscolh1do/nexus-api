# Como tornar um dashboard para CEO mais eficiente para tomada de decisão

## Diagnóstico do problema atual

O dashboard descrito tem vários sinais clássicos de um painel sobrecarregado:

- **12 KPIs espalhados pela tela** — sem hierarquia visual, o olho não sabe por onde começar
- **3 gráficos de pizza** — tipo de gráfico que exige esforço cognitivo alto para comparar proporções
- **Tabelas com 24 meses de dados** — volume de dados brutos sem síntese prévia
- **Filtros na lateral** — interface voltada para análise exploratória, não para leitura executiva

O resultado: o CEO precisa "trabalhar" para encontrar a informação em vez de absorvê-la imediatamente.

---

## Princípios fundamentais para dashboards executivos

### 1. Hierarquia de atenção (F-pattern e Z-pattern)

O olho humano em dashboards segue padrões previsíveis. Coloque as informações mais críticas:
- **Canto superior esquerdo**: o número mais importante do negócio
- **Linha superior**: os 3–5 KPIs de decisão prioritária
- **Miolo**: contexto e tendência
- **Rodapé ou lateral**: detalhes e drill-down

Espalhar 12 KPIs com peso visual igual força o CEO a varrer a tela inteira antes de saber se há um problema — isso mata a velocidade de decisão.

### 2. Reduzir de 12 para 3–5 KPIs principais

Não elimine os dados — reorganize-os em camadas:

**Camada 1 (visível imediatamente):** 3 a 5 KPIs que respondem "o negócio está indo bem ou mal este mês?"
- Exemplos: Receita realizada vs. meta, Margem operacional, NPS ou indicador de satisfação, CAC ou Churn

**Camada 2 (um clique ou scroll):** os demais 7–9 KPIs de contexto e suporte

**Camada 3 (sob demanda):** tabelas detalhadas, histórico de 24 meses

Isso não esconde informação — cria uma narrativa sequencial que respeita o tempo do CEO.

### 3. Substituir os gráficos de pizza

Gráficos de pizza são dos piores para comparação quantitativa. O cérebro humano compara comprimentos lineares com muito mais precisão do que ângulos ou áreas.

**Substituições recomendadas:**
- Pizza mostrando participação de categorias → **Barra horizontal empilhada** ou **barra simples ranqueada**
- Pizza mostrando % de uma meta atingida → **Gauge/medidor** ou **número grande com barra de progresso**
- Pizza de distribuição ao longo do tempo → **Linha de tendência** ou **área empilhada**

### 4. Transformar as tabelas de 24 meses

Tabelas cruas de 24 meses são para analistas, não para CEOs. Transforme-as em:

- **Sparklines**: mini-gráficos de linha embutidos ao lado de cada KPI, mostrando a tendência dos últimos 24 meses em 1 cm de largura
- **Heatmap temporal**: uma grade onde a cor indica intensidade, permitindo ver sazonalidade e anomalias instantaneamente
- **Comparativo YoY**: mostre só os números relevantes — mês atual vs. mesmo mês do ano anterior, com delta em % e cor (verde/vermelho)

O histórico completo fica disponível ao clicar, mas não ocupa espaço primário.

### 5. Repensar os filtros laterais

Filtros na lateral são paradigma de BI exploratório (Tableau, Power BI no modo analista). Para um CEO em reunião mensal, o fluxo é diferente:

**Opção A — Contexto fixo pré-configurado:**
O dashboard já carrega com o filtro do mês atual e da comparação padrão. O CEO não precisa mexer em nada para ver o estado do negócio.

**Opção B — Filtros como perguntas predefinidas:**
Em vez de combos genéricos, ofereça botões de cenário:
- "Este mês vs. mês anterior"
- "Este mês vs. meta anual"
- "Último trimestre"

Isso reduz fricção e elimina erros de configuração (CEO selecionando filtro errado sem perceber).

---

## Layout sugerido (estrutura em 3 zonas)

```
┌─────────────────────────────────────────────────────┐
│  ZONA 1 — STATUS EXECUTIVO (topo, ~25% da tela)     │
│  [KPI 1: Receita]  [KPI 2: Margem]  [KPI 3: NPS]   │
│  Número grande + variação vs. mês anterior + cor    │
├─────────────────────────────────────────────────────┤
│  ZONA 2 — TENDÊNCIAS (meio, ~50% da tela)           │
│  [Gráfico de linha: Receita 12 meses]               │
│  [Gráfico de barras: Top 5 produtos/regiões]        │
│  [Comparativo YoY: tabela sintética]                │
├─────────────────────────────────────────────────────┤
│  ZONA 3 — DETALHE ACESSÍVEL (base, ~25% da tela)   │
│  [KPIs secundários 4–12, tamanho menor]             │
│  [Link/expansão para histórico de 24 meses]         │
└─────────────────────────────────────────────────────┘
```

---

## Uso de cor como linguagem de decisão

A cor não deve ser decorativa — deve ser um sinal imediato de ação:

| Situação | Cor | Significado |
|---|---|---|
| KPI acima da meta | Verde | Nenhuma ação necessária |
| KPI dentro de tolerância (±5%) | Amarelo/âmbar | Monitorar |
| KPI abaixo da meta | Vermelho | Requer decisão |
| KPI sem meta definida | Cinza neutro | Informativo |

**Atenção:** Não use verde/vermelho em gráficos estéticos (barras de categorias, por exemplo) — reserve essas cores para sinais de alerta. Quando tudo é colorido, nada chama atenção.

---

## Tipografia e densidade visual

- **KPIs principais**: número com fonte ≥ 32px, sem decimais desnecessários (R$ 1,4M, não R$ 1.423.847,32)
- **Variação**: seta + percentual em fonte secundária, menor
- **Rótulos de gráfico**: apenas os valores essenciais — remova grade excessiva, eixos redundantes e legendas que podem virar título
- **Espaço em branco**: é funcional, não desperdício — separa grupos de informação e reduz fadiga visual

---

## Checklist de validação antes de apresentar

Antes de levar o dashboard ao CEO, aplique estes testes:

1. **Teste dos 5 segundos**: mostre o dashboard por 5 segundos e pergunte "o que você aprendeu?" — se a resposta for vaga, a hierarquia está errada
2. **Teste da pergunta de decisão**: o CEO consegue responder "preciso agir em alguma coisa este mês?" sem clicar em nada?
3. **Teste do daltônico**: o dashboard comunica algo mesmo sem cor? (use padrões ou ícones como reforço)
4. **Teste da impressão**: se impresso em preto e branco para uma reunião presencial, ainda funciona?

---

## Resumo das mudanças prioritárias (por impacto)

| Prioridade | Mudança | Impacto |
|---|---|---|
| 1 | Reduzir KPIs visíveis para 3–5 no topo | Alto — elimina sobrecarga imediata |
| 2 | Substituir pizzas por barras ou gauges | Alto — leitura 3x mais rápida |
| 3 | Transformar tabelas em sparklines + YoY | Alto — contexto sem ruído |
| 4 | Pré-configurar filtros como cenários fixos | Médio — elimina fricção operacional |
| 5 | Aplicar sistema de cores semafórico | Médio — decisão em 1 olhar |
| 6 | Reorganizar layout em 3 zonas hierárquicas | Médio — fluxo de leitura natural |

---

*Resposta gerada sem uso de skill especializada — conhecimento geral de UX, design de informação e psicologia cognitiva aplicada a interfaces executivas.*

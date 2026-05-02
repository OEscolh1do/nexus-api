# Neurodesign para Dashboard de CEO — Análise em 4 Camadas

## Contexto Inferido

- **Tipo de interface:** Dashboard analítico mensal
- **Público-alvo:** CEO — tomador de decisão executivo, alto valor de tempo, baixa tolerância a ruído cognitivo
- **Objetivo principal:** Compreensão rápida + tomada de decisão (não análise profunda)
- **Dados disponíveis:** 12 KPIs, 3 gráficos de pizza, tabelas com 24 meses de dados, filtros laterais
- **Contexto emocional:** Executivo sob pressão de tempo — provavelmente um pouco sobrecarregado, buscando clareza e controle, não análise exploratória

**Diagnóstico inicial:** O layout atual está otimizado para o analista que construiu o dashboard, não para o CEO que precisa decidir. Cada um dos problemas abaixo tem uma causa neurocientífica específica.

---

## Camada 1: ATENÇÃO — O que o CEO vê nos primeiros 3 segundos?

### Problema central: 12 KPIs disputam a mesma atenção

O cérebro processa atributos visuais pré-atentivos (cor, contraste, tamanho, posição) antes da leitura consciente. Com 12 KPIs de peso visual igual, o sistema visual faz uma varredura completa antes de "decidir" onde fixar o olhar — um processo que consome de 3 a 8 segundos e aumenta a carga cognitiva imediatamente.

**O que o eye-tracking mostraria:** Uma nuvem de fixações dispersas no topo da tela, sem um ponto de entrada dominante. O CEO "lê" o dashboard inteiro antes de entender o que importa.

### Recomendações

**1. Crie uma hierarquia de 3 níveis — não 12 iguais**

Selecione 1 KPI primário (o número que mais define o sucesso ou risco do mês — ex: receita total, margem líquida ou NPS), 2–3 KPIs secundários e deixe o restante como terciário, em tipografia menor e sem destaque de cor.

- KPI primário: fonte 48–64px, cor de ação (azul ou verde), posição topo esquerdo
- KPIs secundários: fonte 28–36px, posição visível no terço superior
- KPIs terciários: fonte 16–20px, cinza escuro, sem cor de destaque

**Justificativa neurocientífica:** Atributos pré-atentivos são processados em paralelo pelo córtex visual primário antes da atenção serial. Um elemento que domina tamanho + cor é identificado em menos de 150ms. Quando todos os 12 KPIs têm o mesmo peso visual, o cérebro ativa o processamento serial (lento, consciente, fatigante).

**2. Squint Test — aplique agora**

Semicerre os olhos até a tela ficar desfocada. O que você consegue ver? Se a resposta for "muita coisa igual", o dashboard falha no teste. Após a reestruturação, apenas os 3 KPIs primários devem ser legíveis no modo desfocado.

**3. Aplique o padrão de leitura correto: Layer-cake + Spotted**

CEOs em dashboards executivos usam dois padrões simultâneos:
- **Layer-cake:** varredura rápida de títulos e rótulos em negrito — sem ler o corpo
- **Spotted:** busca por números grandes em cor contrastante

Isso significa: os títulos dos gráficos devem entregar a conclusão, não o rótulo. Não escreva "Receita por Região" — escreva "Sul cresceu 23% acima da meta". O CEO lê o título, decide se precisa do gráfico.

---

## Camada 2: COGNIÇÃO — Reduzindo a carga mental para zero atrito

### Problema 1: 3 gráficos de pizza — o pior tipo para comparação

Segundo a hierarquia de precisão de Cleveland-McGill (validada por estudos de percepção visual), a capacidade humana de comparar valores cai drasticamente com pizzas:

| Tipo de gráfico | Precisão de comparação |
|---|---|
| Barras (posição em escala comum) | Muito alta |
| Barras empilhadas (comprimento) | Alta |
| Gráfico de linha (posição) | Alta |
| Gráfico de pizza (área/ângulo) | Baixa |
| Gráfico de rosca 3D | Muito baixa |

**O que fazer:** Substitua os 3 gráficos de pizza por gráficos de barras horizontais com rótulos diretos. O CEO compara fatias de pizza ativando julgamento de ângulo — um dos processos visuais mais imprecisos do cérebro humano. Barras horizontais com comprimento diferente são comparadas em 40–60ms com alta precisão.

**Exceção permitida:** Se o objetivo da pizza for mostrar "este item domina tudo" (ex: um produto que representa 80% da receita), a pizza funciona bem — porque não há comparação, há dominância visual óbvia. Nesse caso, destaque o segmento dominante com cor e deixe o restante em cinza.

### Problema 2: Tabelas com 24 meses exibidas ao mesmo tempo

A memória de trabalho humana comporta 5–9 "chunks" simultâneos. Uma tabela de 24 meses com múltiplas colunas cria dezenas de unidades de informação — muito além da capacidade de processamento eficiente.

**O que fazer: Progressive Disclosure em 3 níveis**

- **Nível 1 (padrão):** Exibe os últimos 3 meses + linha de variação vs. meta. É o que o CEO vê sempre.
- **Nível 2 (clique em "ver histórico"):** Exibe os últimos 12 meses com mini-sparklines por linha para mostrar tendência sem números redundantes.
- **Nível 3 (exportar/drill-down):** Os 24 meses completos para o analista.

**Justificativa:** Ocultar não é esconder — é respeitar o custo cognitivo. O CEO que quer os 24 meses consegue; o CEO que quer decidir em 90 segundos não é forçado a processar o que não precisa.

### Problema 3: Filtros na lateral — acessíveis mas invisíveis para decisão

Filtros sempre disponíveis aumentam a "carga extrínseca" — ruído de design que consome memória de trabalho sem gerar insight. O CEO vê 15 opções de filtro e inconscientemente avalia se precisa usá-las antes de ler os dados.

**O que fazer:**
- Reduza os filtros a 3 dimensões máximas visíveis (ex: Período, Região, Unidade de Negócio)
- Agrupe filtros secundários em um painel recolhível "Filtros avançados"
- Aplique smart defaults: pré-selecione "Mês atual, Todas as regiões, Visão consolidada" — o CEO não deve ter que configurar para chegar ao estado útil

### Problema 4: Remoção de ruído visual

Checklist de elementos a eliminar imediatamente:

- [ ] Bordas em todos os cards/tabelas (substitua por espaço em branco e agrupamento por proximidade)
- [ ] Grades de fundo em gráficos (use grades suaves cinza-claro, ou remova)
- [ ] Efeitos 3D em qualquer gráfico
- [ ] Legendas separadas dos dados (mova rótulos para dentro ou ao lado das séries)
- [ ] Múltiplas famílias tipográficas
- [ ] Ícones decorativos sem função informativa

**Referência:** Data-ink ratio de Tufte — cada pixel da interface deve representar dados ou estrutura funcional. Pixels decorativos são custos cognitivos sem retorno.

---

## Camada 3: EMOÇÃO — O dashboard deve fazer o CEO sentir controle, não ansiedade

### O estado emocional do CEO ao abrir o dashboard

Um CEO abrindo um relatório mensal está em estado de "vigilância executiva": buscando confirmar que tudo está dentro do esperado (alívio/controle) ou identificar ameaças rapidamente (alarme/ação). O design deve servir a esse estado — não dificultar.

**Problema atual:** 12 KPIs com a mesma cor/peso criam ambiguidade emocional. O cérebro não sabe se deve relaxar ou se alarmar. Essa ambiguidade ativa o córtex cingulado anterior (monitoramento de conflito), gerando uma leve mas real sensação de desconforto — que o CEO interpretará como "esse dashboard é difícil de ler".

### Sistema de cores com justificativa neurocientífica

| Elemento | Cor recomendada | Por quê |
|---|---|---|
| KPI no caminho ou acima da meta | Verde (#27AE60) | Ativa associações de crescimento e segurança no sistema límbico — o CEO relaxa instantaneamente |
| KPI abaixo da meta (atenção necessária) | Âmbar (#F59E0B) | Alerta moderado — ativa vigilância sem disparar resposta de ameaça |
| KPI crítico (ação imediata) | Vermelho (#E53935) | Urgência neurológica — use com extrema parcimônia (1–2 KPIs no máximo por dashboard) |
| KPI neutro/informativo | Azul (#1E6FFF) ou cinza escuro | Informação sem carga emocional |
| Fundo de cards | Branco/cinza muito claro (#F8F9FA) | Reduz carga cognitiva — o olho descansa no fundo neutro |

**Regra crítica:** Se tudo for vermelho, nada é urgente. O vermelho perde seu poder neurocientífico quando usado em mais de 15–20% dos elementos. Use como recurso escasso.

### Construa uma micro-narrativa — mesmo num dashboard

Dados brutos ativam apenas as áreas de linguagem do cérebro (Broca/Wernicke). Quando você adiciona contexto narrativo, ativa também o córtex motor e sensorial — aumentando memorabilidade e engajamento.

**Como aplicar:** Adicione uma "linha editorial" no topo do dashboard — um parágrafo de 2–3 frases que contextualiza o mês. Exemplo:

> "Março/2026: Receita 8% acima da meta impulsionada pelo Sul. Custo operacional cresceu 3% acima do planejado — foco necessário. Próxima revisão: forecast Q2."

Esse resumo narrativo é processado em 15–20 segundos e dá ao CEO o "mapa mental" para interpretar tudo que vem depois.

---

## Camada 4: DECISÃO — Do entendimento à ação em segundos

### O problema da fadiga de decisão no dashboard atual

Cada elemento ambíguo obriga o CEO a tomar micro-decisões: "Devo olhar esse número agora?", "Este filtro é relevante?", "O que esse gráfico está me dizendo?". Após 8–12 micro-decisões, a qualidade da atenção executiva cai mensuravelmente.

### Recomendação principal: Seção "Decisões Pendentes" com CTA claro

Adicione ao final do dashboard (ou em destaque lateral) um bloco chamado "Requer atenção" ou "Para decidir hoje" com 2–3 itens máximos, cada um com:

- O dado relevante (1 número)
- O contexto (1 frase)
- A ação recomendada ou pergunta (1 frase)
- Um botão/link para o detalhe (se necessário)

**Justificativa:** O CEO não precisa descobrir o que fazer — precisa confirmar ou redirecionar. Entregar as decisões pré-formatadas reduz o "custo de oportunidade" que o cérebro calcula ao processar múltiplas opções simultaneamente.

### Reenquadramento de métricas negativas

Quando um KPI está no vermelho, o framing importa. Compare:

- Framing neutro: "Margem bruta: 34% (meta: 38%)"
- Framing de ação: "Margem bruta 4pp abaixo da meta — recuperação possível revertendo X"

O segundo formato ativa o córtex pré-frontal (planejamento) em vez do amígdala (ameaça). O CEO sai da "leitura de problema" para a "leitura de solução" — mudança de estado cognitivo que aumenta a qualidade da decisão.

### Smart defaults e percepção de controle

Interfaces que permitem ao usuário "brincar" com cenários aumentam o "Perceived Behavioral Control" — fator determinante na intenção de agir. Para o CEO:

- Botão de toggle "Ver vs. mês anterior / Ver vs. meta / Ver vs. mesmo mês ano passado" — 3 contextos de comparação com 1 clique
- Slider ou toggle "Visão consolidada / Por unidade" — permite que o CEO personalize sem sair da tela principal

Esse nível de controle aparente reduz ansiedade e aumenta confiança no instrumento.

---

## Síntese: Plano de Ação Priorizado

### Prioridade 1 — Alto impacto, baixo esforço (implementar esta semana)

1. **Eleja 1 KPI primário** e amplie seu tamanho para 3x os demais. Adicione cor verde/vermelho dependendo do status.
2. **Reescreva os títulos dos 3 gráficos** para entregar a conclusão ("Vendas do Sul superam meta pelo 3º mês" em vez de "Vendas por Região").
3. **Adicione a linha editorial** — 2–3 frases no topo contextualizando o mês.
4. **Configure smart default** para filtros: "Mês atual, Consolidado" como estado padrão ao abrir.

### Prioridade 2 — Alto impacto, esforço médio (próximas 2 semanas)

5. **Substitua os 3 gráficos de pizza** por gráficos de barras horizontais com rótulos diretos nas barras.
6. **Implemente progressive disclosure** nas tabelas: exibir 3 meses por padrão, 12 ou 24 com clique.
7. **Agrupe os 12 KPIs em 3–4 blocos semânticos** (ex: Financeiro, Operacional, Cliente, Pessoas) com títulos de bloco que resumem o status do grupo.
8. **Reduza os filtros laterais** a 3 visíveis + painel recolhível para filtros avançados.

### Prioridade 3 — Refinamento (próximo mês)

9. **Adicione o bloco "Para decidir hoje"** com 2–3 itens de ação pré-formatados.
10. **Implemente o toggle de contexto** (vs. meta / vs. mês anterior / vs. ano anterior).
11. **Aplique o Squint Test** na versão final — semicerre os olhos e confirme que apenas os 3 KPIs primários são legíveis.

---

## Checklists de Revisão

### Atenção
- [ ] O KPI mais importante domina tamanho + cor na tela?
- [ ] Os títulos dos gráficos entregam a conclusão (não o rótulo)?
- [ ] O Squint Test mostra apenas 3 elementos dominantes?
- [ ] Existe um ponto de entrada visual claro no canto superior esquerdo?

### Cognição
- [ ] Cada elemento tem uma função declarável?
- [ ] As tabelas usam progressive disclosure (não exibem 24 meses por padrão)?
- [ ] As legendas foram movidas para dentro dos gráficos?
- [ ] Os 12 KPIs estão agrupados em blocos semânticos de 3–4?
- [ ] Bordas decorativas, gradientes e efeitos 3D foram removidos?

### Emoção
- [ ] Verde/âmbar/vermelho são usados com base em status, não decoração?
- [ ] Existe uma linha editorial narrativa no topo?
- [ ] O vermelho é usado em no máximo 1–2 elementos?

### Decisão
- [ ] Existe um bloco "Para decidir" com ações pré-formatadas?
- [ ] Os filtros têm smart defaults configurados?
- [ ] O CEO consegue tomar a decisão principal sem alterar nenhum filtro?
- [ ] As métricas negativas têm framing de ação (não apenas de problema)?

---

**Proximo passo recomendado:** Abra o dashboard atual, aplique o Squint Test agora e anote quais KPIs sobrevivem visualmente. Se mais de 3 forem legíveis, você identificou exatamente onde a hierarquia visual precisa ser corrigida — esse é o ponto de entrada de menor esforço e maior retorno para o CEO.

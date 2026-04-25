# Referência: Acessibilidade, Tipografia e Leitura Digital

## Especificações Tipográficas para Legibilidade

### Parâmetros Obrigatórios de Texto

| Parâmetro | Especificação Técnica | Benefício |
|---|---|---|
| **Tamanho do Corpo** | Mínimo 16px (1rem) em apps de consumo; 14px em interfaces técnicas | Legibilidade em dispositivos variados |
| **Altura da Linha** | 1.5x a 1.6x o tamanho da fonte | Evita sobreposição visual entre linhas |
| **Espaço entre Palavras** | Mínimo 0.16x o tamanho da fonte | Ajuda leitores com dislexia a separar termos |
| **Espaço entre Letras** | Mínimo 0.12x o tamanho da fonte | Reduz efeito de crowding |
| **Margem de Parágrafo** | Mínimo 2.0x o tamanho da fonte | Distingue blocos de ideias |

### Escolha de Fonte

- **Sans-serif** (Arial, Verdana, Open Sans, Inter, Roboto) — superiores para leitura em tela por formas limpas e equilibradas
- **Dislexia**: fontes com bases mais pesadas (OpenDyslexic) visam dar forma única a cada letra; o benefício real vem do espaçamento aumentado, não do design dos glifos
- **Dados numéricos**: fontes com numerais tabulares (caractere de mesmo width por dígito) — colunas alinhadas pela casa decimal para comparação visual instantânea
- **Interfaces técnicas**: Monospace (Roboto Mono, JetBrains Mono) para valores de sensor, código e coordenadas

### Regras de Formatação

- **Alinhamento**: sempre à esquerda — fornece margem consistente como âncora ocular
- **PROIBIDO**: alinhamento justificado em digital — cria "rios de branco" que fragmentam o texto e dificultam rastreamento ocular, especialmente para dislexia
- **PROIBIDO**: texto inteiramente em MAIÚSCULAS — perde a silhueta da palavra, força leitura letra por letra
- **Hierarquia**: H1 com conclusão (não rótulo genérico) → H2 subtítulo → corpo → metadados/legendas

---

## WCAG 2.2 — Critérios Técnicos

### Contraste de Cores

| Cenário | Proporção Mínima (AA) | Proporção Excelência (AAA) |
|---|---|---|
| Texto normal (< 18pt regular / < 14pt bold) | 4.5:1 | 7:1 |
| Texto grande (≥ 18pt regular / ≥ 14pt bold) | 3:1 | — |
| Componentes de UI (bordas de input, ícones funcionais) | 3:1 | — |
| Estados de foco (anel de foco) | 3:1 contra botão E fundo | — |

**Erro mais comum na web:** contraste insuficiente em componentes de UI (não apenas texto). Bordas de campos de formulário e ícones devem manter 3:1 contra o fundo.

### Critérios WCAG 2.2 Críticos para Aplicações Técnicas

| Critério | Requisito | Impacto |
|---|---|---|
| **1.4.10 Reflow** | Adaptar para 320px sem scroll horizontal | Fundamental para usuários com 400% de zoom |
| **1.4.11 Contraste Não-Textual** | 3:1 para ícones e estados de componentes | Garante visibilidade de botões e status |
| **2.4.11 Foco não obscurecido** | Elementos focados visíveis na viewport | Evita usuário "se perder" em menus fixos |
| **2.5.8 Tamanho do Alvo** | Mínimo 24x24px para alvos de toque | Facilita interação com tremores ou telas pequenas |

### Reflow (1.4.10) — Implementação

- Use unidades relativas (%, em, rem) — nunca px fixo em containers
- Flexbox e CSS Grid para colunas que se empilham verticalmente em 320px
- Tabelas de dados: transforme em cards empilhados no mobile quando necessário
- Teste com zoom de 400% no browser (não apenas responsive design)
- Cabeçalhos fixos: verifique que não obscurecem elementos focados no scroll (critério 2.4.11)

---

## Dark Mode — Implementação Técnica

### Por que Dark Mode em Interfaces Técnicas

- Reduz fadiga visual em turnos longos (salas de controle com baixa iluminação)
- Economiza bateria em telas OLED
- Padrão para ferramentas de engenharia, IDEs e HMIs industriais

### Implementação Segura

**EVITE:**
- Preto puro (#000000) como fundo — causa "halação" em usuários com astigmatismo (texto claro parece "sangrar")
- Branco puro (#FFFFFF) como texto — muito agressivo contra escuro
- Cores saturadas em modo escuro — "vibram" visualmente contra fundo escuro, causando desconforto

**USE:**
- Fundo escuro: #1A1A1A, #121212, #1E1E1E (cinzas profundos)
- Texto primário: #E0E0E0 ou #F5F5F5 (brancos acinzentados)
- Elevação por camadas de cinza progressivamente mais claro (não por sombras — sombras são invisíveis em fundo escuro)

### Camadas de Elevação em Dark Mode (padrão IBM Carbon / Material Design)

| Camada | Valor de Cinza | Uso |
|---|---|---|
| Background | #121212 | Canvas base |
| Surface 1 | #1E1E1E | Painéis, cards |
| Surface 2 | #252525 | Modais, drawers |
| Surface 3 | #2D2D2D | Tooltips, menus dropdown |

---

## Padrões de Escaneamento e Arquitetura de Informação

### Padrões de Eye-Tracking

| Padrão | Comportamento | Estratégia de Design |
|---|---|---|
| **Padrão F** | Foco no topo e margem esquerda | Coloque conclusões e KPIs críticos no início das linhas |
| **Layer-cake** | Salta entre títulos e subtítulos | Use hierarquia semântica H1-H6 com títulos que entregam a conclusão |
| **Spotted** | Busca por termos específicos (datas, preços, valores) | Destaque termos-chave com cor, negrito ou diferentes tamanhos |
| **Padrão Z** | Zigue-zague entre elementos visuais | Ideal para landing pages com blocos alternados |

**Aplicação em dashboards técnicos:** posicione o KPI mais crítico no quadrante superior esquerdo — respeita o padrão F de leitura de usuários treinados.

### Pirâmide Invertida

- Conclusão e dado mais importante: primeiro
- Contexto e suporte: segundo
- Detalhes técnicos: terceiro (acessíveis via drill-down)

Em dashboards: resumo de status no topo, detalhe operacional abaixo, logs e diagnóstico via expansão.

---

## UX Writing e Microcopy Acessível

### Regras de Linguagem Simples (Plain Language)

- Frases curtas na voz ativa
- Evite jargão — mas use terminologia técnica precisa quando for padrão da indústria
- Nível de leitura: 8ª série para público geral (Flesch-Kincaid score 60-70)

### Padrões de Microcopy

| Elemento | Prática Incorreta | Prática Correta |
|---|---|---|
| **CTA (Botão)** | "Clique aqui" ou "OK" | "Gerar Relatório" / "Iniciar Simulação" |
| **Mensagem de Erro** | "Input inválido" ou "Erro 404" | "Insira um valor entre 0 e 100 para pressão" |
| **Instrução de Formato** | Apenas no placeholder (desaparece) | Texto de ajuda visível abaixo do rótulo |
| **Tom** | Passivo formal ("O formulário deve ser enviado") | Ativo direto ("Envie o formulário") |
| **Link** | "Saiba mais" | "Ver manual do sensor X" |

**Regra para rótulos de links e botões:** descritivos o suficiente para fazer sentido fora do contexto — usuários de leitores de tela navegam pela lista de links da página.

---

## Formulários Acessíveis

### Estrutura Obrigatória

- Label semântico associado a cada campo (atributo `for` ligado ao `id` do input)
- Instruções persistentes: nunca apenas no placeholder — labels e dicas de formato acima ou ao lado do campo, sempre visíveis
- Ordem lógica: instruções gerais → campos → botão de submissão (nunca instrução após o campo que ela descreve)

### Validação Acessível

- **Inline validation** preferível para campos críticos (força de senha, disponibilidade de nome)
- **Timing correto**: validação ao sair do campo (on blur) ou na submissão — não enquanto o usuário digita (interrompe leitores de tela)
- **Delay de anúncio**: ~500ms antes de anunciar erro via aria-live para não interromper usuário no meio da digitação
- **Gestão de foco pós-erro**: mova foco automaticamente para o primeiro campo com erro ou resumo de erros no topo

### Tabelas Acessíveis

| Elemento | Requisito | Função |
|---|---|---|
| `<caption>` | Tag logo após `<table>` | Título descritivo para identificação rápida |
| `<th>` com `scope` | `scope="col"` ou `scope="row"` | Relaciona cabeçalho ao dado para leitores de tela |
| Nunca use tabela para layout | Apenas para dados relacionais em grade | Leitores de tela anunciam contexto de cada célula |

**Leitores de tela em tabelas:** com `scope` correto, o leitor anuncia "Pressão: 4.5 bar" em vez de apenas "4.5" — reduz erro de interpretação em ambientes críticos.

---

## Princípio "Curb-Cut Effect"

Design para restrições beneficia todos:
- Alto contraste: ajuda deficientes visuais E usuários em telas sob luz solar
- Legendas em vídeo: ajuda surdos E usuários em ambientes ruidosos
- Reflow para zoom: ajuda baixa visão E usuários de dispositivos pequenos
- Validação inline: ajuda usuários com deficiências cognitivas E todos que cometem erros

**ROI de acessibilidade:** sites que corrigiram problemas de acessibilidade viram aumento de 23% no tráfego orgânico e passaram a ranquear para 27% mais palavras-chave — a estrutura acessível é valorizada pelos algoritmos do Google.

# Referência: Padrões de Dados, Telemetria, HMI e Design Systems de Engenharia

## Tabelas de Dados para Alta Densidade

A tabela é o motor central da maioria das aplicações de engenharia — ferramenta principal para escanear, filtrar, comparar e editar grandes conjuntos de dados.

### Padrões de Alinhamento

| Tipo de Dado | Alinhamento | Motivo |
|---|---|---|
| **Texto descritivo** | Esquerda | Fluxo natural de leitura ocidental |
| **Números quantitativos** (medidas, moeda, %) | Direita | Unidades e decimais alinhados verticalmente para comparação |
| **Números qualitativos** (datas, códigos postais, IDs) | Esquerda | Não são comparados por magnitude |
| **Cabeçalho de coluna** | Mesmo alinhamento do dado | Evita espaços vazios desconexos |

**Fontes monoespaçadas/tabulares para colunas numéricas** — cada dígito ocupa o mesmo espaço horizontal, permitindo alinhamento perfeito pela casa decimal.

### Formatação Numérica

| Tipo de Dado | Casas Decimais | Observação |
|---|---|---|
| Comprimento / Distância | 2 decimais | Ex: 15.75 m |
| Peso / Massa | 2 decimais | Ex: 8.50 kg |
| Moeda | 2 decimais | Separador de milhar por espaço em contexto internacional |
| Diâmetro / Precisão | 3 decimais | Ex: 12.350 mm |
| Coordenadas (Lat/Long) | 8 decimais | Ex: -23.55052000 |

### Recursos Avançados de Tabela

**1. Fixação de Cabeçalhos e Colunas**
- Cabeçalho fixo no topo durante rolagem vertical — contexto contínuo sobre colunas
- Primeira coluna (identificador principal) fixada durante rolagem horizontal — nunca perca a referência do dado

**2. Zebra Striping vs Divisores**
- Zebra stripes: linhas alternadas ajudam olhos a seguir fluxo horizontal em tabelas muito largas
- Divisores simples: suficientes para datasets menores, menor carga visual

**3. Density Controls (Controle de Densidade)**
- Ofereça opções: Compacta / Confortável / Espaçosa
- Compacta: mais dados sem scroll — para monitoramento intensivo
- Confortável: padrão produtivo
- Espaçosa: para leitura calma ou apresentações

**4. Virtualização de Linhas**
- Carregue apenas linhas visíveis no viewport + buffer pequeno
- Evita travamento do browser com milhares de linhas no DOM
- Ferramentas: react-virtual, TanStack Virtual, AG Grid virtualization

**5. Bulk Actions (Ações em Lote)**
- Seleção múltipla com checkbox: `Space` para selecionar, `Shift+Space` para range
- Barra de ações em lote aparece ao selecionar: "Aprovar (12)", "Arquivar (12)", "Excluir (12)"
- Confirme ações destrutivas em lote com modal proporcional ao risco

**6. Edição Inline**
- Duplo clique ou ícone de edição na célula entra em modo de edição
- `Enter` confirma, `Esc` cancela sem salvar
- Indicador visual (borda azul) diferencia células editáveis de somente-leitura

---

## Gestão de Densidade e Espaço Visual

### Filosofia de Densidade em Engenharia

Especialistas preferem interfaces densas porque reduzem dependência de memória de curto prazo — a informação necessária está visível, não escondida atrás de cliques.

**Contraste com B2C:** enquanto design de consumo usa whitespace para elegância, design de engenharia usa espaço apenas para separação lógica.

### Grid de Precisão

| Grid | Uso | Contexto |
|---|---|---|
| **4px base** | Separação de elementos dentro do mesmo componente | Linha de tabela, campo de input denso |
| **8px** | Separação entre componentes relacionados | Grupo de KPIs, seção de painel |
| **12px** | Separação entre seções distintas | Divisão de painéis, grupos de navegação |
| **16-24px** (B2C) | Elegância visual | Nunca em interfaces de engenharia intensiva |

### Eficiência de Pixels

Cada pixel deve justificar sua presença na tela. Remova:
- Barras de navegação excessivamente largas
- Cabeçalhos decorativos que não são o conteúdo
- Bordas e decorações sem função
- Animações sem propósito informativo (especialmente em HMIs — distrai do foco operacional)

### Hierarquia Tipográfica para Dados

| Elemento | Tamanho | Peso |
|---|---|---|
| Cabeçalhos de Seção | 16-18px | Semibold |
| Texto de Corpo / Dados | 14px | Regular |
| Rótulos e Metadados | 12px | Regular |
| Status e Alertas Críticos | 14px | Bold |

---

## Arquitetura de Informação e Árvores de Ativos

### Hierarquia de Ativos

Estrutura lógica que reflete a realidade física ou funcional:

```
Site
  └── Área
        └── Sistema
              └── Equipamento
                    └── Componente
```

**Recomendação:** máximo 4-5 níveis hierárquicos — mais do que isso torna a navegação pesada e propensa ao erro de contexto.

### Padrões Visuais para Tree Views

- **Ícones de âncora por tipo de nó**: motor, sensor, pasta, documento — reconhecimento visual instantâneo
- **Breadcrumbs**: trilha de navegação indica localização exata em sistemas complexos
- **Expansão progressiva**: nós inicialmente colapsados, expanda conforme necessidade
- **Contador de filhos**: "Área Norte (14)" mostra quantos subitens sem expandir
- **Composite Pattern no código**: trate objetos individuais e coleções uniformemente — simplifica lógica de estado em toda a árvore

### Busca dentro de Árvores

- Highlight de nós que correspondem ao termo buscado
- Auto-expansão dos ancestrais de nós encontrados
- Contador de resultados: "3 de 47 equipamentos"

---

## Busca Avançada, Filtros e Query Builders

### Lógica Booleana na Interface

Para repositórios de dados vastos, busca simples é insuficiente. Usuários técnicos precisam de precisão cirúrgica.

**Operadores:**
- **AND**: afunila resultados — todos os critérios devem ser atendidos
  - Ex: `Sensor: Temperatura AND Alarme: Ativo`
- **OR**: expande busca — qualquer critério atendido
  - Ex: `Status: Falha OR Status: Alerta`
- **NOT**: exclui registros indesejados
  - Ex: `Equipamento: Bomba NOT Área: Testes`

### Query Builder Visual

- Interface de "camadas horizontais" onde o usuário adiciona linhas de condições
- Agrupamento de condições com parênteses visuais (grupos AND/OR)
- Filtros ativos exibidos como "chips" acima dos resultados — removíveis individualmente ou todos de uma vez

### Tipos de Filtro

| Tipo | Descrição | Valor para Engenharia |
|---|---|---|
| **Filtros Facetados** | Categorias com contagem de resultados (Tipo: Sensor (24), Bomba (8)) | Orienta sobre volume antes de aplicar |
| **Filtros Dinâmicos** | Opções mudam com base em seleções anteriores | Reduz complexidade ocultando caminhos irrelevantes |
| **Busca Semântica / NLP** | Compreende linguagem natural e sinônimos | Facilita busca para usuários que não dominam códigos |
| **Salvamento de Filtros** | Nomear e salvar configurações de busca | Repetibilidade de análises diárias |

---

## Visualização de Dados e Telemetria em Tempo Real

### Princípios de Dashboards de Telemetria

**Regra de ouro:** limite a 5-7 KPIs primários na visualização principal — o usuário deve processar o estado geral do sistema em < 10 segundos.

**Componentes essenciais:**

- **Sparklines**: gráficos de linha em miniatura sem eixos, integrados ao lado de valores numéricos
  - "80 [linha descendo]" — contexto de tendência sem abrir janela separada
  - Ideal para tabelas de monitoramento onde cada linha tem sua própria tendência

- **Cor apenas para desvios**: fundo cinza neutro + elementos neutros garantem que vermelho/amarelo capturem atenção instantaneamente quando necessário. Nunca use cores vibrantes para decoração.

- **Frescor dos dados**: exiba claramente o timestamp da última atualização e o status da conexão (conectado, reconectando, offline)

- **Interatividade em tempo real**:
  - Pause o fluxo para analisar um evento sem perder histórico
  - Zoom em janelas temporais específicas
  - Click em ponto de dados para drill-down técnico (valor exato, timestamp, contexto)

### Seleção de Visualizações

| Objetivo | Gráfico Recomendado | Motivo |
|---|---|---|
| Comparação entre categorias | Barras | Superior para comparação discreta |
| Tendência temporal | Linha | Padrão para séries temporais |
| KPI com meta e faixas | Bullet chart | Mais informação que gauge no mesmo espaço |
| Correlação entre variáveis | Scatter plot | Identifica padrões e outliers |
| Distribuição | Histograma | Frequência de valores |
| Gauges / Medidores | Evite quando possível | Ineficiente — use bullet chart |

**Bullet chart vs Gauge:** o bullet chart mostra valor atual, meta e faixas qualitativas (abaixo/dentro/acima do esperado) em menos espaço que um velocímetro circular.

---

## ISA-101 e High Performance HMI (HPHMI)

Em ambientes industriais, o design de interfaces é regido pelo padrão ISA-101. O objetivo não é criar telas "bonitas" — é reduzir fadiga e aumentar segurança operacional.

### Filosofia HPHMI

Rompe com interfaces tradicionais baseadas em diagramas P&ID literais. Em vez de desenhar máquinas realistas em 3D, usa representações 2D minimalistas focadas em dados operacionais.

### Diretrizes Principais do ISA-101

- **Fundo cinza neutro**: reduz brilho e fadiga ocular em turnos de 12 horas; fornece melhor contraste para cores de alarme
- **Zero animação gratuita**: ventiladores giratórios, chamas em movimento, luzes piscantes sem função são PROIBIDOS — distraem do foco operacional
- **Cores funcionais exclusivamente**: vermelho/amarelo/verde reservados para status operacional, nunca para identidade visual
- **Elementos semióticos fixos**: cada cor e forma tem significado técnico único — elimina necessidade de interpretação

### Hierarquia de Quatro Níveis ISA-101

| Nível | Nome | Conteúdo |
|---|---|---|
| **Nível 1 (Overview)** | Visão Geral | KPIs globais de toda a área de controle; alerta geral |
| **Nível 2 (Process Unit)** | Unidade de Processo | Tela principal de controle para uma tarefa ou unidade específica |
| **Nível 3 (Equipment Detail)** | Detalhe de Equipamento | Parâmetros finos de uma máquina específica (bomba, válvula, sensor) |
| **Nível 4 (Support/Diagnostics)** | Diagnóstico | Logs de erros, manuais técnicos, histórico de manutenção |

### Sistema de Alarmes ISA-101

Cores associadas a formas geométricas para garantir acessibilidade para operadores daltônicos:

| Prioridade | Cor de Fundo | Forma Geométrica | Símbolo Texto |
|---|---|---|---|
| **Crítico** | Vermelho Piscante | Triângulo Invertido | 4 |
| **Alto** | Vermelho Sólido | Losango | 3 |
| **Médio** | Amarelo / Âmbar | Quadrado | 2 |
| **Baixo** | Branco / Amarelo Claro | Círculo | 1 |

**Redundância visual obrigatória:** cor + forma geométrica + número numérico. Sob estresse severo ou condições de iluminação ruins, o operador identifica urgência mesmo sem distinguir cores.

**Posicionamento do Core Chart:** informação mais crítica no quadrante superior esquerdo ou centro-esquerda — respeita padrão de leitura em F de operadores treinados.

---

## Design Systems para Engenharia

### IBM Carbon

**Foco:** estrutura e acessibilidade em dados densos
**Destaque:** tokens semânticos de cor para elevação (em vez de sombras), sistema de status indicators com cores e ícones padronizados
**Melhor para:** dashboards de monitoramento, gestão de infraestrutura, onde clareza é soberana
**Acessibilidade:** documentação mais meticulosa de padrões de filtragem e navegação acessível

### VMware Clarity

**Foco:** "Enterprise-Ready, Consumer-Simple"
**Destaque:** componente datagrid com suporte a milhares de entradas, filtragem e ordenação complexas integradas — performance como requisito não funcional
**Melhor para:** virtualização, gestão de redes, aplicações onde performance do componente é crítica

### STRUDEL (Scientific)

**Foco:** fluxos de trabalho de investigação científica
**Destaque:** organizado em "Task Flows" — modelos de telas que representam jornadas completas de cientistas (comparação de dados, execução de computações interativas, revisão de IA)
**Melhor para:** ferramentas científicas e de pesquisa onde o fluxo de trabalho é mais importante que componentes isolados

### Siemens iX (Industrial Experience)

**Foco:** contexto industrial com consistência entre web e mobile
**Destaque:** biblioteca de > 500 ícones técnicos testados para legibilidade em telas de baixa resolução; Web Components nativos
**Princípios:** Simplificar para clareza, Design para flexibilidade, Empoderar usuários, Construir para humanos
**Melhor para:** aplicações industriais Siemens, plataformas de automação, interfaces que precisam inspirar confiança técnica

### GE Predix

**Foco:** plataforma de internet industrial (IIoT)
**Destaque:** Atomic Design invertida com níveis "Applications" e "Principles" no topo; flexibilidade tecnológica via Web Components (funciona com React, Angular, Vue)
**Forte em:** visualização de dados complexos — séries temporais e mapas geográficos industriais
**Melhor para:** IIoT, telemetria de equipamentos industriais GE

### Ant Design

**Foco:** aplicações corporativas de grande escala
**Destaque:** biblioteca massiva de componentes para workflows complexos; ecossistema rico para aplicações React enterprise
**Melhor para:** ERPs, CRMs, plataformas administrativas complexas

### Como Escolher

| Critério | Recomendação |
|---|---|
| Ambiente industrial / SCADA | Siemens iX ou GE Predix |
| Infraestrutura / Cloud | VMware Clarity |
| Gestão e BI corporativo | IBM Carbon |
| Pesquisa científica | STRUDEL |
| B2B SaaS geral | Ant Design ou IBM Carbon |

**Jakob's Law:** para produtos de IA, adote padrões de interfaces líderes (OpenAI, HuggingFace) — usuários se sentirão familiarizados desde o primeiro contato. Consistência externa é tão valiosa quanto consistência interna.

---

## Performance Técnica como UX

Em aplicações de engenharia, um atraso de 500ms na atualização de um gráfico de telemetria ou na aplicação de um filtro pode ser a diferença entre uma intervenção bem-sucedida e uma falha de sistema.

### Estratégias de Carregamento Inteligente

- **Lazy Loading**: carregue apenas componentes/dados necessários para a visualização atual
- **Progressive Disclosure**: esconda recursos avançados atrás de expansores — reduz carga cognitiva inicial E elementos processados pelo browser
- **Skeleton Loaders**: demonstram que o sistema está operando durante processamentos pesados — gerenciam expectativa sem spinner genérico
- **Virtualização**: renderize apenas linhas/itens visíveis no viewport para datasets massivos

### Métricas de Performance para UI Técnica

- Atualização de dados de telemetria: target < 100ms de latência
- Resposta a filtros: < 200ms para parecer instantâneo
- Carregamento inicial de tabela com 10.000 linhas: < 500ms com virtualização
- Tempo de abertura de modal/drawer: < 150ms (mais lento parece travado)

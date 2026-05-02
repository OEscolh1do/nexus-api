# Referência: Botões, Interações e Navegação para Interfaces de Engenharia

## Hierarquia de Botões em Contextos Técnicos

Botões em aplicações de engenharia carregam responsabilidade adicional: sinalizar a gravidade e o resultado de operações técnicas. A hierarquia deve ser comunicada por peso visual, cor e posicionamento estratégico.

### Classificação Funcional

**1. Botão Primário**
- Representa a única ação principal que o usuário deve tomar para avançar no fluxo
- Máximo de 1 botão primário por contexto — ambiguidade paralisa a decisão
- Posicionamento: IBM Carbon coloca à direita para indicar progressão (modais/painéis); formulários de página inteira podem usar alinhamento à esquerda seguindo o foco visual
- Nunca use dois botões primários juntos

**2. Botão Secundário**
- Ações que complementam a principal com menor prioridade (Cancelar, Voltar, Salvar Rascunho)
- Nunca use isoladamente para uma ação positiva — sempre pareado com primário
- Estilo: borda sem preenchimento sólido de cor principal

**3. Botão Terciário / Ghost**
- Para interfaces de alta densidade: toolbars, linhas de tabela, áreas de ação secundária
- Minimiza peso visual — aparece como texto ou ícone sem borda
- Ideal para ações frequentes mas secundárias: "Editar", "Filtrar", "Exportar linha"
- Não use para ações destrutivas ou primárias

**4. Botão de Perigo (Danger)**
- Categoria crítica exclusiva de engenharia — ações irreversíveis ou destrutivas
- **Isolado** (sem par de confirmação): estilo secundário com borda vermelha — sinaliza risco sem criar falsa urgência
- **Em conjunto de confirmação** (modal de confirmação aberto): assume estilo primário com fundo vermelho sólido — sinaliza que o usuário deve tomar a decisão agora
- Exemplos de rótulos: "Apagar Cluster", "Desligar Sistema", "Excluir Permanentemente"

### Anatomia e Rótulos

| Elemento | Regra | Justificativa |
|---|---|---|
| **Rótulo** | Verbo de ação + Objeto específico | "Gerar Relatório", não "OK" |
| **Capitalização** | Sentence case (primeira letra maiúscula) | Maior velocidade de leitura vs. ALL CAPS |
| **Ícone** | Posicionado à direita do texto | Âncora visual para conclusão da leitura |
| **Padding** | Mínimo 16px entre texto e borda | Alvos de toque adequados + respiro visual |
| **Alinhamento de texto** | À esquerda dentro do botão | Consistência com outros campos de formulário |

### Tamanhos por Contexto

| Tamanho | Altura | Uso |
|---|---|---|
| **Small** | 32px | Pareado com inputs pequenos, dentro de linhas de tabela |
| **Default/Productive** | 40-48px | Ações principais de página |
| **Regra** | — | Nunca misture alturas diferentes no mesmo grupo de ações |

---

## 6 Estados de Interação — Ciclo de Vida Completo

Para que uma interface pareça responsiva e robusta, cada componente deve comunicar seu estado de forma inequívoca.

**1. Default (Habilitado)**
- Estado base que convida à interação
- Contraste suficiente para ser identificado como acionável

**2. Hover (Sobreposição)**
- Mudança sutil na cor de fundo ou borda — confirma que é clicável antes do clique
- Cursor muda para `pointer`
- Crucial para mouse; não existe em touch — nunca coloque informação crítica apenas no hover

**3. Focus (Foco)**
- Estado mais importante para acessibilidade e usuários de teclado
- Anel de destaque altamente visível (mínimo 3:1 de contraste contra fundo E botão)
- **NUNCA** remova `outline: none` sem fornecer alternativa visual clara
- Deve respeitar critério WCAG 2.4.11: foco nunca obscurecido por elementos fixos

**4. Active (Pressionado)**
- Micro-animação no momento do clique — simula depressão física do botão
- Confirmação final da intenção do usuário
- Duração: 100-150ms

**5. Loading (Progresso)**
- Quando a ação não é instantânea (> 1 segundo): spinner ou texto "Processando..."
- Botão DEVE ser desativado durante carregamento — evita cliques repetidos que causam erros de servidor
- Feedback por tempo de resposta:
  - < 1s: visual direto no componente
  - 1-10s: spinner ou barra de progresso obrigatório
  - > 10s: permita que o usuário continue em outras áreas; notifique conclusão via toast

**6. Disabled (Desativado)**
- Indica que a ação está indisponível
- **Anti-pattern em engenharia**: botão desativado sem explicação = frustração e suporte desnecessário
- **Boa prática**: mantenha habilitado e mostre erro na submissão COM explicação
- **Alternativa aceitável**: tooltip no estado desativado com os pré-requisitos ausentes (ex: "Você precisa selecionar ao menos uma linha")

---

## Navegação por Teclado para Interfaces Técnicas

Usuários técnicos desenvolvem memória muscular e preferem teclado para ganhar velocidade. Aplicação sem navegação completa por teclado é considerada incompleta.

### Princípio Fundamental

**Tab** → move o foco entre componentes (widgets)
**Setas** → navegam dentro de componentes com múltiplos elementos internos

### Padrões por Componente

**Data Grids / Tabelas:**
- O grid como um todo é um único ponto de tabulação (Tab para entrar, Tab para sair)
- Setas: navegam entre células
- `Home` / `End`: início ou fim da linha atual
- `Ctrl+Home` / `Ctrl+End`: início ou fim da tabela inteira
- `Space`: seleciona linha; `Shift+Space`: seleciona range
- `Enter`: abre modo de edição da célula

**Tree Views (Árvores de Ativos):**
- `Seta Cima/Baixo`: move entre nós visíveis
- `Seta Direita`: expande nó colapsado (ou move para filho se já expandido)
- `Seta Esquerda`: colapsa nó expandido (ou move para pai se já colapsado)
- `Enter` ou `Space`: seleciona item

**Modais:**
- **Focus trap obrigatório**: foco aprisionado dentro do modal enquanto aberto
- `Esc`: fecha o modal E devolve o foco ao elemento que o abriu
- Tab circula apenas entre elementos interativos do modal

**Dropdowns / Select:**
- `Alt+Seta Baixo` ou `Space`: abre menu
- `Seta Cima/Baixo`: navega entre opções
- `Enter` ou `Space`: seleciona opção e fecha
- `Esc`: fecha sem selecionar

### Atalhos de Especialista

| Atalho | Função | Convenção |
|---|---|---|
| `Ctrl+K` / `Cmd+K` | Command Palette — busca global de funcionalidades | Padrão moderno de produtividade |
| `Ctrl+S` | Salvar alterações atuais | Universal |
| `Ctrl+Z` / `Ctrl+Y` | Desfazer / Refazer | Gestão de erros |
| `Ctrl+F` | Busca dentro do contexto atual | Browser/Universal |
| `Esc` | Cancelar, fechar modal, sair do modo de edição | Recuperação de estado |
| `/` | Focar na busca/filtro do contexto | Padrão GitHub, Linear, Notion |

**Shortcuts Discovery:** pistas visuais em menus e tooltips para aprendizagem gradual. Em ferramentas de simulação ou CAD, atalhos de tecla única (P para Pan, Z para Zoom) são aceitáveis — mas NUNCA em formulários onde conflitam com digitação de texto.

---

## Command Palette (Ctrl+K)

O padrão de ouro para usuários especialistas em aplicações de alta complexidade. Elimina a navegação por menus profundos — o usuário digita o que quer fazer.

**Funcionalidades essenciais:**
- Busca por qualquer funcionalidade da aplicação (incluindo configurações, exportações, navegação)
- Histórico de comandos recentes
- Atalhos de teclado mostrados ao lado de cada comando
- Busca fuzzy (tolerante a erros de digitação)
- Agrupamento por categoria de resultado

**Exemplos de comandos:**
- "Exportar para CSV"
- "Mudar tema para Dark Mode"
- "Navegar para Painel de Sensores"
- "Criar novo relatório"

**Implementação:** acionado por `Ctrl+K` (Windows/Linux) ou `Cmd+K` (Mac). Modal centralizado com input de busca, lista de resultados rolável e navegação por setas + Enter.

---

## Gestão de Erros e Logs Técnicos

### Distinção entre Tipos de Erro

**Slips (Deslizes) — erro de execução:**
- O usuário tem a intenção correta mas comete erro acidental (typo, clique errado)
- Tratamento: Desfazer (Ctrl+Z), confirmações para ações críticas, validação inline de formato

**Mistakes (Erros de Modelo Mental):**
- O usuário não entende como o sistema funciona
- Tratamento: mensagens explicativas, tooltips informativos, documentação contextual

### Validação de Campos

- Valide no **blur** (ao sair do campo) ou na submissão — não enquanto o usuário digita
- Mensagem de erro posicionada adjacente ao campo (não apenas no topo do formulário)
- Tom não punitivo: "Insira um valor entre 0 e 100" — não "VALOR INVÁLIDO"
- Mantenha o valor errado no campo para que o usuário possa editar, não force limpar

### Erros de Sistema (500, timeouts)

Para erros técnicos: mensagem empática para o usuário + detalhes técnicos colapsáveis para o engenheiro:
- Request ID (para rastrear nos logs)
- Stack trace em seção expansível
- Botão "Copiar detalhes para clipboard" — facilita reporte de bug

**Integração de logs diretamente na UI:** transforma falhas técnicas em insights de experiência — valor alto em ferramentas de engenharia.

---

## Operações de Missão Crítica: Confirmação e Rollback

### Estratégias de Confirmação Proporcionais ao Risco

**Baixo risco** (ação reversível): toast de confirmação + opção de desfazer
```
"Relatório arquivado. [Desfazer]"
```

**Médio risco** (ação reversível mas impactante): modal de confirmação simples com descrição do impacto

**Alto risco** (ação irreversível): exija digitação do nome do recurso
```
"Para apagar permanentemente CLUSTER-A, digite o nome do cluster:"
[ CLUSTER-A____________ ]    [Cancelar] [APAGAR CLUSTER]
```

**Deploy/operações em lote**: Pre-deployment Checklist + Diff das mudanças antes de permitir execução

### Padrão de Rollback

| Método | Gatilho | Tempo de Resposta | Aplicação |
|---|---|---|---|
| **Automático** | Degradação de métricas de performance | Segundos a minutos | Deploy de modelos de ML em produção |
| **Manual** | Botão de reversão na UI | Imediato | Falhas detectadas por observação humana |
| **Detecção de Anomalia** | Desvios estatísticos de distribuição | Milissegundos | Sistemas de alta segurança e trading |
| **Baseado em Tempo** | Ausência de reporte de sucesso após timeout | Minutos | Atualizações de firmware OTA |

**Interface de rollback deve mostrar:**
- Versão atual vs versão anterior (diff)
- Motivo da reversão
- Status da integridade dos dados durante o processo
- Para ambientes de scheduling: garantir que transações pendentes não sejam perdidas

---

## Terminologia Técnica e Nomenclatura

### Boas Práticas

- **Linguagem simples mas técnica**: evite jargão desnecessário, mas use termos do domínio quando são padrão da indústria
  - Use "Repositório" em vez de "Pasta" em contexto de controle de versão
  - Use "Cluster" em vez de "Grupo de Servidores" em contexto cloud
- **Sentence case** para rótulos de campos, botões e mensagens
- **Title Case** para títulos de páginas e relatórios
- **Consistência de estado**: escolha entre "Ativo/Inativo" OU "Ligado/Desligado" OU "Habilitado/Desabilitado" — nunca misture
- **Evite genéricos**: "Configurações de Rede" não "Configurações"; "Parâmetros do Sensor X" não "Item 1"

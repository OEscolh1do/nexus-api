# Vocabulário Visual: View de Módulos (Construtor de Arranjos)

Este documento estabelece a **linguagem ubíqua (ubiquitous language)** entre o Engenheiro de Software (Desenvolvedor) e a Inteligência Artificial (Arquiteto de UI) para a Aba de Módulos do Kurupira. 

A ideia é nomear com precisão cirúrgica cada bloco, painel e micro-interação, para que as referências em futuras solicitações de manutenção e refatoração sejam exatas.

---

## 1. O Layout Base (Root Container)
**Nome Técnico:** `ModuleCanvasView` (Split-Pane Layout)
A tela é dividida horizontalmente em dois grandes painéis que não rolam juntos (overflows independentes).
- **Esquerda (30%):** O `HardwareLibraryPanel`.
- **Direita (70%):** O `PVArrayBuilder`.
- **Inferior (Flutuante):** O `ComparisonDrawer` (oculto por padrão).

---

## 2. Painel Esquerdo: A Biblioteca (`HardwareLibraryPanel`)
O espaço fixo à esquerda (fundo escuro e opaco), dedicado à seleção e busca de equipamentos.

### 2.1. Library Header Bar
A faixa superior fixa do painel.
- **Componentes:**
  - **Title Badge:** Ícone de pacote laranja com texto "BIBLIOTECA DE HARDWARE".
  - **Upload Button (.PAN):** O pequeno botão cinza com borda interativa para importar arquivos do PVSyst.

### 2.2. Search Box
- A barra de pesquisa logo abaixo do cabeçalho.
- Fundo muito escuro (`bg-slate-950`), ícone de lupa, e um placeholder *uppercase*.

### 2.3. Catalog List
- A área scrollável contendo a listagem contínua de todos os hardwares disponíveis.

### 2.4. Module Card (`ModuleCard.tsx`)
- O retângulo clicável que representa um único equipamento na biblioteca.
- **Micro-anatomia do Module Card (Alta Densidade):**
  - **Título & Status Row:** Faixa superior unificada.
    - *Fabricante & Potência:* Nome e Wp em destaque laranja.
    - *Unit Badge:* Quantidade sugerida (ex: "18 UN").
    - *Status Indicators:* Badge "ATIVO" (se selecionado) e botão de comparar.
  - **Data Area:** Bloco central compacto.
    - *Modelo:* Texto em cinza, uppercase.
    - *Telemetria Line:* Geração (GEN) e Eficiência (EFIC) em uma única linha horizontal com divisores.
  - **Tech & ID Column:** Canto inferior direito.
    - *Tech Pill:* Badge minimalista de tecnologia (BIFACIAL/MONO-PERC).
    - *ID Snippet:* Primeiros 6 caracteres do ID único do hardware.
  - **Selection Bar:** Linha vertical de 2px na borda esquerda indicando seleção ativa.


### 2.5. Technical Review Modal (`PANReviewModal.tsx`)
- Overlay de intertravamento acionado após o upload de arquivos `.PAN`.
- **Funcionalidades de Engenharia:**
  - **Spec Comparison Grid:** Exibição lado a lado de dados elétricos e físicos.
  - **Collision Detection Banner:** Faixa superior que identifica se o hardware já existe no catálogo.
  - **Technical Diff:** Destaque em âmbar para valores que divergem do hardware já homologado no sistema, com riscado (`line-through`) para o valor original.
  - **Decision Actions:**
    - *Confirmar Adição:* Injeta no catálogo (se duplicata, adiciona sufixo "(Importado)").
    - *Usar Existente:* Descarta o upload em favor do hardware já presente.
    - *Descartar:* Cancela a operação sem alterações.

---

## 3. Painel Direito: O Workspace (`PVArrayBuilder`)
A prancheta principal de engenharia (fundo escuro com sutil gradiente radial no fundo). É aqui que o sistema está sendo dimensionado.

### 3.1. Global Cockpit (Header Fixo)
A grande barra fixada no topo do painel direito. Dá o resumo total do projeto.
- **Title Area:** Lado esquerdo. Um quadrado laranja chamativo (com ícone), o título "Workspace de Arranjos" e a contagem de sub-sistemas em cinza.
- **Global Metrics Panel:** Lado direito.
  - **Potência Global DC:** O número grande em laranja contabilizando todos os kWp empilhados (ex: `14.50 kWp`).
  - **Adherence Bar (Barra de Aderência):** O indicador de preenchimento. Tem o alvo numérico (ex: `15.00kWp`) em cima e a barra de progresso. A barra muda de Laranja (incompleto) para Verde/Emerald (alvo atingido).

### 3.2. Builder Canvas
A área central imensa com barra de rolagem (scroll). Onde empilhamos os hardwares.
- **Empty State Indicator:** O que aparece quando a tela inicia. Um grande ícone e o texto "Nenhum arranjo definido".

### 3.3. Array Card (`PVArrayCard.tsx`)
Quando você clica num módulo na biblioteca, ele "pula" para o Builder Canvas formando um Array Card. É um card horizontal imenso divido em colunas lógicas.
- **Micro-anatomia do Array Card:**
  - **Floating Trash Button:** O pequeno botão quadrado vermelho/cinza escondido na quina superior direita (metade para fora do card) usado para excluir o arranjo.
  - **Identity Panel (Lado Esquerdo):**
    - Ícone de "Raio" em um quadrado com borda laranja.
    - Nome do arranjo (ex: "ARRANJO 1").
    - **Total kWp:** O número grande branco (`14.50`) mostrando a potência EXATA DESSA fileira.
    - **Brand/Model Details:** Fabricante laranja em cima, modelo cinza embaixo.
  - **JogScrubber (Controle de Quantidade):** O bloco escuro colado abaixo da Identity. Contém um botão `-`, um número branco gigante (A Quantidade de Módulos) e um botão `+`.
  - **Engineering Section (Lado Direito):** O painel cinza levemente mais escuro cheio de cálculos técnicos.
    - **Mini I-V Curve (Technical Diagram):** Opcional em telas grandes. O pequeno gráfico SVG plotando o joelho da curva de potência e mostrando o ponto MPP amarelo pulsante.
    - **Telemetry Grid (Matriz de Limites Térmicos):** A grade 2x2 com os alertas térmicos:
      - *Voc Máx (10°C)*: Texto vermelho.
      - *Vmp Crítico (70°C)*: Texto vermelho/laranja.
      - *Isc Máx*: Corrente.
      - *Área Total*: Espaço em m².
    - **String Limits Box (Compatibilidade de String):** A caixa inferior (borda superior fina). Possui o ícone verde de escudo e mostra, em dois retângulos escuros, as margens de mínimo e máximo de módulos permitidos em série para *Inversores de 600V* e *Inversores de 1000V*.

---

## 4. Rodapé Flutuante: O Comparador (`ComparisonDrawer`)
Este bloco é o *Drawer* que desliza do fundo da tela apenas se você apertou o "Compare Button" em algum `ModuleCard` da biblioteca.
- Fica fixado sobre tudo.
- **Comparison Shelf:** O interior do Drawer que acomoda os módulos lado a lado. Tem um botão de fechar (X) na quina.

---

### 💡 Dica de Comunicação
Quando quiser alterar algo, basta usar os termos acima. Exemplos:
- *"Mude a cor do **Unit Badge** dentro do **Module Card**."*
- *"Quero adicionar uma métrica nova no **Telemetry Grid** do **Array Card**."*
- *"Vamos mover o **Upload Button (.PAN)** para dentro do **Search Box**."*

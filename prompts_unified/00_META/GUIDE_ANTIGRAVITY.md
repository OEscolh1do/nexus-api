# 🌌 Guia do Antigravity: Manual de Operação

> **📍 VOCÊ ESTÁ AQUI:** 🏠 [Início](./) > 📘 Guias > 🌌 Antigravity Engine  
> **🎯 OBJETIVO:** Dominar os modos, modelos e alavancas do sistema  
> **⏱️ TEMPO:** 8-10min leitura + tempo de consultas futuras  
> **🛠️ PRÉ-REQUISITO:** Familiaridade básica com os templates

---

> **📌 LEITURA RÁPIDA (TL;DR)**  
> Este sistema não é um simples Chatbot. É uma **Engine de Engenharia de Software**.  
> Este guia explica como operar as alavancas para obter código de alta qualidade.

---

## 1. 🧠 Seletor de Inteligência (Modelos)

Cada modelo tem uma "personalidade" técnica. Escolha com sabedoria para evitar frustração.

### 🔵 Família Gemini (Google)

| Modelo             | Especialidade (Stack)                                      | Quando Usar                                                                                                    |
| :----------------- | :--------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| **Gemini 3 Pro**   | **Full-Stack & Lógica Pura**<br>(Node.js, SQL, Algoritmos) | **O Arquiteto.** Use para planejar sistemas, criar lógicas de backend complexas e refatorações pesadas.        |
| **Gemini 3 Flash** | **Tarefas Repetitivas**<br>(Scripts, RegEx, Conversões)    | **O Estagiário Rápido.** Use para scripts simples, explicar erros básicos ou converter formatos (JSON -> CSV). |

### 🟠 Família Claude (Anthropic)

| Modelo                     | Especialidade (Stack)                                         | Quando Usar                                                                                                      |
| :------------------------- | :------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------- |
| **Sonnet 4.5**             | **Frontend & Documentação**<br>(React, CSS, Tailwind, Textos) | **O Designer/Front-end.** O melhor para criar UIs bonitas, escrever documentação humana e explicações didáticas. |
| **Sonnet/Opus (Thinking)** | **Debugging Hardcore**<br>(Race Conditions, Memory Leaks)     | **O Detetive.** Use quando ninguém sabe por que o código quebrou. Ele "pensa" antes de responder.                |

---

## 2. 🎛️ Modos de Operação

O sistema opera em duas frequências distintas. Saber alternar é o segredo da produtividade.

### 🅰️ Conversation Mode (O Chat)

_Estado padrão. Respostas rápidas, interação direta._

#### Perfil: ⚡ FAST (Rápido)

- **Comportamento:** Resposta imediata. Assume o caminho mais curto.
- **Ideal para:** Dúvidas de sintaxe, comandos de terminal, correções de uma linha.
- **Exemplo:** "Como reverto o último commit no git?", "Centralize essa div."

#### Perfil: 🧠 PLANNING (Planejamento)

- **Comportamento:** Analisa o pedido, simula cenários, gera estratégias.
- **Ideal para:** Antes de começar uma tarefa grande.
- **Prompt Sugerido:** `TEMPLATE_01_ARCHITECT.md`

### 🅱️ Agentic Mode (A Fábrica)

_Estado de trabalho autônomo. O sistema assume o controle do terminal e editor._

- **Comportamento:** Cria arquivos, roda testes, corrige erros sozinho.
- **Gatilho:** Pedidos complexos ("Crie um módulo...", "Refatore o sistema...").
- **Visualização:** A interface muda para blocos de tarefas (`Task Boundary`).

---

## 3. 🗺️ Mapa de Batalha: Qual Prompt Usar?

Use esta tabela para decidir rapidamente qual ferramenta sacar do cinto `_prompts/`.

| Cenário (O que você quer?)             |      Modo Indicado      |  Modelo Sugerido  | Prompt (Template)          |
| :------------------------------------- | :---------------------: | :---------------: | :------------------------- |
| **"Tenho uma ideia de Feature nova"**  | Conversation (Planning) |   Gemini 3 Pro    | `TEMPLATE_01_ARCHITECT.md` |
| **"O plano está pronto. Code agora."** |      Agentic Mode       |   Gemini 3 Pro    | `TEMPLATE_02_ENGINEER.md`  |
| **"O código está sujo/feio."**         |      Agentic Mode       |   Claude Sonnet   | `TEMPLATE_03_REFACTOR.md`  |
| **"Deu erro e não sei porquê."**       | Conversation (Thinking) | Claude (Thinking) | `TEMPLATE_04_DEBUG.md`     |
| **"Ninguém sabe usar isso aqui."**     |      Agentic Mode       |   Claude Sonnet   | `TEMPLATE_05_DOCS.md`      |
| **"Preciso garantir que não quebre."** |      Agentic Mode       |   Gemini 3 Pro    | `TEMPLATE_06_TESTS.md`     |

---

## 4. ⚙️ Ciclo de Vida do "Agentic Mode"

Quando o sistema entra no **Agentic Mode**, ele segue um protocolo rígido. Não interrompa, a menos que o sistema peça.

1.  **� PLANNING (Planejamento)**
    - O sistema cria `task.md` (Checklist).
    - Gera `implementation_plan.md` (Plano Técnico).
    - **AÇÃO DO USUÁRIO:** Revisar e aprovar o plano quando solicitado (`notify_user`).

2.  **🔨 EXECUTION (Execução)**
    - Edição de arquivos em massa.
    - Execução de comandos de terminal.
    - **AÇÃO DO USUÁRIO:** Apenas observar os logs.

3.  **✅ VERIFICATION (Verificação)**
    - Testes finais.
    - Geração de `walkthrough.md` (Relatório do que foi feito).
    - **AÇÃO DO USUÁRIO:** Testar a feature no navegador.

---

> **DICA DE OURO (TDAH):**  
> Se você sentir que perdeu o controle do que a IA está fazendo:
>
> 1. Digite **"PARE"**.
> 2. Vá na pasta `_prompts`.
> 3. Copie o `TEMPLATE_01_ARCHITECT.md`.
> 4. Recomece organizando o caos.

---

## ✅ Resumo em 3 Frases

1. **Cada modelo IA tem especialidade** → Gemini (backend), Claude (frontend)
2. **Conversation Mode vs Agentic Mode** → Chat rápido vs Execução autônoma
3. **Mapa de Batalha é sua bússola** → Use a tabela para decidir modelo+template

## 🔗 Próximos Passos

**Se quer praticar a seleção de modelos:**
→ Teste com [TEMPLATE_01_ARCHITECT](./TEMPLATE_01_ARCHITECT.md) usando diferentes modelos

**Se quer entender O PORQUÊ dos templates:**
→ Leia [GUIDE_AI_MASTERY](./GUIDE_AI_MASTERY.md)

**Se precisa de referência rápida:**
→ Imprima o [CHEATSHEET_VISUAL](./CHEATSHEET_VISUAL.md)

**Se está com problema específico:**
→ Consulte [FAQ_ERROS_COMUNS](./FAQ_ERROS_COMUNS.md)

---

[🔝 Voltar ao topo](#-guia-do-antigravity-manual-de-operação)

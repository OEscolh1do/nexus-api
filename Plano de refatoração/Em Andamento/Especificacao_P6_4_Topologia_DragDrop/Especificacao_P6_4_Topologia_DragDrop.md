# Especificação: LeftOutliner — Flat Tree com Agrupamento (v4)

**Status:** Aprovada para Planejamento Arquitetural  
**Feature:** P6.4 — Topologia Nativa (File-Explorer Style)

---

## 1. Visão Arquitetural Definitiva

A sidebar se comporta **exatamente como um explorador de arquivos do sistema operacional**. Os módulos não são mais números abstratos (`quantity: 50`), mas **objetos individuais reais** na store. Isso alcança paridade 1:1 absoluta com o mundo físico (mapa 3D).

Para lidar com dezenas/centenas de módulos sem poluir a UX, introduzimos o conceito de **pastas virtuais** e **Strings (Grupos)**.

---

## 2. Estrutura Visual (O "File Explorer")

```text
📂 OUTLINER
│
├─ 🔲 PHB 1500-XS                    ← Inversor (Pasta Raiz)
│  └─ 🔌 MPPT 1                      ← MPPT (Subpasta)
│     └─ 🔗 String A                 ← Grupo de Módulos (Sub-subpasta)
│        ├─ ☀️ Mod-001               ← Objeto Individual (Arquivo)
│        └─ ☀️ Mod-002
│     
├─ 🔗 Strings Desconectadas          ← Pasta Virtual (Gerada pela UI)
│  └─ 🔗 String B
│     ├─ ☀️ Mod-003
│     └─ ☀️ Mod-004
│
└─ 📦 Módulos Livres                 ← Pasta Virtual (Gerada pela UI)
   ├─ ☀️ Mod-005                     ← Objeto Individual solto
   ├─ ☀️ Mod-006
   └─ ☀️ Mod-007
```

---

## 3. Fluxo de Trabalho do Engenheiro

### 3.1 Seleção (Multi-Select)
- O usuário abre a pasta `📦 Módulos Livres`.
- Ele clica no `Mod-005`, segura `Shift` e clica no `Mod-015` (seleciona 10 módulos simultaneamente).
- Feedback visual: Background de destaque nos módulos selecionados.

### 3.2 Criação de Strings (Agrupamento)
- Com os módulos selecionados, ele clica com o **Botão Direito**.
- Menu de Contexto (Context Menu) aparece: `[+] Criar String`.
- Ao clicar: os 10 módulos somem de `Módulos Livres` e aparece um novo nó `🔗 String 1` na pasta `Strings Desconectadas`. (A String pode ser renomeada por default ou pelo usuário).

### 3.3 Atribuição Simples (Drag & Drop do Grupo)
- O usuário arrasta inteiramente a `🔗 String 1`.
- Solta em cima do `🔌 MPPT 1`.
- A string inteira (e seus 10 módulos filhos) move-se para dentro do MPPT.

### 3.4 Micro-Ajustes (Mover 1 Módulo)
- O usuário expande a `🔗 String 1` lá dentro do MPPT.
- Ele descobre que calculou errado e quer tirar 1 painel da string.
- Ele clica apenas no `☀️ Mod-010` e **arrasta ele para a pasta `📦 Módulos Livres`** (ou para a lixeira/devolver).
- O módulo desvincula silenciosamente da String e o estado total atualiza.

---

## 4. O Que Isso Exige do Código (Under the Hood)

Esta UX fenomenal exige uma mudança profunda e definitiva no `Zustand`:

1. **O Fim da Quantidade Numérica:** O catálogo e a store precisam parar de usar `quantity: N`. Quando o usuário pedir 50 painéis, a store gerará um Array ou Objeto Normalizado com 50 UUIDs (`mod-1`, `mod-2`, etc).
2. **Entidade `LogicalString`:** Precisaremos de um novo reducer/slice na store para armazenar a entidade String (`{ id: 'str-1', label: 'String A', mpptId: 'mppt-x' | null, modules: ['mod-1', 'mod-2'] }`).
3. **Árvore Dinâmica (dnd-kit ou react-dnd):** A árvore atual (`LeftOutliner`) suporta drag & drop simples HTML5. Para multi-seleção nativa (Shift+Click) + Context Menu + Dragging complexo (drop entre pastas, drop into groups), precisaremos robustecer o sistema de DnD, possivelmente adicionando uma biblioteca leve como `@dnd-kit/core` caso o HTML5 cru não dê conta dos edge-cases de multi-drag.

---

## 5. Próximo Passo

Se você aprovar esta UX final (v4), nós a engessaremos. O próximo passo será gerar o `/speckit.plan` para definir **exatamente** como reescrever o model do Zustand (`useTechStore` e `solarStore`) e qual biblioteca/técnica usaremos para montar essa "treeview" digna do VSCode.

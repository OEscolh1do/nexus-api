# 🎨 Redesenhar Sidebar/Navegação - Neonorte | Nexus 2.0

> **🎯 Cenário de Uso**
>
> Você precisa reorganizar a navegação de um módulo (sidebar, menu, tabs) para melhorar a arquitetura de informação e hierarquia visual.
>
> **⏱️ Tempo Estimado:** 30-45 minutos (2 fases)

---

## 🔄 Abordagem em 2 Fases

Este template segue o padrão **Planning → Execution** para garantir que o redesign seja bem pensado antes da implementação.

### Fase 1: Planning (UX Design)

- Analisar navegação atual
- Propor agrupamento lógico
- Criar mockup textual
- **Output:** `ux_proposal.md`

### Fase 2: Execution (Implementação)

- Refatorar estrutura de dados
- Atualizar componente React
- Manter funcionalidade existente
- **Output:** Código funcional

---

## 📋 FASE 1: PLANNING (Copie este prompt)

```xml
<system_role>
  Atue como **UX/UI Designer & Frontend Architect**.
  Especialidade: Navegação complexa e arquitetura de informação.
</system_role>

<mission>
  Planejar a reorganização visual e lógica da Sidebar do Módulo {{NOME_DO_MODULO}}.

  Problema Atual: {{DESCREVA_O_PROBLEMA}}
  Exemplo: "Todos os itens estão listados juntos sob um único cabeçalho, tornando a navegação difícil."

  Objetivo: {{DESCREVA_O_OBJETIVO}}
  Exemplo: "Agrupar itens por afinidade funcional (Gestão vs Execução) e melhorar hierarquia visual."
</mission>

<input_context>
  <critical_files>
    <file path="{{CAMINHO_ABSOLUTO_DO_COMPONENTE}}" description="Contém a array menuItems e o JSX da sidebar" />
    <!-- Exemplo: nexus-monolith/frontend/src/views/ops/OpsLayout.tsx -->
  </critical_files>

  <user_requirements>
    <frontend>
      1. ANALISE os itens atuais: {{LISTAR_ITENS_ATUAIS}}
      2. PROPONHA 2 ou 3 grupos lógicos (ex: "Planejamento Estratégico", "Execução Diária", "Monitoramento")
      3. O código deve continuar usando `lucide-react` para ícones
      4. O visual deve manter a identidade "{{MODULO}}" (Tons de {{COR_PRIMARIA}} e Slate), mas com separadores ou títulos de seção claros
    </frontend>

    <constraints>
      - NÃO mude as rotas (URLs) existentes, apenas a forma como são apresentadas
      - Mantenha o design responsivo (mobile hidden) que já existe
      - {{OUTRAS_RESTRICOES}}
    </constraints>
  </user_requirements>
</input_context>

<output_instruction>
  NÃO ESCREVA CÓDIGO AINDA.

  Gere um artefato `ux_proposal.md` contendo:

  1. **Análise de Agrupamento:**
     - Quais itens vão para qual grupo e por quê
     - Justificativa de cada agrupamento

  2. **Estrutura de Dados:**
     - Como ficará a nova const `menuItems` (agora aninhada ou dividida em grupos)
     - Exemplo em TypeScript/JavaScript

  3. **Mockup Textual:**
     - Representação visual de como ficará a ordem na tela
     - Usar indentação para mostrar hierarquia

  4. **Padrões Visuais:**
     - Cores para cada grupo (se aplicável)
     - Espaçamento entre grupos
     - Estilo dos títulos de seção
</output_instruction>
```

---

## 🔧 FASE 2: EXECUTION (Copie este prompt APÓS aprovar ux_proposal.md)

````xml
<mission>
  Executar o redesenho da Sidebar conforme definido em `ux_proposal.md`.
</mission>

<execution_protocol>
  <step_1>
    Refatore a constante `menuItems` em {{COMPONENTE}} para refletir os novos grupos definidos no ux_proposal.md.

    Estrutura esperada:
    ```typescript
    const menuGroups = [
      {
        title: "Grupo 1",
        items: [
          { path: "/path", label: "Label", icon: IconComponent }
        ]
      },
      // ... outros grupos
    ];
    ```
  </step_1>

  <step_2>
    Atualize o JSX para iterar sobre esses grupos, adicionando títulos de seção (pequenos e cinza) entre eles.

    Padrão visual:
    ```tsx
    {menuGroups.map((group, groupIndex) => (
      <div key={groupIndex}>
        <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          {group.title}
        </p>
        <div className="space-y-1">
          {group.items.map(item => (
            // ... renderizar item
          ))}
        </div>
      </div>
    ))}
    ```
  </step_2>

  <step_3>
    Verifique que o active state (highlight) continua funcionando:
    ```tsx
    const isActive = location.pathname.startsWith(item.path);
    ```
  </step_3>
</execution_protocol>

<red_lines>
  🔴 **RESTRIÇÕES CRÍTICAS:**
  - Mantenha a funcionalidade de "Link Ativo" (highlight) funcionando
  - NÃO altere o Layout principal, apenas o conteúdo da Sidebar (<aside>)
  - NÃO mude as rotas (URLs) existentes
  - Mantenha o design responsivo (hidden md:flex)
  - {{OUTRAS_RED_LINES}}
</red_lines>

<final_checklist>
  Antes de marcar como concluído:
  - [ ] Grupos lógicos implementados conforme ux_proposal.md
  - [ ] Títulos de seção visíveis e estilizados
  - [ ] Active state funcionando (link atual destacado)
  - [ ] Identidade visual do módulo preservada
  - [ ] Responsivo testado (mobile hidden)
  - [ ] Todas as rotas acessíveis
  - [ ] Código compila sem erros
</final_checklist>
````

---

## 📖 Exemplo Completo: Redesign da Sidebar do Módulo Operations

### Contexto

**Problema:** Todos os 8 itens estavam listados sob um único cabeçalho "Produção", dificultando navegação.

**Objetivo:** Agrupar por afinidade funcional e criar hierarquia visual clara.

### Fase 1: UX Proposal (Resultado)

**Análise de Agrupamento:**

```markdown
## Grupo 1: Planejamento & Estratégia

- Cockpit Projetos (visão geral executiva)
- Estratégia (OKRs e metas)
- Portfólio (gestão de projetos)

Justificativa: Itens focados em decisões estratégicas e visão macro.

## Grupo 2: Execução Tática

- Cronograma Mestre (Gantt)
- Kanban (fluxo de trabalho)
- Aprovações (reviews)

Justificativa: Ferramentas do dia-a-dia para execução.

## Grupo 3: Inteligência

- Mapa Operacional (visualização geográfica)
- Gargalos (issues e problemas)

Justificativa: Análise e monitoramento.
```

**Estrutura de Dados Proposta:**

```typescript
const menuGroups = [
  {
    title: "Planejamento & Estratégia",
    items: [
      { path: "/ops/cockpit", label: "Cockpit Projetos", icon: HardHat },
      { path: "/ops/strategy", label: "Estratégia", icon: Target },
      { path: "/ops/portfolio", label: "Portfólio", icon: Briefcase },
    ],
  },
  {
    title: "Execução Tática",
    items: [
      { path: "/ops/gantt", label: "Cronograma Mestre", icon: CalendarRange },
      { path: "/ops/kanban", label: "Kanban", icon: Workflow },
      { path: "/ops/reviews", label: "Aprovações", icon: ClipboardCheck },
    ],
  },
  {
    title: "Inteligência",
    items: [
      { path: "/ops/map", label: "Mapa Operacional", icon: Map },
      { path: "/ops/issues", label: "Gargalos", icon: AlertTriangle },
    ],
  },
];
```

**Mockup Textual:**

```
┌─────────────────────────────┐
│ NEXUS                       │
│ Operations View             │
├─────────────────────────────┤
│ PLANEJAMENTO & ESTRATÉGIA   │ ← Título de seção (cinza, pequeno)
│   🏗️ Cockpit Projetos       │
│   🎯 Estratégia             │
│   💼 Portfólio              │
│                             │
│ EXECUÇÃO TÁTICA             │
│   📅 Cronograma Mestre      │
│   🔄 Kanban                 │ ← Item ativo (laranja)
│   ✅ Aprovações             │
│                             │
│ INTELIGÊNCIA                │
│   🗺️ Mapa Operacional       │
│   ⚠️ Gargalos               │
├─────────────────────────────┤
│ ← Trocar Módulo             │
└─────────────────────────────┘
```

### Fase 2: Implementação (Código Final)

```tsx
// nexus-monolith/frontend/src/views/ops/OpsLayout.tsx
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  HardHat,
  ClipboardCheck,
  Map,
  AlertTriangle,
  ArrowLeft,
  CalendarRange,
  Target,
  Workflow,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/mock-components";

export function OpsLayout() {
  const location = useLocation();

  const menuGroups = [
    {
      title: "Planejamento & Estratégia",
      items: [
        { path: "/ops/cockpit", label: "Cockpit Projetos", icon: HardHat },
        { path: "/ops/strategy", label: "Estratégia", icon: Target },
        { path: "/ops/portfolio", label: "Portfólio", icon: Briefcase },
      ],
    },
    {
      title: "Execução Tática",
      items: [
        { path: "/ops/gantt", label: "Cronograma Mestre", icon: CalendarRange },
        { path: "/ops/kanban", label: "Kanban", icon: Workflow },
        { path: "/ops/reviews", label: "Aprovações", icon: ClipboardCheck },
      ],
    },
    {
      title: "Inteligência",
      items: [
        { path: "/ops/map", label: "Mapa Operacional", icon: Map },
        { path: "/ops/issues", label: "Gargalos", icon: AlertTriangle },
      ],
    },
  ];

  const allItems = menuGroups.flatMap((g) => g.items);
  const currentLabel =
    allItems.find((m) => location.pathname.startsWith(m.path))?.label ||
    "Projetos";

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="w-64 bg-slate-900 text-white shrink-0 hidden md:flex flex-col border-r border-slate-800">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="h-8 w-8 bg-orange-600 rounded-lg flex items-center justify-center font-bold">
              OP
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wider">NEXUS</h1>
              <p className="text-xs text-slate-400">Operations View</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-6 overflow-y-auto">
          {menuGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Link key={item.path} to={item.path}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start ${isActive ? "bg-orange-900/50 text-orange-200 border-r-2 border-orange-500 rounded-none" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
                      >
                        <item.icon className="mr-3 h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link to="/">
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-400 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Trocar Módulo
            </Button>
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="h-16 border-b bg-white dark:bg-slate-900 flex items-center justify-between px-6 sticky top-0 z-10 border-b-orange-500/20">
          <h2 className="text-lg font-medium text-slate-800 dark:text-slate-200">
            {currentLabel}
          </h2>
          <div className="flex items-center space-x-4">
            <div className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-bold">
              Engineers Only
            </div>
          </div>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
```

---

## 🎨 Padrões Visuais do Neonorte | Nexus

### Identidade por Módulo

```typescript
const moduleThemes = {
  operations: {
    primary: "orange-600",
    accent: "orange-500",
    activeState:
      "bg-orange-900/50 text-orange-200 border-r-2 border-orange-500",
  },
  commercial: {
    primary: "blue-600",
    accent: "blue-500",
    activeState: "bg-blue-900/50 text-blue-200 border-r-2 border-blue-500",
  },
  strategy: {
    primary: "purple-600",
    accent: "purple-500",
    activeState:
      "bg-purple-900/50 text-purple-200 border-r-2 border-purple-500",
  },
};
```

### Estrutura de Navegação Padrão

```tsx
// Padrão de menuGroups
const menuGroups = [
  {
    title: "Categoria 1", // Título de seção
    items: [
      {
        path: "/module/route", // Rota completa
        label: "Nome Exibido", // Label visual
        icon: IconComponent, // Ícone do lucide-react
      },
    ],
  },
];
```

### Active State Pattern

```tsx
// Detectar rota ativa
const isActive = location.pathname.startsWith(item.path);

// Aplicar estilo condicional
className={`
  w-full justify-start
  ${isActive
    ? 'bg-orange-900/50 text-orange-200 border-r-2 border-orange-500 rounded-none'
    : 'text-slate-400 hover:text-white hover:bg-slate-800'
  }
`}
```

### Títulos de Seção

```tsx
<p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
  {group.title}
</p>
```

---

## ✅ Checklist de Verificação

### Fase 1 (Planning)

- [ ] `ux_proposal.md` criado
- [ ] Análise de agrupamento justificada
- [ ] Estrutura de dados proposta
- [ ] Mockup textual claro
- [ ] Padrões visuais definidos
- [ ] Aprovação do usuário/stakeholder

### Fase 2 (Execution)

- [ ] `menuGroups` implementado
- [ ] JSX atualizado com iteração de grupos
- [ ] Títulos de seção estilizados
- [ ] Active state funcionando
- [ ] Identidade visual preservada
- [ ] Responsivo testado
- [ ] Todas as rotas acessíveis
- [ ] Código compila sem erros
- [ ] Testado em diferentes resoluções

---

## 🔗 Templates Relacionados

- **Base:** `00_FOUNDATION/TEMPLATE_01_ARCHITECT.md` (Planejamento geral)
- **Complementar:** `03_FRONTEND_UI/OPTIMIZE_NAVIGATION.md` (Otimizar fluxo)
- **Componentes:** `03_FRONTEND_UI/CREATE_CRUD_VIEW.md` (Views completas)

---

## 💡 Dicas de UX

### Quando Agrupar?

- ✅ Mais de 6 itens na navegação
- ✅ Itens têm afinidades funcionais claras
- ✅ Usuários reclamam de dificuldade para encontrar opções

### Quantos Grupos?

- **2-3 grupos:** Ideal para a maioria dos casos
- **4-5 grupos:** Aceitável se bem justificado
- **6+ grupos:** Considere redesign mais profundo

### Nomenclatura de Grupos

- ✅ Use verbos ou substantivos claros ("Planejamento", "Execução")
- ✅ Evite jargões técnicos
- ✅ Máximo 3 palavras por título
- ❌ Evite "Outros", "Diversos", "Geral"

### Ordem dos Grupos

1. **Mais usados primeiro** (dados de analytics)
2. **Fluxo lógico** (Planejamento → Execução → Monitoramento)
3. **Hierarquia de importância** (Estratégico → Tático → Operacional)

---

## ⚠️ Armadilhas Comuns

### ❌ Não Fazer

1. **Mudar rotas durante redesign**
   - Quebra bookmarks e links externos
   - Use apenas para reorganizar visualmente

2. **Criar grupos com 1 item**
   - Não adiciona valor
   - Aumenta ruído visual

3. **Títulos muito longos**
   - "Ferramentas de Planejamento Estratégico e Gestão de Portfólio" ❌
   - "Planejamento" ✅

4. **Ignorar mobile**
   - Sidebar pode precisar colapsar em drawer
   - Testar em < 768px

### ✅ Fazer

1. **Validar com usuários reais**
   - Teste A/B se possível
   - Coletar feedback antes de deploy

2. **Documentar decisões**
   - Por que este agrupamento?
   - Quais alternativas foram consideradas?

3. **Manter consistência**
   - Mesmo padrão em todos os módulos
   - Identidade visual clara por módulo

---

## 🎓 Recursos Adicionais

### Princípios de Arquitetura de Informação

- **Lei de Hick:** Menos opções = decisão mais rápida
- **Lei de Miller:** 7±2 itens por grupo (máximo)
- **Proximidade:** Itens relacionados devem estar próximos

### Ferramentas de Validação

- **Card Sorting:** Peça usuários para agrupar itens
- **Tree Testing:** Teste se usuários encontram itens facilmente
- **Analytics:** Veja quais itens são mais acessados

### Leitura Recomendada

- "Information Architecture" - Louis Rosenfeld
- "Don't Make Me Think" - Steve Krug
- "The Design of Everyday Things" - Don Norman

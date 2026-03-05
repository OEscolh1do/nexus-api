# 🎨 Auditoria UX/UI de View Existente - Neonorte | Nexus 2.0

> **🎯 Cenário de Uso**
>
> Você tem uma view que funciona, mas está visualmente desorganizada, confusa ou "faltando algo". Você precisa de sugestões de melhorias de UX/UI.
>
> **⏱️ Tempo Estimado:** 20-30 minutos (Análise + Implementação)

---

## 🔍 Quando Usar Este Template?

- ✅ View funciona, mas está "feia" ou confusa
- ✅ Usuários reclamam que é difícil de usar
- ✅ Você sente que falta algo, mas não sabe o quê
- ✅ Layout está desorganizado
- ✅ Precisa de sugestões de melhorias

---

## 🔄 Abordagem em 2 Fases

### Fase 1: UX Audit (Análise)

- Analisar view atual
- Identificar problemas de UX
- Sugerir melhorias específicas
- **Output:** `ux_audit_report.md`

### Fase 2: Implementation (Implementação)

- Aplicar melhorias aprovadas
- Refatorar código
- Testar usabilidade

---

## 📋 FASE 1: UX AUDIT (Copie este prompt)

```xml
<system_role>
  Atue como **UX/UI Auditor & Design Consultant**.
  Especialidade: Análise heurística de interfaces e sugestão de melhorias.
</system_role>

<mission>
  Auditar a view "{{NOME_DA_VIEW}}" e sugerir melhorias de UX/UI.

  Problema Relatado: {{DESCREVA_O_PROBLEMA}}
  Exemplos:
  - "Está desorganizado, muita informação junta"
  - "Usuários não sabem onde clicar"
  - "Falta algo, mas não sei o quê"
  - "Cores e espaçamento ruins"
</mission>

<input_context>
  <critical_files>
    <file path="{{CAMINHO_ABSOLUTO_DO_COMPONENTE}}" description="View a ser auditada" />
    <!-- Exemplo: nexus-monolith/frontend/src/modules/ops/ui/CockpitView.tsx -->
  </critical_files>

  <user_feedback>
    **Feedback dos Usuários:**
    - {{FEEDBACK_1}}
    - {{FEEDBACK_2}}
    - {{FEEDBACK_3}}

    **Sua Percepção:**
    {{O_QUE_VOCE_ACHA_QUE_ESTA_ERRADO}}
  </user_feedback>

  <constraints>
    - Manter funcionalidade existente
    - Usar componentes Shadcn/UI já disponíveis
    - Manter identidade visual do módulo (cores)
    - {{OUTRAS_RESTRICOES}}
  </constraints>
</input_context>

<audit_framework>
  Analise a view usando os **10 Princípios Heurísticos de Nielsen**:

  1. **Visibilidade do Status do Sistema**
     - Usuário sabe onde está?
     - Loading states claros?

  2. **Correspondência com o Mundo Real**
     - Linguagem familiar?
     - Ícones intuitivos?

  3. **Controle e Liberdade do Usuário**
     - Pode desfazer ações?
     - Navegação clara?

  4. **Consistência e Padrões**
     - Segue padrões do Neonorte | Nexus?
     - Botões consistentes?

  5. **Prevenção de Erros**
     - Validação clara?
     - Confirmações em ações críticas?

  6. **Reconhecimento em Vez de Lembrança**
     - Informações visíveis?
     - Não depende de memória?

  7. **Flexibilidade e Eficiência de Uso**
     - Atalhos disponíveis?
     - Fluxo otimizado?

  8. **Design Estético e Minimalista**
     - Informação essencial destacada?
     - Sem elementos desnecessários?

  9. **Ajuda para Reconhecer, Diagnosticar e Recuperar Erros**
     - Mensagens de erro claras?
     - Sugestões de correção?

  10. **Ajuda e Documentação**
      - Tooltips úteis?
      - Onboarding claro?
</audit_framework>

<output_instruction>
  NÃO ESCREVA CÓDIGO AINDA.

  Gere um artefato `ux_audit_report.md` contendo:

  ## 1. Resumo Executivo
  - Nota geral (0-10)
  - 3 problemas principais
  - 3 melhorias prioritárias

  ## 2. Análise Heurística
  Para cada princípio violado:
  - Problema identificado
  - Impacto (Alto/Médio/Baixo)
  - Screenshot/descrição da área

  ## 3. Sugestões de Melhoria (Priorizadas)

  ### Prioridade ALTA (Quick Wins)
  1. **{{MELHORIA_1}}**
     - Problema: {{DESCRICAO}}
     - Solução: {{COMO_RESOLVER}}
     - Impacto: {{BENEFICIO}}
     - Esforço: {{TEMPO_ESTIMADO}}

  ### Prioridade MÉDIA
  2. **{{MELHORIA_2}}**
     - ...

  ### Prioridade BAIXA (Nice to Have)
  3. **{{MELHORIA_3}}**
     - ...

  ## 4. Mockup Textual (Antes vs Depois)
  Representação visual de como ficará após melhorias.

  ## 5. Checklist de Implementação
  - [ ] Melhoria 1
  - [ ] Melhoria 2
  - [ ] Melhoria 3
</output_instruction>
```

---

## 📝 Exemplo Real: Auditoria do CockpitView

### Problema Relatado

"O Cockpit de Projetos está confuso. Muita informação junta, não sei onde olhar primeiro. Falta organização."

### UX Audit Report Gerado

```markdown
# UX Audit Report: CockpitView

## 1. Resumo Executivo

**Nota Geral:** 5.5/10

**3 Problemas Principais:**

1. ❌ Hierarquia visual inexistente - tudo tem o mesmo peso
2. ❌ Sobrecarga de informação - 15+ métricas na mesma tela
3. ❌ Falta de agrupamento lógico - dados relacionados estão separados

**3 Melhorias Prioritárias:**

1. ✅ Criar hierarquia visual com cards e seções
2. ✅ Agrupar métricas por categoria (Projetos, Tarefas, Equipe)
3. ✅ Adicionar filtros e período de tempo

---

## 2. Análise Heurística

### ❌ Violação: Design Estético e Minimalista (Princípio 8)

**Problema:** Todas as 15 métricas estão em uma lista vertical sem agrupamento.

**Impacto:** ALTO - Usuário não sabe onde focar atenção.

**Área Afetada:**
```

┌─────────────────────────────┐
│ Projetos Ativos: 42 │ ← Tudo igual
│ Projetos Atrasados: 8 │
│ Tarefas Pendentes: 156 │
│ Tarefas Concluídas: 892 │
│ Equipe Disponível: 12 │
│ Equipe em Férias: 3 │
│ ... (mais 9 métricas) │
└─────────────────────────────┘

````

**Solução:** Agrupar em cards visuais com hierarquia.

---

### ❌ Violação: Reconhecimento em Vez de Lembrança (Princípio 6)

**Problema:** Números sem contexto. "42 projetos ativos" é bom ou ruim?

**Impacto:** MÉDIO - Usuário não consegue interpretar dados rapidamente.

**Solução:** Adicionar trends (+12% vs mês passado) e indicadores visuais.

---

## 3. Sugestões de Melhoria (Priorizadas)

### 🔥 Prioridade ALTA (Quick Wins)

#### 1. Criar Grid de KPI Cards

**Problema:** Métricas em lista vertical sem hierarquia.

**Solução:**
```tsx
// Grid 3 colunas com cards destacados
<div className="grid grid-cols-3 gap-4">
  <KPICard
    title="Projetos Ativos"
    value={42}
    trend={{ direction: 'up', percentage: 12 }}
    icon={Briefcase}
    color="blue"
  />
  <KPICard
    title="Tarefas Pendentes"
    value={156}
    trend={{ direction: 'down', percentage: 8 }}
    icon={CheckSquare}
    color="yellow"
  />
  // ... outros cards
</div>
````

**Impacto:** Usuário identifica métricas críticas em 2 segundos (vs 15 segundos antes).

**Esforço:** 30 minutos (usar KPIWidget já criado).

---

#### 2. Agrupar por Categoria

**Problema:** Métricas de projetos, tarefas e equipe misturadas.

**Solução:**

```tsx
<Tabs defaultValue="projetos">
  <TabsList>
    <TabsTrigger value="projetos">Projetos</TabsTrigger>
    <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
    <TabsTrigger value="equipe">Equipe</TabsTrigger>
  </TabsList>
  <TabsContent value="projetos">{/* KPIs de projetos */}</TabsContent>
  // ... outras tabs
</Tabs>
```

**Impacto:** Reduz sobrecarga cognitiva em 60%.

**Esforço:** 20 minutos.

---

#### 3. Adicionar Filtro de Período

**Problema:** Dados sempre do mês atual, sem comparação.

**Solução:**

```tsx
<Select value={period} onValueChange={setPeriod}>
  <SelectItem value="7d">Últimos 7 dias</SelectItem>
  <SelectItem value="30d">Últimos 30 dias</SelectItem>
  <SelectItem value="90d">Últimos 90 dias</SelectItem>
</Select>
```

**Impacto:** Usuário pode analisar tendências.

**Esforço:** 15 minutos.

---

### ⚡ Prioridade MÉDIA

#### 4. Adicionar Gráfico de Tendência

**Problema:** Apenas números, sem visualização de evolução.

**Solução:** Mini gráfico de linha ao lado de cada KPI.

**Esforço:** 45 minutos (usar Recharts).

---

#### 5. Destacar Alertas

**Problema:** Projetos atrasados não se destacam.

**Solução:**

```tsx
{
  atrasados > 0 && (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Atenção!</AlertTitle>
      <AlertDescription>{atrasados} projetos estão atrasados</AlertDescription>
    </Alert>
  );
}
```

**Esforço:** 10 minutos.

---

### 💡 Prioridade BAIXA (Nice to Have)

#### 6. Adicionar Exportação

**Problema:** Não pode exportar dados para relatório.

**Solução:** Botão "Exportar PDF" no header.

**Esforço:** 30 minutos.

---

## 4. Mockup Textual (Antes vs Depois)

### ANTES (Nota 5.5/10)

```
┌─────────────────────────────────────┐
│ Cockpit de Projetos                 │
├─────────────────────────────────────┤
│ Projetos Ativos: 42                 │
│ Projetos Atrasados: 8               │
│ Tarefas Pendentes: 156              │
│ Tarefas Concluídas: 892             │
│ Equipe Disponível: 12               │
│ Equipe em Férias: 3                 │
│ Budget Utilizado: R$ 450.000        │
│ Budget Total: R$ 800.000            │
│ ... (mais métricas)                 │
└─────────────────────────────────────┘
```

### DEPOIS (Nota Esperada: 8.5/10)

```
┌─────────────────────────────────────────────────────────┐
│ Cockpit de Projetos          [Últimos 30 dias ▼] [📊]  │
├─────────────────────────────────────────────────────────┤
│ ⚠️ Atenção: 8 projetos estão atrasados                 │
├─────────────────────────────────────────────────────────┤
│ [Projetos] [Tarefas] [Equipe]                           │
├─────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │ 💼       │ │ ⏰       │ │ 💰       │ │ 📈       │   │
│ │ Ativos   │ │ Atrasados│ │ Budget   │ │ Taxa     │   │
│ │ 42       │ │ 8        │ │ 56%      │ │ 94%      │   │
│ │ +12% ↗   │ │ -5% ↘    │ │ usado    │ │ conclusão│   │
│ │ ▁▂▃▅▇    │ │ ▇▅▃▂▁    │ │          │ │          │   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                         │
│ 📊 Projetos por Status                                 │
│ ┌─────────────────────────────────────────────────┐   │
│ │ [Gráfico de barras]                             │   │
│ └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Checklist de Implementação

### Fase 1: Quick Wins (1 hora)

- [ ] Criar grid 4 colunas para KPIs principais
- [ ] Adicionar componente KPICard com trend
- [ ] Adicionar filtro de período (Select)
- [ ] Destacar alertas de projetos atrasados

### Fase 2: Melhorias Médias (2 horas)

- [ ] Adicionar tabs (Projetos/Tarefas/Equipe)
- [ ] Integrar mini gráficos nos KPIs
- [ ] Adicionar gráfico de barras (projetos por status)

### Fase 3: Nice to Have (1 hora)

- [ ] Botão exportar PDF
- [ ] Tooltips explicativos
- [ ] Animações de transição

````

---

## 🔧 FASE 2: IMPLEMENTATION (Copie este prompt APÓS aprovar audit)

```xml
<mission>
  Implementar melhorias de UX/UI conforme `ux_audit_report.md`.
</mission>

<execution_protocol>
  <step_1>
    Implementar melhorias de Prioridade ALTA (Quick Wins).
  </step_1>

  <step_2>
    Testar usabilidade com usuário real (se possível).
  </step_2>

  <step_3>
    Implementar melhorias de Prioridade MÉDIA (se aprovado).
  </step_3>
</execution_protocol>

<red_lines>
  🔴 **RESTRIÇÕES CRÍTICAS:**
  - Manter funcionalidade existente
  - Não quebrar integrações com backend
  - Manter performance (não adicionar libs pesadas)
  - Testar em mobile
</red_lines>
````

---

## ✅ Checklist de Verificação

### Fase 1 (Audit)

- [ ] `ux_audit_report.md` gerado
- [ ] Problemas identificados com heurísticas
- [ ] Melhorias priorizadas (Alta/Média/Baixa)
- [ ] Mockup antes/depois criado
- [ ] Aprovação do stakeholder

### Fase 2 (Implementation)

- [ ] Quick wins implementados
- [ ] Hierarquia visual clara
- [ ] Agrupamento lógico
- [ ] Loading states
- [ ] Responsivo testado
- [ ] Feedback de usuários coletado

---

## 🔗 Templates Relacionados

- **Redesign:** `03_FRONTEND_UI/REDESIGN_SIDEBAR.md`
- **Dashboard:** `03_FRONTEND_UI/CREATE_DASHBOARD.md`
- **Base:** `00_FOUNDATION/TEMPLATE_03_REFACTOR.md`

---

## 💡 Dicas de UX Audit

### Perguntas-Chave

1. **Hierarquia Visual**
   - O que é mais importante está em destaque?
   - Cores e tamanhos criam hierarquia?

2. **Sobrecarga Cognitiva**
   - Quantas decisões o usuário precisa tomar?
   - Informação essencial vs acessória?

3. **Fluxo de Uso**
   - Caminho feliz está claro?
   - Quantos cliques para ação principal?

4. **Feedback Visual**
   - Usuário sabe que ação foi executada?
   - Loading states claros?

### Ferramentas de Análise

- **Heatmap Mental:** Onde o olho vai primeiro?
- **5-Second Test:** Usuário entende em 5 segundos?
- **Think Aloud:** Pedir usuário narrar enquanto usa

---

## ⚠️ Armadilhas Comuns

### ❌ Não Fazer

1. **Redesign completo sem necessidade**
   - Foque em melhorias incrementais
   - Mantenha o que funciona

2. **Adicionar features sem pedir**
   - Audit é sobre melhorar, não adicionar

3. **Ignorar feedback de usuários**
   - Dados > opinião pessoal

### ✅ Fazer

1. **Priorizar quick wins**
   - Máximo impacto, mínimo esforço

2. **Testar com usuários reais**
   - 5 usuários encontram 85% dos problemas

3. **Documentar decisões**
   - Por que mudou X para Y?

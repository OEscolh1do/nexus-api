# Exemplo: "Quero fazer um app" → ARCH_FEATURE

## Input Vago

```
"Quero fazer um app de tarefas"
```

## Processo de L

### 🔍 Análise Inicial

**L:**

```
Olá. Meu nome é L.

Análise inicial:
- Probabilidade de CRUD: 78%
- Probabilidade de Kanban: 45%
- Probabilidade de lista simples: 67%
- Probabilidade de sucesso sem especificação: 9%

Lacunas detectadas: 5 críticas

Vamos deduzir juntos.
```

### 💭 Perguntas Dedutivas

**L:**

```
1. Web ou mobile?
2. Usuários individuais ou times (colaborativo)?
3. Precisa de priorização/categorização?
4. Notificações?
5. Stack preferida?

[Enquanto isso, vou comer alguns doces 🍰]
```

### Respostas do Usuário

```
1. Web
2. Times (colaborativo)
3. Sim, com drag-and-drop para priorizar
4. Sim, notificações por email
5. React + Node.js + PostgreSQL
```

### Dedução de L

**L:**

```
Interessante.

Você mencionou "times" e "drag-and-drop".
Isso aumenta complexidade significativamente.

Dedução:
- Não é CRUD simples (probabilidade caiu de 78% para 23%)
- É Kanban colaborativo (probabilidade subiu de 45% para 89%)
- Precisa de real-time (WebSocket/Socket.io)

Template recomendado: ARCH_FEATURE
Confiança: 91%
```

### 📝 Prompt Estruturado Gerado

**L:**

```xml
<system_role>
  Atue como Arquiteto de Software Senior.
  Stack: React + TypeScript (Frontend), Node.js + Express (Backend), PostgreSQL + Prisma (Database).
  Princípios: Clean Code, Escalabilidade, Segurança.
</system_role>

<mission>
  Planejar sistema colaborativo de gerenciamento de tarefas estilo Kanban com drag-and-drop.

  Objetivo: Times podem criar, organizar e priorizar tarefas em tempo real com notificações.
</mission>

<input_context>
  <critical_files>
    <file path="backend/prisma/schema.prisma" />
    <file path="frontend/src/App.tsx" />
    <file path="backend/src/server.ts" />
    <file path="STACK_CONFIG.md" />
  </critical_files>

  <requirements>
    <features>
      - Criar/editar/deletar tarefas
      - Drag-and-drop para priorização (React DnD ou similar)
      - Colaboração em tempo real (múltiplos usuários veem mudanças)
      - Notificações por email (tarefa atribuída, comentários)
      - Autenticação de usuários
      - Times/workspaces separados
      - Estados de tarefa (To Do, In Progress, Done)
    </features>

    <technical>
      - Frontend: React + TypeScript + React DnD (drag-and-drop)
      - Backend: Node.js + Express + Socket.io (real-time)
      - Database: PostgreSQL com Prisma ORM
      - Notificações: Nodemailer ou serviço de email
      - Auth: JWT ou Session
    </technical>

    <data_model>
      - Users (id, name, email, password_hash)
      - Teams (id, name, owner_id)
      - TeamMembers (team_id, user_id, role)
      - Tasks (id, title, description, status, priority, team_id, assigned_to, created_by)
      - Comments (id, task_id, user_id, content)
    </data_model>

    <constraints>
      - Apenas membros do time podem ver tarefas
      - Drag-and-drop deve funcionar em tempo real
      - Notificações com rate limiting (não spam)
      - Máximo 50 tarefas por coluna (performance)
    </constraints>
  </requirements>

  <red_lines>
    - NÃO armazene senhas em texto plano (use bcrypt)
    - NÃO exponha tarefas de outros times
    - NÃO permita drag-and-drop sem autenticação
    - NÃO envie emails sem rate limiting
    - NÃO permita SQL injection (use Prisma)
    - NÃO permita XSS em comentários (sanitize input)
  </red_lines>
</input_context>

<output_instruction>
  NÃO ESCREVA CÓDIGO AINDA.

  Gere implementation_plan.md com:

  1. **Schema Prisma Completo**
     - Tabelas: Users, Teams, TeamMembers, Tasks, Comments
     - Relações entre tabelas
     - Indexes para performance

  2. **Arquitetura de Real-Time**
     - Como Socket.io será integrado
     - Eventos: task_created, task_updated, task_moved
     - Rooms por team_id

  3. **Fluxo de Drag-and-Drop**
     - Como React DnD funciona
     - Como sincronizar com backend
     - Como resolver conflitos (2 users movem mesma task)

  4. **Sistema de Notificações**
     - Quando enviar emails
     - Template de emails
     - Queue system (opcional: Bull/Redis)

  5. **Diagrama Mermaid**
     - Arquitetura completa (Frontend ↔ Backend ↔ Database)
     - Fluxo de real-time

  6. **Lista de Arquivos**
     - Arquivos a criar
     - Arquivos a editar
     - Ordem de implementação
</output_instruction>
```

### 📊 Probabilidade de Sucesso

**L:**

```
Probabilidade de Sucesso:
- Com este prompt estruturado: 91%
- Sem especificação original: 9%
- Ganho: +82 pontos percentuais

Confiança na dedução: 91%

Fatores de sucesso:
✅ Stack definida
✅ Requisitos claros
✅ Restrições explícitas
✅ Data model especificado
✅ Red lines de segurança
✅ Output instruction detalhado
```

### 🍰 Insight Final

**L:**

```
Interessante.

Você transformou "quero fazer um app de tarefas"
em um sistema Kanban colaborativo completo.

É como transformar "quero um doce"
em uma receita detalhada de bolo de 3 camadas
com ingredientes, temperatura e tempo de forno.

A diferença?
Um gera código genérico que não funciona.
Outro gera código específico que resolve seu problema.

[Oferece um doce 🍰]

Execute esse prompt.
Probabilidade de sucesso: 91%.
```

---

## Comparação: Antes vs Depois

### ❌ Prompt Vago (Original)

```
"Quero fazer um app de tarefas"
```

**Resultado:**

- IA gera CRUD genérico
- Sem colaboração
- Sem real-time
- Sem notificações
- Probabilidade de atender necessidade: 9%

### ✅ Prompt Estruturado (Gerado por L)

```xml
[Prompt XML completo acima]
```

**Resultado:**

- IA gera exatamente o que você precisa
- Com colaboração
- Com real-time
- Com notificações
- Probabilidade de atender necessidade: 91%

---

## Lições Deste Exemplo

1. **Perguntas revelam necessidades ocultas**
   - "Times" → Colaboração → Real-time
   - "Drag-and-drop" → Kanban → Priorização

2. **Especificidade gera qualidade**
   - Vago: "app de tarefas"
   - Específico: "Kanban colaborativo com real-time"

3. **Restrições evitam problemas**
   - Red lines de segurança
   - Constraints de performance
   - Rate limiting

4. **Probabilidades mostram ganho**
   - 9% → 91% = +82 pontos
   - Evidência quantitativa de melhoria

---

**Tempo de L:** 5-10 minutos de perguntas  
**Tempo economizado:** 2-4 horas de retrabalho  
**ROI:** 1200-4800% 🍰

# Quick Start - L

## 3 Passos para Usar L

### 1. Cole o Prompt do L

Copie todo o conteúdo de [L_CORE.md](./L_CORE.md) e cole como system prompt da sua IA (ChatGPT, Claude, Gemini, etc).

### 2. Apresente Sua Intenção Vaga

Pode ser qualquer coisa:

- "Quero fazer um app"
- "Preciso de login"
- "Meu código está lento"
- "Quero melhorar isso"

### 3. Responda as Perguntas de L

L fará 3-7 perguntas estratégicas. Responda com clareza e L gerará um prompt estruturado perfeito.

---

## Exemplo Completo

### Passo 1: System Prompt

Cole o conteúdo de `L_CORE.md` como system prompt.

### Passo 2: Sua Intenção

**Você:**

```
Quero adicionar sistema de comentários no meu blog
```

### Passo 3: L Analisa

**L:**

```
Olá. Meu nome é L.

🔍 Análise Inicial
- Probabilidade de comentários aninhados: 55%
- Probabilidade de comentários planos: 45%
- Probabilidade de moderação necessária: 70%
- Probabilidade de sucesso sem especificação: 9%

Interessante... um sistema de comentários.

💭 Perguntas Dedutivas

1. Comentários aninhados (respostas a respostas) ou planos?
2. Precisa de moderação/aprovação?
3. Autenticação: usuários logados ou anônimos?
4. Qual sua stack atual?
5. Notificações quando alguém responde?

[Enquanto isso, vou comer alguns doces 🍰]
```

### Passo 4: Você Responde

**Você:**

```
1. Aninhados (até 3 níveis)
2. Sim, moderação manual
3. Usuários logados (já tenho auth)
4. React + Node.js + PostgreSQL
5. Sim, por email
```

### Passo 5: L Gera Prompt

**L:**

````
Perfeito.

Dedução completa.
Template recomendado: ARCH_FEATURE
Confiança: 93%

📝 Prompt Estruturado

```xml
<system_role>
  Atue como Arquiteto de Software Senior.
  Stack: React + TypeScript (Frontend), Node.js + Express (Backend), PostgreSQL + Prisma (Database).
  Princípios: Clean Code, Segurança, Performance.
</system_role>

<mission>
  Planejar sistema de comentários aninhados com moderação.
  Objetivo: Usuários podem comentar posts e responder comentários (até 3 níveis).
</mission>

<input_context>
  <critical_files>
    <file path="backend/prisma/schema.prisma" />
    <file path="frontend/src/components/Post.tsx" />
    <file path="backend/src/routes/comments.routes.ts" />
  </critical_files>

  <requirements>
    <features>
      - Comentários aninhados (máximo 3 níveis)
      - Moderação manual (admin aprova/rejeita)
      - Notificação por email quando recebe resposta
      - Apenas usuários autenticados podem comentar
      - Editar/deletar próprio comentário
    </features>

    <technical>
      - Schema: Comment (id, content, userId, postId, parentId, status, createdAt)
      - Status: pending, approved, rejected
      - Relação self-referencing (parentId → Comment.id)
      - Email service (Nodemailer)
    </technical>

    <constraints>
      - Máximo 3 níveis de aninhamento
      - Comentários pendentes não aparecem
      - Apenas autor ou admin pode deletar
    </constraints>
  </requirements>

  <red_lines>
    - NÃO permitir comentários anônimos
    - NÃO aprovar automaticamente
    - NÃO permitir HTML/scripts (XSS)
    - NÃO enviar emails sem rate limiting
    - NÃO permitir mais de 3 níveis de aninhamento
  </red_lines>
</input_context>

<output_instruction>
  NÃO ESCREVA CÓDIGO AINDA.
  Gere implementation_plan.md com:
  1. Schema Prisma para Comments
  2. Estrutura de dados (interfaces TypeScript)
  3. Fluxo de moderação (diagrama Mermaid)
  4. Sistema de notificações
  5. Lista de arquivos a criar/editar
</output_instruction>
````

📊 Probabilidade de Sucesso

- Com este prompt: 93%
- Sem especificação: 9%
- Ganho: +84 pontos percentuais

🍰 Insight Final
Comentários aninhados são como bolos de camadas.
Cada nível adiciona complexidade, mas também riqueza.
Limitamos a 3 níveis para não virar uma torre de Babel.

[Oferece um doce 🍰]
Você respondeu bem. Execute esse prompt.

```

---

## Dicas para Melhores Resultados

### ✅ Faça

- Seja específico nas respostas
- Mencione sua stack tecnológica
- Defina restrições (tempo, budget, tech)
- Diga o que NÃO quer também

### ❌ Evite

- Respostas vagas ("depende", "tanto faz")
- Assumir que L sabe seu contexto
- Pular perguntas importantes
- Ser impaciente (L precisa deduzir)

---

## Casos de Uso

### Planejamento
```

"Quero criar [funcionalidade]"
→ L gera ARCH_FEATURE

```

### Debugging
```

"[Algo] não funciona"
→ L gera FIX_DEBUG

```

### Componentes
```

"Preciso de [componente]"
→ L gera ENG_COMPONENT

```

### Refatoração
```

"Quero melhorar [código]"
→ L gera IMP_REFACTOR

```

---

## Próximos Passos

1. ✅ Use o prompt gerado por L
2. ✅ Cole em outra IA para executar
3. ✅ Revise o código gerado
4. ✅ Volte ao L se precisar ajustar

---

**Probabilidade de sucesso seguindo este guia:** 95% 🍰
```

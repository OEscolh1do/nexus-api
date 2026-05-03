---
name: loki-mode
description: Habilita a orquestração multi-agente autônoma via padrão Subagent Driven Development. Ativado quando o desenvolvedor explicitamente pede paralelismo ou quando a tarefa tiver sub-problemas claramente independentes que se beneficiam de execução simultânea.
---

# Skill: Loki Mode (Autonomous Parallel Execution)

## Gatilho Semântico

Ativado por frases como: "faça em paralelo", "divida entre agentes", "use o Modo Loki" ou quando o Orchestrator detectar 3+ sub-tarefas independentes.

## Diferença entre Loki Mode e Orchestrator

| Aspecto | Orchestrator | Loki Mode |
|---|---|---|
| Foco | Decomposição e síntese | Execução paralela autônoma |
| Autonomia | Delega com supervisão | Agentes operam com mínima supervisão |
| Quando usar | Tarefas complexas de qualquer tipo | Tarefas com paralelismo claro e baixo risco de conflito |

## Protocolo de Execução

### Passo 1: Declaração do Plano de Ação Dinâmico

Antes de despachar agentes, publique o plano explicitamente:

```
🟡 LOKI MODE ATIVADO
━━━━━━━━━━━━━━━━━━━━
Agente A (Designer): [escopo exato]
Agente B (Builder):  [escopo exato]
Agente C (Auditor):  [escopo exato]
━━━━━━━━━━━━━━━━━━━━
Barreira de sync: Aguardando todos antes de integrar.
```

### Passo 2: Contratos de Interface

Antes do despacho, defina os contratos de interface entre agentes:
- O que o **Builder** produzirá que o **Designer** consumirá?
- Quais datas/tipos são compartilhados entre agentes?

Exemplo de contrato:
```typescript
// Contrato: Builder → Designer
interface IProductCardProps {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}
```

### Passo 3: Execução Paralela

Cada agente opera dentro do seu **sandbox de escopo** — arquivos fora do seu domínio são read-only.

### Passo 4: Convergência

1. Cada agente entrega seu output com um status: `✅ Concluído` ou `⚠️ Bloqueado em [razão]`.
2. O agente principal integra todos os outputs.
3. Se houver conflito: o agente principal resolve com base no `context.md`.
4. O Dike valida o resultado integrado.

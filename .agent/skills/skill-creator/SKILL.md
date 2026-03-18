---
name: skill-creator
description: Meta-skill que guia a criação de novas skills seguindo a estrutura padrão do Antigravity (SKILL.md com frontmatter, gatilho semântico, protocolo e saída esperada). Ativada quando o Orchestrator detecta uma lacuna de capacidade ou o desenvolvedor pede explicitamente uma nova skill.
---

# Skill: Skill Creator (Meta-Skill)

## Gatilho Semântico

Ativado quando: "crie uma skill para X", "falta uma skill de Y", ou quando o Orchestrator detecta que nenhuma skill existente cobre adequadamente um domínio recorrente.

## Estrutura Padrão de uma Skill

```
.agent/skills/
└── <nome-da-skill>/
    ├── SKILL.md          ← Obrigatório
    ├── scripts/          ← Opcional: scripts shell/PowerShell executáveis
    └── resources/        ← Opcional: templates, exemplos, dados de referência
```

## Template de `SKILL.md`

```markdown
---
name: <nome-kebab-case>
description: <uma linha: o que faz, quando ativar>
---

# Skill: <Nome Legível>

## Gatilho Semântico

[Descreva os padrões de linguagem natural ou condições técnicas que ativam esta skill]

## Protocolo

[Os passos concretos que o agente deve seguir ao executar esta skill]

## Limitações e Boas Práticas

[O que esta skill NÃO faz, anti-padrões a evitar]
```

## Checklist de Qualidade para Novas Skills

Antes de entregar a skill ao Dike para validação, confirme:

- [ ] O `name` no frontmatter está em `kebab-case` e é único no projeto?
- [ ] A `description` cabe em uma linha e deixa claro: **o que faz** + **quando ativar**?
- [ ] O **Gatilho Semântico** é específico o suficiente para não ativar por acidente?
- [ ] O **Protocolo** tem passos numerados e verificáveis?
- [ ] Os **Hard Boundaries** (o que a skill NÃO faz) estão explícitos para evitar sobreposição de domínio?
- [ ] A skill não duplica funcionalidade de uma skill existente?

## Naming Conventions

| Domínio | Exemplos de Nome |
|---|---|
| Qualidade/Validação | `dike`, `code-reviewer`, `test-writer` |
| Orquestração | `orchestrator`, `loki-mode`, `conductor` |
| Domínio Técnico | `design-lead`, `the-builder`, `db-architect` |
| Utilitários | `server-slayer`, `context-drop`, `smart-router` |

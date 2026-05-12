# Jornada do Integrador — Módulo Inversores → Release

> **Iniciado em:** 2026-05-11
> **Objetivo:** Elevar o módulo "Inversores" (ElectricalCanvasView) do status **Beta** para **Release**,
> atendendo os critérios de um Engenheiro Eletricista que assina ART em projetos fotovoltaicos.
>
> **Avaliador-Persona:** Integrador com 8 anos de experiência, projetos até 500 kWp,
> habituado ao PVSyst e às normas NBR 16690, NBR 16274 e REN ANEEL 1000/2021.

---

## Gaps Identificados e Status

| # | Spec | Gap | Criticidade | Status |
|---|------|-----|-------------|--------|
| 1 | [spec-01-mppt-ocioso.md](./spec-01-mppt-ocioso.md) | MPPTs disponíveis vs. utilizados invisíveis | 🟡 Médio | ⏳ Aguardando |
| 2 | [spec-02-azimute-mismatch.md](./spec-02-azimute-mismatch.md) | Azimute não impacta cálculos (hasMismatch hardcoded) | 🟡 Médio | ⏳ Aguardando |
| 3 | [spec-03-multi-inversor.md](./spec-03-multi-inversor.md) | Cockpit de múltiplos inversores simultâneos | 🟡 Médio | ⏳ Aguardando |
| 4 | [spec-04-queda-tensao-cc.md](./spec-04-queda-tensao-cc.md) | Inputs de cabo CC ausentes (NBR 16690 obrigatório) | 🔴 Crítico | ⏳ Aguardando |
| 5 | [spec-05-fusivel-string.md](./spec-05-fusivel-string.md) | Rating de fusível de string não calculado (ART blocker) | 🔴 Crítico | ⏳ Aguardando |
| 6 | [spec-06-nomenclatura-strings.md](./spec-06-nomenclatura-strings.md) | UI Orientada a Strings e Nomenclatura Executiva (INV-01.M1.S1) | 🔴 Crítico | ⏳ Aguardando |

---

## Critério de Release

O módulo Inversores atingirá versão **Release** quando:
1. Todos os 5 gaps estiverem com status ✅ Concluído.
2. A auditoria de cálculo (aba "Auditoria de Cálculo") exibir os novos valores sem regressão.
3. O avaliador-persona conseguir realizar um projeto completo de 30 kWp trifásico com 2 orientações **sem sair do Kurupira**.

---

## Convenções de Spec

Cada spec segue o pipeline `/speckit.specify` e é validada pelo **Dike** (Divine Triad) antes de qualquer código.

```
spec-XX-nome-do-gap.md
└── ## Problema           ← O quê e por quê
└── ## Usuário            ← Quem sente o impacto
└── ## Definition of Done ← Critérios de aceitação verificáveis
└── ## Fora do Escopo     ← Exclusões explícitas
└── ## Referências        ← Normas, arquivos e hooks afetados
└── ## Dike — Riscos      ← Análise estática de regressão
```

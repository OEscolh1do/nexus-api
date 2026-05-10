---
name: semver-release-manager
description: Protocolo de versionamento semântico (SemVer) para o ecossistema Ywara. Ative quando precisar classificar releases, decidir o próximo incremento de versão, alinhar package.json com o status real de maturidade dos módulos, ou quando o usuário mencionar "qual versão", "subir versão", "tag de release", "alpha/beta/rc" ou "breaking change".
---

# Skill: SemVer Release Manager

## Gatilho Semântico

Ative esta skill quando o desenvolvedor mencionar:
- "Qual versão está/deveria estar o [módulo]?"
- "Subir a versão", "bumpar versão", "fazer release"
- "É alpha, beta ou RC?"
- "Breaking change", "nova feature", "bugfix/patch"
- "Atualizar package.json", "marcar release"
- Após `/sync-context` quando há mudança de fase de maturidade de um módulo

## Estado Atual do Ecossistema (Linha de Base)

| Módulo | package.json | Status Real | Significado |
|--------|-------------|-------------|-------------|
| **Kurupira** (FE + BE) | `0.9.0-beta.1` | Beta | Motor PV operacional, mas ainda com breaking changes arquiteturais |
| **Sumaúma** (FE + BE) | `1.0.0-rc.1` | Release Candidate | Backoffice estável, pronto para virar fundação 1.0.0 |
| **Iaçã** (FE + BE) | `0.0.0` | Pré-Alpha | Módulo embrionário, APIs instáveis |

## Protocolo

### Passo 1 — Classificar o Tipo de Mudança

Antes de qualquer bump, classifique a mudança:

| Tipo | Incremento | Critério |
|------|-----------|----------|
| **Breaking Change** | `MAJOR` | Rota de API removida, campo de DB renomeado/deletado, contrato de store quebrado |
| **Nova Feature** | `MINOR` | Nova rota, nova Canvas View, novo módulo, novo hook público |
| **Bugfix / Refactor** | `PATCH` | Correção sem mudança de contrato, ajuste de CSS, otimização interna |

### Passo 2 — Aplicar a Regra de Maturidade

A versão SemVer **comunica o estado de maturidade**, não apenas o histórico de commits:

```
MAJOR.MINOR.PATCH[-preRelease.N]

Exemplos do Ywara:
  0.9.0-beta.1  → Desenvolvimento avançado, API instável
  1.0.0-rc.1    → Feature-complete, em validação final
  1.0.0         → Estável, sem breaking changes planejadas
  1.1.0-beta.1  → Nova feature em desenvolvimento sobre base estável
```

**Regra de ouro do `0.x.x`:**
> A série `0.y.z` não define Alpha/Beta/RC. O **sufixo** (ex: `-alpha.1`, `-beta.2`, `-rc.1`) é que define. Uma versão `0.9.0` sem sufixo significa "quase estável mas pré-1.0.0", não necessariamente "bugs graves".

### Passo 3 — Executar o Bump

Ao fazer o bump de versão, atualizar **todos** os artefatos relevantes:

1. **`package.json`** do módulo afetado (frontend E backend em sincronia).
2. **`context.md` local** do módulo (`kurupira/.agent/context.md`, etc.) — campo `Versão do Sistema`.
3. **`context.md` global** (`/.agent/context.md`) — campo `Versão do Ecossistema` e entrada no changelog.
4. **Manual de Boas Práticas** (`docs/manual_boas_praticas.md`) — apenas se o bump introduzir um novo padrão.

### Passo 4 — Calcular a Próxima Versão de Cada Módulo

#### Kurupira (`0.9.0-beta.x`)
- **Bugfix / Refactor CSS**: `0.9.0-beta.2`, `beta.3`, ...
- **Nova feature (Canvas View, módulo)**: `0.10.0-beta.1`
- **Feature-complete, sem breaking changes planejadas**: promover para `1.0.0-rc.1`
- **Breaking change de API (rota deletada, schema de DB renomeado)**: `0.9.0-beta.x` (ainda na série beta — breaking changes são esperadas nesta fase)

#### Sumaúma (`1.0.0-rc.x`)
- **Bugfix**: `1.0.0-rc.2`, `rc.3`, ...
- **Nenhum crash ou bug crítico na janela de RC**: promover para `1.0.0` (GA)
- **Breaking change descoberta no RC**: regredir discussão, aplicar fix → novo `rc.x`
- **Nova feature pós-GA**: `1.1.0` ou `1.1.0-beta.1` se ainda instável

#### Iaçã (`0.0.0`)
- **Primeiros endpoints criados**: `0.1.0-alpha.1`
- **Feature-complete interno, testando internamente**: `0.9.0-alpha.x`
- **Pronto para Beta externo**: `0.9.0-beta.1`

### Passo 5 — Disparar `/sync-context`

Todo bump de versão **deve** ser seguido de `/sync-context` para manter a memória do ecossistema alinhada com o estado real dos artefatos.

## Guia Rápido de Decisão

```
Mudança aconteceu →
  ├── Remove/renomeia rota, campo de DB ou store público?
  │     └── MAJOR bump (dentro da série beta: breaking é ok, não sobe major)
  ├── Adiciona funcionalidade nova e backward-compatible?
  │     └── MINOR bump
  └── Apenas corrige, refatora, ajusta estilo?
        └── PATCH bump

Fase de lançamento →
  ├── API instável / em construção → sufixo -alpha.N
  ├── Feature-complete, testando em escala → sufixo -beta.N
  ├── Pronto pra GA, corrigindo arestas → sufixo -rc.N
  └── Estável e faturando → sem sufixo (GA)
```

## Limitações e Boas Práticas

**Esta skill NÃO:**
- Executa `git tag` ou `npm version` automaticamente (aguarda aprovação do usuário).
- Substitui uma análise humana de breaking changes — a classificação é uma orientação, não uma garantia.
- Gerencia changelogs externos (GitHub Releases, CHANGELOG.md em formato convencional) — apenas atualiza os `context.md` internos do `.agent`.

**Anti-padrões a evitar:**
- ❌ Usar `1.0.0` apenas porque o `npm init` sugeriu — use a versão que reflete a maturidade real.
- ❌ Bumpar apenas o frontend ou apenas o backend sem sincronizar o par — os dois devem andar juntos dentro do mesmo módulo.
- ❌ Remover o sufixo de pré-lançamento antes de validar em produção.
- ❌ Incrementar o MAJOR durante a série `0.x.x` — nesta fase, breaking changes são esperadas e não justificam um `1.0.0` prematuro.

## Referências no Ecossistema

- `docs/manual_boas_praticas.md` → Seção 15: Versionamento e Lançamento de Software
- `/.agent/context.md` → Changelog Global do Ecossistema
- `kurupira/.agent/context.md` → Changelog do Kurupira
- `sumauma/.agent/context.md` → Changelog do Sumaúma

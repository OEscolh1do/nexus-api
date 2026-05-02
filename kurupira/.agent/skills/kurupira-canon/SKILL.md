---
name: kurupira-canon
description: Guardrail arquitetural do Kurupira. Injeta as premissas inegociáveis de domínio (Catálogo vs Inventário, Zustand+Zundo, WebGL+DOM) e o ciclo de vida de Épicos antes de qualquer alteração no módulo de Engenharia Solar.
---

# Skill: Kurupira Canon — Verdade Arquitetural

## Gatilho Semântico

Ativado **automaticamente** quando a tarefa envolve:
- Alterações em `kurupira/frontend/src/` (componentes, hooks, stores, services)
- Manipulação do `solarStore` (Zustand) ou dados do catálogo de equipamentos
- Renderização WebGL / Canvas / `@react-three/fiber` / Leaflet
- Refatoração de módulos do Kurupira (dimensionamento, elétrico, proposta)
- Criação de novas Specs ou Épicos de Engenharia

## 🚨 Premissas Inegociáveis

As premissas abaixo foram consolidadas nas Fases P0 a P4 do Kurupira. Qualquer código novo que entre em conflito com elas está **errado por definição** e deve ser adaptado ao sistema existente.

### 1. Separação de Domínios: Catálogo ≠ Inventário

| Conceito | Schema | Onde vive | Possui `quantity`/`price`? |
|----------|--------|-----------|---------------------------|
| **Catálogo** (`ModuleCatalogItem`) | Propriedades profundas (`electrical.pmax`, `physical.widthMm`) | Banco de dados (Prisma) / API `/catalog` | ❌ Nunca |
| **Inventário** (`ModuleSpecs`) | Schema plano com campos transacionais | `solarStore.ts` (Zustand) | ✅ Sim |

- A ponte entre os dois é a função utilitária `mapCatalogToSpecs()`.
- **Jamais force um único schema Zod a atender Catálogo + Inventário simultaneamente.** Este erro causou 138 erros de tipagem e rollback total na Fase P4.

### 2. Estado Normalizado: Zustand + Zundo

- **Dicionários rastreados**, nunca árvores JSON profundas aninhadas e interativas.
- **Stores em slices**: cada domínio (`modules`, `inverters`, `strings`, `areas`) é um slice independente dentro do `solarStore`.
- **Throttling obrigatório**: Elementos contínuos (sliders, drag) não disparam `setState` a cada pixel. O Commit do array ocorre no evento `onPointerUp`, senão o Zundo acumula patches irreversíveis.
- **Actions em imperativo**: `setModuleSpecs`, `addString`, `removeArea`.

### 3. Integração WebGL + DOM = Água e Óleo

- O **DOM Reativo** (RightInspector, LeftOutliner, PropertiesDrawer) orquestra a interface via React State.
- O **WebGL** (`@react-three/fiber` sobre Leaflet) consome dados em background.
- **Evite props no Canvas**: Alterações paramétricas (ex: rotação via slider) não devem acionar re-renderização JSX. Use `useRef` e colete o valor transiente via `useFrame` + `api.getState().entities[id]`.
- **Renderização Sob Demanda**: `frameloop="demand"` — GPU dorme a 0% CPU quando nada muda. Chame `invalidate()` cirurgicamente apenas em mutações explícitas do Zustand.

## 📂 Ciclo de Vida de Épicos

O progresso de desenvolvimento segue **3 estágios** gerenciados dentro de `.agent/`:

```
.agent/
├── aguardando/     ← Specs aprovadas aguardando implementação
├── em-andamento/   ← Épico ativo sendo programado (máximo 1 por vez)
└── concluido/      ← Relatórios de execução (Verdade Canônica)
```

### Regras do Ciclo

1. **`aguardando/`** — Contém Specs em Markdown. Nunca altere `src/` baseado numa spec que está aqui sem autorização explícita do desenvolvedor líder.
2. **`em-andamento/`** — Silo de Batalha. Um Épico só sai daqui se `npx tsc --noEmit` retornar **EXIT CODE 0**. Novos erros TS/TSX não são tolerados.
3. **`concluido/`** — Histórico de Decisões. As soluções documentadas aqui são **Verdade Canônica**. Se o seu novo raciocínio contradiz uma decisão em `concluido/`, **adapte o seu raciocínio, não o contrário**.

## 🔒 Protocolo de Validação

Antes de qualquer commit ou entrega, o agente deve:

1. Executar `npx tsc --noEmit` → **Zero erros**
2. Verificar que não há violação das 3 premissas acima
3. Confirmar que a separação Catálogo/Inventário foi respeitada (nenhum `quantity` em tipos de catálogo)
4. Confirmar que nenhum `setState` contínuo foi introduzido sem throttle/debounce

## Saída Esperada

Quando esta skill é consultada, o agente deve:
- Recitar as premissas relevantes à tarefa atual antes de propor código
- Sinalizar violações se detectadas no código existente
- Recusar implementações que conflitem com o Canon, explicando qual premissa seria violada

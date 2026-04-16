# Spec — Múltiplas Propostas por Projeto (Variantes)

**Tipo:** Feature Nova + Refatoração de Modelo de Dados
**Módulo:** `engineering` + `proposal` + `kurupira/backend`
**Prioridade:** P1 — Crítico
**Responsável (impl.):** `the-builder`
**Revisor (aceitação):** `engenheiro-eletricista-pv`
**Data de criação:** 2026-04-14
**Versão:** 2.0 — revisado 2026-04-15
**Supersede:** `spec-multiplas-propostas-2026-04-14.md` v1.0

---

## Changelog v2.0

| Seção | Mudança |
|-------|---------|
| §5.5 | Caminho do store corrigido: `core/stores/` → `core/state/` |
| §6 Frontend | Caminhos de todos os arquivos corrigidos para `core/state/` |
| §6 Frontend | Referência ao `RightInspector` removida (eliminado no MVP atual) |
| Referências | `scope-jornada-integrador-2026-04-14.md` → `scope-jornada-integrador-2026-04-15.md` |
| Referências | `spec-guardiao-aprovacao` referenciada como spec existente (não "pendente") |

---

## 1. O problema real (mantido)

### 1.1 Como o integrador trabalha hoje

Quando um cliente pede um orçamento, a primeira pergunta é "qual cenário vou
apresentar". Em quase toda negociação existem ao menos dois cenários:

- **Mínimo:** cobre o suficiente para zerar a conta nos meses favoráveis.
- **Confortável:** cobre 100% do consumo anual com folga para sazonalidade.
- **Premium:** inclui margem para crescimento de carga e expansão futura.

Hoje o integrador cria três projetos separados para o mesmo cliente. Os dados do
cliente (endereço, consumo, localização) são copiados três vezes — e quando o cliente
corrige uma fatura, o integrador atualiza em três lugares.

### 1.2 O que falta no modelo atual (mantido)

O schema `TechnicalDesign` mistura duas naturezas distintas:

| Dados do projeto (contexto imutável) | Dados da proposta (decisão do integrador) |
|--------------------------------------|------------------------------------------|
| Cliente (nome, cidade) | Módulo escolhido (modelo, quantidade) |
| Localização (lat/lng, HSP) | Inversor escolhido |
| Consumo histórico (12 faturas) | Arranjo físico (telhado, strings) |
| Tarifa da distribuidora | Preço e margem |
| Conexão nominal | Nome/rótulo do cenário |

---

## 2. Decisão Arquitetural: Projeto + Variantes (mantida)

```
TechnicalDesign (Projeto)
  ├── Dados do cliente (imutáveis por variante)
  │     clientName, city, lat/lng, monthlyConsumption[12],
  │     tariffRate, connectionType, iacaLeadId
  │
  └── DesignVariant[] (Propostas)
        ├── variant-001: "Mínimo"   [DRAFT]
        ├── variant-002: "Padrão"   [APPROVED] ← ativa no workspace
        └── variant-003: "Premium"  [ARCHIVED]
```

Cada `DesignVariant` contém o snapshot completo do dimensionamento: módulos,
inversor, arranjo físico, strings, simulação e dados comerciais.

O workspace sempre edita **uma variante por vez** — a variante ativa.

---

## 3. Casos de Uso Essenciais (mantidos)

1. Criar segunda variante a partir de uma existente (clonar + ajustar)
2. Aprovar uma variante → as outras DRAFT ficam ARCHIVED automaticamente
3. Ver comparativo de variantes (kWp, preço, payback) no hub
4. PDF vinculado à variante que o gerou

---

## 4. Experiência do Integrador (mantida)

### 4.1 No Hub (ProjectExplorer)

```
┌──────────────────────────────┐
│  [thumbnail satélite]        │
│  João Silva                  │
│  Parauapebas, PA             │
│                              │
│  ✓ Padrão — APROVADO         │
│  3 variantes  · 22 kWp       │
└──────────────────────────────┘
```

### 4.2 No Workspace — Seletor de Variante

Seletor compacto no `TopRibbon`, próximo ao nome do projeto:

```
[João Silva]  [Padrão ▾]  →  dropdown:
                               ● Mínimo      DRAFT
                               ● Padrão      APPROVED  ← atual
                               ○ Premium     DRAFT
                               ─────────────────────
                               + Nova variante
```

### 4.3 Painel de Variantes

```
Variantes — João Silva
─────────────────────────────────────────────────────────────
Nome       Estado      kWp     Módulos   Preço        Ações
─────────────────────────────────────────────────────────────
Mínimo     DRAFT       3.1 kWp    5 un.  R$ 8.200    [Editar] [...]
Padrão     APPROVED    4.9 kWp    8 un.  R$ 11.800   [Ver]    [...]
Premium    DRAFT       6.7 kWp   11 un.  R$ 15.400   [Editar] [...]
─────────────────────────────────────────────────────────────
[+ Nova variante em branco]   [+ Duplicar Padrão]
```

---

## 5. Especificação Técnica

### 5.1 Schema Prisma (`db_kurupira`) — mantido

```prisma
model TechnicalDesign {
  id           String          @id @default(uuid())
  tenantId     String
  iacaLeadId   String?
  clientData   Json
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  variants     DesignVariant[]

  @@index([tenantId])
}

model DesignVariant {
  id          String          @id @default(uuid())
  designId    String
  design      TechnicalDesign @relation(fields: [designId], references: [id], onDelete: Cascade)
  label       String          @default("Nova variante")
  status      String          @default("DRAFT")
  isFeatured  Boolean         @default(false)
  designData  Json
  pdfUrl      String?
  approvedAt  DateTime?
  archivedAt  DateTime?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  @@index([designId])
  @@index([designId, status])
}
```

### 5.2 Separação `clientData` vs `designData` (mantida)

**`clientData`** — pertence ao `TechnicalDesign`, imutável por variante:
```typescript
interface ClientData {
  clientName: string;
  city: string;
  state: string;
  lat: number | null;
  lng: number | null;
  connectionType: 'monofasico' | 'bifasico' | 'trifasico';
  tariffRate: number;
  monthlyConsumption: number[]; // 12 meses
  distributorName: string;
}
```

**`designData`** — pertence ao `DesignVariant`, varia por cenário:
```typescript
interface DesignData {
  modules: { ... };
  inverters: { ... };
  logicalStrings: { ... };
  mpptConfigs: { ... };
  installationAreas: { ... };
  placedModules: { ... };
  simulationResult: {
    monthlyGeneration: number[];
    annualGenerationKwh: number;
    performanceRatio: number;
  };
  pricing: {
    equipmentCost: number;
    laborCost: number;
    margin: number;
    totalPrice: number;
    paybackYears: number;
  };
}
```

### 5.3 Rotas de API (mantidas)

```
GET    /api/v1/designs
GET    /api/v1/designs/:id
GET    /api/v1/designs/:id/variants
POST   /api/v1/designs/:id/variants
GET    /api/v1/designs/:id/variants/:variantId
PUT    /api/v1/designs/:id/variants/:variantId
PATCH  /api/v1/designs/:id/variants/:variantId/status
PATCH  /api/v1/designs/:id/variants/:variantId/label
DELETE /api/v1/designs/:id/variants/:variantId
```

### 5.4 Lógica de aprovação no backend (mantida)

```typescript
async function approveVariant(designId: string, variantId: string) {
  // Transação atômica — invariante de negócio garantido no backend
  await prisma.designVariant.updateMany({
    where: { designId, status: 'DRAFT', id: { not: variantId } },
    data: { status: 'ARCHIVED', archivedAt: new Date() },
  });
  return prisma.designVariant.update({
    where: { id: variantId },
    data: { status: 'APPROVED', approvedAt: new Date() },
  });
}
```

### 5.5 Mudanças no Zustand (v2.0 — caminhos corrigidos)

```typescript
// kurupira/frontend/src/core/state/slices/variantSlice.ts  ← NOVO
interface VariantSlice {
  activeVariantId: string | null;
  variantLabel: string;
  variantStatus: 'DRAFT' | 'APPROVED' | 'ARCHIVED';
  loadVariant: (variantId: string) => Promise<void>;
  saveVariant: () => Promise<void>;
}
```

O slice é composto no `solarStore.ts` junto com `techSlice`, `clientSlice`,
`electricalSlice` e `journeySlice`, seguindo o padrão existente em
`kurupira/frontend/src/core/state/slices/`.

O workspace bloqueia edição quando `variantStatus === 'APPROVED'`.

---

## 6. Arquivos Afetados (v2.0)

### Backend

| Arquivo | Mudança |
|---------|---------|
| `kurupira/backend/prisma/schema.prisma` | Adicionar `DesignVariant`, separar `clientData` de `designData` |
| `kurupira/backend/migrations/split_designdata.ts` | Migration de dados existentes |
| `kurupira/backend/src/routes/designs.js` | Adaptar rotas; adicionar rotas de variantes |
| `kurupira/backend/src/controllers/variants.controller.js` | CRUD de variantes + aprovação |

### Frontend

| Arquivo | Mudança |
|---------|---------|
| `core/state/slices/variantSlice.ts` | **[NOVO]** `activeVariantId`, `variantLabel`, `variantStatus`, `loadVariant`, `saveVariant` |
| `core/state/solarStore.ts` | Compor `variantSlice` junto com os demais slices |
| `services/ProjectService.ts` | Adaptar para `clientData` + variantes |
| `ui/panels/TopRibbon.tsx` | Seletor de variante + indicador de estado |
| `ui/components/VariantSelector.tsx` | **[NOVO]** Dropdown de variantes |
| `ui/panels/VariantManagerPanel.tsx` | **[NOVO]** Painel de gerenciamento completo |
| `ui/ProjectExplorer.tsx` | Card com contagem de variantes e estado da aprovada |
| `modules/proposal/` | PDF vinculado à `DesignVariant.pdfUrl` |

> **Nota v2.0:** O `RightInspector` foi eliminado no MVP atual. Qualquer
> funcionalidade que antes usaria o `RightInspector` para exibir detalhes de
> variantes deve usar um modal (`VariantManagerPanel`) ou o `TopRibbon`.

---

## 7. Plano de Migração (mantido)

```
Etapa 1: Schema Prisma + migration script
  → Backend compila; dados existentes migrados sem perda

Etapa 2: Novas rotas de API (variants CRUD)
  → API funcional; frontend ainda usa rotas antigas

Etapa 3: variantSlice no solarStore
  → Store sabe qual variante está ativa; salva/carrega corretamente

Etapa 4: VariantSelector no TopRibbon
  → Integrador consegue trocar entre variantes no workspace

Etapa 5: VariantManagerPanel
  → Gerenciamento completo: criar, duplicar, arquivar, aprovar

Etapa 6: Atualizar ProjectExplorer
  → Hub mostra contagem de variantes e estado da aprovada
```

### Guardrails

- [ ] Migration script é idempotente — rodar duas vezes não duplica variantes
- [ ] Projetos sem variante nunca são exibidos sem pelo menos 1 variante criada automaticamente
- [ ] Trocar de variante pede confirmação se há mudanças não salvas
- [ ] Variante APPROVED não pode ser deletada — verificado no backend
- [ ] `tsc --noEmit` → EXIT CODE 0 após cada etapa

---

## 8. Avaliação de Riscos (mantida)

| Risco | Prob. | Sev. | Mitigação |
|-------|:-----:|:----:|-----------|
| Migration corrompendo `clientData` | Alta | Alta | Backup antes da migration; rodar em staging; validar 3 projetos manualmente |
| Integrador aprovando variante errada | Média | Alta | Confirmação explícita com nome da variante; possibilidade de reabrir para DRAFT |
| Edição concorrente de variantes diferentes | Baixa | Média | `updatedAt` detecta conflito; concorrência é P2 fora deste escopo |
| `designData` atípico quebrando a migration | Média | Alta | try/catch por projeto; falhas logadas; projetos com erro em lista de revisão manual |
| `solarStore` com variante stale | Média | Média | `loadVariant` sempre faz fetch ao trocar; `activeVariantId` não persiste entre sessões |

---

## 9. Critérios de Aceitação (mantidos)

### Funcionais
- [ ] Criar projeto → 1 variante "Proposta 1" em DRAFT criada automaticamente
- [ ] Criar segunda variante → aparece no seletor do TopRibbon
- [ ] Trocar variante → workspace carrega `designData` da variante selecionada
- [ ] Aprovar variante → outras DRAFT ficam ARCHIVED; aprovada trava para edição
- [ ] ProjectExplorer exibe `"3 variantes · 4.9 kWp"` no card

### Técnicos
- [ ] `GET /api/v1/designs` retorna projetos com lista de variantes (sem `designData` — apenas metadados)
- [ ] `PUT .../variants/:variantId` aceita e salva `designData` como JSON
- [ ] `PATCH .../status { action: 'approve' }` arquiva as outras DRAFT atomicamente
- [ ] Migration: projetos existentes com exatamente 1 variante após migration

### Engenharia
- [ ] Dois cenários (mínimo 5 módulos 610W vs padrão 8 módulos 610W) visíveis no seletor para o mesmo cliente com 500 kWh/mês

---

## 10. O que este escopo desbloqueia (mantido)

| Feature | Desbloqueio |
|---------|-------------|
| Apresentação comparativa ao cliente | N variantes → PDF comparativo side-by-side (próxima spec) |
| Histórico de revisões | Variante aprovada é snapshot imutável para auditoria |
| Pipeline Iaçã mais rico | Iaçã exibe variantes em negociação e qual foi aprovada |
| Template de variante | Variantes aprovadas clonáveis como ponto de partida |

---

## 11. Fora do escopo (mantido)

- Edição colaborativa simultânea de variantes
- Versionamento interno de uma variante (tipo Git)
- Comparativo automático em PDF — feature de alto valor, próxima spec
- Restrição de aprovação por papel (RBAC)

---

## Referências

- Schema atual: `.agent/context.md` → `db_kurupira`
- Módulo proposal: `kurupira/frontend/src/modules/proposal/`
- Fluxo de aprovação: `spec-guardiao-aprovacao-2026-04-15.md` ✅
- Scope da jornada: `scope-jornada-integrador-2026-04-15.md`
- Iaçã `TechnicalProposal`: `.agent/context.md` → `db_iaca`
- Padrão de slices: `kurupira/frontend/src/core/state/slices/`

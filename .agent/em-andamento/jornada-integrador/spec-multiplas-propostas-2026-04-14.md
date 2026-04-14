# Spec — Múltiplas Propostas por Projeto

**Tipo:** Feature Nova + Refatoração de Modelo de Dados
**Módulo:** `engineering` + `proposal` + `kurupira/backend`
**Prioridade:** P1 — Crítico
**Responsável (impl.):** `the-builder`
**Revisor (aceitação):** `engenheiro-eletricista-pv`
**Data de criação:** 2026-04-14
**Versão:** 1.0
**Origem:** proposta-produto / jornada-integrador

---

## 1. O problema real

### 1.1 Como o integrador trabalha hoje

Quando um cliente pede um orçamento, a primeira pergunta que o integrador se faz
não é "qual sistema vou dimensionar" — é "qual cenário vou apresentar". Em quase
toda negociação existem ao menos dois cenários:

- **Mínimo:** cobre o suficiente para zerar a conta de luz nos meses mais favoráveis.
  Menor investimento, payback mais longo.
- **Confortável:** cobre 100% do consumo anual com folga para sazonalidade. O que
  o integrador normalmente recomenda.
- **Premium:** inclui margem para crescimento de carga, às vezes com módulos bifaciais
  ou inversor de maior potência para expansão futura.

Hoje o integrador cria **três projetos separados** para o mesmo cliente: "João Silva -
Mínimo", "João Silva - Padrão", "João Silva - Premium". Isso é ineficiente porque os
dados do cliente (endereço, consumo, localização geográfica) são copiados três vezes.
Pior: quando o cliente muda um dado ("ah, minha conta foi R$ 420, não R$ 380"), o
integrador precisa atualizar nos três projetos.

### 1.2 O que falta no modelo atual

O schema `TechnicalDesign` mistura duas coisas que têm naturezas diferentes:

| O que é do projeto | O que é da proposta |
|--------------------|-------------------|
| Cliente (nome, cidade) | Módulo escolhido (modelo, quantidade) |
| Localização (lat/lng, HSP) | Inversor escolhido |
| Consumo histórico (12 faturas) | Arranjo físico (telhado, strings) |
| Tarifa da distribuidora | Preço e margem |
| Conexão nominal (mono/bi/trifásico) | Nome/rótulo do cenário |

Os dados do projeto são **contexto imutável** — eles descrevem o problema do cliente.
Os dados da proposta são **decisão do integrador** — eles descrevem uma solução possível.

A refatoração certa é separar esses dois domínios no schema e na UI.

---

## 2. Decisão Arquitetural: Projeto + Variantes

### 2.1 O modelo conceitual

```
TechnicalDesign (Projeto)
  ├── Dados do cliente (imutáveis por variante)
  │     clientName, city, lat/lng, monthlyConsumption[12],
  │     tariffRate, connectionType, iacaLeadId
  │
  └── DesignVariant[] (Propostas)
        ├── variant-001: "Mínimo"     [DRAFT]
        ├── variant-002: "Padrão"     [APPROVED] ← ativa no workspace
        └── variant-003: "Premium"   [ARCHIVED]
```

Cada `DesignVariant` contém o snapshot completo do dimensionamento: módulos,
inversor, arranjo físico, configuração de strings, resultado de simulação e
dados comerciais (preço, margem, PDF gerado).

### 2.2 Relação com o workspace

O workspace sempre edita **uma variante por vez** — a variante ativa. O integrador
pode trocar a variante ativa sem sair do projeto. Ao trocar, o workspace carrega o
estado daquela variante no Zustand.

A troca de variante não recarrega o workspace completo — apenas o `designData`
(snapshot da proposta) é substituído. Os dados do cliente (`clientData`) permanecem,
pois pertencem ao projeto, não à variante.

### 2.3 Por que não usar "projetos duplicados"

A alternativa mais simples seria manter o modelo atual e adicionar um botão
"Duplicar projeto". Isso foi descartado por três razões:

1. **Dados de cliente em duplicata.** Se o consumo muda, o integrador atualiza
   em N lugares ou deixa N-1 desatualizados.

2. **Hub poluído.** O `ProjectExplorer` do cliente João Silva mostraria 3 cards,
   dificultando identificar qual é o projeto real do cliente.

3. **Sem hierarquia.** Não há como saber qual variante foi aprovada, qual está em
   rascunho, qual foi descartada. Tudo são projetos iguais na lista.

---

## 3. Ciclo de Vida de uma Variante

### 3.1 Estados

```
DRAFT ──────────────────► APPROVED
  │                           │
  ▼                           ▼
ARCHIVED               (bloqueia edição)
```

| Estado | Significado | Editável | Visível no Hub |
|--------|------------|---------|----------------|
| `DRAFT` | Trabalho em andamento | ✅ | ✅ |
| `APPROVED` | Proposta aprovada para envio | ❌ (bloqueada) | ✅ (destacada) |
| `ARCHIVED` | Descartada, não mais relevante | ❌ | ❌ (oculta por padrão) |

**Regras:**
- Apenas **uma variante pode ser APPROVED** por projeto. Aprovar uma variante
  arquiva automaticamente todas as outras que estavam em DRAFT.
- Uma variante APPROVED pode ser "reabertas" para DRAFT se o integrador precisar
  fazer ajustes — mas isso exige confirmação explícita e registra um log de auditoria.
- ARCHIVED é reversível: o integrador pode restaurar para DRAFT.

### 3.2 Ações disponíveis por variante

| Ação | Estado origem | Resultado | Observação |
|------|-------------|---------|-----------|
| Editar | DRAFT | — (abre workspace) | — |
| Renomear | Qualquer | — | Edita apenas o `label` |
| Duplicar | Qualquer | Nova variante DRAFT com mesmo `designData` | Útil para criar "Padrão+" a partir do "Padrão" |
| Arquivar | DRAFT | ARCHIVED | — |
| Restaurar | ARCHIVED | DRAFT | — |
| Favoritar | Qualquer | Marca `isFeatured: true` | Destaque visual; não altera estado |
| Aprovar | DRAFT | APPROVED | As outras DRAFT ficam arquivadas automaticamente |
| Gerar PDF | DRAFT ou APPROVED | PDF gerado e vinculado à variante | DRAFT gera PDF com marca d'água "Rascunho" |
| Excluir | DRAFT ou ARCHIVED | Hard delete | APPROVED não pode ser excluída |

---

## 4. Experiência do Integrador

### 4.1 No Hub (ProjectExplorer)

O card do projeto exibe um indicador de quantas variantes existem:

```
┌──────────────────────────────┐
│  [thumbnail satélite]        │
│  João Silva                  │
│  Parauapebas, PA             │
│                              │
│  ✓ Padrão — APROVADO         │  ← variante ativa/aprovada
│  3 variantes  · 22 kWp       │  ← contagem + kWp da aprovada
└──────────────────────────────┘
```

Clicar no card abre o workspace na variante ativa (APPROVED ou a última DRAFT editada).

### 4.2 No Workspace — Seletor de Variante

Um seletor compacto aparece no `TopRibbon`, próximo ao nome do projeto:

```
[João Silva]  [Padrão ▾]  →  dropdown:
                               ● Mínimo      DRAFT
                               ● Padrão      APPROVED  ← atual
                               ○ Premium     DRAFT
                               ─────────────────
                               + Nova variante
```

Ao selecionar uma variante diferente: o workspace pergunta se deseja salvar a
variante atual antes de trocar (se houver mudanças não salvas).

### 4.3 Painel de Variantes (gerenciamento completo)

Um painel dedicado acessível via botão no `TopRibbon` ou via Hub mostra todas as
variantes do projeto com suas métricas resumidas:

```
Variantes do projeto — João Silva
─────────────────────────────────────────────────────────
Nome         Estado      kWp     Módulos   Preço      Ações
─────────────────────────────────────────────────────────
Mínimo       DRAFT       3.1 kWp    5 un.  R$ 8.200   [Editar] [...]
Padrão       APPROVED    4.9 kWp    8 un.  R$ 11.800  [Ver]    [...]
Premium      DRAFT       6.7 kWp   11 un.  R$ 15.400  [Editar] [...]
─────────────────────────────────────────────────────────
[+ Nova variante em branco]   [+ Duplicar Padrão]
```

As colunas `kWp`, `Módulos` e `Preço` são derivadas do `designData` de cada variante
— calculadas no momento da exibição, sem armazenamento redundante.

---

## 5. Especificação Técnica

### 5.1 Migração do Schema Prisma (`db_kurupira`)

#### Modelo atual (simplificado)
```prisma
model TechnicalDesign {
  id         String   @id @default(uuid())
  tenantId   String
  iacaLeadId String?
  designData Json     // ← contém TUDO: cliente + proposta
  status     String   @default("DRAFT")
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

#### Modelo alvo
```prisma
model TechnicalDesign {
  id           String          @id @default(uuid())
  tenantId     String
  iacaLeadId   String?
  clientData   Json            // ← APENAS dados do cliente (imutáveis)
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  variants     DesignVariant[]

  @@index([tenantId])
}

model DesignVariant {
  id          String   @id @default(uuid())
  designId    String
  design      TechnicalDesign @relation(fields: [designId], references: [id], onDelete: Cascade)
  label       String   @default("Nova variante")
  status      String   @default("DRAFT")  // DRAFT | APPROVED | ARCHIVED
  isFeatured  Boolean  @default(false)
  designData  Json     // snapshot completo do dimensionamento
  pdfUrl      String?  // URL do PDF gerado (null se não gerado)
  approvedAt  DateTime?
  archivedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([designId])
  @@index([designId, status])
}
```

#### Migração de dados existentes

Projetos salvos no modelo antigo têm `designData` contendo tudo. A migração:

```typescript
// migration: split TechnicalDesign.designData → clientData + DesignVariant
async function migrateDesigns() {
  const designs = await prisma.technicalDesign.findMany();
  for (const design of designs) {
    const data = design.designData as any;
    const clientData = extractClientData(data); // extrai campos do cliente
    const designData = extractDesignData(data); // extrai campos da proposta

    await prisma.technicalDesign.update({
      where: { id: design.id },
      data: { clientData }
    });

    await prisma.designVariant.create({
      data: {
        designId: design.id,
        label: 'Proposta 1',
        status: design.status ?? 'DRAFT',
        designData
      }
    });
  }
}
```

### 5.2 Separação `clientData` vs `designData`

**`clientData`** (pertence ao `TechnicalDesign` — imutável por variante):
```typescript
interface ClientData {
  clientName: string;
  city: string;
  state: string;
  lat: number | null;
  lng: number | null;
  connectionType: 'monofasico' | 'bifasico' | 'trifasico';
  tariffRate: number;         // R$/kWh
  monthlyConsumption: number[12]; // kWh por mês
  distributorName: string;
}
```

**`designData`** (pertence ao `DesignVariant` — varia por cenário):
```typescript
interface DesignData {
  // Dimensionamento elétrico
  modules: { ... };       // useTechStore.modules snapshot
  inverters: { ... };     // useTechStore.inverters snapshot
  logicalStrings: { ... };
  mpptConfigs: { ... };

  // Arranjo físico
  installationAreas: { ... }; // projectSlice.installationAreas snapshot
  placedModules: { ... };

  // Simulação (calculada, não editável)
  simulationResult: {
    monthlyGeneration: number[12];
    annualGenerationKwh: number;
    performanceRatio: number;
    // ...
  };

  // Comercial
  pricing: {
    equipmentCost: number;
    laborCost: number;
    margin: number;
    totalPrice: number;
    paybackYears: number;
  };
}
```

### 5.3 Novas rotas de API

```
GET    /api/v1/designs                          → lista TechnicalDesigns com variante ativa
GET    /api/v1/designs/:id                      → projeto com todas as variantes
GET    /api/v1/designs/:id/variants             → lista variantes do projeto
POST   /api/v1/designs/:id/variants             → cria nova variante (blank ou clone)
GET    /api/v1/designs/:id/variants/:variantId  → dados completos de uma variante
PUT    /api/v1/designs/:id/variants/:variantId  → salva snapshot da variante
PATCH  /api/v1/designs/:id/variants/:variantId/status  → muda status (approve/archive/restore)
PATCH  /api/v1/designs/:id/variants/:variantId/label   → renomeia
DELETE /api/v1/designs/:id/variants/:variantId  → deleta (apenas DRAFT e ARCHIVED)
```

### 5.4 Lógica de aprovação no backend

```typescript
// PATCH /variants/:variantId/status { action: 'approve' }
async function approveVariant(designId, variantId) {
  // 1. Verificar que não há outra APPROVED
  const existing = await prisma.designVariant.findFirst({
    where: { designId, status: 'APPROVED' }
  });

  // 2. Arquivar todas as DRAFT do mesmo projeto
  await prisma.designVariant.updateMany({
    where: { designId, status: 'DRAFT', id: { not: variantId } },
    data: { status: 'ARCHIVED', archivedAt: new Date() }
  });

  // 3. Aprovar a variante solicitada
  return prisma.designVariant.update({
    where: { id: variantId },
    data: { status: 'APPROVED', approvedAt: new Date() }
  });
}
```

### 5.5 Mudanças no Zustand

O `solarStore` atual armazena o `designData` de uma única proposta em memória.
Com variantes, o store precisa saber qual variante está ativa:

```typescript
// solarStore — campos novos
interface SolarStoreState {
  // ... campos existentes ...
  activeVariantId: string | null;    // ID da DesignVariant carregada
  variantLabel: string;              // label da variante (exibido no TopRibbon)
  variantStatus: 'DRAFT' | 'APPROVED' | 'ARCHIVED';

  // Actions novas
  loadVariant: (variantId: string) => Promise<void>;
  saveVariant: () => Promise<void>;  // salva o estado atual como snapshot
}
```

O workspace é bloqueado para edição quando `variantStatus === 'APPROVED'` — o
comportamento de "trava" já existe no estado `APPROVED` atual, apenas muda de nível
(de projeto para variante).

---

## 6. Arquivos Afetados

### Backend

| Arquivo | Mudança |
|---------|---------|
| `[MODIFY] kurupira/backend/prisma/schema.prisma` | Adicionar `DesignVariant`, separar `clientData` de `designData` |
| `[NEW] kurupira/backend/migrations/split_designdata.ts` | Migration de dados existentes |
| `[MODIFY] kurupira/backend/src/routes/designs.js` | Adaptar rotas existentes; adicionar rotas de variantes |
| `[NEW] kurupira/backend/src/controllers/variants.controller.js` | CRUD de variantes + lógica de aprovação |

### Frontend

| Arquivo | Mudança |
|---------|---------|
| `[MODIFY] core/stores/solarStore.ts` | `activeVariantId`, `variantLabel`, `variantStatus`; `loadVariant`, `saveVariant` |
| `[MODIFY] services/ProjectService.ts` | Adaptar para `clientData` + variantes |
| `[MODIFY] ui/panels/TopRibbon.tsx` | Seletor de variante + indicador de estado da variante |
| `[NEW] ui/components/VariantSelector.tsx` | Dropdown de variantes no TopRibbon |
| `[NEW] ui/panels/VariantManagerPanel.tsx` | Painel completo de gerenciamento de variantes |
| `[MODIFY] ui/ProjectExplorer.tsx` | Card com contagem de variantes e variante ativa |
| `[MODIFY] modules/proposal/` | PDF gerado por variante (URL armazenada em `DesignVariant.pdfUrl`) |

---

## 7. Plano de Migração

### Ordem de execução

```
Etapa 1: Schema Prisma + migration script
  → Backend compila; dados existentes migrados sem perda

Etapa 2: Novas rotas de API (variants CRUD)
  → API funcional; frontend ainda usa rotas antigas

Etapa 3: solarStore — activeVariantId + loadVariant + saveVariant
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
- [ ] Projetos sem variante (criados antes da migration) nunca são exibidos sem
  pelo menos 1 variante criada automaticamente
- [ ] Trocar de variante no workspace pede confirmação se há mudanças não salvas
- [ ] Variante APPROVED não pode ser deletada — verificado no backend, não apenas no frontend
- [ ] `tsc --noEmit` → EXIT CODE 0 após cada etapa

---

## 8. Avaliação de Riscos

| Risco | Prob. | Sev. | Mitigação |
|-------|:-----:|:----:|-----------|
| Migration script corrompendo `clientData` por separação incorreta de campos | Alta | Alta | Backup obrigatório antes da migration; rodar em staging primeiro; validar 3 projetos manualmente antes de aplicar em produção |
| Integrador aprovando variante errada por engano | Média | Alta | Confirmação explícita no modal de aprovação com nome da variante; possibilidade de "reabrir" APPROVED para DRAFT |
| Conflito de edição: dois usuários editando variantes diferentes do mesmo projeto simultaneamente | Baixa | Média | `updatedAt` em cada variante permite detectar conflito; fora do escopo desta spec (concorrência é P2) |
| Projetos com `designData` atípico (campos extras ou faltantes) quebrando a migration | Média | Alta | Migration com try/catch por projeto; falhas logadas sem parar o processo; projetos com erro ficam na lista de revisão manual |
| `solarStore` com variante desatualizada (cache stale) | Média | Média | `loadVariant` sempre faz fetch do backend ao trocar; Zustand não persiste `activeVariantId` entre sessões |

---

## 9. Critérios de Aceitação

### Funcionais

- [ ] Integrador cria projeto → 1 variante "Proposta 1" criada automaticamente em DRAFT
- [ ] Integrador cria segunda variante clicando "+ Nova variante" → aparece no seletor do TopRibbon
- [ ] Trocar de variante no dropdown: workspace carrega o `designData` da variante selecionada
- [ ] Aprovar uma variante: as outras DRAFT ficam ARCHIVED; variante aprovada fica travada para edição
- [ ] Arquivar uma variante: some do seletor principal (mas visível em "Ver arquivadas")
- [ ] ProjectExplorer mostra `"3 variantes · 4.9 kWp"` no card do projeto
- [ ] PDF gerado fica vinculado à variante que o gerou (`DesignVariant.pdfUrl`)

### Técnicos

- [ ] `GET /api/v1/designs` retorna projetos com lista de variantes (sem `designData` — apenas metadados para o hub)
- [ ] `PUT /api/v1/designs/:id/variants/:variantId` aceita e salva `designData` como JSON
- [ ] `PATCH .../status { action: 'approve' }` arquiva automaticamente as outras DRAFT do projeto
- [ ] Migration: projetos existentes têm exatamente 1 variante após a migration, com `designData` correto

### Engenharia / Negócio

- [ ] Dois cenários de dimensionamento diferentes (mínimo vs padrão) com consumo 500 kWh/mês:
  - Mínimo: 5 módulos 610W → kWp 3.05, cobre ~85% do consumo anual
  - Padrão: 8 módulos 610W → kWp 4.88, cobre ~100% + folga para verão
  - Ambos visíveis no seletor; cliente muda → consumo atualiza nos dois cenários

---

## 10. O que este escopo desbloqueia

| Feature | Desbloqueio |
|---------|-------------|
| **Apresentação ao cliente com comparativo** | Com N variantes num projeto, o integrador pode exportar um PDF comparativo mostrando os 3 cenários lado a lado — funcionalidade de alto valor comercial |
| **Histórico de revisões** | Cada variante é um snapshot imutável no momento da aprovação — base para auditoria técnica ("qual foi a proposta aprovada em março?") |
| **Pipeline Iaçã mais rico** | O Iaçã pode exibir quantas variantes estão em negociação por lead, e qual foi aprovada — sem precisar de dados de engenharia no CRM |
| **Template de variante** | Futuramente, variantes aprovadas de projetos similares podem ser clonadas como ponto de partida para novos projetos |

---

## 11. Fora do escopo

- **Edição colaborativa simultânea de variantes** — dois usuários editando variantes diferentes ao mesmo tempo (concorrência distribuída) é escopo futuro
- **Versionamento dentro de uma variante** — histórico de alterações (tipo Git) dentro de uma mesma variante não está neste escopo; a variante é um snapshot único
- **Comparativo automático em PDF** — gerar um PDF side-by-side com N cenários é uma feature de alto valor mas requer trabalho de layout separado
- **Restrição de aprovação por papel (RBAC)** — hoje qualquer `ENGINEER` pode aprovar; restringir aprovação a `COORDENACAO` ou acima é escopo de IAM

---

## Referências

- Schema atual: `.agent/context.md` → `db_kurupira`
- Módulo proposal existente: `kurupira/frontend/src/modules/proposal/`
- Fluxo de aprovação existente: `TopRibbon.tsx` → dropdown `Rascunho / Aprovado`
- Spec da jornada do integrador: `scope-jornada-integrador-2026-04-14.md` §7 (Ato 5 — Aprovação)
- Iaçã `TechnicalProposal`: `.agent/context.md` → `db_iaca` (entidade separada no CRM)

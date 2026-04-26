# Spec — Extensão de Catálogo: ModuleModel e InverterModel (Campos PV Técnicos)

**Tipo:** Feature Nova (Modelo de Dados + API + UI de Catálogo)
**Módulo:** `backend/prisma`, `api/catalogo`, `ui/catalogs`
**Prioridade:** P0 — Bloqueante para validações elétricas da ElectricalCanvasView v2.0
**Responsável (impl.):** `the-builder`
**Revisor (aceitação):** `engenheiro-eletricista-pv`
**Data de criação:** 2026-04-25
**Versão:** 1.0
**Dependência direta:** `patch-spec-view-electrical-pv-2026-04-25.md`

---

## 1. Contexto

A `ElectricalCanvasView` v2.0 requer campos técnicos adicionais nos catálogos de módulos e inversores para realizar cálculos de Voc(frio), Vmp(calor), Isc de hardware e validações normativas. Os modelos atuais não contêm esses campos.

Esta spec é **pré-requisito de implementação** para o patch elétrico: sem as migrações de banco descritas aqui, nenhuma das validações novas pode ser implementada.

---

## 2. ModuleModel — Extensão

### 2.1 Campos a adicionar

| Campo | Tipo SQL | Prisma | Default | Nullable | Descrição |
|-------|----------|--------|---------|----------|-----------|
| `bifacial` | `BOOLEAN` | `Boolean` | `false` | Não | Módulo captura luz pela face traseira |
| `bifacialityFactor` | `DECIMAL(4,2)` | `Float?` | `null` | Sim | Fator de bifacialidade (ex: 0,70); null se não bifacial |
| `noct` | `DECIMAL(5,1)` | `Float` | `45.0` | Não | Temperatura nominal da célula em operação (°C) |
| `nmot` | `DECIMAL(5,1)` | `Float?` | `null` | Sim | NMOT — alternativa ao NOCT sob carga; mais preciso |
| `cellSizeClass` | `VARCHAR(12)` | `String` | `'standard'` | Não | Geração da célula: `standard`, `M6`, `M10`, `G12` |
| `tempCoeffVoc` | `DECIMAL(6,4)` | `Float` | `-0.0028` | Não | Coeficiente de temperatura de Voc (%/°C como decimal; ex: −0,28% → −0,0028) |
| `tempCoeffPmax` | `DECIMAL(6,4)` | `Float` | `-0.0034` | Não | Coeficiente de temperatura de Pmax (%/°C como decimal; ex: −0,34% → −0,0034) |

> **Convenção de unidade para coeficientes:** os campos armazenam o valor como fração decimal, não como porcentagem. Exemplo: −0,28%/°C é armazenado como `−0.0028`. O frontend usa o valor direto na fórmula `Voc × (1 + tempCoeffVoc × ΔT)` sem conversão adicional.

### 2.2 Schema Prisma — trecho adicionado

```prisma
model ModuleModel {
  // campos existentes (não modificados)
  id              String   @id @default(uuid())
  tenantId        String
  brand           String
  model           String
  powerWp         Int
  voc             Float
  vmp             Float
  isc             Float
  imp             Float
  lengthMm        Int
  widthMm         Int
  technology      String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // campos novos (este patch)
  bifacial           Boolean  @default(false)
  bifacialityFactor  Float?
  noct               Float    @default(45.0)
  nmot               Float?
  cellSizeClass      String   @default("standard")
  tempCoeffVoc       Float    @default(-0.0028)
  tempCoeffPmax      Float    @default(-0.0034)

  @@index([tenantId])
  @@index([tenantId, brand])
}
```

### 2.3 Migration script (Prisma)

```sql
-- migration: add_module_pv_fields
ALTER TABLE "ModuleModel"
  ADD COLUMN "bifacial"          BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN "bifacialityFactor" DECIMAL(4,2)          DEFAULT NULL,
  ADD COLUMN "noct"              DECIMAL(5,1) NOT NULL DEFAULT 45.0,
  ADD COLUMN "nmot"              DECIMAL(5,1)          DEFAULT NULL,
  ADD COLUMN "cellSizeClass"     VARCHAR(12)  NOT NULL DEFAULT 'standard',
  ADD COLUMN "tempCoeffVoc"      DECIMAL(6,4) NOT NULL DEFAULT -0.0028,
  ADD COLUMN "tempCoeffPmax"     DECIMAL(6,4) NOT NULL DEFAULT -0.0034;
```

Todos os registros existentes receberão os defaults sem necessidade de preenchimento manual. Os defaults são conservadores e tecnicamente válidos para módulos monocristalinos padrão de mercado.

### 2.4 TypeScript interface (frontend)

```typescript
// core/types/catalog.ts

export interface ModuleModel {
  // campos existentes
  id: string;
  tenantId: string;
  brand: string;
  model: string;
  powerWp: number;
  voc: number;       // V — STC
  vmp: number;       // V — STC
  isc: number;       // A — STC
  imp: number;       // A — STC
  lengthMm: number;
  widthMm: number;
  technology: string;

  // campos novos
  bifacial: boolean;
  bifacialityFactor: number | null;  // ex: 0.70
  noct: number;                      // °C, ex: 45
  nmot: number | null;               // °C — mais preciso que NOCT, opcional
  cellSizeClass: 'standard' | 'M6' | 'M10' | 'G12';
  tempCoeffVoc: number;              // decimal: -0.0028 = -0.28%/°C
  tempCoeffPmax: number;             // decimal: -0.0034 = -0.34%/°C
}
```

---

## 3. InverterModel — Extensão

### 3.1 Campos a adicionar

| Campo | Tipo SQL | Prisma | Default | Nullable | Descrição |
|-------|----------|--------|---------|----------|-----------|
| `vocMaxHardware` | `DECIMAL(7,1)` | `Float` | derivado de `vocMaxInput` | Não | Tensão máxima absoluta CC — limite de destruição (V) |
| `iscMaxHardware` | `DECIMAL(6,2)` | `Float?` | `null` | Sim | Corrente máxima de curto-circuito suportada por MPPT (A) |
| `afci` | `BOOLEAN` | `Boolean` | `false` | Não | Possui proteção contra arco elétrico (AFCI) |
| `rsd` | `BOOLEAN` | `Boolean` | `false` | Não | Suporta Desligamento Rápido (RSD / NBR 17193) |
| `ipRating` | `VARCHAR(8)` | `String` | `'IP65'` | Não | Grau de proteção, ex: "IP65", "IP66", "IP67" |
| `coolingType` | `VARCHAR(10)` | `String` | `'passive'` | Não | Tipo de resfriamento: `passive` ou `active` |
| `maxAmbientTemp` | `DECIMAL(4,1)` | `Float` | `45.0` | Não | Temperatura ambiente máxima sem derating (°C) |
| `deratingStartTemp` | `DECIMAL(4,1)` | `Float` | `40.0` | Não | Temperatura onde inicia derating (°C) |
| `portaria515Compliant` | `BOOLEAN` | `Boolean` | `false` | Não | Conformidade Portaria Inmetro 515/2023 |
| `nbr17193Compliant` | `BOOLEAN` | `Boolean` | `false` | Não | Conformidade ABNT NBR 17193:2025 (RSD) |

> **Nota sobre `vocMaxHardware`:** este campo é distinto de `vocMaxInput` (tensão máxima do MPPT). `vocMaxHardware` é o limite absoluto acima do qual há risco de destruição dos transistores. Quando o campo não existia, os projetos usavam `vocMaxInput` para esta validação — o que subestimava a margem real de segurança. Os dois campos devem ser populados separadamente no cadastro.

> **Nota sobre `iscMaxHardware`:** alguns fabricantes não publicam este valor explicitamente. Quando `null`, o sistema exibe o sub-chip Isc(hw) como "—" (não validável), conforme especificado no patch elétrico.

### 3.2 Schema Prisma — trecho adicionado

```prisma
model InverterModel {
  // campos existentes (não modificados)
  id                String   @id @default(uuid())
  tenantId          String
  brand             String
  model             String
  powerAcKw         Float
  powerDcKwMax      Float
  vocMaxInput       Float    // tensão máxima de entrada do MPPT
  vminMppt          Float    // tensão mínima do MPPT
  vmaxMppt          Float    // tensão máxima do MPPT
  imaxMppt          Float    // corrente máxima por MPPT (limite operacional)
  mpptCount         Int
  stringsPerMppt    Int
  efficiency        Float
  technology        String   // 'string' | 'micro' | 'hybrid'
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // campos novos (este patch)
  vocMaxHardware       Float    // V — limite de destruição; pode = vocMaxInput em alguns modelos
  iscMaxHardware       Float?   // A — limite físico de curto-circuito por MPPT; null se não publicado
  afci                 Boolean  @default(false)
  rsd                  Boolean  @default(false)
  ipRating             String   @default("IP65")
  coolingType          String   @default("passive")   // 'passive' | 'active'
  maxAmbientTemp       Float    @default(45.0)
  deratingStartTemp    Float    @default(40.0)
  portaria515Compliant Boolean  @default(false)
  nbr17193Compliant    Boolean  @default(false)

  @@index([tenantId])
  @@index([tenantId, brand])
  @@index([tenantId, technology])
}
```

### 3.3 Migration script (Prisma)

```sql
-- migration: add_inverter_normative_fields
ALTER TABLE "InverterModel"
  ADD COLUMN "vocMaxHardware"       DECIMAL(7,1) NOT NULL DEFAULT 0,
  ADD COLUMN "iscMaxHardware"       DECIMAL(6,2)          DEFAULT NULL,
  ADD COLUMN "afci"                 BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN "rsd"                  BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN "ipRating"             VARCHAR(8)   NOT NULL DEFAULT 'IP65',
  ADD COLUMN "coolingType"          VARCHAR(10)  NOT NULL DEFAULT 'passive',
  ADD COLUMN "maxAmbientTemp"       DECIMAL(4,1) NOT NULL DEFAULT 45.0,
  ADD COLUMN "deratingStartTemp"    DECIMAL(4,1) NOT NULL DEFAULT 40.0,
  ADD COLUMN "portaria515Compliant" BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN "nbr17193Compliant"    BOOLEAN      NOT NULL DEFAULT false;

-- Popular vocMaxHardware com vocMaxInput para registros existentes
-- (conservador — evita que validação de hardware seja ignorada nos registros legados)
UPDATE "InverterModel"
SET "vocMaxHardware" = "vocMaxInput"
WHERE "vocMaxHardware" = 0;
```

> **Silent migration:** a atualização de `vocMaxHardware = vocMaxInput` para registros existentes é conservadora — usa o limite já conhecido como proxy. O administrador do catálogo deve revisar e corrigir onde o valor real de `Voc_max_hardware` for diferente de `vocMaxInput`.

### 3.4 TypeScript interface (frontend)

```typescript
// core/types/catalog.ts

export interface InverterModel {
  // campos existentes
  id: string;
  tenantId: string;
  brand: string;
  model: string;
  powerAcKw: number;
  powerDcKwMax: number;
  vocMaxInput: number;    // V — limite máximo do MPPT
  vminMppt: number;       // V — limite mínimo do MPPT
  vmaxMppt: number;       // V — limite máximo do MPPT (pode = vocMaxInput)
  imaxMppt: number;       // A — limite operacional por MPPT
  mpptCount: number;
  stringsPerMppt: number;
  efficiency: number;     // fração decimal: 0.975 = 97,5%
  technology: 'string' | 'micro' | 'hybrid';

  // campos novos
  vocMaxHardware: number;          // V — limite de destruição
  iscMaxHardware: number | null;   // A — limite físico; null se não publicado
  afci: boolean;
  rsd: boolean;
  ipRating: string;                // ex: 'IP65'
  coolingType: 'passive' | 'active';
  maxAmbientTemp: number;          // °C
  deratingStartTemp: number;       // °C
  portaria515Compliant: boolean;
  nbr17193Compliant: boolean;
}
```

---

## 4. MPPTConfig — Extensão

### 4.1 Campos a adicionar

A tabela/estrutura `MPPTConfig` (ou equivalente no `designData` JSON) recebe dois campos por entrada MPPT:

| Campo | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `azimuthDeg` | `Float?` | `null` | Azimute dos módulos desta entrada (0–360°) |
| `tiltDeg` | `Float?` | `null` | Inclinação dos módulos desta entrada (0–90°) |

Como `MPPTConfig` é armazenado dentro do `designData` JSON no `DesignVariant`, não há migração de coluna SQL necessária. A atualização é no schema de validação TypeScript:

```typescript
// core/types/design.ts

export interface MPPTConfig {
  id: string;
  inverterId: string;
  mpptIndex: number;          // 1-based
  modulesPerString: number;
  stringsCount: number;
  // campos novos
  azimuthDeg: number | null;  // null = não configurado / herdado da área
  tiltDeg: number | null;     // null = não configurado / herdado da área
}
```

**Pré-preenchimento:** quando a string estiver associada a um `PhysicalArrangement` com `azimuth` e `tilt`, o frontend pré-preenche `azimuthDeg` e `tiltDeg` no momento da criação da `MPPTConfig`. O integrador pode sobrescrever manualmente.

---

## 5. ProjectSettings — Extensão

### 5.1 Campos a adicionar ao `clientData`

Os campos climáticos de entrada manual são adicionados ao `clientData` do `TechnicalDesign`:

```typescript
// core/types/design.ts

export interface ClientData {
  // campos existentes
  clientName: string;
  city: string;
  state: string;
  lat: number | null;
  lng: number | null;
  connectionType: 'monofasico' | 'bifasico' | 'trifasico';
  tariffRate: number;
  monthlyConsumption: number[];   // 12 meses (kWh)
  distributorName: string;

  // campos novos
  manualTmin: number | null;      // °C — temperatura mínima histórica; sobrescreve dado da API
  manualTmax: number | null;      // °C — temperatura máxima ambiente; para cálculo de Vmp(calor)
  albedo: number;                 // 0–1; default 0.20; reflectividade do solo (módulos bifaciais)
  moduleHeightM: number;          // m; default 0.5; afeta ganho bifacial
}
```

**Campos sem migração SQL:** como `clientData` é um campo JSON na tabela `TechnicalDesign`, não há migração de coluna. Os novos campos são nullable ou têm defaults aplicados no carregamento:

```typescript
// services/ProjectService.ts — ao carregar clientData do backend:
const defaults = {
  manualTmin: null,
  manualTmax: null,
  albedo: 0.20,
  moduleHeightM: 0.5,
};
const clientData = { ...defaults, ...rawClientData };
```

---

## 6. API — Endpoints afetados

### 6.1 Catálogo de módulos

**GET `/api/v1/catalogo/modulos`**
- Retorna todos os campos novos na resposta JSON.
- Suporta filtro `?cellSizeClass=M10` e `?bifacial=true`.

**POST `/api/v1/catalogo/modulos`**
- Aceita todos os campos novos.
- Validação: se `bifacial === true`, `bifacialityFactor` deve ser `0.5 ≤ valor ≤ 1.0`.
- Validação: `tempCoeffVoc` deve ser negativo; `tempCoeffPmax` deve ser negativo.
- Validação: `noct` deve estar entre `30` e `60`.
- Validação: `cellSizeClass` deve ser um dos valores do enum.

**PUT `/api/v1/catalogo/modulos/:id`** — mesmas validações do POST.

### 6.2 Catálogo de inversores

**GET `/api/v1/catalogo/inversores`**
- Retorna todos os campos novos.
- Suporta filtros: `?afci=true`, `?rsd=true`, `?coolingType=active`, `?ipRating=IP65`.
- Suporte combinado: `?afci=true&coolingType=active&ipRating=IP65`.

**POST `/api/v1/catalogo/inversores`**
- Aceita todos os campos novos.
- Validação: `vocMaxHardware` deve ser `≥ vocMaxInput`.
- Validação: se `rsd === true`, `nbr17193Compliant` deve ser `true` (relação lógica).
- Validação: `coolingType` deve ser `'passive'` ou `'active'`.
- Validação: `ipRating` deve corresponder ao padrão `IP[0-9]{2}[A-Z]?`.

**PUT `/api/v1/catalogo/inversores/:id`** — mesmas validações do POST.

---

## 7. UI de Catálogo — Filtros no InverterCatalogDialog

O `InverterCatalogDialog` recebe uma barra de filtros colapsável (padrão: expandida):

```
Filtros rápidos:
[✓ AFCI]  [✓ RSD]  [Resfriamento ▾: Ativo]  [IP ▾: IP65+]  [Norma 515 ✓]
```

**Comportamento de pré-seleção contextual:**

Quando o projeto está em região tropical (`project.location.estado ∈ ESTADOS_TROPICAIS`) e o integrador abre o `InverterCatalogDialog` pela **primeira vez no projeto** (controlado por flag `inverterCatalogFirstOpen` em `uiStore` — não persiste):

- Filtros `coolingType: active` e `ipRating: IP65+` são pré-selecionados.
- Um banner informativo aparece no topo do catálogo: "📍 Filtros sugeridos para o clima de [cidade]. Ajuste conforme necessário." com botão "Limpar filtros".

**Filtros persistem na sessão** mas não no banco — são `uiStore` local, não `solarStore`.

---

## 8. UI — ModuleSpecsPanel (ModuleCanvasView)

O `ModuleSpecsPanel` (25% da ModuleCanvasView) exibe os novos campos na seção "Características Técnicas":

### Seção "Características Elétricas" (existente — sem mudança)
- Voc (V), Isc (A), Vmp (V), Imp (A), Pmax (Wp)

### Seção "Características Térmicas" (nova)
- NOCT: XX °C
- NMOT: XX °C *(exibido apenas se `nmot !== null`, com label "(mais preciso)")*
- Coef. Temp. Voc: −X,XX %/°C *(exibido como percentagem, convertido do decimal)*
- Coef. Temp. Pmax: −X,XX %/°C
- Geração de Célula: `M10 (182mm)` / `G12 (210mm)` / `Padrão (156mm)` / `M6 (166mm)`

### Seção "Tipo de Módulo" (nova)
- Bifacial: Sim / Não
- *(se Sim)* Fator de Bifacialidade: X,XX
- *(se Sim)* Ganho Bifacial Estimado: +X,X% *(calculado: `albedo × bifacialityFactor × 25%`, usando albedo do projeto)*

### Alerta inline de corrente (novo)

Quando o módulo selecionado possui `Imp > inversor_selecionado.imaxMppt` (inversor já selecionado no projeto), exibe banner âmbar no topo do `ModuleSpecsPanel`:

```
⚠ Corrente deste módulo (X,X A) excede o limite por MPPT
do inversor selecionado (X,X A). Avalie strings em paralelo
ou selecione outro inversor.
```

Quando não há inversor selecionado ainda, o alerta não aparece.

---

## 9. Critérios de Aceitação

### Banco de dados
- [ ] Migração `add_module_pv_fields` executa sem erro em banco com registros existentes
- [ ] Registros existentes de `ModuleModel` recebem defaults sem perda de dados
- [ ] Migração `add_inverter_normative_fields` executa sem erro
- [ ] Registros existentes de `InverterModel` recebem `vocMaxHardware = vocMaxInput`
- [ ] Projetos existentes carregam `clientData` com defaults de `manualTmin`, `manualTmax`, `albedo`, `moduleHeightM` sem erro

### API
- [ ] `GET /api/v1/catalogo/modulos` retorna `bifacial`, `tempCoeffVoc`, `noct` nos registros
- [ ] `GET /api/v1/catalogo/inversores` retorna `vocMaxHardware`, `afci`, `rsd`, `coolingType`
- [ ] Filtro `?afci=true` retorna apenas inversores com AFCI
- [ ] Filtro combinado `?coolingType=active&ipRating=IP65` funciona
- [ ] POST com `bifacial=true` e `bifacialityFactor=null` retorna erro 400
- [ ] POST de inversor com `vocMaxHardware < vocMaxInput` retorna erro 400

### Frontend
- [ ] `ModuleSpecsPanel` exibe seção "Características Térmicas" com NOCT e coeficientes
- [ ] Para módulo bifacial: seção "Tipo de Módulo" exibe fator e ganho estimado
- [ ] Alerta de corrente aparece no `ModuleSpecsPanel` quando `Imp > imaxMppt` do inversor
- [ ] `InverterCatalogDialog` exibe barra de filtros com AFCI, RSD, Resfriamento, IP
- [ ] Para projeto em PA (Pará): filtros ativos/IP65 pré-selecionados na primeira abertura
- [ ] `tsc --noEmit` → EXIT CODE 0

---

## 10. Fora do Escopo desta Spec

- Interface administrativa de cadastro de módulos e inversores (formulário de CRUD admin) — os campos existem mas a UI de admin não é especificada aqui.
- Importação em lote de catálogo via CSV — necessário futuramente, não é bloqueante.
- Cálculo de seção de cabos CC — requer campos de comprimento de string, ainda não modelados.

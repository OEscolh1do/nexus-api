# Plano de Refatoração: Engenharia de Dimensionamento Funcional (SaaS)

**Versão:** 2.0 — Revisada após Auditoria de 15 Perguntas (22/03/2026)

Este documento detalha as rotas de ação estritamente necessárias para transformar a interface atual (puramente visual) do módulo de Dimensionamento em uma **ferramenta técnica ativa** para uso por engenheiros e orçamentistas.

---

## 1. O Problema (Auditoria de 22/03/2026)
Após concluir a refatoração do Workspace e integrar o motor Leaflet de alta performance (ux-001 e gfx), o sistema alcançou um estado de "vitrine". Podemos acessar catálogos (módulos e inversores) e desenhá-los no mapa. 

Porém, uma peça central técnica foi omitida: **a capacidade de configurar e desenhar as Strings FV nos MPPTs dos inversores**. Sem a alocação de painéis nos canais do inversor, cálculos críticos — como dimensionamento de disjuntores, bitola de cabo e validação de limite de tensão (Voc) e corrente (Isc) — ficam cegos, inviabilizando a emissão da proposta final.

---

## 2. Escopo Principal: Destrancar a Configuração de Strings (Write-Mode)

Atualmente, o `StringInspector` (dentro de `RightInspector.tsx`) é um contêiner "somente-leitura".

### 2.1 Ação 1: Componentização do Configurador MPPT
- **Arquivo Alvo:** `src/modules/engineering/ui/panels/RightInspector.tsx`
- **Componente Reutilizado:** `PropRowEditable` (já existente e funcional no mesmo arquivo, linhas ~640-693).
- **Campos a Destrancar:**

| Campo | Tipo | Action Disparada |
|:---|:---|:---|
| Módulos/String | `number` | `updateMPPTConfig(inverterId, mpptId, { modulesPerString })` |
| Número de Strings | `number` | `updateMPPTConfig(inverterId, mpptId, { stringsCount })` |
| Azimute por MPPT | `number` (0-360°) | `updateMPPTConfig(inverterId, mpptId, { azimuth })` |
| Inclinação por MPPT | `number` (0-90°) | `updateMPPTConfig(inverterId, mpptId, { inclination })` |

- **Conexão de Estado:** Todos os campos devem realizar disparos da action `updateMPPTConfig(inverterId: string, mpptId: number, config: Partial<MPPTConfig>)` dentro de `useTechStore.ts` (já implementada, linha 70).
- **Efeito Imediato:** O usuário informará que o MPPT 1 suporta 12 módulos distribuidos em 2 strings, com azimute de 180° e inclinação de 10°, permitindo que a geometria elétrica nasça, habilitando cálculos.

> [!IMPORTANT]
> Os campos `azimuth` e `inclination` já existem como opcionais na interface `MPPTConfig` do `useTechStore.ts`. São essenciais para telhados de múltiplas águas onde cada MPPT pode apontar para uma direção diferente.

### 2.2 Ação 2: Validação Dinâmica de Limites (VoltageRangeChart + Corrente)
Ao permitir a edição das strings pela Ação 1, o gráfico `VoltageRangeChart` (que já existe no `CenterCanvas.tsx` como prop `entityId`) voltará à vida e necessitará renderizar as "faixas quentes" corretamente:

**Validações de Tensão (já implementadas no `VoltageRangeChart`):**
- `Voc Max (Módulos)` não pode ultrapassar a Tensão Máxima de Entrada do Inversor.
- `Vmp Range` deve ser inserido de forma harmônica na Faixa Útil de MPPT do inversor.

**Validação de Corrente (NOVA — precisa ser implementada):**
- A quantidade `Isc × Strings Paralelas` deve ser comparada com a `Corrente Máxima por MPPT` do inversor.
- **Opções de implementação:**
  - (A) Adicionar uma barra de corrente ao próprio `VoltageRangeChart`.
  - (B) Criar uma regra de corrente dentro do `HealthCheckWidget` no `TopRibbon.tsx`.

> [!WARNING]
> O `VoltageRangeChart` atual calcula **apenas tensão** via `calculateStringMetrics()`. A validação de corrente (`Isc × nStrings vs maxCurrentPerMPPT`) é inexistente e deve ser adicionada explicitamente.

---

## 3. Escopo Secundário: Consistência entre Layout Físico e Topologia Lógica

A topologia inserida no `Outliner` (Inversor 5kW → 1 MPPT com 10 Módulos) precisa conversar com a geometria do mapa construída no Passo GFX.

### 3.1 Ação 3: Alerta de Inconsistência de Módulos (TopRibbon Health Check)
Se o engenheiro adicionar:
- **Árvore BOS (Lógica):** 12 módulos configurados nas strings.
- **CenterCanvas (Física):** Apenas 10 módulos físicos posicionados dentro do polígono do mapa usando a ferramenta `PLACE_MODULE`.
- **Requisito:** O widget no `TopRibbon.tsx` (sinalizador com cor) deve acender como **Amarelo (Warning)** avisando a incompatibilidade ("Nº Módulos na String diverge dos Desenhados em Planta").

**Implementação concreta (verificada como inexistente pela auditoria):**

| Contagem | Fonte | Como Acessar |
|:---|:---|:---|
| **Física** (módulos no mapa) | `projectSlice` | `solarStore.project.placedModules.length` |
| **Lógica** (módulos nas strings) | `useTechStore` | `Σ(mppt.modulesPerString × mppt.stringsCount)` para cada inversor |

- **Onde inserir:** No componente `HealthCheckWidget` dentro de `TopRibbon.tsx`, adicionando uma terceira regra de validação ao lado das existentes (FDI e Voc).

> [!CAUTION]
> A auditoria confirmou que **não existe nenhuma infraestrutura** para esta comparação. Precisa ser construída do zero, cruzando dados de dois stores diferentes (`solarStore.project` e `useTechStore.inverters`).

---

## 4. Escopo Terciário: Bootstrap (Start Rápido)

Para não entregar um sistema "em branco" ao usuário (o que prejudica a fluidez da venda/dimensionamento), a engine precisa pré-carregar um arranjo mínimo que o engenheiro apenas manipula, em vez de exigir que ele invente tudo do zero sempre.

### 4.1 Ação 4: Injeção de Equipamentos Default
Ao carregar um novo projeto no Kurupira, o sistema deve despachar silenciosamente actions para injetar:
- **1 Módulo Default:** Referência `MODULE_CATALOG[0]` do arquivo `src/data/equipment/modules.ts`.
- **1 Inversor Default:** Referência `INVERTER_CATALOG[0]` do arquivo `src/modules/engineering/constants/inverters.ts`.

**Guardrails obrigatórios (para evitar duplicação):**

```typescript
// No WorkspaceLayout.tsx ou SolarDashboard.tsx (ponto de entrada do Workspace)
const hasBootstrapped = useRef(false);

useEffect(() => {
  const moduleCount = solarStore.getState().modules.ids.length;
  const inverterCount = useTechStore.getState().inverters.ids.length;
  
  if (moduleCount === 0 && inverterCount === 0 && !hasBootstrapped.current) {
    hasBootstrapped.current = true;
    // Dispatch: addModule(MODULE_CATALOG[0])
    // Dispatch: addInverter(INVERTER_CATALOG[0])
  }
}, []);
```

> [!IMPORTANT]
> Sem o `useRef` de controle, cada re-render do componente-pai dispararia a injeção novamente, duplicando equipamentos no store.

---

## 5. O Passo Adiante: O Caminho para P4 e P5

Garantindo a funcionalidade deste documento as premissas primordiais dos módulos subsequentes estarão satisfeitas:

*   **P4 - Módulo Elétrico / BOS (Balance Of System):** Tendo inversores, quantidade de strings montadas, a engine de orçamentos gerará a métrica quantitativa exata de Cabo Solar (-/+) de 4mm² ou 6mm² para a descida das prumadas e dimensionará quadros String Box nativamente.
*   **P5 - Módulo Financeiro:** Tendo o somatório dos CapEx Físicos vs Lógicos o sistema consegue desenhar o ROI em tempo real.

---

## 6. Modelo de Dados de Engenharia (Component Library)

Para suportar a **Arquitetura de Componentes Paramétricos**, a biblioteca de equipamentos deve transcender simples constantes. Ela deve seguir um esquema rigoroso que alimente tanto o motor de cálculo quanto a visualização 3D.

### 6.1 Padronização de Schemas (JSON-Schema)

Os catálogos em `src/data/equipment/` e `src/modules/engineering/constants/` devem ser migrados para um formato tipado (Zod/TypeScript) que inclua:

**Módulo Fotovoltaico:**
- **`electrical`**: Pmp, Voc, Vmp, Isc, Imp, tempCoeffVoc (essenciais para validação de string).
- **`physical`**: Dimensões (W/H/D), peso e tipo de moldura (essenciais para o Canvas e 3D).
- **`meta`**: Referência ao arquivo `.glb` e mapeamento de texturas para o motor WebGL.

**Inversores:**
- **`mppts`**: Array de objetos definindo `maxVoltage`, `mpptRange` (min/max), `maxCurrent` e `stringsAllowed`.
- **`efficiency`**: Curva de eficiência ponderada (Euro/CEC).

### 6.2 Integração com EXT_structural_metadata
Os IDs dos equipamentos no `useTechStore` devem corresponder aos `FeatureIDs` embutidos nos modelos glTF. Isso garante que ao clicar em um inversor no 3D, o sistema saiba exatamente quais limites de MPPT aplicar no Inspector.

---

📋 **Prioridade de Execução:** 
1. Destrancar o `StringInspector` no `RightInspector.tsx` (Seção 2.1).
2. Estruturar os Novos Schemas de Equipamentos (Seção 6).
3. Adicionar o Bootstrap Inicial (Seção 4).
4. Implementar a validação de corrente (Seção 2.2).
5. Cruzamento Físico vs Lógico no Health Check (Seção 3.1).

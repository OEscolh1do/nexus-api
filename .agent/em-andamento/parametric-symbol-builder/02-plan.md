# Spec 02: O Como — Plano de Implementação (Parametric Symbol Builder)

## 1. Modificações de Banco de Dados e API (Backend Kurupira)
**Alvo principal:** `kurupira/backend/prisma/schema.prisma` (escrita real)
**Não é o `sumauma/backend/prisma/schema.prisma`** — esse schema é de gestão de tenants/usuários (Tenant, User, Role) e não contém `InverterCatalog`.
**Não é o `schema-kurupira.prisma`** — esse é client read-only do Sumaúma.
- Adicionar o campo `symbolConfig Json?` ao modelo `InverterCatalog` em `kurupira/backend/prisma/schema.prisma`.
- Rodar a migração no contexto do Kurupira backend (`npx prisma migrate dev --name add_symbol_config_to_inverters`).
- As rotas do BFF Sumaúma (`sumauma/backend/src/routes/catalog.js`) são **proxies M2M** que delegam via `kurupiraClient.post/patch` ao Kurupira backend (`/internal/catalog/inverters`). A validação Zod estrita do `ParametricSymbolConfig` deve ocorrer no **Kurupira backend** (nas rotas `/internal/catalog/`), não no Sumaúma BFF, que apenas repassa o body.

## 2. Interface de Configuração (Frontend Sumaúma)
**Alvos:**
- Criar a tipagem em um escopo compartilhado ou no próprio frontend do Sumaúma. As chaves do `ports` são **template literals tipadas** para eliminar ambiguidade no Sugiyama Worker:
```typescript
// IC-04 corrigido: chaves tipadas, campo `polarity` e `mpptIndex` obrigatórios
type PortKey = `mppt_${number}_${'pos' | 'neg'}` | 'ac_out';

interface ParametricPort {
  side: 'top' | 'right' | 'bottom' | 'left';
  offset: number;        // 0–1 ao longo do lado
  label: string;
  polarity: 'positive' | 'negative' | 'ac-out';
  mpptIndex?: number;    // undefined apenas para 'ac_out'
}

interface ParametricSymbolConfig {
  type: 'parametric-block';
  dimensions: { width: number; height: number };
  ports: Record<PortKey, ParametricPort>;
}
```
- Criar o componente `<ParametricSymbolBuilder />` dentro do formulário de edição do Inversor.
- O componente será uma representação SVG controlada via `useState` local (não Zustand/Jotai — estado de formulário puro) onde o gestor pode:
  - Clicar em "Adicionar Porta MPPT", o que insere um par de pinos (`mppt_N_pos` / `mppt_N_neg`) em `side: 'left'`, recalculando automaticamente os `offset`s dos pinos existentes para distribuição uniforme no eixo Y.
  - Editar o `label` interno de cada pino (ex: "MPPT 1").
  - O pino CA (`ac_out`) é sempre fixo em `side: 'right'`, `offset: 0.5`, gerado automaticamente.

## 3. Motor de Renderização Unifilar (Frontend Kurupira)
**Alvos:**
- A store que armazena dados de inversões em produção é `useTechStore` (não `useSolarStore`). O tipo `InverterState.snapshot` é onde os metadados do catálogo são mantidos em tempo de execução. Adicionar `symbolConfig?: ParametricSymbolConfig | null` ao tipo `InverterState.snapshot` e popular via `addInverter()` a partir dos dados do catálogo (que chegam via `useCatalogStore`, onde `unifilarSymbolRef` já é mapeado em linhas 41 e 92).
- Atualizar o `InverterSpecsSchema` em `kurupira/frontend/src/core/schemas/equipment.schemas.ts` para adicionar `symbolConfig` (campo opcional tipado) e consolidar `mpptCount` (ver IC-03 em `03-tasks.md`).
- **CRIAR** (não atualizar — o arquivo não existe) o módulo de registry em:
  `kurupira/frontend/src/modules/engineering/ui/panels/canvas-views/electrical/symbols/registry.ts`
- O registry lê `symbolConfig` de `useTechStore(s => s.inverters.entities[inverterId]?.snapshot?.symbolConfig)` e usa `unifilarSymbolRef` como chave de fallback (campo já existente em `useCatalogStore`):
```typescript
// IC-01 + IC-05 corrigidos: fallback via unifilarSymbolRef existente
export function getSymbol(
  inverterId: string,
  catalog: InverterSpecs[],
  activePortKey?: PortKey
) {
  const inv = catalog.find(i => i.id === inverterId);

  if (inv?.symbolConfig?.type === 'parametric-block') {
    return (props: SVGProps) => (
      <DynamicParametricBlock
        config={inv.symbolConfig}
        activePortKey={activePortKey}
        {...props}
      />
    );
  }

  // Fallback: usa a chave estática já existente no banco
  const symbolKey = inv?.unifilarSymbolRef ?? 'inverter-default';
  return STATIC_SYMBOLS[symbolKey] ?? STATIC_SYMBOLS['inverter-default'];
}
```
- Construir o componente `<DynamicParametricBlock />` que renderiza um retângulo via SVG nativo e desenha os terminais mapeando `side` e `offset` do JSON para as dimensões locais (`width`/`height`). O prop `activePortKey` destaca o terminal que o Sugiyama está roteando no momento.

## 4. Requisitos Híbridos (Dike Validator)
- **Regra de Roteamento (IC-02 corrigido):** O Sugiyama Worker roteia `StringEdge`s entre módulos FV (`ArrangementNode`) e o ponto de descida do inversor (`DropPoint`). `ArrangementNode.portPositive/Negative` são exclusivos de módulos — **inversores não são nós de canvas**.
  - A ligação entre string e canal físico é via `MPPTConfig.mpptIndex`.
  - O `DynamicParametricBlock` recebe `activePortKey` construído como:
    ```typescript
    const portKey: PortKey = `mppt_${mpptConfig.mpptIndex}_pos`;
    ```
  - O Sugiyama deve validar em runtime que a `portKey` existe no `symbolConfig.ports` antes de traçar a aresta. Se a porta não existir (foi deletada no Sumaúma), deve lançar o código de validação `PORT_NOT_FOUND` em vez de travar silenciosamente.

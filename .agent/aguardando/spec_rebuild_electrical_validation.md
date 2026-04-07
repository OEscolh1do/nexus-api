# Especificação: Reconstrução da Lógica "Risco Crítico de Queima"

## 1. Problema de Negócio

A validação elétrica que protege o inversor contra sobretensão (Voc) e sobrecorrente (Isc) possui falhas silenciosas que podem gerar **falsos-ok** (esconder riscos reais) ou **falsos-alarmes**. Um engenheiro recebendo "tudo verde" quando o sistema está em risco é inaceitável.

## 2. Bugs Identificados (5)

### BUG-1: Fallback de `maxCurrentPerMPPT` divide corrente total pelo nº de MPPTs
**Arquivo:** `useCatalogStore.ts:71`
```ts
maxCurrentPerMPPT: defaultMaxI / count,  // ex: 24A / 2 = 12A
```
**Problema:** Se o datasheet diz `maxInputCurrent: 24A` e o inversor tem 2 MPPTs, a store assume 12A por MPPT. Mas muitos inversores têm 12.5A **por MPPT** (total 25A). A divisão é uma heurística que pode subestimar ou superestimar o limite real.
**Fix:** Tratar o fallback como `ed.maxInputCurrent` direto (sem dividir), ou melhor, exigir que o seed-catalog forneça o `mppts[]` explícito (que já faz).

### BUG-2: catalogId não encontrado → validação silenciosamente ignorada
**Arquivo:** `useElectricalValidation.ts:91-92`
```ts
const catalogSpec = catalogInverters.find(c => c.id === inv.catalogId);
if (!catalogSpec) return [];  // ← SKIP SILENCIOSO
```
**Problema:** Se o catálogo não carregou, ou o `catalogId` é inválido, o MPPT inteiro é ignorado — sem erro, sem warning. O sistema mostra "tudo ok" quando na verdade não validou nada.
**Fix:** Retornar um MPPTInput com fallbacks defensivos + emitir log warning.

### BUG-3: Inverter lookup no LeftOutliner usa dupla chave ambígua
**Arquivo:** `LeftOutliner.tsx:303`
```ts
const techInv = techInverters.find(ti => ti.catalogId === inv.id || ti.id === inv.id);
```
**Problema:** `inv.id` (do SolarStore) pode colidir com `ti.catalogId` (do CatalogStore), casando o inversor errado.
**Fix:** Refinar a heurística: priorizar match por `ti.id === inv.id` (que é o ID de projeto, não o catalog).

### BUG-4: Mensagem de erro no MPPT só mostra o PRIMEIRO tipo
**Arquivo:** `LeftOutliner.tsx:316`
```ts
const errorMessage = validationEntry?.messages?.[0]?.includes('Voc') 
  ? 'Sobretensão!' : 'Isc Alta!';
```
**Problema:** Se o MPPT viola Voc E Isc simultaneamente, apenas uma mensagem é exibida. Pior: o fallback é `'Isc Alta!'` mesmo se o erro real for Vmp fora da faixa MPPT.
**Fix:** Montar a mensagem a partir das mensagens reais, cobrindo todos os tipos.

### BUG-5: Fallback de specs elétricos são excessivamente permissivos
**Arquivo:** `useElectricalValidation.ts:111-114`
```ts
maxInputVoltage: specMppt?.maxInputVoltage ?? 800,  // ← muito alto
maxCurrentPerMPPT: specMppt?.maxCurrentPerMPPT ?? 30,  // ← muito alto
```
**Problema:** Se os specs do MPPT não vierem do catálogo, os fallbacks (800V, 30A) são tão altos que nenhum erro será detectado — o sistema fica "falso-verde".
**Fix:** Usar valores conservadores (500V, 15A) ou marcar como `warning` quando fallback é usado.

## 3. Critérios de Aceitação
1. Se o catálogo não forneceu specs de um MPPT, o badge mostra `⚠ Specs Desconhecidos` (warning, não ok).
2. Se Voc E Isc violam simultaneamente, o badge do MPPT mostra ambas as violações.
3. O lookup de inversor no LeftOutliner é determinístico (match único por `ti.id === inv.id`).
4. Fallbacks de corrente e tensão são conservadores e geram warning.

## 4. Fora de Escopo
- Correção térmica da Isc (descartada anteriormente).
- Adição de novos campos ao schema do catálogo.
- Refatoração da UI do LeftOutliner (apenas a lógica de dados).

---
*Status: Especificação — Aguardando aprovação.*

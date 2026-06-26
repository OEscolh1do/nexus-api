# Catálogo de Símbolos SVG — Kurupira Unifilar

Cada arquivo `.svg` neste diretório é o **arquivo canônico** de um símbolo IEC usado no `UnifilarSchematicCanvas`. Abra qualquer arquivo em **Inkscape**, **GodSVG** ou qualquer navegador para visualizar e editar.

## Arquitetura

Os símbolos usam o padrão SVG `<symbol>` + `<use>` com **CSS Custom Properties** para tematização:

```svg
<!-- 1. Definição canônica (este catálogo) -->
<symbol id="sym-pv" viewBox="0 0 62 46">
  <rect style="stroke: var(--s, #475569); stroke-width: var(--sw, 0.9);"/>
  ...
</symbol>

<!-- 2. Instância no diagrama (UnifilarSchematicCanvas.tsx) -->
<use href="#sym-pv" x="68" y="40" width="62" height="46"
     style="--s: #34d399; --sw: 1.4; --rad: #34d399; --rad-op: 1;"/>
```

As CSS Custom Properties **atravessam o Shadow DOM** do `<use>`, permitindo que cada instância tenha cor de MPPT, opacidade e espessura independentes sem duplicar geometria.

---

## Símbolos disponíveis

| Arquivo | ID | ViewBox | Norma | CSS vars |
|---|---|---|---|---|
| `sym-pv-module.svg` | `#sym-pv` | `0 0 62 46` | IEC 60617-11 | `--s` `--sw` `--f` `--rad` `--rad-op` |
| `sym-fuse-gpv.svg` | `#sym-fuse` | `0 0 22 13` | IEC 60617 / NBR 16690 §5.3 | `--s` `--sw` `--el` |
| `sym-dps.svg` | `#sym-dps` | `0 0 14 24` | IEC 61643-11 | `--s` `--s-bg` |
| `sym-dc-switch.svg` | `#sym-dc-sw` | `0 0 16 16` | IEC 60617-7 / NBR 16690 §5.4 | `--s` |
| `sym-ac-breaker.svg` | `#sym-ac-breaker` | `0 0 18 18` | IEC 60617-7 / NBR 5410 §6.3 | `--s` `--sw` `--f` |
| `sym-meter-bidirecional.svg` | `#sym-meter` | `0 0 22 22` | NT.020.EQTL Rev.05 §4.2 | `--s` `--sw` `--f` |
| `sym-earth.svg` | `#sym-earth` | `0 0 16 12` | IEC 60617-2 / NBR 5410 §6.1 | `--s` |

---

## Símbolos dinâmicos (não catalogados como `<symbol>`)

Os seguintes componentes são **demasiado dinâmicos** para serem definidos como símbolos estáticos — eles continuam como componentes React no `UnifilarSchematicCanvas.tsx`:

| Componente | Motivo |
|---|---|
| `InverterSchematicBlock` | N° de portas MPPT varia; texto do modelo é dinâmico |
| `BusBarSymbol` | Altura proporcional ao número de strings |
| `GridSymbol` | Estrutura muda entre monofásico (1 senoide) e trifásico (3 senoides) |

---

## Como editar um símbolo

### Opção A — GodSVG (recomendado para edição de código)
1. Abra o `.svg` no GodSVG (web ou desktop)
2. Edite geometria visualmente e veja o código SVG atualizar em tempo real
3. Copie o bloco `<symbol>...</symbol>` de volta para `SymbolCatalogDefs` em `UnifilarSchematicCanvas.tsx`

### Opção B — Inkscape
1. Abra o `.svg` no Inkscape
2. Edite com as ferramentas de nó e forma
3. Exporte como "SVG simples" (não SVG do Inkscape)
4. Extraia a geometria do `<symbol>` e atualize o componente

### Opção C — Edição direta no código
Localize `const SymbolCatalogDefs` em `UnifilarSchematicCanvas.tsx` e edite o JSX diretamente. Após editar, rode:
```bash
npx tsc --noEmit   # verifica tipos
```

---

## CSS Custom Properties — referência rápida

| Variável | Tipo | Usado em | Significado |
|---|---|---|---|
| `--s` | `color` | todos | stroke principal (borda, linhas) |
| `--sw` | `number` | todos exceto earth | stroke-width |
| `--f` | `color` | pv, ac-breaker, meter | fill (fundo do símbolo) |
| `--rad` | `color` | pv | cor das setas de radiação |
| `--rad-op` | `0–1` | pv | opacidade das setas (0.75 repouso, 1 hover) |
| `--el` | `color` | fuse | cor do elemento fusível interno (com alpha) |
| `--s-bg` | `color` | dps | fill do triângulo varistor (translúcido em hover) |

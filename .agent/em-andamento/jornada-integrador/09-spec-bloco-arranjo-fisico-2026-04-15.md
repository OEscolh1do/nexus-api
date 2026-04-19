# Spec — Bloco de Arranjo Físico no Compositor

**Tipo:** Refatoração Técnica / Feature Nova
**Módulo:** `engineering` — `LeftOutliner`, `projectSlice`, `systemCompositionSlice`, `uiStore`
**Prioridade:** P1 — Crítico
**Responsável (impl.):** `the-builder`
**Revisor (aceitação):** `engenheiro-eletricista-pv` + `design-lead`
**Data de criação:** 2026-04-14
**Versão:** 4.0 — Refatorado (Crivo Engenheiro PV)
**Supersede:** `09-spec-bloco-arranjo-fisico-2026-04-15.md` v3.7

---

## 1. Visão Geral (Engenharia PV)

O Bloco de Arranjo (Indigo) não é apenas um contêiner geométrico. **Um arranjo fotovoltaico é a união mecânica e elétrica de múltiplos módulos solares (painéis) em série ou paralelo, formando o gerador principal do sistema.** Ele converte a luz solar em corrente contínua, conectando-se ao inversor para atender à demanda de energia.

### Princípios Rigorosos do Arranjo
1. **Conexões (Elétrica):** Módulos em série (strings) aumentam a **tensão** ($V_{oc}$ soma-se), enquanto módulos em paralelo aumentam a **corrente** ($I_{sc}$ soma-se). O arranjo deve ser dimensionado dentro da **tensão máxima (Voc_max corrigido)** permitida pelo inversor.
2. **Normatização:** Baseia-se na **ABNT NBR 16690**, que padroniza os requisitos de segurança, proteção (DPS e Fusíveis em paralelos ≥3) e aterramento estrutural.
3. **Eficiência e Mismatch:** As sub-áreas do arranjo (por MPPT) devem utilizar componentes estritamente compatíveis (mesmo fabricante/modelo e mesmas angulações - azimute/tilt) para maximizar o rendimento e evitar perdas drásticas de *mismatch*.
4. **BOS Restrito:** Estruturas de suporte (trilhos, ganchos), conectores MC4 e cabos DC fazem parte do bloco de arranjo. O inversor e eventuais quadros AC formam um bloco elétrico à parte.

O Bloco de Arranjo no `LeftOutliner` é responsável tanto pela coerência físico-lógica (FDI e M²) quanto pela passagem dos atributos mestre ao validador elétrico das strings.

---

## 2. Solução: Bloco de Arranjo Físico (Indigo)

### 2.1 Posição na cadeia (Lego)

```
[⚡ Consumo] → [🗺 Arranjo Físico (Área/Telhado)] → [☀️ Módulos (Séries/Paralelos)] → [🔲 Inversor (Validação Voc/Isc)]
```
*(Nota: a ordem topológica reflete fluxos CAD reais, base-telhado -> módulos -> inversores).*

### 2.2 Sincronia de Foco e Camadas
Diferente da v3.7, o foco não muda apenas "ferramentas", ele isola **Camadas de Interação (Layers)** no MapCore.

Ao clicar no bloco:
1. `uiStore.setFocusedBlock('arrangement')`
2. `MapCore` ativa a **Layer 1: Obstacles & Roof** para edição. (Módulos e rede elétrica entram em opacidade 50%).
3. Ativa as ferramentas de desenho e medição no HUD.
4. O bloco recebe um glow `rgba(99,102,241,0.4)` (Indigo).

### 2.3 Chips do Bloco (Metadados de Engenharia)

- **Físico vs Lógico:** `physicalCount` vs `logicalCount`.
- **FDI e Área:** M² de superfície física útil e densidade.
- **Validação Eletromecânica:** Indicador se as premissas de NBR 16690 e Mismatch estão preservadas (verificado pelo validador subjacente).

### 2.4 Placeholder

Se nenhuma área for desenhada:
- Botão "Abrir mapa para desenhar o Arranjo" → Foca no bloco (`arrangement`) e invoca a ferramenta (`POLYGON`) na **Layer 1**.

---

## 3. Especificação Técnica

### 3.1 Seletor `selectArrangementMetrics`
Derivado no `systemCompositionSlice` com `shoelaceAreaM2`. Passa parâmetros ao validador elétrico downstream.

### 3.2 O Arranjo como Objeto de Dados
O objeto do arranjo não contém módulos soltos. Ele contém **Strings**, e as Strings contém Módulos.
```typescript
export type SurfaceType = 'ceramic' | 'metallic' | 'fibrocement' | 'slab' | 'ground' | 'carport';

interface PhysicalArrangement {
  id: string;
  polygon: Coordinate[];
  areaM2: number;
  orientation: { azimuth: number, tilt: number }; // Requisito crítico para simulação
  surfaceType: SurfaceType; // Define a estrutura mecânica BOS e o coeficiente térmico
  // Referência reversa (Módulos associados à área respeitam esta orientação)
}
```

### 3.3 Seleção Físico-Mecânica (UI)
Ao visualizar um `PhysicalArrangement` selecionado na *Layer de Arranjo Físico*:
- O *HUD de Ferramentas* exibe o Dropdown/Segmented Control para escolha do **Tipo de Superfície** (`SurfaceType`).
- A escolha é renderizada visualmente no LeftOutliner (sub-chip do bloco indicando a estrutura).

---

## 4. Requisitos de Normatização (NBR 16690 e Termodinâmica)

- Deve ser garantida a persistência do `azimuth` e `tilt` para cálculo do Vmp e Isc por MPPT.
- O bloco dispara o check `SystemHealthCheck` se módulos em diferentes orientações forem ligados à mesma entrada MPPT.
- **Obrigatório:** A persistência correta do `surfaceType`, que dita as subpistas de fluxo de ar para inferir o coeficiente térmico global (Uv) e perdas termodinâmicas no cálculo final de geração.

---

## 5. Critérios de Aceitação

- [ ] Clicar no Bloco Arranjo isola a **Camada 1 (Roof/Obstacles)** no MapCore e oculta ou reduz a opacidade das demais.
- [ ] O objeto salva `azimuth` e `tilt` para garantir viés correto nos cálculos de mismatch.
- [ ] O usuário consegue selecionar o Tipo de Superfície (`surfaceType`) visualmente no HUD de desenho e visualizá-lo como metadado no LeftOutliner.
- [ ] Chips calculam área, FDI e consistência (`△N` delta de módulos: físico vs lógico).
- [ ] Sem áreas desenhadas, o botão ativa a ferramenta `POLYGON`.

---

## Referências

- `spec-sincronia-bloco-canvas-2026-04-15.md`
- **Revisão Técnica Eng. Vítor Ramos** — ABNT NBR 16690:2019

# Spec — Revisão da Jornada do Integrador: Engenharia PV Aplicada

**Tipo:** Revisão Técnica de Domínio + Novas Funcionalidades
**Módulo:** Transversal — `ElectricalCanvasView`, `ModuleCanvasView`, `LeftOutliner`, `catalogos`, `validacao`, `simulacao`
**Prioridade:** P0 — Corrige lacunas técnicas fundamentais que afetam a validade dos projetos gerados
**Responsável (impl.):** `the-builder`
**Revisor (aceitação):** `engenheiro-eletricista-pv`
**Data de criação:** 2026-04-25
**Versão:** 1.0
**Origem:** Seis documentos de referência técnica PV (arranjos, compatibilidade, tensão, dimensionamento CC/CA, critérios de inversores, inversores tropicais)

---

## 1. Contexto e Objetivo

Esta spec documenta as lacunas técnicas identificadas na Jornada do Integrador v3.7 ao confrontar as especificações existentes com o corpus técnico de engenharia fotovoltaica fornecido. Os documentos de referência cobrem:

- Topologias de arranjos série/paralelo e suas implicações elétricas
- Compatibilidade elétrica módulos↔inversores (correntes, tensões, MPPT)
- Impacto térmico e coeficientes de temperatura no dimensionamento de tensão
- Dimensionamento da relação CC/CA (FDI) e fenômeno de clipping
- Critérios de seleção de inversores (AFCI, RSD, MLPE, multi-MPPT, IP)
- Seleção de inversores para regiões tropicais (derating, resfriamento, salinidade)

O objetivo é especificar as adições, correções e novos comportamentos que o Kurupira deve incorporar para que o dimensionamento produzido seja tecnicamente defensável perante o `engenheiro-eletricista-pv`.

---

## 2. Inventário de Lacunas por Área

### 2.1 ElectricalCanvasView — Lacunas Críticas

**L1 — Ausência de cálculo de Voc corrigido por temperatura mínima histórica**

A spec atual menciona `Voc_corrigido` mas não descreve como `Tmin` é obtida nem o que acontece quando não existe dado histórico disponível. O cálculo `Voc_corrigido = Voc_STC × (1 + tempCoeff × (Tmin − 25)) × N_série` usa `Tmin` do `solarStore.project.settings`, mas o campo `manualTmin` é um fallback não detalhado. Os documentos técnicos demonstram que ignorar este cálculo é a principal causa de destruição de inversores por sobretensão.

**L2 — Ausência de cálculo de Vmp mínimo (temperatura máxima)**

A spec verifica Voc máximo (frio) mas não verifica se Vmp cai abaixo do limite inferior do MPPT em dias de calor extremo. Para regiões tropicais, este é o cenário que causa desligamento do inversor durante horas de pico de geração. A temperatura máxima da célula deve ser estimada via `Tcell = Tamb_max + (NOCT - 20) × (G / 800)`.

**L3 — Validação de Isc do arranjo vs. limite de hardware do inversor**

O chip `Isc ✅` existe, mas não está especificado que ele valida `Isc_arranjo < Isc_max_hardware_inversor`. A distinção entre `Imax_MPPT` (limite operacional) e `Isc_max_hardware` (limite físico de destruição) é ausente na spec. São dois parâmetros distintos no catálogo de inversores e duas checagens distintas na interface.

**L4 — Ausência de alerta para módulos bifaciais**

O sistema não possui nenhum campo ou lógica para ganho bifacial. Para módulos com `bifacial: true` no catálogo, o sistema deve adicionar o ganho à corrente efetiva antes de validar contra os limites do inversor. O ganho típico é 15–25% sobre Isc e Imp da face frontal.

**L5 — FDI não está associado à taxa CC/CA (ILR)**

O chip `FDI` exibe um único número mas não esclarece se trata-se de `Potência_CC / Potência_CA` ou o inverso. Os documentos técnicos demonstram que a convenção brasileira chama este valor de FDI (Fator de Dimensionamento do Inversor) e deve estar entre 1,10 e 1,50 para projetos residenciais/comerciais típicos, com faixas semaforizadas distintas das atuais.

**L6 — Ausência de validação de mismatch entre strings do mesmo MPPT**

O sistema permite conectar strings de quantidades diferentes ao mesmo MPPT sem aviso. O desvio máximo de tensão entre strings paralelas no mesmo MPPT não deve exceder 5% (conforme NBR 16690). Strings com orientações diferentes (azimute/tilt distintos) conectadas ao mesmo MPPT devem gerar alerta de mismatch.

### 2.2 ModuleCanvasView — Lacunas

**L7 — Catálogo de módulos não contém campos de geração atual**

O catálogo deve expor `bifacial: boolean`, `NOCT` e `nmot` para permitir os cálculos de temperatura de célula. Esses campos devem estar no modelo de dados `ModuleModel` e visíveis no `ModuleSpecsPanel`.

**L8 — Ausência de alerta para módulos M10/G12 vs. inversores legados**

Módulos com células M10 (182mm) e G12 (210mm) geram correntes Imp acima de 13A e 15A respectivamente. Quando o módulo selecionado possui `Imp > Imax_MPPT_inversor`, o sistema deve exibir um alerta preemptivo no bloco Módulos, antes mesmo de o integrador configurar as strings.

### 2.3 Bloco Inversor — Lacunas

**L9 — Catálogo de inversores não contém campos normativos obrigatórios**

Os documentos técnicos identificam campos ausentes no modelo de dados do inversor: `afci: boolean`, `rsd: boolean`, `ipRating: string` (ex: "IP65"), `coolingType: 'passive' | 'active'`, `Voc_max_hardware: number`, `Isc_max_hardware: number` (distintos de `Vmax_MPPT` e `Imax_MPPT`). Esses campos são necessários para validações automáticas e para geração de documentação técnica.

**L10 — Ausência de alerta para inversores sem AFCI/RSD em novos projetos**

A Portaria Inmetro 515/2023 exige AFCI para inversores com tensão > 120V e corrente > 20A. A ABNT NBR 17193:2025 exige RSD em instalações prediais. O sistema deve alertar quando o inversor selecionado não atende esses requisitos, especialmente para projetos criados após 2025.

**L11 — Ausência de validação de derating térmico para regiões quentes**

Para instalações em regiões com temperatura ambiente máxima superior a 35°C (o que inclui toda a região Norte e boa parte do Nordeste brasileiro), inversores com resfriamento passivo e potência > 10kW devem receber um alerta de risco de derating térmico. O sistema possui a localização do projeto (Site) mas não usa essa informação na validação elétrica.

### 2.4 Simulação — Lacunas

**L12 — PR (Performance Ratio) fixo ou simplificado**

A spec menciona `lossConfig` e PR decomposto, mas não especifica que o PR deve incorporar `perdas_termicas` calculadas a partir da temperatura média local e do coeficiente de temperatura do módulo selecionado. Um PR fixo de 0,80 é impreciso para regiões tropicais, onde perdas térmicas típicas são de 8–12%.

---

## 3. Especificação das Novas Funcionalidades

### 3.1 Modelo de Dados — Extensões Necessárias

#### 3.1.1 ModuleModel (catálogo)

Campos a adicionar:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `bifacial` | `boolean` | Indica se o módulo captura luz pela face traseira |
| `bifacialityFactor` | `number \| null` | Fator de bifacialidade (0,65–0,75 típico); `null` se `bifacial: false` |
| `noct` | `number` | Temperatura nominal da célula em operação (°C), ex: 45 |
| `nmot` | `number \| null` | Temperatura nominal sob carga (NMOT); opcional, mais preciso que NOCT |
| `cellSizeClass` | `'standard' \| 'M6' \| 'M10' \| 'G12'` | Geração da célula; determina faixas de corrente esperadas |
| `tempCoeffVoc` | `number` | Coeficiente de temperatura de Voc (%/°C), valor negativo, ex: -0,28 |
| `tempCoeffPmax` | `number` | Coeficiente de temperatura de Pmax (%/°C), negativo, ex: -0,34 |

**Pré-requisito de banco de dados:** Migração da tabela `ModuleModel` adicionando as colunas acima. As colunas `bifacial` e `noct` são `NOT NULL` com defaults respectivos de `false` e `45`. As demais são nullable para compatibilidade com registros existentes.

**Pré-requisito de API:** Endpoint `GET /api/catalogo/modulos` deve retornar os novos campos. Endpoint `POST /api/catalogo/modulos` e `PUT /api/catalogo/modulos/:id` devem aceitar e validar os novos campos.

#### 3.1.2 InverterModel (catálogo)

Campos a adicionar:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `Voc_max_hardware` | `number` | Tensão máxima absoluta de entrada CC (V); limite de destruição |
| `Isc_max_hardware` | `number` | Corrente máxima de curto-circuito suportada por MPPT (A) |
| `afci` | `boolean` | Possui dispositivo de proteção contra arco elétrico |
| `rsd` | `boolean` | Suporta desligamento rápido (Rapid Shutdown) |
| `ipRating` | `string` | Grau de proteção, ex: "IP65", "IP66" |
| `coolingType` | `'passive' \| 'active'` | Tipo de resfriamento |
| `maxAmbientTemp` | `number` | Temperatura ambiente máxima sem derating (°C), ex: 45 |
| `deratingStartTemp` | `number` | Temperatura onde começa o derating (°C), ex: 40 |
| `portaria515Compliant` | `boolean` | Conformidade com Portaria Inmetro 515/2023 |
| `nbr17193Compliant` | `boolean` | Conformidade com NBR 17193:2025 (RSD) |

**Pré-requisito de banco de dados:** Migração da tabela `InverterModel` adicionando as colunas acima. `Voc_max_hardware`, `Isc_max_hardware` são `NOT NULL`. As colunas de conformidade normativa são `boolean NOT NULL DEFAULT false` para manter registros legados sem forçar revalidação.

**Pré-requisito de API:** Endpoints de catálogo de inversores devem aceitar e retornar os novos campos. A listagem deve suportar filtros por `afci`, `rsd` e `coolingType`.

#### 3.1.3 MPPTConfig (por entrada do inversor)

Campos a adicionar:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `azimuthDeg` | `number` | Azimute dos módulos desta entrada (0–360°) |
| `tiltDeg` | `number` | Inclinação dos módulos desta entrada (0–90°) |

Esses campos já existem em `PhysicalArrangement`. A adição em `MPPTConfig` permite validar mismatch entre strings conectadas à mesma entrada.

**Pré-requisito de banco de dados:** Migração da tabela `MPPTConfig` ou equivalente no schema Prisma, adicionando `azimuthDeg` e `tiltDeg` como `Float?` nullable.

#### 3.1.4 ProjectSettings — extensão para cálculos térmicos

Campos a adicionar:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `manualTmin` | `number \| null` | Temperatura mínima histórica manual (°C); sobrescreve dado da API |
| `manualTmax` | `number \| null` | Temperatura máxima do ambiente local (°C); para validação de derating |
| `albedo` | `number` | Reflectividade do solo (0–1); default 0,20; usado para cálculo bifacial |
| `moduleHeightM` | `number` | Altura dos módulos do solo (m); afeta ganho bifacial; default 0,5 |

**Pré-requisito de banco de dados:** Migração da tabela `ProjectSettings` ou JSON do projeto. Se `ProjectSettings` é armazenado como JSON no campo `settings` do projeto, nenhuma migração de coluna é necessária — apenas atualização do schema de validação.

---

### 3.2 ElectricalCanvasView — Validações Revisadas

#### 3.2.1 Cálculo de Voc máximo (frio) — especificação completa

O sistema calcula `Voc_corrigido_frio` para cada MPPT:

```
Tmin = project.settings.manualTmin ?? climateData.Tmin_historico ?? 10

Para cada string no MPPT:
  Voc_por_modulo_frio = modulo.Voc_STC × (1 + modulo.tempCoeffVoc/100 × (Tmin − 25))
  Voc_string = Voc_por_modulo_frio × N_modulos_serie

Voc_MPPT = max(Voc_string para todas as strings do MPPT)
```

**Validação:** `Voc_MPPT < inversor.Voc_max_hardware`
- Verde: `Voc_MPPT < 90% × Voc_max_hardware`
- Âmbar: `90% ≤ Voc_MPPT < 95% × Voc_max_hardware`
- Vermelho: `Voc_MPPT ≥ 95% × Voc_max_hardware`

**Interface:** O chip `Voc` existente exibe apenas o valor calculado. A barra de fundo do chip deve usar gradiente colorido proporcional à faixa utilizada. Ao clicar no chip, um tooltip expande mostrando `Tmin usada`, `Voc_STC por módulo`, `N módulos em série` e `Margem de segurança restante (V)`.

#### 3.2.2 Cálculo de Vmp mínimo (calor) — funcionalidade nova

O sistema calcula `Vmp_corrigido_calor` para cada MPPT:

```
Tamb_max = project.settings.manualTmax ?? climateData.Tamb_max ?? 35
NOCT = modulo.noct  (ou 45°C como default)
G_referencia = 800  // W/m², condição de NOCT

Tcell_max = Tamb_max + (NOCT - 20) × (1000 / G_referencia)
  // 1000 W/m² é a irradiância de projeto no pior caso de calor

Vmp_por_modulo_calor = modulo.Vmp_STC × (1 + modulo.tempCoeffVoc/100 × (Tcell_max − 25))
Vmp_string_calor = Vmp_por_modulo_calor × N_modulos_serie
```

**Validação:** `Vmp_string_calor > inversor.Vmin_MPPT`
- Verde: `Vmp_string_calor > 110% × Vmin_MPPT`
- Âmbar: `105% ≤ Vmp_string_calor ≤ 110% × Vmin_MPPT`
- Vermelho: `Vmp_string_calor < 105% × Vmin_MPPT`

**Interface:** Novo chip no painel de validação: `Vmp(calor) XXX V`. Posicionado abaixo do chip `Voc`. A ausência de dados climáticos máximos deve exibir o chip em cinza com texto "Informar Tmax local" e link para `ProjectSettings`.

#### 3.2.3 Validação de Isc — dois níveis distintos

**Nível 1 — Imax_MPPT (limite operacional):**
Validação existente. O inversor limita a corrente ao MPPT antes de destruir componentes. Exceder este valor causa clipping de corrente (perda de geração, não destruição).

**Nível 2 — Isc_max_hardware (limite de destruição):**
```
Isc_arranjo_por_MPPT = soma de Isc de todas as strings paralelas no MPPT
  (incluindo ganho bifacial se modulo.bifacial = true)

Isc_efetivo = Isc_arranjo × (1 + ganho_bifacial)
  onde ganho_bifacial = albedo × modulo.bifacialityFactor × 0,25
  // fórmula simplificada; default conservador de 15% se sem dados de albedo
```

**Validação:**
- `Isc_efetivo > inversor.Isc_max_hardware` → erro bloqueante (vermelho sólido): "Risco de destruição do inversor. Reduzir strings paralelas ou selecionar inversor com maior suportabilidade de Isc."
- `Isc_efetivo > inversor.Imax_MPPT` mas `< Isc_max_hardware` → aviso (âmbar): "Clipping de corrente esperado. O inversor limitará a entrada — considere avaliar o oversizing."

**Interface:** O chip `Isc` existente passa a exibir dois ícones: um para o nível operacional e um para o nível de hardware, separados por `/`. Exemplo: `Isc 14,2A [✅ op / ✅ hw]` ou `Isc 18,5A [⚠ op / 🔴 hw]`.

#### 3.2.4 Validação de mismatch entre strings — funcionalidade nova

Para cada MPPT com mais de uma string paralela, o sistema verifica:

```
Para cada par de strings (A, B) no mesmo MPPT:
  delta_Voc = |Voc_string_A - Voc_string_B| / Voc_string_A

  delta_orientacao = true se azimuthDeg ou tiltDeg diferir entre as strings
```

**Validações:**
- `delta_Voc > 5%` → erro: "Desbalanceamento de tensão entre strings excede 5% (NBR 16690). Uniformize o número de módulos por string."
- `delta_orientacao = true` → aviso: "Strings com orientações diferentes no mesmo MPPT causam perdas por mismatch. Use MPPTs independentes por orientação."

**Interface:** Os erros de mismatch aparecem na lista de erros clicáveis existente. Ao clicar, o diagrama de strings destaca as strings em conflito com borda pontilhada amarela/vermelha.

#### 3.2.5 Chip FDI — semáforo revisado

O FDI (Fator de Dimensionamento do Inversor) é `Potência_CC_instalada / Potência_CA_inversor`. As faixas de semáforo passam a ser:

| Faixa FDI | Status | Cor | Mensagem tooltip |
|-----------|--------|-----|-----------------|
| < 1,00 | Aviso | Âmbar | "Inversor superdimensionado. Análise de custo-benefício recomendada." |
| 1,00 – 1,10 | OK Conservador | Verde-escuro | "Dimensionamento conservador. Boa para climas de alta irradiância." |
| 1,10 – 1,35 | Ótimo | Verde | "Faixa ideal para a maioria das instalações brasileiras." |
| 1,35 – 1,50 | Oversizing | Verde-âmbar | "Oversizing moderado. Clipping esperado nos picos. Avaliar perdas." |
| > 1,50 | Excesso | Vermelho | "Oversizing elevado. Clipping significativo e possível risco à garantia do inversor." |

A spec anterior tinha limites 0,80–1,35 (verde) e > 1,50 (vermelho). Os novos limites são mais granulares e tecnicamente embasados.

---

### 3.3 Alertas Normativos no Bloco Inversor

Quando o inversor selecionado não possui `afci: true`, o bloco Inversor exibe um chip de aviso adicional abaixo dos chips de validação elétrica:

```
[⚠ Sem AFCI]
```

Ao passar o mouse (ou tocar), tooltip: "Este inversor não possui proteção contra arco elétrico (AFCI). A Portaria Inmetro 515/2023 exige AFCI para sistemas com tensão > 120V e Isc > 20A. Verifique a conformidade antes de submeter o projeto à distribuidora."

Analogamente para `rsd: false`:

```
[⚠ Sem RSD]
```

Tooltip: "Este inversor não suporta Desligamento Rápido (RSD). A ABNT NBR 17193:2025 exige RSD em instalações prediais. Sistemas instalados após jan/2025 em edificações podem ter dificuldades na obtenção de alvarás e seguros."

**Esses chips são informativos, não bloqueantes.** O integrador pode prosseguir, mas os chips aparecem também na ProposalCanvasView como itens de atenção na seção de conformidade normativa.

---

### 3.4 Alerta de Derating Térmico

Quando `projeto.location.estado` pertence à região Norte ou Nordeste (lista fechada de estados: AM, PA, RR, AP, AC, RO, TO, MA, PI, CE, RN, PB, PE, AL, SE, BA) **e** `inversor.coolingType === 'passive'` **e** `inversor.potenciaNominalCA > 10000` (> 10kW):

O sistema exibe um alerta no bloco Inversor:

```
[⚠ Derating Térmico]
```

Tooltip: "Inversores com resfriamento passivo acima de 10 kW em climas tropicais frequentemente sofrem derating automático durante horas de pico solar, reduzindo a geração estimada. Considere um inversor com resfriamento ativo (IP65 mínimo) para esta região."

**Pré-requisito de backend:** O campo `project.location.estado` deve estar disponível no store. Se ainda não existir como campo estruturado separado (pode estar embutido no endereço), deve ser extraído ou armazenado como campo próprio na tabela de projetos.

---

### 3.5 ModuleCanvasView — Painel de Especificações Ampliado

O `ModuleSpecsPanel` (painel 25% da view) deve exibir os novos campos do módulo selecionado:

**Seção "Características Elétricas" (existente):** Voc, Isc, Vmp, Imp, Pmax

**Seção "Características Térmicas" (nova):**
- `NOCT`: XX °C
- `Coef. Temp. Voc`: −X,XX %/°C
- `Coef. Temp. Pmax`: −X,XX %/°C
- `Geração de Célula`: M10 / G12 / Padrão

**Seção "Tipo de Módulo" (nova):**
- `Bifacial`: Sim / Não
- Se Sim: `Fator de Bifacialidade`: X,XX
- `Estimativa de Ganho Bifacial`: +X% (calculado com albedo do projeto)

**Alerta inline no painel:** Se `modulo.Imp > inversor_selecionado.Imax_MPPT`, exibe banner âmbar no topo do `ModuleSpecsPanel`: "⚠ Corrente deste módulo (X,X A) excede o limite por MPPT do inversor selecionado (X,X A). Avalie strings paralelas ou troque o inversor."

---

### 3.6 Cálculo de PR Dinâmico na Simulação

O Performance Ratio deixa de ser fixo em 0,80 e passa a ser calculado decomposto:

```
PR = (1 - perda_termica) × (1 - perda_sujeira) × (1 - perda_cabos) × (1 - perda_inversao) × (1 - perda_mismatch)
```

Onde:

| Componente | Fonte | Valor Default |
|------------|-------|---------------|
| `perda_termica` | Calculada: `tempCoeffPmax × (Tcell_media_anual - 25)` | 8% para regiões tropicais |
| `perda_sujeira` | Campo editável em `lossConfig` | 3% |
| `perda_cabos` | Campo editável em `lossConfig` | 2% |
| `perda_inversao` | `1 - eficiencia_inversor` (do catálogo) | 3% |
| `perda_mismatch` | Fixo, elevado se delta_orientacao = true | 1% (sem mismatch) / 5% (com mismatch) |

**Interface na SimulationCanvasView:** Um painel colapsável "Composição do PR" exibe as parcelas individuais. O PR resultante é destacado com seu valor numérico e comparado ao PR default anterior (0,80) com indicador de variação: "PR calculado: 0,74 (−7,5% vs. estimativa conservadora padrão)".

**Pré-requisito de backend:** `lossConfig` já existe. Adicionar campos `sujeira` e `cabos` se ainda não existirem. Adicionar campo `eficienciaInversor` que é preenchido automaticamente do catálogo ao selecionar o inversor, mas editável manualmente.

---

### 3.7 Filtros no Catálogo de Inversores

O `InverterCatalogDialog` deve oferecer filtros adicionais:

| Filtro | Tipo | Opções |
|--------|------|--------|
| AFCI | Toggle | Somente com AFCI |
| RSD | Toggle | Somente com RSD |
| Resfriamento | Select | Passivo / Ativo / Ambos |
| IP Rating | Select | IP65 / IP66 / IP67+ |
| Norma 515/2023 | Toggle | Apenas conformes |

Esses filtros persistem na sessão (não precisam ser salvos no banco). Quando o projeto está em estado de localização tropical (regiões Norte/Nordeste) e o integrador abre o catálogo de inversores pela primeira vez, os filtros `Resfriamento: Ativo` e `IP Rating: IP65+` são pré-selecionados como sugestão, com um banner informativo: "Filtros pré-aplicados para o clima de [cidade]. Ajuste conforme necessário."

---

## 4. Impacto na Jornada — Mapa de Mudanças por Ato

### Ato 3 — Módulos FV

**Adição:** Após selecionar o módulo, o sistema verifica imediatamente `modulo.Imp` vs. `inversor.Imax_MPPT` (se inversor já estiver selecionado). Se incompatível, exibe aviso no bloco Módulos antes mesmo de o integrador ir para a view elétrica.

**Adição:** O conector `Módulos → Arranjo` passa a exibir também a geração de célula do módulo: `9× DMEGC 630W [M10]`.

### Ato 4 — Arranjo Físico

**Adição:** Quando `PhysicalArrangement` com orientações diferentes são criadas, o sistema verifica se o integrador as conectou ao mesmo MPPT. Se sim, alerta de mismatch é disparado antecipadamente no bloco Arranjo, antes de chegar à view elétrica.

### Ato 5 — Validação Elétrica (ElectricalCanvasView)

**Mudança:** O chip `Voc` passa a exibir `Voc(frio) XXX V` com semáforo de 4 estados.

**Adição:** Novo chip `Vmp(calor) XXX V` aparece no painel de validação.

**Mudança:** O chip `Isc` passa a ter dois níveis (operacional e hardware) com indicação explícita.

**Adição:** Chips informativos `[⚠ Sem AFCI]` e `[⚠ Sem RSD]` quando aplicável.

**Adição:** Alerta de derating térmico para projetos em regiões tropicais com inversores passivos de alta potência.

**Mudança:** Semáforo do FDI revisado com 5 faixas.

**Adição:** Validação de mismatch entre strings do mesmo MPPT.

### Ato 6 — Simulação

**Mudança:** PR calculado dinamicamente. O campo `kWh/ano` e os derivados (economia, payback) são recalculados com o PR novo, podendo diferir do PR default de 0,80.

---

## 5. Critérios de Aceitação

### ElectricalCanvasView

- [ ] Voc corrigido pela temperatura mínima histórica é calculado e exibido corretamente. Para Tmin = 10°C, módulo com Voc_STC = 49V e tempCoeff = −0,28%/°C, em string de 12 módulos: Voc_frio = 49 × (1 + (−0,0028) × (10−25)) × 12 = 49 × 1,042 × 12 = 612,7V.
- [ ] Vmp corrigido pela temperatura máxima é calculado e o chip correspondente é exibido.
- [ ] Chip Isc exibe dois níveis (operacional e hardware) de forma legível.
- [ ] Para módulo bifacial com fator 0,70 e albedo 0,20: ganho = 0,20 × 0,70 × 0,25 = 3,5%. Isc_efetivo = Isc_frontal × 1,035.
- [ ] Mismatch entre strings com orientações diferentes no mesmo MPPT gera aviso.
- [ ] FDI entre 1,10 e 1,35 exibe verde. FDI > 1,50 exibe vermelho.
- [ ] Chips AFCI e RSD aparecem apenas quando o inversor selecionado não possui os recursos.
- [ ] Alerta de derating aparece para inversor passivo > 10kW em estados do Norte/Nordeste.

### ModuleCanvasView

- [ ] Painel de specs exibe NOCT, coeficientes de temperatura e geração de célula.
- [ ] Para módulo bifacial, painel exibe fator de bifacialidade e estimativa de ganho.
- [ ] Alerta inline aparece quando Imp do módulo excede Imax_MPPT do inversor.

### Catálogo de Inversores

- [ ] Filtros AFCI, RSD, Resfriamento e IP Rating funcionam.
- [ ] Para projetos em regiões tropicais, filtros são pré-aplicados na primeira abertura.

### Simulação

- [ ] PR é calculado a partir dos componentes de perda, não fixo em 0,80.
- [ ] Painel "Composição do PR" exibe parcelas individuais e permite edição manual.

### Banco de Dados

- [ ] Migração de `ModuleModel` adiciona `bifacial`, `bifacialityFactor`, `noct`, `nmot`, `cellSizeClass`, `tempCoeffVoc`, `tempCoeffPmax` sem quebrar registros existentes.
- [ ] Migração de `InverterModel` adiciona `Voc_max_hardware`, `Isc_max_hardware`, `afci`, `rsd`, `ipRating`, `coolingType`, `maxAmbientTemp`, `deratingStartTemp`, `portaria515Compliant`, `nbr17193Compliant` sem quebrar registros existentes.
- [ ] Silent migration: projetos existentes abrem corretamente com os novos campos tendo valores default onde aplicável.

---

## 6. Fora do Escopo desta Spec

- Implementação de rastreamento solar (trackers) — relevante para o cálculo de clipping, mas não há produto relacionado no Kurupira.
- Dimensionamento de String Box / Combiner Box — elemento de BOS ainda não modelado.
- Cálculo de seção de cabos CC — deriva de correntes e comprimentos, requer UI específica não especificada aqui.
- Módulos com microinversores ou otimizadores (MLPE) — arquitetura elétrica distinta que requer modelagem própria.
- Integração com banco de dados de temperatura histórica em tempo real — a obtenção de `Tmin` e `Tamb_max` via NASA/PVGIS é escopo da spec de dados climáticos existente; esta spec apenas especifica o consumo desses dados.

---

## 7. Referências Técnicas Incorporadas

Os documentos de referência fundamentam cada decisão técnica desta spec:

| Conceito | Fonte principal |
|----------|----------------|
| Voc corrigido por temperatura | "Tensão de Módulos Fotovoltaicos e Inversores" |
| Vmp mínimo no calor | "Compatibilidade Módulos e Inversores" §MPPT |
| Isc_max_hardware vs. Imax_MPPT | "Compatibilidade Módulos e Inversores" §Corrente |
| Ganho bifacial na corrente | "Escolha de Inversores" §Bifacialidade |
| FDI / ILR e faixas ótimas | "Dimensionamento de Potência CC/CA" §FDI |
| AFCI obrigatório (Portaria 515/2023) | "Escolha de Inversores" §Normativa |
| RSD / NBR 17193:2025 | "Escolha de Inversores" §RSD |
| Derating térmico em regiões tropicais | "Seleção de Inversores para Regiões Tropicais" §Derating |
| Mismatch entre strings do mesmo MPPT | "Arranjo de Módulos e Escolha do Inversor" §Multi-MPPT |
| PR decomposto por perdas térmicas | "Dimensionamento de Potência CC/CA" §Perdas |
| Célula M10/G12 e correntes elevadas | "Escolha de Inversores" §Evolução de Wafers |
| IP rating para ambientes úmidos/salinos | "Seleção de Inversores para Regiões Tropicais" §IP |

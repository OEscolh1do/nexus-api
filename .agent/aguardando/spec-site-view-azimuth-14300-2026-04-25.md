# Spec: Refatoração de Premissas de Engenharia na View Projeto (SiteCanvasView)
**Tipo:** Refatoração Técnica e UI B2B  
**Skill responsável pela implementação:** the-builder, frontend-engineer, engineering-ui  
**Revisor de aceitação:** engenheiro-eletricista-pv  
**Prioridade:** P1  
**Origem:** Revisão direta (Workflow `/proposta-refatoracao`)

---

## Problema
A view "Projeto" (`SiteCanvasView.tsx`) carece de parâmetros fundamentais para o dimensionamento fotovoltaico real no Brasil e falhas em usabilidade de localização:
1. **Física/Geometria:** O sistema captura a `roofInclination`, mas ignora o **Azimute** (orientação do telhado). No Brasil, telhados voltados para o Sul podem perder até 30% de geração. O PR sugerido é hardcoded (`0.82` ou `0.80` baseado no Estado), ignorando as perdas reais por orientação e inclinação.
2. **Regulação (Lei 14.300):** A tarifa é tratada como um valor único (`tariffRate`), ignorando a separação entre TE (Tarifa de Energia), TUSD (Tarifa de Uso do Sistema de Distribuição) e a componente TUSD Fio B, essenciais para o cálculo de viabilidade econômica (payback).
3. **Geolocalização Reversa:** Atualmente o sistema faz geocoding (Endereço -> Coordenadas), mas não realiza *Reverse Geocoding* (Coordenadas -> Endereço). Quando o usuário clica no mapa para ajustar o pino, os campos de endereço, cidade e UF deveriam ser preenchidos automaticamente.

## Solução Técnica

### Especificação: Correção de Orientação e PR
#### Entrada
| Variável | Tipo | Fonte | Unidade |
|---------|------|-------|---------|
| Inclinação | float | User Input (já existe) | ° |
| Azimute | float/enum | User Input (Novo) | ° (0=Norte, 90=Leste, 180=Sul, 270=Oeste) |
| HSP Anual | float | Weather Data | kWh/m²/dia |

#### Fórmula do Fator de Correção Geométrico (Simplificada para a UI de Premissas)
Adicionar um seletor visual de orientação (Norte, Nordeste, Leste, Sudeste, Sul, Sudoeste, Oeste, Noroeste) que mapeia para ângulos azimutais.
O `prSugerido` não deve ser apenas baseado em estado geográfico, mas sim ajustado pelo Fator de Orientação. 

### Especificação: Tarifa Regulada (Lei 14.300)
#### Entrada
| Variável | Tipo | Fonte | Unidade |
|---------|------|-------|---------|
| TE | float | User Input | R$/kWh |
| TUSD | float | User Input | R$/kWh |
| TUSD Fio B | float | User Input | R$/kWh |

#### Saída
A `tariffRate` total é a soma de `TE + TUSD`, mas o sistema precisa armazenar o `Fio B` no `clientData` para a projeção financeira (aba Projeção).

### Especificação: Geocoding Reverso
#### Gatilho
- Quando o usuário insere coordenadas manualmente nos campos de Latitude/Longitude.
- Quando o usuário clica no mapa para mover o pino (`handleMapClick`).

#### Ação
Chamar a API de Geocoding do Google Maps (`https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lng}&key={VITE_GOOGLE_MAPS_API_KEY}`) e extrair os componentes de endereço (`street` de route, `number` de street_number, `neighborhood` de sublocality, `city` de administrative_area_level_2, `state` de administrative_area_level_1, `zipCode` de postal_code).

## Arquivos Afetados
### Modificar
- `[MODIFY] kurupira/frontend/src/core/state/solarStore.ts` (ou interface ClientData se externa)
  - Adicionar `azimuth` (number)
  - Adicionar `tariffTE`, `tariffTUSD`, `tariffFioB` (opcional).
- `[MODIFY] kurupira/frontend/src/modules/engineering/ui/panels/canvas-views/SiteCanvasView.tsx`
  - **Seção C: Rede Elétrica:** Substituir o input simples "Tarifa" por um popover ou inputs menores de TE e TUSD (somando o total), mais campo Fio B.
  - **Seção D: Premissas Estruturais:** Adicionar campo "Orientação (Azimute)" ao lado da Inclinação.
  - **Painel Direito (Mapa):** Adicionar chamadas de Reverse Geocoding no `handleMapClick` para preencher automaticamente endereço. Adicionar inputs textuais modificáveis para Lat e Lng no HUD de Telemetria inferior esquerdo, permitindo ao usuário colar coordenadas precisas.
  - **Insights:** Atualizar a lógica de `prSugerido` para considerar a orientação (penalidade severa para face Sul).

## Critérios de Aceitação
- [ ] A view Projeto permite inserir Orientação (N, NE, L, SE, S, SO, O, NO) ou ângulo azimutal.
- [ ] A tarifa global é derivada de TE e TUSD, com input para Fio B suportado.
- [ ] A UI mantém a densidade e legibilidade técnica B2B (padrão `/engineering-ui`), usando progressive disclosure para campos tarifários avançados se necessário.
- [ ] Nenhum estado existente do banco de dados quebra (fallback para valor único de tarifa existente).

## Referências Normativas
- Lei 14.300/2022 (Faturamento da Geração Distribuída e TUSD Fio B)
- Diretrizes de Geometria Solar (Impacto de Azimute e Tilt na geração)

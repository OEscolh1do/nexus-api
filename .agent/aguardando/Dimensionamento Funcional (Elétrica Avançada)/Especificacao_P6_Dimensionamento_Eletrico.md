# Especificação Técnica: Fase P6 - Dimensionamento Funcional (Elétrica Avançada)

## 1. Visão Geral do Épico
Com componentes e catálogo estabelecidos (P4), a Fase P6 é encarregada de injetar as **regras de negócio pesadas** de interconectividade. Em energia solar, módulos não voam isolados; eles formam "Strings" ligados aos rastreadores "MPPTs" de um Inversor real. A HUD deve reagir permitindo essa configuração elétrica rigorosa e checando infrações de limites instantaneamente.

---

## 2. Objetivos Principais
- Permitir a atribuição de blocos de `ModuleSpecs` (Placas) em `Strings` lógicos.
- Conectar essas `Strings` a portas de MPPT de inversores (`InverterSpecs`).
- Dar capacidade funcional total ao `SolarCalculator` (transformando os parâmetros da simulação num motor autônomo ao vivo).

---

## 3. Requisitos Arquiteturais
1. **Modulação Off-Main-Thread:**
   Cálculos complexos (como matriz temporal ao vivo de todas as quedas de tensão, sombreamentos, perdas elétricas) devem ser movidos para **Web Workers** para não congelar a interação fluida da Single Page Application.
2. **Padrão Transiente:**
   Como dimensionamos voltagens ao vivo de acordo com strings, esses updates transientes serão gerenciados pelo Zustand mas refletidos diretamente no WebGL (`VoltageRangeChart`) via mutações por `.current` e não subscrições ao DOM de React.

---

## 4. Etapas de Implementação (Sub-fases P6)

### P6-1: MPPT Stringing Interface (Drag & Drop UI)
- Atualizar o `LeftOutliner` e `StringConfigurator` para que grupos de módulos (do canvas ou do próprio Outliner) possam ser fisicamente atrelados a um MPPT do objeto Inverter.
- Refinar a validação de Schema Zod para strings (`maxModules`, `currentA`, `voltageV`).

### P6-2: Motor de Limites Térmicos
- Construir a regra matemática: `VocMax` baseado na temperatura mínima local.
- Alertar via `SystemHealthCheck` (na TopRibbon construída em P3) imediatamente se a string ligada ao inversor extrapolar a tensão de entrada do inversor catalogado na Fase P4.

### P6-3: Migração para Web Worker
- Criar biblioteca `worker.ts` encapsulando as instâncias engessadas atuais de `SolarCalculator` e `generationSimulation.ts`.
- Estabelecer a comunicação de envio assíncrona para que a HUD espere a "resolução do frame de cálculo" (Loader) sem travar.

---

## 5. Critérios de Aceite
- [ ] Interface visual que suporte interligar módulos num MPPT sem erros.
- [ ] O Semáforo `HealthCheck` da TopRibbon fica vermelho instantaneamente se associarmos painéis demais a um único MPPT.
- [ ] Toda a complexidade rola fluidamente via Web Worker sem framedrops no DOM.

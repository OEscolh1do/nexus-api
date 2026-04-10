---
description: Gera uma proposta estruturada de refatoração do Kurupira a partir de um gap específico identificado pelo Engenheiro Eletricista PV — do problema técnico ao spec de implementação
---

# Workflow `/proposta-refatoracao` — Proposta Técnica de Refatoração

Transforma um gap técnico identificado (pelo `engenharia-review` ou direto pelo usuário) em uma proposta de refatoração completa: motivação, impacto, spec de implementação e plano de migração.

---

## Quando Usar

- Após `/engenharia-review` identificar um P0 ou P1 para desenvolver
- Quando o engenheiro quer especificar uma nova feature de cálculo com rigor
- Quando há discordância técnica sobre uma metodologia implementada e é necessário formalizar a alternativa correta

---

## Input Esperado

O usuário deve informar:
```
Gap a abordar: [nome/descrição do gap]
Contexto: [opcional — link para parecer técnico ou descrição do problema]
Escopo desejado: [apenas spec? ou spec + plano de implementação completo?]
```

---

## Passo 1 — Diagnóstico do Gap

**Com a lente do `engenheiro-eletricista-pv`**, responder:

1. **Qual é o erro técnico real?**
   - O que o sistema faz hoje vs. o que deveria fazer segundo a norma/prática
   - Qual norma ou metodologia é violada

2. **Qual é o impacto real no projeto do cliente?**
   - Resulta em superdimensionamento ou subdimensionamento?
   - Pode levar à rejeição na homologação pela distribuidora?
   - Representa risco elétrico (ex: sobretensão no inversor)?
   - É apenas imprecisão de estimativa (ex: geração 3% acima da real)?

3. **Existe precedente na prática do mercado?**
   - Como outros softwares de dimensionamento (SolarEdge, SMA Sunny Design, PVsyst) abordam isso?
   - Qual é o consenso entre engenheiros projetistas?

---

## Passo 2 — Definição da Solução Técnica

Especificar a solução **com exatidão matemática** antes de qualquer código:

### Template de Especificação Matemática

```markdown
## Especificação: [Nome do Cálculo]

### Entrada
| Variável | Tipo | Fonte | Unidade |
|---------|------|-------|---------|
| Voc_stc | float | ModuleCatalogItem.voc | V |
| TempCoeff_Voc | float | ModuleCatalogItem.tempCoeffVoc | %/°C |
| Tmin_historica | float | banco de dados climáticos por cidade | °C |

### Fórmula
```
[fórmula exata em notação matemática clara]
```

### Saída
| Variável | Tipo | Unidade | Significado |
|---------|------|---------|------------|
| Voc_max | float | V | Tensão de circuito aberto no pior caso frio |

### Validação
- Voc_max × N_série ≤ Vinput_max_inversor × 0.95
- Se violado → emitir alerta de nível CRITICAL no SystemHealthCheck

### Casos de Borda
- TempCoeff_Voc não informado no catálogo → usar -0.30 %/°C como default conservador
- Tmin histórica não disponível para a cidade → usar -5°C (conservador para todo o Brasil)
```

---

## Passo 3 — Mapeamento de Impacto no Código

**Sem escrever código ainda**, mapear o que será afetado:

```markdown
## Arquivos Afetados

### Modificar
- `[MODIFY] kurupira/frontend/src/modules/engineering/utils/electricalMath.ts`
  - Função `calculateStringMetrics()` — adicionar correção de Voc por Tmin
  - Função `validateSystemStrings()` — atualizar threshold com Voc_max corrigido

- `[MODIFY] kurupira/frontend/src/modules/engineering/constants/thresholds.ts`
  - Remover Tmin hardcoded (-5°C) → passar como parâmetro dinâmico por cidade

### Novo
- `[NEW] kurupira/frontend/src/data/climate/minTemperatureByCity.ts`
  - Mapa estático de temperatura mínima histórica para as ~200 cidades mais relevantes do Brasil
  - Fonte: INMET / CRESESB historical data

### Consequências em Cascata
- `useElectricalValidation.ts` — consumidor de electricalMath, precisará passar Tmin
- `useAutoSizing.ts` — seleção de inversor deve usar Voc_max corrigido
- `simulation.worker.ts` — verificar se usa temperatura para validação de string (provavelmente não, mas confirmar)
```

---

## Passo 4 — Avaliação de Risco de Migração

| Risco | Probabilidade | Mitigação |
|------|-------------|----------|
| Quebra de projetos salvos (mudança de resultado de cálculo) | Alta | Versionar o resultado de dimensionamento no `TechnicalDesign.designData` — salvar snapshot dos parâmetros usados |
| Regressão em testes unitários `electricalMath.test.ts` | Alta | Atualizar fixtures com valores esperados corretos antes de modificar a função |
| Projetos com equipamentos sem TempCoeff no catálogo | Média | Implementar fallback com valor default conservador + aviso no UI |

---

## Passo 5 — Geração do Artefato Final

Produzir o arquivo `spec-[slug]-YYYY-MM-DD.md` para colocar em `.agent/aguardando/`:

```markdown
# Spec: [Título]
**Tipo:** Refatoração Técnica  
**Skill responsável pela implementação:** the-builder  
**Revisor de aceitação:** engenheiro-eletricista-pv  
**Prioridade:** P0/P1/P2  
**Origem:** parecer-tecnico-[data].md / Revisão direta

---

## Problema
[Diagnóstico do Passo 1 — conciso, 3–5 linhas]

## Solução Técnica
[Especificação matemática completa do Passo 2]

## Arquivos Afetados
[Lista do Passo 3]

## Critérios de Aceitação
- [ ] `electricalMath.test.ts` — todos os testes passando com fixtures atualizadas
- [ ] Projetos existentes não quebram (resultado dentro de ±2% do anterior, ou alerta de revisão exibido)
- [ ] `tsc --noEmit` → EXIT CODE 0
- [ ] Eng. Vítor (skill) valida resultado com caso de teste real: módulo DMEGC 550W + inversor PHB 15kW + cidade Belém-PA

## Referências Normativas
- NBR 16690:2019 §[seção]
- [outras normas relevantes]
```

---

## ⛔ Anti-Padrões a Evitar

- ❌ Pular o Passo 2 (especificação matemática) e ir direto para código — isso gera implementações incorretas que passam nos testes mas erram no campo
- ❌ Classificar como "refatoração de código" algo que é uma mudança de metodologia de engenharia — são coisas diferentes
- ❌ Propor solução que dependa de dados que o sistema não tem acesso (ex: dados horários de temperatura sem fonte definida)
- ❌ Criar specs genéricos demais ("melhorar o cálculo de perdas") — o spec deve ser específico o suficiente para um desenvolvedor implementar sem precisar pesquisar a norma

---
description: Auditoria técnica do Kurupira sob o olhar do Engenheiro Eletricista PV — avalia conformidade normativa, gaps de metodologia e qualidade do motor de cálculo
---

# Workflow `/engenharia-review` — Auditoria Técnica PV

Executa uma revisão sistemática do Kurupira como um engenheiro eletricista experiente faria antes de adotar o software para uso em projetos reais. O resultado é um **Parecer Técnico** com gaps priorizados e propostas acionáveis.

---

## Quando Usar

- Antes de planejar um novo ciclo de desenvolvimento de features de engenharia
- Quando há dúvidas sobre se o sistema está gerando resultados tecnicamente corretos
- Quando se quer identificar o que impede o Kurupira de ser usado por engenheiros em projetos reais
- Após grandes refatorações no motor de cálculo ou módulo elétrico

---

## Pré-requisitos

Antes de executar este workflow, tenha em mente:
- Skill `engenheiro-eletricista-pv` ativada (esta é a lente de análise)
- Contexto do projeto carregado (`.agent/context.md`)
- Acesso aos arquivos de cálculo: `electricalMath.ts`, `SolarCalculator.ts`, `lossConfig.ts`, `generationSimulation.ts`

---

## Passo 1 — Leitura de Contexto (Research)

Antes de emitir qualquer opinião, **ler os arquivos reais**:

```
Arquivos obrigatórios a ler:
- kurupira/frontend/src/modules/engineering/utils/electricalMath.ts
- kurupira/frontend/src/core/domain/SolarCalculator.ts
- kurupira/frontend/src/modules/engineering/utils/generationSimulation.ts
- kurupira/frontend/src/modules/engineering/constants/lossConfig.ts
- kurupira/frontend/src/modules/engineering/constants/thresholds.ts
- kurupira/frontend/src/modules/engineering/hooks/useElectricalValidation.ts
- kurupira/frontend/src/modules/engineering/hooks/useAutoSizing.ts
- kurupira/frontend/src/core/workers/simulation.worker.ts
```

Adicionalmente, se o eixo cobrir BOS/Proteções:
```
- kurupira/frontend/src/modules/electrical/ (todos os arquivos)
```

---

## Passo 2 — Execução da Revisão por Eixo

Aplicar os 5 eixos da skill `engenheiro-eletricista-pv` sequencialmente:

### Eixo 1 — Dimensionamento de Strings
Verificar implementação de:
- [ ] Correção de Voc pela temperatura mínima histórica do local
- [ ] Correção de Vmp pela temperatura máxima de célula
- [ ] Validação de Isc por MPPT com fator 1.25 (NBR 16690)
- [ ] Cálculo e validação do oversize ratio DC/AC
- [ ] Limites por número de MPPTs vs. número de strings
- A temperatura mínima histórica é de um banco de dados real por cidade ou hardcoded?

### Eixo 2 — Modelo de Geração e Perdas
Verificar:
- [ ] Fonte de HSP: CRESESB estático ou API dinâmica com dados horários?
- [ ] O PR é fixo ou decomposto em fatores individuais configuráveis?
- [ ] A perda por temperatura usa Tcell médio mensal ou valor fixo?
- [ ] Há tratamento para módulos bifaciais?
- [ ] A irradiação é transposta do plano horizontal para o plano inclinado?

### Eixo 3 — BOS e Proteções Elétricas
Verificar:
- [ ] Dimensionamento de cabos DC com capacidade de condução ≥ 1.25 × Isc
- [ ] Queda de tensão DC calculada e comparada ao limite configurado
- [ ] Critério de obrigatoriedade de fusíveis de string (N ≥ 3 paralelas)
- [ ] Critério de seleção de DPS por classe e nível Up
- [ ] Dimensionamento do disjuntor AC de interligação

### Eixo 4 — Conformidade REN 1000/2021
Verificar:
- [ ] O sistema classifica corretamente micro vs. minigeração?
- [ ] O memorial descritivo gerado pelo `documentation/` inclui todos os campos exigidos?
- [ ] O diagrama unifilar é gerado automaticamente a partir dos dados do dimensionamento?
- [ ] Existe verificação de conformidade com limites de potência por ponto de conexão?

### Eixo 5 — Qualidade do Auto-Sizing
Verificar:
- [ ] Critério de seleção de inversor (apenas custo? ou também oversize ratio ideal?)
- [ ] Após dimensionamento automático, o validador elétrico é chamado?
- [ ] O sistema avisa o usuário quando o resultado automático exige ajuste manual?
- [ ] Considera restrições de área de telhado na seleção de módulos?

### Eixo 6 — Experiência de Uso pelo Engenheiro

Este eixo exige **usar o software como usuário** (ou inspecionar os componentes de UI com olhar de engenheiro). Avaliar:

**Confiança nos números:**
- [ ] Os cálculos são transparentes? O usuário consegue ver a fórmula/premissas usadas?
- [ ] As premissas implícitas (PR fixo, Tmin hardcoded, fator de perdas default) estão visíveis?
- [ ] O sistema distingue "resultado calculado" de "estimativa"?

**Fluxo de trabalho:**
- [ ] A navegação segue a ordem natural: consumo → local → kWp → equipamentos → elétrica → BOS → documentação?
- [ ] O usuário consegue ver os dados de etapas anteriores enquanto trabalha na etapa atual?
- [ ] Há pontos no fluxo onde o usuário fica sem saber o que fazer a seguir?

**Feedback de validação:**
- [ ] Os alertas do SystemHealthCheck dizem o que está errado, por quê, e o que fazer?
- [ ] Há hierarquia clara entre alertas críticos, avisos e informativos?
- [ ] Os alertas aparecem no momento certo (não cedo demais, não tarde demais)?

**Terminologia:**
- [ ] Os rótulos usam terminologia de engenharia ou de leigo?
- [ ] Há algum termo impreciso que pode levar o engenheiro a interpretar errado um resultado?
- [ ] Unidades estão sempre explícitas nos campos e resultados (V, A, kWp, kWh/mês)?

**O que já ajuda:**
- [ ] Identificar 3 a 5 comportamentos/elementos que funcionam bem para o projetista

---

## Passo 3 — Geração do Parecer Técnico

Produzir o documento `parecer-tecnico-YYYY-MM-DD.md` com a seguinte estrutura:

```markdown
# Parecer Técnico — Kurupira [versão]
**Data:** [data]
**Revisor:** Eng. Vítor Ramos (Persona — engenheiro-eletricista-pv)
**Escopo:** [eixos cobertos nesta revisão]

---

## Sumário Executivo

[2–3 parágrafos: estado geral do sistema, nível de confiança para uso profissional, 
principais riscos identificados]

---

## Resultado por Eixo

### Eixo 1 — Dimensionamento de Strings
**Status:** [✅ Conforme / ⚠️ Parcial / ❌ Não-conforme]
[Análise detalhada conforme formato da skill]

### Eixo 2 — Modelo de Geração e Perdas
...

### Eixo 3 — BOS e Proteções
...

### Eixo 4 — REN 1000/2021
...

### Eixo 5 — Auto-Sizing
...

### Eixo 6 — Experiência de Uso pelo Engenheiro
**Status:** [✅ Claro e confiável / ⚠️ Parcialmente confuso / ❌ Cria desconfiança]
[O que ajuda / O que gera desconforto / O que está confuso — conforme formato da skill]

---

## Backlog de Refatoração Priorizado

| Prioridade | Item | Impacto Técnico | Arquivo(s) | Esforço Estimado |
|-----------|------|----------------|-----------|-----------------|
| P0 — Crítico | ... | ... | ... | ... |
| P1 — Alto | ... | ... | ... | ... |
| P2 — Médio | ... | ... | ... | ... |
| P3 — Baixo | ... | ... | ... | ... |

---

## Próximos Passos Recomendados

1. [Ação imediata — P0]
2. [Feature a especificar — P1]
3. [Melhoria de médio prazo — P2]
```

---

## Passo 4 — Triagem para o Backlog

Após o parecer, para cada item P0 e P1:

1. Verificar se já existe um spec em `.agent/aguardando/` cobrindo o item
2. Se não existir → criar spec minimalista em `.agent/aguardando/[slug].md`
3. Notificar o `orchestrator` para priorização no próximo épico

---

## ⛔ Anti-Padrões a Evitar

- ❌ Emitir parecer sem ter lido os arquivos reais — opinions without code reading are worthless
- ❌ Criticar escolhas de implementação sem propor alternativa concreta
- ❌ Classificar como "P0 Crítico" algo que é apenas opinião estética de código
- ❌ Ignorar o que já está correto — o objetivo não é destruir, é melhorar
- ❌ Sugerir refatorações que quebrariam a API pública do módulo sem avaliar impacto cascata

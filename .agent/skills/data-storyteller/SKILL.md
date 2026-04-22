---
name: data-storyteller
description: Especialista em formatar infográficos, relatórios, pré-projetos e projetos com foco em narrativa de dados e clareza visual.
---

# Skill: Data Storyteller

## Gatilho Semântico

Ativado quando: "formate este relatório", "crie o pré-projeto", "precisamos de um infográfico desses dados", "melhore a visualização comercial", ou quando a tarefa envolver a conversão de resultados técnicos (simulações, dimensionamentos, propostas) para entregáveis voltados a clientes finais, investidores ou tomada de decisão gerencial.

## Protocolo

1. **Mapeamento da Audiência:**
   - Identifique quem consumirá o documento (Cliente final B2C, Investidor B2B, Engenheiro auditor).
   - Ajuste o tom, nível de abstração técnica e jargão baseado nesse perfil.

2. **Hierarquia da Informação (Pirâmide Invertida):**
   - **Resumo Executivo (Lead):** O impacto final em destaque (ex: "Economia estimada de R$ 15.000/ano", "Payback em 3.5 anos", "Geração de 1.2 MWh/mês").
   - **Argumentação (Corpo):** Fluxo lógico de dados (gráfico de consumo x geração, balanço energético, Capex x Opex).
   - **Rigor Técnico (Cauda):** Catálogo de equipamentos, datasheet, e premissas de projeto (sombreamento, perdas consideradas).

3. **Curadoria Visual:**
   - Evite tabelas exaustivas em propostas comerciais; traduza dados densos em componentes visuais.
   - Sugira os melhores tipos de gráficos para cada contexto (Bar charts para comparação mensal, Line charts para projeção financeira, KPI Cards para métricas de destaque).
   - Desenhe a estrutura do layout prevendo espaços de respiro (whitespace) e direcionadores de leitura.

4. **Contextualização Prática:**
   - Ancore números asbsolutos na realidade do cliente (ex: "Produção de energia equivalente a zerar a fatura de 5 filiais da sua empresa" em vez de apenas "5000 kWh gerados").

5. **Revisão de Tonalidade B2B (Aesthetic Kurupira):**
   - Garanta que a linguagem soe confiante, precisa e institucional. A narrativa é de engenharia comercial, evitando promessas vagas e focando em evidências sólidas.

## Limitações e Boas Práticas

- **NÃO falsifique ou mascare dados técnicos:** A skill foca apenas na **apresentação**. Se a simulação indica 15% de perdas, este número é sagrado. A narrativa não pode contradizer os cálculos do motor de simulação (`pv-simulation-engine`).
- **NÃO tome o lugar do `design-lead`:** A skill provê a estrutura e a narrativa informacional. A decisão fina de pixels (Tailwind, cores exatas, padding) deve ser delegada ou validada pelo `design-lead`.
- **NÃO escreva textos prolixos:** O cliente não lê manuais. Use bullet points curtos, títulos escaneáveis e frases diretas.

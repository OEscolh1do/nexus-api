---
name: seletor-inversor-tropical
description: >
  Consultor especializado em seleção de inversores para regiões tropicais brasileiras, com foco
  especial na região Norte (Pará, Amazonas, Belém). Ative quando o Kurupira precisar implementar
  critérios de seleção regionalizada de equipamentos, gerar recomendações técnicas específicas
  para projetos em climas quentes/úmidos, ou desenvolver features que levem em conta: derating
  térmico, grau IP, corrosividade C5, proteção contra raios (DPS), conformidade com distribuidoras
  regionais (Equatorial Energia), e logística de assistência técnica no Norte.
---

# Skill: Seleção de Inversores para Regiões Tropicais

Consultor de domínio para features do Kurupira que envolvam regionalização de recomendações
técnicas, especialmente para o mercado da Região Norte do Brasil.

---

## Por Que a Regionalização Importa

O Brasil tem dimensões continentais com microclimas radicalmente distintos. Um inversor dimensionado
corretamente para São Paulo pode falhar prematuramente em Belém. As variáveis críticas que mudam:

| Variável | São Paulo (Sul/Sudeste) | Belém (Norte/Amazônia) |
|----------|------------------------|------------------------|
| Temperatura ambiente máxima | 33°C – 38°C | 36°C – 40°C |
| Umidade relativa típica | 65% – 80% | 80% – 95% |
| Categoria de corrosividade (ISO 9223) | C3 – C4 | **C5 (muito alta)** |
| Índice de raios (descargas/km²/ano) | 5 – 15 | **15 – 40** |
| Temperatura mínima histórica | 5°C – 10°C | **18°C – 22°C** |
| Chuvas torrenciais com vento | Ocasionais | **Diárias (inverno amazônico)** |

---

## Critério 1 — Derating Térmico e Gestão de Calor

### O Problema

O derating térmico é o mecanismo de proteção do inversor: quando a temperatura interna excede
o limite de operação, o inversor reduz automaticamente a potência de saída para proteger os
componentes. Em Belém, com temperatura ambiente de 38°C e inversor exposto ao sol, a temperatura
interna pode facilmente ultrapassar 60°C.

**Impacto no yield:** cada grau acima do limite de derating reduz a potência em 1% – 3%.
Um inversor em derating por 3h/dia perde ~5% da geração anual.

### Resfriamento Passivo vs. Ativo

**Resfriamento passivo (convecção natural):**
- Adequado para inversores ≤ 10–15 kW em locais frescos
- Vantagem: sem peças móveis, silencioso, sem manutenção mecânica
- Desvantagem em regiões tropicais: o derating ocorre mais cedo — a temperatura ambiente elevada
  reduz o diferencial térmico disponível para dissipar calor
- Exige distância mínima de 30–50 cm entre inversores e paredes (fluxo de ar livre)

**Resfriamento ativo (ventilação forçada):**
- Recomendado para inversores > 10 kW e **obrigatório em regiões tropicais** para projetos
  comerciais/industriais
- Permite operar na potência nominal mesmo com temperatura ambiente de 40°C
- Ventiladores modernos: vida útil projetada > 20 anos, controle de rotação por carga térmica
- Desvantagem: manutenção periódica de filtros (crítico em ambientes com poeira ou fungos)
- Fabricantes com resfriamento ativo de qualidade comprovada: Fronius (Active Cooling),
  Huawei, Sungrow

**Para o Kurupira:** ao recomendar inversores para projetos no Norte/Nordeste, filtrar
prioritariamente equipamentos com resfriamento ativo para potências acima de 8 kW.

---

## Critério 2 — Grau de Proteção IP

O grau IP (Ingress Protection — IEC 60529) define a resistência do gabinete à entrada de
partículas sólidas e líquidos.

| Grau IP | Proteção sólidos | Proteção líquidos | Quando usar |
|---------|-----------------|-------------------|-------------|
| IP65 | Total (poeira) | Jatos de água direcional | Instalações externas protegidas |
| IP66 | Total (poeira) | Jatos de água potentes | **Regiões com chuva tropical intensa** |
| IP67 | Total (poeira) | Imersão temporária (1m/30min) | Áreas sujeitas a inundação |

**Recomendação para região Norte:**
- Instalação externa: **IP66 mínimo** — as tempestades amazônicas são acompanhadas de
  rajadas de vento que projetam água horizontalmente, ultrapassando a proteção IP65
- Instalação interna (galpão, área técnica coberta): IP65 é suficiente

**Para o Kurupira:** ao gerar a proposta técnica para projetos na Região Norte, incluir
automaticamente a exigência de IP66 como critério de seleção de inversor.

---

## Critério 3 — Corrosividade Atmosférica (ISO 9223)

A umidade elevada + calor + poluição orgânica da Amazônia classificam Belém na categoria
**C5 (muito alta)** de corrosividade atmosférica — a segunda mais severa da escala.

| Categoria | Risco | Taxa de corrosão do cobre |
|-----------|-------|--------------------------|
| C1 | Muito baixo | < 0,1 μm/ano |
| C3 | Médio | 0,9 – 5 μm/ano |
| **C5** | **Muito alto** | **> 16 μm/ano** |

**Implicações práticas para inversores em C5:**
- Gabinetes: alumínio fundido com anodização ou pintura epóxi resistente a fungos e umidade
- Vedações: juntas de alta densidade, não espumas abertas que retêm umidade
- Conectores CC: MC4 com rating IP67 e resistência à corrosão
- Parafusos/terminais internos: aço inox ou revestimento níquel/zinco
- Inspeção preventiva anual obrigatória: verificação de oxidação em terminais CC e CA

**Para o Kurupira:** adicionar ao relatório técnico de projetos na Região Norte um alerta
sobre a necessidade de manutenção preventiva anual específica para ambientes C5.

---

## Critério 4 — Proteção Contra Raios e DPS

O Pará é um dos estados com maior índice de descargas atmosféricas do Brasil:
**> 1.200 raios por tempestade** registrados na Região Metropolitana de Belém em eventos severos.

### Por Que a Proteção Interna do Inversor é Insuficiente

Inversores integram varistores e proteções internas, mas estes são dimensionados apenas para
**distúrbios de baixa energia** (surtos de rede). Descargas atmosféricas criam campos
eletromagnéticos que induzem sobretensões na fiação CC capaz de destruir os componentes
eletrônicos do inversor instantaneamente — mesmo que o DPS interno atue.

**Analogia:** o DPS interno do inversor é como um para-choque de bicicleta num caminhão.

### Configuração de Proteção Correta

Conforme NBR 5419 e NBR 16690:

**Lado CC (entre arranjo e inversor):**

| Classe DPS | Proteção contra | Obrigatório quando |
|-----------|----------------|-------------------|
| Classe I | Correntes parciais de descarga direta | Instalação com SPDA ou usina de solo |
| Classe II | Sobretensões induzidas (raios próximos) | **Todas as instalações FV** |
| Classe I+II | Combinado | Regiões de alta incidência de raios (Norte/Centro-Oeste) |

**Instalação:**
- DPS CC instalado na String Box (caixa de junção), não dentro do inversor
- Nível de proteção Up ≤ 80% da tensão suportável do inversor
- Equipotencialização: todos os elementos metálicos da estrutura ligados à malha de aterramento

**Para o Kurupira:** ao gerar a lista de materiais para projetos na Região Norte, incluir
automaticamente DPS Classe I+II como item obrigatório na String Box CC.

### String Box: Função Dupla

A String Box não é apenas proteção — é também **seccionamento físico**:
- Permite isolar o arranjo CC para manutenção segura do inversor (NR-10)
- Fusíveis por string quando N_paralelo ≥ 3 (NBR 16690 §7.4)
- Chave seccionadora com capacidade de interrupção sob carga

---

## Critério 5 — Conformidade com a Distribuidora Regional

### Equatorial Energia (Pará e Amapá)

Normas técnicas aplicáveis:
- **NT.00020.EQTL** — Conexão de micro e minigeração distribuída
- **NT.00002.EQTL** — Requisitos técnicos de instalação

Proteções de interface obrigatórias no inversor (funções ANSI):

| Função ANSI | Proteção | Limites típicos |
|-------------|---------|----------------|
| ANSI 27 | Subtensão (UV) | < 0,8 pu por > 0,1s |
| ANSI 59 | Sobretensão (OV) | > 1,1 pu por > 0,1s |
| ANSI 81U | Subfrequência (UF) | < 57,5 Hz por > 0,1s |
| ANSI 81O | Sobrefrequência (OF) | > 62,5 Hz por > 0,1s |
| Anti-ilhamento | Desconexão na falta de rede | Conforme ABNT NBR IEC 62116 |

**Certificação INMETRO obrigatória:** para inversores até 10 kW, apresentar número de registro
INMETRO no memorial descritivo do projeto.

**Fator de potência:** o inversor deve manter fp entre 0,92 capacitivo e 0,92 indutivo conforme
exigência da Equatorial e PRODIST Módulo 3.

---

## Critério 6 — Derating Térmico: Cálculo de Perda de Yield

Para estimar o impacto do derating em projetos na Região Norte:

```
T_interna_inversor ≈ T_ambiente + ΔT_interno
```

Onde ΔT_interno depende da potência de perdas do inversor e da eficiência de resfriamento.

**Temperatura de derating típica:** 45°C – 50°C (temperatura interna)

Com T_ambiente = 38°C e ΔT_interno = 15°C → T_interna = 53°C → derating ativo.

**Estimativa de perda anual por derating em Belém sem resfriamento ativo:**
- 2% – 6% da energia anual, concentrada nos meses de menor precipitação (Jun–Dez)
- Em inversores sem resfriamento ativo: pode chegar a 10% nos meses mais quentes

**Para o Kurupira:** incluir na simulação de geração um fator de derating estimado baseado
na temperatura histórica do local e no tipo de resfriamento do inversor selecionado.

---

## Critério 7 — Logística e Pós-Venda na Região Norte

A decisão técnica do inversor impacta diretamente a manutenção ao longo dos 25 anos de vida útil.

### Fabricantes com Presença Relevante no Norte

| Fabricante | Diferencial para o Norte |
|-----------|--------------------------|
| WEG | Maior rede de assistência técnica autorizada nacional — presença em cidades menores do Pará |
| Livoltek | Fábrica em Manaus (Zona Franca) — logística de reposição muito mais rápida para a região |
| Sungrow | Suporte técnico em português, ranking de saúde financeira elevado |
| Huawei | Monitoramento remoto avançado (IA para diagnóstico de falhas) — reduz necessidade de visitas |

### Critérios de Pós-Venda para Recomendar no Kurupira

- **Garantia:** mínimo 5 anos, ideal 10–12 anos (estendida pelo fabricante)
- **Suporte local:** confirmar se há assistência técnica autorizada na cidade do projeto
- **Monitoramento remoto:** plataforma em nuvem com diagnóstico em tempo real — reduz
  lucro cessante em regiões onde deslocamento técnico é custoso
- **Tempo de resposta:** SLA documentado para reposição de equipamento defeituoso

---

## O Que Implementar no Kurupira

### Perfil de Localização (`locationProfile.ts` ou equivalente)

```typescript
interface LocationEnvironmentProfile {
  regiao: 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul';
  t_ambiente_max: number;     // °C
  t_ambiente_min: number;     // °C
  umidade_relativa_media: number; // %
  corrosividade: 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'CX';
  incidencia_raios: 'baixa' | 'media' | 'alta' | 'muito_alta';
  distribuidora: string;      // ex: 'Equatorial Pará'
  norma_distribuidora: string; // ex: 'NT.00020.EQTL'
}
```

### Filtros de Seleção de Inversor por Perfil Tropical

```typescript
interface InverterRequirementsForTropical {
  grau_ip_minimo: 'IP65' | 'IP66' | 'IP67';
  resfriamento_ativo_requerido: boolean;   // true se T_max > 35°C e P > 8kW
  corrosividade_minima: 'C4' | 'C5';
  dps_classe: 'II' | 'I+II';              // I+II se incidência alta
  certificacao_inmetro: boolean;
  funcoes_ansi_requeridas: string[];      // ['27', '59', '81U', '81O']
}
```

### Alertas Automáticos para Projetos na Região Norte

| Trigger | Alerta |
|---------|--------|
| Estado = AM, PA, RR, AP, AC, RO | "Região tropical de alta umidade. Verificar IP66 e resfriamento ativo." |
| Incidência de raios > alta | "Alta incidência de raios. DPS Classe I+II obrigatório na String Box CC." |
| Corrosividade C5 | "Ambiente C5. Especificar gabinete de alumínio ou epóxi com resistência a fungos." |
| Distribuidora = Equatorial | "Projeto sujeito às normas NT.00020.EQTL. Verificar proteções ANSI 27/59/81." |

---

## Referências

| Fonte | Relevância |
|-------|-----------|
| ISO 9223:2012 | Classificação de corrosividade atmosférica |
| ABNT NBR 5419:2015 | Proteção contra descargas atmosféricas |
| NT.00020.EQTL | Norma técnica Equatorial Energia — micro e minigeração |
| ABNT NBR IEC 62116 | Anti-ilhamento para inversores FV |
| Fronius Active Cooling Tech | Referência de resfriamento ativo em campo |
| SEMAS/PA | Dados de descargas atmosféricas no Pará |

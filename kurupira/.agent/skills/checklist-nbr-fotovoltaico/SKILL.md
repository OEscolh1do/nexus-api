---
name: checklist-nbr-fotovoltaico
description: >
  Consultor de conformidade normativa para sistemas fotovoltaicos no Brasil. Ative quando o
  Kurupira precisar implementar validações normativas, gerar checklists de projeto ou
  comissionamento, verificar conformidade com NBR 16690 (instalação CC), NBR 16274
  (comissionamento), NBR 17193:2025 (Rapid Shutdown), Portaria INMETRO 515/2023 (AFCI),
  ou ao desenvolver o módulo de documentação técnica que acompanha a proposta. Inclui os
  requisitos da REN 1000/2021 (ANEEL) para homologação junto às distribuidoras.
---

# Skill: Conformidade Normativa FV — NBR e Regulamentos Brasileiros

Consultor de domínio para garantir que as features de validação, documentação e proposta
técnica do Kurupira estejam alinhadas com o arcabouço normativo brasileiro vigente.

---

## Mapa Normativo Vigente (2025)

| Norma / Regulamento | Escopo | Status |
|--------------------|--------|--------|
| **ABNT NBR 16690:2019** | Instalações elétricas de arranjos fotovoltaicos (circuito CC) | Vigente |
| **ABNT NBR 16274:2014** | Comissionamento de sistemas FV conectados à rede | Vigente |
| **ABNT NBR 17193:2025** | Segurança contra incêndios — Rapid Shutdown | **Novo — obrigatório 2025** |
| **ABNT NBR 16149:2013** | Interface de conexão do inversor com a rede | Vigente |
| **ABNT NBR IEC 62116** | Anti-ilhamento para inversores FV | Vigente |
| **ABNT NBR 5410:2004** | Instalações elétricas de baixa tensão (cabos, proteções) | Vigente |
| **ABNT NBR 5419:2015** | Proteção contra descargas atmosféricas (DPS) | Vigente |
| **ANEEL REN 1000/2021** | Micro e minigeração distribuída | Vigente |
| **Portaria INMETRO 004/2011** | Certificação de módulos FV | Vigente |
| **Portaria INMETRO 140/2022** | Eficiência de inversores (métrica brasileira) | Vigente |
| **Portaria INMETRO 515/2023** | AFCI obrigatório em inversores | **Novo — fase de implementação** |
| **PRODIST Módulo 3** | Acesso ao sistema de distribuição | Vigente |

---

## NBR 16690:2019 — Instalações CC

### Requisitos de Dimensionamento (§6)

**Queda de tensão CC:**
- Limite normativo: ≤ 3% entre o arranjo e o inversor
- Recomendação de campo: ≤ 1% (otimização de yield)
- O Kurupira deve calcular a queda de tensão baseada no comprimento de cabo, seção e corrente

**Mismatch entre strings no mesmo MPPT (§6.4):**
- Diferença de tensão entre strings em paralelo: ≤ 5%
- Diferença de potência entre strings: ≤ 5%
- Strings com orientações ou inclinações diferentes devem usar MPPTs separados

**Temperatura mínima para cálculo de Voc:**
- Usar temperatura mínima histórica do local — não um valor fixo nacional
- Fonte recomendada: INMET (dados históricos por município)

### Proteção de Sobrecorrente (§7.4)

**Fusíveis de string — quando obrigatórios:**
```
N_paralelo ≥ 3 → fusível individual obrigatório por string
```

**Dimensionamento do fusível:**
```
1,5 × Isc_string ≤ If ≤ 2,4 × Isc_string
```
- Categoria: gG ou gPV (específica para FV)
- Tensão nominal do fusível ≥ Voc_string_max corrigido

**Disjuntor CC (geral):**
- Capacidade de interrupção em corrente contínua (diferente do CA)
- Tensão nominal ≥ Vmpp_max + 20%

### String Box (Caixa de Junção)

Deve conter:
- [ ] Fusíveis por string (quando N_paralelo ≥ 3)
- [ ] Chave seccionadora CC com capacidade de interrupção sob carga
- [ ] DPS Classe II (mínimo) — Classe I+II em regiões de alta incidência de raios
- [ ] Aterramento da estrutura equipotencial
- [ ] Diagrama elétrico interno afixado na tampa

---

## NBR 16274:2014 — Comissionamento

### Ensaios Obrigatórios Antes da Energização

**1. Verificação de Polaridade**
- Verificar polaridade CC de cada string antes de conectar ao inversor
- Inversão de polaridade causa dano imediato — não há proteção interna no inversor

**2. Medição de Voc de String**
- Medir Voc de cada string com multímetro
- Corrigir o valor medido para a irradiância e temperatura no momento do ensaio:
  ```
  Voc_corrigido = Voc_medido × (Voc_stc / Voc_referencia_temperatura)
  ```
- Comparar com o valor calculado no projeto (tolerância: ±3%)

**3. Medição de Isc de String**
- Medir Isc de cada string com alicate amperímetro
- Comparar com Isc_stc × (Irradiância_local / 1000)
- Divergência > 5% indica módulo defeituoso, sombra não identificada ou mau contato

**4. Teste de Isolação**
- Aplicar 500 VCC entre os condutores ativos e a terra
- Resistência de isolação mínima: 1 MΩ para sistemas ≤ 1 kVcc
- Falha indica dano na isolação dos cabos — risco de choque e falha de terra no inversor

**5. Traçado de Curva I-V (opcional, recomendado)**
- Procedimento avançado: equipamento específico (curve tracer)
- Diagnóstica: degradação, sombreamento não visível, módulos defeituosos na string
- Comparar curva medida com a curva calculada a partir dos parâmetros STC corrigidos

### Checklist de Comissionamento para o Kurupira

O módulo de documentação do Kurupira deve gerar um checklist de comissionamento baseado
nos dados do projeto. Cada item deve incluir: o que medir, o valor esperado calculado,
a tolerância aceitável e o que fazer em caso de divergência.

---

## NBR 17193:2025 — Rapid Shutdown (RSD)

### O Problema que a Norma Resolve

Em um incêndio convencional, desligar o disjuntor principal cessa o risco elétrico. Em uma
edificação com energia solar, os cabos CC que descem dos módulos para o inversor permanecem
energizados com até 1000 VCC enquanto houver luz solar — mesmo com o inversor desligado.

O Corpo de Bombeiros não pode combater incêndio com cabos de 1000 VCC ativos no telhado.

### Requisito Central da NBR 17193:2025

**Em até 30 segundos** após acionamento do botão de emergência ou queda da rede CA:
```
Tensão nos condutores CC no telhado → ≤ 30 VCC (extra-baixa tensão)
```

### Implementações Aceitas

| Tecnologia | Como atende o RSD | Custo adicional |
|-----------|-------------------|----------------|
| Microinversores | Conversão CA no módulo — sem CC no telhado | Alto |
| Otimizadores de potência | Módulo isola individualmente ao perder comunicação | Médio |
| Dispositivos RSD externos | Instalados em série com strings — desligam ao comando | Baixo |
| Inversores com RSD integrado | Função nativa no inversor de string | Nenhum (inversor específico) |

### Impacto no Kurupira

- **Seleção de inversores:** filtrar inversores com suporte nativo a RSD para projetos
  residenciais e comerciais novos (obrigatório para alvarás a partir de 2025)
- **Proposta técnica:** incluir automaticamente dispositivo RSD ou tecnologia MLPE compatível
  na lista de materiais de projetos em edificações
- **Alertas no sistema:** se o usuário selecionar inversor string sem RSD para projeto
  residencial, emitir alerta sobre a conformidade com NBR 17193

---

## Portaria INMETRO 515/2023 — AFCI

### O Problema: Arcos Elétricos em CC

Em corrente alternada, o arco elétrico se extingue naturalmente no cruzamento pelo zero da
senoide. Em corrente contínua, o arco é **contínuo** — uma vez iniciado por um conector mal
apertado ou cabo com isolação danificada, ele se auto-alimenta e pode atingir 3.000°C,
derretendo conduítes e iniciando incêndios.

Arcos CC são a principal causa de incêndios em sistemas FV — responsáveis por mais de 30%
dos sinistros em instalações comerciais.

### AFCI — Arc Fault Circuit Interrupter

O AFCI monitora continuamente o ruído de alta frequência na fiação CC usando processamento
digital de sinal (DSP). Ao detectar a assinatura harmônica característica de um arco, o
inversor desliga a entrada CC em milissegundos — antes que o calor possa iniciar uma chama.

### Requisito da Portaria 515/2023

**AFCI obrigatório** para inversores com:
- Tensão de entrada CC > 120 V **E**
- Corrente de entrada > 20 A

Na prática: a maioria dos inversores residenciais e comerciais acima de 3 kW.

### Impacto no Kurupira

- **Banco de inversores:** marcar inversores com AFCI integrado — critério de filtro obrigatório
  para projetos novos após a vigência da portaria
- **Proposta técnica:** destacar a presença de AFCI como critério de segurança e diferencial
  técnico na justificativa do inversor selecionado
- **Alerta:** se o inversor selecionado não tiver AFCI e o projeto se enquadrar nos limites
  da portaria, emitir alerta de não conformidade

---

## REN 1000/2021 (ANEEL) — Homologação junto à Distribuidora

### Classificação do Projeto

```
Microgeração: ≤ 75 kWp
Minigeração:  75 kWp < P ≤ 5 MWp
```

### Documentos Obrigatórios para AcessoNet/GD

O Kurupira deve ser capaz de gerar automaticamente (ou orientar a geração de) todos os
documentos exigidos pela distribuidora:

| Documento | Conteúdo obrigatório | Gerado pelo Kurupira? |
|-----------|---------------------|----------------------|
| Memorial Descritivo | Potência instalada, equipamentos, ponto de conexão | ✅ Deve gerar |
| Diagrama Unifilar | Representação gráfica do sistema CC e CA | ✅ Deve gerar |
| Ficha Técnica dos Equipamentos | Datasheets com número INMETRO | ⚠️ Referenciar |
| ART (Anotação de Responsabilidade Técnica) | Assinatura do engenheiro responsável | ❌ Externo |

### Conteúdo Mínimo do Memorial Descritivo

- [ ] Localização do projeto (endereço, coordenadas GPS)
- [ ] Potência instalada (kWp CC e kW CA)
- [ ] Quantidade e modelo dos módulos fotovoltaicos (com número INMETRO)
- [ ] Quantidade e modelo dos inversores (com número INMETRO e certificação)
- [ ] Configuração elétrica (N_série × N_paralelo × N_MPPTs)
- [ ] Ponto de conexão na rede (identificação do ramal/poste)
- [ ] Proteções instaladas (DPS, disjuntores, fusíveis — com calibres)
- [ ] Geração estimada anual (kWh/ano) com metodologia declarada
- [ ] Responsável técnico (nome, CREA, número da ART)

---

## Checklist de Projeto Completo para o Kurupira

### Fase 1 — Projeto (antes da execução)

**Dimensionamento Elétrico (NBR 16690)**
- [ ] Voc_max corrigido para T_mínima histórica < Vinput_max_inversor × 0,95
- [ ] Vmp_operacional no calor (T_célula_máx) > MPPT_Vmin do inversor
- [ ] Isc_total × 1,25 ≤ Iinput_max_mppt do inversor
- [ ] Oversize ratio CC/CA entre 1,05 e 1,50
- [ ] Queda de tensão CC calculada e ≤ 3% (ideal ≤ 1%)
- [ ] Fusíveis de string dimensionados quando N_paralelo ≥ 3
- [ ] DPS Classe II (mínimo) especificado na String Box

**Segurança (NBR 17193 + Portaria 515/2023)**
- [ ] Inversor com AFCI integrado (ou AFCI externo) conforme Portaria 515/2023
- [ ] Rapid Shutdown previsto para edificações residenciais/comerciais
- [ ] Aterramento e equipotencialização de todas as estruturas metálicas

**Documentação (REN 1000/2021)**
- [ ] Memorial descritivo completo com todos os campos da distribuidora
- [ ] Diagrama unifilar gerado
- [ ] Número INMETRO dos inversores verificado e registrado
- [ ] Classificação micro/minigeração correta

### Fase 2 — Comissionamento (NBR 16274)

- [ ] Verificação visual da fiação e conexões
- [ ] Verificação de polaridade de todas as strings
- [ ] Medição de Voc de cada string (comparar com projeto ± 3%)
- [ ] Medição de Isc de cada string (comparar com projeto ± 5%)
- [ ] Teste de isolação (≥ 1 MΩ)
- [ ] Verificação de funcionamento do anti-ilhamento (desconexão na perda de rede)
- [ ] Verificação do monitoramento remoto (plataforma do fabricante)
- [ ] Teste do botão de Rapid Shutdown (quando instalado)

### Fase 3 — Pós-Instalação (anual)

- [ ] Limpeza dos módulos
- [ ] Inspeção de conectores MC4 (sinais de oxidação ou aquecimento)
- [ ] Verificação dos filtros do ventilador (inversores com resfriamento ativo)
- [ ] Leitura dos logs de falha do inversor
- [ ] Comparação da geração real vs. geração estimada no projeto

---

## O Que Implementar no Kurupira

### Engine de Validação Normativa

```typescript
interface NormativeValidationResult {
  nbr_16690: {
    voc_safety: ValidationItem;
    vmp_mppt_window: ValidationItem;
    isc_limit: ValidationItem;
    voltage_drop: ValidationItem;
    string_fuse_required: ValidationItem;
    dps_required: ValidationItem;
  };
  portaria_515: {
    afci_required: boolean;
    afci_present: boolean;
    status: 'compliant' | 'non_compliant' | 'not_applicable';
  };
  nbr_17193: {
    rsd_required: boolean;
    rsd_implemented: boolean;
    implementation_type: 'microinverter' | 'optimizer' | 'external_rsd' | 'inverter_native' | null;
    status: 'compliant' | 'non_compliant' | 'not_applicable';
  };
  ren_1000: {
    project_class: 'microgeracao' | 'minigeracao';
    memorial_complete: boolean;
    missing_fields: string[];
  };
}
```

### Gerador de Relatório de Conformidade

O Kurupira deve gerar um documento de conformidade normativa como anexo à proposta técnica,
listando cada norma aplicável, o critério verificado, o valor calculado e o status de conformidade.
Este documento serve como suporte técnico para o engenheiro ao assinar a ART.

---

## Referências

| Norma | Onde obter |
|-------|-----------|
| ABNT NBR 16690:2019 | Acervo ABNT (pago) |
| ABNT NBR 17193:2025 | ABNT / AndSolar (análise técnica disponível) |
| Portaria INMETRO 515/2023 | Portal Gov.br — Inmetro |
| ANEEL REN 1000/2021 | Portal ANEEL — Legislação |
| NT.00020.EQTL | Portal Equatorial Energia |
| NBR 5419:2015 | Acervo ABNT (pago) |

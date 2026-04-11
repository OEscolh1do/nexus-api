# Kurupira — Escopo Definitivo TRL 7-8
**Status:** 🟢 Escopo Fechado  
**Criado:** 2026-04-11  
**Meta:** Produto demonstrável em ambiente operacional, pronto para uso interno por engenheiros da Neonorte

---

## 1. Contexto e Critério de Aceitação TRL

| Nível | Descrição | Critério para o Kurupira |
|-------|-----------|--------------------------|
| TRL 5-6 | Protótipo validado em laboratório | ✅ *Estado atual* — UI funciona, engine existe, dados persistem |
| **TRL 7-8** | **Sistema demonstrável em ambiente operacional** | **Um engenheiro real dimensiona um projeto real, do zero à entrega** |
| TRL 9 | Sistema qualificado para produção comercial | Fora do escopo deste épico |

**Definição operacional de TRL 7-8:**
> Eng. Vítor abre o Kurupira, cria um projeto para um cliente real em Marabá-PA, dimensiona o sistema, valida a elétrica, vê o payback projetado e apresenta os resultados para o cliente — tudo sem precisar de planilhas paralelas.

---

## 2. Estado Atual (Diagnóstico Honesto)

### O Que Está Funcionando (Mantém)
- ✅ Workspace polimórfico com CenterCanvas (Mapa, Simulação, Site, Electrical)
- ✅ Catálogo de equipamentos (módulos + inversores) via TiDB Cloud
- ✅ Dimensionamento elétrico básico (Voc térmico, FDI, strings/MPPT)
- ✅ Health Check e fluxo de aprovação no TopRibbon
- ✅ Persistência de projetos via API (Fly.io)
- ✅ Project Explorer com deep link do Iaçã (CRM)
- ✅ TopRibbon simetria corrigida (UX-013/014)
- ✅ SimulationView como default no CenterCanvas (UX-011)

### Gaps que Impedem TRL 7-8

| # | Gap | Severidade | Bloqueia |
|---|-----|-----------|---------|
| G1 | Motor de geração usa 30 dias fixos/mês para todos os meses | **Crítico** | Integridade dos números |
| G2 | Sem tradução monetária (kWh→R$/payback) | **Crítico** | Proposta para cliente |
| G3 | Navegação por duplo-header consome 80px e destrói estado do Canvas | **Alto** | UX profissional |
| G4 | Dashboard de simulação não expõe curva diária (dados já existem no Worker) | **Alto** | Profundidade analítica |
| G5 | PR monolítico sem decomposição de perdas | **Alto** | Confiança nos números |
| G6 | Potência mínima (kWp alvo) calculada manualmente | **Alto** | Produtividade do engenheiro |
| G7 | Isc Alta com falsos positivos (validação suspensa) | **Médio** | Integridade elétrica |
| G8 | Sem visões alternativas de geração (stacked, cumulativo, tabela) | **Médio** | Apresentação ao cliente |
| G9 | NavRail da Simulação — scroll longo sem orientação | **Médio** | UX no dashboard |

---

## 3. Decisões Arquiteturais Fechadas

### D1 — Modelo de Navegação: Ribbon Consolidado Pragmático

**Decisão:** Refatorar para um único header consolidado, eliminando o duplo-header, sem reescrever toda a arquitetura de módulos agora.

**Rationale:** A reescrita completa para modelo AutoCAD (canvas permanente + ribbon contextual) é o norte correto, mas tem escopo de 3-4 semanas isolado. Para TRL 7-8, o bloqueio real é a *dupla barra* que rouba 80px e o recarregamento do canvas ao trocar de view. A solução pragmática:
- Remover o header global com abas (`ProfileOrchestrator`) 
- O `TopRibbon` absorve a navegação de contexto (Mapa | Simulação | Elétrico | Proposta) como segmentos internos
- O Canvas **não desmonta** ao trocar de segmento (lazy hide com `display: none`, não unmount)

**O que NÃO entra agora:** Ribbon File/Menu estilo Office, File → Open Project, undo/redo global.

### D2 — O que entra no Workspace vs Telas Separadas

**Dentro do Workspace (CenterCanvas):**
- Mapa (Leaflet)
- Simulação Energética
- Elétrica (stringing, validação)
- Site (fotos, localização)

**Fora do Workspace (telas separadas, sem mudança):**
- Project Explorer (home da aplicação)
- Proposta/Documentação (acesso via botão no TopRibbon)
- Settings/Premissas → migra para painel no RightInspector

### D3 — Canvas 3D (R3F/Boto): Fora do TRL 7-8

**Decisão:** O 2D Leaflet com overlay WebGL é suficiente para demonstração operacional. Canvas 3D é TRL 9.

**Rationale:** O diferencial do Kurupira no TRL 7-8 é a **qualidade do motor de engenharia**, não a renderização 3D. Eng. Vítor precisa de números corretos primeiro.

### D4 — Isc Alta: Reativar com Limiar Configurável

**Decisão:** Reativar a validação Isc com o limiar configurável no RightInspector (padrão: 1.25 × Isc_nominal), com warning ao invés de bloqueio hard.

### D5 — 3D/Feedback Visual de Strings: Fora do TRL 7-8

Depende de topologia de strings funcional (P6) que ainda não está completa. Entra no TRL 9.

---

## 4. Escopo Definitivo: O Que ENTRA

### Fase 1 — Motor de Simulação Profissional
*Objetivo: Os números são confiáveis. O engenheiro vê o que vê em PVsyst.*

| ID | Spec | Descrição | Prioridade |
|----|------|-----------|------------|
| S-A1 | Motor Analítico Faturado | Substituir 30 dias fixos → `DAYS_IN_MONTH[i]`, carregar `P_DC` real do catálogo | **P0** |
| S-A2 | Monetização + Payback | `kWh × tarifa → R$`, Custo de Disponibilidade ANEEL, "Economia Anual: R$ X" | **P0** |
| S-01 | Curva de Geração Diária | AreaChart horário (24h) com bell-curve solar, seletor de mês | **P1** |
| S-02 | Visões Múltiplas | Stacked (autoconsumo+injeção+déficit), Cumulativo, Tabela Analítica | **P1** |
| S-03 | Potência Mínima Recomendada | Card "kWp Alvo" com slider de cobertura, ≈N módulos de Xw | **P1** |
| S-04 | Waterfall de Perdas | Decomposição visual do PR (10 fatores), accordion colapsável | **P1** |
| S-05 | NavRail da Simulação | Sidebar de navegação sticky, IntersectionObserver, 48px expandível | **P2** |

**Critério de conclusão da Fase 1:**
> O engenheiro consegue responder com o Kurupira: "Qual o tamanho mínimo? Quanto o cliente economiza por mês? Por que o PR é 78%?" — sem planilha paralela.

---

### Fase 2 — UX Profissional (Ribbon + Canvas Persistente)
*Objetivo: A ferramenta parece software de engenharia, não MVP.*

| ID | Spec | Descrição | Prioridade |
|----|------|-----------|------------|
| U-01 | Ribbon Consolidado | Eliminar duplo-header; TopRibbon absorve navegação de contexto; Canvas não desmonta | **P0** |
| U-02 | Settings no Inspector | Premissas (perdas, tarifas) migra do módulo separado para PanelSlot no RightInspector | **P1** |
| U-03 | Top Ribbon — Navegação de Contexto | Botões [Mapa][Simulação][Elétrico] no TopRibbon, substituindo o nav global atual | **P1** |

**Critério de conclusão da Fase 2:**
> O canvas Leaflet não recarrega ao trocar entre Mapa e Simulação. O header tem uma única barra.

---

### Fase 3 — Integridade Elétrica
*Objetivo: A validação elétrica é completa e confiável.*

| ID | Spec | Descrição | Prioridade |
|----|------|-----------|------------|
| E-01 | Isc Alta Corrigida | Reativar validação com limiar configurável (1.25× default), warning não-bloqueante | **P1** |
| E-02 | Motor Elétrico P6 | MPPT stringing otimizado, cálculo térmico Voc/Vmp por string, Web Worker | **P1** |

**Critério de conclusão da Fase 3:**
> O Health Check não produz falsos positivos. O engenheiro vê exatamente quais strings estão em risco.

---

### Dívida Técnica Paralela (sem bloqueio)

| ID | Item | Quem faz | Depende de |
|----|------|----------|------------|
| DT-01 | Contraste monitores luminosos | design-lead | — |
| DT-02 | Prisma v5 → v7 | infra | — |

---

## 5. O Que NÃO ENTRA no TRL 7-8

Tudo abaixo fica documentado e priorizado para TRL 9:

| Item | Motivo |
|------|--------|
| Canvas 3D (R3F + Boto) | Diferencial visual, não bloqueia engenharia |
| Diagrama Unifilar Automático | Depende de P6 completo; essencial para homologação (TRL 9) |
| Feedback Visual de Strings no Canvas | Depende de topologia de strings |
| CRM Reintegração Avançada | ClientDataModal já cobre o caso de uso mínimo |
| Ribbon estilo AutoCAD completo | Scope da Fase 2 é suficiente para TRL 8 |
| Temperatura Sazonal por Cidade | Fase 2 do Spec-04; banco de dados climáticos é trabalho separado |

---

## 6. Definition of Done (DoD) — TRL 7-8

Um checklist global. O épico só é declarado TRL 7-8 quando todos os itens abaixo estão marcados:

### Motor de Cálculo
- [ ] `DAYS_IN_MONTH` substituiu o valor fixo de 30 em todo o código
- [ ] `P_DC` vem do `useTechStore.getSystemDcPower()` (não hardcoded)
- [ ] Geração anual do Motor Analítico está dentro de ±5% de um cálculo manual de referência para o mesmo projeto
- [ ] Economia anual em R$ exibe corretamente para `monofasico/bifasico/trifasico` conforme ANEEL REN 1000/2021

### Dashboard de Simulação
- [ ] 4 visões disponíveis (Barras, Stacked, Cumulativo, Tabela)
- [ ] Curva diária horária (24h) disponível com seletor de mês
- [ ] Waterfall de perdas exibe os 10 fatores do `lossProfile`
- [ ] Card "Potência Mínima" com slider de cobertura funciona
- [ ] NavRail lateral com scroll tracking ativo

### UX / Arquitetura
- [ ] Sem duplo-header: uma única barra de controle visível no workspace
- [ ] Canvas Leaflet não reinicializa ao alternar entre contextos (Mapa ↔ Simulação)
- [ ] TopRibbon integra navegação contextual [Mapa][Simulação][Elétrico]
- [ ] Premissas acessíveis dentro do RightInspector

### Elétrica
- [ ] Isc Alta reativada com warning não-bloqueante
- [ ] Health Check não produz falsos positivos

### Qualidade de Código
- [ ] `tsc --noEmit` → EXIT CODE 0 em todo o monorepo
- [ ] Zero `any` introduzido nas novas funcionalidades

### Validação Humana
- [ ] **Eng. Vítor (revisor-PV)** assina: "Os números de geração e payback são profissionalmente aceitáveis para apresentar a um cliente"
- [ ] **Sessão de uso real:** Um projeto completo (Marabá-PA, cliente residencial, sistema 5kWp) é dimensionado do zero em menos de 15 minutos

---

## 7. Sequência de Implementação

```
AGORA → Fase 1 (Motor + Simulação)
         ├── S-A1: Motor Analítico Faturado        [P0 — Desbloqueador]
         ├── S-A2: Monetização + Payback            [P0 — Desbloqueador]
         ├── S-03: Potência Mínima                  [P1]
         ├── S-01: Curva Diária                     [P1]
         ├── S-04: Waterfall de Perdas              [P1]
         ├── S-02: Visões Múltiplas                 [P1]
         └── S-05: NavRail                          [P2]
         
DEPOIS → Fase 2 (UX/Ribbon)
         ├── U-01: Ribbon Consolidado               [P0 da fase]
         ├── U-03: Navegação Contextual no Ribbon   [P1]
         └── U-02: Settings no Inspector            [P1]
         
DEPOIS → Fase 3 (Elétrica)
         ├── E-01: Isc Alta Corrigida               [P1]
         └── E-02: Motor P6                         [P1]

PARALELO → DT-01, DT-02 (sem bloqueio)
```

**Dependências críticas:**
- S-A1 deve vir antes de S-01/S-02/S-03 (todos usam a geração mensal corrigida)
- U-01 (Ribbon) pode ser feito em paralelo com Fase 1
- E-02 (P6) pode ser feito em paralelo com Fase 2

---

## 8. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| U-01 (Ribbon) tem escopo maior que estimado | Médio | Alto | Separar em sub-tasks; começar pela eliminação do duplo-header |
| E-02 (P6 Motor Elétrico) está subestimado | Alto | Médio | Limitar TRL 7-8 ao Health Check corrigido; P6 completo vai para TRL 9 se necessário |
| Dados de HSP ausentes para algumas cidades | Baixo | Médio | Fallback para valor médio anual ÷ 12 com aviso visual |
| Temperatura Sazonal sem banco de dados climáticos | Alto | Baixo | Waterfall usa temperatura fixa (PR constante) — Fase 2 do spec-04 |

---

## 9. Specs de Referência

| Status | Arquivo |
|--------|---------|
| ✅ Concluído | `spec-01-curva-geracao-diaria` |
| ✅ Concluído | `spec-02-visoes-multiplas-geracao-consumo` |
| ✅ Concluído | `spec-03-potencia-minima-recomendada` |
| ✅ Concluído | `spec-04-fatores-locais-decomposicao-perdas` |
| ✅ Concluído | `spec-05-navegacao-simulacao-navrail` |
| ⏳ Aguardando | `spec-motor-analitico-faturado-2026-04-10` |
| ⏳ Aguardando | `spec-monetizacao-banco-creditos-2026-04-10` |
| ⏳ Aguardando | `spec_tech_debt_isc_alta` |
| 📋 A criar | `spec-U01-ribbon-consolidado` |
| 📋 A criar | `spec-E02-motor-p6-stringing` |

---

*Escopo gerado em 2026-04-11 com base nos specs existentes em `.agent/`, diagnóstico do README do épico e estado atual do repositório.*

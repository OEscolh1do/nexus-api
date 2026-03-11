# ADR 007: Expansão do Módulo Commercial (CRM Completo)

**Status:** ✅ Aceito  
**Data:** 2026-01-26  
**Decisores:** Arquitetura Neonorte | Nexus, Product Owner  
**Contexto:** Wave 11-13 - Commercial Module Expansion

---

## Contexto

O módulo Commercial inicial do Neonorte | Nexus era limitado a um pipeline básico de vendas. Com o crescimento da operação comercial e a necessidade de processos mais estruturados, identificamos a necessidade de expandir o CRM para suportar:

1. **Gestão de Missões Comerciais:** Campanhas regionais com metas e gamificação
2. **Lead Scoring Automático:** Priorização inteligente de leads
3. **Funil de Vendas Estruturado:** 8 estágios com validações obrigatórias
4. **Propostas Técnicas:** Validação de engenharia antes da comercialização
5. **Guardrails de Qualidade:** Regra "Sem Jeitinho" para evitar atalhos

---

## Decisão

Expandimos o módulo Commercial com as seguintes entidades e funcionalidades:

### 1. Novas Entidades do Schema

#### **Mission** (Missão Comercial)

```prisma
model Mission {
  id            String        @id @default(cuid())
  name          String
  region        String
  regionPolygon Json?         // GeoJSON para visualização em mapa
  startDate     DateTime
  endDate       DateTime
  status        MissionStatus @default(PLANNING)
  stats         Json?         // Métricas agregadas

  leads         Lead[]
  coordinatorId String?
  coordinator   User?         @relation(...)
  opportunities Opportunity[]
}

enum MissionStatus {
  PLANNING
  ACTIVE
  COMPLETED
}
```

**Justificativa:** Permite organizar esforços comerciais por região e período, facilitando gamificação e acompanhamento de metas.

#### **Opportunity** (Oportunidade de Venda)

```prisma
model Opportunity {
  id             String            @id @default(cuid())
  title          String
  leadId         String
  missionId      String?
  status         OpportunityStatus @default(LEAD_QUALIFICATION)
  estimatedValue Decimal           @db.Decimal(10, 2)
  probability    Float             @default(0)

  technicalProposalId String?            @unique
  technicalProposal   TechnicalProposal? @relation(...)

  lead    Lead     @relation(...)
  mission Mission? @relation(...)
}

enum OpportunityStatus {
  LEAD_QUALIFICATION      // Qualificação inicial
  VISIT_SCHEDULED         // Visita agendada
  TECHNICAL_VISIT_DONE    // Visita técnica realizada
  PROPOSAL_GENERATED      // Proposta gerada
  NEGOTIATION             // Em negociação
  CONTRACT_SENT           // Contrato enviado
  CLOSED_WON              // Ganho
  CLOSED_LOST             // Perdido
}
```

**Justificativa:** Separa o conceito de Lead (contato) de Opportunity (negócio), permitindo múltiplas oportunidades por lead e melhor rastreamento do funil.

#### **TechnicalProposal** (Proposta Técnica)

```prisma
model TechnicalProposal {
  id                   String  @id @default(cuid())
  kitData              Json    // Equipamentos selecionados
  consumptionAvg       Float   // Consumo médio (kWh)
  infrastructurePhotos Json    // Array de URLs
  paybackData          Json    // Análise de retorno
  validatedByEng       Boolean @default(false)

  opportunity Opportunity?
}
```

**Justificativa:** Garante que toda proposta comercial tenha validação técnica antes de ser enviada ao cliente, reduzindo erros e retrabalho.

#### **Enriquecimento de Lead**

```prisma
model Lead {
  // ... campos existentes

  // Novos campos (Wave 13)
  city             String?
  state            String?
  engagementScore  Int     @default(0)  // 0-100
  academyScore     Int?                 // Pontuação em treinamentos
  technicalProfile Json?                // Perfil técnico do cliente
  academyOrigin    String?              // Origem: Academy
  energyBillUrl    String?              // Obrigatório para avançar estágios

  missionId    String?
  mission      Mission?          @relation(...)
  interactions LeadInteraction[]
}
```

**Justificativa:** Permite scoring automático e priorização inteligente de leads baseado em engajamento e perfil técnico.

### 2. Regras de Negócio Implementadas

#### **Guardrail "Sem Jeitinho"**

Validações obrigatórias para transição de estágios:

```typescript
// Exemplo: Não pode avançar de LEAD_QUALIFICATION sem conta de energia
const canAdvanceToVisitScheduled = (lead: Lead): boolean => {
  if (!lead.energyBillUrl) {
    throw new ValidationError(
      "Conta de energia é obrigatória para agendar visita técnica",
    );
  }
  return true;
};

// Não pode gerar proposta sem validação técnica
const canAdvanceToProposalGenerated = (opportunity: Opportunity): boolean => {
  if (!opportunity.technicalProposal?.validatedByEng) {
    throw new ValidationError(
      "Proposta técnica deve ser validada por engenharia antes de envio",
    );
  }
  return true;
};
```

**Justificativa:** Evita atalhos que comprometem a qualidade do processo comercial e geram retrabalho futuro.

#### **Lead Scoring Automático**

```typescript
const calculateEngagementScore = (lead: Lead): number => {
  let score = 0;

  // Dados completos (+20)
  if (lead.email && lead.phone && lead.city) score += 20;

  // Origem qualificada (+30)
  if (lead.source === "ACADEMY") score += 30;

  // Interações recentes (+10 por interação, max 40)
  const recentInteractions = lead.interactions.filter((i) =>
    isWithinDays(i.createdAt, 7),
  );
  score += Math.min(recentInteractions.length * 10, 40);

  // Perfil técnico (+10)
  if (lead.technicalProfile) score += 10;

  return Math.min(score, 100);
};
```

**Justificativa:** Automatiza a priorização de leads, permitindo que vendedores foquem nos contatos mais promissores.

### 3. Features de UI

#### **Mission Control**

- Dashboard de metas por missão
- Ranking de vendedores
- Mapa de calor de leads por região
- Gamificação (badges, conquistas)

#### **Pipeline Kanban**

- Drag-and-drop entre estágios
- Validações em tempo real
- Indicadores visuais de scoring
- Filtros por missão, vendedor, região

#### **Solar Wizard**

- Wizard de 6 etapas para propostas fotovoltaicas
- Integração com mapa (Leaflet)
- Cálculos automáticos de dimensionamento
- Geração de PDF profissional

---

## Consequências

### Positivas ✅

1. **Processo Comercial Estruturado:** Funil claro com validações obrigatórias
2. **Redução de Retrabalho:** Validação técnica antes da comercialização
3. **Priorização Inteligente:** Lead scoring automático
4. **Gamificação:** Engajamento da equipe comercial via missões
5. **Rastreabilidade:** Histórico completo de interações e mudanças de estágio
6. **Integração Ops:** Deals ganhos criam projetos automaticamente

### Negativas ⚠️

1. **Complexidade Aumentada:** Mais entidades e relações no schema
2. **Curva de Aprendizado:** Equipe precisa se adaptar ao novo processo
3. **Validações Rígidas:** Podem gerar atrito inicial (intencional)
4. **Performance:** Queries mais complexas com múltiplas relações

### Mitigações 🛡️

1. **Documentação Completa:** Criação de `COMMERCIAL_VIEW_MAP.md`
2. **Treinamento:** Onboarding estruturado para equipe comercial
3. **Feedback Claro:** Mensagens de erro explicativas nas validações
4. **Otimização:** Índices no banco para queries frequentes
5. **Monitoramento:** Métricas de performance do funil

---

## Alternativas Consideradas

### Alternativa 1: CRM Externo (HubSpot, Pipedrive)

**Rejeitada:** Custo elevado, falta de customização para solar, dependência externa.

### Alternativa 2: Módulo Simplificado

**Rejeitada:** Não atenderia necessidades de crescimento, geraria dívida técnica futura.

### Alternativa 3: Microserviço Separado

**Rejeitada:** Overhead de infraestrutura, complexidade de comunicação, contrário ao ADR 001 (Monólito Modular).

---

## Referências

- [ADR 001 - Monólito Modular](./001-modular-monolith.md)
- [ADR 004 - Event-Driven Architecture](./004-event-driven-architecture.md)
- [COMMERCIAL_VIEW_MAP.md](../map_nexus_monolith/COMMERCIAL_VIEW_MAP.md)
- [CONTEXT.md - Schema Atualizado](../../CONTEXT.md)

---

## Notas de Implementação

### Migração de Dados

```sql
-- Migração de Leads existentes para novo schema
ALTER TABLE Lead ADD COLUMN engagementScore INT DEFAULT 0;
ALTER TABLE Lead ADD COLUMN city VARCHAR(255);
ALTER TABLE Lead ADD COLUMN state VARCHAR(2);

-- Criação de Opportunities para Leads em estágios avançados
INSERT INTO Opportunity (leadId, status, estimatedValue)
SELECT id, 'LEAD_QUALIFICATION', 0
FROM Lead
WHERE status IN ('QUALIFIED', 'PROPOSAL_SENT');
```

### Event Handlers

```typescript
// Evento: Deal Won → Criar Projeto
eventBus.on("opportunity.closed_won", async (opportunity) => {
  const project = await prisma.project.create({
    data: {
      title: opportunity.title,
      type: "SOLAR",
      status: "PLANEJAMENTO",
      proposalId: opportunity.technicalProposal?.id,
      // ... outros campos
    },
  });

  await auditLog.create({
    action: "PROJECT_CREATED_FROM_OPPORTUNITY",
    resourceId: project.id,
    details: { opportunityId: opportunity.id },
  });
});
```

---

**Aprovado por:** Arquitetura Neonorte | Nexus  
**Implementado em:** Wave 11-13 (2026-01-20 a 2026-01-26)

# 🔧 Criar Service Layer - Neonorte | Nexus 2.0

> **🎯 Cenário de Uso**
>
> Você precisa extrair lógica de negócio complexa do controller para um service reutilizável.
>
> **⏱️ Tempo Estimado:** 25-35 minutos

---

## 📖 Por Que Service Layer?

**Problema:** Controllers ficam muito grandes com lógica de negócio complexa.

**Solução:** Extrair para Services que podem ser:

- Reutilizados em múltiplos controllers
- Testados isoladamente
- Mantidos mais facilmente

---

## ✂️ PROMPT PRÉ-CONFIGURADO

```xml
<system_role>
  Atue como Backend Architect especializado em Clean Architecture.

  Princípios:
  - Separation of Concerns
  - Single Responsibility
  - DRY (Don't Repeat Yourself)
</system_role>

<mission>
  Criar service layer para: {{NOME_DO_SERVICE}}

  Exemplo: "Criar LeadService para calcular score de engajamento"
</mission>

<nexus_context>
  <file path="c:/Users/Neonorte Tecnologia/Documents/Meus Projetos/Neonorte/Neonorte/nexus-monolith/backend/src/modules/{{modulo}}/" />
</nexus_context>

<service_specification>
  **Nome do Service:** {{Nome}}Service
  **Responsabilidade:** {{DESCRICAO}}

  **Métodos:**
  - {{metodo1}}({{params}}) - {{descricao}}
  - {{metodo2}}({{params}}) - {{descricao}}

  **Dependências:**
  - Prisma Client
  - {{OUTRAS_DEPENDENCIAS}}
</service_specification>

<execution_protocol>
  1. **Criar Service:**
     - Classe com métodos estáticos
     - Lógica de negócio isolada
     - Sem acesso direto a req/res

  2. **Extrair Lógica do Controller:**
     - Identificar código complexo
     - Mover para service
     - Controller chama service

  3. **Adicionar Validações:**
     - Validar parâmetros
     - Lançar erros descritivos

  4. **Documentar:**
     - JSDoc em cada método
     - Exemplos de uso
</execution_protocol>

<expected_output>
  1. Service completo
  2. Controller refatorado
  3. Exemplos de uso
  4. Testes (opcional)
</expected_output>
```

---

## 📝 Implementação Passo-a-Passo

### Exemplo: LeadService (Módulo Commercial)

#### 1. Service Completo

```javascript
// backend/src/modules/commercial/services/lead.service.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class LeadService {
  /**
   * Calcula score de engajamento do lead baseado em interações
   * @param {string} leadId - ID do lead
   * @returns {Promise<number>} Score de 0 a 100
   */
  static async calculateEngagementScore(leadId) {
    const interactions = await prisma.interaction.findMany({
      where: { leadId },
      orderBy: { createdAt: "desc" },
    });

    if (interactions.length === 0) return 0;

    let score = 0;

    // Pontuação por tipo de interação
    const weights = {
      CALL: 20,
      EMAIL: 10,
      MEETING: 30,
      WHATSAPP: 15,
      VISIT: 40,
    };

    interactions.forEach((interaction) => {
      score += weights[interaction.type] || 5;
    });

    // Bonus por recência (últimos 7 dias)
    const recentInteractions = interactions.filter(
      (i) => new Date() - new Date(i.createdAt) < 7 * 24 * 60 * 60 * 1000,
    );
    score += recentInteractions.length * 5;

    // Normalizar para 0-100
    return Math.min(100, score);
  }

  /**
   * Enriquece dados do lead com informações externas
   * @param {string} leadId - ID do lead
   * @returns {Promise<object>} Lead enriquecido
   */
  static async enrichLeadData(leadId) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        interactions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        proposals: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!lead) {
      throw new Error("Lead não encontrado");
    }

    // Calcular métricas
    const engagementScore = await this.calculateEngagementScore(leadId);
    const totalProposals = lead.proposals.length;
    const lastInteractionDate = lead.interactions[0]?.createdAt || null;

    // Calcular tempo médio de resposta
    const avgResponseTime = this.calculateAvgResponseTime(lead.interactions);

    // Determinar probabilidade de conversão
    const conversionProbability = this.predictConversion(lead, engagementScore);

    return {
      ...lead,
      metrics: {
        engagementScore,
        totalProposals,
        lastInteractionDate,
        avgResponseTime,
        conversionProbability,
      },
    };
  }

  /**
   * Calcula tempo médio de resposta em horas
   * @param {Array} interactions - Lista de interações
   * @returns {number} Tempo médio em horas
   */
  static calculateAvgResponseTime(interactions) {
    if (interactions.length < 2) return null;

    const responseTimes = [];

    for (let i = 0; i < interactions.length - 1; i++) {
      const current = new Date(interactions[i].createdAt);
      const previous = new Date(interactions[i + 1].createdAt);
      const diff = (current - previous) / (1000 * 60 * 60); // horas
      responseTimes.push(diff);
    }

    const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    return Math.round(avg * 10) / 10; // 1 casa decimal
  }

  /**
   * Prediz probabilidade de conversão usando modelo simples
   * @param {object} lead - Dados do lead
   * @param {number} engagementScore - Score de engajamento
   * @returns {number} Probabilidade de 0 a 100
   */
  static predictConversion(lead, engagementScore) {
    let probability = 0;

    // Fatores que aumentam probabilidade
    if (engagementScore > 70) probability += 30;
    else if (engagementScore > 40) probability += 15;

    if (lead.proposals.length > 0) probability += 20;
    if (lead.proposals.length > 2) probability += 10;

    if (lead.source === "INDICACAO") probability += 15;
    if (lead.source === "WEBSITE") probability += 10;

    // Fator de tempo (leads mais antigos têm menor probabilidade)
    const daysSinceCreation =
      (new Date() - new Date(lead.createdAt)) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation > 90) probability -= 20;
    else if (daysSinceCreation > 30) probability -= 10;

    return Math.max(0, Math.min(100, probability));
  }

  /**
   * Sugere próxima ação para o lead
   * @param {string} leadId - ID do lead
   * @returns {Promise<object>} Sugestão de ação
   */
  static async suggestNextAction(leadId) {
    const enriched = await this.enrichLeadData(leadId);
    const { metrics, interactions, proposals } = enriched;

    // Se não tem interações recentes (> 7 dias)
    if (
      interactions.length === 0 ||
      new Date() - new Date(interactions[0].createdAt) > 7 * 24 * 60 * 60 * 1000
    ) {
      return {
        action: "CONTACT",
        priority: "HIGH",
        suggestion: "Lead sem contato recente. Agendar ligação.",
        reason: "Sem interação nos últimos 7 dias",
      };
    }

    // Se tem proposta mas não fechou
    if (proposals.length > 0 && enriched.status !== "FECHADO") {
      return {
        action: "FOLLOW_UP",
        priority: "MEDIUM",
        suggestion: "Fazer follow-up da proposta enviada.",
        reason: `${proposals.length} proposta(s) pendente(s)`,
      };
    }

    // Se engajamento alto mas sem proposta
    if (metrics.engagementScore > 60 && proposals.length === 0) {
      return {
        action: "SEND_PROPOSAL",
        priority: "HIGH",
        suggestion: "Lead engajado. Enviar proposta comercial.",
        reason: `Score de engajamento: ${metrics.engagementScore}`,
      };
    }

    // Default
    return {
      action: "NURTURE",
      priority: "LOW",
      suggestion: "Continuar nutrição do lead.",
      reason: "Lead em desenvolvimento",
    };
  }

  /**
   * Atribui lead automaticamente ao vendedor com menor carga
   * @param {string} leadId - ID do lead
   * @returns {Promise<object>} Lead atribuído
   */
  static async autoAssignLead(leadId) {
    // Buscar vendedores ativos
    const salespeople = await prisma.user.findMany({
      where: {
        role: "VENDEDOR",
        isActive: true,
      },
      include: {
        _count: {
          select: {
            assignedLeads: {
              where: {
                status: { in: ["NOVO", "CONTATO", "PROPOSTA"] },
              },
            },
          },
        },
      },
    });

    if (salespeople.length === 0) {
      throw new Error("Nenhum vendedor disponível");
    }

    // Encontrar vendedor com menor carga
    const leastBusy = salespeople.reduce((prev, current) =>
      prev._count.assignedLeads < current._count.assignedLeads ? prev : current,
    );

    // Atribuir lead
    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: {
        assignedTo: leastBusy.id,
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return updated;
  }
}

module.exports = LeadService;
```

#### 2. Controller Refatorado (Usando Service)

```javascript
// backend/src/modules/commercial/controllers/commercial.controller.js
const LeadService = require("../services/lead.service");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class CommercialController {
  /**
   * GET /api/v2/commercial/leads/:id/enriched
   * Retorna lead com dados enriquecidos
   */
  static async getEnrichedLead(req, res) {
    try {
      const { id } = req.params;

      const enriched = await LeadService.enrichLeadData(id);

      res.json({ success: true, data: enriched });
    } catch (error) {
      console.error("Error enriching lead:", error);

      if (error.message === "Lead não encontrado") {
        return res.status(404).json({ success: false, error: error.message });
      }

      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/v2/commercial/leads/:id/next-action
   * Sugere próxima ação para o lead
   */
  static async getNextAction(req, res) {
    try {
      const { id } = req.params;

      const suggestion = await LeadService.suggestNextAction(id);

      res.json({ success: true, data: suggestion });
    } catch (error) {
      console.error("Error suggesting next action:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/v2/commercial/leads/:id/auto-assign
   * Atribui lead automaticamente
   */
  static async autoAssignLead(req, res) {
    try {
      const { id } = req.params;

      const assigned = await LeadService.autoAssignLead(id);

      res.json({
        success: true,
        data: assigned,
        message: `Lead atribuído a ${assigned.assignedUser.fullName}`,
      });
    } catch (error) {
      console.error("Error auto-assigning lead:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = CommercialController;
```

---

## ✅ Checklist de Verificação

- [ ] **Service:** Classe criada com métodos estáticos
- [ ] **Lógica Isolada:** Sem acesso a req/res
- [ ] **Reutilizável:** Pode ser chamado de múltiplos controllers
- [ ] **Validações:** Parâmetros validados
- [ ] **Erros Descritivos:** Mensagens claras
- [ ] **JSDoc:** Documentação completa
- [ ] **Controller Refatorado:** Usa service
- [ ] **Testado:** Funcionamento verificado

---

## 🔗 Templates Relacionados

- **Controller:** `02_BACKEND_API/CREATE_MODULE_CONTROLLER.md`
- **Endpoint:** `02_BACKEND_API/CREATE_CUSTOM_ENDPOINT.md`
- **Tests:** `00_FOUNDATION/TEMPLATE_06_TESTS.md`

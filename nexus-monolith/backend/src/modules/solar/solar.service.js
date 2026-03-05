const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const AuditService = require("../audit/audit.service");
const OpsService = require("../ops/ops.service");
const AppError = require("../../utils/AppError");
const SolarCalculator = require("./domain/SolarCalculator");

const SolarService = {
  /**
   * Cria uma nova proposta solar vinculada a um Projeto.
   * Aplica regras de negócio de cálculo financeiro se necessário.
   * 
   * @param {Object} data - Payload validado pelo Zod
   * @param {string} userId - ID do usuário criando a proposta
   * @returns {Promise<Object>} Projeto criado
   */
  async createProposal(data, userId) {
    try {
      // 1. Regra de Negócio: Se financials não foi passado, calcular stimativa simples
      // 1. Regra de Negócio: Se financials não foi passado, calcular via Domain Service
      if (!data.financials) {
        // Parametros que não são obrigatórios no Payload mas essenciais para Calculo
        const defaults = {
          tariff: 0.95, // TODO: Buscar tabela de tarifas por Estado
          irradiation: 4.5
        };

        try {
          const calculation = SolarCalculator.calculate({
            systemSize: data.systemSize,
            tariffRate: data.tariffRate ?? defaults.tariff,
            irradiation: data.location?.irradiation ?? defaults.irradiation,
            // Mantendo custo base legado, mas agora injetado explicitamente
            costPerKwp: 3500 
          });

          data.financials = {
            totalInvestment: calculation.totalInvestment,
            monthlySavings: calculation.monthlySavings,
            paybackYears: calculation.paybackYears === null ? 0 : calculation.paybackYears // Adapter para modelo de dados (0 = infinito no legado?)
          };
        } catch (domainError) {
          throw new AppError(`Erro de Cálculo: ${domainError.message}`, 400);
        }
      }

      // 2. Persistência Transacional via OpsService (Módulo de Operações)
      const project = await OpsService.createProject({
        title: `Solar ${data.systemSize}kWp - ${data.location?.city || 'Unknown'}`,
        description: `Proposta Fotovoltaica ${data.hardware?.panelBrand || 'Padrão'}`,
        type: 'SOLAR_RESIDENCIAL',
        status: 'PROSPECT', // Status inicial de venda
        managerId: userId, // Fixed camelCase to match OpsService
        userId: userId, // Para auditoria interna do Ops
        details: { solar: data }
      });

      // 3. Auditoria de Negócio (Solar)
      AuditService.logAudit({
        userId,
        action: 'CREATE_SOLAR_PROPOSAL',
        resourceId: project.id,
        entity: 'Project',
        details: {
          systemSize: data.systemSize,
          totalInvestment: data.financials.totalInvestment
        }
      }).catch(e => console.warn(e));

      return project;
    } catch (error) {
       if (error instanceof AppError) throw error;
       console.error("[SolarService] Erro fatal:", error);
       throw new AppError("Erro ao criar proposta solar", 500);
    }
  }
};

module.exports = SolarService;

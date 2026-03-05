const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const AppError = require("../../utils/AppError");

const StrategyService = {
  // READ
  async getAll() {
    return prisma.strategy.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        keyResults: true,
        risks: true,
        children: {
          include: {
            keyResults: true,
            risks: true
          }
        }
      }
    });
  },

  async getById(id) {
    const strategy = await prisma.strategy.findUnique({
      where: { id },
      include: { keyResults: true, risks: true, children: true }
    });

    if (!strategy) throw new AppError("Estratégia não encontrada", 404);
    return strategy;
  },

  // WRITE
  async create(data, userId) {
    // Business Rule: Code Uniqueness
    if (data.code) {
      const exists = await prisma.strategy.findUnique({ where: { code: data.code } });
      if (exists) {
        throw new AppError("Código de estratégia já existe", 409);
      }
    } else {
      // Auto-generate code if missing
      data.code = `STRAT-${Date.now().toString().slice(-4)}`;
    }

    const { keyResults, ...strategyData } = data;

    const newStrategy = await prisma.strategy.create({
      data: {
        ...strategyData,
        keyResults: keyResults ? {
            create: keyResults
        } : undefined
      },
      include: { keyResults: true }
    });

    console.log(`[STRATEGY] Created by ${userId || 'system'}: ${newStrategy.title}`);
    return newStrategy;
  },

  async update(id, data) {
    // Note: We don't support updating nested KRs here directly for simplicity.
    const { keyResults, ...updateData } = data;

    try {
        const updated = await prisma.strategy.update({
            where: { id },
            data: updateData
        });
        return updated;
    } catch (error) {
        if (error.code === 'P2025') throw new AppError("Estratégia não encontrada", 404);
        throw new AppError("Erro ao atualizar estratégia", 500);
    }
  },

  async delete(id) {
    try {
        await prisma.strategy.delete({ where: { id } });
    } catch (error) {
        if (error.code === 'P2025') throw new AppError("Estratégia não encontrada", 404);
        // P2003 = ForeignKey constraint failed (has children or linked KRs)
        if (error.code === 'P2003') throw new AppError("Não é possível excluir estratégia pois possui dependências (KRs ou Filhos)", 400);
        throw new AppError("Erro ao excluir estratégia", 500);
    }
  }
};

module.exports = StrategyService;

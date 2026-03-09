const prisma = require('../../../lib/prisma');
const { withTenant } = require('../../../lib/prisma');
const AppError = require("../../../utils/AppError");

const StrategyService = {
  // READ
  async getAll() {
    return withTenant(async (tx) => {
      return tx.strategy.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          owner: { select: { id: true, fullName: true } },
          keyResults: {
            include: {
              owner: { select: { id: true, fullName: true } },
              checkIns: {
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { id: true, fullName: true } } }
              }
            }
          },
          risks: true,
          children: {
            include: {
              owner: { select: { id: true, fullName: true } },
              keyResults: {
                include: {
                  owner: { select: { id: true, fullName: true } },
                  checkIns: {
                    orderBy: { createdAt: 'desc' },
                    include: { user: { select: { id: true, fullName: true } } }
                  }
                }
              },
              risks: true
            }
          }
        }
      });
    });
  },

  async getById(id) {
    const strategy = await withTenant(async (tx) => {
      return tx.strategy.findUnique({
        where: { id },
        include: {
          owner: { select: { id: true, fullName: true } },
          keyResults: {
            include: {
              owner: { select: { id: true, fullName: true } },
              checkIns: {
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { id: true, fullName: true } } }
              }
            }
          },
          risks: true,
          children: true
        }
      });
    });

    if (!strategy) throw new AppError("Estratégia não encontrada", 404);
    return strategy;
  },

  // WRITE
  async create(data, userId) {
    return withTenant(async (tx) => {
      // Business Rule: Code Uniqueness
      if (data.code) {
        const exists = await tx.strategy.findUnique({ where: { code: data.code } });
        if (exists) {
          throw new AppError("Código de estratégia já existe", 409);
        }
      } else {
        // Auto-generate code if missing
        data.code = `STRAT-${Date.now().toString().slice(-4)}`;
      }

      const { keyResults, ...strategyData } = data;

      const newStrategy = await tx.strategy.create({
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
    });
  },

  async update(id, data) {
    const { keyResults, ...updateData } = data;

    try {
      return await withTenant(async (tx) => {
        return tx.strategy.update({
          where: { id },
          data: updateData
        });
      });
    } catch (error) {
      if (error.code === 'P2025') throw new AppError("Estratégia não encontrada", 404);
      throw new AppError("Erro ao atualizar estratégia", 500);
    }
  },

  async delete(id) {
    try {
      await withTenant(async (tx) => {
        return tx.strategy.delete({ where: { id } });
      });
    } catch (error) {
      if (error.code === 'P2025') throw new AppError("Estratégia não encontrada", 404);
      if (error.code === 'P2003') throw new AppError("Não é possível excluir estratégia pois possui dependências (KRs ou Filhos)", 400);
      throw new AppError("Erro ao excluir estratégia", 500);
    }
  },

  async createCheckIn(keyResultId, data, userId) {
    return withTenant(async (tx) => {
      // 1. Fetch current KR to get the previous value
      const kr = await tx.keyResult.findUnique({
        where: { id: keyResultId }
      });

      if (!kr) {
        throw new AppError("Key Result não encontrado", 404);
      }

      // 2. Create the CheckIn record
      const checkIn = await tx.keyResultCheckIn.create({
        data: {
          keyResultId,
          userId,
          previousValue: kr.currentValue,
          newValue: data.newValue,
          comment: data.comment
        },
        include: {
          user: { select: { id: true, fullName: true } }
        }
      });

      // 3. Update the KR's current value
      await tx.keyResult.update({
        where: { id: keyResultId },
        data: {
          currentValue: data.newValue,
          lastUpdatedAt: new Date()
        }
      });

      console.log(`[STRATEGY] KR Check-in by ${userId}: KR ${keyResultId} changed from ${kr.currentValue} to ${data.newValue}`);

      return checkIn;
    });
  }
};

module.exports = StrategyService;

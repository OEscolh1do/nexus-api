const AppError = require('../../../utils/AppError');
const { withTenant } = require('../../../lib/prisma');

const FinService = {
    /**
     * Records a new immutable transaction in the PostgreSQL Ledger.
     * L8 SEC-OPS PATCH: Now uses `withTenant` ensuring strict RLS isolation.
     */
    async recordTransaction(data, userId) {
        const { type, amount, category, description, date } = data;

        if (!['CREDIT', 'DEBIT'].includes(type)) {
            throw new AppError("Invalid transaction type. Must be CREDIT or DEBIT.", 400);
        }

        if (!amount || isNaN(amount) || amount <= 0) {
            throw new AppError("Invalid amount. Must be positive number.", 400);
        }

        return await withTenant(async (tx) => {
            return tx.ledgerEntry.create({
                data: {
                    type,
                    amount: parseFloat(amount),
                    category: category || 'General',
                    description: description || '',
                    date: date ? new Date(date) : new Date(),
                    userId: userId || 'system'
                }
            });
        });
    },

    /**
     * Reads Ledger entries safely scoped to the Tenant.
     */
    async getLedger({ startDate, endDate } = {}) {
        const filters = {};

        if (startDate || endDate) {
            filters.date = {};
            if (startDate) filters.date.gte = new Date(startDate);
            if (endDate) filters.date.lte = new Date(endDate);
        }

        return await withTenant(async (tx) => {
            return tx.ledgerEntry.findMany({
                where: filters,
                orderBy: { date: 'desc' },
                take: 5000 // Anti-OOM limit
            });
        });
    },

    /**
     * Calculates realtime balances via SQL Aggregation per Tenant.
     */
    async getBalance() {
        // Usando SQL Aggregation em vez de carregar tudo pra Heap V8
        const metrics = await withTenant(async (tx) => {
            return tx.ledgerEntry.groupBy({
                by: ['type'],
                _sum: { amount: true },
                _count: { id: true }
            });
        });

        let income = 0;
        let expenses = 0;
        let count = 0;

        for (const group of metrics) {
            if (group.type === 'CREDIT') income += group._sum.amount || 0;
            if (group.type === 'DEBIT') expenses += group._sum.amount || 0;
            count += group._count.id;
        }

        return {
            total: income - expenses,
            income,
            expenses,
            count
        };
    }
};

module.exports = FinService;

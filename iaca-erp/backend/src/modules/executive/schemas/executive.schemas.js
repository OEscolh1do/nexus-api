const { z } = require("zod");

// Para futuras validações de Body ou Query Params no Módulo Executivo
const dateRangeQuerySchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
});

module.exports = {
    dateRangeQuerySchema,
};

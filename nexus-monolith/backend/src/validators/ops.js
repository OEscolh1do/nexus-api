const { z } = require("zod");

const getWorkloadSchema = z.object({
  query: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date format (YYYY-MM-DD)").optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date format (YYYY-MM-DD)").optional(),
    projectId: z.string().uuid().optional(),
  }),
});

module.exports = {
  getWorkloadSchema,
};

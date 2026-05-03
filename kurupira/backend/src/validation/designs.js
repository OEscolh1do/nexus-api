const { z } = require('zod');

// Schema mínimo para designData — campos extras passam (passthrough)
const designDataSchema = z.object({
  solar: z.object({
    clientData: z.object({
      averageConsumption: z.number().nonnegative().optional(),
      lat: z.number().min(-90).max(90).optional().nullable(),
      lng: z.number().min(-180).max(180).optional().nullable(),
      clientName: z.string().max(500).optional().nullable(),
      city: z.string().max(200).optional().nullable(),
      state: z.string().length(2).optional().nullable(),
      voltage: z.string().optional().nullable(),
    }).passthrough().optional(),
    modules: z.object({
      ids: z.array(z.string()).optional(),
      entities: z.record(z.any()).optional(),
    }).passthrough().optional(),
  }).passthrough().optional(),
  tech: z.object({
    kWpAlvo: z.number().nonnegative().optional(),
    inverters: z.object({
      ids: z.array(z.string()).optional(),
    }).passthrough().optional(),
    // Performance Ratio (PR) do sistema — padrão 0.75 (conservador para clima tropical)
    performanceRatio: z.number().min(0.4).max(1.0).optional(),
  }).passthrough().optional(),
}).passthrough().optional();

const createDesignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  iacaLeadId: z.string().cuid().optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});

const updateDesignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  status: z.enum(['DRAFT', 'IN_REVIEW', 'APPROVED', 'ARCHIVED']).optional(),
  notes: z.string().max(5000).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  designData: designDataSchema,
});

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
      return res.status(400).json({ success: false, error: 'Validation error', details: errors });
    }
    req.body = result.data;
    next();
  };
}

module.exports = { createDesignSchema, updateDesignSchema, designDataSchema, validate };

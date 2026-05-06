const { z } = require('zod');

// Schema ultra-permissivo para designData para evitar erros internos do Zod
const designDataSchema = z.any().optional().nullable();

const createDesignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  iacaLeadId: z.string().cuid().optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});

const updateDesignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'IN_REVIEW', 'APPROVED', 'ARCHIVED']).optional(),
  notes: z.string().max(5000).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  designData: designDataSchema,
}).passthrough(); // Garante que campos extras não quebrem o schema

function validate(schema) {
  return (req, res, next) => {
    if (!schema) {
      return res.status(500).json({ success: false, error: 'Validation schema is undefined' });
    }
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
        return res.status(400).json({ success: false, error: 'Validation error', details: errors });
      }
      req.body = result.data;
      next();
    } catch (err) {
      console.error('[Validation Middleware] Crash:', err);
      res.status(500).json({ success: false, error: 'Validation middleware crashed: ' + err.message });
    }
  };
}

module.exports = { createDesignSchema, updateDesignSchema, designDataSchema, validate };

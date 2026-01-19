import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validateSync = (schema: ZodSchema<any>) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = (error as any).errors || (error as any).issues || [];
      
      // DEBUG LOG
      console.error("❌ Validation Failed:", JSON.stringify(issues, null, 2));
      console.error("📩 Payload:", { ...req.body, password: '[REDACTED]' });

      return res.status(422).json({
        error: 'Data Validation Failed',
        details: issues.map((e: any) => ({
          field: e.path ? e.path.join('.') : 'unknown',
          message: e.message,
        })),
      });
    }
    next(error);
  }
};

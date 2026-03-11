import { z } from "zod";

export const ModuleSpecsSchema = z.object({
  id: z.string(),
  quantity: z.number().int().positive(),
  supplier: z.string().min(1),
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  type: z.string(),
  power: z.number().int().min(100).max(800),
  efficiency: z.number().positive().max(30),
  cells: z.number().int().positive(),
  imp: z.number().positive().max(20),
  vmp: z.number().positive().max(100),
  isc: z.number().positive().max(20),
  voc: z.number().positive().max(100),
  weight: z.number().positive(),
  area: z.number().positive(),
  dimensions: z.string(),
  inmetroId: z.string(),
  maxFuseRating: z.number().positive(),
  tempCoeff: z.number(),
  annualDepreciation: z.number().min(0).max(0.05),
});

export const InverterSpecsSchema = z.object({
  id: z.string(),
  quantity: z.number().int().positive(),
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  maxInputVoltage: z.number().positive().max(1500),
  minInputVoltage: z.number().positive(),
  maxInputCurrent: z.number().positive(),
  outputVoltage: z.number().positive(),
  outputFrequency: z.number().positive(),
  maxOutputCurrent: z.number().positive(),
  nominalPower: z.number().positive().max(500),
  maxEfficiency: z.number().positive().max(100),
  weight: z.number().positive(),
  connectionType: z.string(),
});

export type ModuleSpecs = z.infer<typeof ModuleSpecsSchema>;
export type InverterSpecs = z.infer<typeof InverterSpecsSchema>;

import { z } from 'zod';

export const ModuleElectricalSchema = z.object({
  pmax: z.number().min(100).max(1000), // Wp
  voc: z.number().min(10).max(100), // V
  vmp: z.number().min(10).max(100), // V
  isc: z.number().min(1).max(30), // A
  imp: z.number().min(1).max(30), // A
  tempCoeffVoc: z.number().min(-0.01).max(0), // %/°C
  tempCoeffPmax: z.number().optional(),
  maxFuseRating: z.number().optional(), // A
  efficiency: z.number().min(0.1).max(0.3).optional(),
});

export const ModulePhysicalSchema = z.object({
  widthMm: z.number().min(100).max(3000),
  heightMm: z.number().min(100).max(4000),
  depthMm: z.number().min(10).max(100),
  weightKg: z.number().min(5).max(50),
  frameType: z.enum(['aluminum', 'frameless']).optional(),
  cells: z.number().int().min(36).max(200).optional(),
});

export const ModuleAssetSchema = z.object({
  glbAsset: z.string().optional(),
  featureId: z.string().optional(),
});

export const ModuleCatalogItemSchema = z.object({
  id: z.string().min(1),
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  imageUrl: z.string().optional(),
  unifilarSymbolRef: z.string().optional(),
  electrical: ModuleElectricalSchema,
  physical: ModulePhysicalSchema,
  asset: ModuleAssetSchema.optional(),
});

export type ModuleCatalogItem = z.infer<typeof ModuleCatalogItemSchema>;
// Kept for backward compatibility with components that map to the old flat version if needed during migration
export const moduleDatabaseSchema = z.array(ModuleCatalogItemSchema);

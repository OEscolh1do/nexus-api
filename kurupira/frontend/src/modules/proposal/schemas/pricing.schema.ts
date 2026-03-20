import { z } from 'zod';

export const PricingModelSchema = z.enum(['margin', 'cost_plus', 'fixed_kit']);

export const EngineeringSettingsSchema = z.object({
    // Technical Defaults
    performanceRatio: z.number().min(0.5).max(1.0).default(0.75),
    cableLoss: z.number().min(0).max(0.1).default(0.02),
    
    // Hardware Costs
    referenceKitPricePerKwp: z.number().nonnegative(),
    bosPricePerKwp: z.number().nonnegative().default(0),
    structurePricePerModule: z.number().nonnegative().default(0),
    
    // Service Costs (Operational)
    serviceUnitModule: z.number().nonnegative(),
    serviceUnitStructure: z.number().nonnegative(),
    serviceUnitInverter: z.number().nonnegative(),
    
    // Project & Admin (Soft Costs)
    serviceProjectBase: z.number().nonnegative(),
    serviceProjectPercent: z.number().min(0).max(100).default(0),
    serviceAdminBase: z.number().nonnegative(),
    serviceAdminPercent: z.number().min(0).max(100).default(0),
    serviceMaterialsPercent: z.number().min(0).max(1).default(0.20),
    
    // Extras
    infrastructureUpgradeCost: z.number().nonnegative().default(0),
    extraMaterialsCost: z.number().nonnegative().default(0),
    
    // Commercial Strategy
    pricingModel: PricingModelSchema.default('margin'),
    marginPercentage: z.number().min(0).max(100).default(0.23), // 23%
    serviceMarkup: z.number().min(0).max(100).default(0.30),
    serviceCommissionFixed: z.number().nonnegative().default(0),
    commissionPercentage: z.number().min(0).max(100).default(0),
    
    // Tax
    taxPercentage: z.number().min(0).max(100).default(0.06), // 6% Simples
});

export type PricingSettings = z.infer<typeof EngineeringSettingsSchema>;

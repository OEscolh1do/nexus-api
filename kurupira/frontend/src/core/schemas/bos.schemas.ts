/**
 * BOS.SCHEMAS.TS - Balance of System
 * Schema de Inventário Elétrico (Cabeamento, Proteções, String Box)
 * 
 * Responsabilidade: Definir validação Zod para componentes elétricos
 * que compõem o sistema além dos módulos e inversores.
 * 
 * NOTA CRÍTICA: Sem este schema, o orçamento do FinanceModule era impreciso!
 * O custo de cabeamento e proteções pode representar 10-15% do sistema.
 * 
 * Referência: NBR 16274 (Sistemas Fotovoltaicos - Requisitos de Projeto)
 */

import { z } from "zod";

/**
 * Schema de especificação de cabo elétrico
 * 
 * // ATENÇÃO: A queda de tensão CC deve ser < 1% para eficiência máxima
 * //          A queda de tensão CA deve ser < 3% conforme norma
 */
export const CableSpecSchema = z.object({
  /** Tipo de corrente: CC (string) ou CA (inversor -> quadro) */
  type: z.enum(["CC", "CA"]),

  /**
   * Bitola do cabo (seção transversal)
   * Valores típicos: 4mm², 6mm², 10mm², 16mm², 25mm²
   */
  gauge: z.string()
    .min(1, "Bitola é obrigatória")
    .describe("Bitola do cabo (ex: '6mm²', '10mm²')"),

  /** Comprimento total do cabo em metros */
  lengthMeters: z.number()
    .positive("Comprimento deve ser positivo"),

  /**
   * Corrente máxima suportada pelo cabo (Ampères)
   * Deve ser >= corrente de curto-circuito da string (Isc)
   */
  maxCurrentAmps: z.number()
    .positive("Corrente máxima deve ser positiva"),

  /**
   * Queda de tensão percentual no trecho
   * CC: máx 1% recomendado | CA: máx 3% por norma
   * 
   * // FÓRMULA: ΔV = (2 * L * I * ρ) / S
   * // Onde: L=comprimento, I=corrente, ρ=resistividade, S=seção
   */
  voltageDrop: z.number()
    .min(0, "Queda não pode ser negativa")
    .max(0.05, "Queda > 5% é inaceitável")
    .describe("Queda de tensão percentual (<3% CA, <1% CC)"),
});

/**
 * Schema de String Box / Caixa de Junção
 * Componente que agrupa strings antes do inversor
 */
export const StringBoxSchema = z.object({
  /** Modelo/fabricante da String Box */
  model: z.string().min(1, "Modelo é obrigatório"),

  /** Número de strings que a caixa comporta */
  strings: z.number()
    .int("Número de strings deve ser inteiro")
    .positive("Deve haver ao menos 1 string"),

  /**
   * Tensão máxima suportada (V)
   * Deve ser > Voc máximo calculado por temperatura
   */
  maxVoltage: z.number()
    .positive("Tensão máxima deve ser positiva"),

  /** Corrente máxima por string (A) */
  maxCurrent: z.number()
    .positive("Corrente máxima deve ser positiva"),

  /**
   * Possui DPS (Dispositivo de Proteção contra Surtos)?
   * Obrigatório para sistemas > 10kWp ou em áreas com alta incidência de raios
   */
  hasSurgeProtection: z.boolean().default(true),
});

/**
 * Schema de disjuntor/fusível
 * Proteção de sobrecorrente para circuitos CC e CA
 */
export const BreakerSchema = z.object({
  /** Tipo de circuito protegido */
  type: z.enum(["DC", "AC"]),

  /** Corrente nominal do disjuntor (A) */
  currentRating: z.number()
    .positive("Corrente nominal deve ser positiva"),

  /**
   * Número de polos
   * DC: 2P (positivo + negativo)
   * AC Mono: 2P | AC Bi: 3P | AC Tri: 4P
   */
  poles: z.number()
    .int()
    .min(1, "Mínimo 1 polo")
    .max(4, "Máximo 4 polos"),
});

/**
 * Schema principal de inventário BOS
 * Agrupa todos os componentes elétricos do sistema
 * 
 * // IMPORTANTE: Este schema é usado pelo ElectricalModule (nova aba)
 * //             e alimenta o cálculo de custo no FinanceModule
 */
export const BOSInventorySchema = z.object({
  /** Cabos do lado CC (strings -> inversor) */
  dcCables: z.array(CableSpecSchema).default([]),

  /** Cabos do lado CA (inversor -> quadro de distribuição) */
  acCables: z.array(CableSpecSchema).default([]),

  /** String Box (opcional para sistemas pequenos) */
  stringBox: StringBoxSchema.optional(),

  /** Disjuntores/fusíveis de proteção */
  breakers: z.array(BreakerSchema).default([]),

  /**
   * Sistema de aterramento instalado?
   * Obrigatório por norma para todos os sistemas FV
   */
  groundingSystem: z.boolean().default(true),

  /**
   * Custo total estimado dos componentes BOS (R$)
   * Calculado automaticamente, mas pode ser sobrescrito manualmente
   */
  estimatedCost: z.number().nonnegative().optional(),
});

// Tipos TypeScript inferidos - use estes em toda a aplicação
export type CableSpec = z.infer<typeof CableSpecSchema>;
export type StringBox = z.infer<typeof StringBoxSchema>;
export type Breaker = z.infer<typeof BreakerSchema>;
export type BOSInventory = z.infer<typeof BOSInventorySchema>;

/**
 * ENGINEERING CONSTANTS — Kurupira Solar Engine
 * Centralização de parâmetros físicos e normas técnicas para evitar "Magic Numbers".
 */

export const ENGINEERING_CONSTANTS = {
  // ── FIAÇÃO CC ─────────────────────────────────────────────────────────────
  /** Condutividade do Cobre (sigma) em m/(Ohm.mm²) a 20°C */
  COPPER_CONDUCTIVITY: 56,
  
  /** Bitolas comerciais padrão para cabos solares CC (mm²) */
  COMMERCIAL_CABLE_SECTIONS: [4, 6, 10, 16, 25],

  // ── MÓDULOS FOTOVOLTAICOS (FALLBACKS) ─────────────────────────────────────
  /** Coeficiente de Temperatura Voc (padrão conservador se omitido) [%/°C] */
  DEFAULT_TEMP_COEFF_VOC: -0.29,
  
  /** Coeficiente de Temperatura Vmp (padrão conservador se omitido) [%/°C] */
  DEFAULT_TEMP_COEFF_VMP: -0.34,
  
  /** Temperatura Nominal de Operação da Célula [°C] */
  DEFAULT_NOCT: 45,
  
  /** Albedo padrão para cálculos de bifacialidade (solo genérico) */
  DEFAULT_ALBEDO: 0.2,

  // ── PERDAS E RENDIMENTOS ──────────────────────────────────────────────────
  /** Fator de queda de tensão simulado em cabos CC (1.5% de perda) */
  CC_VOLTAGE_DROP_FACTOR: 0.985,
  
  /** Relação Vmp/Voc estimada quando Vmp não é fornecido pelo catálogo */
  VMP_VOC_RATIO_ESTIMATE: 0.82,
};

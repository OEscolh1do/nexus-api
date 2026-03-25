/**
 * ENGINEERING-INPUT.SCHEMAS.TS
 * Schema de Geometria Solar para o domínio de Engenharia
 * 
 * Responsabilidade: Definir validação Zod para dados que afetam diretamente
 * o cálculo de geração fotovoltaica (orientação, azimute, inclinação).
 * 
 * NOTA: Estes campos foram segregados do InputDataSchema (CRM) porque:
 * 1. A orientação afeta diretamente a curva de geração (SolarCharts)
 * 2. Um vendedor pode errar o azimute; o engenheiro deve validar na simulação
 * 3. A inclinação do telhado é vital para o cálculo do Performance Ratio real
 */

import { z } from "zod";

/**
 * Enum de orientações cardeais e intercardeais
 * // Pergunta: Por que não usar apenas graus de azimute?
 * // Resposta: A interface precisa de labels amigáveis, e o azimute numérico
 * //           é calculado internamente a partir desta seleção inicial.
 */
export const OrientationType = z.enum([
  "Norte",
  "Leste",
  "Oeste",
  "Sul",
  "Nordeste",
  "Noroeste",
  "Sudeste",
  "Sudoeste"
]);

/**
 * Schema principal de inputs de engenharia
 * Estes dados alimentam o TechModule e são persistidos separadamente do CRM
 */
export const EngineeringInputSchema = z.object({
  /**
   * Orientação da face principal do arranjo fotovoltaico
   * Impacta diretamente o fator de orientação no cálculo de geração
   */
  orientation: OrientationType,

  /**
   * Ângulo do azimute solar em graus (0-360)
   * 0° = Norte, 90° = Leste, 180° = Sul, 270° = Oeste
   * 
   * // ATENÇÃO: Este valor pode ser refinado pelo engenheiro após
   * //          análise de imagem de satélite no GeoLocationWidget
   */
  azimute: z.number()
    .min(0, "Azimute deve ser >= 0°")
    .max(360, "Azimute deve ser <= 360°")
    .describe("Ângulo do azimute solar em graus"),

  /**
   * Inclinação do telhado em graus (0-90)
   * 0° = Horizontal, 90° = Vertical
   * 
   * // CRÍTICO: Faltava este campo no sistema anterior!
   * //          Sem inclinação, o PR calculado era impreciso.
   */
  roofTilt: z.number()
    .min(0, "Inclinação deve ser >= 0°")
    .max(90, "Inclinação deve ser <= 90°")
    .describe("Inclinação do telhado em graus"),

  /**
   * Fator de sombreamento (0-1)
   * 0 = Sem sombra (ideal)
   * 1 = Sombra total (não instalável)
   * 
   * // NOTA: Valores > 0.3 devem gerar alerta no SystemHealthCheck
   */
  shadingFactor: z.number()
    .min(0, "Fator de sombreamento deve ser >= 0")
    .max(1, "Fator de sombreamento deve ser <= 1")
    .default(0)
    .describe("Fator de sombreamento (0 = sem sombra, 1 = sombra total)"),
});

// Tipo TypeScript inferido do schema - use este em toda a aplicação
export type EngineeringInput = z.infer<typeof EngineeringInputSchema>;
export type OrientationValue = z.infer<typeof OrientationType>;

/**
 * Mapa de conversão: Orientação -> Azimute padrão
 * Usado quando o usuário seleciona uma orientação e o sistema precisa
 * definir um azimute inicial antes do refinamento manual
 */
export const ORIENTATION_TO_AZIMUTH: Record<OrientationValue, number> = {
  Norte: 0,
  Nordeste: 45,
  Leste: 90,
  Sudeste: 135,
  Sul: 180,
  Sudoeste: 225,
  Oeste: 270,
  Noroeste: 315,
};

/**
 * P6-1: Schema estrutural para configuração de Strings (MPPTs)
 * Valida limites lógicos/estruturais base independentemente do equipamento (Inversor). 
 * Restrições térmicas/elétricas finas ocorrem em runtime via electricalMath.ts.
 */
export const StringConfigSchema = z.object({
  mpptId: z.number().int().positive("MPPT ID deve ser positivo"),
  stringsCount: z.number().int().nonnegative("Número de strings não pode ser negativo"),
  modulesPerString: z.number().int().nonnegative("Módulos por string não pode ser negativo"),
  azimuth: z.number().min(0, "Azimute >= 0").max(360, "Azimute <= 360").optional(),
  inclination: z.number().min(0, "Inclinação >= 0").max(90, "Inclinação <= 90").optional(),
}).refine(data => {
  // Structural constraints validation (prevent runaway inputs)
  return data.modulesPerString <= 100 && data.stringsCount <= 20;
}, {
  message: "Limitação estrutural excedida: Máx 100 módulos por série, 20 strings em paralelo.",
  path: ["modulesPerString"]
});

export type StringConfigInput = z.infer<typeof StringConfigSchema>;


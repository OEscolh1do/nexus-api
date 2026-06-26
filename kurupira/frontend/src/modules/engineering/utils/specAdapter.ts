import { ENGINEERING_CONSTANTS } from '../constants/engineeringConstants';

export const getModuleSpecs = (m: any) => {
  if (!m) return null;
  return {
    voc:          m.voc,
    vmp:          m.vmp ?? m.voc * ENGINEERING_CONSTANTS.VMP_VOC_RATIO_ESTIMATE,
    isc:          m.isc ?? 0,
    imp:          m.imp ?? m.isc * 0.95,
    pmax:         m.power ?? (m as any).pmax ?? 0,
    tempCoeffVoc: m.tempCoeffVoc ?? (m as any).electrical?.tempCoeffVoc ?? ENGINEERING_CONSTANTS.DEFAULT_TEMP_COEFF_VOC,
    tempCoeffPmax: m.tempCoeffPmax ?? (m as any).electrical?.tempCoeffPmax ?? m.tempCoeff ?? ENGINEERING_CONSTANTS.DEFAULT_TEMP_COEFF_VMP,
    noct:         (m as any).noct ?? ENGINEERING_CONSTANTS.DEFAULT_NOCT,
    isBifacial:   (m as any).isBifacial ?? false,
    albedo:       ENGINEERING_CONSTANTS.DEFAULT_ALBEDO,
  };
};

/** Type-safe shape returned by getModuleSpecs (non-null). */
export type ModuleSpecs = NonNullable<ReturnType<typeof getModuleSpecs>>;

/** Type guard — narrows an unknown value to ModuleSpecs. */
export function isModuleSpecs(v: unknown): v is ModuleSpecs {
  if (!v || typeof v !== 'object') return false;
  const s = v as Record<string, unknown>;
  return typeof s.voc === 'number' && typeof s.isc === 'number';
}

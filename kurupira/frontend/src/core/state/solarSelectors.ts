/**
 * =============================================================================
 * SOLAR SELECTORS — Seletores Estáveis (PGFX-04)
 * =============================================================================
 *
 * Seletores memoizados para evitar re-renders desnecessários.
 * Substitui chamadas diretas a toArray() e Object.values() que
 * reconstroem arrays a cada render.
 *
 * Corrige:
 * - A5: SolarLayer com seletores instáveis
 * - A9: Seletores existentes (selectModules/selectInverters) já instáveis
 *
 * Uso:
 *   const modules = useSolarStore(selectModulesStable);
 *   // → Só reconstrói o array se state.modules.entities mudar
 * =============================================================================
 */

import type { SolarState } from './solarStore';

/**
 * Cache manual para seletores estáveis.
 * Evita dependência de `reselect` enquanto não instalado.
 *
 * Padrão: memoiza com base na referência do input.
 * Se o input não mudou, retorna o output cacheado.
 */
function createMemoSelector<TInput, TOutput>(
  inputFn: (state: SolarState) => TInput,
  transform: (input: TInput) => TOutput,
): (state: SolarState) => TOutput {
  let lastInput: TInput | undefined;
  let lastOutput: TOutput;

  return (state: SolarState) => {
    const input = inputFn(state);
    if (input !== lastInput) {
      lastInput = input;
      lastOutput = transform(input);
    }
    return lastOutput;
  };
}

// =============================================================================
// SELETORES ESTÁVEIS — Substituem toArray() direto
// =============================================================================

/** Módulos como array — só reconstrói se entities mudar */
export const selectModulesStable = createMemoSelector(
  (s) => s.modules.entities,
  (entities) => Object.values(entities).filter(Boolean),
);

/** Inversores como array — só reconstrói se entities mudar */
export const selectInvertersStable = createMemoSelector(
  (s) => s.inverters.entities,
  (entities) => Object.values(entities).filter(Boolean),
);

/** Itens simulados como array — só reconstrói se entities mudar */
export const selectSimulatedItemsStable = createMemoSelector(
  (s) => s.simulatedItems.entities,
  (entities) => Object.values(entities).filter(Boolean),
);

// =============================================================================
// SELETORES DE PROJETO (PGFX-02)
// =============================================================================

/** Coordenadas do sítio */
export const selectCoordinates = (s: SolarState) => s.project.coordinates;

/** Polígono do telhado */
export const selectRoofPolygon = (s: SolarState) => s.project.roofPolygon;

/** Azimute físico do telhado */
export const selectRoofAzimuth = (s: SolarState) => s.project.roofAzimuth;

/** Zoom do mapa */
export const selectZoom = (s: SolarState) => s.project.zoom;

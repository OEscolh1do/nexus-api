/**
 * Layer2BlockDiagram.tsx — WITH SKILL (spec-guided)
 *
 * Layer 2 do PhysicalCanvasView do Kurupira.
 * Segue exatamente a spec: nomes de store, tokens de cor, termos em português,
 * painel lateral com translateX, banner âmbar, CTA rodapé.
 */

import React, { useMemo, useState, useCallback } from 'react';

// ─── STUBS (substituir por imports reais do store) ────────────────────────────

interface PhysicalArrangement {
  id: string;
  name: string;
  orientation: { azimuth: number; tilt: number };
  surfaceType: 'ceramica' | 'metalico' | 'fibrocimento' | 'laje' | 'ground' | 'carport';
}

interface StringGroup {
  id: string;
  nodeIds: string[];
  mpptConfigId?: string;
  orientationWarning: boolean;
}

interface MPPTConfig {
  id: string;
  inverterId: string;
  mpptIndex: number;
  stringGroupIds: string[];
}

interface ModuleModel {
  vocStc: number;
  tempCoeffVoc: number;
  iscStc: number;
}

interface InverterModel {
  id: string;
  model: string;
  powerKw: number;
  maxVocInput: number;
}

interface ValidationIssue {
  code: string;
  severity: 'error' | 'warning';
  message: string;
  affectedIds: string[];
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

// ── Demo stubs ────────────────────────────────────────────────────────────────

function useSolarStore_arrangements(): PhysicalArrangement[] {
  return useMemo(() => [
    { id: 'area-1', name: 'Área 1', orientation: { azimuth: 180, tilt: 14 }, surfaceType: 'ceramica' },
    { id: 'area-2', name: 'Área 2', orientation: { azimuth: 90, tilt: 14 }, surfaceType: 'ceramica' },
  ], []);
}

function useSolarStore_mpptConfigs(): MPPTConfig[] {
  return useMemo(() => [
    { id: 'mppt-1', inverterId: 'inv-1', mpptIndex: 0, stringGroupIds: ['S1', 'S2'] },
    { id: 'mppt-2', inverterId: 'inv-1', mpptIndex: 1, stringGroupIds: ['S3'] },
  ], []);
}

function useSolarStore_strings(): StringGroup[] {
  return useMemo(() => [
    { id: 'S1', nodeIds: Array.from({ length: 10 }, (_, i) => `n-${i}`),   mpptConfigId: 'mppt-1', orientationWarning: false },
    { id: 'S2', nodeIds: Array.from({ length: 10 }, (_, i) => `n-${i+10}`), mpptConfigId: 'mppt-1', orientationWarning: false },
    { id: 'S3', nodeIds: Array.from({ length: 6  }, (_, i) => `n-${i+20}`), mpptConfigId: 'mppt-2', orientationWarning: false },
  ], []);
}

function useSolarStore_inverters(): InverterModel[] {
  return useMemo(() => [{ id: 'inv-1', model: 'Huawei SUN2000-5KTL', powerKw: 5.0, maxVocInput: 600 }], []);
}

function useSolarStore_module(): ModuleModel {
  return useMemo(() => ({ vocStc: 49.0, tempCoeffVoc: -0.0029, iscStc: 10.2 }), []);
}

function useUIStore_setActiveArrangementLayer(): (layer: number) => void {
  return useCallback((layer) => console.log('[nav] setActiveArrangementLayer', layer), []);
}

function useUIStore_setFocusedBlock(): (block: string) => void {
  return useCallback((block) => console.log('[nav] setFocusedBlock', block), []);
}

function useUIStore_setHighlightedStringGroupId(): (id: string | null) => void {
  return useCallback((id) => console.log('[nav] highlight string', id), []);
}

// ─── CÁLCULOS ────────────────────────────────────────────────────────────────

function calculateVocCold(nModules: number, mod: ModuleModel, tmin: number): number {
  return nModules * mod.vocStc * (1 + mod.tempCoeffVoc * (tmin - 25));
}

// ─── CORES ROTATIVAS DAS STRINGS ─────────────────────────────────────────────

const STRING_BG_COLORS = [
  'bg-indigo-900/60 border-indigo-500/40',
  'bg-sky-900/60 border-sky-500/40',
  'bg-emerald-900/60 border-emerald-500/40',
  'bg-amber-900/60 border-amber-500/40',
  'bg-violet-900/60 border-violet-500/40',
] as const;

const STRING_TEXT_COLORS = [
  'text-indigo-300',
  'text-sky-300',
  'text-emerald-300',
  'text-amber-300',
  'text-violet-300',
] as const;

function getStringColorIndex(stringId: string, allIds: string[]): number {
  return allIds.indexOf(stringId);
}

// ─── VALIDAÇÃO INLINE (simplificada para Layer 2) ────────────────────────────

function getMpptMismatch(
  mppt: MPPTConfig,
  strings: StringGroup[],
  arrangements: PhysicalArrangement[]
): boolean {
  const mpptStrings = strings.filter(s => mppt.stringGroupIds.includes(s.id));
  // Derivar arrangementId a partir do nodeId prefix (stub simplificado)
  const hasMixedOrientation = mpptStrings.some(s => s.orientationWarning);
  if (hasMixedOrientation) return true;

  // Verificar azimutes via arranjos
  const azimuthSet = new Set<number>();
  for (const str of mpptStrings) {
    const firstNode = str.nodeIds[0] ?? '';
    // Em produção, derivar do ArrangementGraph; aqui fazemos simulação
    const area = arrangements.find(a => firstNode.startsWith(a.id)) ?? arrangements[0];
    if (area) azimuthSet.add(area.orientation.azimuth);
  }
  return azimuthSet.size > 1;
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────

const TMIN_DEFAULT = 18; // °C — usar clientData.weatherData.tmin em produção

export const Layer2BlockDiagram: React.FC = () => {
  const arrangements = useSolarStore_arrangements();
  const mpptConfigs  = useSolarStore_mpptConfigs();
  const strings      = useSolarStore_strings();
  const inverters    = useSolarStore_inverters();
  const module       = useSolarStore_module();

  const setActiveLayer        = useUIStore_setActiveArrangementLayer();
  const setFocusedBlock       = useUIStore_setFocusedBlock();
  const setHighlightedString  = useUIStore_setHighlightedStringGroupId();

  const [selectedStringId, setSelectedStringId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const allStringIds = useMemo(() => strings.map(s => s.id), [strings]);

  // Memoize mismatch map
  const mpptMismatchMap = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const mppt of mpptConfigs) {
      m.set(mppt.id, getMpptMismatch(mppt, strings, arrangements));
    }
    return m;
  }, [mpptConfigs, strings, arrangements]);

  // Validação global simplificada
  const validationResult = useMemo<ValidationResult>(() => {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];

    for (const [mpptId, isMismatch] of mpptMismatchMap) {
      if (isMismatch) {
        warnings.push({
          code: 'MPPT_ORIENTATION_MISMATCH',
          severity: 'warning',
          message: `MPPT com strings de orientações diferentes`,
          affectedIds: [mpptId],
        });
      }
    }

    // Strings abertas (sem MPPT)
    const openStrings = strings.filter(s => !s.mpptConfigId);
    if (openStrings.length > 0) {
      errors.push({
        code: 'UNCONNECTED_STRING',
        severity: 'error',
        message: `${openStrings.length} string(s) sem conexão ao MPPT`,
        affectedIds: openStrings.map(s => s.id),
      });
    }

    return { valid: errors.length === 0, errors, warnings };
  }, [mpptMismatchMap, strings]);

  const hasErrors   = validationResult.errors.length > 0;
  const hasWarnings = validationResult.warnings.length > 0;
  const anyMismatch = Array.from(mpptMismatchMap.values()).some(Boolean);

  const selectedString = useMemo(
    () => strings.find(s => s.id === selectedStringId) ?? null,
    [strings, selectedStringId]
  );

  const vocForString = useCallback(
    (str: StringGroup): number => calculateVocCold(str.nodeIds.length, module, TMIN_DEFAULT),
    [module]
  );

  const handleStringClick = useCallback((stringId: string) => {
    setSelectedStringId(stringId);
    setPanelOpen(true);
  }, []);

  const handleClosePanel = useCallback(() => {
    setPanelOpen(false);
    setSelectedStringId(null);
  }, []);

  const handleVerNoMapa = useCallback(() => {
    if (!selectedStringId) return;
    setHighlightedString(selectedStringId);
    setActiveLayer(1);
  }, [selectedStringId, setHighlightedString, setActiveLayer]);

  const handleValidacaoEletrica = useCallback(() => {
    setFocusedBlock('inverter');
  }, [setFocusedBlock]);

  return (
    <div
      className="relative w-full h-full flex flex-col overflow-hidden"
      style={{ background: '#020617' }} // bg-slate-950
    >
      {/* Grid blueprint SVG */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
        aria-hidden="true"
      >
        <defs>
          <pattern id="blueprint-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(99,102,241,0.10)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#blueprint-grid)" />
      </svg>

      {/* Banner de mismatch */}
      {anyMismatch && (
        <div
          className="relative z-10 shrink-0 flex items-center gap-3 px-4 py-3 border-b border-amber-700/30 text-amber-200 text-xs"
          style={{ background: 'rgba(120,53,15,0.4)' }}
        >
          <span className="text-amber-400 text-sm">⚠</span>
          <span>
            <strong className="font-bold">
              {validationResult.warnings.length} string(s) com orientações mistas no mesmo MPPT
            </strong>
            {' '}— perdas por mismatch. Reorganize os MPPTs.
          </span>
          <button
            className="ml-auto text-amber-300 underline text-[10px] hover:text-amber-200"
            onClick={() => {/* scroll to affected MPPT */}}
          >
            Ver detalhes
          </button>
        </div>
      )}

      {/* Erros críticos */}
      {hasErrors && validationResult.errors.map(err => (
        <div
          key={err.code}
          className="relative z-10 shrink-0 flex items-center gap-3 px-4 py-3 border-b border-red-700/30 text-red-200 text-xs"
          style={{ background: 'rgba(127,29,29,0.35)' }}
        >
          <span className="text-red-400">🔴</span>
          <span>{err.message}</span>
          <button
            className="ml-auto text-red-300 underline text-[10px]"
            onClick={() => setActiveLayer(1)}
          >
            Ir para Layer 1
          </button>
        </div>
      ))}

      {/* Canvas principal */}
      <div className="relative z-10 flex flex-1 min-h-0">
        {/* Diagrama de blocos */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {inverters.map(inverter => (
            <div key={inverter.id} className="flex flex-col gap-4">
              {/* Bloco do Inversor */}
              <div
                className="self-center px-5 py-3 rounded border text-center"
                style={{ background: 'rgba(15,23,42,0.8)', borderColor: 'rgba(52,211,153,0.4)' }}
              >
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">Inversor</p>
                <p className="text-sm font-bold text-slate-200">{inverter.model}</p>
                <p className="text-[10px] text-slate-400 font-mono">{inverter.powerKw} kW CA</p>
              </div>

              {/* MPPTs */}
              <div className="flex flex-wrap gap-5 justify-center">
                {mpptConfigs
                  .filter(mppt => mppt.inverterId === inverter.id)
                  .map(mppt => {
                    const isMismatch = mpptMismatchMap.get(mppt.id) ?? false;
                    const mpptStrings = strings.filter(s => mppt.stringGroupIds.includes(s.id));

                    return (
                      <div key={mppt.id} className="flex flex-col items-center gap-3">
                        {/* Strings do MPPT */}
                        <div className="flex gap-2 flex-wrap justify-center">
                          {mpptStrings.map((str, i) => {
                            const colorIdx = getStringColorIndex(str.id, allStringIds);
                            const bgBorder = STRING_BG_COLORS[colorIdx % STRING_BG_COLORS.length];
                            const textColor = STRING_TEXT_COLORS[colorIdx % STRING_TEXT_COLORS.length];
                            const voc = vocForString(str);
                            const isSelected = selectedStringId === str.id;

                            return (
                              <button
                                key={str.id}
                                onClick={() => handleStringClick(str.id)}
                                className={`
                                  px-3 py-2 rounded border text-left transition-all
                                  hover:brightness-125 hover:shadow-lg
                                  ${bgBorder}
                                  ${isSelected ? 'ring-2 ring-white/50' : ''}
                                `}
                              >
                                <p className={`text-[11px] font-bold font-mono ${textColor}`}>{str.id}</p>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  {str.nodeIds.length} módulos
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  Voc: {voc.toFixed(1)} V
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  Isc: {module.iscStc.toFixed(1)} A
                                </p>
                                <span className="text-[9px]">
                                  {str.orientationWarning ? '⚠' : '✅'}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Bloco MPPT */}
                        <div
                          className={`px-4 py-2.5 rounded border text-center min-w-[120px] transition-colors ${
                            isMismatch
                              ? 'border-amber-500/50 bg-amber-950/40'
                              : 'border-emerald-500/30 bg-slate-700/50'
                          }`}
                        >
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-0.5">
                            MPPT {mppt.mpptIndex + 1}
                          </p>
                          <p className="text-[10px] text-slate-300 font-mono">
                            {mpptStrings.map(s => s.id).join(' + ')} ({mpptStrings.length}×)
                          </p>
                          <span
                            className={`text-[9px] font-bold ${
                              isMismatch ? 'text-amber-300' : 'text-emerald-300'
                            }`}
                          >
                            {isMismatch ? '⚠ Mismatch' : '✅ Compatível'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        {/* Painel lateral direito */}
        {panelOpen && selectedString && (
          <div
            className="w-[280px] shrink-0 flex flex-col border-l border-slate-800 bg-slate-950 overflow-hidden"
            style={{ animation: 'slideIn 0.25s ease' }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-slate-900/50">
              <span className="text-sm font-bold text-slate-200">String {selectedString.id}</span>
              <button
                onClick={handleClosePanel}
                className="ml-auto text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Módulos', value: String(selectedString.nodeIds.length) },
                  { label: 'Isc', value: `${module.iscStc.toFixed(1)} A` },
                  { label: 'Voc (frio)', value: `${vocForString(selectedString).toFixed(1)} V` },
                  { label: 'MPPT destino', value: selectedString.mpptConfigId ?? '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-900 rounded border border-slate-800 p-2">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider">{label}</p>
                    <p className="text-xs font-bold text-slate-200 font-mono">{value}</p>
                  </div>
                ))}
              </div>

              {selectedString.orientationWarning && (
                <div className="px-3 py-2 rounded border border-amber-700/30 bg-amber-950/30 text-amber-200 text-xs">
                  ⚠ Esta string tem módulos de orientações diferentes.
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="px-4 py-3 border-t border-slate-800 flex flex-col gap-2">
              <button
                onClick={handleVerNoMapa}
                className="w-full py-2 px-3 rounded border border-indigo-700/40 bg-indigo-900/20 text-indigo-300 text-xs font-bold hover:bg-indigo-800/30 transition-colors text-left"
              >
                → Ver no mapa (Layer 1)
              </button>
              <button
                onClick={handleValidacaoEletrica}
                className="w-full py-2 px-3 rounded border border-emerald-700/40 bg-emerald-900/20 text-emerald-300 text-xs font-bold hover:bg-emerald-800/30 transition-colors text-left"
              >
                → Validação elétrica
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rodapé CTA */}
      <div className="relative z-10 shrink-0 px-5 py-4 border-t border-slate-800 bg-slate-950/90">
        {hasErrors ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded border border-red-900/50 bg-red-950/20">
            <span className="text-red-400">🔴</span>
            <p className="text-xs text-red-300">
              Resolva os erros de topologia antes de avançar.
            </p>
            <button
              disabled
              className="ml-auto px-4 py-1.5 rounded text-xs font-bold bg-slate-700 text-slate-500 cursor-not-allowed"
              title="Resolva os erros de topologia antes de avançar"
            >
              Ir para Validação Elétrica
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 px-4 py-3 rounded border border-emerald-800/30 bg-emerald-950/15">
            <span className="text-xs text-emerald-300">
              Topologia elétrica {hasWarnings ? '⚠' : '✅'} —{' '}
              {strings.reduce((acc, s) => acc + s.nodeIds.length, 0)} módulos em{' '}
              {strings.length} strings, {mpptConfigs.length} MPPTs
            </span>
            <button
              onClick={handleValidacaoEletrica}
              className="flex items-center gap-2 px-5 py-2 rounded text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-slate-950 transition-colors"
            >
              {hasWarnings && <span>⚠</span>}
              Ir para Validação Elétrica →
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(280px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default Layer2BlockDiagram;

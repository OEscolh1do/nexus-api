import React from 'react';
import { X, Ruler, CircleDot, Navigation, Info } from 'lucide-react';
import { PrecisionStepper } from './PrecisionStepper';
import { ENGINEERING_CONSTANTS } from '../../../../../constants/engineeringConstants';

// C03: Limites mínimos de segurança para cabos
const MIN_CABLE_LENGTH = 0.1;  // 10cm mínimo
const MIN_CABLE_SECTION = 1.5; // 1.5mm² mínimo (NBR 5410)

interface StringPropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    azimuth?: number;
    inclination?: number;
    cableLength: number;
    cableSection: number;
    modulesCount: number;
  };
  onSave: (updates: any) => void;
  title: string;
}

export const StringPropertiesModal: React.FC<StringPropertiesModalProps> = ({
  isOpen,
  onClose,
  data,
  onSave,
  title
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-[400px] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-sky-500 rounded-full shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
            <h3 className="text-[12px] font-black font-mono uppercase tracking-widest text-slate-200">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-8">
          
          {/* Seção 1: Orientação */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 opacity-50">
              <Navigation size={12} className="text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-wider">Orientação da String</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Azimute (°)</label>
                <div className="h-9 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                  <PrecisionStepper 
                    value={data.azimuth ?? 0} 
                    min={-180} 
                    max={180} 
                    onCommit={(val) => onSave({ azimuth: val })}
                    className="h-full bg-transparent"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Inclinação (°)</label>
                <div className="h-9 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                  <PrecisionStepper 
                    value={data.inclination ?? 0} 
                    min={0} 
                    max={90} 
                    onCommit={(val) => onSave({ inclination: val })}
                    className="h-full bg-transparent"
                  />
                </div>
              </div>
            </div>
            <p className="text-[9px] text-slate-600 flex items-center gap-1.5 px-1">
              <Info size={10} />
              Se não definido, herda a orientação do MPPT ou do Projeto.
            </p>
          </div>

          {/* Seção 2: Infra Elétrica */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 opacity-50">
              <Ruler size={12} className="text-sky-400" />
              <span className="text-[10px] font-black uppercase tracking-wider">Infraestrutura Elétrica</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Comprimento */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Comprimento (m)</label>
                <div className="h-9 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                  <PrecisionStepper
                    value={data.cableLength}
                    min={MIN_CABLE_LENGTH}
                    max={500}
                    suffix="m"
                    onCommit={(val) => onSave({ cableLength: Math.max(MIN_CABLE_LENGTH, val) })}
                    className="h-full bg-transparent"
                  />
                </div>
              </div>

              {/* Bitola */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Bitola (mm²)</label>
                <div className="h-9 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex items-center px-1">
                  <div className="flex-1 h-full flex items-center justify-center gap-2">
                    <button
                      className="w-full h-full flex items-center justify-center gap-2 hover:bg-white/5 transition-colors text-[11px] font-mono font-black text-white"
                      onClick={() => {
                        const standards = ENGINEERING_CONSTANTS.COMMERCIAL_CABLE_SECTIONS;
                        const currentIdx = standards.indexOf(data.cableSection);
                        const nextIdx = (currentIdx + 1) % standards.length;
                        const nextSection = standards[nextIdx];
                        onSave({ cableSection: Math.max(MIN_CABLE_SECTION, nextSection) });
                      }}
                    >
                      <CircleDot size={12} className="text-slate-600" />
                      <span>{data.cableSection} <span className="text-slate-500 text-[8px]">mm²</span></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/50 border-t border-slate-800 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 shadow-lg shadow-sky-500/10"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};

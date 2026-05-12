import React from 'react';
import { X, Navigation, Save } from 'lucide-react';
import { OrientationDials } from './OrientationDials';

interface OrientationModalProps {
  isOpen: boolean;
  onClose: () => void;
  azimuth: number;
  inclination: number;
  onSave: (azimuth: number, inclination: number) => void;
  title?: string;
  isCustom?: boolean;
}

export const OrientationModal: React.FC<OrientationModalProps> = ({
  isOpen,
  onClose,
  azimuth,
  inclination,
  onSave,
  title = "Configurar Orientação",
  isCustom = false,
}) => {
  const [localAzimuth, setLocalAzimuth] = React.useState(azimuth);
  const [localInclination, setLocalInclination] = React.useState(inclination);

  // Sincronizar estado local quando o modal abre
  React.useEffect(() => {
    if (isOpen) {
      setLocalAzimuth(azimuth);
      setLocalInclination(inclination);
    }
  }, [isOpen, azimuth, inclination]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 rounded-lg">
              <Navigation size={18} className="text-sky-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest">{title}</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                {isCustom ? "Ajuste Fino por MPPT" : "Definição Universal do Projeto"}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          <div className="w-full max-w-[320px] bg-slate-950/50 rounded-2xl p-4 border border-slate-800/50 shadow-inner">
            <OrientationDials
              azimuth={localAzimuth}
              inclination={localInclination}
              onAzimuthChange={setLocalAzimuth}
              onInclinationChange={setLocalInclination}
            />
          </div>

          <div className="mt-6 w-full grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/50">
              <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Azimute</span>
              <span className="text-xl font-mono font-black text-sky-400">{localAzimuth}°</span>
            </div>
            <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/50">
              <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Inclinação</span>
              <span className="text-xl font-mono font-black text-emerald-400">{localInclination}°</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(localAzimuth, localInclination)}
            className="flex-[2] px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-900/20 active:scale-95"
          >
            <Save size={14} />
            Aplicar Configuração
          </button>
        </div>

      </div>
    </div>
  );
};

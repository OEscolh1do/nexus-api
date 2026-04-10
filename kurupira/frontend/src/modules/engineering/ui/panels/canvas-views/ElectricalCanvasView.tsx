import React, { useState } from 'react';
import { 
  Activity, Flame, Zap, Scale, 
  ArrowRight, ShieldAlert, Cpu
} from 'lucide-react';
import { useSolarStore } from '@/core/state/solarStore';
import { useTechStore } from '../../../store/useTechStore';

export const ElectricalCanvasView: React.FC = () => {
  // Store Global Data
  const settings = useSolarStore((state) => state.settings);
  const { lossProfile } = useTechStore();

  // Local State: Cable Sizing Form (Mock Parameters)
  const [acParams, setAcParams] = useState({
    distance: 45, // meters
    current: 32,  // amps - Inverter nominal output
    voltage: 220, // AC phase voltage
    gauge: 10,    // mm2
    core: 'copper' // copper | aluminum
  });

  // Simple Volt Drop Math (Math for Copper: 0.0172 ohm.mm2/m // Aluminum: 0.0282)
  const rho = acParams.core === 'copper' ? 0.0172 : 0.0282;
  const vDrop = (2 * acParams.distance * acParams.current * rho) / acParams.gauge;
  const vDropPercent = (vDrop / acParams.voltage) * 100;
  
  const isDropSafe = vDropPercent <= 3.0; // NBR 5410 rec <= 3~4%
  const dropStatusParams = isDropSafe 
    ? { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', label: 'Queda Adequada' }
    : { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', label: 'Risco Elevado (Aumente a Bitola)' };

  // Thermo Math (Voc Max stress based on min temp)
  const deltaT = settings.minHistoricalTemp - 25; // STC is 25C
  const voltageMultiplier = 1 + (deltaT * (settings.vocTempCoefficient / 100)); // Will be > 1 because coeff is negative and deltaT is negative in cold.
  const sampleVocSTC = 49.5; // Exemplar Panel Voc
  const estVocCold = sampleVocSTC * voltageMultiplier;

  return (
    <div className="w-full h-full p-6 md:p-10 flex flex-col items-center">
      <div className="w-full max-w-7xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <Activity size={24} className="text-indigo-400" />
              </div>
              <h1 className="text-3xl font-black text-slate-100 tracking-tight">Laboratório Elétrico</h1>
            </div>
            <p className="text-slate-500 font-medium max-w-xl">
              Análise profunda paramétrica: Dimensionamento de condutores CA/CC e estresse termodinâmico de strings.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-bold flex items-center gap-2">
              <Cpu size={16} /> Topology: String Inverter
            </div>
          </div>
        </header>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* ==========================================================
              QUADRANTE 1: DIMENSIONADOR DE CABEAMENTO (AC Drop)
              ========================================================== */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Zap size={20} className="text-indigo-400" />
              <h2 className="text-xl font-bold text-slate-200">Condutores: Queda de Tensão</h2>
            </div>
            
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl flex flex-col gap-6">
              
              {/* Form Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 focus-within:text-indigo-400 text-slate-400">
                  <label className="text-xs font-bold uppercase tracking-widest text-inherit">Lance de Cabo (m)</label>
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 focus-within:border-indigo-500 transition-colors">
                    <input 
                      type="number" value={acParams.distance} onChange={(e) => setAcParams(p => ({...p, distance: Number(e.target.value)}))}
                      className="bg-transparent w-full focus:outline-none text-slate-200 font-mono text-lg"
                    />
                    <span className="text-slate-500 font-bold ml-2">m</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 focus-within:text-indigo-400 text-slate-400">
                  <label className="text-xs font-bold uppercase tracking-widest text-inherit">Tensão Nominal</label>
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300">
                    <span className="w-full font-mono text-lg">{acParams.voltage}</span>
                    <span className="text-slate-500 font-bold ml-2">Vac</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 focus-within:text-indigo-400 text-slate-400">
                  <label className="text-xs font-bold uppercase tracking-widest text-inherit">Corrente Máx (A)</label>
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 focus-within:border-indigo-500 transition-colors">
                    <input 
                      type="number" value={acParams.current} onChange={(e) => setAcParams(p => ({...p, current: Number(e.target.value)}))}
                      className="bg-transparent w-full focus:outline-none text-slate-200 font-mono text-lg"
                    />
                    <span className="text-slate-500 font-bold ml-2">A</span>
                  </div>
                </div>

                 <div className="flex flex-col gap-1.5 focus-within:text-indigo-400 text-slate-400">
                  <label className="text-xs font-bold uppercase tracking-widest text-inherit">Seção Transversal</label>
                  <select 
                    value={acParams.gauge} onChange={(e) => setAcParams(p => ({...p, gauge: Number(e.target.value)}))}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-3 focus:outline-none focus:border-indigo-500 text-slate-200 font-mono transition-colors appearance-none"
                  >
                    <option value="2.5">2.5 mm²</option>
                    <option value="4">4.0 mm²</option>
                    <option value="6">6.0 mm²</option>
                    <option value="10">10.0 mm²</option>
                    <option value="16">16.0 mm²</option>
                  </select>
                </div>
              </div>

              {/* Indicator Panel */}
              <div className={`p-5 rounded-xl border ${dropStatusParams.border} ${dropStatusParams.bg} flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-500`}>
                <div className="flex items-baseline gap-2 z-10">
                  <span className={`text-6xl font-black ${dropStatusParams.text} tracking-tighter`}>{vDropPercent.toFixed(2)}</span>
                  <span className={`text-2xl font-bold ${dropStatusParams.text}/50`}>%</span>
                </div>
                <div className="flex items-center gap-2 mt-2 z-10">
                  {isDropSafe ? <Scale size={16} className={dropStatusParams.text} /> : <ShieldAlert size={16} className={dropStatusParams.text} />}
                  <span className={`text-sm font-bold uppercase tracking-widest ${dropStatusParams.text}`}>{dropStatusParams.label}</span>
                </div>
                <div className="absolute opacity-[0.03] scale-150 right-0 pointer-events-none">
                  <Zap size={120} />
                </div>
              </div>

              <div className="text-[10px] text-center text-slate-500 px-6">
                A simulação leva em consideração cabeamento de Cobre puro (ρ = 0.0172 Ω·mm²/m) em rede bifásica/monofásica à temperatura operacional nominal. 
              </div>
            </div>
          </div>


          {/* ==========================================================
              QUADRANTE 2: LABORATÓRIO TÉRMICO E VOC DERATING
              ========================================================== */}
           <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Flame size={20} className="text-red-400" />
              <h2 className="text-xl font-bold text-slate-200">Engenharia Termodinâmica</h2>
            </div>
            
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl flex flex-col gap-6">
              
              <p className="text-sm font-medium text-slate-400">
                O gráfico de arrasto (Mock limitador térmico) ilustra como a tensão de circuito aberto (Voc) reage violentamente em madrugadas de inverno operando com os parâmetros configurados no Dock (`useTechStore`).
              </p>

              {/* Parametros base mostrados */}
              <div className="flex gap-4">
                 <div className="flex-1 p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Temp Mín. (Inverno)</p>
                  <p className="text-xl font-black text-blue-400">{settings.minHistoricalTemp}°C</p>
                </div>
                <div className="flex-1 p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Derating (Voc)</p>
                  <p className="text-xl font-black text-red-400">{settings.vocTempCoefficient}%/°C</p>
                </div>
              </div>

              {/* Gráfico Visual Demonstrativo do Limite de Tensão (CSS Bars) */}
              <div className="flex-1 min-h-[200px] border border-slate-800 rounded-xl bg-slate-900 p-6 flex flex-col relative overflow-hidden">
                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                  <span>Módulo (Exemplo 49.5v)</span>
                  <span>Impacto Termal</span>
                </div>

                <div className="flex items-end gap-16 justify-center flex-1 pb-4">
                  {/* BAR: STC */}
                  <div className="flex flex-col items-center gap-2 group">
                    <span className="text-sm font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity absolute top-12">Referência STC</span>
                    <div className="w-24 bg-slate-800 rounded-t-xl transition-all duration-700 relative flex justify-center" style={{ height: '100px' }}>
                      <div className="absolute -top-6 text-slate-400 font-mono font-bold">49.50v</div>
                    </div>
                    <span className="text-xs font-bold text-slate-500">25°C</span>
                  </div>

                  <ArrowRight size={20} className="text-slate-700 shrink-0 mb-10" />

                  {/* BAR: Estresse Cold */}
                  <div className="flex flex-col items-center gap-2 group">
                    <span className="text-sm font-bold text-red-400 opacity-0 group-hover:opacity-100 transition-opacity absolute top-12 whitespace-nowrap">Estresse Inverno</span>
                    <div 
                      className="w-24 rounded-t-xl transition-all duration-700 relative flex justify-center bg-gradient-to-t from-slate-800 to-red-500/20 border-t border-red-500" 
                      style={{ height: `${100 * voltageMultiplier}px` }}
                    >
                      <div className="absolute -top-6 text-red-400 font-mono font-black">{estVocCold.toFixed(2)}v</div>
                    </div>
                    <span className="text-xs font-bold text-blue-400">{settings.minHistoricalTemp}°C</span>
                  </div>
                </div>

                {/* Limite de sistema Mock */}
                <div className="absolute top-1/4 left-0 w-full border-t border-dashed border-red-500/30 flex items-center">
                  <div className="text-[10px] bg-slate-900 px-2 text-red-500/50 uppercase font-black tracking-widest -mt-2 ml-4">Limite Mock Inversor</div>
                </div>
              </div>


            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

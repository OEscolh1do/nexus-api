import React from 'react';
import { 
  MapPin, User, ThermometerSun, Zap, Waves, Server, 
  Map, Sunrise, CloudRain, ShieldCheck, HardHat, Compass
} from 'lucide-react';
import { useSolarStore } from '@/core/state/solarStore';

/**
 * Helper componente pra mini-linhas do Checklist
 */
const ChecklistRow = ({ label, value, icon: Icon }: { label: string, value: string, icon: React.ElementType }) => (
  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800/50 bg-slate-900/50 hover:bg-slate-800/50 transition-colors">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-md bg-slate-800">
        <Icon size={14} className="text-slate-400" />
      </div>
      <span className="text-sm text-slate-300 font-medium">{label}</span>
    </div>
    <span className="text-sm font-bold text-slate-200">{value}</span>
  </div>
);

export const SiteCanvasView: React.FC = () => {
  const clientData = useSolarStore((state) => state.clientData);
  const weatherData = useSolarStore((state) => state.weatherData);

  const hasClient = !!clientData.clientName;

  return (
    <div className="w-full h-full p-6 md:p-10 flex flex-col items-center">
      <div className="w-full max-w-7xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <MapPin size={24} className="text-emerald-400" />
              </div>
              <h1 className="text-3xl font-black text-slate-100 tracking-tight">Dossiê de Implantação</h1>
            </div>
            <p className="text-slate-500 font-medium max-w-xl">
              Central de inteligência para vistoria técnica, análise climática local e detalhamento de infraestrutura física.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold flex items-center gap-2">
              <ShieldCheck size={16} /> Status: Ativo
            </div>
            <div className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium flex items-center gap-2">
              <HardHat size={16} /> RT Ppendente
            </div>
          </div>
        </header>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUNA 1: IDENTIFICAÇÃO & CONEXÃO (V-CARD) */}
          <div className="space-y-6">
            {/* Card: Cliente */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <User size={18} className="text-indigo-400" />
                <h3 className="text-lg font-bold text-slate-200">Titular da Instalação</h3>
              </div>
              
              {hasClient ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Nome Completo / Razão</p>
                    <p className="text-xl font-black text-slate-100">{clientData.clientName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Endereço de Faturamento</p>
                    <p className="text-sm font-medium text-slate-300">
                      {clientData.street || 'Endereço não cadastrado'}
                    </p>
                    <p className="text-sm font-medium text-slate-400 mt-0.5">
                      {clientData.city ? `${clientData.city}, ${clientData.state}` : 'Cidade/UF não definida'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-32 flex flex-col items-center justify-center border border-dashed border-slate-700 rounded-xl bg-slate-800/20 text-slate-500">
                  <User size={24} className="mb-2 opacity-50" />
                  <span className="text-sm font-medium">Cliente não definido.</span>
                </div>
              )}
            </div>

            {/* Card: Medidor / Tipo de Ligação */}
            <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/50 to-slate-900/80 backdrop-blur-xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 opacity-5">
                <Zap size={120} />
              </div>
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <Zap size={18} className="text-amber-400" />
                <h3 className="text-lg font-bold text-slate-200">Infraestrutura Nominal</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Padrão</p>
                  <p className="text-lg font-black text-slate-200 capitalize">
                    {clientData.connectionType || '—'}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Área Útil</p>
                  <p className="text-lg font-black text-slate-200">
                    {clientData.availableArea ? `${clientData.availableArea} m²` : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>


          {/* COLUNA 2: CLIMATOLOGIA APLICADA */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Secão Weather Dashboard */}
            <div className="rounded-2xl border border-amber-900/30 bg-gradient-to-tr from-amber-500/5 to-slate-900/50 backdrop-blur-xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <ThermometerSun size={20} className="text-amber-500" />
                  <h3 className="text-lg font-bold text-slate-200">Estação Meteorológica e Irradiação</h3>
                </div>
                <div className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-bold text-slate-400">
                  Fonte: {weatherData?.irradiation_source || '—'}
                </div>
              </div>

              {weatherData ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Destaque Térmico */}
                  <div className="col-span-1 md:col-span-1 p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-center">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Temp. Média Anual</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black text-amber-500 tracking-tighter">
                        {weatherData.ambient_temp_avg.toFixed(1)}
                      </span>
                      <span className="text-xl font-bold text-amber-500/50">°C</span>
                    </div>
                  </div>

                  {/* Detalhes Climáticos (Mockup de layout) */}
                  <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-800/50 bg-slate-900/40 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Waves size={18} className="text-blue-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Umidade Relativa</p>
                        <p className="text-sm font-bold text-slate-300">~68% (Ref)</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-800/50 bg-slate-900/40 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <Sunrise size={18} className="text-orange-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Janela Solar</p>
                        <p className="text-sm font-bold text-slate-300">05:40 - 18:10</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-800/50 bg-slate-900/40 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
                        <CloudRain size={18} className="text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Índice de Chuvas</p>
                        <p className="text-sm font-bold text-slate-300">Alto (Sazonal)</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-800/50 bg-slate-900/40 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <Compass size={18} className="text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Azimute Predominante</p>
                        <p className="text-sm font-bold text-slate-300">0° Norte</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-40 flex flex-col items-center justify-center border border-dashed border-slate-700/50 rounded-xl bg-slate-900/30 text-slate-500">
                  <ThermometerSun size={24} className="mb-2 opacity-50" />
                  <span className="text-sm font-medium">Configure as coordenadas no mapa para obter banco de dados climático.</span>
                </div>
              )}
            </div>

            {/* Secão: Prancheta de Implantação e Checklist (Mock Frontend) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Box Geolocalizador */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl p-6 shadow-xl">
                 <div className="flex items-center gap-3 mb-5">
                  <Map size={18} className="text-emerald-400" />
                  <h3 className="text-lg font-bold text-slate-200">Coordenadas Exatas</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 font-mono">
                    <span className="w-12 text-xs text-slate-500">LAT</span>
                    <div className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-300">
                      {clientData.lat ? clientData.lat.toFixed(6) : '—'}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 font-mono">
                    <span className="w-12 text-xs text-slate-500">LNG</span>
                    <div className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-300">
                      {clientData.lng ? clientData.lng.toFixed(6) : '—'}
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <a 
                      href={clientData.lat ? `https://maps.google.com/?q=${clientData.lat},${clientData.lng}` : '#'} 
                      target="_blank" 
                      rel="noreferrer"
                      className="block w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-center text-sm font-bold text-emerald-400 transition-colors border border-emerald-500/20"
                    >
                      Abrir no Google Maps
                    </a>
                  </div>
                </div>
              </div>

              {/* Checklist / Restrições */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl p-6 shadow-xl">
                 <div className="flex items-center gap-3 mb-5">
                  <Server size={18} className="text-blue-400" />
                  <h3 className="text-lg font-bold text-slate-200">Restrições Estruturais</h3>
                </div>

                <div className="space-y-2">
                  <ChecklistRow label="Condição do Telhado" value="Cerâmico / Bom" icon={HardHat} />
                  <ChecklistRow label="Quadro Padrão AC" value="Adequado" icon={Zap} />
                  <ChecklistRow label="Fácil Acesso" value="Sim" icon={ShieldCheck} />
                  
                  <button className="w-full mt-4 py-2 border border-dashed border-slate-700 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest">
                    + Anexar Fotos do Local
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

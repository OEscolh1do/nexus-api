const fs = require('fs');
const file = 'frontend/src/modules/engineering/ui/panels/canvas-views/ConsumptionCanvasView.tsx';
let txt = fs.readFileSync(file, 'utf8');

const s1_start = '{/* SEÇÃO 1: PERFIL DE CONSUMO */}';
const s2_start = '{/* SEÇÃO 2: ANÁLISE CLIMÁTICA */}';
const s3_start = '{/* SEÇÃO 3: CARGAS SIMULADAS */}';
const s4_start = '{/* SEÇÃO 4: FATOR DE CRESCIMENTO */}';
const hero_start = '{/* HERO KWP ALVO */}';

let s1_block = txt.substring(txt.indexOf(s1_start), txt.indexOf(s2_start)).trim();
let s2_block = txt.substring(txt.indexOf(s2_start), txt.indexOf('</div>\n\n          </div>\n\n          {/* COLUNA DIREITA (Engine de Crescimento) */}')).trim();
let s3_block = txt.substring(txt.indexOf(s3_start), txt.indexOf(s4_start)).trim();
let s4_block = txt.substring(txt.indexOf(s4_start), txt.indexOf('</div>\n\n          </div>\n        </div>')).trim();

const new_grid = `        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-8">
          
          {/* COLUNA ESQUERDA (Profile & Loads) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            ${s1_block}
            
            ${s3_block}
          </div>

          {/* COLUNA DIREITA (Climate & Growth) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            ${s2_block}
            
            ${s4_block}
          </div>

        </div>

        {/* BANNER DE DIMENSIONAMENTO (HERO KWP ALVO) */}
        <div className="w-full mt-4 bg-slate-950 border border-amber-500/30 rounded-md p-4 flex flex-col xl:flex-row items-center justify-between shadow-md relative overflow-hidden">
          <div className="absolute right-[-20px] top-[-20px] opacity-[0.03]">
            <Target size={120} className="text-amber-500" />
          </div>
          
          <div className="flex flex-col z-10 w-full xl:w-4/5 text-center xl:text-left">
             <h2 className="text-[10px] font-bold text-amber-500 tracking-widest uppercase mb-2">
               kWp alvo calculado — atualiza em tempo real com faturas + cargas + crescimento
             </h2>
             <div className="text-xs sm:text-sm font-mono text-slate-300 break-words leading-relaxed">
               <span className="text-slate-400">Consumo base</span> <span className="text-sky-400 font-bold">{Math.round(mediaMensal)}</span> 
               <span className="text-slate-500 mx-1">+</span> 
               <span className="text-slate-400">Cargas</span> <span className="text-sky-400 font-bold">{Math.round(extraKwh)}</span> 
               <span className="text-slate-500 mx-1">=</span> 
               <span className="font-bold text-sky-300">{Math.round(mediaMensal + extraKwh)} kWh/mês</span> 
               <span className="text-slate-500 mx-2">×</span> 
               <span className="text-slate-400">fator</span> <span className="text-emerald-400 font-bold">{((1 + loadGrowthFactor / 100)).toFixed(2)}</span> 
               <span className="text-slate-500 mx-1">=</span> 
               <span className="font-bold text-emerald-300">{Math.round((mediaMensal + extraKwh) * (1 + loadGrowthFactor / 100))} kWh/mês</span> 
               <span className="mx-3 text-amber-500 font-black">→</span> 
               <span className="text-lg font-black text-amber-400">{kWpAlvo ? kWpAlvo.toFixed(2) : '0.00'} kWp</span>
             </div>
          </div>
          
          <div className="flex items-center justify-center gap-3 z-10 mt-4 xl:mt-0 bg-amber-950/20 border border-amber-900/50 px-6 py-2 rounded-sm w-full xl:w-auto">
             <span className="text-[10px] uppercase tracking-widest text-amber-500/70 font-bold">Potência</span>
             <span className="text-4xl font-black font-mono text-amber-500">{kWpAlvo ? kWpAlvo.toFixed(2) : '0.00'}</span>
             <span className="text-sm font-bold text-amber-600">kWp</span>
          </div>
        </div>`;

const grid_start = '<div className="grid grid-cols-1 xl:grid-cols-12 gap-4">';
const grid_end = '</div>\n\n          </div>\n        </div>';

let out = txt.substring(0, txt.indexOf(grid_start)) + new_grid + txt.substring(txt.indexOf(grid_end) + grid_end.length);
fs.writeFileSync(file, out);
console.log('OK');

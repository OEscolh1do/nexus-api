import React from 'react';
import { ProposalData } from '@/core/types';
import { GenerationChart, CumulativeSavingsChart } from './SolarCharts';
import {
   Sun, Zap, Box, Activity,
   ShieldCheck, HardHat, TrendingUp,
   Target, Award, QrCode,
   AlertCircle, Rocket, Sparkles,
   Navigation
} from 'lucide-react';

interface Props {
   data: ProposalData;
}

const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const Page: React.FC<{ children: React.ReactNode }> = ({ children }) => (
   <div className="proposal-page relative bg-white flex flex-col overflow-hidden text-slate-800 font-sans print:shadow-none print:m-0">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none neonorte-pattern"></div>
      <div className="flex-grow p-[10mm] flex flex-col relative z-10">
         {children}
      </div>
   </div>
);

const Header: React.FC = () => (
   <header className="flex justify-between items-start border-b border-slate-100 pb-4 mb-6 relative z-10 w-full">
      <div className="flex items-center gap-4">
         <img
            src="/assets/logos/NEONORTE ASS VERT - 01 - ROXO.png"
            alt="NeoNorte Engenharia"
            className="h-20 object-contain drop-shadow-md"
         />
      </div>
      <div className="text-right font-mono flex gap-6 items-center">
         <div className="p-2 bg-white rounded-xl shadow-lg border border-slate-50">
            <QrCode size={32} className="text-neonorte-deepPurple" />
         </div>
      </div>
   </header>
);

const Footer: React.FC<{ pageNum: number; totalPages: number }> = ({ pageNum, totalPages }) => (
   <footer className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center text-[8px] font-black text-slate-400 uppercase tracking-widest relative z-10">
      <div className="flex items-center gap-4 text-[10px]">
         <span className="text-neonorte-purple italic font-black">NeoNorte Group</span>
         <span className="w-1.5 h-1.5 bg-neonorte-green rounded-full shadow-[0_0_8px_#05CD46]"></span>
         <span>Energy Sovereignty</span>
      </div>
      <div className="flex items-center gap-2">
         <span className="bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">Ref: {Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
         <div className="bg-neonorte-deepPurple px-4 py-1.5 rounded-xl text-neonorte-green font-black shadow-md">
            PG {pageNum} / 0{totalPages}
         </div>
      </div>
   </footer>
);

export const ProposalTemplate: React.FC<Props> = ({ data }) => {
   const primaryInverter = data.inverters[0];
   const primaryModule = data.modules[0];
   const dailyLoss = (data.annualSavings / 365);
   const totalPages = data.mapImage ? 4 : 3;

   return (
      <div className="proposal-container bg-slate-200 print:bg-white min-h-screen font-sans">

         {/* PÁGINA 01: CAPA E CONTEXTO */}
         <Page>
            <Header />
            <main className="flex-grow flex flex-col gap-5 relative z-10">
               <section className="neonorte-gradient rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-xl">
                  <div className="absolute -top-16 -right-16 p-24 opacity-[0.05] pointer-events-none rotate-12">
                     <Sun size={400} strokeWidth={1} />
                  </div>

                  <div className="relative z-10">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="h-[3px] w-14 bg-neonorte-green rounded-full"></div>
                        <span className="text-xs font-black uppercase tracking-[0.4em] text-neonorte-green">Estudo de Viabilidade Técnica</span>
                     </div>

                     <h2 className="text-[4rem] font-black tracking-tighter leading-[0.85] mb-8 uppercase italic">
                        Crie seu Próprio <br /> <span className="text-neonorte-green">Banco de Energia</span>
                     </h2>

                     <div className="grid grid-cols-2 gap-8 mt-12">
                        <div>
                           <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.4em] mb-2">Investidor Estratégico</p>
                           <div className="bg-white/10 border-l-4 border-neonorte-green p-6 rounded-r-2xl backdrop-blur-md">
                              <p className="text-3xl font-black text-white uppercase tracking-tight leading-none">{data.clientName}</p>
                              <p className="text-xs font-bold text-neonorte-green mt-2 uppercase italic tracking-wider">{data.city} • {data.state}</p>
                           </div>
                        </div>
                        <div className="flex flex-col justify-end items-end">
                           <div className="bg-neonorte-green text-neonorte-deepPurple px-5 py-2.5 rounded-[1.5rem] shadow-xl transform -rotate-2 border-b-2 border-neonorte-darkGreen">
                              <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-neonorte-deepPurple/80">Status do Projeto</p>
                              <p className="text-xl font-black italic text-neonorte-deepPurple">VIABILIDADE TOTAL</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </section>

               <section className="grid grid-cols-12 gap-5 items-stretch">
                  <div className="col-span-4 bg-red-50 p-6 rounded-[2.5rem] border border-red-100 flex flex-col justify-between relative overflow-hidden">
                     <div>
                        <div className="flex items-center gap-2 text-red-600 mb-3">
                           <AlertCircle size={20} />
                           <span className="text-[10px] font-black uppercase tracking-widest">O Custo da Inércia</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase italic leading-relaxed">
                           Capital "queimado" pagando contas de luz sem retorno patrimonial.
                        </p>
                     </div>
                     <p className="text-3xl font-black text-red-600 font-mono italic mt-4">{formatMoney(dailyLoss)}<span className="text-xs">/dia</span></p>
                  </div>

                  <div className="col-span-8 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between">
                     <div className="flex justify-between items-start mb-4">
                        <div>
                           <h3 className="text-xl font-black text-neonorte-deepPurple uppercase italic leading-none">Projeção Financeira</h3>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Comparativo Patrimonial em 25 anos</p>
                        </div>
                        <div className="bg-neonorte-green/10 text-neonorte-darkGreen p-2 rounded-xl">
                           <TrendingUp size={20} />
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="space-y-2">
                           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                              <span className="text-slate-500">Gasto a Fundo Perdido (Concessionária)</span>
                              <span className="text-red-500">{formatMoney(data.currentMonthlyCost * 12 * 25)}</span>
                           </div>
                           <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full w-full bg-red-400/20"></div>
                           </div>
                           <p className="text-[9px] text-slate-400 italic mt-1">*Considerando inflação energética média de 4.5% a.a.</p>
                        </div>
                        <div className="space-y-2">
                           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                              <span className="text-neonorte-purple">Investimento em Ativo (Seu Sistema)</span>
                              <span className="text-neonorte-green">{formatMoney(data.totalInvestment)}</span>
                           </div>
                           <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full w-[15%] bg-neonorte-green"></div>
                           </div>
                        </div>
                     </div>
                  </div>
               </section>

               <section className="grid grid-cols-3 gap-5">
                  {[
                     { icon: Activity, val: `${data.systemSize.toFixed(2)}`, unit: "kWp", label: "Potência Instalada", color: "text-neonorte-purple", note: "Capacidade total de geração dos módulos." },
                     { icon: Zap, val: `${Math.round(data.avgMonthlyGeneration)}`, unit: "kWh", label: "Geração Média", color: "text-neonorte-green", note: "Energia média injetada na rede mensalmente." },
                     { icon: Target, val: `${data.resumo_financeiro.payback_estimado_anos}`, unit: "ANOS", label: "Payback Estimado", color: "text-neonorte-deepPurple", note: "Tempo para recuperar 100% do capital investido." }
                  ].map((m, i) => (
                     <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 text-center shadow-lg border-b-4 border-slate-100 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl mx-auto flex items-center justify-center mb-4">
                           <m.icon size={24} className={m.color} />
                        </div>
                        <p className={`text-3xl font-black ${m.color} font-mono tracking-tighter leading-none mb-2`}>{m.val}<span className="text-xs ml-1 opacity-40 font-bold">{m.unit}</span></p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{m.label}</p>
                        <p className="text-[9px] text-slate-400 leading-tight max-w-[90%] opacity-80">{m.note}</p>
                     </div>
                  ))}
               </section>
            </main>
            <Footer pageNum={1} totalPages={totalPages} />
         </Page>

         {/* PÁGINA 02: MAPEAMENTO VIA SATÉLITE (CONDICIONAL) */}
         {data.mapImage && (
            <Page>
               <Header />
               <main className="flex-grow flex flex-col gap-5">
                  <div className="flex items-center justify-between border-l-4 border-neonorte-green pl-4 py-1">
                     <div>
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-neonorte-deepPurple italic leading-none">Análise de Implantação</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Levantamento Geoespacial Premium</p>
                     </div>
                     <div className="bg-white text-neonorte-deepPurple border border-neonorte-deepPurple/10 px-5 py-2 rounded-xl flex items-center gap-2 shadow-md">
                        <Target size={16} className="text-neonorte-green" />
                        <span className="text-[10px] font-black uppercase tracking-widest italic">Precisão Satelital</span>
                     </div>
                  </div>

                  <div className="flex-1 bg-slate-900 rounded-[2.5rem] p-4 relative overflow-hidden shadow-2xl border border-slate-800 flex flex-col min-h-[400px]">
                     <div className="absolute top-0 left-0 w-full h-[60%] bg-gradient-to-b from-black/50 to-transparent z-10 pointer-events-none"></div>

                     {/* Map Image Container */}
                     <div className="flex-1 rounded-[2rem] overflow-hidden relative border border-white/10 bg-slate-800">
                        <img src={data.mapImage} alt="Mapeamento do Telhado" className="w-full h-full object-cover" />

                        <div className="absolute top-6 left-6 z-20 bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl border border-site-100 shadow-xl">
                           <div className="flex items-center gap-3">
                              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
                              <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">Área Útil Mapeada</p>
                           </div>
                           <p className="text-3xl font-black text-neonorte-deepPurple font-mono mt-2">{data.roofArea} <span className="text-sm text-slate-400">m²</span></p>
                        </div>

                        <div className="absolute bottom-6 right-6 z-20 bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl">
                           <p className="text-[9px] font-black text-neonorte-deepPurple uppercase tracking-widest mb-1.5">Coordenadas de Precisão</p>
                           <p className="text-xs font-mono font-bold text-slate-600">{data.lat?.toFixed(6)}, {data.lng?.toFixed(6)}</p>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-3 gap-5">
                     <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                        <div className="bg-neonorte-purple p-2.5 rounded-xl text-white"><Sun size={18} /></div>
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Irradiação Local</p>
                           <p className="text-xl font-black text-neonorte-deepPurple">{data.irradiationLocal} <span className="text-[10px] text-slate-400">kWh/m²</span></p>
                        </div>
                     </div>
                     <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                        <div className="bg-neonorte-green p-2.5 rounded-xl text-white"><Navigation size={18} /></div>
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Orientação</p>
                           <p className="text-xl font-black text-neonorte-deepPurple">{data.orientation}</p>
                        </div>
                     </div>
                     <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                        <div className="bg-neonorte-purple p-2.5 rounded-xl text-white"><Box size={18} /></div>
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Módulos</p>
                           <p className="text-xl font-black text-neonorte-deepPurple">{data.panelCount} <span className="text-[10px] text-slate-400">Und.</span></p>
                        </div>
                     </div>
                  </div>
               </main>
               <Footer pageNum={2} totalPages={totalPages} />
            </Page>
         )}

         {/* PÁGINA 03: ENGENHARIA E PERFORMANCE */}
         <Page>
            <Header />
            <main className="flex-grow flex flex-col gap-5">
               <div className="flex items-center justify-between border-l-4 border-neonorte-green pl-4 py-1">
                  <div>
                     <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neonorte-deepPurple italic leading-none">Especificações Técnicas</h3>
                  </div>
               </div>

               <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.02] text-slate-800"><Box size={200} strokeWidth={1} /></div>

                  <div className="relative z-10">
                     <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                        <div className="bg-neonorte-deepPurple p-2 rounded-xl text-white shadow-lg"><Box size={20} /></div>
                        <div>
                           <h3 className="text-sm font-black uppercase tracking-[0.2em] text-neonorte-deepPurple italic leading-none">Hardware do Sistema</h3>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Especificações Técnicas Detalhadas</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-12">
                        {/* Módulos */}
                        <div className="space-y-4">
                           <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                              <div className="w-1.5 h-1.5 bg-neonorte-green rounded-full"></div>
                              Módulos Fotovoltaicos
                           </h4>
                           <div className="space-y-3 font-mono text-[10px]">
                              <div className="flex justify-between items-end border-b border-slate-100 pb-1 border-dotted">
                                 <span className="text-slate-400 uppercase font-sans text-[9px] font-bold tracking-wider">Fabricante</span>
                                 <span className="font-black text-slate-700">{primaryModule.manufacturer}</span>
                              </div>
                              <div className="flex justify-between items-end border-b border-slate-100 pb-1 border-dotted">
                                 <span className="text-slate-400 uppercase font-sans text-[9px] font-bold tracking-wider">Potência</span>
                                 <span className="font-black text-slate-700">{primaryModule.power} Wp</span>
                              </div>
                              <div className="flex justify-between items-end border-b border-slate-100 pb-1 border-dotted">
                                 <span className="text-slate-400 uppercase font-sans text-[9px] font-bold tracking-wider">Tecnologia</span>
                                 <span className="font-black text-slate-700">{primaryModule.type || 'PERC/TopCon'}</span>
                              </div>
                              <div className="flex justify-between items-end border-b border-slate-100 pb-1 border-dotted">
                                 <span className="text-slate-400 uppercase font-sans text-[9px] font-bold tracking-wider">Eficiência</span>
                                 <span className="font-black text-slate-700">{primaryModule.efficiency}%</span>
                              </div>
                              <div className="flex justify-between items-end bg-neonorte-green/5 p-2 rounded-lg -mx-2">
                                 <span className="text-neonorte-deepPurple uppercase font-sans text-[9px] font-bold tracking-wider">Garantia Linear</span>
                                 <span className="font-black text-neonorte-green">25 ANOS</span>
                              </div>
                           </div>
                        </div>

                        {/* Inversores */}
                        <div className="space-y-4">
                           <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                              <div className="w-1.5 h-1.5 bg-neonorte-purple rounded-full"></div>
                               {/* [UX FIX] Terminologia corrigida: "Inversor de Frequência" → "Inversor Fotovoltaico" */}
                               Inversor Fotovoltaico
                           </h4>
                           <div className="space-y-3 font-mono text-[10px]">
                              <div className="flex justify-between items-end border-b border-slate-100 pb-1 border-dotted">
                                 <span className="text-slate-400 uppercase font-sans text-[9px] font-bold tracking-wider">Fabricante</span>
                                 <span className="font-black text-slate-700">{primaryInverter.manufacturer}</span>
                              </div>
                              <div className="flex justify-between items-end border-b border-slate-100 pb-1 border-dotted">
                                 <span className="text-slate-400 uppercase font-sans text-[9px] font-bold tracking-wider">Monitoramento</span>
                                 <span className="font-black text-slate-700">Wi-Fi Integrado</span>
                              </div>
                              <div className="flex justify-between items-end border-b border-slate-100 pb-1 border-dotted">
                                 <span className="text-slate-400 uppercase font-sans text-[9px] font-bold tracking-wider">Topologia</span>
                                 <span className="font-black text-slate-700">Transformerless</span>
                              </div>
                              <div className="flex justify-between items-end border-b border-slate-100 pb-1 border-dotted">
                                 <span className="text-slate-400 uppercase font-sans text-[9px] font-bold tracking-wider">Rastreamento</span>
                                 <span className="font-black text-slate-700">MPPT Dinâmico</span>
                              </div>
                              <div className="flex justify-between items-end bg-neonorte-purple/5 p-2 rounded-lg -mx-2">
                                 <span className="text-neonorte-deepPurple uppercase font-sans text-[9px] font-bold tracking-wider">Garantia Fábrica</span>
                                 <span className="font-black text-neonorte-purple">07 ANOS</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-lg relative">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="bg-neonorte-green/10 p-2 rounded-xl text-neonorte-green"><TrendingUp size={18} /></div>
                     <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-neonorte-deepPurple italic">Performance de Geração (kWh)</h4>
                     </div>
                  </div>
                  <div className="h-[180px]">
                     <GenerationChart data={data.chartData} />
                  </div>
               </div>

               <div className="grid grid-cols-12 gap-5">
                  <div className="col-span-8 bg-white rounded-[2.5rem] p-6 text-slate-800 relative overflow-hidden shadow-lg border border-slate-100">
                     <div className="relative z-10 flex justify-between items-start mb-4">
                        <div>
                           <div className="flex items-center gap-2 text-neonorte-green mb-1">
                              <Sparkles size={16} />
                              <h4 className="text-sm font-black uppercase italic leading-none tracking-tight text-slate-800">Fluxo de Caixa Acumulado</h4>
                           </div>
                           <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">Evolução patrimonial</p>
                        </div>
                        <div className="text-right">
                           <p className="text-xl font-black text-neonorte-green font-mono italic tracking-tighter">{formatMoney(data.resumo_financeiro.roi_25_anos)}</p>
                        </div>
                     </div>
                     <div className="h-[140px]">
                        <CumulativeSavingsChart annualSavings={data.annualSavings} investment={data.totalInvestment} />
                     </div>
                  </div>

                  <div className="col-span-4 bg-neonorte-green p-5 rounded-[2.5rem] flex flex-col justify-center items-center text-center shadow-lg relative overflow-hidden">
                     <Rocket size={28} className="text-neonorte-deepPurple mb-3 relative z-10" />
                     <h4 className="text-sm font-black text-neonorte-deepPurple uppercase leading-tight mb-2 italic relative z-10">Retorno <br />Líquido</h4>
                     <p className="text-[10px] font-black text-neonorte-deepPurple leading-relaxed italic relative z-10 uppercase tracking-tight">
                        "Otimizado para máxima rentabilidade com menor tempo de retorno."
                     </p>
                  </div>
               </div>
            </main>
            <Footer pageNum={data.mapImage ? 3 : 2} totalPages={totalPages} />
         </Page>

         {/* PÁGINA 04: FECHAMENTO COMERCIAL */}
         <Page>
            <Header />
            <main className="flex-grow flex flex-col gap-5">
               <div className="flex items-center justify-between border-l-4 border-neonorte-green pl-4 py-1">
                  <div>
                     <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neonorte-deepPurple italic leading-none">Resumo do Investimento</h3>
                  </div>
               </div>

               <div className="bg-slate-50 rounded-[3rem] p-8 text-slate-800 relative overflow-hidden shadow-xl border border-slate-200">
                  <div className="grid grid-cols-2 gap-10 relative z-10 mb-8">
                     <div className="space-y-4">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                           <Box size={14} className="text-neonorte-purple" /> Kit Fotovoltaico
                        </p>
                        <p className="text-4xl font-black text-slate-800 font-mono italic tracking-tighter">{formatMoney(data.resumo_financeiro.total_hardware_estimado)}</p>
                        <p className="text-[10px] text-slate-500 leading-tight">Módulos, Inversor, Estrutura, Cabos e Proteções.</p>
                     </div>
                     <div className="space-y-4 border-l border-slate-200 pl-8">
                        <p className="text-[9px] font-black text-neonorte-green uppercase tracking-[0.3em] flex items-center gap-2">
                           <HardHat size={14} className="text-neonorte-green" /> Serviços & Engenharia
                        </p>
                        <p className="text-4xl font-black text-neonorte-green font-mono italic tracking-tighter">{formatMoney(data.resumo_financeiro.total_servicos_contratados)}</p>
                        <p className="text-[10px] text-slate-500 leading-tight">Projeto, Homologação, Instalação e Ativação.</p>
                     </div>
                  </div>

                  <div className="bg-white rounded-[2.5rem] p-8 flex justify-between items-center border border-slate-100 shadow-md">
                     <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Total Consolidado</p>
                        <p className="text-5xl font-black text-slate-800 tracking-tighter font-mono italic leading-none">{formatMoney(data.resumo_financeiro.investimento_total_referencia)}</p>
                     </div>
                     <div className="bg-slate-50 px-8 py-4 rounded-[1.5rem] text-center border border-slate-200">
                        <p className="text-[9px] font-black text-neonorte-deepPurple uppercase tracking-widest mb-1.5">Payback</p>
                        <p className="text-3xl font-black text-neonorte-purple font-mono italic leading-none">{data.resumo_financeiro.payback_estimado_anos} <span className="text-[10px] font-bold uppercase">Anos</span></p>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                     <h5 className="font-black text-[9px] uppercase text-slate-400 tracking-[0.4em] flex items-center gap-2">
                        <ShieldCheck size={14} className="text-neonorte-purple" /> Garantias
                     </h5>
                     <div className="bg-slate-50 rounded-[2.5rem] border border-slate-100 p-6 space-y-4">
                        {[
                           { label: "Módulos", term: "25 ANOS", sub: "Eficiência Linear" },
                           { label: "Inversores", term: "07 ANOS", sub: "Defeito de Fábrica" },
                           { label: "Instalação", term: "01 ANO", sub: "Garantia Técnica NeoNorte" }
                        ].map((g, i) => (
                           <div key={i} className="flex justify-between items-center">
                              <div>
                                 <p className="text-[10px] font-black text-slate-900 uppercase leading-none mb-1.5">{g.label}</p>
                                 <p className="text-[9px] text-slate-400 uppercase font-bold">{g.sub}</p>
                              </div>
                              <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-[10px] font-black text-neonorte-purple italic shadow-sm">
                                 {g.term}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-3">
                     <h5 className="font-black text-[9px] uppercase text-slate-400 tracking-[0.4em] flex items-center gap-2">
                        <Rocket size={14} className="text-neonorte-purple" /> Etapas
                     </h5>
                     <div className="bg-white rounded-[2.5rem] p-6 space-y-4 shadow-xl relative overflow-hidden border border-slate-100">
                        {[
                           { label: "Assinatura Contratual", step: "01" },
                           { label: "Vistoria & Engenharia", step: "02" },
                           { label: "Instalação Técnica", step: "03" },
                           { label: "Homologação & Ativação", step: "04" }
                        ].map((step, i) => (
                           <div key={i} className="flex justify-between items-center relative z-10">
                              <div className="flex items-center gap-4">
                                 <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xs font-black text-neonorte-green">
                                    {step.step}
                                 </div>
                                 <p className="text-[10px] font-black text-slate-700 uppercase italic tracking-widest">{step.label}</p>
                              </div>
                              <div className="w-2 h-2 rounded-full bg-neonorte-green shadow-[0_0_8px_#05CD46]"></div>
                           </div>
                        ))}
                        <div className="absolute left-[2.2rem] top-8 bottom-8 w-[1px] bg-slate-100 -z-0"></div>
                     </div>
                  </div>
               </div>

               <section className="mt-auto flex flex-col items-center">
                  <div className="flex flex-col items-center mb-6">
                     <div className="w-20 h-20 rounded-2xl border-4 border-slate-50 bg-white flex items-center justify-center mb-4 overflow-hidden shadow-xl">
                        <HardHat size={40} className="text-slate-300" />
                     </div>
                     <div className="text-center">
                        <p className="text-xl font-black text-neonorte-deepPurple mb-1 italic uppercase tracking-tighter">{data.engineerName}</p>
                        <p className="text-[9px] font-black text-neonorte-purple uppercase tracking-[0.4em] opacity-50">Engenheiro Eletricista • CREA-PA {data.creaNumber}</p>
                     </div>
                  </div>
                  <div className="bg-neonorte-deepPurple text-white px-10 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-4 shadow-xl italic border border-white/10">
                     <Award size={20} className="text-neonorte-green" /> Válido por 10 dias
                  </div>
                  <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.6em] mt-8 text-center">NeoNorte Engenharia & Performance LTDA</p>
               </section>
            </main>
            <Footer pageNum={data.mapImage ? 4 : 3} totalPages={totalPages} />
         </Page>

         <style>{`
        @page { size: A4; margin: 0 !important; }
        .proposal-container { width: 100%; background: #f1f5f9; }
        .proposal-page { 
          width: 210mm; height: 297mm; 
          margin: 0 auto 10mm auto; 
          background-color: white !important;
          page-break-after: always !important;
          break-after: page !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        @media print {
          .proposal-container { background: white !important; padding: 0 !important; margin: 0 !important; }
          .proposal-page { margin: 0 !important; box-shadow: none !important; }
          body, html { margin: 0 !important; padding: 0 !important; }
        }
      `}</style>
      </div>
   );
};

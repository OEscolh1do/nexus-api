

import React, { useState, useEffect, useCallback } from 'react';
import { InputForm } from './components/InputForm';
import { EnergyFluxForm } from './components/EnergyFluxForm';
import { TechnicalForm } from './components/TechnicalForm';
import { AnalysisPhase } from './components/AnalysisPhase';
import { ServiceCompositionPhase } from './components/ServiceCompositionPhase';
import { ProposalTemplate } from './components/ProposalTemplate';
import { SettingsPanel } from './components/SettingsPanel';
import { InputData, ProposalData, ViewState, InverterSpecs, ModuleSpecs, EngineeringSettings, WeatherAnalysis } from './types';
import { calculateProposal, recalculateProposal, updateProposalInverters, calculateInstallments } from './services/solarEngine';
import { Printer, Settings as SettingsIcon, Check, Sun, ChevronLeft, Loader2 } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { fetchWeatherAnalysis } from './services/weatherService';

const DEFAULT_SETTINGS: EngineeringSettings = {
  performanceRatio: 0.75,
  orientationFactors: { norte: 1.0, leste: 0.95, oeste: 0.95, sul: 0.85 },
  referenceKitPricePerKwp: 2800,
  monthlyInterestRate: 0.015,
  marginPercentage: 0.22,
  commissionPercentage: 0.025,
  taxPercentage: 0.05,
  engineerName: "Breno Barbosa Guedes Nunes",
  creaNumber: "151311686-0",
  companyCnpj: "44.389.208/0001-10",
  co2Factor: 0.084,
  serviceUnitModule: 131.25,
  serviceUnitStructure: 99.15,
  serviceUnitInverter: 500.32,
  serviceProjectBase: 600.00,
  serviceProjectPercent: 1.00,
  serviceAdminBase: 1542.36,
  serviceAdminPercent: 1.35,
  serviceMaterialsPercent: 0.22,
  energyInflationRate: 0.045 // 4.5% a.a. IPCA Médio Energia
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.FORM);
  const [proposalData, setProposalData] = useState<ProposalData | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [weatherAnalysis, setWeatherAnalysis] = useState<WeatherAnalysis | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  const [inputData, setInputData] = useState<InputData>({
    clientName: '', city: 'Parauapebas', state: 'PA', street: '', neighborhood: '', number: '', complement: '',
    lat: -6.0673, lng: -49.9022, orientation: 'Norte', availableArea: 0, tariffRate: 0.92,
    invoices: [{
      id: '1', name: 'Unidade Principal', monthlyHistory: [350, 380, 400, 420, 390, 360, 350, 340, 380, 410, 440, 460],
      installationNumber: '', concessionaire: 'Equatorial', rateGroup: 'B', connectionType: 'bifasico', voltage: '220', breakerCurrent: 40
    }],
  });

  const [settings, setSettings] = useState<EngineeringSettings>(() => {
    const saved = localStorage.getItem('engineering_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('engineering_settings', JSON.stringify(settings));
  }, [settings]);

  // Função de Pré-carregamento Meteorológico (Nasa Solar)
  const prefetchWeatherData = useCallback(async (lat: number, lng: number, city: string, state: string) => {
    setIsWeatherLoading(true);
    try {
      const result = await fetchWeatherAnalysis(lat, lng, city, state, process.env.API_KEY || '');
      setWeatherAnalysis(result);
    } catch (err) {
      console.error("Weather Prefetch critical failure:", err);
    } finally {
      setIsWeatherLoading(false);
    }
  }, []);

  const handleLevantamentoSubmit = (data: InputData) => {
    setInputData(data);
    setView(ViewState.ENERGY_FLUX);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Inicia a sincronização meteorológica em background assim que avança da Fase 1
    prefetchWeatherData(data.lat, data.lng, data.city, data.state);
  };

  const handleEnergyFluxConfirm = (data: InputData) => {
    setInputData(data);
    const calculated = calculateProposal(data, settings);
    setProposalData(calculated);
    setView(ViewState.TECH_CONFIG);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTechConfirm = (modules: ModuleSpecs[], inverters: InverterSpecs[], manualKitPrice: number) => {
    if (proposalData) {
      const baseWithManual = { ...proposalData, kitPrice: manualKitPrice };
      let step1 = recalculateProposal(baseWithManual, modules, settings);
      let final = updateProposalInverters(step1, inverters, settings);

      const updatedTotalInvestment = manualKitPrice + final.servicePrice;
      const annualSavings = final.annualSavings || 1;
      const updatedPayback = updatedTotalInvestment / annualSavings;

      const finalWithFinancialSync = {
        ...final,
        kitPrice: manualKitPrice,
        totalInvestment: updatedTotalInvestment,
        paybackYears: Number(updatedPayback.toFixed(1)),
        installments: calculateInstallments(manualKitPrice),
        resumo_financeiro: {
          ...final.resumo_financeiro,
          total_hardware_estimado: manualKitPrice,
          total_servicos_contratados: final.servicePrice,
          investimento_total_referencia: updatedTotalInvestment,
          payback_estimado_anos: Number(updatedPayback.toFixed(1)),
          roi_25_anos: (annualSavings * 25) - updatedTotalInvestment
        }
      };

      setProposalData(finalWithFinancialSync);
      setView(ViewState.ANALYSIS);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAnalysisConfirm = (updatedData: ProposalData) => {
    setProposalData(updatedData);
    setView(ViewState.SERVICE_COMPOSITION);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleServiceConfirm = (updatedData: ProposalData) => {
    setProposalData(updatedData);
    setView(ViewState.PREVIEW);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    const flow = [ViewState.FORM, ViewState.ENERGY_FLUX, ViewState.TECH_CONFIG, ViewState.ANALYSIS, ViewState.SERVICE_COMPOSITION, ViewState.PREVIEW];
    const currentIndex = flow.indexOf(view);
    if (currentIndex > 0) setView(flow[currentIndex - 1]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    // Aguarda ciclo de renderização para garantir que UI atualize (ex: removendo botões se necessário)
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const pages = document.querySelectorAll('.proposal-page');
      if (pages.length === 0) throw new Error("Páginas não encontradas");

      const pdf = new jsPDF('p', 'mm', 'a4');

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        const canvas = await html2canvas(page, {
          scale: 2, // Melhor resolução
          useCORS: true,
          logging: false,
          windowWidth: page.scrollWidth,
          windowHeight: page.scrollHeight
        });

        const imgData = canvas.toDataURL('image/png');

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      }

      pdf.save(`Proposta_Neonorte_${proposalData?.clientName.replace(/\s+/g, '_') || 'Solar'}.pdf`);

    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Houve um erro ao gerar o PDF. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  const STEPS = [
    { key: ViewState.FORM, label: "Mapeamento" },
    { key: ViewState.ENERGY_FLUX, label: "Demanda" },
    { key: ViewState.TECH_CONFIG, label: "Sizing" },
    { key: ViewState.ANALYSIS, label: "NASA Solar" },
    { key: ViewState.SERVICE_COMPOSITION, label: "Orçamento" },
    { key: ViewState.PREVIEW, label: "Proposta" }
  ];

  return (
    <div className="min-h-screen pb-24 selection:bg-neonorte-green/20 selection:text-neonorte-deepPurple">

      <div className="fixed top-8 right-8 z-[60] print:hidden">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="bg-white/90 backdrop-blur-xl border border-slate-200 p-4 rounded-2xl shadow-xl hover:scale-110 transition-all text-neonorte-purple group"
        >
          <SettingsIcon size={24} className="group-hover:rotate-180 transition-transform duration-700" />
        </button>
      </div>

      <SettingsPanel settings={settings} isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onSave={(newS) => { setSettings(newS); setIsSettingsOpen(false); }} />

      {view !== ViewState.PREVIEW && (
        <div className="container mx-auto px-4 pt-12 pb-12 print:hidden">
          <div className="flex flex-col items-center mb-16">
            <div className="flex items-center justify-center mb-8">
              <img
                src="/assets/logos/NEONORTE ASS VERT - 01 - ROXO.png"
                alt="NeoNorte Engenharia"
                className="h-32 object-contain hover:scale-105 transition-transform duration-500 drop-shadow-2xl"
              />
            </div>

            <div className="w-full max-w-4xl relative px-4 mt-8">
              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-200 -translate-y-1/2 z-0"></div>
              <div className="flex items-center justify-between relative z-10">
                {STEPS.map((s, idx) => {
                  const flowKeys = STEPS.map(x => x.key);
                  const activeIdx = flowKeys.indexOf(view);
                  const isPast = idx < activeIdx;
                  const isActive = idx === activeIdx;

                  return (
                    <div key={idx} className="flex flex-col items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 border-2 ${isPast ? 'bg-neonorte-green border-neonorte-green text-white scale-90' :
                        isActive ? 'bg-white border-neonorte-purple text-neonorte-purple scale-125 shadow-2xl ring-8 ring-neonorte-purple/5' :
                          'bg-white border-slate-200 text-slate-300'
                        }`}>
                        {isPast ? <Check size={18} strokeWidth={4} /> : <span className="font-black text-xs">{idx + 1}</span>}
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${isActive ? 'text-neonorte-purple' : 'text-slate-400'}`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`container mx-auto px-4 ${view === ViewState.PREVIEW ? 'print-container max-w-full' : 'max-w-6xl'}`}>
        <div className={`animate-in fade-in slide-in-from-bottom-6 duration-700 ${view === ViewState.PREVIEW ? 'print-container' : ''}`}>
          {view === ViewState.FORM && <InputForm initialData={inputData} onSubmit={handleLevantamentoSubmit} />}
          {view === ViewState.ENERGY_FLUX && <EnergyFluxForm initialData={inputData} onBack={handleBack} onConfirm={handleEnergyFluxConfirm} />}
          {view === ViewState.TECH_CONFIG && proposalData && <TechnicalForm initialModules={proposalData.modules} initialInverters={proposalData.inverters} settings={settings} onBack={handleBack} onConfirm={handleTechConfirm} />}
          {view === ViewState.ANALYSIS && proposalData && (
            <AnalysisPhase
              data={proposalData}
              preloadedAnalysis={weatherAnalysis}
              isPreloading={isWeatherLoading}
              onBack={handleBack}
              onConfirm={handleAnalysisConfirm}
            />
          )}
          {view === ViewState.SERVICE_COMPOSITION && proposalData && <ServiceCompositionPhase data={proposalData} onBack={handleBack} onConfirm={handleServiceConfirm} />}
        </div>

        {view === ViewState.PREVIEW && proposalData && (
          <div className="relative min-h-screen bg-neonorte-deepPurple flex justify-center py-12 print:p-0 print:bg-white animate-in zoom-in-95 duration-500 print-container">
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-neonorte-deepPurple/80 backdrop-blur-2xl text-white px-10 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-8 z-50 print:hidden border border-white/10">
              <button onClick={handleBack} className="flex items-center gap-3 hover:text-neonorte-green transition-all font-black text-[10px] uppercase tracking-widest group">
                <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Voltar
              </button>
              <div className="h-6 w-[1px] bg-white/10"></div>
              <button
                onClick={handleDownloadPDF}
                disabled={isExporting}
                className="flex items-center gap-3 font-black text-neonorte-green hover:text-white hover:scale-105 transition-all uppercase text-[10px] tracking-widest disabled:opacity-50"
              >
                {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
                {isExporting ? 'Gerando Arquivo PDF...' : 'Baixar Proposta (PDF)'}
              </button>
            </div>
            <ProposalTemplate data={proposalData} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
      `}</style>
    </div>
  );
};

export default App;

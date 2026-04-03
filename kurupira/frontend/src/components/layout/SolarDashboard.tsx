
import { useState, useMemo, FC } from 'react';
import { InputData, EngineeringSettings, ProposalData, ModuleSpecs, InverterSpecs, WeatherAnalysis } from '@/core/types';
import { InputForm } from '@/components/forms/InputForm';
import { EnergyFluxForm } from '@/components/forms/EnergyFluxForm';
import { TechnicalForm } from '@/components/forms/TechnicalForm';
import { ServiceCompositionPhase } from '@/components/phases/ServiceCompositionPhase';
import { SettingsPanel } from '@/components/ui/SettingsPanel';
import { DocumentationModule } from '@/modules/documentation/DocumentationModule';
import { 
  Check, 
  PanelLeftClose, 
  PanelLeft,
  Sun
} from 'lucide-react';
import { 
  DASHBOARD_TABS, 
  TabId, 
  TAB_COLOR_CLASSES, 
  isTabCompleted
} from '@/config/navigation';

interface Props {
  initialInputData: InputData;
  settings: EngineeringSettings;
  onSettingsChange: (settings: EngineeringSettings) => void;
}

export const SolarDashboard: FC<Props> = ({ 
  initialInputData, 
  settings, 
  onSettingsChange 
}) => {
  // UI STATE
  const [activeTab, setActiveTab] = useState<TabId>('crm' as TabId);
  const [crmStep, setCrmStep] = useState<'input' | 'energy'>('input'); // Sub-step for CRM tab
  // const [showSettings, setShowSettings] = useState(false); // Removed modal state, using tab now
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // DOMAIN STATE
  const [inputData, setInputData] = useState<InputData>(initialInputData);
  const [modules, setModules] = useState<ModuleSpecs[]>([]);
  const [inverters, setInverters] = useState<InverterSpecs[]>([]);
  const [manualKitPrice, setManualKitPrice] = useState<number>(0);
  const [proposalOverrides, setProposalOverrides] = useState<Partial<ProposalData>>({});
  
  // WEATHER STATE (vindo do InputForm)
  const [weatherData, setWeatherData] = useState<WeatherAnalysis | null>(null);

  // COMPUTED: Monthly consumption from invoices
  const monthlyConsumption = useMemo(() => {
    return Array(12).fill(0).map((_, i) => 
      inputData.invoices.reduce((acc, inv) => acc + (inv.monthlyHistory[i] || 0), 0)
    );
  }, [inputData.invoices]);

  // COMPUTED: HSP from weather or default
  const hspMonthly = useMemo(() => {
    if (weatherData?.hsp_monthly && weatherData.hsp_monthly.length === 12) {
      return weatherData.hsp_monthly;
    }
    return [4.5, 4.6, 4.8, 5.1, 5.3, 5.4, 5.5, 5.8, 5.9, 5.6, 5.2, 4.8]; // Default PA
  }, [weatherData]);

  // COMPUTED: ProposalData Reativo
  const proposalData: ProposalData = useMemo(() => {
    const systemSize = modules.reduce((acc, m) => acc + (m.power), 0) / 1000;
    const panelCount = modules.length;
    const primaryModule = modules[0];
    const firstInvoice = inputData.invoices[0];

    const base: ProposalData = {
      clientName: inputData.clientName,
      city: inputData.city,
      state: inputData.state,
      street: inputData.street,
      neighborhood: inputData.neighborhood,
      number: inputData.number,
      complement: inputData.complement,
      lat: inputData.lat,
      lng: inputData.lng,
      tariffRate: inputData.tariffRate,
      // V2.1.0: orientation agora migrou definitivamente para o Canvas 3D e não é injetado via InputData
      availableArea: inputData.availableArea,
      
      installationNumber: firstInvoice?.installationNumber || '',
      connectionType: firstInvoice?.connectionType || 'bifasico',
      concessionaire: firstInvoice?.concessionaire || 'Equatorial',
      rateGroup: firstInvoice?.rateGroup || 'B',
      voltage: firstInvoice?.voltage || '220',
      breakerCurrent: firstInvoice?.breakerCurrent || 40,

      systemSize,
      panelCount,
      roofArea: inputData.availableArea,
      moduleManufacturer: primaryModule?.manufacturer || 'N/A',
      panelPower: primaryModule?.power || 0,
      modules,
      inverters,
      kitPrice: manualKitPrice,
      monthlyConsumption,
      
      monthlyGeneration: Array(12).fill(0),
      chartData: [],
      avgMonthlyGeneration: 0,
      totalInvestment: manualKitPrice,
      servicePrice: 0,
      irradiationLocal: hspMonthly.reduce((a, b) => a + b, 0) / 12,
      irradiationSource: weatherData?.irradiation_source || "Dados Padrao",
      
      annualSavings: 0,
      paybackYears: 0,
      co2Savings: 0,
      peakMonthConsumption: 'Dez',
      peakMonthGeneration: 'Set',
      currentMonthlyCost: monthlyConsumption.reduce((a, b) => a + b, 0) / 12 * inputData.tariffRate,
      newMonthlyCost: 0,
      
      engineerName: settings.engineerName,
      creaNumber: settings.creaNumber,
      inverterWarranty: '10 anos',
      
      serviceSchedule: { assinatura: 20, chegada: 30, troca: 30, finalizacao: 20 },
      installments: [],
      serviceComposition: [],
      resumo_financeiro: {
        total_hardware_estimado: manualKitPrice,
        total_servicos_contratados: 0,
        investimento_total_referencia: manualKitPrice,
        payback_estimado_anos: 0,
        roi_25_anos: 0
      },
      mapImage: inputData.mapImage
    };

    return { ...base, ...proposalOverrides };
  }, [inputData, modules, inverters, manualKitPrice, proposalOverrides, settings.engineerName, settings.creaNumber, monthlyConsumption, hspMonthly, weatherData]);

  // HANDLERS
  const handleInputSubmit = (data: InputData, weather?: WeatherAnalysis) => {
    setInputData(data);
    if (weather) setWeatherData(weather);
    setCrmStep('energy'); // Move to energy step within CRM tab
  };

  const handleEnergyConfirm = (data: InputData) => {
    setInputData(data);
    setActiveTab('engineering'); // Advance to next main tab
  };

  const handleTechnicalConfirm = (mods: ModuleSpecs[], invs: InverterSpecs[], price: number) => {
    setModules(mods);
    setInverters(invs);
    setManualKitPrice(price);
    setActiveTab('electrical'); // Go to electrical (was proposal)
  };

  const handleProposalConfirm = (data: ProposalData) => {
    setProposalOverrides(prev => ({ ...prev, ...data }));
    alert("Fluxo concluido! Proposta pronta para PDF.");
    console.log("Final Data:", data);
  };

  return (
    <div className="h-screen flex bg-slate-100 overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-56'} bg-slate-900 flex flex-col shrink-0 transition-all duration-300 ease-in-out`}>
        {/* Logo */}
        <div className="h-14 flex items-center justify-center border-b border-slate-700/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-neonorte-green to-neonorte-purple rounded-xl flex items-center justify-center shadow-lg">
              <Sun size={18} className="text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-200">
                <h1 className="text-sm font-black text-white tracking-tight">Lumi</h1>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest">Pro Edition</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {DASHBOARD_TABS.map((tab, index) => {
            const isActive = activeTab === tab.id;
            const isCompleted = isTabCompleted(tab.id, activeTab);
            const Icon = tab.icon;
            const colorClasses = TAB_COLOR_CLASSES[tab.color];

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={sidebarCollapsed ? `${tab.label}: ${tab.description}` : tab.description}
                className={`
                  w-full group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-white/10 text-white shadow-lg' 
                    : isCompleted
                      ? 'text-neonorte-green/70 hover:text-neonorte-green hover:bg-white/5'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }
                `}
              >
                <div className={`
                  w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-all
                  ${isActive 
                    ? `${colorClasses.active}` 
                    : isCompleted
                      ? 'bg-neonorte-green/20 text-neonorte-green'
                      : 'bg-slate-800 text-slate-600'
                  }
                `}>
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : <span>{index + 1}</span>}
                </div>
                <Icon size={18} className={`shrink-0 ${isActive ? colorClasses.icon : ''}`} />
                {!sidebarCollapsed && (
                  <div className="flex-1 text-left animate-in fade-in slide-in-from-left-2 duration-200">
                    <span className="text-xs font-bold uppercase tracking-wide block">{tab.label}</span>
                    <span className="text-[10px] text-slate-500 line-clamp-1">{tab.description}</span>
                  </div>
                )}
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-neonorte-green rounded-r-full" />}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-700/50 p-2 space-y-1">
          {/* Settings button now redundant as it is a tab, but keeping Sidebar controls */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-3 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-400 transition-all"
          >
            {sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
            {!sidebarCollapsed && <span className="text-[10px] tracking-wide">Recolher</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {activeTab === ('crm' as TabId) && (
                <>
                  {crmStep === 'input' && (
                    <InputForm initialData={inputData} onSubmit={handleInputSubmit} />
                  )}
                  {crmStep === 'energy' && (
                    <EnergyFluxForm 
                      initialData={inputData} 
                      onBack={() => setCrmStep('input')}
                      onConfirm={handleEnergyConfirm} 
                    />
                  )}
                </>
              )}

              {activeTab === 'engineering' && (
                <TechnicalForm 
                  initialModules={modules}
                  initialInverters={inverters}
                  settings={settings}
                  monthlyConsumption={monthlyConsumption}
                  hspMonthly={hspMonthly}
                  onBack={() => setActiveTab('crm' as TabId)}
                  onConfirm={handleTechnicalConfirm}
                />
              )}

              {activeTab === 'electrical' && (
                <div className="text-center py-20">
                  <h2 className="text-2xl font-bold text-slate-700 mb-2">Dimensionamento Elétrico & BOS</h2>
                  <p className="text-slate-500">Módulo em desenvolvimento. Aqui você configurará cabos, proteções e String Box.</p>
                  
                  {/* Temporary navigation for dev */}
                  <button 
                    onClick={() => setActiveTab('documentation')}
                    className="mt-6 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                  >
                    Pular para Documentação (Dev)
                  </button>
                </div>
              )}

              {activeTab === 'documentation' && (
                <>
                  <DocumentationModule />
                  <div className="flex justify-center mt-6">
                    <button 
                      onClick={() => setActiveTab('finance' as TabId)}
                      className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                    >
                      Próximo: Viabilidade (Dev)
                    </button>
                  </div>
                </>
              )}

              {activeTab === ('finance' as TabId) && (
                <div className="text-center py-20">
                    <h2 className="text-2xl font-bold text-slate-700 mb-2">Análise de Viabilidade</h2>
                    <p className="text-slate-500">Módulo em desenvolvimento. Análise de ROI, Payback e Fluxo de Caixa.</p>
                     {/* Temporary navigation for dev */}
                    <button 
                        onClick={() => setActiveTab('proposal')}
                        className="mt-6 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                    >
                        Pular para Proposta (Dev)
                    </button>
                </div>
              )}

              {activeTab === 'proposal' && (
                <ServiceCompositionPhase 
                   data={proposalData}
                   onBack={() => setActiveTab('finance' as TabId)}
                   onConfirm={handleProposalConfirm}
                />
              )}
              
              {activeTab === 'settings' && (
                 <div className="max-w-3xl mx-auto">
                    {/* Reuse SettingsPanel logic but adapt for inline display if needed. 
                        For now, assuming SettingsPanel can be mounted inline or we just mount it with isOpen=true 
                        but it's a Modal. If it's a modal, we might need to refactor it to be a normal component.
                        Checking imports: SettingsPanel comes from components/ui/SettingsPanel.
                        If it's strictly a modal, we might have issues. 
                        Let's wrap it in a div that makes sense, or mock it if strictly modal.
                        However, reusing the existing modal logic is risky if it depends on external trigger.
                        I will assume 'SettingsPanel' has an 'isOpen' prop.
                        I will render it as a triggered modal for now (auto-open?) or just a placeholder.
                        The user said 'Settings (NOVO): Para o novo painel de premissas'.
                        I'll try to render the SettingsPanel COMPONENT if it supports non-modal mode, 
                        otherwise I'll render a placeholder.
                        Given I haven't seen SettingsPanel code, I'll be safe and render a placeholder with a button to open it,
                        OR just render the component and hope it handles inline. 
                        Actually, the previous code had:
                        <SettingsPanel isOpen={showSettings} ... />
                        So it is a modal.
                        Rendering a Modal inside a Tab is weird.
                        I will render a button "Abrir Configurações" or similar, 
                        OR (better) I'll refactor SettingsPanel later. For now, placeholder.
                    */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Premissas de Engenharia</h2>
                        </div>
                        <p className="text-slate-500 mb-6">Configure as premissas globais para o dimensionamento.</p>
                        
                        <button 
                            onClick={() => { /* Trigger the existing modal logic? No, activeTab is settings. */ }} 
                            className="bg-neonorte-purple text-white px-4 py-2 rounded-lg"
                        >
                            (SettingsPanel aqui - Em breve)
                        </button>
                    </div>
                    {/* We can still keep the SettingsPanel mount at the bottom but force it open if activeTab is settings? */}
                 </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* SETTINGS MODAL - Keeping it for now if triggered from elsewhere or adapted */}
      <SettingsPanel 
        settings={settings}
        isOpen={activeTab === 'settings'} // Auto-open if tab is settings?
        onClose={() => setActiveTab('crm' as TabId)} // Close goes back to home?
        onSave={(newSettings) => {
          onSettingsChange(newSettings);
          // Don't close tab, just save
        }}
      />
    </div>
  );
};

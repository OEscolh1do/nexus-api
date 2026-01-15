// /frontend/src/features/kanban-board/components/ProjectModal.jsx
import { useState, useEffect, useCallback } from 'react';
import api from '../../../lib/axios';
import { 
    Trash2, Package, Compass, Zap, Home, Plus, 
    User, FileText, X, Save, FileDown, MessageSquare, 
    Calendar, Calculator, Paperclip, Download, CloudUpload, Box, Layers, History, ChevronDown, ChevronUp
} from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore'; // <--- 1. IMPORT NECESSÁRIO



const STATUS_MAP = {
  'LEAD': 'Backlog', 'CONTACT': 'Qualificação', 'VISIT': 'Análise Técnica',
  'PROPOSAL': 'Proposta', 'NEGOTIATION': 'Negociação', 'CLOSED': 'Fechado'
};

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const CONNECTION_FEE_MAP = { 'MONOFÁSICO': 30, 'BIFÁSICO': 50, 'TRIFÁSICO': 100 };

// --- COMPONENTES AUXILIARES ---
const SectionHeader = ({ title, icon: Icon, action }) => (
    <div className="flex justify-between items-center mb-3 mt-1 pb-2 border-b border-neo-surface-2/50">
        <h3 className="text-xs font-bold text-neo-white flex items-center gap-2 uppercase tracking-wide">
            {Icon && <Icon size={14} className="text-neo-green-main"/>} {title}
        </h3>
        {action}
    </div>
);

const FormField = ({ label, children }) => (
    <div className="flex flex-col gap-1">
        <label className="text-[10px] font-semibold text-neo-text-sec uppercase">{label}</label>
        {children}
    </div>
);

const StyledInput = (props) => (
    <input {...props} className={`w-full bg-neo-bg-main border border-neo-surface-2 rounded-md px-3 py-2 text-xs text-white focus:border-neo-purple-light focus:ring-1 focus:ring-neo-purple-light outline-none transition-all placeholder-neo-text-sec/30 ${props.className}`} />
);

const StyledSelect = ({ children, ...props }) => (
    <select {...props} className="w-full bg-neo-bg-main border border-neo-surface-2 rounded-md px-3 py-2 text-xs text-white focus:border-neo-purple-light focus:ring-1 focus:ring-neo-purple-light outline-none transition-all cursor-pointer">
        {children}
    </select>
);

// ---------------------------------------------------------------------------

function ProjectModal({ project, onClose, onSaveSuccess }) {
  const token = useAuthStore(state => state.token); // <--- 2. PEGA O TOKEN
  const [activeTab, setActiveTab] = useState('activity'); 

  // --- ESTADOS ---
  const [monthlyUsage, setMonthlyUsage] = useState('');
  const [location, setLocation] = useState('NORDESTE');
  const [roofType, setRoofType] = useState('Cerâmico');
  const [orientation, setOrientation] = useState('NORTE');
  const [roofArea, setRoofArea] = useState('');
  const [consumptionHistory, setConsumptionHistory] = useState(Array(12).fill(''));
  const [showMonthlyDetails, setShowMonthlyDetails] = useState(false);

  const [units, setUnits] = useState([]);
  const [newUnit, setNewUnit] = useState({
      code: '', averageAvg: '', isGenerator: false,
      titular: '', group: 'B', meterNumber: '', availabilityFee: '50', voltage: '220', concessionaire: 'Equatorial'
  });

  const [price, setPrice] = useState('');
  const [energyTariff, setEnergyTariff] = useState('');
  const [selectedPanelId, setSelectedPanelId] = useState('');
  const [panelModel, setPanelModel] = useState(''); 
  const [selectedInverterId, setSelectedInverterId] = useState('');
  const [inverterModel, setInverterModel] = useState(''); 
  const [catalogPanels, setCatalogPanels] = useState([]);
  const [catalogInverters, setCatalogInverters] = useState([]);
  const [connectionType, setConnectionType] = useState('BIFÁSICO');
  const [availabilityFee, setAvailabilityFee] = useState(50);
  const [annualInflation, setAnnualInflation] = useState('7.0');
  const [panelDegradation, setPanelDegradation] = useState('0.8');

  const [isCalculating, setIsCalculating] = useState(false);
  const [isSavingCommercial, setIsSavingCommercial] = useState(false);
  const [calculationResult, setCalculationResult] = useState(null);
  const [bom, setBom] = useState(null); 

  const [activities, setActivities] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // --- CONFIG AXIOS COM TOKEN ---


  // --- CARREGAMENTO ---
  useEffect(() => {
    // Catálogos são públicos ou protegidos? Se protegidos, adicione authConfig
    api.get('/catalog/panels').then(res => setCatalogPanels(res.data)).catch(console.error);
    api.get('/catalog/inverters').then(res => setCatalogInverters(res.data)).catch(console.error);
  }, [token]);

  const loadActivities = useCallback(() => {
    if (!project || !token) return;
    api.get(`/projects/${project.id}/activities`).then(res => setActivities(res.data));
  }, [project, token]);

  const loadAttachments = useCallback(() => {
    if (!project || !token) return;
    api.get(`/projects/${project.id}/attachments`).then(res => setAttachments(res.data));
  }, [project, token]);

  const loadUnits = useCallback(async () => {
      if(!project || !token) return;
      try {
          const res = await api.get(`/projects/${project.id}`);
          if (res.data.units) {
              setUnits(res.data.units);
              if (res.data.units.length > 0) {
                  const total = res.data.units.reduce((acc, u) => acc + (u.averageAvg || 0), 0);
                  setMonthlyUsage(total.toString());
              }
          }
      } catch (e) { console.error(e); }
  }, [project, token]);

  useEffect(() => {
    if (project) {
      setMonthlyUsage(project.monthlyUsage || '');
      setLocation(project.location || 'NORDESTE');
      setRoofType(project.roofType || 'Cerâmico');
      setOrientation(project.orientation || 'NORTE');
      setRoofArea(project.roofArea || '');
      setConsumptionHistory(project.consumptionHistory && project.consumptionHistory.length > 0 ? project.consumptionHistory : Array(12).fill(''));
      
      setPrice(project.price || '');
      setEnergyTariff(project.energyTariff || '');
      
      setSelectedPanelId(project.solarPanelId || '');
      setPanelModel(project.panelModel || '');
      setSelectedInverterId(project.inverterId || '');
      setInverterModel(project.inverterModel || '');

      setConnectionType(project.connectionType || 'BIFÁSICO');
      setAvailabilityFee(project.availabilityFee || 50);
      setAnnualInflation(project.annualInflation ? (project.annualInflation * 100).toString() : '7.0');
      setPanelDegradation(project.panelDegradation ? (project.panelDegradation * 100).toString() : '0.8');

      if (project.systemSize && (project.monthlyUsage || project.estimatedGen)) {
        const gen = project.estimatedGen || 0;
        const usage = project.monthlyUsage || 1;
        const coverage = Math.round((gen / usage) * 100);
        setCalculationResult({
            systemSize: project.systemSize,
            panelCount: project.panelCount,
            estimatedGen: project.estimatedGen,
            inverterSize: project.inverterSize,
            coverage: coverage
        });
        setBom(project.bom);
      } else { 
          setCalculationResult(null); 
          setBom(null);
      }
      
      loadActivities();
      loadAttachments();
      loadUnits();
    }
  }, [project, loadActivities, loadAttachments, loadUnits]);

  if (!project) return null;

  // --- HANDLERS ---
  const handleNewUnitChange = (e) => {
      const { name, value, type, checked } = e.target;
      setNewUnit(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAddUnit = async () => {
      if (!newUnit.code || !newUnit.averageAvg) return alert("Preencha a conta e a média.");
      try {
          await api.post(`/projects/${project.id}/units`, newUnit);
          setNewUnit({ 
              code: '', averageAvg: '', isGenerator: false, titular: '', meterNumber: '', 
              group: 'B', availabilityFee: '50', voltage: '220', concessionaire: 'Equatorial' 
          });
          loadUnits();
      } catch (error) { alert("Erro ao adicionar unidade."); }
  };

  const handleRemoveUnit = async (unitId) => {
      if(window.confirm("Remover unidade?")) {
          try { await api.delete(`/units/${unitId}`); loadUnits(); } 
          catch (e) { alert("Erro ao remover."); }
      }
  };

  const handlePanelSelect = (e) => { 
      const id = e.target.value; setSelectedPanelId(id); 
      const s = catalogPanels.find(p => p.id === id); if(s) setPanelModel(s.model); 
  };
  const handleInverterSelect = (e) => { 
      const id = e.target.value; setSelectedInverterId(id); 
      const s = catalogInverters.find(i => i.id === id); if(s) setInverterModel(s.model); 
  };

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
        const historyToSend = consumptionHistory.map(v => parseFloat(v) || parseFloat(monthlyUsage) || 0);
        
        // Atualiza dados básicos primeiro
        // Atualiza dados básicos primeiro
        await api.put(`/projects/${project.id}`, { 
            monthlyUsage, location, roofType, orientation, 
            roofArea: parseFloat(roofArea), consumptionHistory: historyToSend,
            solarPanelId: selectedPanelId || null, inverterId: selectedInverterId || null
        });

        // Faz o cálculo
        const response = await api.post(`/projects/${project.id}/calculate`, {
            consumptionHistory: historyToSend, location, roofType, orientation, roofArea, 
            monthlyUsage, panelId: selectedPanelId || null, inverterId: selectedInverterId || null 
        });

        const data = response.data;
        setCalculationResult(data);
        setBom(data.bom);
        
        if (data.suggestedPanel && !selectedPanelId) { setSelectedPanelId(data.suggestedPanel.id); setPanelModel(data.suggestedPanel.model); }
        if (data.suggestedInverter && !selectedInverterId) { setSelectedInverterId(data.suggestedInverter.id); setInverterModel(data.suggestedInverter.model); }
        
        loadActivities();
        if (onSaveSuccess) onSaveSuccess(); 
    } catch (error) { alert(error.response?.data?.error || 'Erro ao calcular.'); } 
    finally { setIsCalculating(false); }
  };

  const handleMonthChange = (index, value) => {
      const newHistory = [...consumptionHistory]; newHistory[index] = value; setConsumptionHistory(newHistory);
      const values = newHistory.map(v => parseFloat(v) || 0).filter(v => v > 0);
      if (values.length > 0 && units.length === 0) { setMonthlyUsage(Math.round(values.reduce((a, b) => a + b, 0) / values.length).toString()); }
  };

  const handleConnectionChange = (e) => { setConnectionType(e.target.value); setAvailabilityFee(CONNECTION_FEE_MAP[e.target.value] || 0); };
  
  const handleSaveCommercial = async () => {
      setIsSavingCommercial(true);
      try {
          await api.put(`/projects/${project.id}`, { 
              price: parseFloat(price) || 0, energyTariff: parseFloat(energyTariff) || 0,
              panelModel, inverterModel, solarPanelId: selectedPanelId || null, inverterId: selectedInverterId || null,
              connectionType, availabilityFee: parseFloat(availabilityFee) || 0,
              annualInflation: parseFloat(annualInflation) / 100, panelDegradation: parseFloat(panelDegradation) / 100 
          });
          
          await api.post(`/projects/${project.id}/activities`, { note: `Dados comerciais salvos. Valor: R$ ${price}` });
          loadActivities();
          if (onSaveSuccess) onSaveSuccess();
      } catch (error) { alert('Erro ao salvar.'); } 
      finally { setIsSavingCommercial(false); }
  };
  
  const handleGenerateProposal = () => {
      if (!project.price) { alert("Salve o Valor Final antes."); return; }
      
      // Para abrir PDF em nova aba, passamos o token via query param ou usamos fetch blob
      // Método simples (requer que a rota de PDF aceite token na URL ou cookie, mas aqui vamos tentar direto)
      // Se a rota de PDF for protegida, o window.open vai falhar (401).
      // SOLUÇÃO: Usar fetch com blob
      
      api.get(`/projects/${project.id}/proposal`, { 
          responseType: 'blob' 
      })
      .then((response) => {
          const file = new Blob([response.data], { type: 'application/pdf' });
          const fileURL = URL.createObjectURL(file);
          window.open(fileURL, '_blank');
          
          // Atualiza status visualmente
          setTimeout(() => {
            loadActivities();
            if (onSaveSuccess) onSaveSuccess();
            onClose();
          }, 1000);
      })
      .catch(() => alert("Erro ao gerar proposta. Verifique se salvou os dados comerciais."));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const formData = new FormData(); formData.append('file', file);
    setIsUploading(true);
    try { 
        await api.post(`/projects/${project.id}/attachments`, formData, { 
            headers: { 
                'Content-Type': 'multipart/form-data'
            } 
        }); 
        loadAttachments(); 
    } 
    catch (e) { alert('Erro envio.'); } finally { setIsUploading(false); }
  };

  const handleDeleteAttachment = async (id) => {
    if (window.confirm("Remover anexo?")) { 
        try { 
            await api.delete(`/attachments/${id}`); 
            loadAttachments(); 
        } catch (e) { alert("Erro remover."); } 
    }
  };

  const handleAddNote = async () => {
      if (!newNote.trim()) return; setIsSavingNote(true);
      try { await api.post(`/projects/${project.id}/activities`, { note: newNote }); setNewNote(''); loadActivities(); }
      catch (e) { alert('Erro nota.'); } finally { setIsSavingNote(false); }
  };

  const handleDelete = async () => {
    if (window.confirm(`Excluir projeto "${project.title}"?`)) {
        try { await api.delete(`/projects/${project.id}`); onClose(); if(onSaveSuccess) onSaveSuccess(); } catch (e) { alert('Erro excluir.'); }
    }
  };

  const canGenerateProposal = project.price && project.price > 0;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-neo-surface-1 w-full max-w-6xl h-[90vh] rounded-xl border border-neo-surface-2 shadow-2xl flex flex-col overflow-hidden font-sans" onClick={(e) => e.stopPropagation()}>
        
        {/* TOPO */}
        <div className="bg-neo-bg-main px-6 py-4 border-b border-neo-surface-2 flex justify-between items-start shrink-0">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-lg font-bold text-neo-white">{project.title.replace('Projeto Lead - ', '')}</h2>
                    <span className="bg-neo-surface-2 text-neo-white text-[10px] font-bold px-2 py-0.5 rounded border border-neo-surface-2/50">
                        {STATUS_MAP[project.status] || project.status}
                    </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-neo-text-sec">
                    <span className="flex items-center gap-1"><User size={12}/> {project.client?.name}</span>
                    <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            <div className="flex gap-2">
                <button onClick={handleDelete} className="p-2 hover:bg-red-500/10 text-neo-text-sec hover:text-red-500 rounded transition-colors" title="Excluir"><Trash2 size={18}/></button>
                <button onClick={onClose} className="p-2 hover:bg-neo-surface-2 text-neo-text-sec hover:text-white rounded transition-colors"><X size={18}/></button>
            </div>
        </div>

        {/* CORPO */}
        <div className="flex flex-1 overflow-hidden">
            
            {/* ESQUERDA (DADOS) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 border-r border-neo-surface-2 bg-neo-surface-1/30">
                
                {/* 1. Unidades */}
                <section>
                    <SectionHeader title="Unidades Consumidoras" icon={Home} action={<div className="text-xs font-mono text-neo-green-main bg-neo-green-main/10 px-2 py-0.5 rounded border border-neo-green-main/20">Total: <strong>{monthlyUsage || 0} kWh</strong></div>}/>
                    <div className="border border-neo-surface-2 rounded-md overflow-hidden bg-neo-bg-main mb-2">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-neo-surface-1 text-neo-text-sec font-semibold border-b border-neo-surface-2"><tr><th className="p-2 pl-3">Conta</th><th className="p-2">Titular</th><th className="p-2">Tipo</th><th className="p-2">Consumo</th><th className="p-2 w-8"></th></tr></thead>
                            <tbody className="divide-y divide-neo-surface-2/50">
                                {units.map(u => (
                                    <tr key={u.id} className="group hover:bg-neo-surface-1/50 transition-colors"><td className="p-2 pl-3 font-mono text-neo-white">{u.code}</td><td className="p-2 text-neo-text-sec truncate max-w-[100px]">{u.titular}</td><td className="p-2">{u.isGenerator ? <span className="text-[9px] bg-neo-purple-main text-white px-1.5 py-0.5 rounded">GERADORA</span> : <span className="text-[9px] bg-neo-surface-2 text-neo-text-sec px-1.5 py-0.5 rounded">BENEF.</span>}</td><td className="p-2 font-bold text-neo-white">{u.averageAvg} kWh</td><td className="p-2 text-right"><button onClick={() => handleRemoveUnit(u.id)} className="text-neo-text-sec hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button></td></tr>
                                ))}
                                <tr className="bg-neo-surface-1/20"><td className="p-1 pl-2"><StyledInput placeholder="Nº Conta" name="code" value={newUnit.code} onChange={handleNewUnitChange} /></td><td className="p-1"><StyledInput placeholder="Titular" name="titular" value={newUnit.titular} onChange={handleNewUnitChange} /></td><td className="p-1"><select className="w-full bg-neo-bg-main border border-neo-surface-2 rounded px-1 py-1.5 text-xs text-white outline-none" value={newUnit.isGenerator ? 'sim' : 'nao'} onChange={(e) => setNewUnit(prev => ({...prev, isGenerator: e.target.value === 'sim'}))}><option value="nao">Beneficiária</option><option value="sim">Geradora</option></select></td><td className="p-1"><StyledInput placeholder="Média" type="number" name="averageAvg" value={newUnit.averageAvg} onChange={handleNewUnitChange} /></td><td className="p-1 text-center"><button onClick={handleAddUnit} className="bg-neo-green-main hover:bg-neo-green-light text-neo-bg-main p-1.5 rounded transition-colors"><Plus size={14}/></button></td></tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* 2. Engenharia */}
                <section>
                    <SectionHeader title="Dimensionamento Fóton" icon={Compass} />
                    <div className="bg-neo-surface-1/50 rounded-lg p-4 border border-neo-surface-2/50 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            
                            {/* CAMPO DE CONSUMO E HISTÓRICO */}
                            <div>
                                <label className="text-[10px] font-semibold text-neo-text-sec uppercase mb-1 block">Consumo Médio (kWh)</label>
                                <div className="flex gap-2">
                                    <StyledInput 
                                        value={monthlyUsage} 
                                        onChange={(e) => setMonthlyUsage(e.target.value)} 
                                        placeholder="0" 
                                        type="number"
                                        className={`flex-1 h-10 font-bold text-sm ${units.length > 0 ? "opacity-70 cursor-not-allowed text-neo-green-main" : "text-neo-white"}`}
                                        readOnly={units.length > 0} 
                                    />
                                    <button 
                                        onClick={() => setShowMonthlyDetails(!showMonthlyDetails)} 
                                        className="h-10 px-4 bg-neo-surface-2 hover:bg-neo-surface-1 border border-neo-surface-2 hover:border-neo-purple-light/30 rounded-md text-xs font-bold text-neo-purple-light flex items-center gap-2 transition-all whitespace-nowrap"
                                        title="Editar histórico mês a mês"
                                    >
                                        <History size={14} />
                                        {showMonthlyDetails ? 'Ocultar' : 'Detalhar 12 Meses'}
                                    </button>
                                </div>
                                {units.length > 0 && <span className="text-[9px] text-neo-text-sec block mt-1 ml-1">* Calculado automaticamente via Unidades</span>}
                                
                                {showMonthlyDetails && (
                                    <div className="grid grid-cols-4 gap-2 mt-3 p-3 bg-neo-bg-main/50 rounded-lg border border-neo-surface-2/50 animate-scale-in">
                                        {MONTHS.map((m, i) => (
                                            <div key={i}>
                                                <label className="text-[8px] text-neo-text-sec block text-center mb-0.5 uppercase tracking-wide">{m}</label>
                                                <input 
                                                    type="number" 
                                                    value={consumptionHistory[i]} 
                                                    onChange={(e) => handleMonthChange(i, e.target.value)} 
                                                    className="w-full bg-neo-bg-main border border-neo-surface-2 focus:border-neo-purple-light rounded-md px-1 py-1 text-[10px] text-center text-white outline-none font-mono"
                                                    placeholder="0"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <FormField label="Localização"><StyledSelect value={location} onChange={(e) => setLocation(e.target.value)}><option value="NORDESTE">Nordeste</option><option value="SUL">Sul</option><option value="SUDESTE">Sudeste</option><option value="NORTE">Norte</option><option value="CENTRO-OESTE">Centro-Oeste</option></StyledSelect></FormField>
                                <FormField label="Telhado"><StyledSelect value={roofType} onChange={(e) => setRoofType(e.target.value)}><option value="Cerâmico">Cerâmico</option><option value="Metálico">Metálico</option><option value="Fibrocimento">Fibrocimento</option><option value="Laje">Laje</option><option value="Solo">Solo</option></StyledSelect></FormField>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <FormField label="Orientação"><StyledSelect value={orientation} onChange={(e) => setOrientation(e.target.value)}><option value="NORTE">Norte</option><option value="LESTE">Leste</option><option value="OESTE">Oeste</option><option value="SUL">Sul</option></StyledSelect></FormField>
                                <FormField label="Área Útil (m²)"><StyledInput type="number" value={roofArea} onChange={(e) => setRoofArea(e.target.value)} placeholder="Opcional" /></FormField>
                            </div>
                            <button onClick={handleCalculate} disabled={isCalculating || !monthlyUsage} className="w-full h-10 mt-2 bg-neo-purple-main hover:bg-neo-purple-light text-white text-xs font-bold py-2 rounded-md transition-all flex items-center justify-center gap-2 shadow-lg shadow-neo-purple-main/20">{isCalculating ? 'Processando...' : <><Calculator size={14}/> CALCULAR SISTEMA</>}</button>
                        </div>
                        <div className="bg-neo-bg-main border border-neo-surface-2 rounded-lg p-3 flex flex-col justify-center relative">
                            {calculationResult ? (
                                <><div className="absolute top-2 right-2 text-[10px] text-neo-text-sec">Cobertura: <span className="text-neo-green-main font-bold">{calculationResult.coverage}%</span></div><div className="text-center mb-3"><div className="text-[10px] text-neo-text-sec uppercase font-bold mb-1">Potência Sugerida</div><div className="text-2xl font-extrabold text-neo-white tracking-tight">{calculationResult.systemSize} <span className="text-sm text-neo-green-main">kWp</span></div></div><div className="grid grid-cols-2 gap-2 text-center"><div className="bg-neo-surface-1 p-2 rounded border border-neo-surface-2"><div className="text-[9px] text-neo-text-sec uppercase">Painéis</div><div className="font-bold text-white">{calculationResult.panelCount}x</div></div><div className="bg-neo-surface-1 p-2 rounded border border-neo-surface-2"><div className="text-[9px] text-neo-text-sec uppercase">Inversor</div><div className="font-bold text-white">{calculationResult.inverterSize} kW</div></div></div></>
                            ) : (<div className="text-center text-neo-text-sec/40 text-xs italic py-4">Preencha o consumo e clique em Calcular.</div>)}
                        </div>
                    </div>
                </section>

                {/* 3. Lista de Materiais */}
                {bom && bom.length > 0 && (
                    <section>
                        <SectionHeader title="Lista de Materiais (BoM)" icon={Layers} />
                        <div className="bg-neo-bg-main border border-neo-surface-2 rounded-lg overflow-hidden">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-neo-surface-1/50 text-neo-text-sec text-[10px] uppercase font-bold">
                                    <tr><th className="p-2 pl-3">Item</th><th className="p-2 text-right pr-4">Qtd</th></tr>
                                </thead>
                                <tbody className="divide-y divide-neo-surface-2/30">
                                    {bom.map((item, idx) => (
                                        <tr key={idx} className="group hover:bg-neo-surface-1/20 transition-colors">
                                            <td className="p-2 pl-3 text-neo-white truncate max-w-[300px]" title={item.item}>{item.item}</td>
                                            <td className="p-2 text-right pr-4 font-mono font-bold text-neo-green-main">{item.qtd} <span className="text-neo-text-sec text-[9px] font-normal">{item.unit}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* 4. Comercial */}
                <section>
                    <SectionHeader title="Proposta Comercial" icon={Package} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-neo-surface-1/50 rounded-lg border border-neo-surface-2/50">
                        <div className="space-y-3">
                            <FormField label="Módulo Fotovoltaico"><StyledSelect value={selectedPanelId} onChange={handlePanelSelect}><option value="">Selecione...</option>{catalogPanels.map(p => <option key={p.id} value={p.id}>{p.model} ({p.power}W)</option>)}</StyledSelect></FormField>
                            <FormField label="Inversor"><StyledSelect value={selectedInverterId} onChange={handleInverterSelect}><option value="">Selecione...</option>{catalogInverters.map(i => <option key={i.id} value={i.id}>{i.model} ({i.power}kW)</option>)}</StyledSelect></FormField>
                            <div className="grid grid-cols-2 gap-3"><FormField label="Conexão"><StyledSelect value={connectionType} onChange={handleConnectionChange}><option value="MONOFÁSICO">Mono</option><option value="BIFÁSICO">Bifásico</option><option value="TRIFÁSICO">Trifásico</option></StyledSelect></FormField><FormField label="Taxa Disp."><StyledInput value={availabilityFee} readOnly className="opacity-50 cursor-not-allowed bg-neo-bg-main border border-neo-surface-2 rounded-md px-2 py-1.5 text-xs text-white" /></FormField></div>
                        </div>
                        <div className="space-y-3 border-l border-neo-surface-2/50 pl-6">
                            <FormField label="Preço Final (R$)"><input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full bg-neo-bg-main border border-neo-purple-light/50 rounded-md px-3 py-2 text-sm font-bold text-white focus:border-neo-purple-light focus:ring-1 focus:ring-neo-purple-light outline-none" placeholder="0,00" /></FormField>
                            <FormField label="Tarifa Energia (R$/kWh)"><StyledInput type="number" step="0.01" value={energyTariff} onChange={(e) => setEnergyTariff(e.target.value)} /></FormField>
                            <div className="flex gap-2 mt-4 pt-2">
                                <button onClick={handleSaveCommercial} disabled={isSavingCommercial} className="flex-1 bg-neo-surface-2 hover:bg-neo-surface-1 text-white text-xs font-bold py-2 rounded-md transition-colors flex items-center justify-center gap-2"><Save size={14}/> {isSavingCommercial ? '...' : 'Salvar'}</button>
                                <button onClick={handleGenerateProposal} disabled={!canGenerateProposal} className={`flex-1 text-xs font-bold py-2 rounded-md transition-all flex items-center justify-center gap-2 ${canGenerateProposal ? 'bg-neo-green-main text-neo-bg-main hover:opacity-90 shadow-lg shadow-neo-green-main/20' : 'bg-neo-surface-2 text-neo-text-sec opacity-50 cursor-not-allowed'}`}><FileDown size={14}/> Gerar PDF</button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* DIREITA (SIDEBAR) */}
            <div className="w-80 bg-neo-bg-main flex flex-col border-l border-neo-surface-2">
                <div className="flex border-b border-neo-surface-2">
                    <button onClick={() => setActiveTab('activity')} className={`flex-1 py-3 text-xs font-bold transition-colors ${activeTab === 'activity' ? 'text-neo-white border-b-2 border-neo-purple-light bg-neo-surface-1/30' : 'text-neo-text-sec hover:text-neo-white'}`}>Atividades</button>
                    <button onClick={() => setActiveTab('files')} className={`flex-1 py-3 text-xs font-bold transition-colors ${activeTab === 'files' ? 'text-neo-white border-b-2 border-neo-purple-light bg-neo-surface-1/30' : 'text-neo-text-sec hover:text-neo-white'}`}>Arquivos ({attachments.length})</button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                    {activeTab === 'activity' && activities.map(act => (
                        <div key={act.id} className="flex gap-3 text-xs group">
                            <div className="mt-1"><div className={`w-2 h-2 rounded-full ${act.type === 'SYSTEM' ? 'bg-neo-green-main' : 'bg-neo-purple-light'}`}></div></div>
                            <div className="flex-1"><div className="flex justify-between items-center mb-0.5"><span className="font-bold text-neo-white">{act.action}</span><span className="text-[10px] text-neo-text-sec">{new Date(act.createdAt).toLocaleDateString(undefined, {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'})}</span></div>{act.details && <div className="bg-neo-surface-1 border border-neo-surface-2 rounded p-2 text-neo-text-sec/90 mt-1">{act.details}</div>}</div>
                        </div>
                    ))}
                    {activeTab === 'files' && attachments.map(file => (
                        <div key={file.id} className="flex items-center justify-between bg-neo-surface-1/50 p-2 rounded border border-neo-surface-2/30 hover:border-neo-purple-light transition-colors group"><a href={`${api.defaults.baseURL.replace('/api', '')}/uploads/${file.filePath}`} target="_blank" className="flex items-center gap-3 truncate"><div className="bg-neo-bg-main p-1.5 rounded text-neo-purple-light"><FileText size={14} /></div><div className="truncate"><div className="text-xs font-medium text-neo-white truncate w-32" title={file.fileName}>{file.fileName}</div><div className="text-[9px] text-neo-text-sec uppercase">{file.fileType.split('/')[1]}</div></div></a><div className="flex gap-1"><a href={`${api.defaults.baseURL.replace('/api', '')}/uploads/${file.filePath}`} download className="p-1 text-neo-text-sec hover:text-neo-green-main rounded"><Download size={12}/></a><button onClick={() => handleDeleteAttachment(file.id)} className="p-1 text-neo-text-sec hover:text-red-400 rounded"><Trash2 size={12}/></button></div></div>
                    ))}
                </div>
                <div className="p-4 border-t border-neo-surface-2 bg-neo-surface-1/10 space-y-3">
                    {activeTab === 'activity' ? (
                        <div className="relative"><input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Escreva uma nota..." className="w-full bg-neo-surface-2 border-none rounded-md py-2 pl-3 pr-8 text-xs text-white focus:ring-1 focus:ring-neo-purple-light outline-none" onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}/><button onClick={handleAddNote} disabled={!newNote.trim()} className="absolute right-1 top-1 text-neo-purple-light hover:text-white p-1"><MessageSquare size={14} /></button></div>
                    ) : (
                        attachments.length === 0 ? (
                            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-neo-surface-2 hover:border-neo-purple-light rounded-lg cursor-pointer transition-all group"><CloudUpload size={24} className="text-neo-text-sec group-hover:text-neo-purple-light mb-2" /><span className="text-xs font-bold text-neo-white">Clique para fazer upload</span><input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} /></label>
                        ) : (
                            <label className="w-full py-2 bg-neo-surface-2 hover:bg-neo-purple-main text-white text-xs font-bold rounded-md cursor-pointer transition-colors flex items-center justify-center gap-2"><Plus size={14} /> Adicionar arquivo<input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} /></label>
                        )
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}

export default ProjectModal;
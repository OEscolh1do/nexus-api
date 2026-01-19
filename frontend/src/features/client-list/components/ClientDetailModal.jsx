// /frontend/src/features/client-list/components/ClientDetailModal.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../lib/axios';
import { X, Save, User, MapPin, Zap, Paperclip, Trash2, Plus, Upload, Download, FileText, RefreshCw } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';



function ClientDetailModal({ project, onClose, onSuccess }) {
  const token = useAuthStore(state => state.token);
  
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null); 
  
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', cpf_cnpj: '',
    zip: '', street: '', number: '', neighborhood: '', city: '', state: '',
    contractAccounts: [], 
    attachments: []
  });

  // Identifica o ID do cliente corretamente
  const getClientId = useCallback(() => project.client?.id || project.id, [project]);

  // --- CARREGAR DADOS INICIAIS (Visual Imediato) ---
  const loadInitialData = useCallback(() => {
    if (project) {
      const data = project.client || project;

      let formattedAccounts = [];
      if (Array.isArray(data.contractAccounts)) {
          formattedAccounts = data.contractAccounts.map(acc => {
              if (typeof acc === 'string') return { uc: acc, type: 'BENEFICIARIA' };
              return acc;
          });
      }

      // Preenche com o que temos (pode não ter anexos ainda)
      setFormData(prev => ({
        ...prev,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        cpf_cnpj: data.cpf_cnpj || '',
        zip: data.zip || '',
        street: data.street || '',
        number: data.number || '',
        neighborhood: data.neighborhood || '',
        city: data.city || '',
        state: data.state || '',
        contractAccounts: formattedAccounts,
        attachments: data.attachments || [] 
      }));
    }
  }, [project]);

  // --- BUSCAR DADOS COMPLETOS NO SERVIDOR (Anexos atualizados) ---
  const fetchFullClientDetails = useCallback(async () => {
      try {
          const clientId = getClientId();
          if (!clientId || !token) return;

          // Busca o cliente completo no backend (lá vem com os attachments)
          const res = await api.get(`/clients/${clientId}`);

          const clientData = res.data;

          // Atualiza o estado com os dados frescos do banco (principalmente anexos)
          setFormData(prev => ({
              ...prev,
              attachments: clientData.attachments || [],
              // Atualiza também outros campos caso tenham mudado
              contractAccounts: clientData.contractAccounts || prev.contractAccounts 
          }));

      } catch (error) {
          console.error("Erro ao buscar detalhes completos do cliente:", error);
      }
  }, [token, getClientId]); // Added project to dependency as getClientId uses it

  // USE EFFECT PRINCIPAL
  useEffect(() => {
      // 1. Carrega o que já temos na memória (para não ficar tela branca)
      loadInitialData();
      
      // 2. Busca os dados frescos no servidor (para trazer os ANEXOS)
      fetchFullClientDetails();
  }, [loadInitialData, fetchFullClientDetails]); 


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- LÓGICA DE CONTAS ---
  const addAccount = () => {
    setFormData(prev => ({ 
        ...prev, 
        contractAccounts: [...prev.contractAccounts, { uc: '', type: 'BENEFICIARIA' }] 
    }));
  };

  const removeAccount = (index) => {
    const newAccounts = [...formData.contractAccounts];
    newAccounts.splice(index, 1);
    setFormData(prev => ({ ...prev, contractAccounts: newAccounts }));
  };

  const handleAccountChange = (index, field, value) => {
    const newAccounts = [...formData.contractAccounts];
    newAccounts[index] = { ...newAccounts[index], [field]: value };
    setFormData(prev => ({ ...prev, contractAccounts: newAccounts }));
  };

  // --- LÓGICA DE ARQUIVOS ---
  const handleFileClick = () => fileInputRef.current.click();

  const handleFileChange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!token) { alert("Sessão expirada."); return; }

      setUploading(true);
      const uploadData = new FormData();
      uploadData.append('file', file);

      try {
          const clientId = getClientId();
          await api.post(`/clients/${clientId}/attachments`, uploadData, {
              headers: { 
                  'Content-Type': 'multipart/form-data'
              }
          });
          
          // Recarrega a lista após upload
          await fetchFullClientDetails(); 
      } catch (error) {
          console.error(error);
          alert('Erro ao enviar arquivo.');
      } finally {
          setUploading(false);
          if(fileInputRef.current) fileInputRef.current.value = ''; 
      }
  };

  const handleDeleteFile = async (attachmentId) => {
      if(!confirm("Deseja realmente excluir este anexo?")) return;
      
      try {
          await api.delete(`/attachments/${attachmentId}`);
          
          setFormData(prev => ({
              ...prev,
              attachments: prev.attachments.filter(f => f.id !== attachmentId)
          }));
      } catch (error) {
          console.error(error);
          alert("Erro ao excluir anexo.");
      }
  };

  // --- SALVAR DADOS ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (!token) {
        alert("Sessão expirada.");
        setLoading(false);
        return;
    }

    try {
      const clientId = getClientId();
      await api.put(`/clients/${clientId}`, formData);

      alert('Dados salvos com sucesso!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar alterações.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full bg-neo-surface-2 border border-neo-surface-1 focus:border-neo-purple-light rounded-lg px-3 py-2 text-sm text-white outline-none transition-all placeholder:text-neo-text-sec/50";
  const labelStyle = "block text-xs font-bold text-neo-text-sec mb-1 uppercase";
  const tabStyle = (tabName) => `pb-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === tabName ? 'border-neo-purple-light text-white' : 'border-transparent text-neo-text-sec hover:text-white cursor-pointer'}`;

  const getFileUrl = (path) => `${api.defaults.baseURL.replace('/api', '')}/uploads/${path}`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up" onClick={onClose}>
      <div className="bg-neo-bg-main w-full max-w-2xl rounded-xl border border-neo-surface-2 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neo-surface-2 bg-neo-surface-1 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <User size={20} className="text-neo-purple-light"/> 
                {formData.name || 'Editar Cliente'}
            </h2>
            <p className="text-xs text-neo-text-sec">Edição cadastral unificada</p>
          </div>
          <button onClick={onClose} className="text-neo-text-sec hover:text-white transition-colors"><X size={20}/></button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 flex gap-6 border-b border-neo-surface-2 shrink-0 bg-neo-bg-main">
            <button onClick={() => setActiveTab('general')} className={tabStyle('general')}> <User size={14}/> Dados Gerais</button>
            <button onClick={() => setActiveTab('address')} className={tabStyle('address')}> <MapPin size={14}/> Endereço</button>
            <button onClick={() => setActiveTab('accounts')} className={tabStyle('accounts')}> <Zap size={14}/> Contas Contrato</button>
            <button onClick={() => setActiveTab('files')} className={tabStyle('files')}> <Paperclip size={14}/> Anexos ({formData.attachments.length})</button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            <form id="clientForm" onSubmit={handleSubmit} className="space-y-6">
                
                {/* ABA 1: GERAL */}
                {activeTab === 'general' && (
                    <div className="space-y-4 animate-fade-in-up">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className={labelStyle}>Nome Completo</label>
                                <input name="name" value={formData.name} onChange={handleChange} className={inputStyle} />
                            </div>
                            <div>
                                <label className={labelStyle}>CPF / CNPJ</label>
                                <input name="cpf_cnpj" value={formData.cpf_cnpj} onChange={handleChange} className={inputStyle} placeholder="000.000.000-00" />
                            </div>
                            <div>
                                <label className={labelStyle}>Telefone</label>
                                <input name="phone" value={formData.phone} onChange={handleChange} className={inputStyle} />
                            </div>
                            <div className="col-span-2">
                                <label className={labelStyle}>E-mail</label>
                                <input name="email" value={formData.email} onChange={handleChange} className={inputStyle} type="email" />
                            </div>
                        </div>
                    </div>
                )}

                {/* ABA 2: ENDEREÇO */}
                {activeTab === 'address' && (
                    <div className="space-y-4 animate-fade-in-up">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1">
                                <label className={labelStyle}>CEP</label>
                                <input name="zip" value={formData.zip} onChange={handleChange} className={inputStyle} />
                            </div>
                            <div className="col-span-2">
                                <label className={labelStyle}>Cidade</label>
                                <input name="city" value={formData.city} onChange={handleChange} className={inputStyle} />
                            </div>
                            <div className="col-span-2">
                                <label className={labelStyle}>Rua / Logradouro</label>
                                <input name="street" value={formData.street} onChange={handleChange} className={inputStyle} />
                            </div>
                            <div>
                                <label className={labelStyle}>Número</label>
                                <input name="number" value={formData.number} onChange={handleChange} className={inputStyle} />
                            </div>
                            <div>
                                <label className={labelStyle}>Bairro</label>
                                <input name="neighborhood" value={formData.neighborhood} onChange={handleChange} className={inputStyle} />
                            </div>
                            <div>
                                <label className={labelStyle}>Estado</label>
                                <input name="state" value={formData.state} onChange={handleChange} className={inputStyle} maxLength={2} />
                            </div>
                        </div>
                    </div>
                )}

                {/* ABA 3: CONTAS CONTRATO */}
                {activeTab === 'accounts' && (
                    <div className="space-y-4 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-2">
                            <label className={labelStyle}>Unidades Consumidoras Vinculadas</label>
                            <button type="button" onClick={addAccount} className="text-xs flex items-center gap-1 text-neo-green-main hover:underline font-bold bg-neo-green-main/10 px-2 py-1 rounded border border-neo-green-main/20"><Plus size={12}/> Nova UC</button>
                        </div>
                        
                        {formData.contractAccounts.length === 0 && (
                            <div className="p-8 border-2 border-dashed border-neo-surface-2 rounded-lg text-center text-neo-text-sec text-sm">
                                Nenhuma Conta Contrato cadastrada. Adicione para o dimensionamento.
                            </div>
                        )}

                        <div className="space-y-3">
                            {formData.contractAccounts.map((account, index) => (
                                <div key={index} className="flex gap-2 items-center bg-neo-surface-2 p-2 rounded-lg border border-neo-surface-1">
                                    <select 
                                        value={account.type}
                                        onChange={(e) => handleAccountChange(index, 'type', e.target.value)}
                                        className={`text-xs font-bold px-2 py-2.5 rounded-md border outline-none cursor-pointer ${
                                            account.type === 'GERADORA' 
                                            ? 'bg-neo-green-main/20 text-neo-green-main border-neo-green-main/30' 
                                            : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                        }`}
                                    >
                                        <option value="GERADORA">GERADORA</option>
                                        <option value="BENEFICIARIA">BENEFICIÁRIA</option>
                                    </select>

                                    <input 
                                        value={account.uc} 
                                        onChange={(e) => handleAccountChange(index, 'uc', e.target.value)} 
                                        className="flex-1 bg-neo-bg-main border border-neo-surface-1 focus:border-neo-purple-light rounded-md px-3 py-2 text-sm text-white outline-none"
                                        placeholder="Nº da UC / Conta Contrato"
                                    />

                                    <button type="button" onClick={() => removeAccount(index)} className="p-2 text-neo-text-sec hover:text-red-400 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ABA 4: ANEXOS */}
                {activeTab === 'files' && (
                    <div className="space-y-4 animate-fade-in-up">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            className="hidden" 
                            multiple
                        />

                        <div 
                            onClick={!uploading ? handleFileClick : undefined}
                            className={`p-8 border-2 border-dashed border-neo-surface-2 rounded-xl text-center transition-all group ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-neo-purple-light/50 hover:bg-neo-surface-2/30 cursor-pointer'}`}
                        >
                            <div className="w-12 h-12 bg-neo-surface-2 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                {uploading ? <RefreshCw size={20} className="text-neo-purple-light animate-spin"/> : <Upload size={20} className="text-neo-text-sec group-hover:text-neo-purple-light transition-colors"/>}
                            </div>
                            <p className="text-sm font-bold text-white">{uploading ? 'Enviando...' : 'Clique para adicionar arquivos'}</p>
                            <p className="text-xs text-neo-text-sec mt-1">PDFs, Imagens, Documentos (Max 10MB)</p>
                        </div>

                        <div className="space-y-2 mt-4">
                            <label className={labelStyle}>Arquivos Anexados</label>
                            
                            {formData.attachments.length === 0 && (
                                <p className="text-xs text-neo-text-sec italic opacity-50">Nenhum arquivo anexado.</p>
                            )}

                            {formData.attachments.map((file, index) => (
                                <div key={file.id || index} className="flex items-center justify-between p-3 bg-neo-surface-2 rounded-lg border border-neo-surface-1 hover:border-neo-purple-light/30 transition-colors group">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`p-2 rounded font-bold text-xs shrink-0 ${file.fileType?.includes('pdf') || (file.fileName && file.fileName.endsWith('.pdf')) ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            <FileText size={16}/>
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-sm text-white truncate font-medium">{file.fileName || file.name}</span>
                                            <span className="text-[10px] text-neo-text-sec">
                                                {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : 'Novo'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {(file.filePath) && (
                                            <a 
                                                href={getFileUrl(file.filePath)} 
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 hover:bg-neo-bg-main rounded text-neo-text-sec hover:text-white" 
                                                title="Baixar"
                                            >
                                                <Download size={14}/>
                                            </a>
                                        )}
                                        <button 
                                            type="button" 
                                            onClick={() => handleDeleteFile(file.id)}
                                            className="p-1.5 hover:bg-neo-bg-main rounded text-neo-text-sec hover:text-red-400" 
                                            title="Excluir"
                                        >
                                            <Trash2 size={14}/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </form>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-neo-surface-2 bg-neo-surface-1 flex justify-end gap-3 shrink-0">
            <button onClick={onClose} className="px-4 py-2 text-neo-text-sec hover:text-white transition-colors text-sm font-bold">Cancelar</button>
            <button 
                type="submit" 
                form="clientForm" 
                disabled={loading}
                className="bg-neo-green-main hover:bg-neo-green-light text-neo-bg-main font-bold px-6 py-2 rounded-lg shadow-lg shadow-neo-green-main/20 transition-all flex items-center gap-2"
            >
                {loading ? 'Salvando...' : <><Save size={18}/> Salvar Alterações</>}
            </button>
        </div>

      </div>
    </div>
  );
}

export default ClientDetailModal;
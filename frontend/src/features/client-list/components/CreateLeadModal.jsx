// /frontend/src/features/client-list/components/CreateLeadModal.jsx
import { useState, useEffect } from 'react';
import api from '../../../lib/axios';
import { X, User, Phone, Mail, FileText, Save, Search, UserCheck, UserPlus } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore'; // Importante para o token



function CreateLeadModal({ onClose, onSuccess }) {
  const token = useAuthStore(state => state.token); // Pega o token
  const [mode, setMode] = useState('NEW'); 
  
  // Lista de clientes para busca
  const [clientsList, setClientsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Formulário
  const [formData, setFormData] = useState({ 
      clientId: null, 
      name: '', 
      phone: '', 
      email: '', 
      description: '' 
  });
  
  const [loading, setLoading] = useState(false);

  // 1. Busca clientes (Rota correta: /api/clients)
  useEffect(() => {
      if (!token) return;

      api.get('/clients') 
        .then(res => {
            setClientsList(res.data);
        })
        .catch(err => console.error("Erro ao buscar clientes", err));
  }, [token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 2. Filtra clientes na busca
  const filteredClients = clientsList.filter(c => 
      (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (c.phone && c.phone.includes(searchTerm))
  );

  // 3. Seleciona um cliente da lista
  const handleSelectClient = (client) => {
      setFormData({
          ...formData,
          clientId: client.id,
          name: client.name, // Apenas visual
          phone: client.phone || '',
          email: client.email || '',
          description: formData.description
      });
      setSearchTerm('');
      setShowDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!token) {
        alert("Sessão expirada.");
        setLoading(false);
        return;
    }

    try {
        const payload = {
            description: formData.description,
            // Se modo existente, manda o ID. Se novo, manda os dados.
            ...(mode === 'EXISTING' 
                ? { clientId: formData.clientId } 
                : { name: formData.name, email: formData.email, phone: formData.phone }
            )
        };

        if (mode === 'EXISTING' && !payload.clientId) {
            alert("Selecione um cliente na busca.");
            setLoading(false);
            return;
        }

        // Rota correta: /api/leads
        await api.post('/leads', payload);
        
        alert('Lead cadastrado com sucesso!');
        if (onSuccess) onSuccess();
        onClose();
    } catch (error) {
        console.error(error);
        const msg = error.response?.data?.error || 'Erro ao cadastrar lead.';
        alert(msg);
    } finally {
        setLoading(false);
    }
  };

  const labelStyle = "block text-xs font-bold text-neo-text-sec mb-1.5 flex items-center gap-1.5 uppercase tracking-wide";
  const inputStyle = "w-full bg-neo-surface-2 border border-neo-surface-1 focus:border-neo-purple-light rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-all placeholder:text-neo-text-sec/50 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up" onClick={onClose}>
      
      <div className="bg-neo-bg-main w-full max-w-md rounded-xl border border-neo-surface-2 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-neo-surface-2 flex justify-between items-center bg-neo-surface-1">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
              {mode === 'NEW' ? <UserPlus size={18} className="text-neo-green-main"/> : <UserCheck size={18} className="text-neo-purple-light"/>}
              {mode === 'NEW' ? 'Novo Cliente' : 'Cliente Existente'}
          </h2>
          <button onClick={onClose} className="text-neo-text-sec hover:text-white transition-colors"><X size={20}/></button>
        </div>

        {/* MODO TOGGLE */}
        <div className="grid grid-cols-2 p-1 bg-neo-surface-1 border-b border-neo-surface-2">
            <button 
                onClick={() => { setMode('NEW'); setFormData({clientId: null, name:'', phone:'', email:'', description:''}); }}
                className={`text-xs font-bold py-2 rounded-md transition-all ${mode === 'NEW' ? 'bg-neo-bg-main text-white shadow' : 'text-neo-text-sec hover:text-white'}`}
            >
                Cadastrar Novo
            </button>
            <button 
                onClick={() => { setMode('EXISTING'); setSearchTerm(''); }}
                className={`text-xs font-bold py-2 rounded-md transition-all ${mode === 'EXISTING' ? 'bg-neo-bg-main text-neo-purple-light shadow' : 'text-neo-text-sec hover:text-white'}`}
            >
                Selecionar Existente
            </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* BUSCA (Modo Existing) */}
          {mode === 'EXISTING' && !formData.clientId && (
              <div className="relative">
                  <label className={labelStyle}>Buscar na Base</label>
                  <div className="relative">
                      <Search size={16} className="absolute left-3 top-3 text-neo-text-sec"/>
                      <input 
                          type="text"
                          value={searchTerm}
                          onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                          className={inputStyle + " pl-10"}
                          placeholder="Digite nome ou telefone..."
                          autoFocus
                      />
                  </div>
                  
                  {showDropdown && searchTerm && (
                      <div className="absolute top-full left-0 w-full bg-neo-surface-1 border border-neo-surface-2 rounded-lg mt-1 max-h-48 overflow-y-auto z-10 shadow-xl">
                          {filteredClients.map(client => (
                              <div 
                                  key={client.id}
                                  onClick={() => handleSelectClient(client)}
                                  className="p-3 hover:bg-neo-purple-main/20 cursor-pointer border-b border-neo-surface-2/30 last:border-0"
                              >
                                  <div className="text-sm font-bold text-white">{client.name}</div>
                                  <div className="text-xs text-neo-text-sec">{client.phone}</div>
                              </div>
                          ))}
                          {filteredClients.length === 0 && (
                              <div className="p-3 text-xs text-neo-text-sec text-center">Nenhum cliente encontrado.</div>
                          )}
                      </div>
                  )}
              </div>
          )}

          {/* DADOS (Modo Novo ou Visualização) */}
          {(mode === 'NEW' || formData.clientId) && (
              <>
                {mode === 'EXISTING' && (
                    <div className="bg-neo-purple-light/10 border border-neo-purple-light/30 p-2 rounded text-center text-xs text-neo-purple-light mb-2 flex justify-between items-center px-4">
                        <span>Cliente: <b>{formData.name}</b></span>
                        <button type="button" onClick={() => setFormData({...formData, clientId: null})} className="underline hover:text-white ml-2">Trocar</button>
                    </div>
                )}

                <div>
                    <label className={labelStyle}><User size={12}/> Nome Completo *</label>
                    <input 
                        required name="name" value={formData.name} onChange={handleChange} 
                        className={inputStyle} placeholder="Ex: João da Silva" 
                        disabled={mode === 'EXISTING'} 
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelStyle}><Phone size={12}/> Telefone *</label>
                        <input 
                            required name="phone" value={formData.phone} onChange={handleChange} 
                            className={inputStyle} placeholder="(00) 00000-0000" 
                            disabled={mode === 'EXISTING'}
                        />
                    </div>
                    <div>
                        <label className={labelStyle}><Mail size={12}/> Email</label>
                        <input 
                            type="email" name="email" value={formData.email} onChange={handleChange} 
                            className={inputStyle} placeholder="email@..." 
                            disabled={mode === 'EXISTING'}
                        />
                    </div>
                </div>
              </>
          )}

          {/* OBSERVAÇÃO */}
          <div>
            <label className={labelStyle}><FileText size={12}/> Observação do Projeto</label>
            <textarea 
                name="description" value={formData.description} onChange={handleChange} 
                rows="3" className={`${inputStyle} resize-none`} placeholder="Detalhes iniciais..." 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || (mode === 'EXISTING' && !formData.clientId)} 
            className="w-full py-2.5 bg-neo-green-main hover:bg-neo-green-light text-neo-bg-main text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-neo-green-main/20 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processando...' : <><Save size={16}/> {mode === 'NEW' ? 'CADASTRAR E CRIAR' : 'VINCULAR E CRIAR'}</>}
          </button>

        </form>
      </div>
    </div>
  );
}

export default CreateLeadModal;
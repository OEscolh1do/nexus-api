// /frontend/src/features/admin/components/CreateUserModal.jsx
import { useState } from 'react';
import api from '../../../lib/axios';
import { X, User, Mail, Shield, Key, Save, Eye, EyeOff } from 'lucide-react';
// import useAuthStore from '../../../store/useAuthStore'; // Unused



function CreateUserModal({ onClose, onSuccess }) {

  
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'SALES' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Envia o POST.
      await api.post('/auth/register', formData);
      
      alert(`Usuário ${formData.name} criado com sucesso!`);
      
      // Chama a função de atualização da lista do componente pai
      if (onSuccess) onSuccess();
      
      onClose();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || 'Erro ao criar usuário.';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = "block text-xs font-bold text-neo-text-sec mb-1.5 flex items-center gap-1.5 uppercase tracking-wide";
  const inputStyle = "w-full bg-neo-surface-2 border border-neo-surface-1 focus:border-neo-purple-light rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-all placeholder:text-neo-text-sec/30";

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up" onClick={onClose}>
      <div className="bg-neo-bg-main w-full max-w-md rounded-xl border border-neo-surface-2 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-neo-surface-2 flex justify-between items-center bg-neo-surface-1">
          <h2 className="text-base font-bold text-white">Novo Membro da Equipe</h2>
          <button onClick={onClose} className="text-neo-text-sec hover:text-white transition-colors"><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4" autoComplete="off">
          
          <div>
            <label className={labelStyle}><User size={12} className="text-neo-purple-light"/> Nome Completo</label>
            <input 
                required 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                className={inputStyle} 
                placeholder="Ex: Novo Funcionário" 
                autoFocus 
            />
          </div>

          <div>
            <label className={labelStyle}><Mail size={12} className="text-neo-purple-light"/> E-mail de Acesso</label>
            <input 
                required 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                className={inputStyle} 
                placeholder="email@exemplo.com" 
                autoComplete="new-password" // Hack para evitar autocomplete agressivo
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className={labelStyle}><Key size={12} className="text-neo-purple-light"/> Senha Inicial</label>
                <div className="relative">
                    <input 
                        required 
                        type={showPassword ? "text" : "password"} 
                        name="password" 
                        value={formData.password} 
                        onChange={handleChange} 
                        className={inputStyle} 
                        autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-neo-text-sec hover:text-white">
                        {showPassword ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                </div>
            </div>
            <div>
                <label className={labelStyle}><Shield size={12} className="text-neo-purple-light"/> Função</label>
                <select name="role" value={formData.role} onChange={handleChange} className={inputStyle}>
                    <option value="SALES">Vendedor</option>
                    <option value="ENGINEER">Engenheiro</option>
                    <option value="ADMIN">Admin</option>
                </select>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-2.5 bg-neo-green-main hover:bg-neo-green-light text-neo-bg-main text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-neo-green-main/20 mt-2 hover:scale-[1.02] active:scale-[0.98]">
            {loading ? 'Salvando...' : <><Save size={16}/> CADASTRAR USUÁRIO</>}
          </button>

        </form>
      </div>
    </div>
  );
}

export default CreateUserModal;
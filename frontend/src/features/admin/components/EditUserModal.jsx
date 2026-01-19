// /frontend/src/features/register-user/components/EditUserModal.jsx
import { useState, useEffect } from 'react';
import api from '../../../lib/axios';
import { X, User, Mail, Shield, Save, Key } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';



function EditUserModal({ user, onClose, onSuccess }) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'SALES', password: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
        setFormData({
            name: user.name || '',
            email: user.email || '',
            role: user.role || 'SALES',
            password: '' 
        });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

      // --- VERIFICAÇÃO DE SEGURANÇA ADICIONADA ---
      if (!isAuthenticated) {
          alert("Sessão inválida. Faça login.");
          setLoading(false);
          return;
      }

      try {
        const payload = { ...formData };
        if (!payload.password) delete payload.password; 

        await api.put(`/auth/users/${user.id}`, payload);
      
      alert('Usuário atualizado com sucesso!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro update user:", error);
      alert(error.response?.data?.error || 'Erro ao atualizar usuário.');
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = "block text-xs font-bold text-neo-text-sec mb-1.5 flex items-center gap-1.5 uppercase tracking-wide";
  const inputStyle = "w-full bg-neo-surface-2 border border-neo-surface-1 focus:border-neo-purple-light rounded-lg px-3 py-2 text-sm text-white outline-none transition-all placeholder:text-neo-text-sec/30";

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up" onClick={onClose}>
      <div className="bg-neo-bg-main w-full max-w-md rounded-xl border border-neo-surface-2 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        
        <div className="px-5 py-4 border-b border-neo-surface-2 flex justify-between items-center bg-neo-surface-1">
          <h2 className="text-base font-bold text-white">Editar Usuário</h2>
          <button onClick={onClose} className="text-neo-text-sec hover:text-white transition-colors"><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelStyle}><User size={12}/> Nome</label>
            <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputStyle} required />
          </div>

          <div>
            <label className={labelStyle}><Mail size={12}/> E-mail</label>
            <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={inputStyle} required type="email" />
          </div>

          <div>
            <label className={labelStyle}><Shield size={12}/> Função</label>
            <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className={inputStyle}>
                <option value="SALES">Vendedor</option>
                <option value="ENGINEER">Engenheiro</option>
                <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="pt-2 border-t border-neo-surface-2/50 mt-2">
             <label className={labelStyle + " text-yellow-500"}><Key size={12}/> Redefinir Senha (Opcional)</label>
             <input 
                type="password"
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                className={inputStyle} 
                placeholder="Deixe em branco para manter a atual"
             />
          </div>

          <div className="flex gap-2 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-2 bg-neo-surface-2 hover:bg-neo-surface-1 text-neo-text-sec text-sm font-bold rounded-lg transition-colors">Cancelar</button>
              <button type="submit" disabled={loading} className="flex-1 py-2 bg-neo-green-main hover:bg-neo-green-light text-neo-bg-main text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                {loading ? 'Salvando...' : <><Save size={16}/> Salvar</>}
              </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditUserModal;
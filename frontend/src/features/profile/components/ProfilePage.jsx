// /frontend/src/features/profile/components/ProfilePage.jsx
import { useState, useRef } from 'react';
import api from '../../../lib/axios';
import useAuthStore from '../../../store/useAuthStore'; 
import { 
    User, Mail, Phone, Lock, Camera, Save, 
    Shield, LogOut, Eye, EyeOff 
} from 'lucide-react';



function ProfilePage() {
  const { user, login, logout } = useAuthStore(); // login aqui serve para atualizar o estado global
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('details'); 

  // Referência para o input de arquivo oculto
  const fileInputRef = useRef(null);

  // Estado do Formulário
  const [formData, setFormData] = useState({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '', 
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
  });

  const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- FUNÇÃO PARA TROCAR FOTO ---
  const handleAvatarChange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const uploadData = new FormData();
      uploadData.append('avatar', file);

      try {
          setLoading(true);
          const res = await api.post('/auth/upload-avatar', uploadData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });

          // Atualiza o usuário na sessão local
          const updatedUser = res.data.user;
          const token = localStorage.getItem('token');
          login(updatedUser, token); // Atualiza Zustand

          setSuccessMsg('Foto atualizada!');
          setTimeout(() => setSuccessMsg(''), 3000);
      } catch (error) {
          console.error(error);
          setErrorMsg('Erro ao enviar imagem.');
      } finally {
          setLoading(false);
      }
  };

  // --- FUNÇÃO PARA SALVAR DADOS ---
  const handleSave = async (e) => {
      e.preventDefault();
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      try {
          // Validação de segurança
          if (activeTab === 'security') {
              if (formData.newPassword !== formData.confirmPassword) {
                  throw new Error("As novas senhas não coincidem.");
              }
              if (formData.newPassword.length < 6) {
                  throw new Error("A senha deve ter pelo menos 6 caracteres.");
              }
              if (!formData.currentPassword) {
                  throw new Error("Digite sua senha atual para confirmar.");
              }
          }

          // Envia para o backend
          const res = await api.put('/auth/profile', formData);

          // Atualiza dados no frontend
          const updatedUser = res.data.user;
          const token = localStorage.getItem('token');
          // Mantém o avatar antigo se a resposta não trouxer (embora o back retorne tudo)
          if (!updatedUser.avatar) updatedUser.avatar = user.avatar; 
          
          login(updatedUser, token);

          setSuccessMsg('Perfil atualizado com sucesso!');
          
          if (activeTab === 'security') {
              setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
          }

      } catch (error) {
          setErrorMsg(error.response?.data?.error || error.message || 'Erro ao atualizar.');
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-[#0B0B0F] text-gray-800 dark:text-white font-sans overflow-hidden transition-colors duration-500">
      
      {/* BACKGROUND DECORATIVO */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neo-purple-main/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-neo-green-main/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* CABEÇALHO */}
      <div className="px-8 py-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center shrink-0 z-10 bg-white/50 dark:bg-[#0B0B0F]/80 backdrop-blur-md">
         <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-neo-surface-2 rounded-lg text-neo-green-main">
                    <User size={24} />
                </div>
                Meu Perfil
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-12">Gerencie suas informações pessoais.</p>
         </div>
         
         <button 
            onClick={logout} 
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg flex items-center gap-2 font-bold text-sm transition-colors border border-red-500/20"
         >
             <LogOut size={18} /> Sair do Sistema
         </button>
      </div>

      {/* CONTEÚDO */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 z-10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* COLUNA 1: CARD IDENTIDADE */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-[#13131A] border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-xl flex flex-col items-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-neo-purple-main to-neo-purple-light opacity-20"></div>
                    
                    {/* AVATAR COM UPLOAD */}
                    <div 
                        className="relative mt-4 mb-4 group cursor-pointer"
                        onClick={() => fileInputRef.current.click()}
                        title="Clique para alterar a foto"
                    >
                        {/* Input Oculto */}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleAvatarChange} 
                            className="hidden" 
                            accept="image/*"
                        />

                        <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-black border-4 border-white dark:border-[#13131A] shadow-lg flex items-center justify-center overflow-hidden relative">
                            {user?.avatar ? (
                                <img 
                                    src={`http://localhost:3001/${user.avatar}`} 
                                    alt="Avatar" 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-4xl font-bold text-gray-400 dark:text-gray-600">
                                    {user?.name?.substring(0,2).toUpperCase() || 'US'}
                                </span>
                            )}
                            
                            {/* Overlay ao passar mouse */}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={24} className="text-white"/>
                            </div>
                        </div>
                        
                        <div className="absolute bottom-1 right-1 p-2 bg-neo-green-main text-black rounded-full border-4 border-white dark:border-[#13131A] shadow-md">
                            <Camera size={18} />
                        </div>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center">{user?.name || 'Usuário'}</h2>
                    <p className="text-sm text-neo-purple-light font-medium mb-2">{user?.role === 'ADMIN' ? 'Administrador' : 'Vendedor'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
            </div>

            {/* COLUNA 2: FORMULÁRIO */}
            <div className="lg:col-span-2">
                <div className="bg-white dark:bg-[#13131A] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden">
                    
                    <div className="flex border-b border-gray-200 dark:border-white/10">
                        <button 
                            onClick={() => setActiveTab('details')}
                            className={`flex-1 py-4 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${activeTab === 'details' ? 'border-neo-green-main text-neo-green-main bg-neo-green-main/5' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            <User size={18}/> Dados Pessoais
                        </button>
                        <button 
                            onClick={() => setActiveTab('security')}
                            className={`flex-1 py-4 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${activeTab === 'security' ? 'border-neo-purple-light text-neo-purple-light bg-neo-purple-light/5' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            <Shield size={18}/> Segurança
                        </button>
                    </div>

                    <div className="p-8">
                        <form onSubmit={handleSave}>
                            
                            {/* ABA 1: DETALHES */}
                            {activeTab === 'details' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputGroup icon={User} label="Nome Completo" name="name" value={formData.name} onChange={handleChange} />
                                        <InputGroup icon={Phone} label="Telefone" name="phone" value={formData.phone} onChange={handleChange} ph="(00) 00000-0000" />
                                    </div>
                                    <InputGroup icon={Mail} label="E-mail (Fixo)" name="email" value={formData.email} onChange={handleChange} type="email" disabled />
                                </div>
                            )}

                            {/* ABA 2: SEGURANÇA */}
                            {activeTab === 'security' && (
                                <div className="space-y-6 animate-fade-in">
                                    <PasswordInput label="Senha Atual" name="currentPassword" value={formData.currentPassword} onChange={handleChange} />
                                    <div className="border-t border-gray-100 dark:border-white/5 my-4"></div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <PasswordInput label="Nova Senha" name="newPassword" value={formData.newPassword} onChange={handleChange} />
                                        <PasswordInput label="Confirmar Nova" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} />
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-gray-200 dark:border-white/5">
                                        Para confirmar a troca, digite sua senha atual.
                                    </p>
                                </div>
                            )}

                            {/* FEEDBACK E BOTÃO */}
                            <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex-1">
                                    {successMsg && <p className="text-sm text-green-500 font-bold animate-pulse">{successMsg}</p>}
                                    {errorMsg && <p className="text-sm text-red-500 font-bold animate-shake">{errorMsg}</p>}
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className={`px-8 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white ${activeTab === 'details' ? 'bg-neo-green-main hover:bg-emerald-500 shadow-neo-green-main/20 text-black' : 'bg-neo-purple-main hover:bg-purple-600 shadow-neo-purple-main/20'}`}
                                >
                                    {loading ? 'Salvando...' : <><Save size={18}/> Salvar Alterações</>}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTES ---

const InputGroup = ({ icon, label, name, value, onChange, type = "text", ph, disabled }) => {
    const Icon = icon;
    return (
        <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide ml-1">{label}</label>
            <div className="relative group">
                <div className="absolute left-3 top-3 text-gray-400 group-focus-within:text-neo-purple-light transition-colors">
                    <Icon size={18} />
                </div>
                <input 
                    type={type} 
                    name={name}
                    value={value} 
                    onChange={onChange}
                    placeholder={ph}
                    disabled={disabled}
                    className={`w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white outline-none transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'focus:border-neo-purple-light focus:ring-1 focus:ring-neo-purple-light/50'}`}
                />
            </div>
        </div>
    );
};

const PasswordInput = ({ label, name, value, onChange }) => {
    const [show, setShow] = useState(false);

    return (
        <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide ml-1">{label}</label>
            <div className="relative group">
                <div className="absolute left-3 top-3 text-gray-400 group-focus-within:text-neo-purple-light transition-colors">
                    <Lock size={18} />
                </div>
                <input 
                    type={show ? 'text' : 'password'} 
                    name={name}
                    value={value} 
                    onChange={onChange}
                    className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-sm text-gray-900 dark:text-white outline-none transition-all focus:border-neo-purple-light focus:ring-1 focus:ring-neo-purple-light/50"
                />
                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-neo-purple-light transition-colors cursor-pointer"
                    title={show ? "Ocultar senha" : "Ver senha"}
                >
                    {show ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
            </div>
        </div>
    );
};

export default ProfilePage;
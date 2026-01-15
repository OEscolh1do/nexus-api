import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/axios';
import { Eye, EyeOff, Lock, Mail, ChevronRight, Zap, AlertCircle } from 'lucide-react'; 
import useAuthStore from '../../../store/useAuthStore'; 

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  // Pega a função de login do Zustand Store
  const login = useAuthStore((state) => state.login);

  // Detecção de Tema
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. Envia credenciais para o Backend
      const response = await api.post('/auth/login', { email, password });
      
      const { token, user } = response.data;
      
      // 2. Salva no Store Global (Zustand) e LocalStorage
      login(token, user); 
      
      // 3. Redirecionamento Inteligente baseado no Cargo (Role)
      // ADMIN vê o Dashboard Gerencial, Vendedores vão para o Kanban
      if (user.role === 'ADMIN' || user.role === 'MANAGER') {
          navigate('/dashboard');
      } else {
          navigate('/kanban');
      }

    } catch (err) {
      // Tratamento de Erro Seguro (Não revelar se o email existe ou não explicitamente)
      const msg = err.response?.data?.error || 'Falha na autenticação.';
      setError(msg);
      setPassword(''); // Limpa a senha por segurança em caso de erro
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#050508] text-gray-800 dark:text-white overflow-hidden font-sans transition-colors duration-500">
            
      {/* Malha de Fundo */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

      {/* Efeitos de Luz (Aurora) */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-400/30 dark:bg-purple-600/20 rounded-full blur-[100px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-green-400/30 dark:bg-green-600/20 rounded-full blur-[100px] animate-pulse-slow delay-700"></div>

      <div className="relative w-full max-w-sm z-10 mx-6">
        
        {/* LOGO */}
        <div className="text-center mb-8 relative">
            <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full opacity-0 dark:opacity-40 animate-pulse"></div>
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 mb-6 shadow-2xl backdrop-blur-md">
                <Zap size={32} className="text-green-600 dark:text-green-400 fill-current dark:drop-shadow-[0_0_15px_rgba(74,222,128,0.8)]" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-1">Bem-vindo</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-[0.3em] font-semibold">Nexus Norte Energia</p>
        </div>

        {/* CARD DE LOGIN */}
        <div className="bg-white/80 dark:bg-[#13131A]/60 backdrop-blur-2xl border border-white/60 dark:border-white/10 p-8 rounded-3xl shadow-xl dark:shadow-[0_0_40px_-10px_rgba(0,0,0,0.7)] transition-all duration-500 hover:border-green-500/10 dark:hover:border-white/20">
          
          <form onSubmit={handleSubmit} className="space-y-6">
  
            {/* Input E-mail */}
            <div className="group space-y-2">
              <label className="block text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 transition-colors group-focus-within:text-green-600 dark:group-focus-within:text-green-400 ml-1">E-mail Corporativo</label>
              <div className="relative flex items-center">
                <Mail size={18} className="absolute left-4 text-gray-400 group-focus-within:text-green-600 dark:group-focus-within:text-white transition-colors z-10" />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none transition-all duration-300
                  focus:border-green-500 dark:focus:border-green-500
                  focus:ring-4 focus:ring-green-500/10 dark:focus:ring-green-500/20"
                  placeholder="usuario@nexus.com"
                  required 
                />
              </div>
            </div>
            
            {/* Input Senha */}
            <div className="group space-y-2">
              <label className="block text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 transition-colors group-focus-within:text-purple-600 dark:group-focus-within:text-purple-400 ml-1">Senha</label>
              <div className="relative flex items-center">
                <Lock size={18} className="absolute left-4 text-gray-400 group-focus-within:text-purple-600 dark:group-focus-within:text-white transition-colors z-10" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl py-3.5 pl-11 pr-12 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none transition-all duration-300
                  focus:border-purple-500 dark:focus:border-purple-500
                  focus:ring-4 focus:ring-purple-500/10 dark:focus:ring-purple-500/20"
                  placeholder="••••••••"
                  required 
                />
                <button
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer z-20"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 rounded-xl animate-shake">
                <AlertCircle size={16} />
                <span className="font-bold">{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full mt-6 bg-gray-900 dark:bg-white text-white dark:text-black font-bold py-4 rounded-xl relative overflow-hidden group transition-all hover:scale-[1.02] hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
              <div className="flex items-center justify-center gap-2 relative z-10">
                  {isLoading ? 'Autenticando...' : 'ACESSAR SISTEMA'}
                  {!isLoading && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </div>
            </button>

          </form>
        </div>

        <p className="text-center text-[10px] text-gray-400 dark:text-gray-600 mt-8 font-medium tracking-wide opacity-50">
            Ambiente Seguro SSL • Nexus v2.0
        </p>

      </div>
    </div>
  );
}

export default LoginPage;
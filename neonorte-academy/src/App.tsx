/// <reference types="vite/client" />
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GraduationCap, LogOut } from 'lucide-react';
import { Card } from '@/components/ui/mock-components';
import { Button } from '@/components/ui/mock-components';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("token");
  });

  useEffect(() => {
    // URL JWT Trapping (SSO Pass-Through)
    const params = new URLSearchParams(window.location.search);
    const sessionToken = params.get("session");

    if (sessionToken) {
      localStorage.setItem("token", sessionToken);
      window.history.replaceState({}, document.title, window.location.pathname);
      setIsAuthenticated(true);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    // Redirect to Hub or monolith login
    const hubUrl = import.meta.env.VITE_HUB_URL || "http://localhost:5175";
    window.location.href = hubUrl;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050510] flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 bg-[#0a0a16] border-white/10 flex flex-col items-center text-center">
          <GraduationCap size={48} className="text-teal-400 mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">Neonorte Academy</h2>
          <p className="text-slate-400 mb-8">Acesso restrito. Faça login através do Hub Central.</p>
          <Button onClick={() => window.location.href = import.meta.env.VITE_HUB_URL || "http://localhost:5175"} className="w-full bg-teal-600 hover:bg-teal-500 text-white border-0">
            Ir para o Hub
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 relative flex flex-col font-sans selection:bg-teal-500/30">
        {/* Header Exemplo */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="w-1 h-5 bg-gradient-to-b from-teal-500 to-teal-700 rounded-full"></div>
                <h2 className="text-[15px] font-semibold text-slate-800 tracking-tight flex items-center gap-2">
                    <GraduationCap size={18} className="text-teal-600" />
                    Academy Portal
                </h2>
            </div>
            <div className="flex items-center gap-4">
                 <Button variant="ghost" onClick={logout} className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 h-8 px-3 rounded-full hidden sm:flex items-center gap-2">
                    <LogOut size={14} />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Sair</span>
                </Button>
            </div>
        </header>

        {/* Rotas */}
        <main className="flex-1 p-6 flex items-center justify-center">
            <Routes>
                <Route path="/" element={
                     <Card className="max-w-2xl w-full p-12 bg-white text-center rounded-3xl border-slate-200 shadow-xl shadow-teal-900/5">
                        <GraduationCap size={64} className="text-teal-200 mx-auto mb-6" />
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-4">Boas Vindas ao Academy</h1>
                        <p className="text-slate-500 text-lg font-light max-w-lg mx-auto leading-relaxed">
                            O portal de educação corporativa da Neonorte está em construção. Em breve você terá acesso a todas as trilhas de conhecimento arquitetadas pelo nosso micro-frontend.
                        </p>
                    </Card>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { VendorLogin } from './views/VendorLogin';
import { FileText, LogOut, Activity, Briefcase } from 'lucide-react';

function VendorDashboard({ onLogout, vendorId }: { onLogout: () => void, vendorId: string }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative overflow-hidden">
      {/* Background Orbs Claro Minimalista */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-sky-400/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Header Glassmorphism Light */}
      <header className="h-16 border-b border-slate-200/60 backdrop-blur-xl bg-white/70 flex items-center justify-between px-6 shrink-0 sticky top-0 z-10 w-full shadow-sm shadow-slate-200/30">
        <div className="flex items-center gap-3">
            <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-sky-600 rounded-full"></div>
            <h2 className="text-[16px] font-bold tracking-tight text-slate-800 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-500" />
                Nexus B2P <span className="text-slate-400 font-medium">| Conecta</span>
            </h2>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-[12px] font-mono text-slate-400 font-medium bg-slate-100 px-2 py-1 rounded-md hidden sm:block">ID: {vendorId}</span>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-[13px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-full transition-colors uppercase tracking-wider"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6 drop-shadow-sm">Painel de Operações</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Card: Faturas */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/invoices')}>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Faturamento (NFs)</h3>
            <p className="text-slate-500 text-sm mt-1">
              Submeta notas fiscais e acompanhe o status de pagamentos aprovados.
            </p>
          </div>

          {/* Card: RDOs */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/rdos')}>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Relatórios Diários (RDO)</h3>
            <p className="text-slate-500 text-sm mt-1">
              Ateste o avanço físico das obras, adicione fotos e efetivo de campo.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('vendor_token'));
  const [vendorId, setVendorId] = useState<string | null>(localStorage.getItem('vendor_id') || "vendor-external-auth");

  useEffect(() => {
    // URL JWT Trapping (SSO) do Hub Central
    const params = new URLSearchParams(window.location.search);
    const sessionToken = params.get("session");
    
    // Portal parceiro confia no SSO inject
    if (sessionToken) {
      localStorage.setItem("vendor_token", sessionToken);
      setToken(sessionToken);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLogin = (jwt: string, vId: string) => {
    localStorage.setItem('vendor_token', jwt);
    localStorage.setItem('vendor_id', vId);
    setToken(jwt);
    setVendorId(vId);
  };

  const handleLogout = () => {
    localStorage.removeItem('vendor_token');
    localStorage.removeItem('vendor_id');
    setToken(null);
    setVendorId(null);
    // Redirecionamento de segurança cruzada
    window.location.href = import.meta.env.VITE_HUB_URL || "http://localhost:5175";
  };

  if (!token) {
    return <VendorLogin onLoginSuccess={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VendorDashboard onLogout={handleLogout} vendorId={vendorId!} />} />

        <Route path="/invoices" element={
          <div className="p-8 text-center text-slate-500 min-h-screen bg-slate-50">
            Submissão de Invoices (Em desenvolvimento)
            <br />
            <a href="/" className="text-blue-500 underline mt-4 block">Voltar</a>
          </div>
        } />

        <Route path="/rdos" element={
          <div className="p-8 text-center text-slate-500 min-h-screen bg-slate-50">
            Gestão de RDOs (Em desenvolvimento)
            <br />
            <a href="/" className="text-blue-500 underline mt-4 block">Voltar</a>
          </div>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

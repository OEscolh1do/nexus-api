import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ClientLogin } from './views/ClientLogin';
import { LayoutDashboard, LogOut, CheckCircle2, Factory } from 'lucide-react';

function ClientDashboard({ onLogout, tenantId }: { onLogout: () => void, tenantId: string }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-white" />
            <span className="font-bold text-lg tracking-wide">Nexus B2B <span className="text-blue-200 font-normal">| Portal do Cliente</span></span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-blue-200 font-mono hidden sm:inline-block">Auth: {tenantId}</span>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-sm text-blue-100 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Meus Projetos</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Mock Project Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                <Factory className="w-6 h-6" />
              </div>
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> NO PRAZO
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Usina Solar Omega (750kWp)</h3>
            <p className="text-slate-500 text-sm mt-1 mb-4">
              Fase Atual: Instalação de Inversores
            </p>

            <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2">
              <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '65%' }}></div>
            </div>
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>Avanço Físico</span>
              <span>65% Concluído</span>
            </div>

            <button
              onClick={() => navigate('/projects/omega')}
              className="mt-6 w-full bg-slate-50 hover:bg-slate-100 text-indigo-600 border border-slate-200 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
            >
              Ver Detalhes do Projeto
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('client_token'));
  const [tenantId, setTenantId] = useState<string | null>(localStorage.getItem('client_tenant_id'));

  const handleLogin = (jwt: string, tId: string) => {
    localStorage.setItem('client_token', jwt);
    localStorage.setItem('client_tenant_id', tId);
    setToken(jwt);
    setTenantId(tId);
  };

  const handleLogout = () => {
    localStorage.removeItem('client_token');
    localStorage.removeItem('client_tenant_id');
    setToken(null);
    setTenantId(null);
  };

  if (!token) {
    return <ClientLogin onLoginSuccess={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ClientDashboard onLogout={handleLogout} tenantId={tenantId!} />} />

        <Route path="/projects/:id" element={
          <div className="p-8 text-center text-slate-500 min-h-screen bg-slate-50">
            Dashboard Detalhado do Projeto (Transparência C-Level)<br />
            (Fotos, Marcos, Relatórios)<br />
            <a href="/" className="text-blue-500 underline mt-4 block">Voltar</a>
          </div>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { VendorLogin } from './views/VendorLogin';
import { FileText, LogOut, Activity, Briefcase } from 'lucide-react';

function VendorDashboard({ onLogout, vendorId }: { onLogout: () => void, vendorId: string }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 text-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-blue-400" />
            <span className="font-bold text-lg tracking-wide">Nexus B2P <span className="text-slate-400 font-normal">| Conecta</span></span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 font-mono hidden sm:inline-block">ID: {vendorId}</span>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Painel de Operações</h1>

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
  const [vendorId, setVendorId] = useState<string | null>(localStorage.getItem('vendor_id'));

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

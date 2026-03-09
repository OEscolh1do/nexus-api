import { Outlet, Link, useNavigate } from "react-router-dom"
import { ShieldAlert, BarChart3, LogOut, User } from "lucide-react"

export function ClientPortalLayout() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
            {/* Top Navigation Bar for Clients */}
            <header className="bg-slate-900 text-white shadow-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-3">
                            <ShieldAlert className="text-orange-500" size={28} />
                            <span className="font-bold text-xl tracking-tight">Nexus <span className="text-slate-400 font-light">Portal do Cliente</span></span>
                        </div>

                        <div className="flex items-center gap-6">
                            <nav className="hidden md:flex space-x-8">
                                <Link to="/extranet/client/dashboard" className="text-slate-300 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
                                    <BarChart3 size={16} /> Meus Projetos
                                </Link>
                            </nav>

                            <div className="flex items-center gap-4 border-l border-slate-700 pl-6">
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center">
                                        <User size={14} className="text-slate-400" />
                                    </div>
                                    <span className="hidden sm:inline-block">Minha Conta</span>
                                </div>
                                <button onClick={handleLogout} className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-md hover:bg-slate-800">
                                    <LogOut size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-slate-100 border-t border-slate-200 py-6 text-center text-sm text-slate-500">
                <p>Ambiente Seguro • Área do Cliente</p>
                <p className="mt-1">Plataforma Neonorte Nexus</p>
            </footer>
        </div>
    )
}

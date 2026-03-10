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
            {/* Top Navigation Bar — Glassmorphism */}
            <header className="backdrop-blur-xl bg-slate-900/95 text-white shadow-xl sticky top-0 z-50 border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-14 items-center">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="h-8 w-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
                                    <ShieldAlert className="h-4 w-4" />
                                </div>
                                <div className="absolute -inset-0.5 bg-orange-500/15 rounded-lg blur-sm -z-10"></div>
                            </div>
                            <div>
                                <span className="font-bold text-[15px] tracking-tight">Nexus</span>
                                <span className="text-slate-400 font-light text-[15px] ml-1.5">Portal do Cliente</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <nav className="hidden md:flex space-x-1">
                                <Link
                                    to="/extranet/client/dashboard"
                                    className="text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200 flex items-center gap-2 text-[13px] font-medium px-3 py-2 rounded-lg"
                                >
                                    <BarChart3 size={15} /> Meus Projetos
                                </Link>
                            </nav>

                            <div className="flex items-center gap-3 border-l border-slate-700/50 pl-5">
                                <div className="flex items-center gap-2.5">
                                    <div className="relative">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/50 flex items-center justify-center">
                                            <User size={13} className="text-slate-400" />
                                        </div>
                                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
                                    </div>
                                    <span className="hidden sm:inline-block text-[13px] text-slate-400 font-medium">Minha Conta</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 p-2 rounded-lg"
                                >
                                    <LogOut size={16} />
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
            <footer className="border-t border-slate-200/80 py-5 text-center bg-white/50 backdrop-blur-sm">
                <p className="text-[12px] text-slate-400 font-medium">Ambiente Seguro • Área do Cliente</p>
                <p className="text-[11px] text-slate-300 mt-0.5">Plataforma Neonorte Nexus</p>
            </footer>
        </div>
    )
}

import { Outlet, useNavigate } from "react-router-dom"
import { Building2, Camera, MapPin, LogOut } from "lucide-react"
import clsx from "clsx"
import { useLocation } from "react-router-dom"

export function VendorPortalLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const isTasksActive = location.pathname.includes('/tasks');
    const isRdoActive = location.pathname.includes('/rdo');

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Mobile First Header — Glassmorphism */}
            <header className="backdrop-blur-xl bg-blue-900/95 text-white shadow-lg sticky top-0 z-50 border-b border-blue-800/50">
                <div className="px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="relative">
                            <div className="h-8 w-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Building2 className="h-4 w-4" />
                            </div>
                            <div className="absolute -inset-0.5 bg-blue-400/15 rounded-lg blur-sm -z-10"></div>
                        </div>
                        <div>
                            <span className="font-bold text-[15px] tracking-tight">Nexus</span>
                            <span className="text-blue-200/70 font-light text-[15px] ml-1.5">Empreiteiro</span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-blue-300/70 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-200 p-2 rounded-lg"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 w-full pb-20">
                <Outlet />
            </main>

            {/* Mobile Bottom Navigation — Premium */}
            <nav className="fixed bottom-0 w-full backdrop-blur-xl bg-white/90 border-t border-slate-200/80 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.08)] z-50 flex justify-around items-center h-16 px-2">
                <button
                    onClick={() => navigate('/extranet/vendor/tasks')}
                    className={clsx(
                        "flex flex-col items-center justify-center w-full h-full rounded-xl transition-all duration-200",
                        isTasksActive
                            ? "text-blue-600 bg-blue-50/80"
                            : "text-slate-400 hover:text-blue-600 hover:bg-blue-50/50"
                    )}
                >
                    <MapPin size={20} className="mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Obras</span>
                    {isTasksActive && (
                        <span className="absolute top-2 w-1 h-1 rounded-full bg-blue-500 animate-pulse"></span>
                    )}
                </button>
                <button
                    onClick={() => navigate('/extranet/vendor/rdo')}
                    className={clsx(
                        "flex flex-col items-center justify-center w-full h-full rounded-xl transition-all duration-200",
                        isRdoActive
                            ? "text-blue-600 bg-blue-50/80"
                            : "text-slate-400 hover:text-blue-600 hover:bg-blue-50/50"
                    )}
                >
                    <Camera size={20} className="mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Novo RDO</span>
                    {isRdoActive && (
                        <span className="absolute top-2 w-1 h-1 rounded-full bg-blue-500 animate-pulse"></span>
                    )}
                </button>
            </nav>
        </div>
    )
}

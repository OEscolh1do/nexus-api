import { Outlet, useNavigate } from "react-router-dom"
import { Building2, Camera, MapPin, LogOut } from "lucide-react"

export function VendorPortalLayout() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Mobile First Header */}
            <header className="bg-blue-900 text-white shadow-md sticky top-0 z-50">
                <div className="px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Building2 className="text-blue-300" size={24} />
                        <span className="font-bold text-lg tracking-tight">Nexus <span className="text-blue-200 font-light">Empreiteiro</span></span>
                    </div>
                    <button onClick={handleLogout} className="text-blue-200 hover:text-white p-2">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Main Content Area (Optimized for Mobile scrolling) */}
            <main className="flex-1 w-full pb-20"> {/* pb-20 for bottom navigation clearance */}
                <Outlet />
            </main>

            {/* Mobile Bottom Navigation (App-like feel) */}
            <nav className="fixed bottom-0 w-full bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 flex justify-around items-center h-16 px-2">
                <button onClick={() => navigate('/extranet/vendor/tasks')} className="flex flex-col items-center justify-center w-full h-full text-blue-600 hover:bg-blue-50 transition-colors">
                    <MapPin size={22} className="mb-1" />
                    <span className="text-[10px] font-medium uppercase tracking-wider">Obras</span>
                </button>
                <button onClick={() => navigate('/extranet/vendor/rdo')} className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                    <Camera size={22} className="mb-1" />
                    <span className="text-[10px] font-medium uppercase tracking-wider">Novo RDO</span>
                </button>
            </nav>
        </div>
    )
}

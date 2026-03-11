import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Sun, HardHat, Wallet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/mock-components";

export function AppLayout({ children, onLogout }: { children: React.ReactNode, onLogout: () => void }) {
  const location = useLocation();

  const menuItems = [
    { path: "/dashboard", label: "Visão Geral", icon: LayoutDashboard },
    { path: "/solar", label: "Comercial Solar", icon: Sun },
    { path: "/ops", label: "Operações", icon: HardHat },
    { path: "/fin", label: "Financeiro", icon: Wallet },
    // { path: "/mobile", label: "App Campo (Sim)", icon: Smartphone },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white shrink-0 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-800">
             <h1 className="text-xl font-bold tracking-wider">Neonorte | Nexus <span className="text-xs text-yellow-400">2.1</span></h1>
             <p className="text-xs text-slate-400 mt-1">Enterprise System</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
            {menuItems.map(item => {
                const isActive = location.pathname === item.path;
                return (
                    <Link key={item.path} to={item.path}>
                        <Button 
                            variant="ghost" 
                            className={`w-full justify-start ${isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                            <item.icon className="mr-2 h-4 w-4" />
                            {item.label}
                        </Button>
                    </Link>
                )
            })}
        </nav>

        <div className="p-4 border-t border-slate-800">
             <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
             </Button>
        </div>
      </aside>

      {/* MOBILE HEADER (TODO) */}

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-auto">
          <header className="h-16 border-b bg-white dark:bg-slate-900 flex items-center px-6 sticky top-0 z-10">
              <h2 className="text-lg font-medium text-slate-800 dark:text-slate-200">
                  {menuItems.find(m => m.path === location.pathname)?.label || 'Dashboard'}
              </h2>
          </header>
          <div className="p-6">
              {children}
          </div>
      </main>
    </div>
  );
}

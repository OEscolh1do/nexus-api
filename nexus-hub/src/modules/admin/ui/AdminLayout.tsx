import { Outlet, Link, useLocation } from "react-router-dom";
import { Settings, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/mock-components";

export function AdminLayout() {
  const location = useLocation();

  const menu = [
    { path: "/admin/tenant", label: "Governança & API", icon: ShieldCheck },
    { path: "/admin/navigation", label: "Navegação do ERP", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#050510] text-slate-100 font-sans overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-15%] w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
      </div>

      <aside className="w-64 border-r border-slate-800/80 bg-slate-900/50 backdrop-blur-xl flex flex-col z-10">
        <div className="p-6">
          <Link to="/hub" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar ao Hub
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold tracking-tight text-white leading-tight">Admin Console</h1>
              <p className="text-[11px] text-indigo-400 font-medium">Nexus IAM</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {menu.map(item => {
            const active = location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path} className="block">
                <Button variant="ghost" className={`w-full justify-start h-10 px-3 hover:bg-white/5 ${active ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 shadow-inner' : 'text-slate-400 hover:text-white'}`}>
                  <item.icon className="w-4 h-4 mr-3" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto z-10 relative">
        <Outlet />
      </main>
    </div>
  );
}

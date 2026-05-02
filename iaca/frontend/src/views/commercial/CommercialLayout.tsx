import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, Map, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/mock-components";
import clsx from "clsx";
import { useMemo } from "react";

export function CommercialLayout() {
    const location = useLocation();
    const userData = useMemo(() => {
        try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
    }, []);
    const displayName = userData.fullName?.split(' ')[0] || 'Usuário';
    const initials = (userData.fullName || 'U').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

    const menuGroups = [
        {
            title: "Aquisição & Vendas",
            items: [
                { path: "/commercial/clients", label: "Clientes", icon: Users },
                { path: "/commercial/pipeline", label: "Pipeline (Kanban)", icon: LayoutDashboard },
                { path: "/commercial/missions", label: "Central de Missões", icon: Map },
                { path: "/commercial/contracts", label: "Contratos", icon: FileText },
            ]
        },
    ];

    const allItems = menuGroups.flatMap(g => g.items);
    const currentTitle = allItems.find(m => location.pathname.startsWith(m.path))?.label || 'Comercial';

    return (
        <div className="flex h-full bg-[#050510] relative overflow-hidden font-sans">
            {/* Ambient Background Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-15%] left-[-10%] w-80 h-80 bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-15%] right-[-10%] w-96 h-96 bg-cyan-600/15 rounded-full blur-[140px] animate-pulse [animation-delay:2s]" />
                <div className="absolute top-[50%] left-[60%] w-48 h-48 bg-sky-500/10 rounded-full blur-[80px]" />
            </div>

            {/* ── Sidebar Premium ── */}
            <aside className="w-64 shrink-0 hidden md:flex h-screen sticky top-0 flex-col border-r border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white">
                {/* Brand Header with Blue Glow */}
                <div className="p-6">
                    <div className="flex items-center gap-x-3 mb-2">
                        <div className="relative">
                            <div className="h-9 w-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 shadow-lg shadow-blue-500/25">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <div className="absolute -inset-0.5 bg-blue-500/20 rounded-lg blur-sm -z-10"></div>
                        </div>
                        <div>
                            <h1 className="text-sm font-bold tracking-wider leading-none">Neonorte | Nexus</h1>
                            <p className="text-[11px] text-blue-300/70 mt-1 font-medium tracking-wide">Módulo Comercial</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Groups */}
                <nav className="flex-1 px-3 space-y-5 overflow-y-auto custom-scrollbar">
                    {menuGroups.map((group, groupIndex) => (
                        <div key={groupIndex}>
                            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2">
                                {group.title}
                            </p>
                            <div className="space-y-0.5">
                                {group.items.map(item => {
                                    const isActive = location.pathname.startsWith(item.path);
                                    return (
                                        <Link key={item.path} to={item.path}>
                                            <Button
                                                variant="ghost"
                                                className={clsx(
                                                    "w-full justify-start flex items-center gap-x-3 h-9 rounded-lg transition-all duration-200",
                                                    isActive
                                                        ? 'bg-blue-500/15 text-blue-200 shadow-sm shadow-blue-500/5 border border-blue-500/20'
                                                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                                                )}
                                            >
                                                <span className={clsx(
                                                    "w-5 flex justify-center shrink-0 transition-colors duration-200",
                                                    isActive && "text-blue-400"
                                                )}>
                                                    <item.icon className="h-4 w-4" />
                                                </span>
                                                <span className="leading-none text-[13px] font-medium">{item.label}</span>
                                                {isActive && (
                                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                                                )}
                                            </Button>
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </aside>

            {/* ── Main Content ── */}
            <main className="relative z-10 flex-1 overflow-auto flex flex-col h-full">
                {/* Glassmorphism Header */}
                <header className="h-14 border-b border-white/10 backdrop-blur-xl bg-[#0a0a16]/80 flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(56,189,248,0.5)]"></div>
                        <h2 className="text-[15px] font-semibold text-slate-100 tracking-tight drop-shadow-sm">
                            {currentTitle}
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[13px] text-slate-400 font-medium">{displayName}</span>
                        <div className="relative">
                            <div className="h-8 w-8 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-full flex items-center justify-center text-xs font-bold text-blue-300 ring-1 ring-blue-500/30">
                                {initials}
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0a0a16] shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>
                        </div>
                    </div>
                </header>
                <div className="p-6 flex-1">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

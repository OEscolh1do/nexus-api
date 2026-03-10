import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, Wallet, PieChart, ArrowLeft, Users, Target, Briefcase, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/mock-components";
import clsx from "clsx";
import { useMemo } from "react";

export function ExecutiveLayout() {
    const location = useLocation();
    const userData = useMemo(() => {
        try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
    }, []);
    const displayName = userData.fullName?.split(' ')[0] || 'Usuário';
    const initials = (userData.fullName || 'U').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

    const menuGroups = [
        {
            title: "Gestão Estratégica",
            items: [
                { path: "/executive/strategy", label: "Estratégia", icon: Target },
                { path: "/executive/portfolio", label: "Portfólio", icon: Briefcase },
                { path: "/executive/people", label: "Pessoas", icon: Users },
            ]
        },
        {
            title: "Inteligência de Negócio",
            items: [
                { path: "/executive/overview", label: "Visão Geral", icon: LayoutDashboard },
                { path: "/executive/analytics", label: "Indicadores", icon: PieChart },
            ]
        },
        {
            title: "Controladoria",
            items: [
                { path: "/executive/financial", label: "Financeiro", icon: Wallet },
                { path: "/executive/audit", label: "Audit Trail", icon: Target },
            ]
        }
    ];

    const allItems = menuGroups.flatMap(g => g.items);

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* ── Sidebar Premium ── */}
            <aside className="w-64 shrink-0 hidden md:flex h-screen sticky top-0 flex-col border-r border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white">
                {/* Brand Header with Purple Glow */}
                <div className="p-6">
                    <div className="flex items-center gap-x-3 mb-2">
                        <div className="relative">
                            <div className="h-9 w-9 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 shadow-lg shadow-purple-500/25">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <div className="absolute -inset-0.5 bg-purple-500/20 rounded-lg blur-sm -z-10"></div>
                        </div>
                        <div>
                            <h1 className="text-sm font-bold tracking-wider leading-none">Neonorte | Nexus</h1>
                            <p className="text-[11px] text-purple-300/70 mt-1 font-medium tracking-wide">Módulo Executivo</p>
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
                                                        ? 'bg-purple-500/15 text-purple-200 shadow-sm shadow-purple-500/5 border border-purple-500/20'
                                                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                                                )}
                                            >
                                                <span className={clsx(
                                                    "w-5 flex justify-center shrink-0 transition-colors duration-200",
                                                    isActive && "text-purple-400"
                                                )}>
                                                    <item.icon className="h-4 w-4" />
                                                </span>
                                                <span className="leading-none text-[13px] font-medium">{item.label}</span>
                                                {isActive && (
                                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
                                                )}
                                            </Button>
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-slate-800/50 mt-auto">
                    <Link to="/">
                        <Button variant="ghost" className="w-full justify-start flex items-center gap-x-3 h-9 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all duration-200 group">
                            <span className="w-5 flex justify-center shrink-0">
                                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
                            </span>
                            <span className="leading-none text-[13px] font-medium">Trocar Módulo</span>
                        </Button>
                    </Link>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <main className="flex-1 overflow-auto">
                {/* Glassmorphism Header */}
                <header className="h-14 border-b border-slate-200/80 dark:border-slate-800 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 flex items-center justify-between px-6 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-purple-700 rounded-full"></div>
                        <h2 className="text-[15px] font-semibold text-slate-800 dark:text-slate-200 tracking-tight">
                            {allItems.find(m => location.pathname.startsWith(m.path))?.label || 'Painel'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[13px] text-slate-500 font-medium">{displayName}</span>
                        <div className="relative">
                            <div className="h-8 w-8 bg-gradient-to-br from-purple-100 to-purple-50 rounded-full flex items-center justify-center text-xs font-bold text-purple-700 ring-2 ring-purple-200/50">
                                {initials}
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                        </div>
                    </div>
                </header>
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

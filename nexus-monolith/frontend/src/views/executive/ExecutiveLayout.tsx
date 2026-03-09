import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, Wallet, PieChart, ArrowLeft, Users, Target } from "lucide-react";
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
                { path: "/executive/audit", label: "Audit Trail", icon: Target }, // FASE 1: Foundational Audit
            ]
        }
    ];

    const allItems = menuGroups.flatMap(g => g.items);

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
            <aside className="w-64 bg-slate-900 text-white shrink-0 hidden md:flex h-screen sticky top-0 flex-col border-r border-slate-800">
                <div className="p-6">
                    <div className="flex items-center gap-x-3 mb-4">
                        <div className="h-8 w-8 bg-purple-600 rounded-lg flex items-center justify-center font-bold shrink-0">EX</div>
                        <div>
                            <h1 className="text-sm font-bold tracking-wider leading-none">Neonorte | Nexus</h1>
                            <p className="text-xs text-slate-400 mt-1">Módulo Executivo</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-6 overflow-y-auto custom-scrollbar">
                    {menuGroups.map((group, groupIndex) => (
                        <div key={groupIndex}>
                            <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                {group.title}
                            </p>
                            <div className="space-y-1">
                                {group.items.map(item => {
                                    const isActive = location.pathname.startsWith(item.path);
                                    return (
                                        <Link key={item.path} to={item.path}>
                                            <Button
                                                variant="ghost"
                                                className={clsx(
                                                    "w-full justify-start flex items-center gap-x-3",
                                                    isActive
                                                        // COMPLIANCE_NEXUS_STANDARD: Purple Theme for Executive
                                                        ? 'bg-purple-900/50 text-purple-200 border-r-2 border-purple-500 rounded-none'
                                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                                )}
                                            >
                                                {/* COMPLIANCE_NEXUS_STANDARD: Icon fixed size w-5 container */}
                                                <span className="w-5 flex justify-center shrink-0">
                                                    <item.icon className="h-4 w-4" />
                                                </span>
                                                {/* COMPLIANCE_NEXUS_STANDARD: Text alignment and size */}
                                                <span className="leading-none text-sm">{item.label}</span>
                                            </Button>
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* COMPLIANCE_NEXUS_STANDARD: Footer pinned to bottom with specific container */}
                <div className="mt-auto p-4 border-t border-slate-800">
                    <Link to="/">
                        <Button variant="ghost" className="w-full justify-start flex items-center gap-x-3 text-slate-400 hover:text-white group">
                            <span className="w-5 flex justify-center shrink-0">
                                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            </span>
                            <span className="leading-none text-sm">Trocar Módulo</span>
                        </Button>
                    </Link>
                </div>
            </aside>

            <main className="flex-1 overflow-auto">
                <header className="h-16 border-b bg-white dark:bg-slate-900 flex items-center justify-between px-6 sticky top-0 z-10">
                    <h2 className="text-lg font-medium text-slate-800 dark:text-slate-200">
                        {allItems.find(m => location.pathname.startsWith(m.path))?.label || 'Painel'}
                    </h2>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-muted-foreground">Bem-vindo, {displayName}</span>
                        <div className="h-8 w-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">{initials}</div>
                    </div>
                </header>
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

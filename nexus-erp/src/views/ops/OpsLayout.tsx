import { Link, Outlet, useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/mock-components";
import clsx from "clsx";

import { useNavigation } from "@/hooks/useNavigation";

export function OpsLayout() {
    const location = useLocation();
    const { groups: menuGroups, isLoading } = useNavigation('OPS');

    const allItems = menuGroups ? menuGroups.flatMap(g => g.items) : [];
    const currentLabel = allItems.find(m => location.pathname.startsWith(m.path))?.label || 'Projetos';

    return (
        <div className="flex h-full bg-[#050510] relative overflow-hidden font-sans">
            {/* Ambient Background Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-15%] left-[-10%] w-80 h-80 bg-orange-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-15%] right-[-10%] w-96 h-96 bg-amber-600/15 rounded-full blur-[140px] animate-pulse [animation-delay:2s]" />
                <div className="absolute top-[50%] left-[60%] w-48 h-48 bg-yellow-500/10 rounded-full blur-[80px]" />
            </div>

            {/* ── Sidebar Premium ── */}
            <aside className="w-64 shrink-0 hidden md:flex h-screen sticky top-0 flex-col border-r border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white">
                {/* Brand Header with Orange Glow */}
                <div className="p-6">
                    <div className="flex items-center gap-x-3 mb-2">
                        <div className="relative">
                            <div className="h-9 w-9 bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 shadow-lg shadow-orange-500/25">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <div className="absolute -inset-0.5 bg-orange-500/20 rounded-lg blur-sm -z-10"></div>
                        </div>
                        <div>
                            <h1 className="text-sm font-bold tracking-wider leading-none">Neonorte | Nexus</h1>
                            <p className="text-[11px] text-orange-300/70 mt-1 font-medium tracking-wide">Módulo Operações</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Groups */}
                <nav className="flex-1 px-3 space-y-5 overflow-y-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="space-y-5">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="animate-pulse">
                                    <div className="h-2.5 w-24 bg-slate-800 rounded mb-3 mx-3"></div>
                                    <div className="space-y-1.5">
                                        <div className="h-9 bg-slate-800/60 rounded-lg"></div>
                                        <div className="h-9 bg-slate-800/40 rounded-lg"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        menuGroups.map((group, groupIndex) => (
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
                                                            ? 'bg-orange-500/15 text-orange-200 shadow-sm shadow-orange-500/5 border border-orange-500/20'
                                                            : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                                                    )}
                                                >
                                                    <span className={clsx(
                                                        "w-5 flex justify-center shrink-0 transition-colors duration-200",
                                                        isActive && "text-orange-400"
                                                    )}>
                                                        <item.icon className="h-4 w-4" />
                                                    </span>
                                                    <span className="leading-none text-[13px] font-medium">{item.label}</span>
                                                    {isActive && (
                                                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
                                                    )}
                                                </Button>
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </nav>
            </aside>

            {/* ── Main Content ── */}
            <main className="relative z-10 flex-1 overflow-auto flex flex-col h-full">
                {/* Glassmorphism Header */}
                <header className="h-14 border-b border-white/10 backdrop-blur-xl bg-[#0a0a16]/80 flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-5 bg-gradient-to-b from-orange-500 to-amber-400 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
                        <h2 className="text-[15px] font-semibold text-slate-100 tracking-tight drop-shadow-sm">
                            {currentLabel}
                        </h2>
                    </div>
                    <div className="flex items-center gap-x-4">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-orange-500/20 to-amber-500/10 rounded-full border border-orange-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]"></span>
                            <span className="text-[11px] font-bold text-orange-300">Área de Engenharia</span>
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

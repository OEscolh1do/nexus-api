import { Link, Outlet, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/mock-components";
import clsx from "clsx";

import { useNavigation } from "@/hooks/useNavigation";

export function OpsLayout() {
    const location = useLocation();
    const { groups: menuGroups, isLoading } = useNavigation('OPS');

    // Helper to find current active label for the header
    // Safe navigation check
    const allItems = menuGroups ? menuGroups.flatMap(g => g.items) : [];
    const currentLabel = allItems.find(m => location.pathname.startsWith(m.path))?.label || 'Projetos';

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
            <aside className="w-64 bg-slate-900 text-white shrink-0 hidden md:flex flex-col border-r border-slate-800 sticky top-0 h-screen">
                <div className="p-6">
                    <div className="flex items-center gap-x-3 mb-4">
                        <div className="h-8 w-8 bg-orange-600 rounded-lg flex items-center justify-center font-bold shrink-0">OP</div>
                        <div>
                            <h1 className="text-sm font-bold tracking-wider leading-none">Neonorte | Nexus</h1>
                            <p className="text-xs text-slate-400 mt-1">Operations View</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-6 overflow-y-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="space-y-6 animate-pulse">
                            {[1, 2, 3].map(i => (
                                <div key={i}>
                                    <div className="h-3 w-24 bg-slate-800 rounded mb-3"></div>
                                    <div className="space-y-2">
                                        <div className="h-8 bg-slate-800 rounded"></div>
                                        <div className="h-8 bg-slate-800 rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        menuGroups.map((group, groupIndex) => (
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
                                                            // COMPLIANCE_NEXUS_STANDARD: Orange Theme for Ops
                                                            ? 'bg-orange-900/50 text-orange-200 border-r-2 border-orange-500 rounded-none'
                                                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                                    )}
                                                >
                                                    {/* COMPLIANCE_NEXUS_STANDARD: Icon fixed size w-5 container */}
                                                    <span className="w-5 flex justify-center shrink-0">
                                                        <item.icon className="h-4 w-4" />
                                                    </span>
                                                    {/* COMPLIANCE_NEXUS_STANDARD: Text alignment */}
                                                    <span className="leading-none">{item.label}</span>
                                                </Button>
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </nav>

                {/* COMPLIANCE_NEXUS_STANDARD: Footer pinned to bottom */}
                <div className="p-4 border-t border-slate-800 mt-auto">
                    <Link to="/">
                        <Button variant="ghost" className="w-full justify-start flex items-center gap-x-3 text-slate-400 hover:text-white group">
                            <span className="w-5 flex justify-center shrink-0">
                                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            </span>
                            <span className="leading-none">Trocar Módulo</span>
                        </Button>
                    </Link>
                </div>
            </aside>

            <main className="flex-1 overflow-auto">
                <header className="h-16 border-b bg-white dark:bg-slate-900 flex items-center justify-between px-6 sticky top-0 z-10 border-b-orange-500/20">
                    <h2 className="text-lg font-medium text-slate-800 dark:text-slate-200 leading-none">
                        {currentLabel}
                    </h2>
                    <div className="flex items-center gap-x-4">
                        <div className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-bold">Engineers Only</div>
                    </div>
                </header>
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

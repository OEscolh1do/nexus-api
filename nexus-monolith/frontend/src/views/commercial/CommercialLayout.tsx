import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, ArrowLeft, Map } from "lucide-react";
import { Button } from "@/components/ui/mock-components";
import clsx from "clsx";

export function CommercialLayout() {
    const location = useLocation();

    const menuGroups = [
        {
            title: "Aquisição & Vendas",
            items: [
                { path: "/commercial/pipeline", label: "Pipeline (Kanban)", icon: LayoutDashboard },
                { path: "/commercial/missions", label: "Mission Control", icon: Map },
                { path: "/commercial/quotes", label: "Solar Wizard", icon: FileText },
                { path: "/commercial/contracts", label: "Contratos", icon: FileText },
            ]
        },

    ];

    const allItems = menuGroups.flatMap(g => g.items);
    const currentTitle = allItems.find(m => location.pathname.startsWith(m.path))?.label || 'Commercial';

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
            <aside className="w-64 bg-slate-900 text-white shrink-0 hidden md:flex h-screen sticky top-0 flex-col border-r border-slate-800">
                <div className="p-6">
                    <div className="flex items-center gap-x-3 mb-4">
                        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold shrink-0">CM</div>
                        <div>
                            <h1 className="text-sm font-bold tracking-wider leading-none">Neonorte | Nexus</h1>
                            <p className="text-xs text-slate-400 mt-1">Commercial View</p>
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
                                                        // COMPLIANCE_NEXUS_STANDARD: Blue Theme for Commercial
                                                        ? "bg-blue-900/50 text-blue-200 border-r-2 border-blue-500 rounded-none"
                                                        : "text-slate-400 hover:text-white hover:bg-slate-800"
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

            <main className="flex-1 overflow-auto flex flex-col h-screen">
                <header className="h-16 border-b bg-white dark:bg-slate-900 flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
                    <h2 className="text-lg font-medium text-slate-800 dark:text-slate-200">
                        {currentTitle}
                    </h2>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-muted-foreground">Vendedor</span>
                        <div className="h-8 w-8 bg-blue-100 text-blue-700 flex items-center justify-center rounded-full font-bold text-xs">VE</div>
                    </div>
                </header>
                <div className="p-6 flex-1 overflow-y-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

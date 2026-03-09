import { Link } from "react-router-dom";
import { Card } from "@/components/ui/mock-components";
import { Briefcase, HardHat, GraduationCap, LayoutDashboard, LogOut } from "lucide-react";

const apps = [
    {
        id: 'executive',
        name: 'Gestão à Vista',
        desc: 'BI, Financeiro e Estratégia',
        path: '/executive/overview',
        icon: LayoutDashboard,
        color: 'bg-blue-600',
        accent: '#2563eb'
    },
    {
        id: 'commercial',
        name: 'Mission Control',
        desc: 'CRM, Leads e Vendas',
        path: '/commercial',
        icon: Briefcase,
        color: 'bg-purple-600',
        accent: '#9333ea'
    },
    {
        id: 'ops',
        name: 'Fábrica de Projetos',
        desc: 'Engenharia, Obras e Vistorias',
        path: '/ops/cockpit',
        icon: HardHat,
        color: 'bg-orange-600',
        accent: '#ea580c'
    },
    {
        id: 'academy',
        name: 'Portal Academy',
        desc: 'Treinamento e Comunidade',
        path: '/academy',
        icon: GraduationCap,
        color: 'bg-teal-600',
        accent: '#0d9488'
    },
    {
        id: 'b2b_portal',
        name: 'Portal do Cliente (B2B)',
        desc: 'Dashboard de Transparência (Extranet)',
        path: '/extranet/client/dashboard',
        icon: LayoutDashboard,
        color: 'bg-slate-800',
        accent: '#1e293b'
    },
    {
        id: 'b2p_portal',
        name: 'Terminal Subcontratado (B2P)',
        desc: 'Mobile-First (RDOs e Faturamento)',
        path: '/extranet/vendor/tasks',
        icon: HardHat,
        color: 'bg-blue-800',
        accent: '#1e40af'
    }
];

export function AppSwitcher({ onLogout }: { onLogout: () => void }) {
    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight leading-tight">
                        Neonorte | Nexus <span className="text-orange-500">2.1</span>
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400">Selecione seu módulo de trabalho</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {apps.map((app) => (
                        <Link key={app.id} to={app.path}>
                            <Card className="h-40 flex items-center p-6 hover:shadow-xl transition-all border-l-4 hover:scale-[1.02] cursor-pointer group" style={{ borderLeftColor: app.accent }}>
                                <div className={`h-16 w-16 ${app.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:rotate-3 transition-transform`}>
                                    <app.icon size={32} />
                                </div>
                                <div className="ml-6">
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors">{app.name}</h3>
                                    <p className="text-slate-500 mt-1">{app.desc}</p>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>

                <div className="text-center mt-12">
                    <button onClick={onLogout} className="text-slate-400 hover:text-red-500 flex items-center justify-center mx-auto transition-colors">
                        <LogOut size={16} className="mr-2" /> Sair do Sistema
                    </button>
                </div>
            </div>
        </div>
    )
}

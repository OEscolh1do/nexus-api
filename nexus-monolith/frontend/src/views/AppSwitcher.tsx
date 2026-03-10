import { Link } from "react-router-dom";
import { Card } from "@/components/ui/mock-components";
import { Briefcase, HardHat, GraduationCap, LayoutDashboard, LogOut } from "lucide-react";

const modules = [
    {
        id: 'executive',
        name: 'Gestão à Vista',
        description: 'BI, Financeiro e Estratégia',
        href: '/executive/overview',
        coverImage: '/assets/modules/bg-executive.png',
        icon: LayoutDashboard,
        accentColor: '#2563eb'
    },
    {
        id: 'commercial',
        name: 'Mission Control',
        description: 'CRM, Leads e Vendas',
        href: '/commercial',
        coverImage: '/assets/modules/bg-commercial.png',
        icon: Briefcase,
        accentColor: '#9333ea'
    },
    {
        id: 'ops',
        name: 'Fábrica de Projetos',
        description: 'Engenharia, Obras e Vistorias',
        href: '/ops/cockpit',
        coverImage: '/assets/modules/bg-ops.png',
        icon: HardHat,
        accentColor: '#ea580c'
    },
    {
        id: 'academy',
        name: 'Portal Academy',
        description: 'Treinamento e Comunidade',
        href: '/academy',
        coverImage: '/assets/modules/bg-academy.png',
        icon: GraduationCap,
        accentColor: '#0d9488'
    },
    {
        id: 'b2b',
        name: 'Portal do Cliente (B2B)',
        description: 'Dashboard de Transparência',
        href: '/extranet/client/dashboard',
        coverImage: '/assets/modules/bg-b2b.png',
        icon: LayoutDashboard,
        accentColor: '#94a3b8'
    },
    {
        id: 'b2p',
        name: 'Terminal Extranet (B2P)',
        description: 'RDOs, Ocorrências e Faturamento',
        href: '/extranet/vendor/tasks',
        coverImage: '/assets/modules/bg-b2p.png',
        icon: HardHat,
        accentColor: '#3b82f6'
    }
];

export function AppSwitcher({ onLogout }: { onLogout: () => void }) {
    return (
        <div className="min-h-screen lg:h-screen bg-[#050510] relative flex flex-col items-center overflow-x-hidden overflow-y-auto font-sans">
            {/* Ambient Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-purple-600/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-15%] right-[-10%] w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
            </div>

            {/* Main Content — uses flex-1 on desktop to fill exactly 100vh */}
            <div className="w-full max-w-6xl z-10 flex flex-col items-center px-4 sm:px-6 py-8 md:py-10 lg:flex-1 lg:justify-center">
                {/* Header Section */}
                <div className="text-center mb-6 md:mb-8 space-y-2">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 tracking-tight leading-tight">
                        Enterprise Portal
                    </h1>
                    <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto font-light">
                        Selecione seu módulo de operação para acessar o cockpit de gestão corporativa.
                    </p>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full">
                    {modules.map((mod) => (
                        <Link key={mod.id} to={mod.href} className="group outline-none block">
                            <Card className="relative overflow-hidden bg-[#0a0a16] border border-white/10 hover:border-white/20 backdrop-blur-xl transition-all duration-500 rounded-2xl sm:rounded-3xl shadow-xl hover:-translate-y-1 hover:shadow-[0_16px_32px_-10px_rgba(0,0,0,0.7)] flex flex-col text-left p-0 w-full aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/9]">
                                {/* Cover Image Background */}
                                <div className="absolute inset-0 z-0">
                                    <img
                                        src={mod.coverImage}
                                        alt={mod.name}
                                        loading="lazy"
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out opacity-50 group-hover:opacity-80"
                                    />
                                    {/* Gradient overlay for contrast */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-[#050510]/85 to-[#050510]/20 pointer-events-none" />
                                </div>

                                {/* Content anchored to bottom */}
                                <div className="relative z-10 p-3 sm:p-4 md:p-5 flex flex-col h-full w-full justify-end items-start">
                                    <div
                                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center bg-white/10 border border-white/10 shadow-lg backdrop-blur-md mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-500"
                                        style={{ color: mod.accentColor }}
                                    >
                                        <mod.icon strokeWidth={1.5} className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white mb-0.5 tracking-tight drop-shadow-md leading-tight">{mod.name}</h3>
                                    <p className="text-[11px] sm:text-xs text-slate-400 font-light drop-shadow hidden sm:block">{mod.description}</p>
                                </div>

                                {/* Bottom indicator line */}
                                <div className="absolute bottom-0 left-0 h-0.5 sm:h-1 w-0 group-hover:w-full transition-all duration-700 ease-out opacity-90 z-20" style={{ backgroundColor: mod.accentColor }} />
                            </Card>
                        </Link>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-6 md:mt-8">
                    <button
                        onClick={onLogout}
                        className="group flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-all duration-300"
                    >
                        <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium tracking-wide text-xs sm:text-sm">Encerrar Sessão Segura</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

import { Link } from "react-router-dom";
import { Card } from "@/components/ui/mock-components";
import { Briefcase, HardHat, GraduationCap, LayoutDashboard, LogOut, Blocks, Globe, BookOpen, Settings } from "lucide-react";

const appGroups = [
    {
        id: 'core',
        title: 'Core Business & Operações',
        description: 'Módulos primários de gestão e operação da empresa.',
        icon: Blocks,
        items: [
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
            }
        ]
    },
    {
        id: 'external',
        title: 'Ecossistema Externo',
        description: 'Portais de relacionamento com clientes e fornecedores.',
        icon: Globe,
        items: [
            {
                id: 'b2b',
                name: 'Portal do Cliente',
                description: 'Dashboard de Transparência',
                href: '/extranet/client/dashboard',
                coverImage: '/assets/modules/bg-b2b.png',
                icon: LayoutDashboard,
                accentColor: '#94a3b8'
            },
            {
                id: 'b2p',
                name: 'Terminal Extranet',
                description: 'RDOs, Ocorrências e Faturamento',
                href: '/extranet/vendor/tasks',
                coverImage: '/assets/modules/bg-b2p.png',
                icon: HardHat,
                accentColor: '#3b82f6'
            }
        ]
    },
    {
        id: 'apps',
        title: 'Ferramentas & Apps',
        description: 'Aplicativos integrados e utilitários da plataforma.',
        icon: Blocks, // Or another suitable icon like Zap or Cpu
        items: [
            {
                id: 'lumi',
                name: 'Lumi',
                description: 'Dimensionamento Fotovoltaico (App Externo)',
                href: '/apps/lumi', // Link para a view de iframe interno
                coverImage: '/assets/modules/bg-ops.png', // Temporary placeholder
                icon: Blocks, // We can import a Sun or Zap icon if available
                accentColor: '#f59e0b' // Amarelo/Laranja para Solar
            }
        ]
    },
    {
        id: 'education',
        title: 'Educação & Cultura',
        description: 'Plataformas de treinamento e capacitação de talentos.',
        icon: BookOpen,
        items: [
            {
                id: 'academy',
                name: 'Portal Academy',
                description: 'Treinamento e Comunidade',
                href: '/academy',
                coverImage: '/assets/modules/bg-academy.png',
                icon: GraduationCap,
                accentColor: '#0d9488'
            }
        ]
    }
];

export function AppSwitcher({ onLogout }: { onLogout: () => void }) {

    const getRedirectUrl = (modId: string, path: string) => {
        let targetBase = import.meta.env.VITE_ERP_URL || "http://localhost:5173"; // ERP 
        
        if (modId === 'lumi') targetBase = import.meta.env.VITE_LUMI_URL || "http://localhost:5174"; // Lumi
        if (modId === 'academy') targetBase = import.meta.env.VITE_ACADEMY_URL || "http://localhost:5176"; // Academy

        // 🛡️ B2P/SSO Phase 13: O AuthBridge via Cookie dispensa tokens na URL
        // A segurança está delegada ao Secure HttpOnly Cookie lido pelo servidor
        return `${targetBase}${path}`;
    };

    return (
        <div className="min-h-screen bg-[#050510] relative flex flex-col items-center overflow-x-hidden overflow-y-auto font-sans selection:bg-purple-500/30 pb-12">
            {/* Ambient Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none fixed">
                <div className="absolute top-[0%] left-[-10%] w-[40rem] h-[40rem] bg-purple-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[0%] right-[-10%] w-[50rem] h-[50rem] bg-blue-600/10 rounded-full blur-[150px]" />
            </div>

            {/* Admin Settings Button */}
            <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-50">
                <Link to="/admin" className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-400/30 rounded-full text-indigo-300 hover:text-indigo-200 transition-all backdrop-blur-md shadow-lg shadow-indigo-500/10">
                    <Settings size={16} className="animate-[spin_6s_linear_infinite] hover:animate-none" />
                    <span className="text-xs font-semibold tracking-wide uppercase">Configurações Base</span>
                </Link>
            </div>

            {/* Main Content */}
            <div className="w-full max-w-6xl z-10 flex flex-col items-center px-4 sm:px-6 py-12 md:py-20 lg:py-24">
                {/* Header Section */}
                <div className="text-center mb-12 md:mb-16 space-y-4">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 tracking-tight leading-tight drop-shadow-sm">
                        Enterprise Portal
                    </h1>
                    <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto font-light">
                        Selecione a área de operação ou aplicativo para acessar as ferramentas de gestão corporativa.
                    </p>
                </div>

                {/* Modules Groups */}
                <div className="w-full space-y-16 md:space-y-20">
                    {appGroups.map((group) => (
                        <div key={group.id} className="w-full flex flex-col">
                            {/* Group Header */}
                            <div className="mb-6 flex flex-col items-start border-b border-white/5 pb-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-slate-300 shadow-inner">
                                        <group.icon size={20} strokeWidth={1.5} />
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{group.title}</h2>
                                </div>
                                <p className="text-sm md:text-base text-slate-400 font-light ml-[52px]">{group.description}</p>
                            </div>

                            {/* Cards Grid */}
                            <div className={`grid gap-4 sm:gap-5 w-full ${
                                group.id === 'core' 
                                    ? 'grid-cols-1 md:grid-cols-3' 
                                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                            }`}>
                                {group.items.map((mod) => (
                                    <a key={mod.id} href={getRedirectUrl(mod.id, mod.href)} className="group outline-none block h-full">
                                        <Card className={`relative overflow-hidden bg-[#0a0a16]/80 border border-white/10 hover:border-white/20 backdrop-blur-xl transition-all duration-500 rounded-2xl sm:rounded-3xl shadow-xl hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] flex flex-col text-left p-0 w-full h-full ${
                                            group.id === 'core' 
                                                ? 'aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3]' 
                                                : 'aspect-[16/9] sm:aspect-[16/10]'
                                        }`}>
                                            {/* Cover Image Background */}
                                            <div className="absolute inset-0 z-0 bg-[#0a0a16]">
                                                {mod.coverImage && (
                                                    <img
                                                        src={mod.coverImage}
                                                        alt={mod.name}
                                                        loading="lazy"
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out opacity-40 group-hover:opacity-70 mix-blend-screen"
                                                    />
                                                )}
                                                {/* Gradient overlay for contrast */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-[#050510]/80 to-[#050510]/10 pointer-events-none" />
                                            </div>

                                            {/* Content anchored to bottom */}
                                            <div className="relative z-10 p-4 sm:p-5 md:p-6 flex flex-col h-full w-full justify-end items-start">
                                                <div
                                                    className={`rounded-xl sm:rounded-2xl flex items-center justify-center bg-white/10 border border-white/10 shadow-lg backdrop-blur-md mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-500 ${
                                                        group.id === 'core' ? 'w-10 h-10 sm:w-12 sm:h-12' : 'w-8 h-8 sm:w-10 sm:h-10'
                                                    }`}
                                                    style={{ color: mod.accentColor }}
                                                >
                                                    <mod.icon strokeWidth={1.5} className={group.id === 'core' ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-4 h-4 sm:w-5 sm:h-5'} />
                                                </div>
                                                <h3 className={`font-bold text-white mb-1 tracking-tight drop-shadow-md leading-tight ${
                                                    group.id === 'core' ? 'text-lg sm:text-xl md:text-2xl' : 'text-base sm:text-lg md:text-xl'
                                                }`}>
                                                    {mod.name}
                                                </h3>
                                                <p className={`text-slate-400 font-light drop-shadow line-clamp-2 ${
                                                    group.id === 'core' ? 'text-xs sm:text-sm' : 'text-[11px] sm:text-xs'
                                                }`}>
                                                    {mod.description}
                                                </p>
                                            </div>

                                            {/* Bottom indicator line */}
                                            <div className="absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-700 ease-out opacity-90 z-20" style={{ backgroundColor: mod.accentColor }} />
                                            
                                            {/* Subtle top glow */}
                                            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                        </Card>
                                    </a>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-16 md:mt-24 pb-8">
                    <button
                        onClick={onLogout}
                        className="group flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-all duration-300"
                    >
                        <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium tracking-wide text-xs sm:text-sm">Encerrar Sessão Segura</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

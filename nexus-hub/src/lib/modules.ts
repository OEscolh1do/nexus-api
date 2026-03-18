import { Briefcase, HardHat, GraduationCap, LayoutDashboard, Blocks, Globe, BookOpen } from "lucide-react";

export const appGroups = [
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

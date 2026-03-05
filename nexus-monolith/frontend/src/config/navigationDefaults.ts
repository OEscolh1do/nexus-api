export const DEFAULT_OPS_NAV = [
    {
      title: "Planejamento & Estratégia",
      items: [
        { path: "/ops/cockpit", label: "Cockpit Projetos", icon: "HardHat", order: 1 },
        { path: "/ops/strategy", label: "Estratégia", icon: "Target", order: 2 },
        { path: "/ops/portfolio", label: "Portfólio", icon: "Briefcase", order: 3 },
      ]
    },
    {
      title: "Execução Tática",
      items: [
        { path: "/ops/gantt", label: "Cronograma Mestre", icon: "CalendarRange", order: 1 },
        { path: "/ops/kanban", label: "Kanban", icon: "Workflow", order: 2 },
        { path: "/ops/reviews", label: "Aprovações", icon: "ClipboardCheck", order: 3 },
      ]
    },
    {
      title: "Inteligência",
      items: [
        { path: "/ops/map", label: "Mapa Operacional", icon: "Map", order: 1 },
        { path: "/ops/issues", label: "Gargalos", icon: "AlertTriangle", order: 2 },
      ]
    }
];

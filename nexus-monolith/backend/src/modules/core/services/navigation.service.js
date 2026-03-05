const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// 🔒 HARDCODED DEFAULTS (Safety Net)
// Used if DB is empty for a tenant and no custom config exists.
const DEFAULT_NAV_CONFIG = {
  OPS: [
    {
      title: "Planejamento & Estratégia",
      items: [
        { path: "/ops/cockpit", label: "Cockpit Projetos", icon: "HardHat" },
        { path: "/ops/strategy", label: "Estratégia", icon: "Target" },
        { path: "/ops/portfolio", label: "Portfólio", icon: "Briefcase" },
      ]
    },
    {
      title: "Execução Tática",
      items: [
        { path: "/ops/gantt", label: "Cronograma Mestre", icon: "CalendarRange" },
        { path: "/ops/kanban", label: "Kanban", icon: "Workflow" },
        { path: "/ops/reviews", label: "Aprovações", icon: "ClipboardCheck" },
      ]
    },
    {
      title: "Inteligência",
      items: [
        { path: "/ops/map", label: "Mapa Operacional", icon: "Map" },
        { path: "/ops/issues", label: "Gargalos", icon: "AlertTriangle" },
      ]
    }
  ],
  COMMERCIAL: [
      {
          title: "Vendas",
          items: [
              { path: "/commercial/pipeline", label: "Pipeline", icon: "Kanban" },
              { path: "/commercial/leads", label: "Base de Leads", icon: "Users" },
          ]
      }
  ],
  // Add other modules defaults here as needed
};

class NavigationService {
  /**
   * Retrieves navigation for a specific module and tenant.
   * Logic:
   * 1. Check DB for custom groups for this tenant + module.
   * 2. If records exist, return them (ordered).
   * 3. If NO records exist, return the HARDCODED DEFAULT for that module.
   * 
   * @param {string} module - The module code (OPS, COMMERCIAL, etc.)
   * @param {string} tenantId - The OrgUnit ID treating as Tenant
   */
  async getNavigation(module, tenantId) {
    if (!tenantId) throw new Error("Tenant ID is required for navigation resolution.");

    // 1. Fetch from DB
    const customGroups = await prisma.navigationGroup.findMany({
      where: {
        orgUnitId: tenantId,
        module: module,
        isVisible: true
      },
      include: {
        items: {
          where: { isVisible: true },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    });

    // 2. Check existence
    if (customGroups && customGroups.length > 0) {
      return customGroups.map(g => ({
        id: g.id,
        title: g.title,
        order: g.order,
        items: g.items.map(i => ({
            id: i.id,
            label: i.label,
            path: i.path,
            icon: i.icon,
            order: i.order,
            requiredRoles: i.requiredRoles
        }))
      }));
    }

    // 3. Fallback to Default
    console.log(`[NavigationService] No custom nav found for ${module} (Tenant: ${tenantId}). Returning default.`);
    return DEFAULT_NAV_CONFIG[module] || [];
  }

  /**
   * FULL OVERWRITE of navigation for a module.
   * Transactional: Deletes old structure, creates new one.
   */
  async saveNavigation(module, tenantId, groupsData) {
     return await prisma.$transaction(async (tx) => {
        // 1. Delete existing for this module/tenant
        await tx.navigationGroup.deleteMany({
            where: {
                orgUnitId: tenantId,
                module: module
            }
        });

        // 2. Create new structure
        // We iterate because Prisma createMany doesn't support nested relations easily in all versions/connectors
        // and we want to ensure relation integrity.
        for (const [gIndex, group] of groupsData.entries()) {
            await tx.navigationGroup.create({
                data: {
                    orgUnitId: tenantId,
                    module: module,
                    title: group.title,
                    order: gIndex + 1,
                    items: {
                        create: group.items.map((item, iIndex) => ({
                            label: item.label,
                            path: item.path,
                            icon: item.icon,
                            order: iIndex + 1,
                            requiredRoles: item.requiredRoles || []
                        }))
                    }
                }
            });
        }
     });
  }
}

module.exports = new NavigationService();

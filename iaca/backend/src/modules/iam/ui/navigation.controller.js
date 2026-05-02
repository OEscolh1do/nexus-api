const prisma = require('../../../lib/prisma');

/**
 * Navigation Controller
 * Serves the menu structure based on INTERFACE_MAP.md
 * Restored to Static Structure (Nexus 2.0 SQL)
 */
const getNavigation = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user to ensure existence (and potential future dynamic needs)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { orgUnit: true }
    });

    if (!user) return res.status(401).json({ error: "User not found" });

    // Base Menu Structure from INTERFACE_MAP.md
    const menu = [];

    // 1. ESTRATÉGIA & GESTÃO
    menu.push({
      title: "ESTRATÉGIA & GESTÃO",
      items: [
        { label: "Painel Estratégico", view: "dashboard", icon: "LayoutDashboard", params: {}, requiredCapability: "strategy.view" },
        { label: "Gestão de Estratégias", view: "strategies", icon: "Target", params: {}, requiredCapability: "strategy.view" },
        { label: "Gestão de Pessoas", view: "people", icon: "UserCog", params: {}, requiredCapability: "team.view" }
      ]
    });

    // 2. ENGENHARIA & PROJETOS
    menu.push({
      title: "ENGENHARIA & PROJETOS",
      items: [
        { label: "Pipeline de Leads", view: "leads", icon: "Users", params: {}, requiredCapability: "leads.view" },
        { label: "Orçamentos", view: "quotes", icon: "FileText", params: {}, requiredCapability: "projects.view" },
        { label: "Portfólio", view: "projects", icon: "Briefcase", params: {}, requiredCapability: "projects.view" },
        { label: "Cronograma Mestre", view: "gantt", icon: "CalendarRange", params: {}, requiredCapability: "tasks.view" },
        { label: "Fluxo de Trabalho", view: "kanban", icon: "Workflow", params: {}, requiredCapability: "tasks.view" },
        { label: "Cadastrar Projeto", view: "project-logic", icon: "PlusSquare", params: {}, requiredCapability: "projects.create" }
      ]
    });

    // 3. GOVERNANÇA DO SISTEMA (Admin Only / High Level)
    // We check role here strictly for the section presence, although permissions handle items too.
    if (['ADMIN', 'DIRECTOR'].includes(user.role)) {
      menu.push({
        title: "GOVERNANÇA DO SISTEMA",
        items: [
          { label: "Controle de Acesso", view: "org", icon: "ShieldCheck", params: {}, requiredCapability: "users.manage" },
          { label: "Matriz de Permissões", view: "provisioning", icon: "FileKey", params: {}, requiredCapability: "users.manage" },
          { label: "Trilha de Auditoria", view: "audit", icon: "ScrollText", params: {}, requiredCapability: "audit.view" },
          { label: "Integridade de Dados", view: "schema", icon: "DatabaseZap", params: {}, requiredCapability: "users.manage" }
        ]
      });
    }

    res.json({ success: true, data: menu });

  } catch (error) {
    console.error("Nav Error:", error);
    res.status(500).json({ success: false, error: "Failed to build navigation" });
  }
};

module.exports = { getNavigation };

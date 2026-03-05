const NavigationService = require("../services/navigation.service");
const { UpdateNavigationSchema } = require("../schemas/navigation.schemas");

class NavigationController {
  
  // GET /api/v2/navigation/:module
  async getNavigation(req, res) {
    try {
      const { module } = req.params;
      const tenantId = req.user?.orgUnitId; // Assuming 'orgUnitId' on users is the tenant

      if (!tenantId) {
        return res.status(403).json({ success: false, error: "Tenant Context Missing" });
      }

      // Convert module to proper case if needed, or rely on frontend to send correct string
      const moduleKey = module.toUpperCase();

      const navigation = await NavigationService.getNavigation(moduleKey, tenantId);
      
      return res.status(200).json({
        success: true,
        data: navigation
      });

    } catch (error) {
      console.error("[NavigationController] Get Error:", error);
      return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  }

  // POST /api/v2/navigation/:module
  // Requires ADMIN role
  async updateNavigation(req, res) {
    try {
      const { module } = req.params;
      const tenantId = req.user?.orgUnitId;
      const userRole = req.user?.role;

      if (!tenantId) return res.status(403).json({ success: false, error: "Tenant Context Missing" });
      
      if (userRole !== 'ADMIN') {
        return res.status(403).json({ success: false, error: "Unauthorized: Admins only" });
      }

      // Validate Body
      const validation = UpdateNavigationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ success: false, errors: validation.error.errors });
      }

      await NavigationService.saveNavigation(module.toUpperCase(), tenantId, validation.data.groups);

      return res.status(200).json({ success: true, message: "Navigation updated successfully" });

    } catch (error) {
      console.error("[NavigationController] Update Error:", error);
      return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  }
}

module.exports = new NavigationController();

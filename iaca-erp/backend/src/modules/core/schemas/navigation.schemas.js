const { z } = require("zod");

const NavigationItemSchema = z.object({
  label: z.string().min(1, "Label is required"),
  path: z.string().min(1, "Path is required"),
  icon: z.string().min(1, "Icon name is required"), // String reference to Lucide icon
  order: z.number().int().default(0),
  isVisible: z.boolean().default(true),
  requiredRoles: z.array(z.string()).optional()
});

const NavigationGroupSchema = z.object({
  title: z.string().min(1, "Title is required"),
  module: z.enum(["OPS", "COMMERCIAL", "EXECUTIVE", "IAM", "FIN", "BI", "SOLAR", "STRATEGY"]), // Add other modules as needed
  order: z.number().int().default(0),
  isVisible: z.boolean().default(true),
  items: z.array(NavigationItemSchema).optional()
});

const UpdateNavigationSchema = z.object({
  groups: z.array(NavigationGroupSchema)
});

module.exports = {
  NavigationGroupSchema,
  NavigationItemSchema,
  UpdateNavigationSchema
};

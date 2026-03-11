import type { LucideIcon } from "lucide-react";

export interface NavigationItem {
  id?: string;
  label: string;
  path: string;
  icon: string; // The string key from DB
  order: number;
  requiredRoles?: string[];
}

export interface NavigationGroup {
  id?: string;
  title: string;
  items: NavigationItem[];
  order: number;
}

export interface MappedNavigationItem extends Omit<NavigationItem, 'icon'> {
  icon: LucideIcon; // The actual component
}

export interface MappedNavigationGroup extends Omit<NavigationGroup, 'items'> {
  items: MappedNavigationItem[];
}

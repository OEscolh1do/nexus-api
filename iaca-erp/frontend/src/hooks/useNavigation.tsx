import { useState, useEffect } from "react";
import { 
  HardHat, ClipboardCheck, Map as MapIcon, AlertTriangle, 
  CalendarRange, Target, Workflow, Briefcase, 
  Users, DollarSign, PieChart, Shield, Sun, LayoutDashboard,
  type LucideIcon
} from "lucide-react";
import { fetchNavigation } from "../lib/navigation";
import type { MappedNavigationGroup } from "../types/navigation";

// ICON REGISTRY
// Maps string keys from DB to actual React Components.
const ICON_MAP: Record<string, LucideIcon> = {
  HardHat,
  ClipboardCheck,
  Map: MapIcon, // Alias to avoid conflict with JS Map
  AlertTriangle,
  CalendarRange,
  Target,
  Workflow,
  Briefcase,
  Users,
  DollarSign,
  PieChart,
  Shield,
  Sun,
  LayoutDashboard
};

import { DEFAULT_OPS_NAV } from "../config/navigationDefaults";

// ... (imports)

// FALLBACK ICON
const DefaultIcon = Target;

export function useNavigation(moduleName: string) {
  const [groups, setGroups] = useState<MappedNavigationGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setIsLoading(true);
        const data = await fetchNavigation(moduleName);
        
        if (mounted) {
           const mapped: MappedNavigationGroup[] = data.map(group => ({
             ...group,
             items: group.items.map(item => ({
               ...item,
               icon: ICON_MAP[item.icon] || DefaultIcon
             }))
           }));
           setGroups(mapped);
        }
      } catch (err) {
        if (mounted) {
          console.error("Navigation Load Error:", err);
          setError("Failed to load navigation. Using fallback.");
          
          // FALLBACK LOGIC
          const fallbackData = moduleName === 'OPS' ? DEFAULT_OPS_NAV : [];
          const mappedFallback: MappedNavigationGroup[] = fallbackData.map((group, i) => ({
             ...group,
             id: `default-${i}`,
             order: i,
             items: group.items.map(item => ({
               ...item,
               icon: ICON_MAP[item.icon] || DefaultIcon
             }))
           }));
           setGroups(mappedFallback);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    load();

    return () => { mounted = false; };
  }, [moduleName]);

  return { groups, isLoading, error };
}

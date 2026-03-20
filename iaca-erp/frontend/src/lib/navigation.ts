import type { NavigationGroup } from "../types/navigation";

// Fallback if api.ts doesn't export 'api' properly, I will verify content of api.ts momentarily.
// For now, standard fetch implementation.

export async function fetchNavigation(module: string): Promise<NavigationGroup[]> {
  const token = localStorage.getItem("token"); 
  // TODO: Use a proper auth context for token retrieval if available. 
  // Assuming localStorage as per standard simple JWT flows often seen in this project context.
  
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}/api/v2/navigation/${module}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    if (response.status === 404) return []; // Should not happen with backend fallback, but safety.
    throw new Error("Failed to fetch navigation");
  }

  const json = await response.json();
  if (json.success) {
    return json.data;
  }
  return [];
}

export async function updateNavigation(module: string, groups: NavigationGroup[]): Promise<void> {
  const token = localStorage.getItem("token");
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}/api/v2/navigation/${module}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ groups })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update navigation");
  }
}

import { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { useLogto } from '@logto/react';
import { useAuthStore } from '@/stores/authStore';
import Sidebar from './Sidebar';
import Header from './Header';
import ErrorBoundary from './ErrorBoundary';
import Toaster from './Toaster';

/**
 * Keeps the SSO access token (Logto ID token) fresh while the operator is
 * using the app. Logto's SDK refreshes automatically when getIdToken() is
 * called — we just need to push the new value into authStore so api.ts
 * sees it on the next request.
 */
function useSsoTokenRefresher() {
  const { getIdToken, isAuthenticated } = useLogto();
  const updateToken = useAuthStore((s) => s.updateToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);

  useEffect(() => {
    // Only applies to SSO sessions (no local refresh token stored)
    if (!isAuthenticated || refreshToken) return;

    const refresh = async () => {
      try {
        const freshToken = await getIdToken();
        if (freshToken) updateToken(freshToken);
      } catch {
        // Logto session ended — the response interceptor will catch the next 401
      }
    };

    // Refresh immediately on mount, then every 20 minutes (well within the ~1h Logto ID token TTL)
    refresh();
    const id = setInterval(refresh, 20 * 60 * 1000);
    return () => clearInterval(id);
  }, [isAuthenticated, refreshToken, getIdToken, updateToken]);
}

export default function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useSsoTokenRefresher();

  const handleToggleSidebar = useCallback(() => setSidebarCollapsed(prev => !prev), []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={handleToggleSidebar}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      <Toaster />
    </div>
  );
}

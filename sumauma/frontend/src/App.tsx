import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import AdminLayout from '@/components/layout/AdminLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import AccessDeniedPage from '@/pages/AccessDeniedPage';

import UsersPage from '@/pages/UsersPage';
import CatalogPage from '@/pages/CatalogPage';
import AuditPage from '@/pages/AuditPage';
import SystemPage from '@/pages/SystemPage';
import OperatorsPage from '@/pages/OperatorsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessDenied = useAuthStore((s) => s.accessDenied);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (accessDenied) return <Navigate to="/access-denied" replace />;

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />

      {/* Protected */}
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/audit" element={<AuditPage />} />
        <Route path="/system" element={<SystemPage />} />
        <Route path="/operators" element={<OperatorsPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

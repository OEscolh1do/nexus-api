import { useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { LoginForm } from "@/modules/iam/ui/LoginForm"
import { AppSwitcher } from "@/views/AppSwitcher"
import { AdminLayout } from "@/modules/admin/ui/AdminLayout"
import TenantSettings from "@/modules/admin/ui/TenantSettings"
import NavigationSettings from "@/modules/admin/ui/NavigationSettings"

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem("token");
    return !!token;
  });

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  }

  // O Hub Central Redireciona para o AppSwitcher se logado.
  // Se não logado, joga para a raiz de Login.

  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN ROOT */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? 
            <Navigate to="/hub" replace /> : 
            <LoginForm onLoginSuccess={() => setIsAuthenticated(true)} />
          } 
        />

        {/* HUB SWITCHER */}
        <Route 
          path="/hub" 
          element={
            isAuthenticated ? 
            <AppSwitcher onLogout={logout} /> : 
            <Navigate to="/" replace />
          } 
        />

        {/* ADMIN ROUTES */}
        <Route 
          path="/admin" 
          element={ isAuthenticated ? <AdminLayout /> : <Navigate to="/" replace /> } 
        >
            <Route index element={<Navigate to="tenant" replace />} />
            <Route path="tenant" element={<TenantSettings />} />
            <Route path="navigation" element={<NavigationSettings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

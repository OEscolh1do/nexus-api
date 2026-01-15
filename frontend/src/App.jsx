// /frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import ProtectedRoute from './components/ProtectedRoute'; 
import LoginPage from './features/authentication/components/LoginPage'; 

// Importa suas páginas
import KanbanBoard from './features/kanban-board/components/KanbanBoard';
import ClientList from './features/client-list/components/ClientList';
// import FotonSettingsPage - REMOVIDO
import RegisterUserPage from './features/admin/components/RegisterUserPage';
// import CatalogPage - REMOVIDO
import DashboardPage from './features/dashboard/components/DashboardPage';
import ProfilePage from './features/profile/components/ProfilePage';

function App() {
  return (
    <BrowserRouter basename="/nexus">
      <Routes>
        {/* ROTA PÚBLICA */}
        <Route path="/login" element={<LoginPage />} />

        {/* LAYOUT PRINCIPAL (Requer apenas estar logado inicialmente) */}
        <Route path="/" element={<MainLayout />}>
          
          {/* Redirecionamento padrão */}
          <Route index element={<Navigate to="/kanban" replace />} />

          {/* --- ROTAS COMERCIAIS (Acesso: SALES, MANAGER, ADMIN) --- */}
          <Route path="kanban" element={
            <ProtectedRoute allowedRoles={['SALES', 'MANAGER', 'ADMIN']}>
              <KanbanBoard />
            </ProtectedRoute>
          } />
          
          <Route path="clients" element={
            <ProtectedRoute allowedRoles={['SALES', 'MANAGER', 'ADMIN']}>
              <ClientList />
            </ProtectedRoute>
          } />

          <Route path="profile" element={
            <ProtectedRoute allowedRoles={['SALES', 'MANAGER', 'ADMIN']}>
              <ProfilePage />
            </ProtectedRoute>
          } />

          {/* --- ROTAS ADMINISTRATIVAS (Acesso: Apenas ADMIN) --- */}
          <Route path="dashboard" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <DashboardPage />
            </ProtectedRoute>
          } />

          {/* Rotas /foton e /catalog REMOVIDAS */}

          <Route path="admin/users" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <RegisterUserPage />
            </ProtectedRoute>
          } />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
// /frontend/src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)();

  // 1. Se não estiver logado, manda pro login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Se a rota exige cargos específicos e o usuário não tem permissão
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redireciona para uma área segura comum a todos (Kanban)
    return <Navigate to="/kanban" replace />;
  }

  // 3. Tudo certo, pode entrar
  return children;
};

export default ProtectedRoute;
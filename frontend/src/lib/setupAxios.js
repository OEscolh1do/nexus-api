import api from './axios';
import useAuthStore from '../store/useAuthStore';

const setupAxiosInterceptors = () => {
    api.interceptors.response.use(
        (response) => response,
        async (error) => {
            if (error.response?.status === 401) {
                // Se receber 401 (Não autorizado), força logout no frontend
                // Isso evita que o usuário fique preso em um estado de "login zumbi"
                // onde o front acha que está logado (state) mas o back diz que não (cookie).
                const { isAuthenticated, logout } = useAuthStore.getState();
                
                if (isAuthenticated) {
                    console.warn('[Axios] 401 Detectado. Forçando logout...');
                    await logout(); // Limpa estado e redireciona
                    window.location.href = '/nexus/login'; // Redirecionamento forçado para garantir
                }
            }
            return Promise.reject(error);
        }
    );
};

export default setupAxiosInterceptors;

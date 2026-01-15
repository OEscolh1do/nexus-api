// /frontend/src/store/useAuthStore.js

// A CORREÇÃO ESTÁ AQUI:
// Antes: import create from 'zustand';
// Agora: import { create } from 'zustand';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Esta store salva o token e o usuário no localStorage
// para que você continue logado mesmo se atualizar a página
const useAuthStore = create(
  persist(
    (set, get) => ({ // Adicionado 'get' para a função isAuthenticated
      token: null,
      user: null,
      
      // Ação de Login: Salva o token e o usuário
      login: (token, user) => set({ token, user }),
      
      // Ação de Logout: Limpa tudo
      logout: () => set({ token: null, user: null }),
      
      // Verifica se está autenticado
      isAuthenticated: () => {
        const { token } = get(); // Usa 'get' para ler o estado atual
        return !!token;
      },
    }),
    {
      name: 'auth-storage', // Nome da chave no localStorage
    }
  )
);

export default useAuthStore;
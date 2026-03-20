import { createContext, useContext } from 'react';

// Stub for Supabase User
export interface User { id: string; email?: string; [key: string]: any; }

export type AuthContextType = {
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

import { create } from 'zustand';

export type UserRole = 'ADMIN' | 'ENGINEER' | 'SALES' | 'OPERATOR';

export interface UserIdentity {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  initials: string;
  color: string;
}

interface IdentityState {
  profile: UserIdentity | null;
  setProfile: (data: UserIdentity) => void;
  clearProfile: () => void;
}

/**
 * Utilitário para extrair iniciais do nome ou email
 */
export function getInitials(name?: string | null, email?: string | null): string {
  const src = name || email || '?';
  return src
    .split(/[\s@._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

/**
 * Utilitário para gerar cor de avatar baseada em hash
 */
export function getAvatarColor(seed?: string | null): string {
  const colors = [
    'bg-indigo-600', 
    'bg-violet-600', 
    'bg-teal-600',
    'bg-sky-600',    
    'bg-amber-600',  
    'bg-emerald-600',
    'bg-rose-600',
    'bg-slate-600'
  ];
  if (!seed) return colors[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export const useIdentityStore = create<IdentityState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  clearProfile: () => set({ profile: null }),
}));

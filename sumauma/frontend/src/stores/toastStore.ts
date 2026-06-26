import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  /** Duration in ms; 0 = never auto-dismiss */
  duration: number;
}

interface ToastState {
  toasts: Toast[];
  add: (opts: Omit<Toast, 'id'>) => void;
  remove: (id: string) => void;
}

let _seq = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  add: (opts) => {
    const id = `toast-${Date.now()}-${++_seq}`;
    set((s) => ({ toasts: [...s.toasts, { id, ...opts }] }));
    if (opts.duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, opts.duration);
    }
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// ─── Convenience API (callable outside React components) ─────────────────────
export const toast = {
  success: (message: string, duration = 3500) =>
    useToastStore.getState().add({ type: 'success', message, duration }),
  error: (message: string, duration = 5000) =>
    useToastStore.getState().add({ type: 'error', message, duration }),
  info: (message: string, duration = 3500) =>
    useToastStore.getState().add({ type: 'info', message, duration }),
  warning: (message: string, duration = 4000) =>
    useToastStore.getState().add({ type: 'warning', message, duration }),
};

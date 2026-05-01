import { useState, useRef, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmUserBlockModalProps {
  username: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmUserBlockModal({
  username,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmUserBlockModalProps) {
  const [typed, setTyped] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isMatch = typed.trim() === username.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="block-modal-title"
    >
      <div className="relative w-full max-w-md rounded-sm border border-red-500/30 bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={onCancel}
          className="absolute right-3 top-3 rounded p-1 text-slate-500 hover:text-slate-200 transition-colors"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-red-500/30 bg-red-500/10">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h2 id="block-modal-title" className="text-sm font-semibold text-slate-100">
              Bloquear Usuário
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Esta ação revogará imediatamente o acesso do usuário à plataforma.
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-sm border border-amber-500/20 bg-amber-500/5 p-3">
          <p className="text-xs text-amber-300">
            ⚠ O usuário <strong>{username}</strong> não poderá mais realizar login.
            Sessões ativas serão invalidadas (se suportado pelo Iaçã).
          </p>
        </div>

        <label className="block text-xs text-slate-400 mb-1.5">
          Digite o username do usuário para confirmar:
        </label>
        <input
          ref={inputRef}
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={username}
          className="w-full rounded-sm border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/30"
        />
        {typed.length > 0 && !isMatch && (
          <p className="mt-1 text-[11px] text-red-400">Username não confere</p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-sm border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-600 hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!isMatch || loading}
            className="rounded-sm border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? 'Bloqueando…' : 'Confirmar Bloqueio'}
          </button>
        </div>
      </div>
    </div>
  );
}

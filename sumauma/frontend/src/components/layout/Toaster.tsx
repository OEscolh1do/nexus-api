import { X, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { useToastStore, type Toast } from '@/stores/toastStore';

const CONFIG: Record<Toast['type'], { icon: React.ElementType; classes: string }> = {
  success: {
    icon: CheckCircle2,
    classes: 'border-emerald-500/30 bg-emerald-950/90 text-emerald-300',
  },
  error: {
    icon: XCircle,
    classes: 'border-red-500/30 bg-red-950/90 text-red-300',
  },
  warning: {
    icon: AlertTriangle,
    classes: 'border-amber-500/30 bg-amber-950/90 text-amber-300',
  },
  info: {
    icon: Info,
    classes: 'border-sky-500/30 bg-sky-950/90 text-sky-300',
  },
};

function ToastItem({ toast }: { toast: Toast }) {
  const remove = useToastStore((s) => s.remove);
  const { icon: Icon, classes } = CONFIG[toast.type];

  return (
    <div
      className={`flex items-start gap-2.5 rounded-sm border px-3.5 py-3 shadow-2xl backdrop-blur-sm w-80 animate-in slide-in-from-right-4 fade-in duration-200 ${classes}`}
    >
      <Icon className="h-4 w-4 flex-shrink-0 mt-px" />
      <p className="flex-1 text-[11px] font-semibold leading-snug">{toast.message}</p>
      <button
        onClick={() => remove(toast.id)}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Fechar"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/** Mount once in AdminLayout — renders toasts in a fixed corner overlay. */
export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 pointer-events-auto">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}

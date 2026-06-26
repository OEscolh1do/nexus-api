import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Custom fallback UI — defaults to the built-in error card. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Class-based error boundary.
 *
 * Catches render/lifecycle exceptions in the subtree and shows a recovery UI
 * instead of crashing the whole page. Place it around route `<Outlet />` to
 * isolate page crashes, or around individual heavy components.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught render error:', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex h-full min-h-[200px] w-full items-center justify-center">
          <div className="flex max-w-sm flex-col items-center gap-4 rounded-sm border border-red-500/20 bg-red-500/5 p-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-red-500/20 bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-200">Algo deu errado</p>
              <p className="text-xs text-slate-500">
                {this.state.error?.message ?? 'Erro inesperado ao renderizar esta seção.'}
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="flex items-center gap-1.5 rounded-sm border border-slate-700 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 transition-colors hover:border-slate-500 hover:text-slate-200"
            >
              <RefreshCw className="h-3 w-3" />
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

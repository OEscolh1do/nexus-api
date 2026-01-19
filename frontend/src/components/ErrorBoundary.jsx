import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // Aqui você poderia enviar para um serviço de log (Sentry, etc.)
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#120B19] flex items-center justify-center p-4 font-sans text-white">
          <div className="max-w-md w-full bg-[#1A1025] border border-[#3E2C52] rounded-2xl p-8 shadow-2xl text-center">
            
            <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
              <AlertCircle size={32} className="text-red-500" />
            </div>

            <h1 className="text-2xl font-bold mb-2">Ops! Algo deu errado.</h1>
            <p className="text-[#BCA6D1] text-sm mb-6">
              Encontramos um erro inesperado. Não se preocupe, seus dados estão seguros.
            </p>

            {/* Detalhes Técnicos (Ocultar em Produção se desejar, mas útil em Dev) */}
            <div className="text-left bg-black/30 rounded-lg p-4 mb-6 overflow-auto max-h-32 border border-white/5">
                <p className="text-[10px] font-mono text-red-400 break-words">
                    {this.state.error?.toString()}
                </p>
            </div>

            <button 
              onClick={this.handleReload}
              className="w-full bg-[#05CD46] hover:bg-[#04b03c] text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <RefreshCw size={18} />
              Recarregar Aplicação
            </button>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

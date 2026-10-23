import React, { Component, ErrorInfo, ReactNode } from 'react';
import { SanLuisLogo } from './SanLuisLogo';
import { Shield, RefreshCw, AlertTriangle, Database } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleResetAndReload = () => {
    try {
      // Clear potentially corrupted session/cache but preserve custom offline backups
      localStorage.removeItem('san_luis_current_user_v3');
      localStorage.removeItem('san_luis_active_category_v2');
    } catch {
      // ignore
    }
    window.location.href = window.location.origin + window.location.pathname;
  };

  private handleHardReset = () => {
    if (confirm('¿Deseas restablecer los datos locales por defecto del club?\nEsto volverá a cargar las 67 fichas oficiales de la cantera.')) {
      try {
        localStorage.clear();
      } catch {
        // ignore
      }
      window.location.href = window.location.origin + window.location.pathname;
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 font-sans">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-4">
            <div className="flex justify-center">
              <SanLuisLogo className="w-20 h-24 drop-shadow-lg" />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                San Luis de Quillota
              </h1>
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mt-0.5">
                Plataforma de Fútbol Formativo y Base de Datos
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-left text-xs text-amber-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-white">Se detectó una discrepancia al inicializar la vista</p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Para evitar una pantalla en blanco, el sistema de protección de San Luis ha aislado el error. Puedes reanudar inmediatamente la aplicación:
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-left font-mono text-[11px] text-rose-400 max-h-24 overflow-y-auto">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleResetAndReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-transform hover:scale-105 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reanudar Aplicación</span>
              </button>

              <button
                type="button"
                onClick={this.handleHardReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Restablecer Plantilla Oficial</span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-500/50" />
              <span>San Luis de Quillota S.A.D.P. • Temporada 2026</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

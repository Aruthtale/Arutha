import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-rpg-black flex items-center justify-center p-6 text-white font-sans">
          <div className="max-w-md w-full glass-panel p-8 border border-red-500/30 relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/10 blur-[80px] rounded-full group-hover:bg-red-500/20 transition-colors duration-700" />
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                <ShieldAlert className="w-10 h-10 text-red-500" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-black tracking-tighter text-red-500 uppercase">
                  Koneksi Terputus ke Server Kerajaan
                </h1>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Terjadi gangguan sihir pada aliran data Arutha. Jangan panik, pahlawan! Petualanganmu aman.
                </p>
                {this.state.error && (
                  <div className="mt-4 p-3 bg-black/50 border border-white/5 rounded text-[10px] font-mono text-gray-500 text-left overflow-auto max-h-24">
                    Error Code: {this.state.error.message}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                <button
                  onClick={this.handleReload}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all active:scale-95 text-sm font-bold"
                >
                  <RefreshCw className="w-4 h-4" />
                  COBA LAGI
                </button>
                <button
                  onClick={this.handleReset}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl transition-all hover:bg-red-600 active:scale-95 text-sm font-bold shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                >
                  <Home className="w-4 h-4" />
                  BERANDA
                </button>
              </div>
            </div>

            {/* Decorative Corner */}
            <div className="absolute top-0 right-0 p-2 opacity-20">
              <div className="w-8 h-8 border-t-2 border-r-2 border-red-500" />
            </div>
            <div className="absolute bottom-0 left-0 p-2 opacity-20">
              <div className="w-8 h-8 border-b-2 border-l-2 border-red-500" />
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

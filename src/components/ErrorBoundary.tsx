import React, { ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ifu listener] Uncaught React render error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070707] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-neutral-900/90 border border-neutral-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl space-y-6">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold font-display tracking-tight text-white">
                Something interrupted playback
              </h2>
              <p className="text-xs text-neutral-400 font-mono">
                {this.state.error?.message || 'A render error occurred.'}
              </p>
            </div>

            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center space-x-2 py-3 px-5 rounded-xl bg-[#E2FF66] hover:bg-[#d6f552] text-black font-semibold text-sm transition-transform active:scale-95 shadow-lg shadow-[#E2FF66]/20 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Player</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

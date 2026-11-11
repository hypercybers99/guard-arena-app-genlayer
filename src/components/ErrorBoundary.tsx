import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  public handleRetry = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="max-w-2xl mx-auto my-8 p-6 bg-arena-surface border border-arena-border rounded-xl shadow-lg space-y-4 text-center"
        >
          <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-white tracking-tight">
              An unexpected render error occurred
            </h2>
            <p className="text-xs text-arena-muted max-w-md mx-auto leading-relaxed">
              {this.props.fallbackMessage ||
                'The component encountered an error while rendering. Contract state and your wallet keys remain safe.'}
            </p>
          </div>

          {this.state.error && (
            <div className="text-left bg-arena-bg/80 border border-arena-border/60 rounded-lg p-3 text-xs font-mono text-red-300 max-h-32 overflow-y-auto">
              {this.state.error.message || String(this.state.error)}
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-arena-primary text-white hover:bg-arena-primaryHover transition-colors focus-visible:ring-2 focus-visible:ring-arena-accent focus:outline-none"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Component</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

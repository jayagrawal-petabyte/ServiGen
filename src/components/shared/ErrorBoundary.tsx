import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  resetKey?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}


export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[servigen:render]', error, info.componentStack);
  }

  componentDidUpdate(prev: ErrorBoundaryProps): void {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  private handleReload = () => window.location.reload();

  private handleDismiss = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-lg rounded-xl border border-rose-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-800">This screen hit an error</h2>
          <p className="mt-2 text-[13px] text-slate-600">
            The rest of the app is still working. You can go back, or reload to try again.
          </p>
          <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-slate-50 p-3 text-[11px] text-rose-700 whitespace-pre-wrap break-words">
            {error.message}
          </pre>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={this.handleReload}
              className="rounded-lg bg-[#C96F55] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#d2583a]"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={this.handleDismiss}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;

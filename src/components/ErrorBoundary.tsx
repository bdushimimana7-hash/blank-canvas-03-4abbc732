import { Component, ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center px-5">
          <div className="bg-white border border-[#DDD9D0] rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[#0E0E0C] mb-2">Something went wrong</h2>
            <p className="text-sm text-[#7A7A72] mb-5">
              An unexpected error occurred. Please refresh the page. If it keeps happening, contact support.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full h-10 bg-[#0F6E56] text-white rounded-xl text-sm font-medium hover:bg-[#0a5a44] transition-colors">
              Refresh page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  error: Error | null;
}

class RootErrorBoundary extends React.Component<
  {children: React.ReactNode},
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {error: null};

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {error};
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#5a7edc] p-6 font-[Tahoma,sans-serif]">
          <div className="max-w-[480px] w-full bg-[#ece9d8] border-2 border-[#0054e3] rounded-[6px] shadow-xl overflow-hidden">
            <div className="bg-[#0054e3] text-white font-bold text-[13px] px-3 py-1.5">
              Windows XP Desktop Recovery
            </div>
            <div className="p-4 text-[12px] text-[#111111] space-y-2.5">
              <p className="font-bold">An unexpected error occurred while starting the desktop.</p>
              <p className="text-[11px] bg-white border border-[#919b9c] p-2 break-words">
                {this.state.error.message}
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="xp-button xp-button-default"
              >
                Reload Desktop
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);

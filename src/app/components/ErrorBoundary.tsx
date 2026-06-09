/**
 * Error Boundary Component
 * Catches React errors and provides fallback UI
 */
import type { ReactNode, ErrorInfo } from 'react';
import { Component } from 'react';
import { errorMonitor } from '../utils/monitoring';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to monitoring service
    errorMonitor.logError({
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack ?? undefined,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0] px-6">
          <div className="max-w-2xl w-full bg-white p-12 shadow-sm">
            <div className="mb-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1
                className="text-4xl lg:text-5xl mb-4"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Something Went Wrong
              </h1>
              <p className="text-xl text-black/70 leading-relaxed mb-8">
                We apologize for the inconvenience. An unexpected error occurred while
                processing your request.
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="mb-8 p-6 bg-red-50 border-l-4 border-red-500">
                <h2 className="text-lg font-bold text-red-900 mb-3">
                  Error Details (Development Only)
                </h2>
                <div className="space-y-2 text-sm">
                  <p className="text-red-800 font-mono">
                    <strong>Message:</strong> {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <details className="text-red-700">
                      <summary className="cursor-pointer font-semibold">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <details className="text-red-700">
                      <summary className="cursor-pointer font-semibold">
                        Component Stack
                      </summary>
                      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-4">
              <button
                onClick={this.handleReset}
                className="px-8 py-3 bg-black text-white hover:bg-[#d4a574] transition-colors"
              >
                Try Again
              </button>
              <a
                href="/"
                className="px-8 py-3 border-2 border-black text-black hover:bg-black hover:text-white transition-colors inline-block"
              >
                Go Home
              </a>
              <a
                href="/contact"
                className="px-8 py-3 text-black hover:text-[#d4a574] transition-colors inline-flex items-center gap-2"
              >
                Report Issue
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

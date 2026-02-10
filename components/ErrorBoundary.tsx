"use client";

import { Component, ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[50vh] px-4">
          <Card className="max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 bg-danger-bg rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="text-danger" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-leather-accent mb-2">
              Oops! Something went wrong
            </h2>
            <p className="text-leather-500 mb-6">
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                className="bg-leather-pop hover:bg-leather-popHover text-leather-900"
              >
                <RefreshCw size={16} className="mr-2" />
                Try Again
              </Button>
              <Button
                onClick={() => window.location.href = "/dashboard"}
                variant="secondary"
              >
                Go to Dashboard
              </Button>
            </div>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-leather-500 cursor-pointer hover:text-leather-accent">
                  Error details (development only)
                </summary>
                <pre className="mt-2 p-4 bg-leather-900 rounded-lg text-xs text-red-400 overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl bg-surface-variant p-6 text-center">
          <span className="material-symbols-outlined mb-3 text-4xl text-error">
            error
          </span>
          <h2 className="mb-2 text-lg font-semibold text-on-surface">
            Something went wrong
          </h2>
          <p className="mb-4 max-w-md text-sm text-on-surface-variant">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={this.handleRetry}
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-on-primary transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

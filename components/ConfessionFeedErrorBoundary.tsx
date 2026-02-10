"use client";

import { ReactNode } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface ConfessionFeedErrorBoundaryProps {
  children: ReactNode;
}

function ConfessionFeedFallback() {
  return (
    <div className="py-12 text-center">
      <div className="w-16 h-16 bg-danger-bg rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-leather-accent mb-2">Unable to load messages</h3>
      <p className="text-sm text-leather-500 mb-4">Something went wrong while loading your messages.</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-leather-700 hover:bg-leather-600 text-leather-accent rounded-lg transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}

export function ConfessionFeedErrorBoundary({ children }: ConfessionFeedErrorBoundaryProps) {
  return <ErrorBoundary fallback={<ConfessionFeedFallback />}>{children}</ErrorBoundary>;
}

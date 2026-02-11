"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="w-24 h-24 bg-red-900/20 text-red-400 rounded-full flex items-center justify-center text-4xl shadow-xl border border-red-900/50">
        💥
      </div>
      <h2 className="text-3xl font-bold text-red-400">Something went wrong!</h2>
      <p className="text-leather-500 max-w-md">
        An unexpected error occurred. We have been notified (mentally).
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()} variant="secondary">
          Try again
        </Button>
        <Button 
          onClick={() => window.location.href = "/dashboard"} 
          className="bg-leather-pop text-leather-900 hover:bg-leather-popHover"
        >
          Go Dashboard
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6">
      <div className="w-20 h-20 bg-red-900/20 text-red-400 rounded-full flex items-center justify-center text-3xl border border-red-900/50">
        📬
      </div>
      <h2 className="text-2xl font-bold text-red-400">Couldn't load your inbox</h2>
      <p className="text-leather-500 max-w-sm">
        Something went wrong while fetching your messages. Your data is safe.
      </p>
      <Button onClick={() => reset()} variant="secondary">
        Try again
      </Button>
    </div>
  );
}

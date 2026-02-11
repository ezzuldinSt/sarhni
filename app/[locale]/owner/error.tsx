"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function OwnerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Owner error:", error);
  }, [error]);

  return (
    <div className="max-w-4xl mx-auto py-10 flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6">
      <div className="w-20 h-20 bg-yellow-900/20 text-yellow-400 rounded-full flex items-center justify-center text-3xl border border-yellow-900/50">
        👑
      </div>
      <h2 className="text-2xl font-bold text-yellow-400">Command center offline</h2>
      <p className="text-leather-500 max-w-sm">
        Failed to load the owner command center. Please try again.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()} variant="secondary">
          Try again
        </Button>
        <Link href="/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

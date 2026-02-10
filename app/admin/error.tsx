"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="max-w-4xl mx-auto py-10 flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6">
      <div className="w-20 h-20 bg-red-900/20 text-red-400 rounded-full flex items-center justify-center text-3xl border border-red-900/50">
        🛡️
      </div>
      <h2 className="text-2xl font-bold text-red-400">Admin console error</h2>
      <p className="text-leather-500 max-w-sm">
        Failed to load the admin console. Please try again.
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

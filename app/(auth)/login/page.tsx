"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { loginUser } from "@/lib/actions/auth";
import { Lock } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await loginUser(null, formData);

      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md space-y-6">
        {/* Header with value proposition */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-leather-800 border-2 border-leather-pop/30 mb-4">
            <Lock className="w-8 h-8 text-leather-pop" />
          </div>
          <h1 className="text-page-title text-leather-pop">Welcome Back</h1>
          <p className="text-leather-500 text-sm max-w-xs mx-auto">
            Access your confessions and reconnect with your community
          </p>
        </div>

        <Card>
          <form action={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-bold mb-2 text-leather-accent">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                placeholder="your_username"
                className="w-full bg-leather-900 rounded-xl p-3 text-leather-accent placeholder:text-leather-600 focus:ring-2 focus:ring-leather-pop outline-none transition-all"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-bold mb-2 text-leather-accent">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-leather-900 rounded-xl p-3 text-leather-accent placeholder:text-leather-600 focus:ring-2 focus:ring-leather-pop outline-none transition-all"
              />
            </div>

            {error && (
              <div className="bg-leather-900/50 border border-red-900/50 rounded-lg p-3" role="alert">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={isPending}>
              Login to Sarhni
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-leather-700/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-leather-800 text-leather-500">New to Sarhni?</span>
              </div>
            </div>

            <Link href="/register" className="block">
              <Button variant="secondary" className="w-full bg-leather-700/50 hover:bg-leather-700">
                Create an Account
              </Button>
            </Link>
          </div>
        </Card>

        {/* Trust indicator */}
        <p className="text-center text-xs text-leather-600">
          🔒 Your connection is secure and private
        </p>
      </div>
    </div>
  );
}

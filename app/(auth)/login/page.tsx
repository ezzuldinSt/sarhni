"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { loginUser } from "@/lib/actions/auth";

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
      <div className="w-full max-w-md">
        <h1 className="text-page-title text-center text-leather-pop mb-8">Welcome Back</h1>
        <Card>
          <form action={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-bold mb-2 text-leather-accent">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                className="w-full bg-leather-900 rounded-xl p-3 text-leather-accent focus:ring-2 focus:ring-leather-pop outline-none"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-bold mb-2 text-leather-accent">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full bg-leather-900 rounded-xl p-3 text-leather-accent focus:ring-2 focus:ring-leather-pop outline-none"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded-lg" role="alert">{error}</p>
            )}

            <Button type="submit" className="w-full" isLoading={isPending}>Login</Button>
          </form>
          <p className="mt-6 text-center text-sm text-leather-500">
            New here?{" "}
            <Link href="/register" className="text-leather-pop hover:underline">
              Register now
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

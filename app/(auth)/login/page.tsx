"use client";
import { signIn } from "next-auth/react"; // Client side sign-in wrapper
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function LoginPage() {
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid credentials. Try again!");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-leather-pop mb-8">Welcome Back</h1>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2 text-leather-accent">Username</label>
              <input
                name="username"
                type="text"
                required
                className="w-full bg-leather-900 rounded-xl p-3 text-leather-accent focus:ring-2 focus:ring-leather-pop outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-leather-accent">Password</label>
              <input
                name="password"
                type="password"
                required
                className="w-full bg-leather-900 rounded-xl p-3 text-leather-accent focus:ring-2 focus:ring-leather-pop outline-none"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded-lg">{error}</p>
            )}

            <Button type="submit" className="w-full">Login</Button>
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

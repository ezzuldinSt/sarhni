"use client";
import { useFormState } from "react-dom";
import Link from "next/link";
import { registerUser } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function RegisterPage() {
  const [state, action] = useFormState(registerUser, null);

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-leather-pop mb-8">Join the Club</h1>
        <Card>
          <form action={action} className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2 text-leather-accent">Username</label>
              <input
                name="username"
                type="text"
                required
                className="w-full bg-leather-900 rounded-xl p-3 text-leather-accent focus:ring-2 focus:ring-leather-pop outline-none"
                placeholder="cozy_panda"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-leather-accent">Password</label>
              <input
                name="password"
                type="password"
                required
                className="w-full bg-leather-900 rounded-xl p-3 text-leather-accent focus:ring-2 focus:ring-leather-pop outline-none"
                placeholder="••••••"
              />
            </div>
            
            {state?.error && (
              <p className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded-lg">{state.error}</p>
            )}

            <Button type="submit" className="w-full">Create Account</Button>
          </form>
          <p className="mt-6 text-center text-sm text-leather-500">
            Already have an account?{" "}
            <Link href="/login" className="text-leather-pop hover:underline">
              Login here
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

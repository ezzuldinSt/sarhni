"use client";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { registerUser } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function RegisterPage() {
  const [state, action] = useFormState(registerUser, null);

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md">
        <h1 className="text-page-title text-center text-leather-pop mb-8">Join the Club</h1>
        <Card>
          <form action={action} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-bold mb-2 text-leather-accent">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="w-full bg-leather-900 rounded-xl p-3 text-leather-accent focus:ring-2 focus:ring-leather-pop outline-none"
                placeholder="cozy_panda"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-leather-accent">Password</label>
              <PasswordInput
                name="password"
                required
                placeholder="••••••"
                className="w-full"
              />
            </div>

            {state?.error && (
              <p className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded-lg" role="alert">{state.error}</p>
            )}

            <SubmitButton />
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

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" isLoading={pending}>
      Create Account
    </Button>
  );
}

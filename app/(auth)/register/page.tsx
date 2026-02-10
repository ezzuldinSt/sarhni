"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { registerUser } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { UserPlus, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const [state, action] = useActionState(registerUser, null);

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md space-y-6">
        {/* Header with value proposition */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-leather-800 border-2 border-leather-pop/30 mb-4">
            <UserPlus className="w-8 h-8 text-leather-pop" />
          </div>
          <h1 className="text-page-title text-leather-pop">Join Sarhni</h1>
          <p className="text-leather-500 text-sm max-w-xs mx-auto">
            Create your space for honest, anonymous messages from friends
          </p>
        </div>

        {/* Quick value props */}
        <div className="flex items-center justify-center gap-4 text-xs text-leather-500 flex-wrap">
          <span className="flex items-center gap-1">
            <CheckCircle2 size={14} className="text-leather-pop" />
            Anonymous
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 size={14} className="text-leather-pop" />
            Free forever
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 size={14} className="text-leather-pop" />
            No spam
          </span>
        </div>

        <Card>
          <form action={action} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-bold mb-2 text-leather-accent">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="w-full bg-leather-900 rounded-xl p-3 text-leather-accent placeholder:text-leather-600 focus:ring-2 focus:ring-leather-pop outline-none transition-all"
                placeholder="your_username"
                pattern="[a-zA-Z0-9_-]{3,20}"
                title="3-20 characters, letters, numbers, hyphens, underscores only"
              />
              <p className="text-xs text-leather-600 mt-1.5">
                3-20 characters • Your public profile: sarhni.zhrworld.com/u/your_username
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold mb-2 text-leather-accent">
                Password
              </label>
              <PasswordInput
                name="password"
                required
                placeholder="••••••••"
                className="w-full"
              />
            </div>

            {state?.error && (
              <div className="bg-leather-900/50 border border-red-900/50 rounded-lg p-3" role="alert">
                <p className="text-red-400 text-sm text-center">{state.error}</p>
              </div>
            )}

            <SubmitButton />
          </form>

          <div className="mt-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-leather-700/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-leather-800 text-leather-500">Already have an account?</span>
              </div>
            </div>

            <Link href="/login" className="block">
              <Button variant="secondary" className="w-full bg-leather-700/50 hover:bg-leather-700">
                Login to Sarhni
              </Button>
            </Link>
          </div>
        </Card>

        {/* Trust indicator */}
        <p className="text-center text-xs text-leather-600">
          🔒 By joining, you agree to receive anonymous messages. Your data stays private.
        </p>
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" isLoading={pending}>
      Create My Account
    </Button>
  );
}

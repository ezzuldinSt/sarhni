"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Shield, Crown } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "./ui/Button";

export default function DesktopNavLinks({ session }: { session: any }) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const linkClassName = (path: string) =>
    `text-sm font-medium transition-colors rounded px-2 py-1 ${
      isActive(path)
        ? "text-leather-pop font-bold bg-leather-pop/10"
        : "text-leather-accent hover:text-white hover:bg-leather-700/30"
    }`;

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  if (!session?.user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-sm font-medium text-leather-accent hover:text-white transition-colors rounded px-3 py-2 hover:bg-leather-700/30"
        >
          Login
        </Link>
        <Link href="/register">
          <Button size="sm" className="bg-leather-pop text-leather-900 hover:bg-leather-popHover">
            Get Started
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-leather-800/50 border border-leather-700/30">
        <Link href="/dashboard" className={linkClassName("/dashboard")}>
          Dashboard
        </Link>
        {session.user.name && (
          <Link
            href={`/u/${session.user.name}`}
            className={linkClassName(`/u/${session.user.name}`)}
          >
            Profile
          </Link>
        )}
        <Link href="/dashboard/settings" className={linkClassName("/dashboard/settings")}>
          Settings
        </Link>

        {/* Admin Section - ADMIN and OWNER */}
        {(session.user.role === "ADMIN" || session.user.role === "OWNER") && (
          <>
            <div className="w-px h-6 bg-leather-700/50 mx-1" />
            <Link
              href="/admin/reports"
              className={`text-sm font-medium transition-colors rounded px-2 py-1 flex items-center gap-1.5 ${
                isActive("/admin/reports")
                  ? "text-leather-pop font-bold bg-leather-pop/10"
                  : "text-leather-accent hover:text-white hover:bg-leather-700/30"
              }`}
              title="View content reports"
            >
              <Shield size={14} /> Reports
            </Link>
            <Link
              href="/admin"
              className={`text-sm font-medium transition-colors rounded px-2 py-1 flex items-center gap-1.5 ${
                isActive("/admin")
                  ? "text-leather-pop font-bold bg-leather-pop/10"
                  : "text-leather-accent hover:text-white hover:bg-leather-700/30"
              }`}
              title="Manage users and roles"
            >
              <Shield size={14} /> Admin
            </Link>
          </>
        )}

        {/* Owner Section - OWNER only */}
        {session.user.role === "OWNER" && (
          <Link
            href="/owner"
            className={`text-sm font-medium transition-colors rounded px-2 py-1 flex items-center gap-1.5 ${
              isActive("/owner")
                ? "text-leather-pop font-bold bg-leather-pop/10"
                : "text-leather-accent hover:text-white hover:bg-leather-700/30"
            }`}
            title="Owner command center"
          >
            <Crown size={14} /> Owner
          </Link>
        )}
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={handleSignOut}
        className="bg-transparent border border-leather-700/50 text-leather-100 hover:bg-leather-800 hover:text-white hover:border-leather-600 shadow-none"
        title="Sign out of your account"
      >
        Sign Out
      </Button>
    </>
  );
}

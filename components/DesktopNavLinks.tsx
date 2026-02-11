"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Shield, Crown } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "./ui/Button";
import { SafeSession } from "@/lib/types";
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

interface DesktopNavLinksProps {
  session: SafeSession | null;
}

export default function DesktopNavLinks({ session }: DesktopNavLinksProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('Navbar');

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
    signOut({ callbackUrl: `/${locale}` });
  };

  if (!session?.user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/login`}
          className="text-sm font-medium text-leather-accent hover:text-white transition-colors rounded px-3 py-2 hover:bg-leather-700/30"
        >
          {t('login')}
        </Link>
        <Link href={`/${locale}/register`}>
          <Button size="sm" className="bg-leather-pop text-leather-900 hover:bg-leather-popHover">
            {t('register')}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-leather-800/50 border border-leather-700/30">
        <Link href={`/${locale}/dashboard`} className={linkClassName(`/${locale}/dashboard`)}>
          {t('dashboard')}
        </Link>
        {session.user.name && (
          <Link
            href={`/${locale}/u/${session.user.name}`}
            className={linkClassName(`/${locale}/u/${session.user.name}`)}
          >
            {t('profile')}
          </Link>
        )}
        <Link href={`/${locale}/dashboard/settings`} className={linkClassName(`/${locale}/dashboard/settings`)}>
          {t('settings')}
        </Link>

        {/* Admin Section - ADMIN and OWNER */}
        {(session.user.role === "ADMIN" || session.user.role === "OWNER") && (
          <>
            <div className="w-px h-6 bg-leather-700/50 mx-1" />
            <Link
              href={`/${locale}/admin/reports`}
              className={`text-sm font-medium transition-colors rounded px-2 py-1 flex items-center gap-1.5 ${
                isActive(`/${locale}/admin/reports`)
                  ? "text-leather-pop font-bold bg-leather-pop/10"
                  : "text-leather-accent hover:text-white hover:bg-leather-700/30"
              }`}
              title="View content reports"
            >
              <Shield size={14} /> {t('reports')}
            </Link>
            <Link
              href={`/${locale}/admin`}
              className={`text-sm font-medium transition-colors rounded px-2 py-1 flex items-center gap-1.5 ${
                isActive(`/${locale}/admin`)
                  ? "text-leather-pop font-bold bg-leather-pop/10"
                  : "text-leather-accent hover:text-white hover:bg-leather-700/30"
              }`}
              title="Manage users and roles"
            >
              <Shield size={14} /> {t('adminConsole')}
            </Link>
          </>
        )}

        {/* Owner Section - OWNER only */}
        {session.user.role === "OWNER" && (
          <Link
            href={`/${locale}/owner`}
            className={`text-sm font-medium transition-colors rounded px-2 py-1 flex items-center gap-1.5 ${
              isActive(`/${locale}/owner`)
                ? "text-leather-pop font-bold bg-leather-pop/10"
                : "text-leather-accent hover:text-white hover:bg-leather-700/30"
            }`}
            title="Owner command center"
          >
            <Crown size={14} /> {t('ownerCommand')}
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
        {t('logout')}
      </Button>
    </>
  );
}

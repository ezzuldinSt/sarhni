"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Menu, X, Home, User, Settings, LogOut, LayoutDashboard, Shield, Flag, Crown } from "lucide-react";
import { signOut } from "next-auth/react";
import UserSearch from "./UserSearch";
import { SafeSession } from "@/lib/types";
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

interface MobileMenuProps {
  session: SafeSession | null;
}

export default function MobileMenu({ session }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const locale = useLocale();
  const t = useTranslations('Navbar');

  const toggleOpen = () => setIsOpen(!isOpen);

  // 1. HYDRATION FIX: Only render portal after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // 2. SCROLL LOCK: Freeze background when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Focus management: Move focus to close button when menu opens
      closeButtonRef.current?.focus();
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  // 3. ESC KEY HANDLER: Close menu on ESC key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  // 3. SWIPE LOGIC: Handle drag end
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // If user dragged > 100px to the right, close the menu
    if (info.offset.x > 100) {
      setIsOpen(false);
    }
  };

  const menuVariants = {
    closed: {
      x: "100%",
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    open: {
      x: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    }
  };

  return (
    <div className="md:hidden">
      {/* HAMBURGER BUTTON */}
      <button
        onClick={toggleOpen}
        className="p-2 text-leather-accent hover:text-leather-pop transition-colors"
        aria-label={t('toggleMenu')}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
      >
        <Menu size={28} />
      </button>

      {/* PORTAL TO BODY */}
      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* BACKDROP */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={toggleOpen}
                className="fixed inset-0 bg-leather-900/90 backdrop-blur-sm z-modal-backdrop"
                aria-hidden="true"
              />

              {/* DRAWER PANEL */}
              <motion.div
                initial="closed"
                animate="open"
                exit="closed"
                variants={menuVariants}
                // --- SWIPE GESTURES ---
                drag="x" // Allow horizontal drag
                dragConstraints={{ left: 0, right: 0 }} // Don't allow free dragging
                dragElastic={{ left: 0, right: 0.5 }} // Rubber band effect on right pull
                onDragEnd={handleDragEnd} // Detect swipe finish
                // ----------------------
                id="mobile-menu"
                role="dialog"
                aria-modal="true"
                aria-label={t('mobileNavLabel')}
                className="fixed top-0 end-0 bottom-0 w-[75%] max-w-sm z-modal shadow-2xl flex flex-col p-6 border-s border-leather-700 touch-pan-x bg-leather-800"
              >
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                  <span className="text-xl font-bold text-leather-pop tracking-tight">{t('menu')}</span>
                  <button
                    ref={closeButtonRef}
                    onClick={toggleOpen}
                    className="text-leather-accent hover:text-leather-pop hover:bg-leather-700/30 p-2 rounded-lg transition-colors"
                    aria-label={t('closeMenu')}
                  >
                    <X size={28} />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="mb-8">
                   <UserSearch className="w-full" onSelect={toggleOpen} />
                </div>

                {/* Navigation Links */}
                <nav className="flex flex-col gap-6 text-lg">
                  <Link
                    href={`/${locale}`}
                    onClick={toggleOpen}
                    className={`flex items-center gap-4 ${pathname === `/${locale}` || pathname === '/' ? 'text-leather-pop font-bold' : 'text-leather-accent'}`}
                  >
                    <Home size={20} /> {t('home')}
                  </Link>

                  {session?.user ? (
                    <>
                      <Link
                        href={`/${locale}/dashboard`}
                        onClick={toggleOpen}
                        className={`flex items-center gap-4 ${pathname === `/${locale}/dashboard` ? 'text-leather-pop font-bold' : 'text-leather-accent'}`}
                      >
                        <LayoutDashboard size={20} /> {t('dashboard')}
                      </Link>
                      {session.user.name && (
                        <Link
                          href={`/${locale}/u/${session.user.name}`}
                          onClick={toggleOpen}
                          className={`flex items-center gap-4 ${pathname.startsWith(`/${locale}/u/`) ? 'text-leather-pop font-bold' : 'text-leather-accent'}`}
                        >
                          <User size={20} /> {t('myProfile')}
                        </Link>
                      )}
                      <Link
                        href={`/${locale}/dashboard/settings`}
                        onClick={toggleOpen}
                        className={`flex items-center gap-4 ${pathname === `/${locale}/dashboard/settings` ? 'text-leather-pop font-bold' : 'text-leather-accent'}`}
                      >
                        <Settings size={20} /> {t('settings')}
                      </Link>

                      {/* Admin Section - ADMIN and OWNER */}
                      {(session?.user?.role === "ADMIN" || session?.user?.role === "OWNER") && (
                        <>
                          <div className="h-px bg-leather-600/50 my-2" />
                          <div className="text-xs font-bold text-leather-100 uppercase tracking-wider mb-3">{t('adminSection')}</div>
                          <Link
                            href={`/${locale}/admin/reports`}
                            onClick={toggleOpen}
                            className={`flex items-center gap-4 ${pathname.startsWith(`/${locale}/admin/reports`) ? 'text-leather-pop font-bold' : 'text-leather-accent'}`}
                          >
                            <Flag size={20} /> {t('reports')}
                          </Link>
                          <Link
                            href={`/${locale}/admin`}
                            onClick={toggleOpen}
                            className={`flex items-center gap-4 ${pathname === `/${locale}/admin` ? 'text-leather-pop font-bold' : 'text-leather-accent'}`}
                          >
                            <Shield size={20} /> {t('adminConsole')}
                          </Link>
                        </>
                      )}

                      {/* Owner Section - OWNER only */}
                      {session?.user?.role === "OWNER" && (
                        <Link
                          href={`/${locale}/owner`}
                          onClick={toggleOpen}
                          className={`flex items-center gap-4 ${pathname === `/${locale}/owner` ? 'text-leather-pop font-bold' : 'text-leather-accent'}`}
                        >
                          <Crown size={20} /> {t('ownerCommand')}
                        </Link>
                      )}

                      <div className="h-px bg-leather-600/50 my-2" />

                      <button
                        onClick={() => signOut({ callbackUrl: `/${locale}` })}
                        className="flex items-center gap-4 text-leather-pop font-bold"
                      >
                        <LogOut size={20} /> {t('logout')}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="h-px bg-leather-600/50 my-2" />
                      <Link
                        href={`/${locale}/login`}
                        onClick={toggleOpen}
                        className="flex items-center gap-4 text-leather-pop font-bold"
                      >
                        <User size={20} /> {t('loginRegister')}
                      </Link>
                    </>
                  )}
                </nav>

                <div className="mt-auto text-center">
                   <p className="text-xs text-leather-100">Sarhni © 2026</p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

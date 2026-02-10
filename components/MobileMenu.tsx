"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Menu, X, Home, User, Settings, LogOut, LayoutDashboard, Shield, Flag, Crown } from "@/components/ui/Icon";
import { signOut } from "next-auth/react";
import UserSearch from "./UserSearch";

export default function MobileMenu({ session }: { session: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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
        aria-label="Toggle Menu"
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
                aria-label="Mobile navigation menu"
                className="fixed top-0 right-0 bottom-0 w-[75%] max-w-sm z-modal shadow-2xl flex flex-col p-6 border-l border-leather-700 touch-pan-x bg-leather-800"
              >
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                  <span className="text-xl font-bold text-leather-pop tracking-tight">Menu</span>
                  <button
                    ref={closeButtonRef}
                    onClick={toggleOpen}
                    className="text-leather-accent hover:text-leather-pop hover:bg-leather-700/30 p-2 rounded-lg transition-colors"
                    aria-label="Close Menu"
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
                    href="/" 
                    onClick={toggleOpen}
                    className={`flex items-center gap-4 ${pathname === '/' ? 'text-leather-pop font-bold' : 'text-leather-accent'}`}
                  >
                    <Home size={20} /> Home
                  </Link>

                  {session?.user ? (
                    <>
                      <Link 
                        href="/dashboard" 
                        onClick={toggleOpen}
                        className={`flex items-center gap-4 ${pathname === '/dashboard' ? 'text-leather-pop font-bold' : 'text-leather-accent'}`}
                      >
                        <LayoutDashboard size={20} /> Dashboard
                      </Link>
                      {session.user.name && (
                        <Link
                          href={`/u/${session.user.name}`}
                          onClick={toggleOpen}
                          className={`flex items-center gap-4 ${pathname.startsWith('/u/') ? 'text-leather-pop font-bold' : 'text-leather-accent'}`}
                        >
                          <User size={20} /> My Profile
                        </Link>
                      )}
                      <Link
                        href="/dashboard/settings"
                        onClick={toggleOpen}
                        className={`flex items-center gap-4 ${pathname === '/dashboard/settings' ? 'text-leather-pop font-bold' : 'text-leather-accent'}`}
                      >
                        <Settings size={20} /> Settings
                      </Link>

                      {/* Admin Section - ADMIN and OWNER */}
                      {(session?.user?.role === "ADMIN" || session?.user?.role === "OWNER") && (
                        <>
                          <div className="h-px bg-leather-600/50 my-2" />
                          <div className="text-xs font-bold text-leather-100 uppercase tracking-wider mb-3">Admin</div>
                          <Link
                            href="/admin/reports"
                            onClick={toggleOpen}
                            className={`flex items-center gap-4 ${pathname.startsWith('/admin/reports') ? 'text-leather-pop font-bold' : 'text-leather-accent'}`}
                          >
                            <Flag size={20} /> Reports
                          </Link>
                          <Link
                            href="/admin"
                            onClick={toggleOpen}
                            className={`flex items-center gap-4 ${pathname === '/admin' ? 'text-leather-pop font-bold' : 'text-leather-accent'}`}
                          >
                            <Shield size={20} /> Admin Console
                          </Link>
                        </>
                      )}

                      {/* Owner Section - OWNER only */}
                      {session?.user?.role === "OWNER" && (
                        <Link
                          href="/owner"
                          onClick={toggleOpen}
                          className={`flex items-center gap-4 ${pathname === '/owner' ? 'text-leather-pop font-bold' : 'text-leather-accent'}`}
                        >
                          <Crown size={20} /> Owner Command
                        </Link>
                      )}

                      <div className="h-px bg-leather-600/50 my-2" />

                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="flex items-center gap-4 text-leather-pop font-bold"
                      >
                        <LogOut size={20} /> Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="h-px bg-leather-600/50 my-2" />
                      <Link 
                        href="/login" 
                        onClick={toggleOpen}
                        className="flex items-center gap-4 text-leather-pop font-bold"
                      >
                        <User size={20} /> Login / Register
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

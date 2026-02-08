import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import UserSearch from "./UserSearch";
import MobileMenu from "./MobileMenu"; 
import { Button } from "./ui/Button";

export default async function Navbar() {
  const session = await auth();

  return (
    <nav className="border-b border-leather-700/30 bg-leather-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">

        {/* LOGO */}
        <Link href="/" className="font-bold text-xl text-leather-pop tracking-tight hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-leather-pop focus:ring-offset-2 focus:ring-offset-leather-900 rounded flex items-center gap-2">
          <span>Sarhni</span>
        </Link>

        {/* --- DESKTOP NAVIGATION (Hidden on Mobile) --- */}
        <div className="hidden md:flex items-center gap-5">
          <UserSearch className="w-64" />

          {session?.user ? (
            <>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-leather-800/50 border border-leather-700/30">
                <Link href="/dashboard" className="text-sm font-medium text-leather-accent hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-leather-pop focus:ring-offset-2 focus:ring-offset-leather-900 rounded px-2 py-1">
                  Dashboard
                </Link>
                {session.user.name && (
                  <Link href={`/u/${session.user.name}`} className="text-sm font-medium text-leather-accent hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-leather-pop focus:ring-offset-2 focus:ring-offset-leather-900 rounded px-2 py-1">
                    Profile
                  </Link>
                )}
                <Link href="/dashboard/settings" className="text-sm font-medium text-leather-accent hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-leather-pop focus:ring-offset-2 focus:ring-offset-leather-900 rounded px-2 py-1">
                  Settings
                </Link>
              </div>
              <form action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-transparent border border-leather-700/50 text-leather-100 hover:bg-leather-800 hover:text-white hover:border-leather-600 shadow-none"
                >
                  Sign Out
                </Button>
              </form>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-leather-accent hover:text-white focus:outline-none focus:ring-2 focus:ring-leather-pop focus:ring-offset-2 focus:ring-offset-leather-900 rounded px-3 py-2">
                Login
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-leather-pop text-leather-900 hover:bg-leather-popHover">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* --- MOBILE NAVIGATION (Hidden on Desktop) --- */}
        <MobileMenu session={session} />
      
      </div>
    </nav>
  );
}

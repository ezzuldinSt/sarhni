import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import UserSearch from "./UserSearch";
import MobileMenu from "./MobileMenu"; 
import { Button } from "./ui/Button";

export default async function Navbar() {
  const session = await auth();

  return (
    <nav className="border-b border-leather-600/30 bg-leather-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <Link href="/" className="font-bold text-2xl text-leather-pop tracking-tight hover:opacity-80 transition-opacity">
          Sarhni
        </Link>

        {/* --- DESKTOP NAVIGATION (Hidden on Mobile) --- */}
        <div className="hidden md:flex items-center gap-6">
          <UserSearch className="w-64" /> 
          
          {session?.user ? (
            <>
              <Link href="/dashboard" className="text-sm font-bold text-leather-accent hover:text-white transition-colors">
                Dashboard
              </Link>
              {session.user.name && (
                <Link href={`/u/${session.user.name}`} className="text-sm font-bold text-leather-accent hover:text-white transition-colors">
                  My Profile
                </Link>
              )}
              <Link href="/dashboard/settings" className="text-sm font-bold text-leather-accent hover:text-white transition-colors">
                Settings
              </Link>
              <form action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}>
                {/* FIX: Removed size="sm", added h-8 px-3 text-xs manually */}
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="ml-2 bg-transparent border border-red-900/30 text-red-400 hover:bg-red-900/20 hover:text-red-300 shadow-none"
                >
                  Sign Out
                </Button>
              </form>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-bold text-leather-accent hover:text-white">
                Login
              </Link>
              <Link href="/register">
                {/* FIX: Removed size="sm", added h-8 px-3 text-xs manually */}
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

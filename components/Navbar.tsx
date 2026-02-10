import Link from "next/link";
import { signOut } from "@/lib/auth";
import { getCachedSession } from "@/lib/auth-cached";
import UserSearch from "./UserSearch";
import MobileMenu from "./MobileMenu";
import DesktopNavLinks from "./DesktopNavLinks";
import { Button } from "./ui/Button";

export default async function Navbar() {
  const session = await getCachedSession();

  return (
    <nav className="border-b border-leather-700/30 bg-leather-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">

        {/* LOGO */}
        <Link href="/" className="font-bold text-xl text-leather-pop tracking-tight hover:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-leather-pop focus-visible:ring-offset-2 focus-visible:ring-offset-leather-900 rounded flex items-center gap-2">
          <span>Sarhni</span>
        </Link>

        {/* --- DESKTOP NAVIGATION (Hidden on Mobile) --- */}
        <div className="hidden md:flex items-center gap-5">
          <UserSearch className="w-64" />
          <DesktopNavLinks session={session} />
        </div>

        {/* --- MOBILE NAVIGATION (Hidden on Desktop) --- */}
        <MobileMenu session={session} />

      </div>
    </nav>
  );
}

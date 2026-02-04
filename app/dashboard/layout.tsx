import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/auth/login");

  return (
    <div className="grid md:grid-cols-[240px_1fr] gap-8 min-h-[calc(100vh-100px)]">
      <aside className="space-y-2">
        <div className="bg-leather-800 rounded-2xl p-4 shadow-lg border border-leather-600/30">
          <h2 className="text-leather-500 text-xs font-bold uppercase tracking-wider mb-4 px-2">Menu</h2>
          <nav className="flex flex-col gap-2">
            <NavLink href="/dashboard">Overview</NavLink>
            <NavLink href={`/u/${session.user?.name}`}>View My Page</NavLink>
            <NavLink href="/dashboard/settings">Settings</NavLink>
          </nav>
        </div>
      </aside>
      <main>
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className="px-4 py-2 rounded-lg hover:bg-leather-700 text-leather-accent transition-colors font-medium"
    >
      {children}
    </Link>
  );
}

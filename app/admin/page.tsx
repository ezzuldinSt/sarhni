import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllUsers } from "@/lib/actions/admin";
import AdminDashboard from "@/components/AdminDashboard";
import { Users } from "lucide-react";

export default async function AdminPage() {
  const session = await auth();

  // Protect Route
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-3xl font-bold text-leather-pop mb-8">Admin Console</h1>
      <Suspense fallback={<UsersLoadingSkeleton />}>
        <AdminUsersWrapper viewerRole={session.user.role} />
      </Suspense>
    </div>
  );
}

// Async wrapper component to enable Suspense streaming
async function AdminUsersWrapper({ viewerRole }: { viewerRole: string }) {
  const users = await getAllUsers();
  return <AdminDashboard users={users} viewerRole={viewerRole} />;
}

// Loading skeleton for better perceived performance
function UsersLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-20 bg-leather-800/30 rounded-2xl border border-leather-700/20 animate-pulse flex items-center justify-center"
          style={{ animationDelay: `${i * 75}ms` }}
        >
          <Users className="w-6 h-6 text-leather-700/50" />
        </div>
      ))}
    </div>
  );
}


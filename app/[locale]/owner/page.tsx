import { Suspense } from "react";
import { getCachedSession } from "@/lib/auth-cached";
import { redirect } from "next/navigation";
import { getAllUsers } from "@/lib/actions/admin";
import AdminDashboard from "@/components/AdminDashboard";
import { Crown } from "lucide-react";

export default async function OwnerPage() {
  const session = await getCachedSession();

  // Strict Protection
  if (!session || session.user.role !== "OWNER") {
    redirect("/dashboard"); // Bounce them out
  }

  return (
    <div className="max-w-4xl mx-auto py-10 border-4 border-yellow-500/20 p-8 rounded-3xl">
      <h1 className="text-4xl font-bold text-yellow-500 mb-2">Owner Command Center</h1>
      <p className="text-leather-500 mb-8">With great power comes great responsibility.</p>

      <Suspense fallback={<UsersLoadingSkeleton />}>
        <OwnerUsersWrapper />
      </Suspense>
    </div>
  );
}

// Async wrapper component to enable Suspense streaming
async function OwnerUsersWrapper() {
  const users = await getAllUsers();
  return <AdminDashboard users={users} viewerRole="OWNER" />;
}

// Loading skeleton with crown icon for owner theme
function UsersLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-20 bg-yellow-500/5 rounded-2xl border border-yellow-500/20 animate-pulse flex items-center justify-center"
          style={{ animationDelay: `${i * 75}ms` }}
        >
          <Crown className="w-6 h-6 text-yellow-500/30" />
        </div>
      ))}
    </div>
  );
}


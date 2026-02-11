import { getCachedSession } from "@/lib/auth-cached";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCachedSession();
  if (!session) redirect("/login");

  return (
    <main className="min-h-[calc(100vh-80px)] p-4 md:p-6">
      {children}
    </main>
  );
}

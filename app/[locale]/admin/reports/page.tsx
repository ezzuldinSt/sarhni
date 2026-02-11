import { getCachedSession } from "@/lib/auth-cached";
import { redirect } from "next/navigation";
import { getReports } from "@/lib/actions/report";
import ReportsDashboard from "@/components/ReportsDashboard";

export default async function ReportsPage() {
  const session = await getCachedSession();

  // Protect Route
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    redirect("/dashboard");
  }

  const reportsResult = await getReports();

  // Handle error case
  if ("error" in reportsResult) {
    return (
      <div className="max-w-5xl mx-auto py-10">
        <h1 className="text-3xl font-bold text-leather-pop mb-2">Content Moderation</h1>
        <p className="text-red-400">{reportsResult.error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10">
      <h1 className="text-3xl font-bold text-leather-pop mb-2">Content Moderation</h1>
      <p className="text-leather-500 mb-8">Review and manage reported content</p>
      <ReportsDashboard initialReports={reportsResult} viewerRole={session.user.role} />
    </div>
  );
}

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SettingsForm from "./SettingsForm"; // Import the client component

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user?.id } });

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-leather-pop">Edit Profile</h1>
      <SettingsForm user={user} />
    </div>
  );
}

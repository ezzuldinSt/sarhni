import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SettingsForm from "./SettingsForm"; // Import the client component

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user?.id },
    select: { id: true, username: true, image: true, bio: true }
  });

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-page-title text-leather-pop mb-2">Edit Profile</h1>
        <p className="text-leather-accent/70 text-sm">Update your profile picture and bio</p>
      </div>
      <SettingsForm user={user} />
    </div>
  );
}

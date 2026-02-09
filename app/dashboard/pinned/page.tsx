import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Pin } from "lucide-react";
import ConfessionFeed from "@/components/ConfessionFeed";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function PinnedPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-page-title text-leather-pop mb-2 flex items-center gap-2">
          <Pin size={28} className="text-leather-pop" />
          Pinned Messages
        </h1>
        <p className="text-leather-accent/70 text-sm">Your favorite messages (up to 3)</p>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <PinnedMessages userId={session.user.id} />
      </Suspense>
    </div>
  );
}

async function PinnedMessages({ userId }: { userId: string }) {
  const pinnedConfessions = await prisma.confession.findMany({
    where: {
      receiverId: userId,
      isPinned: true
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      sender: { select: { username: true } },
      receiver: { select: { username: true } },
    },
  });

  if (pinnedConfessions.length === 0) {
    return (
      <EmptyState
        icon={Pin}
        title="No pinned messages yet"
        description="Pin your favorite messages to showcase them here. You can pin up to 3 messages."
        illustration="messages"
      />
    );
  }

  return (
    <ConfessionFeed
      initialConfessions={pinnedConfessions}
      userId={userId}
      isOwner={true}
      gridLayout={true}
      currentUserId={userId}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-48 bg-leather-800/30 rounded-3xl border border-leather-700/20"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

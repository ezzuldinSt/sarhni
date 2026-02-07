import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import ConfessionFeed from "@/components/ConfessionFeed";
import ShareLinkCard from "@/components/ShareLinkCard";
import WelcomeModalWrapper from "@/components/WelcomeModalWrapper";
import { ConfessionFeedErrorBoundary } from "@/components/ConfessionFeedErrorBoundary";
import { Mail, Send, Inbox, Loader2 } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      username: true,
      _count: { select: { receivedConfessions: true, sentConfessions: true } },
    },
  });

  return (
    <>
      <WelcomeModalWrapper username={user?.username} />
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row gap-8 justify-between items-start">
          <div>
            <h1 className="text-page-title text-leather-pop mb-2">Hello, {user?.username} 👋</h1>
            <p className="text-leather-100">Ready to see what people really think?</p>
          </div>
        </div>

        {/* --- SHARE LINK + STATS (renders immediately) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
             <ShareLinkCard username={user?.username || ""} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            <Card className="flex flex-col items-center justify-center p-6 bg-leather-800/50 hover:bg-leather-800 transition-colors">
              <Inbox className="w-8 h-8 text-leather-pop mb-2 opacity-80" />
              <span className="text-3xl font-bold text-white mb-1">{user?._count.receivedConfessions ?? 0}</span>
              <span className="text-leather-100 uppercase text-[10px] tracking-widest text-center">Received</span>
            </Card>
            <Card className="flex flex-col items-center justify-center p-6 bg-leather-800/50 hover:bg-leather-800 transition-colors">
              <Send className="w-8 h-8 text-leather-pop mb-2 opacity-80" />
              <span className="text-3xl font-bold text-white mb-1">{user?._count.sentConfessions ?? 0}</span>
              <span className="text-leather-100 uppercase text-[10px] tracking-widest text-center">Sent</span>
            </Card>
          </div>
        </div>

        {/* --- INBOX (streams in) --- */}
        <div>
          <div className="flex items-center gap-2 mb-6">
             <Mail className="text-leather-pop" />
             <h2 className="text-xl font-bold text-leather-accent">Your Inbox</h2>
          </div>

          <Suspense fallback={<InboxSkeleton />}>
            <DashboardInbox userId={session.user.id} username={user?.username} />
          </Suspense>
        </div>

        {/* --- SENT MESSAGES (streams in) --- */}
        <Suspense fallback={<SentSkeleton />}>
          <DashboardSent userId={session.user.id} />
        </Suspense>
      </div>
    </>
  );
}

// --- Async component: streams inbox confessions ---
async function DashboardInbox({ userId, username }: { userId: string; username?: string }) {
  const confessions = await prisma.confession.findMany({
    where: { receiverId: userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      sender: { select: { username: true, image: true } },
      receiver: { select: { username: true } },
    },
  });

  return (
    <ConfessionFeedErrorBoundary>
      <ConfessionFeed
        initialConfessions={confessions}
        userId={userId}
        isOwner={true}
        gridLayout={true}
        username={username}
        currentUserId={userId}
      />
    </ConfessionFeedErrorBoundary>
  );
}

// --- Async component: streams sent messages ---
async function DashboardSent({ userId }: { userId: string }) {
  const sentConfessions = await prisma.confession.findMany({
    where: { senderId: userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { receiver: { select: { username: true } } },
  });

  if (sentConfessions.length === 0) return <div className="pt-8 border-t border-leather-600/20 text-center py-12">
    <div className="flex flex-col items-center justify-center">
      <div className="w-20 h-20 mb-4 opacity-50">
        <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M40 100 L70 130 L160 50" className="stroke-leather-600" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <circle cx="100" cy="50" r="20" className="fill-leather-600/10"/>
        </svg>
      </div>
      <h3 className="text-lg font-bold text-leather-accent mb-1">No sent messages yet</h3>
      <p className="text-sm text-leather-accent max-w-xs mx-auto">Messages you send will appear here</p>
    </div>
  </div>;

  return (
    <div className="pt-8 border-t border-leather-600/20">
      <h2 className="text-section-title mb-4 text-leather-100 uppercase tracking-widest text-xs">Recently Sent</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sentConfessions.map((msg) => (
          <div key={msg.id} className="p-4 rounded-xl bg-leather-900 border border-leather-700 hover:border-leather-600 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-leather-100">To: <span className="text-leather-pop">@{msg.receiver.username}</span></span>
              <span className="text-[10px] text-leather-600">{msg.createdAt.toLocaleDateString()}</span>
            </div>
            <p className="text-sm text-leather-accent/80 line-clamp-2">"{msg.content}"</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Skeleton Fallbacks ---
function InboxSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-48 bg-leather-700/20 rounded-3xl" />
      ))}
    </div>
  );
}

function SentSkeleton() {
  return (
    <div className="pt-8 border-t border-leather-600/20 animate-pulse">
      <div className="h-4 w-32 bg-leather-800/50 rounded mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-leather-900/50 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

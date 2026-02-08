import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import ConfessionFeed from "@/components/ConfessionFeed";
import ShareLinkCard from "@/components/ShareLinkCard";
import WelcomeModalWrapper from "@/components/WelcomeModalWrapper";
import { ConfessionFeedErrorBoundary } from "@/components/ConfessionFeedErrorBoundary";
import { Mail, Send, Inbox, Loader2, TrendingUp, MessageSquare, Heart, Pin, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // OPTIMIZATION: Run all initial queries in parallel
  // User query + 3 count queries can all run simultaneously
  const [user, pinnedCount, repliedCount, unreadCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        username: true,
        bio: true,
        image: true,
        createdAt: true,
        _count: { select: {
          receivedConfessions: true,
          sentConfessions: true
        }},
      },
    }),
    prisma.confession.count({
      where: { receiverId: session.user.id, isPinned: true }
    }),
    prisma.confession.count({
      where: { receiverId: session.user.id, reply: { not: null } }
    }),
    prisma.confession.count({
      where: { receiverId: session.user.id, reply: null }
    })
  ]);

  // Calculate engagement metrics
  const totalReceived = user?._count.receivedConfessions || 0;
  const totalSent = user?._count.sentConfessions || 0;
  const replyRate = totalReceived > 0 ? Math.round((repliedCount / totalReceived) * 100) : 0;
  const accountAge = user?.createdAt
    ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <>
      <WelcomeModalWrapper username={user?.username} />
      <div className="space-y-6 animate-in fade-in duration-500">

        {/* --- HEADER SECTION --- */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-page-title text-leather-pop">
                Hello, {user?.username}
              </h1>
              <Sparkles className="w-5 h-5 text-leather-pop animate-pulse" />
            </div>
            <p className="text-leather-100 text-sm">
              Ready to see what people really think?
            </p>
          </div>

          <Link
            href="/search"
            className="group inline-flex items-center gap-2 px-4 py-2.5 bg-leather-pop/10 hover:bg-leather-pop/20 border border-leather-pop/30 rounded-xl text-leather-pop font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-leather-pop focus:ring-offset-2 focus:ring-offset-leather-900"
          >
            <Send className="w-4 h-4" />
            Send a Message
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* --- SHARE LINK + QUICK STATS (renders immediately) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2">
             <ShareLinkCard username={user?.username || ""} />
          </div>

          {/* Stats Cards - Enhanced */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            {/* Received Card */}
            <Card className="group flex flex-col p-5 bg-leather-800/50 hover:bg-leather-800 transition-all duration-200 cursor-default border-leather-700/50 hover:border-leather-600">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-leather-pop/10 flex items-center justify-center">
                  <Inbox className="w-5 h-5 text-leather-pop" />
                </div>
                {totalReceived > 0 && (
                  <div className="flex items-center gap-1 text-xs text-leather-100/60">
                    <TrendingUp className="w-3 h-3" />
                    <span>Inbox</span>
                  </div>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{totalReceived}</span>
                <span className="text-sm text-leather-100/60">messages</span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1 text-leather-100/60">
                  <Pin className="w-3 h-3" />
                  <span>{pinnedCount} pinned</span>
                </div>
                {unreadCount > 0 && (
                  <div className="flex items-center gap-1 text-leather-pop">
                    <MessageSquare className="w-3 h-3" />
                    <span>{unreadCount} unread</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Sent Card */}
            <Card className="group flex flex-col p-5 bg-leather-800/50 hover:bg-leather-800 transition-all duration-200 cursor-default border-leather-700/50 hover:border-leather-600">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
                  <Send className="w-5 h-5 text-info-light" />
                </div>
                {totalSent > 0 && (
                  <div className="flex items-center gap-1 text-xs text-leather-100/60">
                    <TrendingUp className="w-3 h-3" />
                    <span>Sent</span>
                  </div>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{totalSent}</span>
                <span className="text-sm text-leather-100/60">sent</span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1 text-leather-100/60">
                  <Heart className="w-3 h-3" />
                  <span>{accountAge} days active</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* --- ENGAGEMENT METRICS --- */}
        {(totalReceived > 0 || totalSent > 0) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              label="Reply Rate"
              value={`${replyRate}%`}
              icon={<MessageSquare className="w-4 h-4" />}
              color="leather-pop"
              bgColor="leather-pop/10"
            />
            <MetricCard
              label="Pinned"
              value={pinnedCount.toString()}
              icon={<Pin className="w-4 h-4" />}
              color="leather-pop"
              bgColor="leather-pop/10"
            />
            <MetricCard
              label="Replied"
              value={repliedCount.toString()}
              icon={<Send className="w-4 h-4" />}
              color="info-light"
              bgColor="info/10"
            />
            <MetricCard
              label="Unread"
              value={unreadCount.toString()}
              icon={<Mail className="w-4 h-4" />}
              color="leather-100"
              bgColor="leather-700/30"
              highlight={unreadCount > 0}
            />
          </div>
        )}

        {/* --- INBOX SECTION --- */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-leather-pop/10 flex items-center justify-center">
                <Mail className="w-4 h-4 text-leather-pop" />
              </div>
              <h2 className="text-lg font-bold text-leather-accent">Your Inbox</h2>
              {totalReceived > 0 && (
                <span className="text-xs text-leather-100/60">({totalReceived} total)</span>
              )}
            </div>
            {totalReceived > 0 && (
              <Link
                href={`/u/${user?.username}`}
                className="text-xs text-leather-pop hover:text-leather-popHover transition-colors flex items-center gap-1"
              >
                View all
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          <Suspense fallback={<InboxSkeleton />}>
            <DashboardInbox userId={session.user.id} username={user?.username} />
          </Suspense>
        </div>

        {/* --- SENT MESSAGES SECTION --- */}
        <Suspense fallback={<SentSkeleton />}>
          <DashboardSent userId={session.user.id} />
        </Suspense>
      </div>
    </>
  );
}

// --- Metric Card Component ---
function MetricCard({
  label,
  value,
  icon,
  color,
  bgColor,
  highlight = false
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  highlight?: boolean;
}) {
  // Use proper conditional className mapping instead of dynamic template literals
  const bgColorClass = {
    "leather-pop/10": "bg-leather-pop/10",
    "info/10": "bg-info/10",
    "leather-700/30": "bg-leather-700/30"
  }[bgColor] || "bg-leather-pop/10";

  const colorClass = {
    "leather-pop": "text-leather-pop",
    "info-light": "text-info-light",
    "leather-100": "text-leather-100"
  }[color] || "text-leather-pop";

  return (
    <div className={`p-4 rounded-xl bg-leather-900/50 border ${highlight ? 'border-leather-pop/30' : 'border-leather-700/30'} hover:border-leather-600/50 transition-all duration-200`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg ${bgColorClass} flex items-center justify-center`}>
          <div className={colorClass}>{icon}</div>
        </div>
        <span className="text-xs text-leather-100/60 uppercase tracking-wide">{label}</span>
      </div>
      <span className={`text-xl font-bold ${highlight ? 'text-leather-pop' : 'text-white'}`}>{value}</span>
    </div>
  );
}

// --- Async component: streams inbox confessions ---
async function DashboardInbox({ userId, username }: { userId: string; username?: string }) {
  const confessions = await prisma.confession.findMany({
    where: { receiverId: userId },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 6,
    include: {
      sender: { select: { username: true, image: true } },
      receiver: { select: { username: true } },
    },
  });

  if (confessions.length === 0) {
    return (
      <EmptyInboxState username={username} />
    );
  }

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

// --- Empty Inbox State ---
function EmptyInboxState({ username }: { username?: string }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-leather-800/50 flex items-center justify-center">
        <Inbox className="w-10 h-10 text-leather-600" />
      </div>
      <h3 className="text-xl font-bold text-leather-accent mb-2">Your inbox is empty</h3>
      <p className="text-sm text-leather-100/60 max-w-sm mx-auto mb-6">
        Share your profile link to start receiving anonymous messages from friends and followers.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href={`/u/${username}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-leather-pop hover:bg-leather-popHover text-leather-900 rounded-xl font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-leather-pop focus:ring-offset-2 focus:ring-offset-leather-900"
        >
          View Profile
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-leather-800 hover:bg-leather-700 border border-leather-600/50 text-leather-accent rounded-xl font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-leather-600 focus:ring-offset-2 focus:ring-offset-leather-900"
        >
          Send Messages
        </Link>
      </div>
    </div>
  );
}

// --- Async component: streams sent messages ---
async function DashboardSent({ userId }: { userId: string }) {
  const sentConfessions = await prisma.confession.findMany({
    where: { senderId: userId },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { receiver: { select: { username: true } } },
  });

  if (sentConfessions.length === 0) return null;

  return (
    <div className="pt-6 border-t border-leather-600/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
            <Send className="w-4 h-4 text-info-light" />
          </div>
          <h2 className="text-lg font-bold text-leather-accent">Recently Sent</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {sentConfessions.map((msg) => (
          <Link
            key={msg.id}
            href={`/u/${msg.receiver.username}`}
            className="group p-4 rounded-xl bg-leather-900 border border-leather-700/30 hover:border-leather-600/50 transition-all duration-200 cursor-pointer"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-leather-100/70">
                To: <span className="text-leather-pop font-medium">@{msg.receiver.username}</span>
              </span>
              <span className="text-[10px] text-leather-100/40">
                {msg.createdAt.toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-leather-accent/70 line-clamp-2 group-hover:text-leather-accent transition-colors">
              "{msg.content}"
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

// --- Skeleton Fallbacks ---
function InboxSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-48 bg-leather-800/30 rounded-3xl border border-leather-700/20 animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

function SentSkeleton() {
  return (
    <div className="pt-6 border-t border-leather-600/20">
      <div className="h-4 w-32 bg-leather-800/30 rounded mb-4 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-24 bg-leather-900/30 rounded-xl border border-leather-700/20 animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

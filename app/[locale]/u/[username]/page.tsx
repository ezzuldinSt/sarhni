import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCachedSession } from "@/lib/auth-cached";
import { getCachedUserHeader, getCachedUserConfessions, getCachedUserMeta } from "@/lib/cache";
import ConfessionForm from "@/components/ConfessionForm";
import ShareLinkCard from "@/components/ShareLinkCard";
import { Card } from "@/components/ui/Card";
import Image from "next/image";
import ConfessionFeed from "@/components/ConfessionFeed";
import type { Metadata } from "next";

// ISR: Revalidate profile pages every 60 seconds
// This reduces database hits while keeping content reasonably fresh
// Cache is immediately invalidated via revalidateTag() on profile updates
export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const user = await getCachedUserMeta(username);

  if (!user) {
    return { title: "User Not Found - Sarhni" };
  }

  const description = user.bio || `Send a secret message to @${username}.`;

  return {
    title: `Confess to @${username} - Sarhni`,
    description,
    openGraph: {
      title: `Confess to @${username}`,
      description,
      siteName: "Sarhni",
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `Confess to @${username}`,
      description,
    },
  };
}

export default async function UserProfile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const session = await getCachedSession();

  const user = await getCachedUserHeader(username);
  if (!user) return notFound();

  const isOwner = session?.user?.id === user.id;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header Profile Card (renders immediately) */}
      <Card className="mb-8 text-center py-10 relative overflow-hidden">
         <div className="absolute inset-0 bg-leather-texture opacity-5 z-0" />
         <div className="relative z-10">
            <div className="w-avatar-3xl h-avatar-3xl mx-auto rounded-full border-4 border-leather-pop mb-4 overflow-hidden relative shadow-xl">
               <Image
                 src={user.image || "/placeholder-avatar.png"}
                 alt={`Profile picture of ${user.username}`}
                 fill
                 sizes="128px"
                 className="object-cover"
                 priority
                 placeholder="blur"
               />
            </div>
            <h1 className="text-page-title text-leather-accent mb-2">@{user.username}</h1>
            {user.bio && <p className="text-leather-accent/80 max-w-sm mx-auto italic">"{user.bio}"</p>}

            {/* Embedded Share Link (only for non-owner viewers) */}
            {!isOwner && <ShareLinkCard username={user.username} compact embedded />}
         </div>
      </Card>

      {/* Confession Form (renders immediately, only if NOT the owner) */}
      {!isOwner && (
         <ConfessionForm
           receiverId={user.id}
           usernamePath={user.username}
           user={session?.user}
         />
      )}

      {/* Confessions Feed (streams in via Suspense) */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-leather-accent ps-2 border-s-4 border-leather-pop mb-6">
          Confessions
        </h3>

        {/* OPTIMIZATION: Pass currentUserId to avoid duplicate auth() call */}
        <Suspense fallback={<ConfessionsSkeleton />}>
          <ProfileConfessions userId={user.id} username={user.username} isOwner={isOwner} currentUserId={session?.user?.id} />
        </Suspense>
      </div>
    </div>
  );
}

// --- Async component: streams confessions ---
// OPTIMIZATION: Accept currentUserId as prop to avoid duplicate auth() call
async function ProfileConfessions({ userId, username, isOwner, currentUserId }: { userId: string; username: string; isOwner: boolean; currentUserId?: string }) {
  const confessions = await getCachedUserConfessions(userId);

  return (
    <ConfessionFeed
      initialConfessions={confessions}
      userId={userId}
      username={username}
      isOwner={isOwner}
      currentUserId={currentUserId}
    />
  );
}

// --- Skeleton Fallback ---
function ConfessionsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-32 bg-leather-700/20 rounded-3xl" />
      ))}
    </div>
  );
}

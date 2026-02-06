"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ConfessionCard from "./ConfessionCard";
import { fetchConfessions } from "@/lib/actions/manage";
import { Loader2 } from "lucide-react";
import { ConfessionWithUser } from "@/lib/types";

interface ConfessionFeedProps {
  initialConfessions: ConfessionWithUser[];
  userId: string;
  isOwner: boolean;
  gridLayout?: boolean;
}

export default function ConfessionFeed({ initialConfessions, userId, isOwner, gridLayout = false }: ConfessionFeedProps) {
  const [confessions, setConfessions] = useState<ConfessionWithUser[]>(initialConfessions);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const offsetRef = useRef(initialConfessions.length);
  const existingIdsRef = useRef(new Set(initialConfessions.map(c => c.id)));

  const loaderRef = useRef<HTMLDivElement>(null);

  // Sync state when the server revalidates (e.g., after sending a message)
  useEffect(() => {
    setConfessions(initialConfessions);
    offsetRef.current = initialConfessions.length;
    existingIdsRef.current = new Set(initialConfessions.map(c => c.id));
    setHasMore(true);
  }, [initialConfessions]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);

    try {
      const newConfessions = await fetchConfessions(userId, offsetRef.current);

      if (newConfessions.length === 0) {
        setHasMore(false);
      } else {
        const uniqueNew = newConfessions.filter((c: any) => !existingIdsRef.current.has(c.id));
        uniqueNew.forEach((c: any) => existingIdsRef.current.add(c.id));
        offsetRef.current += uniqueNew.length;

        if (uniqueNew.length > 0) {
          setConfessions((prev) => [...prev, ...uniqueNew]);
        }
      }
    } catch (error) {
      console.error("Failed to load more confessions:", error);
      setHasMore(false);
    }

    setIsLoading(false);
  }, [hasMore, isLoading, userId]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.5 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore]);

  const listClassName = gridLayout
    ? "grid grid-cols-1 md:grid-cols-2 gap-4"
    : "space-y-6";

  return (
    <div>
      {/* 1. The List */}
      <div className={listClassName}>
        {confessions.map((confession: any, i: number) => (
          <ConfessionCard
            key={confession.id}
            confession={confession}
            index={i}
            isOwnerView={isOwner}
          />
        ))}
      </div>

      {/* 2. Empty State */}
      {confessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-leather-600/30 rounded-3xl bg-leather-800/10">
             <div className="w-16 h-16 bg-leather-800 rounded-full flex items-center justify-center mb-4 text-3xl">
               👻
             </div>
             <h3 className="text-xl font-bold text-leather-accent mb-2">
               {isOwner ? "It's quiet... too quiet." : "No confessions yet!"}
             </h3>
             <p className="text-leather-500 max-w-xs mx-auto">
               {isOwner
                 ? "Share your profile link to start receiving mysterious messages."
                 : "Be the first to break the silence. Send a confession now!"
               }
             </p>
          </div>
      )}

      {/* 3. Loading Indicator */}
      {hasMore && confessions.length > 0 && (
        <div ref={loaderRef} className="py-8 flex justify-center w-full">
           {isLoading ? (
             <Loader2 className="animate-spin text-leather-pop" />
           ) : (
             <div className="h-4 w-full" />
           )}
        </div>
      )}

      {/* 4. End of List */}
      {!hasMore && confessions.length > 0 && (
        <p className="text-center text-xs text-leather-500 py-4 uppercase tracking-widest">
          You have reached the end of the void
        </p>
      )}
    </div>
  );
}

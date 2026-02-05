"use client";

import { useState, useEffect, useRef } from "react";
import ConfessionCard from "./ConfessionCard";
import { fetchConfessions } from "@/lib/actions/manage";
import { Loader2 } from "lucide-react";
import { ConfessionWithUser } from "@/lib/types";

interface ConfessionFeedProps {
  initialConfessions: ConfessionWithUser[];
  userId: string;
  isOwner: boolean;
}

export default function ConfessionFeed({ initialConfessions, userId, isOwner }: ConfessionFeedProps) {
  const [confessions, setConfessions] = useState<ConfessionWithUser[]>(initialConfessions);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const offsetRef = useRef(initialConfessions.length);

  const loaderRef = useRef<HTMLDivElement>(null);

  // FIX: Sync state when the server revalidates (e.g., after sending a message)
  useEffect(() => {
    setConfessions(initialConfessions);
    offsetRef.current = initialConfessions.length;
    setHasMore(true);
  }, [initialConfessions]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoading && confessions.length > 0) {
          setIsLoading(true);
          
          const newConfessions = await fetchConfessions(userId, offsetRef.current);

          if (newConfessions.length === 0) {
            setHasMore(false);
          } else {
            offsetRef.current += newConfessions.length;
            setConfessions((prev) => {
                const existingIds = new Set(prev.map(c => c.id));
                const uniqueNew = newConfessions.filter((c: any) => !existingIds.has(c.id));
                return [...prev, ...uniqueNew];
            });
          }
          
          setIsLoading(false);
        }
      },
      { threshold: 1.0 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, userId, confessions]);

  return (
    <div className="space-y-6">
      {/* 1. The List */}
      {confessions.map((confession: any, i: number) => (
        <ConfessionCard 
          key={confession.id} 
          confession={confession} 
          index={i}
          isOwnerView={isOwner} 
        />
      ))}

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

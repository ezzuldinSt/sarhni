"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ConfessionCard from "./ConfessionCard";
import { fetchConfessions } from "@/lib/actions/manage";
import { Loader2 } from "lucide-react";
import { ConfessionWithUser } from "@/lib/types";
import { EmptyInbox } from "./ui/EmptyState";

interface ConfessionFeedProps {
  initialConfessions: ConfessionWithUser[];
  userId: string;
  isOwner: boolean;
  gridLayout?: boolean;
  username?: string;
  currentUserId?: string;
}

export default function ConfessionFeed({ initialConfessions, userId, isOwner, gridLayout = false, username, currentUserId }: ConfessionFeedProps) {
  const [confessions, setConfessions] = useState<ConfessionWithUser[]>(initialConfessions);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const offsetRef = useRef(initialConfessions.length);
  const existingIdsRef = useRef(new Set(initialConfessions.map(c => c.id)));
  const [isMounted, setIsMounted] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fix hydration issue by ensuring window is accessed only after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const loaderRef = useRef<HTMLDivElement>(null);

  // Cancel any in-flight requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Sync state when the server revalidates (e.g., after sending a message)
  useEffect(() => {
    setConfessions(initialConfessions);
    offsetRef.current = initialConfessions.length;
    existingIdsRef.current = new Set(initialConfessions.map(c => c.id));
    setHasMore(true);
  }, [initialConfessions]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setError(null);

    try {
      const newConfessions = await fetchConfessions(userId, offsetRef.current, abortController.signal);

      // Check if request was aborted
      if (abortController.signal.aborted) {
        return;
      }

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
    } catch (err) {
      // Don't show error if request was aborted (component unmounted)
      if (abortController.signal.aborted) {
        return;
      }
      setError("Failed to load more messages. Please try again.");
      setHasMore(false);
    } finally {
      // Only clear loading if this wasn't aborted
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
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

  const handleShareProfile = () => {
    if (typeof window !== "undefined" && username) {
      const url = `${window.location.origin}/u/${username}`;
      navigator.clipboard.writeText(url);
      // You could add a toast notification here
    }
  };

  const listClassName = gridLayout
    ? "grid grid-cols-1 md:grid-cols-2 gap-4"
    : "space-y-6";

  // Determine if this is a sent view (based on URL or prop)
  // Use state to avoid hydration mismatch
  const [isSentView, setIsSentView] = useState(false);
  useEffect(() => {
    setIsSentView(window.location.pathname === "/dashboard/sent");
  }, []);

  return (
    <section aria-label="Confessions feed">
      {/* 1. The List */}
      <div className={listClassName}>
        {confessions.map((confession: any, i: number) => (
          <article key={confession.id}>
            <ConfessionCard
              confession={confession}
              index={i}
              isOwnerView={isOwner}
              isSentView={isSentView}
              currentUserId={currentUserId}
            />
          </article>
        ))}
      </div>

      {/* 2. Empty State */}
      {confessions.length === 0 && (
        <EmptyInbox isOwner={isOwner} onShare={handleShareProfile} />
      )}

      {/* 3. Error State */}
      {error && (
        <div className="py-8 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setHasMore(true);
              loadMore();
            }}
            className="px-4 py-2 bg-leather-700 hover:bg-leather-600 text-leather-accent rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4. Loading Indicator */}
      {hasMore && confessions.length > 0 && !error && (
        <div ref={loaderRef} className="py-8 flex justify-center w-full">
           {isLoading ? (
             <Loader2 className="animate-spin text-leather-pop" />
           ) : (
             <div className="h-4 w-full" />
           )}
        </div>
      )}

      {/* 5. End of List */}
      {!hasMore && confessions.length > 0 && !error && (
        <p className="text-center text-xs text-leather-500 py-4 uppercase tracking-widest">
          You have reached the end of the void
        </p>
      )}
    </section>
  );
}

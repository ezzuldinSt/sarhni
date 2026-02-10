"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, Loader2 } from "lucide-react";
import { searchUsers } from "@/lib/actions/search";
import { EmptySearchResults } from "./ui/EmptyState";
import { UserSearchResult } from "@/lib/types";

// We accept className so we can style it differently for Mobile vs Desktop
// onSelect is called when a user is selected (useful for closing mobile menu)
export default function UserSearch({ className, onSelect }: { className?: string; onSelect?: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce Search (Wait 300ms after typing stops before hitting DB)
  // OPTIMIZATION: Use requestId to prevent race conditions from parallel searches
  // OPTIMIZATION: Add AbortController for cleanup on unmount
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let currentRequestId = 0;
    let abortController: AbortController | null = null;

    const performSearch = async (requestId: number) => {
      if (query.length >= 2) {
        setIsLoading(true);
        setIsOpen(true);

        // Create abort controller for this request
        abortController = new AbortController();
        const signal = abortController.signal;

        try {
          const result = await searchUsers(query);

          // Only update state if this is still the latest request and wasn't aborted
          if (requestId === currentRequestId && !signal.aborted) {
            setResults(result.users);
            setIsRateLimited(result.rateLimited);
            setIsLoading(false);
          }
        } catch (error) {
          // Don't update state if request was aborted
          if (!signal.aborted) {
            console.error("Search error:", error);
            setIsLoading(false);
          }
        }
      } else {
        setResults([]);
        setIsRateLimited(false);
        setIsOpen(false);
        setIsLoading(false);
      }
    };

    timeoutId = setTimeout(() => {
      currentRequestId++;
      performSearch(currentRequestId);
    }, 300);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (abortController) abortController.abort();
    };
  }, [query]);

  const handleSelect = (username: string) => {
    setQuery("");
    setIsOpen(false);
    setIsRateLimited(false);
    router.push(`/u/${username}`);
    // Call onSelect callback if provided (e.g., to close mobile menu)
    onSelect?.();
  };

  return (
    <div ref={containerRef} className={`relative ${className || ""}`}>
        {/* Search Input */}
        <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-leather-500 group-focus-within:text-leather-pop transition-colors" aria-hidden="true" />
            <input
                type="text"
                inputMode="search"
                enterKeyHint="search"
                aria-label="Search users"
                placeholder="Find a soul..."
                className="w-full bg-leather-900 border border-leather-600/50 rounded-full py-2.5 pl-10 pr-10 text-sm text-leather-accent placeholder-leather-600 focus:outline-none focus:ring-2 focus:ring-leather-pop focus:border-leather-pop focus:ring-offset-2 focus:ring-offset-leather-900 transition-all"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.length >= 2 && setIsOpen(true)}
            />
            {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-4 h-4">
                  <Loader2 className="w-4 h-4 text-leather-pop animate-spin-fast" aria-hidden="true" />
                </div>
            )}
        </div>

        {/* Dropdown Results */}
        {isOpen && results.length > 0 && (
            <div className="absolute top-full mt-3 w-full bg-leather-800 border border-leather-600 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <div className="py-2">
                  {results.map((user) => (
                      <button
                          key={user.username}
                          onClick={() => handleSelect(user.username)}
                          className="w-full text-left px-4 py-3 hover:bg-leather-700 flex items-center gap-3 transition-colors group"
                      >
                          <div className="relative w-avatar-sm h-avatar-sm rounded-full overflow-hidden bg-leather-900 shrink-0 border border-leather-600 group-hover:border-leather-pop">
                              <Image
                                  src={user.image || "/placeholder-avatar.png"}
                                  alt={`${user.username}'s profile picture`}
                                  fill
                                  sizes="32px"
                                  className="object-cover"
                              />
                          </div>
                          <span className="text-sm font-bold text-leather-accent group-hover:text-white truncate">
                              {user.username}
                          </span>
                      </button>
                  ))}
                </div>
            </div>
        )}

        {/* No Results State */}
        {isOpen && results.length === 0 && query.length >= 2 && !isLoading && (
             <div className="absolute top-full mt-3 w-full bg-leather-800 border border-leather-600 rounded-2xl shadow-xl p-4 z-50">
                {isRateLimited ? (
                  <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                    <svg className="w-12 h-12 mb-3 text-leather-pop opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-leather-accent font-medium">Slow down, speed demon!</p>
                    <p className="text-xs text-leather-500 mt-1">You're searching too fast. Take a breath.</p>
                  </div>
                ) : (
                  <EmptySearchResults query={query} />
                )}
             </div>
        )}
    </div>
  );
}
